import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { isRequestThrottled } from '@/core/session-guard'
import { getStripeCredentials, STRIPE_API_VERSION } from '@/core/stripe-credentials'
import { getPaymentCustomerIdentity } from '@/core/payment-auth'
import { getPaymentGatewayAttempt, isPaymentGatewayAttemptOwnedByCustomer } from '@/core/payment-rotation'
import { verifyStripeAttempt } from '@/features/documents/services/stripe-confirm'

/**
 * Confirm-on-return for Stripe (the Stripe counterpart of `/api/viva-confirm`
 * and `/api/paypal/capture`).
 *
 * The payment-result pages call this after Stripe redirects the customer back.
 * It asks Stripe for the payment intent of the routed attempt and, when it has
 * succeeded, runs the exact same idempotent fulfilment as `/api/stripe-hook`.
 * That makes a paid order correct even if the webhook delivery was dropped,
 * was delayed, or had not been configured yet - the customer is never shown a
 * confirmation page while the order stays unpaid in the database.
 *
 * Only the signed-in owner of the attempt can verify it, and the answer always
 * comes from Stripe's API (never from the query string), so this cannot be used
 * to mark an order as paid without an actual payment.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    // The confirmation page polls this endpoint and every call reaches Stripe's
    // API, so it is throttled like the other verify endpoints.
    if (isRequestThrottled(request)) {
        return NextResponse.json({ outcome: 'unknown', error: 'Too many requests.' }, { status: 429 })
    }

    let body: { gatewayAttemptId?: unknown } | null = null
    try {
        body = await request.json()
    } catch {
        body = null
    }

    const gatewayAttemptId = typeof body?.gatewayAttemptId === 'string' ? body.gatewayAttemptId : ''
    if (!gatewayAttemptId) {
        return NextResponse.json({ outcome: 'unknown', error: 'gatewayAttemptId is required.' }, { status: 400 })
    }

    const customer = await getPaymentCustomerIdentity(request)
    if (!customer) {
        return NextResponse.json({ outcome: 'unknown', error: 'Sign in to confirm this payment.' }, { status: 401 })
    }

    const attempt = await getPaymentGatewayAttempt(gatewayAttemptId)
    if (
        !attempt ||
        !(await isPaymentGatewayAttemptOwnedByCustomer(gatewayAttemptId, customer.id, customer.email))
    ) {
        return NextResponse.json({ outcome: 'unknown', error: 'Payment attempt not found.' }, { status: 404 })
    }

    // The same page serves every gateway - tell it to keep using its own
    // gateway-specific confirmation when this attempt is not a Stripe one.
    if (attempt.gateway !== 'stripe') {
        return NextResponse.json({ outcome: 'not-stripe', provider: attempt.gateway })
    }

    const credentials = await getStripeCredentials()
    if (!credentials.secretKey) {
        console.error('Stripe verification: secretKey is not configured (environment variable or Ops Hub settings).')
        return NextResponse.json({ outcome: 'unknown', provider: 'stripe', error: 'Stripe is not configured.' }, { status: 500 })
    }

    const stripe = new Stripe(credentials.secretKey, { apiVersion: STRIPE_API_VERSION })

    try {
        const result = await verifyStripeAttempt(attempt, stripe)
        if (result.outcome === 'succeeded') {
            console.log(
                `Stripe verification: attempt ${attempt.id} confirmed (${result.paymentIntentId}) - ${result.message}`,
            )
        }
        return NextResponse.json(result)
    } catch (error) {
        console.error(`Stripe verification failed for attempt ${attempt.id}:`, error)
        return NextResponse.json(
            { outcome: 'unknown', provider: 'stripe', error: 'Could not verify this payment with Stripe.' },
            { status: 502 },
        )
    }
}
