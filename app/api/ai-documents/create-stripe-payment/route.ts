import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { settings } from "@/lib/schema"; // Import the settings table

export async function POST(req: NextRequest) {
  const { docData, user, tip, discount } = await req.json();

  if (!docData) {
    return NextResponse.json({ error: "Document data is required." }, { status: 400 });
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

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-04-10",
    });

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email: user.email });
      stripeCustomerId = customer.id;
      await db.update(users).set({ stripeCustomerId }).where(eq(users.userId, user.id));
    }

    const finalAmount = docData.price + (tip || 0) - (discount || 0);
    const limitedPrompt = docData.prompt.substring(0, 200);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100),
      currency: "gbp",
      customer: stripeCustomerId,
      description: `${siteName} AI Docs: ${limitedPrompt}`,
      metadata: {
        type: 'ai_document',
        document_details: JSON.stringify({
          prompt: limitedPrompt,
          price: docData.price,
          content: docData.content,
        }),
        user_details: JSON.stringify(user),
      },
    });

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