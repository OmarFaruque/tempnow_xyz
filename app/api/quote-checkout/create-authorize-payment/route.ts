import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings, quotes } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getSettings } from '@/lib/database';
import { sendEmail, createInsurancePolicyEmail } from '@/lib/email';
import { generateInvoicePdf } from '@/lib/invoice';
import { revalidatePath } from 'next/cache';

const AUTHORIZE_API_URL = 'https://api2.authorize.net/xml/v1/request.api';
const AUTHORIZE_SANDBOX_API_URL = 'https://apitest.authorize.net/xml/v1/request.api';

export async function POST(req: NextRequest) {
  try {
    const authorizeSettingsRecord = await db.select().from(settings).where(eq(settings.param, 'authorizenet')).limit(1);

    if (!authorizeSettingsRecord.length || !authorizeSettingsRecord[0].value) {
      return NextResponse.json({ success: false, details: 'Authorize.Net settings not found.' }, { status: 500 });
    }

    const authorizeSettings = JSON.parse(authorizeSettingsRecord[0].value);
    const {
      environment = 'sandbox',
      sandboxApiLoginId,
      sandboxTransactionKey,
      liveApiLoginId,
      liveTransactionKey,
    } = authorizeSettings;

    const isLive = environment === 'live';
    const apiLoginId = isLive ? liveApiLoginId : sandboxApiLoginId;
    const transactionKey = isLive ? liveTransactionKey : sandboxTransactionKey;

    if (!apiLoginId || !transactionKey) {
      return NextResponse.json({ success: false, details: `Authorize.Net ${isLive ? 'live' : 'sandbox'} credentials are not configured.` }, { status: 500 });
    }

    const { quoteData, user, opaqueData, flp_checksum } = await req.json();

    if (!quoteData || !quoteData.id || !user || !opaqueData) {
      return NextResponse.json({ success: false, details: 'Missing required payment information.' }, { status: 400 });
    }

    const amount = Number(quoteData.total || 0);
    if (amount <= 0) {
      return NextResponse.json({ success: false, details: 'Payment amount must be positive.' }, { status: 400 });
    }

    if (!opaqueData.dataDescriptor || !opaqueData.dataValue) {
      return NextResponse.json({ success: false, details: 'Invalid payment token.' }, { status: 400 });
    }

    try {
      const fraudSettings = await getSettings('fraudLabsPro');
      const apiKey = fraudSettings?.apiKey;
      if (apiKey && fraudSettings.enabled && quoteData) {
        const isPrivateIp = (ip?: string) => {
          if (!ip) return true;
          if (ip === '::1' || ip === '127.0.0.1') return true;
          if (/^10\./.test(ip)) return true;
          if (/^192\.168\./.test(ip)) return true;
          if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
          if (/^fc00:/i.test(ip) || /^fe80:/i.test(ip)) return true;
          return false;
        };

        let ip = '';
        const xff = req.headers.get('x-forwarded-for');
        if (xff) {
          const extractedIp = xff.split(',')[0].trim();
          if (extractedIp && !isPrivateIp(extractedIp)) ip = extractedIp;
        }

        const ua = req.headers.get('user-agent');
        const billingAddress = quoteData?.customerData?.address;
        const postcode = quoteData?.customerData?.post_code ?? quoteData?.customerData?.postcode ?? quoteData?.customerData?.postCode;
        const phone = quoteData?.customerData?.phoneNumber ?? quoteData?.customerData?.phone;

        const fraudlabsproParams = new URLSearchParams();
        fraudlabsproParams.set('key', apiKey);
        fraudlabsproParams.set('format', 'json');
        if (flp_checksum) fraudlabsproParams.set('flp_checksum', flp_checksum);
        if (ip) fraudlabsproParams.set('ip', ip);

        fraudlabsproParams.set('user_order_id', String(quoteData.id));
        fraudlabsproParams.set('user_order_memo', `Quote for ${quoteData.customerData?.firstName} ${quoteData.customerData?.lastName} - ${quoteData.id}`);
        fraudlabsproParams.set('currency', quoteData?.currency || 'GBP');
        fraudlabsproParams.set('amount', String(quoteData.total || 0));
        fraudlabsproParams.set('quantity', '1');
        fraudlabsproParams.set('payment_gateway', 'authorizenet');
        fraudlabsproParams.set('payment_mode', 'creditcard');
        fraudlabsproParams.set('first_name', quoteData.customerData?.firstName as string);
        fraudlabsproParams.set('last_name', quoteData.customerData?.lastName as string);
        fraudlabsproParams.set('email', user.email);
        if (phone) fraudlabsproParams.set('user_phone', phone);
        if (billingAddress) fraudlabsproParams.set('bill_addr', billingAddress);
        if (quoteData.customerData?.city) fraudlabsproParams.set('bill_city', quoteData.customerData?.city);
        if (quoteData.customerData?.state) fraudlabsproParams.set('bill_state', quoteData.customerData?.state);
        if (postcode) fraudlabsproParams.set('bill_zip_code', postcode);
        fraudlabsproParams.set('bill_country', quoteData.customerData?.country || 'GB');
        if (ua) fraudlabsproParams.set('user_agent', ua);
        fraudlabsproParams.set('transaction_id', String(quoteData.id));

        const fraudRes = await fetch('https://api.fraudlabspro.com/v2/order/screen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: fraudlabsproParams.toString(),
        });

        const raw = await fraudRes.json().catch(() => null);
        const providerError = !fraudRes.ok || (raw && (raw.error || raw.error_message || raw.error_code));

        let score: number | null = null;
        if (raw) {
          score = raw.fraudlabspro_score ?? raw.risk_score ?? raw.score ?? null;
          if (typeof score === 'string') {
            const n = Number(score);
            if (!Number.isNaN(n)) score = n;
          }
        }

        const blockThreshold = fraudSettings?.blockThreshold ?? 80;
        const warnThreshold = fraudSettings?.warnThreshold ?? 60;
        const explicitFraud = raw && (raw.is_fraud === true || raw.is_highrisk === true || raw.is_flagged === true);

        let action: 'block' | 'warn' | 'allow' | 'error' = 'allow';
        if (providerError) action = 'error';
        else if (explicitFraud) action = 'block';
        else if (typeof score === 'number') {
          if (score >= blockThreshold) action = 'block';
          else if (score >= warnThreshold) action = 'warn';
        }

        await db.update(quotes).set({
          fraudStatus: action === 'allow' ? 'ok' : action,
          fraudScore: score ?? undefined,
          fraudDetails: raw ?? undefined,
          fraudCheckedAt: new Date().toISOString(),
        }).where(eq(quotes.id, quoteData.id));

        const failOpen = fraudSettings?.failOpen !== undefined ? !!fraudSettings.failOpen : true;
        if (action === 'block' || (action === 'error' && !failOpen)) {
          return NextResponse.json({ success: false, details: 'Transaction blocked due to suspected fraud.' }, { status: 403 });
        }
      }
    } catch (fErr) {
      console.error('Fraud check failed for Authorize.Net:', fErr);
    }

    const generalSettings = await getSettings('general');
    const siteName = generalSettings?.siteName || 'TEMPNOW';
    const currency = (generalSettings?.currency || 'GBP').toUpperCase();

    const payload = {
      createTransactionRequest: {
        merchantAuthentication: {
          name: apiLoginId,
          transactionKey,
        },
        refId: String(quoteData.id),
        transactionRequest: {
          transactionType: 'authCaptureTransaction',
          amount: amount.toFixed(2),
          payment: {
            opaqueData: {
              dataDescriptor: opaqueData.dataDescriptor,
              dataValue: opaqueData.dataValue,
            },
          },
          order: {
            invoiceNumber: String(quoteData.id),
            description: `${siteName} Docs: Policy ${quoteData.id}`,
          },
          customer: {
            email: user.email,
          },
          billTo: {
            firstName: quoteData.customerData?.firstName || user.firstName || '',
            lastName: quoteData.customerData?.lastName || user.lastName || '',
            address: quoteData.customerData?.address || '',
            city: quoteData.customerData?.city || '',
            state: quoteData.customerData?.state || '',
            zip: quoteData.customerData?.post_code || quoteData.customerData?.postcode || '',
            country: quoteData.customerData?.country || 'GB',
          },
        },
      },
    };

    const gatewayResponse = await fetch(isLive ? AUTHORIZE_API_URL : AUTHORIZE_SANDBOX_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const gatewayData = await gatewayResponse.json();
    const transactionResponse = gatewayData?.transactionResponse;
    const responseCode = transactionResponse?.responseCode;
    const isSuccess = gatewayData?.messages?.resultCode === 'Ok' && responseCode === '1';

    if (!isSuccess) {
      const errorText = transactionResponse?.errors?.[0]?.errorText || gatewayData?.messages?.message?.[0]?.text || 'Authorize.Net payment failed.';
      return NextResponse.json({ success: false, details: errorText }, { status: 400 });
    }

    const transactionId = transactionResponse?.transId;

    await db.update(quotes).set({
      paymentStatus: 'paid',
      status: 'completed',
      userId: user.id,
      spaymentId: transactionId,
      paymentMethod: 'authorizenet',
      paymentIntentId: transactionId,
      paymentDate: new Date().toISOString(),
      mailSent: true,
      updatedAt: new Date().toISOString(),
    }).where(eq(quotes.id, quoteData.id));

    revalidatePath('/api/quotes');
    revalidatePath('/administrator');
    revalidatePath('/api/admin/quotes');

    const quoteRecord = await db.select().from(quotes).where(eq(quotes.id, quoteData.id)).limit(1);
    if (!quoteRecord.length) throw new Error('Quote not found after update');

    const quote = quoteRecord[0];
    const effectivePrice = (quote.updatePrice && quote.updatePrice !== 'false') ? quote.updatePrice : quote.cpw;
    const finalAmount = parseFloat(effectivePrice || quoteData.total);

    const pdfBytes = await generateInvoicePdf({ ...quoteData, total: finalAmount, paymentDate: quote.paymentDate }, user, quote.policyNumber, siteName);

    const vehicle = quoteData.customerData.vehicle;
    const emailHtml = await createInsurancePolicyEmail(
      user.firstName || '',
      user.lastName || '',
      quote.policyNumber,
      quote.regNumber || '',
      vehicle.make,
      vehicle.model,
      vehicle.year,
      quoteData.startTime,
      quoteData.expiryTime,
      finalAmount,
      `${process.env.NEXT_PUBLIC_BASE_URL}/order/details?number=${quote.policyNumber}`,
      quoteData.coverReason || 'N/A',
    );

    await sendEmail({
      to: user.email,
      subject: emailHtml.subject,
      html: emailHtml.html,
      attachments: [{ filename: `invoice-${quote.policyNumber}.pdf`, content: Buffer.from(pdfBytes) }],
    });

    return NextResponse.json({ success: true, transactionId, currency });
  } catch (error: any) {
    console.error('Authorize.Net payment error:', error);
    return NextResponse.json({ success: false, details: error?.message || 'An unexpected error occurred during payment.' }, { status: 500 });
  }
}