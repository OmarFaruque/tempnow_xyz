import { sql } from '@/core/db-raw'
import { db } from '@/lib/db'
import { quotes } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import Stripe from 'stripe'
import { markPaymentGatewayAttempt } from '@/core/payment-rotation'
import { revalidateOrderCaches, triggerConfirmationEmail } from '@/core/payment-confirmation'
import {
    DOC_PURCHASE_TYPE,
    fulfilDocCreditPurchase,
    fulfilDocPurchase,
    fulfilDocSubscriptionPayment,
    recordCreditPackagePurchase,
    recordPendingDocCreditPurchase,
    recordPendingDocSubscription,
} from '@/features/documents/services/doc-payment-fulfilment'

/** Every doc-forge row this handler writes belongs to Stripe. */
const PROVIDER = 'stripe'

/**
 * Stripe webhook business logic for the WHOLE project (single endpoint:
 * `/api/stripe-hook`).
 *
 * Events handled - the same set the document-service webhook used to handle,
 * plus the quote/AI-document payment success:
 *
 *   - payment_intent.succeeded       -> fulfil ANY successful payment
 *   - payment_intent.payment_failed  -> close the routed gateway attempt
 *   - checkout.session.completed     -> fulfil doc-forge credit/subscription checkouts
 *   - customer.subscription.updated  -> sync subscription status/period
 *   - customer.subscription.deleted  -> mark subscription canceled
 *   - invoice.payment_succeeded      -> record subscription renewals
 *
 * The order type is never guessed from metadata alone: a successful payment is
 * resolved by looking the Stripe payment id up in the database, in order:
 *
 *   1. main database `quotes.payment_intent_id`        -> quote checkout
 *   2. main database `transactions.provider_payment_id` -> document-service credits
 *   3. payment intent's invoice -> `user_subscriptions.provider_subscription_id`
 *      -> document-service subscription first payment / renewal
 *
 * Stripe delivers `checkout.session.completed`, `invoice.payment_succeeded`
 * and `payment_intent.succeeded` for the SAME payment, so every fulfilment is
 * idempotent: `transactions.provider_payment_id` acts as the ledger (Stripe rows carry `provider = 'stripe'`) - credits
 * are granted only by whoever records the completed transaction first.
 *
 * Everything in this module runs inside the HTTP request that Stripe made
 * (`/api/stripe-hook`) or inside the customer's own confirmation request
 * (`/api/checkout/verify-stripe`). Work is never left behind a response:
 * a detached promise may be killed when the runtime freezes the request, and
 * Stripe can only retry a delivery when it actually receives a non-2xx reply.
 */

// ---------------------------------------------------------------------------
// Fulfilment results
// ---------------------------------------------------------------------------

export interface StripeFulfilmentResult {
    /** True when this call changed the database. */
    handled: boolean
    /** Short, log-friendly summary of what happened. */
    reason: string
    kind?: 'quote' | 'credits' | 'subscription' | 'payment_failed' | 'ignored'
    paymentId?: string | null
    quoteId?: number
    policyNumber?: string | null
    userId?: number
}

const ignored = (reason: string, extra: Partial<StripeFulfilmentResult> = {}): StripeFulfilmentResult => ({
    handled: false,
    reason,
    kind: 'ignored',
    ...extra,
})

// ---------------------------------------------------------------------------
// Shared idempotent fulfilment helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// payment_intent.succeeded - the single "payment success" entry point
// ---------------------------------------------------------------------------

/**
 * Fulfil a succeeded payment intent, resolving what was bought from the
 * database. Idempotent: running it twice (webhook + verify-on-return, or
 * Stripe retrying a delivery) never grants the same payment twice.
 */
