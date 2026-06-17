import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { users, quotes } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { settings } from "@/lib/schema";
import { revalidatePath } from "next/cache";
import { getSettings } from "@/lib/database";

export async function POST(req: NextRequest) {
      const { quoteData, user, flp_checksum, radar_session_id } = await req.json();
  
      if (!quoteData) {
          return NextResponse.json({ error: "Quote data is required." }, { status: 400 });
      }
  
      try {
          const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
          if (!stripeSecretKey) {
              return NextResponse.json({ error: "Stripe secret key is not set in the environment variables." }, { status: 500 });
          }
  
          // Fetch site name from settings
          const generalSettings = await db.query.settings.findFirst({
              where: eq(settings.param, 'general')
          });
          let siteName = "";
          if (generalSettings && generalSettings.value) {
              const parsedSettings = JSON.parse(generalSettings.value);
              siteName = parsedSettings.siteName || "";
          }
  
          const stripe = new Stripe(stripeSecretKey);
  
          let stripeCustomerId = user.stripeCustomerId;
  
          const customerName = `${quoteData.customerData?.firstName || ''} ${quoteData.customerData?.lastName || ''}`.trim();
          const customerEmail = user.email;
          const customerPhone = quoteData?.customerData?.phoneNumber ?? (quoteData?.customerData as any)?.phone;
          const customerAddress = {
              line1: quoteData.customerData?.address,
              postal_code: quoteData.customerData?.post_code ?? quoteData.customerData?.postcode,
              country: quoteData.customerData?.country || 'GB',
          };
  
          if (!stripeCustomerId) {
               const customer = await stripe.customers.create({
                  email: customerEmail,
                  name: customerName,
                  phone: customerPhone,
                  address: customerAddress,
              });
              stripeCustomerId = customer.id;
              await db.update(users).set({ stripeCustomerId }).where(eq(users.userId, user.id));
          }else {
            await stripe.customers.update(stripeCustomerId, {
                email: customerEmail,
                name: customerName,
                phone: customerPhone,
                address: customerAddress,
            });
          }
  
          const finalAmount = quoteData.total;
  

    // Run a FraudLabsPro check before creating payment intent
    try {
      const fraudSettings = await getSettings("fraudLabsPro");
      const apiKey = fraudSettings?.apiKey;
      if (apiKey && fraudSettings?.enabled) {
        // IP handling logic needs to be moved up before flp.validate()
        const checkIsPrivateIp = (ip?: string) => {
          if (!ip) return true;
          if (ip === "::1" || ip === "127.0.0.1") return true;
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
          if (extractedIp && !checkIsPrivateIp(extractedIp)) ip = extractedIp;
        }

        const ua = req.headers.get("user-agent");

        const billingAddress = quoteData?.customerData?.address;
        const postcode = quoteData?.customerData?.post_code ?? quoteData?.customerData?.postcode ?? (quoteData?.customerData as any)?.postCode;
        const phone = quoteData?.customerData?.phoneNumber ?? (quoteData?.customerData as any)?.phone;

        const fraudlabsproParams = new URLSearchParams();
        fraudlabsproParams.set("key", apiKey);
        fraudlabsproParams.set("format", "json");

        if (flp_checksum) fraudlabsproParams.set("flp_checksum", flp_checksum);
        if (ip) fraudlabsproParams.set("ip", ip);
        fraudlabsproParams.set("user_order_id", String(quoteData.id));
        fraudlabsproParams.set("user_order_memo", `Quote for ${quoteData.customerData?.firstName} ${quoteData.customerData?.lastName} - ${quoteData.id}`);
        fraudlabsproParams.set("currency", (quoteData as any)?.currency || "GBP");
        fraudlabsproParams.set("amount", String(finalAmount));
        fraudlabsproParams.set("quantity", "1"); // Always 1 for a single quote
        fraudlabsproParams.set("payment_gateway", 'stripe');
        fraudlabsproParams.set("payment_mode", 'creditcard'); // Assuming creditcard for Stripe
        fraudlabsproParams.set("first_name", quoteData.customerData?.firstName as string);
        fraudlabsproParams.set("last_name", quoteData.customerData?.lastName as string);
        fraudlabsproParams.set("email", user.email);
        if (phone) fraudlabsproParams.set("user_phone", phone);
        if (billingAddress) fraudlabsproParams.set("bill_addr", billingAddress);
        if (quoteData.customerData?.city) fraudlabsproParams.set("bill_city", quoteData.customerData?.city);
        if (quoteData.customerData?.state) fraudlabsproParams.set("bill_state", quoteData.customerData?.state);
        if (postcode) fraudlabsproParams.set("bill_zip_code", postcode);
        fraudlabsproParams.set("bill_country", quoteData.customerData?.country || 'GB'); // Defaulting to GB
        fraudlabsproParams.set("ship_first_name", quoteData.customerData?.firstName as string);
        fraudlabsproParams.set("ship_last_name", quoteData.customerData?.lastName as string);
        if (billingAddress) fraudlabsproParams.set("ship_addr", billingAddress);
        if (quoteData.customerData?.city) fraudlabsproParams.set("ship_city", quoteData.customerData?.city);
        if (quoteData.customerData?.state) fraudlabsproParams.set("ship_state", quoteData.customerData?.state);
        if (postcode) fraudlabsproParams.set("ship_zip_code", postcode);
        fraudlabsproParams.set("ship_country", quoteData.customerData?.country || 'GB');
        if (ua) fraudlabsproParams.set("user_agent", ua);

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

        // If the provider returned a non-200 or included an error object, mark as provider error
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

        // Persist fraud check on quote
        await db.update(quotes).set({
          fraudStatus: action === "allow" ? "ok" : action,
          fraudScore: score ?? undefined,
          fraudDetails: raw ?? undefined,
          fraudCheckedAt: new Date().toISOString(),
        }).where(eq(quotes.id, quoteData.id));

        // Decide whether to block on provider errors depending on admin setting
        const failOpen = fraudSettings?.failOpen !== undefined ? !!fraudSettings.failOpen : true;
        if (action === "block" || (action === "error" && !failOpen)) {
          return NextResponse.json({ error: "Transaction blocked due to suspected fraud." }, { status: 403 });
        }
      }
    } catch (fraudError) {
      console.error("FraudLabsPro check failed:", fraudError);
      // Continue with payment creation on fraud check failure (fail-open)
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100),
      currency: "gbp",
      customer: stripeCustomerId,
      description: `${siteName} Docs: ${quoteData.id}`,
      shipping: {
        name: customerName,
        phone: customerPhone,
        address: customerAddress,
      },
      ...(radar_session_id && {
        radar_options: {
          session: radar_session_id,
        },
      }),
      metadata: {
        type: 'quote',
        quote_id: quoteData.id, // Assuming quoteData has an id
        user_details: JSON.stringify(user),
      },
    });

    // Here you would typically update the quote in your database with the paymentIntent.id
    // For example:
    await db.update(quotes).set({ paymentIntentId: paymentIntent.id }).where(eq(quotes.id, quoteData.id));

    revalidatePath('/api/quotes');
    revalidatePath('/administrator');
    revalidatePath('/api/admin/quotes');

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Stripe payment intent creation failed:", error);
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: "Failed to create Stripe payment intent.", details: errorMessage }, { status: 500 });
  }
}