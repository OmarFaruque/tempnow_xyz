import { NextRequest, NextResponse } from "next/server";
import { getMollieClient } from "@/lib/mollie";
import { getPaddleInstance, getPaddleApiKey, getPaddleEnvironment, getPaddleProductId, updatePaddleProductId } from "@/lib/paddle";
import { getVivaClient } from "@/lib/viva";
import { getLemonSqueezySettings } from "@/lib/lemonsqueezy";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from 'uuid';
import { settings, aiDocuments, quotes } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSettings } from "@/lib/database";
import { parseSettingsValue } from "@/lib/utils";

type PaypalConfig = {
  environment: 'sandbox' | 'live';
  sandboxClientId?: string;
  sandboxSecret?: string;
  liveClientId?: string;
  liveSecret?: string;
};

type CheckoutComConfig = {
  environment: 'sandbox' | 'live';
  sandboxSecretKey?: string;
  liveSecretKey?: string;
};

async function getPayPalAccessToken(config: PaypalConfig) {
  const isLive = config.environment === 'live';
  const clientId = isLive ? config.liveClientId : config.sandboxClientId;
  const secret = isLive ? config.liveSecret : config.sandboxSecret;

  if (!clientId || !secret) {
    throw new Error(`PayPal ${isLive ? 'live' : 'sandbox'} credentials are missing.`);
  }

  const baseUrl = isLive ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const basicAuth = Buffer.from(`${clientId}:${secret}`).toString('base64');

  const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Failed to authenticate with PayPal: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  return { accessToken: tokenData.access_token as string, baseUrl };
}

function getCheckoutComCredentials(config: CheckoutComConfig) {
  const isLive = config.environment === 'live';
  const secretKey = isLive ? config.liveSecretKey : config.sandboxSecretKey;

  if (!secretKey) {
    throw new Error(`Checkout.com ${isLive ? 'live' : 'sandbox'} secret key is missing.`);
  }

  return {
    apiUrl: isLive ? 'https://api.checkout.com' : 'https://api.sandbox.checkout.com',
    secretKey,
  };
}



