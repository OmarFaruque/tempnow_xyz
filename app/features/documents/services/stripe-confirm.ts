import 'server-only'

import { eq } from 'drizzle-orm'
import type Stripe from 'stripe'
import { db } from '@/lib/db'
import { quotes } from '@/lib/schema'
import { markPaymentGatewayAttempt, type PaymentGatewayAttempt } from '@/core/payment-rotation'
import { fulfilPaymentIntent, type StripeFulfilmentResult } from '@/features/documents/services/stripe-webhook-handler'

/**
 * Verify-on-return for Stripe payments.
 *
 * Stripe redirects the customer back to `/payment-result` as soon as the card
 * is confirmed - the webhook may
 * still be in flight, may arrive after a tunnel dropped the connection, or may
 * never arrive at all. Every other gateway in this project has a
 * confirm-on-return step (`/api/viva-confirm`, `/api/paypal/capture`,
 * `init-authorize`, `init-square`); this module is the Stripe equivalent, so a
 * successful payment is always fulfilled from *Stripe's own* API, which is the
 * only authority on whether the money was taken.
 *
 * Fulfilment itself is shared with the webhook (`fulfilPaymentIntent`), so
 * running both is completely safe: whichever arrives second is a no-op.
 */

export type StripeVerificationOutcome = 'succeeded' | 'pending' | 'failed' | 'not-stripe' | 'unknown'

export interface StripeVerificationQuote {
    id: number
    policyNumber: string | null
    updatePrice: string | null
    cpw: string | null
    updatedAt: string | null
    paymentDate: string | null
}

export interface StripeVerificationResult {
    outcome: StripeVerificationOutcome
    /** Gateway that owns this attempt (used by the payment-result page fallbacks). */
    provider: string
    paymentIntentId?: string | null
    paymentIntentStatus?: string | null
    quoteId?: number
    policyNumber?: string | null
    /** Order details for the confirmation page (so it never relies on localStorage). */
    quote?: StripeVerificationQuote
    message?: string
    fulfilment?: StripeFulfilmentResult
}

function stripeStatusToOutcome(status: Stripe.PaymentIntent.Status): StripeVerificationOutcome {
    switch (status) {
        case 'succeeded':
            return 'succeeded'
        case 'processing':
        case 'requires_capture':
        case 'requires_action':
        case 'requires_confirmation':
        case 'requires_payment_method':
            return 'pending'
        default:
            return 'failed'
    }
}

/** The checkout id of a quote attempt is `quote:<quote row id>`. */
function quoteIdFromCheckoutId(checkoutId: string): number | null {
    const match = /^quote:(\d+)$/.exec(checkoutId)
    if (!match) return null
    const id = Number(match[1])
    return Number.isSafeInteger(id) && id > 0 ? id : null
}

/**
 * Find the payment intent that belongs to this attempt. The order is:
 *
 *   1. the reference written when the intent was created (`init-stripe`)
 *   2. the quote row the checkout id points at
 *   3. Stripe's search index on `metadata.gatewayAttemptId`
 */
export async function resolveAttemptPaymentIntent(
    attempt: PaymentGatewayAttempt,
    stripe: Stripe,
): Promise<string | null> {
    if (attempt.providerReference?.startsWith('pi_')) return attempt.providerReference

    // A routed doc-forge Stripe purchase is a hosted Checkout Session, whose
    // reference is `cs_...` at creation (the payment intent only exists once
    // the customer is on Stripe's page). Ask Stripe for the intent behind the
    // session instead of waiting for the metadata search index.
    if (attempt.providerReference?.startsWith('cs_')) {
        try {
            const session = (await stripe.checkout.sessions.retrieve(attempt.providerReference)) as unknown as {
                payment_intent?: string | { id: string } | null
                invoice?: string | { id: string } | null
            }
            const sessionIntent = session.payment_intent
            if (typeof sessionIntent === 'string' && sessionIntent) return sessionIntent

            // Subscription mode: the first invoice carries the payment intent.
            const invoiceRef = session.invoice
            if (invoiceRef) {
                const invoice = (await stripe.invoices.retrieve(
                    typeof invoiceRef === 'string' ? invoiceRef : invoiceRef.id,
                )) as unknown as { payment_intent?: string | null }
                if (invoice.payment_intent) return invoice.payment_intent
            }
        } catch (error) {
            console.error(`Stripe verification: could not load checkout session ${attempt.providerReference}:`, error)
        }
    }

    if (attempt.product === 'quote') {
        const quoteId = quoteIdFromCheckoutId(attempt.checkoutId)
        if (quoteId) {
            const [quote] = await db
                .select({ paymentIntentId: quotes.paymentIntentId })
                .from(quotes)
                .where(eq(quotes.id, quoteId))
                .limit(1)
            if (quote?.paymentIntentId?.startsWith('pi_')) return quote.paymentIntentId
        }
    }

    try {
        const searched = await stripe.paymentIntents.search({
            query: `metadata['gatewayAttemptId']:'${attempt.id}' and status:'succeeded'`,
            limit: 1,
        })
        if (searched.data[0]) return searched.data[0].id
    } catch (error) {
        // The search index lags behind creation by up to a minute and may not
        // be enabled for every account; it is only a fallback.
        console.error(`Stripe verification: payment intent search for attempt ${attempt.id} failed:`, error)
    }

    return null
}

