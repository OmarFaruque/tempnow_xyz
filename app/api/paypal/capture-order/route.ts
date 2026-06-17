import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { quotes } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSettings } from '@/lib/database';

type PaypalConfig = {
  environment: 'sandbox' | 'live';
  sandboxClientId?: string;
  sandboxSecret?: string;
  liveClientId?: string;
  liveSecret?: string;
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

export async function POST(req: NextRequest) {
  try {
    const { orderId, policyNumber } = await req.json();

    if (!orderId || !policyNumber) {
      return NextResponse.json({ error: 'orderId and policyNumber are required.' }, { status: 400 });
    }

    const paypalSettingsRaw = await getSettings('paypal');
    const paypalSettings: PaypalConfig = {
      environment: paypalSettingsRaw?.environment === 'live' ? 'live' : 'sandbox',
      sandboxClientId: paypalSettingsRaw?.sandboxClientId,
      sandboxSecret: paypalSettingsRaw?.sandboxSecret,
      liveClientId: paypalSettingsRaw?.liveClientId,
      liveSecret: paypalSettingsRaw?.liveSecret,
    };

    const { accessToken, baseUrl } = await getPayPalAccessToken(paypalSettings);

    const captureResponse = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const captureData = await captureResponse.json();

    if (!captureResponse.ok) {
      return NextResponse.json(
        { error: captureData?.message || 'Failed to capture PayPal payment.', details: captureData },
        { status: 500 }
      );
    }

    const paymentStatus = captureData?.status;
    if (paymentStatus !== 'COMPLETED') {
      return NextResponse.json(
        { error: `Unexpected PayPal order status: ${paymentStatus || 'UNKNOWN'}.`, details: captureData },
        { status: 400 }
      );
    }

    const updateTimestamp = new Date().toISOString();

    const [updatedQuote] = await db
      .update(quotes)
      .set({
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'paypal',
        mailSent: false,
        paymentIntentId: orderId,
        paymentDate: updateTimestamp,
        updatedAt: updateTimestamp,
      })
      .where(eq(quotes.policyNumber, policyNumber))
      .returning();

    if (!updatedQuote) {
      return NextResponse.json({ error: 'Quote not found.' }, { status: 404 });
    }

    revalidatePath('/api/quotes');
    revalidatePath('/administrator');
    revalidatePath('/api/admin/quotes');

    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: updatedQuote.id }),
    });

    return NextResponse.json({ success: true, quote: updatedQuote });
  } catch (error: any) {
    console.error('Error capturing PayPal payment:', error);
    return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 });
  }
}