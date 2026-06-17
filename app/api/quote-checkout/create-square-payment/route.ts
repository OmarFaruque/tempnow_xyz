import { NextRequest, NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { settings, quotes } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getSettings } from '@/lib/database';
import { sendEmail, createInsurancePolicyEmail } from '@/lib/email';
import { generateInvoicePdf } from '@/lib/invoice';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  // Store original toJSON if it exists to avoid side-effects
  const originalToJSON = (BigInt.prototype as any).toJSON;

  try {
    // Temporarily modify BigInt serialization to Number for this request
    (BigInt.prototype as any).toJSON = function () {
      return Number(this);
    };

    const squareSettingsRecord = await db.select().from(settings).where(eq(settings.param, 'square'));

    if (squareSettingsRecord.length === 0 || !squareSettingsRecord[0].value) {
      return NextResponse.json({ success: false, details: 'Square settings not found.' }, { status: 500 });
    }

    const squareSettings = JSON.parse(squareSettingsRecord[0].value);
    const { accessToken, appLocationId, environment } = squareSettings;

    if (!accessToken || !appLocationId) {
      return NextResponse.json({ success: false, details: 'Square access token or location ID is not configured.' }, { status: 500 });
    }

    const squareClient = new SquareClient({
      environment: environment === 'sandbox' ? SquareEnvironment.Sandbox : SquareEnvironment.Production,
      token: accessToken,
    });

    const { sourceId, quoteData, user, flp_checksum } = await req.json();


    if (!sourceId || !quoteData || !user || !quoteData.id) {
      return NextResponse.json({ success: false, details: "Missing required payment information or quote ID." }, { status: 400 });
    }

    const amount = quoteData.total || 0;
    if (amount <= 0) {
      return NextResponse.json({ success: false, details: "Payment amount must be positive." }, { status: 400 });
    }

    const totalAmount = BigInt(Math.round(amount * 100));

    // Run FraudLabsPro check before charging
    try {
      const fraudSettings = await getSettings("fraudLabsPro");
      const apiKey = fraudSettings?.apiKey;
      if (apiKey && fraudSettings.enabled && quoteData) {
        // IP handling logic needs to be moved up before flp.validate()
        const isPrivateIp = (ip?: string) => {
          if (!ip) return true;
          if (ip === '::1' || ip === '127.0.0.1') return true;
          if (/^10\./.test(ip)) return true;
          if (/^192\.168\./.test(ip)) return true;
          if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
          if (/^fc00:/i.test(ip) || /^fe80:/i.test(ip)) return true;
          return false;
        }
        let ip = '';
        const xff = req.headers.get("x-forwarded-for");
        if (xff) {
          const extractedIp = xff.split(",")[0].trim();
          if (extractedIp && !isPrivateIp(extractedIp)) ip = extractedIp;
        }
        const ua = req.headers.get('user-agent');

        const billingAddress = quoteData?.customerData?.address;
        const postcode = quoteData?.customerData?.post_code ?? quoteData?.customerData?.postcode ?? (quoteData?.customerData as any)?.postCode;
        const phone = quoteData?.customerData?.phoneNumber ?? (quoteData?.customerData as any)?.phone;

        // Need to fetch siteName for product_name
        const generalSettings = await db.query.settings.findFirst({
            where: eq(settings.param, 'general')
        });
        const siteNameFraud = generalSettings && generalSettings.value ? JSON.parse(generalSettings.value).siteName || "" : "";


        const fraudlabsproParams = new URLSearchParams();
        fraudlabsproParams.set("key", apiKey);
        fraudlabsproParams.set("format", "json");

        if (flp_checksum) fraudlabsproParams.set("flp_checksum", flp_checksum);
        if (ip) fraudlabsproParams.set("ip", ip);
        fraudlabsproParams.set("user_order_id", String(quoteData.id));
        fraudlabsproParams.set("user_order_memo", `Quote for ${quoteData.customerData?.firstName} ${quoteData.customerData?.lastName} - ${quoteData.id}`);
        fraudlabsproParams.set("currency", (quoteData as any)?.currency || "GBP");
        fraudlabsproParams.set("amount", String(quoteData.total || 0));
        fraudlabsproParams.set("quantity", "1");
        fraudlabsproParams.set("payment_gateway", 'square');
        fraudlabsproParams.set("payment_mode", 'creditcard');
        fraudlabsproParams.set("first_name", quoteData.customerData?.firstName as string);
        fraudlabsproParams.set("last_name", quoteData.customerData?.lastName as string);
        fraudlabsproParams.set("email", user.email);
        if (phone) fraudlabsproParams.set("user_phone", phone);
        if (billingAddress) fraudlabsproParams.set("bill_addr", billingAddress);
        if (quoteData.customerData?.city) fraudlabsproParams.set("bill_city", quoteData.customerData?.city);
        if (quoteData.customerData?.state) fraudlabsproParams.set("bill_state", quoteData.customerData?.state);
        if (postcode) fraudlabsproParams.set("bill_zip_code", postcode);
        fraudlabsproParams.set("bill_country", quoteData.customerData?.country || 'GB');
        fraudlabsproParams.set("ship_first_name", quoteData.customerData?.firstName as string);
        fraudlabsproParams.set("ship_last_name", quoteData.customerData?.lastName as string);
        if (billingAddress) fraudlabsproParams.set("ship_addr", billingAddress);
        if (quoteData.customerData?.city) fraudlabsproParams.set("ship_city", quoteData.customerData?.city);
        if (quoteData.customerData?.state) fraudlabsproParams.set("ship_state", quoteData.customerData?.state);
        if (postcode) fraudlabsproParams.set("ship_zip_code", postcode);
        fraudlabsproParams.set("ship_country", quoteData.customerData?.country || 'GB');
        if (ua) fraudlabsproParams.set("user_agent", ua);
        fraudlabsproParams.set("transaction_id", String(quoteData.id));

        if (quoteData.promoCode) {
            fraudlabsproParams.set("promo_code", quoteData.promoCode);
        }

        const url = `https://api.fraudlabspro.com/v2/order/screen`;

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: fraudlabsproParams.toString(),
        });

        

        const raw = await res.json().catch(() => null);

        const providerError = !res.ok || (raw && (raw.error || raw.error_message || raw.error_code));

        let score: number | null = null;
        if (raw) {
          score = raw.fraudlabspro_score ?? raw.risk_score ?? raw.score ?? null;
          if (typeof score === "string") {
            const n = Number(score);
            if (!Number.isNaN(n)) score = n;
          }
        }

        

        const blockThreshold = fraudSettings?.blockThreshold ?? 80;
        const warnThreshold = fraudSettings?.warnThreshold ?? 60;
        const explicitFraud = raw && (raw.is_fraud === true || raw.is_highrisk === true || raw.is_flagged === true);

        let action: "block" | "warn" | "allow" | "error" = "allow";
        if (providerError) {
          action = "error";
        } else if (explicitFraud) action = "block";
        else if (typeof score === "number") {
          if (score >= blockThreshold) action = "block";
          else if (score >= warnThreshold) action = "warn";
          else action = "allow";
        }

        await db.update(quotes).set({
          fraudStatus: action === "allow" ? "ok" : action,
          fraudScore: score ?? undefined,
          fraudDetails: raw ?? undefined,
          fraudCheckedAt: new Date().toISOString(),
        }).where(eq(quotes.id, quoteData.id));

        const failOpen = fraudSettings?.failOpen !== undefined ? !!fraudSettings.failOpen : true;
        if (action === "block" || (action === "error" && !failOpen)) {
          return NextResponse.json({ success: false, details: "Transaction blocked due to suspected fraud." }, { status: 403 });
        }
      }
    } catch (fErr) {
      console.error('Fraud check failed for Square:', fErr);
    }
    
    // Fetch site name and currency from settings
    const generalSettings = await db.query.settings.findFirst({
      where: eq(settings.param, 'general')
    });
    let siteName = "";
    let currency = "GBP"; // Default currency
    if (generalSettings && generalSettings.value) {
      const parsedSettings = JSON.parse(generalSettings.value);
      siteName = parsedSettings.siteName || "TEMPNOW";
      currency = parsedSettings.currency || "GBP";
    }

    const paymentResult = await squareClient.payments.create({
        sourceId,
        idempotencyKey: randomUUID(),
        locationId: appLocationId,
        amountMoney: {
            amount: totalAmount,
            currency: currency,
        },
        note: `${siteName} Docs: Policy ${quoteData.id}`,
    });
    
    if (paymentResult.payment) {
      // Update database
      await db.update(quotes).set({
        paymentStatus: 'paid',
        status: 'completed',
        userId: user.id,
        spaymentId: paymentResult.payment.id,
        paymentMethod: 'square',
        paymentDate: new Date().toISOString(),
        mailSent: true,
        updatedAt: new Date().toISOString()
      }).where(eq(quotes.id, quoteData.id));

      revalidatePath('/api/quotes');
      revalidatePath('/administrator');
      revalidatePath('/api/admin/quotes');

      // Fetch the updated quote to get the policy number
      const quoteRecord = await db.select().from(quotes).where(eq(quotes.id, quoteData.id)).limit(1);
      if (!quoteRecord.length) {
        throw new Error('Quote not found after update');
      }
      const quote = quoteRecord[0];

      // Use the stored discounted price, fallback to original price (cpw)
      const effectivePrice = (quote.updatePrice && quote.updatePrice !== 'false') ? quote.updatePrice : quote.cpw;
      const finalAmount = parseFloat(effectivePrice || quoteData.total);

      // Generate invoice
      const pdfBytes = await generateInvoicePdf({ ...quoteData, total: finalAmount, paymentDate: quote.paymentDate }, user, quote.policyNumber, siteName);

      // Send confirmation email
      const vehicle = quoteData.customerData.vehicle;
      
      const emailHtml = await createInsurancePolicyEmail(
        user.firstName || '',
        user.lastName || '',
        quote.policyNumber,
        quote.regNumber || '', // Use quote.regNumber from the database
        vehicle.make,
        vehicle.model,
        vehicle.year,
        quoteData.startTime,
        quoteData.expiryTime,
        finalAmount,
        `${process.env.NEXT_PUBLIC_BASE_URL}/order/details?number=${quote.policyNumber}`,
        quoteData.coverReason || 'N/A'
      );

      await sendEmail({
        to: user.email,
        subject: emailHtml.subject,
        html: emailHtml.html,
        attachments: [
          {
            filename: `invoice-${quote.policyNumber}.pdf`,
            content: Buffer.from(pdfBytes),
          },
        ],
      });
    }

    return NextResponse.json({ success: true, payment: paymentResult.payment });
  } catch (error: any) {
    console.error('Square payment error:', error);
    const errorMessage = error?.errors?.[0]?.detail || "An unexpected error occurred during payment.";
    return NextResponse.json({ success: false, details: errorMessage }, { status: 500 });
  } finally {
    // Restore original toJSON to prevent side-effects
    (BigInt.prototype as any).toJSON = originalToJSON;
  }
}