export async function fulfilPaymentIntent(
    paymentIntent: Stripe.PaymentIntent,
    stripe: Stripe,
): Promise<StripeFulfilmentResult> {
    const paymentId = paymentIntent.id

    // 1) Quote checkout -------------------------------------------------------
    const [quote] = await db
        .select()
        .from(quotes)
        .where(eq(quotes.paymentIntentId, paymentId))
        .limit(1)

    if (quote) {
        if (quote.paymentStatus === 'paid') {
            return {
                handled: false,
                kind: 'quote',
                reason: 'quote already marked as paid',
                paymentId,
                quoteId: quote.id,
                policyNumber: quote.policyNumber,
            }
        }

        const updateTimestamp = new Date().toISOString()
        await db
            .update(quotes)
            .set({
                status: 'completed',
                paymentStatus: 'paid',
                paymentMethod: 'stripe',
                mailSent: false,
                paymentIntentId: paymentIntent.id,
                paymentDate: updateTimestamp,
                updatedAt: updateTimestamp,
            })
            .where(eq(quotes.id, quote.id))

        revalidateOrderCaches(revalidatePath)

        // Confirmation e-mail (not awaited - the retry cron covers failures,
        // and the quote stays mail_sent = false until it is delivered).
        triggerConfirmationEmail(quote.id)

        return {
            handled: true,
            kind: 'quote',
            reason: 'quote marked as paid and the confirmation e-mail was triggered',
            paymentId,
            quoteId: quote.id,
            policyNumber: quote.policyNumber,
        }
    }

    // 2) Document-service one-off credit purchase -------------------------------
    const credit = await fulfilDocCreditPurchase({ provider: PROVIDER, providerPaymentId: paymentId })
    if (credit) {
        return { handled: true, kind: 'credits', reason: 'credits granted', paymentId, userId: credit.userId }
    }

    // 2b) Doc-forge purchase created by the routed checkout (its metadata is
    // copied from the Checkout Session onto the payment intent).
    if (paymentIntent.metadata?.type === DOC_PURCHASE_TYPE) {
        const doc = await fulfilDocPurchase({
            provider: PROVIDER,
            providerPaymentId: paymentId,
            metadata: paymentIntent.metadata,
            amountCents: paymentIntent.amount_received,
            periodStart: paymentIntent.created,
        })
        if (doc.handled) {
            return {
                handled: true,
                kind: doc.kind === 'subscription' ? 'subscription' : 'credits',
                reason: doc.reason,
                paymentId,
                userId: doc.userId,
            }
        }
    }

    // 3) Document-service subscription first payment / renewal ------------------
    const invoiceRef = (paymentIntent as unknown as { invoice?: string | { id: string } | null }).invoice
    if (invoiceRef) {
        let subscriptionId: string | null = null

        try {
            const invoice = (await stripe.invoices.retrieve(
                typeof invoiceRef === 'string' ? invoiceRef : invoiceRef.id,
            )) as unknown as { subscription?: string | null }
            subscriptionId = (invoice.subscription as string) || null
        } catch (error) {
            console.error('Failed to retrieve invoice for payment intent:', error)
        }

        if (subscriptionId) {
            const subscription = await fulfilDocSubscriptionPayment({
                provider: PROVIDER,
                providerSubscriptionId: subscriptionId,
                providerPaymentId: paymentId,
                amountCents: paymentIntent.amount_received,
                periodStart: paymentIntent.created,
            })
            return {
                handled: Boolean(subscription),
                kind: 'subscription',
                reason: subscription ? 'subscription activated/renewed' : 'subscription already fulfilled',
                paymentId,
                userId: subscription?.userId,
            }
        }
    }

    return ignored('no matching order in the database', { paymentId })
}

/** Backwards-compatible wrapper used by the webhook endpoint. */
export async function handlePaymentSucceededEvent(event: Stripe.Event, stripe: Stripe): Promise<StripeFulfilmentResult> {
    return fulfilPaymentIntent(event.data.object as Stripe.PaymentIntent, stripe)
}

// ---------------------------------------------------------------------------
// checkout.session.completed - doc-forge credit & subscription checkouts
// ---------------------------------------------------------------------------