export async function POST(req: NextRequest) {
  const { quoteData, docData, user, tip, discount, flp_checksum } = await req.json();

  if (!user) {
    return NextResponse.json({ error: "User data is required." }, { status: 400 });
  }

  const paymentSettings = await db.query.settings.findFirst({
    where: eq(settings.param, 'payment'),
  });
  const paymentConfig = parseSettingsValue(paymentSettings?.value);
  const activeProvider = paymentConfig.activeProcessor || 'stripe';

  const generalSettings = await getSettings('general');
  const siteName = generalSettings?.siteName || "";
  const currencyCode = (generalSettings?.currency || 'GBP').toUpperCase();

  let amountForProvider: number;
  let description: string;
  let metadata: object;
  let redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/payment-confirmation`;

  if (docData) {
    const amountValue = docData.price + (tip || 0) - (discount || 0);
    amountForProvider = amountValue;
    const isImagePurchase =
      typeof docData.prompt === "string" &&
      docData.prompt.startsWith("AI image:");
    description = `${siteName} AI Document: ${docData.prompt.substring(0, 50)}...`;
    
    const newDocument = await db.insert(aiDocuments).values({
      uuid: uuidv4(),
      prompt: docData.prompt,
      content: docData.content,
      email: user.email,
      userId: user.id,
      status: 'pending',
      amount: amountForProvider.toFixed(2),
      currency: currencyCode,
    }).returning({ id: aiDocuments.id, uuid: aiDocuments.uuid });

    metadata = { type: 'ai-document', documentId: newDocument[0].id };
    redirectUrl = isImagePurchase
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/ai-documents?payment=success&type=image&document=${newDocument[0].uuid}`
      : `${process.env.NEXT_PUBLIC_BASE_URL}/ai-payment-confirmation`;

  } else if (quoteData && quoteData.id) {
    const existingQuote = await db.query.quotes.findFirst({
      where: eq(quotes.id, quoteData.id),
    });

    if (!existingQuote) {
      return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    }

    // Use the secure price from the database, ignoring client-sent total
    amountForProvider = parseFloat(existingQuote.updatePrice || existingQuote.cpw || "0");
    description = `${siteName} Docs: ${existingQuote.policyNumber}`;
    metadata = { type: 'quote', policyNumber: existingQuote.policyNumber };
    
  } else {
    return NextResponse.json({ error: "No document or valid quote data provided." }, { status: 400 });
  }

  // Run fraud check for quotes
  if (quoteData) {
    try {
      const fraudSettings = await getSettings("fraudLabsPro");
      const apiKey = fraudSettings?.apiKey;
      if (apiKey && fraudSettings.enabled) {
        const params = new URLSearchParams();
        params.set("key", apiKey);
        if (user?.email) params.set("email", user.email);
        if (quoteData?.customerData?.firstName) params.set("first_name", quoteData.customerData.firstName as string);
        if (quoteData?.customerData?.lastName) params.set("last_name", quoteData.customerData.lastName as string);
        if (amountForProvider) params.set("amount", String(amountForProvider.toFixed(2)));
        if (flp_checksum) params.set('flp_checksum', flp_checksum);
        if (quoteData?.id) params.set('order_id', String(quoteData.id));
        const currency = (quoteData as any)?.currency || currencyCode;
        if (currency) params.set('currency', currency);
        const billingAddress = quoteData?.customerData?.address;
        const postcode = quoteData?.customerData?.post_code ?? quoteData?.customerData?.postcode ?? (quoteData?.customerData as any)?.postCode;
        const phone = quoteData?.customerData?.phoneNumber ?? (quoteData?.customerData as any)?.phone;
        if (user.id) params.set('customer_id', user.id);
        if (quoteData.customerData?.firstName && quoteData.customerData?.lastName) {
            params.set('billing_name', `${quoteData.customerData.firstName} ${quoteData.customerData.lastName}`);
            params.set('shipping_name', `${quoteData.customerData.firstName} ${quoteData.customerData.lastName}`);
        }
        if (user.email) params.set('billing_email', user.email);
        if (billingAddress) {
            params.set('billing_address', billingAddress as string);
            params.set('shipping_address', billingAddress as string);
        }
        if (postcode) {
            params.set('billing_postcode', postcode as string);
            params.set('shipping_postcode', postcode as string);
        }
        if (phone) {
            params.set('billing_phone', phone as string);
            params.set('shipping_phone', phone as string);
        }
        if (quoteData.id) params.set('product_id', String(quoteData.id));
        params.set('product_name', `${siteName} Docs: Docs ${quoteData.id}`);
        params.set('product_quantity', '1');
        if (amountForProvider) params.set('product_price', String(amountForProvider.toFixed(2)));
        if (quoteData.promoCode) params.set('promo_code', quoteData.promoCode);
        if (quoteData.id) params.set('transaction_id', String(quoteData.id));
        const ua = req.headers.get('user-agent');
        if (ua) params.set('user_agent', ua);
        const isPrivateIp = (ip?: string) => {
          if (!ip) return true;
          if (ip === "::1" || ip === "127.0.0.1") return true;
          if (/^10\./.test(ip)) return true;
          if (/^192\.168\./.test(ip)) return true;
          if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
          if (/^fc00:/i.test(ip) || /^fe80:/i.test(ip)) return true;
          return false;
        }
        const xff = req.headers.get("x-forwarded-for");
        if (xff) {
          const ip = xff.split(",")[0].trim();
          if (ip && !isPrivateIp(ip)) params.set("ip", ip);
        }
        params.set("format", "json");
        const url = `https://api.fraudlabspro.com/v2/order/screen`;
        const fraudRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });
        const raw = await fraudRes.json().catch(() => null);
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
        const providerError = !fraudRes.ok || (raw && (raw.error || raw.error_message || raw.error_code));
        let action: "block" | "warn" | "allow" | "error" = "allow";
        if (providerError) action = "error";
        else if (explicitFraud) action = "block";
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
          return NextResponse.json({ error: "Transaction blocked due to suspected fraud." }, { status: 403 });
        }
      }
    } catch (fraudErr) {
      console.error("Fraud check failed:", fraudErr);
    }
  }

  if (activeProvider === 'mollie') {
    try {
      const mollie = await getMollieClient();
      const payment = await mollie.payments.create({
        amount: {
          currency: currencyCode,
          value: amountForProvider.toFixed(2),
        },
        description: description,
        redirectUrl: redirectUrl,
        webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mollie-webhook`,
        metadata: metadata,
      });
      return NextResponse.json({ checkoutUrl: payment.getCheckoutUrl() });
    } catch (error) {
      console.error("Mollie payment creation failed:", error);
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return NextResponse.json({ error: "Failed to create Mollie payment.", details: errorMessage }, { status: 500 });
    }
  } else if (activeProvider === 'paddle') {
    try {
        const paddle = await getPaddleInstance();
        const apiKey = await getPaddleApiKey();
        const environment = await getPaddleEnvironment();
        const paddleApiUrl = environment === 'production'
          ? 'https://api.paddle.com'
          : 'https://sandbox-api.paddle.com';
        let product;
        const productId = await getPaddleProductId();
        if (productId) {
            const productResponse = await fetch(`${paddleApiUrl}/products/${productId}`, {
                headers: { "Authorization": `Bearer ${apiKey}` },
            });
            if (productResponse.ok) {
                const productData = await productResponse.json();
                product = productData.data;
            }
        }
        if (!product) {
          const createProductResponse = await fetch(`${paddleApiUrl}/products`, {
            method: 'POST',
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              name: docData ? `${siteName} AI Docs` : `${siteName} Docs`,
              tax_category: "standard",
            }),
          });
          const createProductData = await createProductResponse.json();
          product = createProductData.data;
          await updatePaddleProductId(product.id);
        }
        const custom_data = docData ? { doc_details: JSON.stringify(docData), user_details: JSON.stringify(user) } : { quote_details: JSON.stringify(quoteData), user_details: JSON.stringify(user) };
        const createPriceResponse = await fetch(`${paddleApiUrl}/prices`, {
          method: 'POST',
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: product.id,
            description: description,
            billing_cycle: null,
            trial_period: null,
            tax_mode: "account_setting",
            unit_price: {
              amount: Math.round(amountForProvider * 100).toString(),
              currency_code: currencyCode,
            },
            custom_data: custom_data,
          }),
        });
        const createPriceData = await createPriceResponse.json();
        const price = createPriceData.data;
        if (price.id) {
          return NextResponse.json({ priceId: price.id, customer: user });
        } else {
          console.error("Paddle price ID not found in price:", price);
          return NextResponse.json({ error: "Failed to create Paddle price." }, { status: 500 });
        }
    } catch (error) {
        console.error("Paddle transaction creation failed:", error);
        let errorMessage = "An unknown error occurred";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null && 'detail' in error) {
          errorMessage = (error as any).detail;
        }
        return NextResponse.json({ error: "Failed to create Paddle transaction.", details: errorMessage }, { status: 500 });
    }
  } else if (activeProvider === 'viva') {
    try {
      const viva = await getVivaClient();
      const order = await viva.createOrder(
        amountForProvider,
        JSON.stringify(metadata),
        user.email,
        `${user.firstName} ${user.lastName}`,
        quoteData.customerData.phoneNumber,
        'GB',
        'en-GB'
      );
      return NextResponse.json({ orderCode: order.orderCode });
    } catch (error) {
      console.error("Viva payment creation failed:", error);
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return NextResponse.json({ error: "Failed to create Viva payment.", details: errorMessage }, { status: 500 });
    }



  } else if (activeProvider === 'paypal') {
    try {
      const paypalSettingsRaw = await getSettings('paypal');
      const paypalSettings: PaypalConfig = {
        environment: paypalSettingsRaw?.environment === 'live' ? 'live' : 'sandbox',
        sandboxClientId: paypalSettingsRaw?.sandboxClientId,
        sandboxSecret: paypalSettingsRaw?.sandboxSecret,
        liveClientId: paypalSettingsRaw?.liveClientId,
        liveSecret: paypalSettingsRaw?.liveSecret,
      };

      const { accessToken, baseUrl } = await getPayPalAccessToken(paypalSettings);

      const createOrderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: currencyCode,
                value: amountForProvider.toFixed(2),
              },
              description,
              custom_id: quoteData?.id ? String(quoteData.id) : undefined,
              reference_id: quoteData?.policyNumber ? String(quoteData.policyNumber) : undefined,
            },
          ],
          application_context: {
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-confirmation`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-failed`,
            user_action: 'PAY_NOW',
            shipping_preference: 'NO_SHIPPING',
          },
        }),
      });

      const orderData = await createOrderResponse.json();

      if (!createOrderResponse.ok) {
        throw new Error(orderData?.message || 'Failed to create PayPal order.');
      }

      const approvalUrl = orderData?.links?.find((link: { rel: string; href: string }) => link.rel === 'approve')?.href;
      if (!approvalUrl) {
        throw new Error('PayPal approval URL not found.');
      }

      return NextResponse.json({ checkoutUrl: approvalUrl });
    } catch (error: any) {
      console.error('PayPal payment creation failed:', error);
      return NextResponse.json({ error: 'Failed to create PayPal payment.', details: error.message }, { status: 500 });
    }

  } else if (activeProvider === 'checkoutcom') {
    try {
      const checkoutComSettingsRaw = await getSettings('checkoutcom');
      const checkoutComSettings: CheckoutComConfig = {
        environment: checkoutComSettingsRaw?.environment === 'live' ? 'live' : 'sandbox',
        sandboxSecretKey: checkoutComSettingsRaw?.sandboxSecretKey,
        liveSecretKey: checkoutComSettingsRaw?.liveSecretKey,
      };

      const { apiUrl, secretKey } = getCheckoutComCredentials(checkoutComSettings);
      const response = await fetch(`${apiUrl}/hosted-payments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
          'Cko-Idempotency-Key': uuidv4(),
        },
        body: JSON.stringify({
          amount: Math.round(amountForProvider * 100),
          currency: currencyCode,
          reference: quoteData?.policyNumber || `order-${quoteData?.id || uuidv4()}`,
          description,
          success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-confirmation`,
          failure_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-failed`,
          metadata,
        }),
      });

      const checkoutData = await response.json();

      if (!response.ok) {
        throw new Error(checkoutData?.error_type || checkoutData?.message || 'Failed to create Checkout.com hosted payment.');
      }

      const checkoutUrl = checkoutData?._links?.redirect?.href;
      if (!checkoutUrl) {
        throw new Error('Checkout.com redirect URL not found.');
      }

      return NextResponse.json({ checkoutUrl });
    } catch (error: any) {
      console.error('Checkout.com payment creation failed:', error);
      return NextResponse.json({ error: 'Failed to create Checkout.com payment.', details: error.message }, { status: 500 });
    }

  }else if (activeProvider === 'lemonsqueezy') {
    try {
      const { apiKey, storeId, variantId } = await getLemonSqueezySettings();
      const response = await fetch(`https://api.lemonsqueezy.com/v1/checkouts`, {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          data: {
            type: 'checkouts',
            attributes: {
              checkout_data: { email: user.email, custom: metadata },
              product_options: {
                name: description,
                description: description,
                receipt_button_text: "View Your Purchase",
                redirect_url: redirectUrl,
              },
              custom_price: Math.round(amountForProvider * 100),
            },
            relationships: {
              store: { data: { type: 'stores', id: storeId } },
              variant: { data: { type: 'variants', id: variantId } },
            },
          },
        }),
      });
      const checkout = await response.json();
      if (checkout && checkout.data && checkout.data.attributes && checkout.data.attributes.url) {
        return NextResponse.json({ checkoutUrl: checkout.data.attributes.url });
      } else {
        console.error("Lemon Squeezy checkout creation failed:", checkout);
        throw new Error(checkout?.errors?.[0]?.detail || "Could not initiate Lemon Squeezy payment.");
      }
    } catch (error: any) {
      console.error("Lemon Squeezy payment creation failed:", error);
      return NextResponse.json({ error: "Failed to create Lemon Squeezy payment.", details: error.message }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: "Invalid payment provider." }, { status: 400 });
  }
}