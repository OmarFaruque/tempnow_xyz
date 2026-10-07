import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeCredentials, STRIPE_API_VERSION } from '@/core/stripe-credentials';
import { processStripeEvent } from '@/features/documents/services/stripe-webhook-handler';

/**
 * The SINGLE Stripe webhook endpoint for the whole project.
 *
 * It handles the full event set the document-service webhook used to handle,
 * plus quote/AI-document payment success:
 *
 *   - payment_intent.succeeded      (fulfil any successful payment)
 *   - payment_intent.payment_failed (close the routed gateway attempt)
 *   - checkout.session.completed    (doc-forge credit/subscription checkouts)
 *   - customer.subscription.updated (subscription status/period sync)
 *   - customer.subscription.deleted (cancellations)
 *   - invoice.payment_succeeded     (subscription renewals)
 *
 * The order type is resolved by looking the Stripe payment id up in the
 * database (quotes -> transactions -> subscription invoice),
 * and every fulfilment is idempotent, so overlapping events for the same
 * payment never double-grant. Unknown payments are ignored.
 *
 * IMPORTANT: the fulfilment is awaited *before* the response is sent.
 * A fire-and-forget handler (the previous implementation) loses orders twice
 * over: the runtime is free to drop work that outlives the response, and
 * Stripe sees a `200` for a delivery that actually failed, so it never
 * retries. Awaiting the (fast, database-only) fulfilment keeps every delivery
 * either fully applied or explicitly retried by Stripe.
 *
 * The customer-facing fallback lives in `/api/checkout/verify-stripe`: the
 * payment-result pages call it after returning from Stripe, so an order is
 * still fulfilled even when no webhook delivery ever reaches this app.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const signature = req.headers.get('stripe-signature');

  let body: string;
  try {
    body = await req.text();
  } catch (error) {
    // The sender closed the connection while the body was still being read
    // (the `aborted` / ECONNRESET noise Next.js prints for local tunnels and
    // the Stripe CLI). Nothing can be fulfilled - Stripe retries by itself.
    console.error('Stripe webhook: request body was aborted before it could be read.', error);
    return NextResponse.json({ error: 'Webhook Error: request aborted before the body was read.' }, { status: 400 });
  }

  if (!body) {
    console.error('Stripe webhook: empty body received.', {
      hasSignature: Boolean(signature),
      contentLength: req.headers.get('content-length'),
      userAgent: req.headers.get('user-agent'),
      contentType: req.headers.get('content-type'),
    });
    return NextResponse.json({ error: 'Webhook Error: No body received.' }, { status: 400 });
  }

  if (!signature) {
    console.error('Stripe webhook: the stripe-signature header is missing.');
    return NextResponse.json({ error: 'Webhook Error: Missing stripe-signature header.' }, { status: 400 });
  }

  const credentials = await getStripeCredentials();

  if (!credentials.secretKey || !credentials.webhookSecret) {
    console.error(
      'Stripe secretKey or webhookSecret is not configured (environment variable or Ops Hub payment settings).',
    );
    // 5xx so Stripe keeps retrying until the operator configures the keys.
    return NextResponse.json({ error: 'Stripe credentials not fully configured.' }, { status: 500 });
  }

  const stripe = new Stripe(credentials.secretKey, {
    apiVersion: STRIPE_API_VERSION,
  });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, credentials.webhookSecret);
  } catch (err: any) {
    // The signing secret must be the one of THIS endpoint
    // (Stripe Dashboard -> Developers -> Webhooks -> .../api/stripe-hook).
    console.error(
      `Stripe webhook signature verification failed using the ${process.env.STRIPE_WEBHOOK_SECRET ? 'environment' : 'Ops Hub settings'} webhook secret: ${err.message}`,
    );
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    const result = await processStripeEvent(event, stripe);
    console.log(
      `Stripe webhook ${event.type} (${event.id}) in ${Date.now() - startedAt}ms: ${result.reason}${result.quoteId ? ` [quote ${result.quoteId}]` : ''}`,
    );
    return NextResponse.json({ received: true, handled: result.handled, reason: result.reason });
  } catch (error) {
    // 500 -> Stripe retries this delivery with backoff for up to 3 days.
    console.error(`Stripe webhook ${event.type} (${event.id}) failed after ${Date.now() - startedAt}ms:`, error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