export async function handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
    stripe: Stripe,
): Promise<StripeFulfilmentResult> {
    const metadata = session.metadata
    if (!metadata) return ignored('checkout session without metadata', { kind: 'ignored' })

    const userId = parseInt(metadata.userId)
    const credits = parseInt(metadata.credits)
    const type = metadata.type
    const productId = metadata.productId
    const paymentIntentId = (session.payment_intent as string) || null

    if (type === DOC_PURCHASE_TYPE) {
        const doc = await fulfilDocPurchase({
            provider: PROVIDER,
            providerPaymentId: paymentIntentId,
            subscriptionId: (session.subscription as string) || null,
            metadata,
            amountCents: session.amount_total,
            periodStart: session.created,
        })
        return {
            handled: doc.handled,
            kind: doc.kind === 'subscription' ? 'subscription' : doc.handled ? 'credits' : 'ignored',
            reason: doc.reason,
            paymentId: paymentIntentId,
            userId: doc.userId,
        }
    }

    if (type === 'credits') {
        const creditsFulfilment = await fulfilDocCreditPurchase({
            provider: PROVIDER,
            providerPaymentId: paymentIntentId,
            fallback: {
                userId,
                credits,
                amountCents: session.amount_total ?? 0,
            },
        })
        const granted = Boolean(creditsFulfilment)

        // Track the purchased credit package so generation can use its per-document
        // credit cost (only once, when the purchase actually fulfils here).
        const planId = parseInt((productId || '').replace('credit-', ''))
        if (granted && !Number.isNaN(planId) && !Number.isNaN(userId)) {
            await recordCreditPackagePurchase({
                userId,
                planId,
                provider: PROVIDER,
                checkoutId: metadata.checkoutId ?? null,
                providerPaymentId: paymentIntentId,
            })
        }
        return {
            handled: granted,
            kind: 'credits',
            reason: granted ? 'credits granted' : 'credits already fulfilled',
            paymentId: paymentIntentId,
            userId: Number.isNaN(userId) ? undefined : userId,
        }
    }

    if (type === 'subscription' && session.subscription) {
        const planIdFromMetadata = parseInt(metadata.planId || '')
        const planIdFromProductId = parseInt((productId || '').replace('plan-', ''))
        const planId = Number.isNaN(planIdFromMetadata) ? planIdFromProductId : planIdFromMetadata

        if (Number.isNaN(planId)) {
            console.error('Invalid subscription plan ID in checkout metadata', {
                sessionId: session.id,
                productId,
                planIdFromMetadata: metadata.planId,
            })
            return ignored('invalid subscription plan id in checkout metadata')
        }

        // For subscriptions the payment intent may be absent on the session when
        // the first invoice is still open - resolve it like the original webhook did.
        let resolvedPaymentIntentId = paymentIntentId
        if (!resolvedPaymentIntentId) {
            try {
                const sub = (await stripe.subscriptions.retrieve(session.subscription as string)) as unknown as {
                    latest_invoice?: string | { id: string } | null
                }
                const latestInvoice = sub.latest_invoice
                if (latestInvoice) {
                    const invoice = (await stripe.invoices.retrieve(
                        typeof latestInvoice === 'string' ? latestInvoice : latestInvoice.id,
                    )) as unknown as { payment_intent?: string | null }
                    resolvedPaymentIntentId = (invoice.payment_intent as string) || null
                }
            } catch (error) {
                console.error('Failed to resolve first invoice payment intent:', error)
            }
        }

        const subscription = await fulfilDocSubscriptionPayment({
            provider: PROVIDER,
            providerSubscriptionId: session.subscription as string,
            providerPaymentId: resolvedPaymentIntentId,
            userId: Number.isNaN(userId) ? undefined : userId,
            planId,
            credits: Number.isNaN(credits) ? null : credits,
            amountCents: session.amount_total,
            periodStart: session.created,
        })

        return {
            handled: Boolean(subscription),
            kind: 'subscription',
            reason: subscription ? 'subscription activated' : 'subscription already fulfilled',
            paymentId: resolvedPaymentIntentId,
            userId: subscription?.userId,
        }
    }

    return ignored(`checkout session type "${type ?? 'unknown'}" is not handled`)
}

// ---------------------------------------------------------------------------
// Subscription lifecycle events
// ---------------------------------------------------------------------------

