import { NextRequest, NextResponse } from "next/server";
import { getMollieClient } from "@/lib/mollie";
import { getPaddleInstance, getPaddleApiKey, getPaddleEnvironment, getPaddleProductId, updatePaddleProductId } from "@/lib/paddle";
import { getVivaClient } from "@/lib/viva";
import { getLemonSqueezySettings } from "@/lib/lemonsqueezy";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from 'uuid';
import { settings, quotes } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { getSettings } from "@/lib/database";
import { parseSettingsValue } from "@/lib/utils";
import { getConfiguredGatewayOrder, type PaymentProduct } from '@/core/payment-gateways';
import { getPaymentGatewayAttempt, isPaymentGatewayAttemptOwnedByCustomer, markPaymentGatewayAttempt, verifyPaymentGatewayAttempt } from '@/core/payment-rotation';
import { getPaymentCustomerIdentity } from '@/core/payment-auth';
import {
  recordPendingDocCreditPurchase,
  recordPendingDocSubscription,
} from '@/app/features/documents/services/doc-payment-fulfilment';
import { getStripeCredentials, STRIPE_API_VERSION } from '@/core/stripe-credentials';
import Stripe from 'stripe';
import { sql } from '@/core/db-raw';

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
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid payment request.' }, { status: 400 });
  }

  const { quoteData, planData, user: submittedUser, flp_checksum } = body;
  if (!submittedUser || (!quoteData && !planData)) {
    return NextResponse.json({ error: 'Checkout and customer information are required.' }, { status: 400 });
  }

  const product: PaymentProduct = planData ? 'doc-forge' : 'quote';
  const gatewayAttemptId = typeof body.gatewayAttemptId === 'string' ? body.gatewayAttemptId : '';
  const checkoutId = typeof body.checkoutId === 'string' ? body.checkoutId : '';

  if (!gatewayAttemptId || !checkoutId) {
    return NextResponse.json({ error: 'A routed payment attempt is required.' }, { status: 400 });
  }

  const customer = await getPaymentCustomerIdentity(req);
  if (!customer) return NextResponse.json({ error: 'Sign in to continue checkout.' }, { status: 401 });
  if (product === 'quote' && checkoutId !== `quote:${quoteData?.id}`) {
    return NextResponse.json({ error: 'Quote checkout does not match the payment attempt.' }, { status: 400 });
  }
  if (product === 'doc-forge' && (!/^doc-forge:\d+:[a-zA-Z0-9_-]{8,120}$/.test(checkoutId) || !checkoutId.startsWith(`doc-forge:${customer.id}:`))) {
    return NextResponse.json({ error: 'Document checkout does not match the payment attempt.' }, { status: 400 });
  }
  const storedAttempt = await getPaymentGatewayAttempt(gatewayAttemptId);
  if (
    !storedAttempt ||
    storedAttempt.checkoutId !== checkoutId ||
    storedAttempt.product !== product ||
    !(await isPaymentGatewayAttemptOwnedByCustomer(gatewayAttemptId, customer.id, customer.email))
  ) {
    return NextResponse.json({ error: 'This payment attempt is no longer available.' }, { status: 409 });
  }
  const routedAttempt = await verifyPaymentGatewayAttempt(gatewayAttemptId, storedAttempt.gateway, product);
  if (!routedAttempt) return NextResponse.json({ error: 'This payment attempt has expired.' }, { status: 409 });
  const user = { ...submittedUser, id: customer.id, email: customer.email };

  const paymentSettings = await db.query.settings.findFirst({
    where: eq(settings.param, 'payment'),
  });
  const paymentConfig = parseSettingsValue(paymentSettings?.value);
  const activeProvider = storedAttempt.gateway || getConfiguredGatewayOrder(paymentConfig)[0] || paymentConfig.activeProcessor || 'stripe';

  // Set by the doc-forge branch; written once the provider has accepted the
  // payment, so the webhook can match its delivery back to this purchase.
  let docPending:
    | { kind: 'credits'; userId: number; amountCents: number; credits: number }
    | { kind: 'subscription'; userId: number; planId: number; providerSubscriptionId?: string | null }
    | null = null;
  let docCheckoutId: string | null = null;

  const markPendingResponse = async (payload: Record<string, unknown>, providerReference?: string | null) => {
    await markPaymentGatewayAttempt(gatewayAttemptId, 'pending', { providerReference });
    if (docPending) {
      try {
        if (docPending.kind === 'credits') {
          await recordPendingDocCreditPurchase({ ...docPending, provider: activeProvider, checkoutId: docCheckoutId });
        } else {
          await recordPendingDocSubscription({ ...docPending, provider: activeProvider, checkoutId: docCheckoutId });
        }
      } catch (error) {
        // A missing pending row is recoverable: the webhook still carries the
        // purchase metadata and fulfils through it.
        console.error('Failed to record pending document purchase:', error);
      }
      docPending = null;
    }
    return NextResponse.json(payload);
  };
  const markFailedResponse = async (payload: Record<string, unknown>, failureCode: string, status = 500) => {
    await markPaymentGatewayAttempt(gatewayAttemptId, 'failed', { failureCode });
    return NextResponse.json(payload, { status });
  };

  const generalSettings = await getSettings('general');
  const siteName = generalSettings?.siteName || "";
  const currencyCode = (generalSettings?.currency || 'GBP').toUpperCase();

  let amountForProvider: number;
  let description: string;
  let metadata: object;
  let redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/payment-confirmation`;

  if (planData) {
    // A document-service purchase (credit package or subscription plan),
    // priced from the database - never from the client.
    const planId = Number(planData.planId ?? String(planData.productId ?? '').replace(/^(credit-|plan-)/, ''));
    if (!Number.isSafeInteger(planId) || planId <= 0) {
      return NextResponse.json({ error: 'A valid document plan is required.' }, { status: 400 });
    }

    // Query the subscription plan directly via raw SQL (no drizzle schema for this table)
    const [plan] = (await sql`
      SELECT id, name, plan_type, price_cents, package_price_cents, credits_per_month, credit_amount, is_active
      FROM subscription_plans
      WHERE id = ${planId} AND is_active = true
      LIMIT 1
    `) as Array<{
      id: number;
      name: string;
      plan_type: string | null;
      price_cents: number | null;
      package_price_cents: number | null;
      credits_per_month: number | null;
      credit_amount: number | null;
      is_active: boolean;
    }>;

    if (!plan) {
      return NextResponse.json({ error: 'Document plan not found.' }, { status: 404 });
    }

    const isSubscription = plan.plan_type !== 'credits';
    const priceCents = isSubscription
      ? Number(plan.price_cents ?? 0)
      : Number(plan.package_price_cents ?? plan.price_cents ?? 0);
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      return NextResponse.json({ error: 'This plan has no price configured.' }, { status: 409 });
    }
    const credits = isSubscription
      ? Number(plan.credits_per_month ?? plan.credit_amount ?? 0)
      : Number(plan.credit_amount ?? 0);

    amountForProvider = priceCents / 100;
    description = `${siteName} ${plan.name}`;
    metadata = {
      type: 'doc-purchase',
      purchaseKind: isSubscription ? 'subscription' : 'credits',
      checkoutId,
      planId,
      credits,
      userId: Number(customer.id),
      gatewayAttemptId,
    };
    redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/doc-forge/panel`;
    docCheckoutId = checkoutId;
    docPending = isSubscription
      ? { kind: 'subscription', userId: Number(customer.id), planId }
      : { kind: 'credits', userId: Number(customer.id), amountCents: priceCents, credits };

  } else if (quoteData && quoteData.id) {
    const existingQuote = await db.query.quotes.findFirst({
      where: eq(quotes.id, quoteData.id),
    });

    if (!existingQuote || String(existingQuote.userId) !== customer.id) {
      return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    }
    if (existingQuote.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'This quote has already been paid.' }, { status: 409 });
    }

    // Use the secure price from the database, ignoring client-sent total
    amountForProvider = parseFloat(existingQuote.updatePrice || existingQuote.cpw || "0");
    description = `${siteName} Docs: ${existingQuote.policyNumber}`;
    metadata = { type: 'quote', policyNumber: existingQuote.policyNumber };

  } else {
    return NextResponse.json({ error: "No valid quote data provided." }, { status: 400 });
  }

  metadata = { ...(metadata as Record<string, unknown>), gatewayAttemptId, checkoutId };
  const withAttempt = (path: string) => {
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}gatewayAttemptId=${encodeURIComponent(gatewayAttemptId)}`;
  };
  redirectUrl = withAttempt(redirectUrl);
  const failureUrl = withAttempt(`${process.env.NEXT_PUBLIC_BASE_URL}/payment-declined`);


  console.log('active provider: ', activeProvider);
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

  if (activeProvider === 'stripe') {
    // Quotes use the embedded Stripe.js element (see checkout-flow). A
    // doc-forge purchase gets the same hosted Checkout Session the storefront
    // used before it was routed, now with provider-agnostic metadata.
    if (product !== 'doc-forge') {
      return NextResponse.json({ error: "Invalid payment provider." }, { status: 400 });
    }
    try {
      const credentials = await getStripeCredentials();
      if (!credentials.secretKey) {
        return markFailedResponse({ error: 'Stripe is not configured.' }, 'stripe_not_configured', 500);
      }
      const stripe = new Stripe(credentials.secretKey, { apiVersion: STRIPE_API_VERSION });
      const isSubscriptionPurchase = (metadata as Record<string, unknown>).purchaseKind === 'subscription';
      const session = await stripe.checkout.sessions.create({
        mode: isSubscriptionPurchase ? 'subscription' : 'payment',
        client_reference_id: checkoutId,
        line_items: [
          {
            price_data: {
              currency: currencyCode.toLowerCase(),
              product_data: { name: description },
              unit_amount: Math.round(amountForProvider * 100),
              ...(isSubscriptionPurchase ? { recurring: { interval: 'month' as const } } : {}),
            },
            quantity: 1,
          },
        ],
        // Copy our metadata onto the objects the webhook inspects, so the
        // purchase resolves even if the session event is the one that arrives.
        ...(isSubscriptionPurchase
          ? { subscription_data: { metadata: metadata as Record<string, string> } }
          : { payment_intent_data: { metadata: metadata as Record<string, string> } }),
        success_url: redirectUrl,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/doc-forge/pricing`,
        metadata: metadata as Record<string, string>,
      });
      if (!session.url) {
        return markFailedResponse({ error: 'Stripe did not return a checkout page.' }, 'stripe_checkout_init_failed');
      }
      if (isSubscriptionPurchase && session.subscription) {
        docPending = { ...(docPending as { kind: 'subscription'; userId: number; planId: number }), providerSubscriptionId: session.subscription as string };
      }
      return markPendingResponse({ checkoutUrl: session.url }, (session.payment_intent as string) || session.id);
    } catch (error) {
      console.error("Stripe checkout creation failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      return markFailedResponse({ error: "Failed to create Stripe checkout.", details: errorMessage }, 'stripe_checkout_init_failed');
    }
  } else if (activeProvider === 'mollie') {
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
      return markPendingResponse({ checkoutUrl: payment.getCheckoutUrl() }, payment.id);
    } catch (error) {
      console.error("Mollie payment creation failed:", error);
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return markFailedResponse({ error: "Failed to create Mollie payment.", details: errorMessage }, 'mollie_checkout_init_failed');
    }
  } else if (activeProvider === 'paddle') {
    try {
      console.log('--- Starting Paddle Payment Creation ---');
      const paddle = await getPaddleInstance();
      const apiKey = await getPaddleApiKey();
      const environment = await getPaddleEnvironment();
      console.log(`Paddle config: env=${environment}, apiKeyPresent=${!!apiKey}`);
      const paddleApiUrl = environment === 'production'
        ? 'https://api.paddle.com'
        : 'https://sandbox-api.paddle.com';
      let paddleProduct: any;
      const productId = await getPaddleProductId();
      console.log(`Configured Paddle Product ID: ${productId}`);
      if (productId) {
        const productResponse = await fetch(`${paddleApiUrl}/products/${productId}`, {
          headers: { "Authorization": `Bearer ${apiKey}` },
        });
        if (productResponse.ok) {
          const productData = await productResponse.json();
          paddleProduct = productData.data;
          console.log(`Found existing Paddle product: ${paddleProduct?.id}`);
        } else {
          console.warn(`Product fetch failed (status ${productResponse.status}). Creating replacement product.`);
        }
      }
      if (!paddleProduct) {
        console.log('Creating new Paddle product...');
        const createProductResponse = await fetch(`${paddleApiUrl}/products`, {
          method: 'POST',
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${siteName} Docs`,
            tax_category: "standard",
          }),
        });
        const createProductData = await createProductResponse.json();
        if (!createProductResponse.ok || !createProductData?.data?.id) {
          console.error("Paddle product creation error response:", createProductData);
          return markFailedResponse({
            error: "Failed to create Paddle product.",
            details: createProductData?.error?.detail || createProductData?.error?.message || JSON.stringify(createProductData)
          }, 'paddle_checkout_init_failed', 400);
        }
        paddleProduct = createProductData.data;
        console.log(`Successfully created Paddle product: ${paddleProduct.id}`);
        await updatePaddleProductId(paddleProduct.id);
      }
      const custom_data = quoteData
        ? { quote_details: JSON.stringify(quoteData), user_details: JSON.stringify(user), gatewayAttemptId, checkoutId }
        : { ...(metadata as Record<string, unknown>) };
      console.log(`Creating price for Paddle product ${paddleProduct.id}: amount=${amountForProvider}, currency=${currencyCode}`);
      const createPriceResponse = await fetch(`${paddleApiUrl}/prices`, {
        method: 'POST',
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: paddleProduct.id,
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
      if (!createPriceResponse.ok || !createPriceData?.data?.id) {
        console.error("Paddle price creation error response:", createPriceData);
        return markFailedResponse({
          error: "Failed to create Paddle price.",
          details: createPriceData?.error?.detail || createPriceData?.error?.message || JSON.stringify(createPriceData)
        }, 'paddle_checkout_init_failed', 400);
      }
      const price = createPriceData.data;
      console.log(`Successfully created Paddle price: ${price.id}`);

      if (product === 'doc-forge') {
        // The storefront opens Paddle's hosted page for a transaction we create
        // here, so the purchase metadata comes from our server (a browser
        // cannot claim a different package) and the amount is Paddle's.
        const transactionResponse = await fetch(`${paddleApiUrl}/transactions`, {
          method: 'POST',
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            items: [{ price_id: price.id, quantity: 1 }],
            collection_mode: 'automatic',
            custom_data: metadata,
          }),
        });
        const transactionData = await transactionResponse.json();
        const transaction = transactionData?.data;
        const checkoutUrl = transaction?.checkout?.url;
        if (!transactionResponse.ok || !checkoutUrl) {
          console.error("Paddle transaction creation failed:", transactionData);
          return markFailedResponse({
            error: "Failed to create Paddle checkout.",
            details: transactionData?.error?.detail || transactionData?.error?.message || JSON.stringify(transactionData)
          }, 'paddle_checkout_init_failed', 400);
        }
        return markPendingResponse({ checkoutUrl }, transaction.id);
      }

      return markPendingResponse({ priceId: price.id, customer: user }, price.id);
    } catch (error) {
      console.error("Paddle transaction creation failed:", error);
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'detail' in error) {
        errorMessage = (error as any).detail;
      }
      return markFailedResponse({ error: "Failed to create Paddle transaction.", details: errorMessage }, 'paddle_checkout_init_failed');
    }
  } else if (activeProvider === 'viva') {
    try {
      const viva = await getVivaClient();
      const order = await viva.createOrder(
        amountForProvider,
        JSON.stringify(metadata),
        user.email,
        `${user.firstName} ${user.lastName}`,
        planData?.phoneNumber || quoteData?.customerData?.phoneNumber || '',
        'GB',
        'en-GB'
      );
      return markPendingResponse({ orderCode: order.orderCode }, String(order.orderCode));
    } catch (error) {
      console.error("Viva payment creation failed:", error);
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return markFailedResponse({ error: "Failed to create Viva payment.", details: errorMessage }, 'viva_checkout_init_failed');
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
              custom_id: quoteData?.id ? String(quoteData.id) : checkoutId,
              reference_id: quoteData?.policyNumber ? String(quoteData.policyNumber) : description.slice(0, 127),
            },
          ],
          application_context: {
            return_url: redirectUrl,
            cancel_url: failureUrl,
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

      return markPendingResponse({ checkoutUrl: approvalUrl, orderId: orderData.id }, orderData.id);
    } catch (error: any) {
      console.error('PayPal payment creation failed:', error);
      return markFailedResponse({ error: 'Failed to create PayPal payment.', details: error.message }, 'paypal_checkout_init_failed');
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
          reference: quoteData?.policyNumber || checkoutId,
          description,
          success_url: redirectUrl,
          failure_url: failureUrl,
          metadata: { ...(metadata as Record<string, unknown>), gatewayAttemptId, checkoutId },
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

      return markPendingResponse({ checkoutUrl, hostedPaymentId: checkoutData.id }, checkoutData.id);
    } catch (error: any) {
      console.error('Checkout.com payment creation failed:', error);
      return markFailedResponse({ error: 'Failed to create Checkout.com payment.', details: error.message }, 'checkoutcom_checkout_init_failed');
    }

  } else if (activeProvider === 'lemonsqueezy') {
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
        return markPendingResponse({ checkoutUrl: checkout.data.attributes.url }, checkout.data.id);
      } else {
        console.error("Lemon Squeezy checkout creation failed:", checkout);
        throw new Error(checkout?.errors?.[0]?.detail || "Could not initiate Lemon Squeezy payment.");
      }
    } catch (error: any) {
      console.error("Lemon Squeezy payment creation failed:", error);
      return markFailedResponse({ error: "Failed to create Lemon Squeezy payment.", details: error.message }, 'lemonsqueezy_checkout_init_failed');
    }
  } else {
    return NextResponse.json({ error: "Invalid payment provider." }, { status: 400 });
  }
}