/**
 * Ask Stripe whether the payment behind this attempt went through and fulfil
 * it when it did. Idempotent, so the payment-result page can poll it.
 */
export async function verifyStripeAttempt(
    attempt: PaymentGatewayAttempt,
    stripe: Stripe,
): Promise<StripeVerificationResult> {
    if (attempt.gateway !== 'stripe') {
        return { outcome: 'not-stripe', provider: attempt.gateway, message: `This attempt uses ${attempt.gateway}.` }
    }

    const paymentIntentId = await resolveAttemptPaymentIntent(attempt, stripe)
    if (!paymentIntentId) {
        return {
            outcome: 'pending',
            provider: 'stripe',
            message: 'Stripe has not returned a payment intent for this attempt yet.',
        }
    }

    let paymentIntent: Stripe.PaymentIntent
    try {
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    } catch (error) {
        console.error(`Stripe verification: could not retrieve payment intent ${paymentIntentId}:`, error)
        return {
            outcome: 'unknown',
            provider: 'stripe',
            paymentIntentId,
            message: 'Stripe could not be reached to confirm this payment.',
        }
    }

    const outcome = stripeStatusToOutcome(paymentIntent.status)
    if (outcome !== 'succeeded') {
        return {
            outcome,
            provider: 'stripe',
            paymentIntentId: paymentIntent.id,
            paymentIntentStatus: paymentIntent.status,
            message:
                outcome === 'pending'
                    ? 'Stripe is still processing this payment.'
                    : `Stripe reports this payment as ${paymentIntent.status}.`,
        }
    }

    await markPaymentGatewayAttempt(attempt.id, 'succeeded', { providerReference: paymentIntent.id })
    const fulfilment = await fulfilPaymentIntent(paymentIntent, stripe)

    if (!fulfilment.handled && !fulfilment.quoteId) {
        // Stripe took the money but nothing in our database matches it: do not
        // tell the customer the order is confirmed. The webhook (and the Ops
        // Hub order list) is where this has to be reconciled.
        console.error(
            `Stripe verification: payment ${paymentIntent.id} succeeded but no order matched it (${fulfilment.reason}).`,
        )
        return {
            outcome: 'unknown',
            provider: 'stripe',
            paymentIntentId: paymentIntent.id,
            paymentIntentStatus: paymentIntent.status,
            message: 'Stripe confirmed the payment but the order could not be found.',
            fulfilment,
        }
    }

    return {
        outcome: 'succeeded',
        provider: 'stripe',
        paymentIntentId: paymentIntent.id,
        paymentIntentStatus: paymentIntent.status,
        quoteId: fulfilment.quoteId,
        policyNumber: fulfilment.policyNumber ?? null,
        quote: fulfilment.quoteId ? await loadQuoteSummary(fulfilment.quoteId) : undefined,
        message: fulfilment.reason,
        fulfilment,
    }
}

async function loadQuoteSummary(quoteId: number): Promise<StripeVerificationQuote | undefined> {
    const [row] = await db
        .select({
            id: quotes.id,
            policyNumber: quotes.policyNumber,
            updatePrice: quotes.updatePrice,
            cpw: quotes.cpw,
            updatedAt: quotes.updatedAt,
            paymentDate: quotes.paymentDate,
        })
        .from(quotes)
        .where(eq(quotes.id, quoteId))
        .limit(1)

    return row
}