export async function handleSubscriptionUpdated(event: Stripe.Event): Promise<StripeFulfilmentResult> {
    // current_period_* were removed from the SDK v19 Subscription type (basil
    // API); the deployed account still sends them on the pinned API version.
    const subscription = event.data.object as unknown as {
        id: string
        status: string
        current_period_start?: number
        current_period_end?: number
    }

    await sql`
    UPDATE user_subscriptions
    SET status = ${subscription.status},
        current_period_start = to_timestamp(${subscription.current_period_start ?? Math.floor(Date.now() / 1000)}),
        current_period_end = to_timestamp(${subscription.current_period_end ?? Math.floor(Date.now() / 1000)}),
        updated_at = CURRENT_TIMESTAMP
    WHERE provider = ${PROVIDER} AND provider_subscription_id = ${subscription.id}
  `

    return {
        handled: true,
        kind: 'subscription',
        reason: `subscription status synced (${subscription.status})`,
    }
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<StripeFulfilmentResult> {
    await sql`
    UPDATE user_subscriptions
    SET status = 'canceled',
        updated_at = CURRENT_TIMESTAMP
    WHERE provider = ${PROVIDER} AND provider_subscription_id = ${subscription.id}
  `

    return { handled: true, kind: 'subscription', reason: 'subscription marked as canceled' }
}

// ---------------------------------------------------------------------------
// invoice.payment_succeeded - subscription renewals
// ---------------------------------------------------------------------------

export async function handleInvoicePaymentSucceeded(event: Stripe.Event): Promise<StripeFulfilmentResult> {
    const invoice = event.data.object as unknown as {
        subscription?: string | null
        billing_reason?: string | null
        payment_intent?: string | null
        amount_paid?: number
        period_start?: number
        created?: number
    }

    if (!invoice.subscription || invoice.billing_reason !== 'subscription_cycle') {
        return ignored('invoice is not a subscription renewal')
    }

    const subscription = await fulfilDocSubscriptionPayment({
        provider: PROVIDER,
        providerSubscriptionId: invoice.subscription,
        providerPaymentId: invoice.payment_intent || null,
        amountCents: invoice.amount_paid,
        periodStart: invoice.period_start ?? invoice.created ?? Math.floor(Date.now() / 1000),
    })

    return {
        handled: Boolean(subscription),
        kind: 'subscription',
        reason: subscription ? 'subscription renewal fulfilled' : 'renewal already fulfilled',
        paymentId: invoice.payment_intent || null,
        userId: subscription?.userId,
    }
}

// ---------------------------------------------------------------------------
// Event router - shared by the webhook endpoint and verify-on-return
// ---------------------------------------------------------------------------

/**
 * Run one Stripe event to completion. The caller awaits this and turns a
 * rejection into a non-2xx response, so Stripe retries failed deliveries
 * instead of losing them silently.
 */
export async function processStripeEvent(event: Stripe.Event, stripe: Stripe): Promise<StripeFulfilmentResult> {
    switch (event.type) {
        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent
            const attemptId = paymentIntent.metadata?.gatewayAttemptId
            if (attemptId) {
                await markPaymentGatewayAttempt(attemptId, 'succeeded', { providerReference: paymentIntent.id })
            }
            return await fulfilPaymentIntent(paymentIntent, stripe)
        }
        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent
            const attemptId = paymentIntent.metadata?.gatewayAttemptId
            if (attemptId) {
                await markPaymentGatewayAttempt(attemptId, 'failed', {
                    providerReference: paymentIntent.id,
                    failureCode: paymentIntent.last_payment_error?.code || 'stripe_payment_failed',
                })
            }
            return {
                handled: Boolean(attemptId),
                kind: 'payment_failed',
                reason: 'payment failed',
                paymentId: paymentIntent.id,
            }
        }
        case 'checkout.session.completed':
            return await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, stripe)
        case 'customer.subscription.updated':
            return await handleSubscriptionUpdated(event)
        case 'customer.subscription.deleted':
            return await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        case 'invoice.payment_succeeded':
            return await handleInvoicePaymentSucceeded(event)
        default:
            return ignored(`${event.type} is not handled`)
    }
}

// ---------------------------------------------------------------------------
// Pending-row writers used at checkout initiation
// ---------------------------------------------------------------------------

export async function recordPendingCreditPurchase(
    userId: number,
    paymentIntentId: string,
    amountCents: number,
    credits: number,
    checkoutId?: string | null,
): Promise<void> {
    await recordPendingDocCreditPurchase({
        userId,
        provider: PROVIDER,
        providerPaymentId: paymentIntentId,
        amountCents,
        credits,
        checkoutId: checkoutId ?? null,
    })
}

export async function recordPendingSubscription(
    userId: number,
    planId: number,
    stripeSubscriptionId: string,
    checkoutId?: string | null,
): Promise<void> {
    await recordPendingDocSubscription({
        userId,
        planId,
        provider: PROVIDER,
        providerSubscriptionId: stripeSubscriptionId,
        checkoutId: checkoutId ?? null,
    })
}
