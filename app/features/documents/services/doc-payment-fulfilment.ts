/**
 * Doc-forge purchase fulfilment - shared by every payment provider.
 *
 * The document service sells credit packages (one-off) and subscriptions
 * (recurring), and its records live in `transactions`, `user_credits` and
 * `user_subscriptions`. Only Stripe could write those tables before; now the
 * storefront can be paid through the configured gateway rotation, so the
 * bookkeeping lives here and every provider webhook calls into this module.
 *
 * Two identifiers resolve a payment to its purchase:
 *
 *   * `provider` + `provider_payment_id` - the provider's own payment id
 *     (stripe `pi_...`, mollie `tr_...`, paddle `txn_...`). Renewals and
 *     retried deliveries resolve through this.
 *   * `checkout_id` - our reference (`doc-forge:<user id>:<uuid>`) sent to the
 *     provider as metadata and echoed back on its webhook. Providers that
 *     report a different id on the webhook than they returned at creation
 *     (Lemon Squeezy, Viva) are matched through this.
 *
 * Everything is idempotent: fulfilment consumes the pending `transactions` /
 * `user_subscriptions` row exactly once, and credits are granted only by the
 * call that flips that row to `completed`.
 */
import { sql } from '@/core/db-raw'
import { markPaymentGatewayAttempt } from '@/core/payment-rotation'

export type DocPaymentProvider = 'stripe' | 'mollie' | 'paddle' | 'viva' | 'lemonsqueezy' | 'paypal' | 'checkoutcom'

/** Marker that tells a gateway webhook its metadata belongs to a doc purchase. */
export const DOC_PURCHASE_TYPE = 'doc-purchase'

export type DocPurchaseKind = 'credits' | 'subscription'

export interface DocPurchaseMetadata {
    type: string
    purchaseKind: DocPurchaseKind | null
    checkoutId: string | null
    userId: number | null
    planId: number | null
    credits: number | null
    /** The routed attempt this purchase belongs to, so its status can be closed. */
    gatewayAttemptId: string | null
}

function toSafeInteger(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null
    const parsed = Number(value)
    return Number.isSafeInteger(parsed) ? parsed : null
}

/**
 * Read the metadata we attach at checkout time. Providers hand it back in
 * different shapes (an object, a JSON string, or a nested `custom_data`), so
 * callers normalise the blob first and this returns null for anything that is
 * not a doc-forge purchase.
 */
export function readDocPurchaseMetadata(raw: unknown): DocPurchaseMetadata | null {
    let value: any = raw
    if (typeof value === 'string') {
        try {
            value = JSON.parse(value)
        } catch {
            return null
        }
    }
    if (!value || typeof value !== 'object' || value.type !== DOC_PURCHASE_TYPE) return null

    const kind = value.purchaseKind === 'subscription' ? 'subscription' : value.purchaseKind === 'credits' ? 'credits' : null
    return {
        type: DOC_PURCHASE_TYPE,
        purchaseKind: kind,
        checkoutId: typeof value.checkoutId === 'string' && value.checkoutId ? value.checkoutId : null,
        userId: toSafeInteger(value.userId),
        planId: toSafeInteger(value.planId),
        credits: toSafeInteger(value.credits),
        gatewayAttemptId:
            typeof value.gatewayAttemptId === 'string' && /^[0-9a-f-]{36}$/i.test(value.gatewayAttemptId)
                ? value.gatewayAttemptId
                : null,
    }
}

/** True when a webhook payload is one of our doc-forge purchases. */
export function isDocPurchasePayload(raw: unknown): boolean {
    return readDocPurchaseMetadata(raw) !== null
}

/** Add credits to a customer's balance (insert-or-increment). */
export async function grantDocCredits(userId: number, credits: number): Promise<void> {
    if (!Number.isFinite(credits) || credits <= 0) return
    await sql`
    INSERT INTO user_credits (user_id, credits_available, credits_used)
    VALUES (${userId}, ${credits}, 0)
    ON CONFLICT (user_id)
    DO UPDATE SET
      credits_available = user_credits.credits_available + ${credits},
      updated_at = CURRENT_TIMESTAMP
  `
}

/** Pending ledger row for a one-off credit purchase, written at initiation. */
export async function recordPendingDocCreditPurchase(input: {
    userId: number
    provider: string
    amountCents: number
    credits: number
    checkoutId?: string | null
    providerPaymentId?: string | null
    transactionType?: string
}): Promise<void> {
    await sql`
    INSERT INTO transactions (user_id, provider, provider_payment_id, checkout_id, amount_cents, credits_purchased, transaction_type, status)
    SELECT ${input.userId}, ${input.provider}, ${input.providerPaymentId ?? null}, ${input.checkoutId ?? null},
           ${input.amountCents}, ${input.credits}, ${input.transactionType ?? 'credits'}, 'pending'
    WHERE NOT EXISTS (
      SELECT 1 FROM transactions
      WHERE (${input.checkoutId ?? null}::text IS NOT NULL AND checkout_id = ${input.checkoutId ?? null})
         OR (${input.providerPaymentId ?? null}::text IS NOT NULL AND provider_payment_id = ${input.providerPaymentId ?? null})
    )
  `
}

/** Pending subscription row for a recurring purchase, written at initiation. */
export async function recordPendingDocSubscription(input: {
    userId: number
    planId: number
    provider: string
    checkoutId?: string | null
    providerSubscriptionId?: string | null
}): Promise<void> {
    await sql`
    INSERT INTO user_subscriptions (user_id, plan_id, provider, provider_subscription_id, checkout_id, status)
    SELECT ${input.userId}, ${input.planId}, ${input.provider}, ${input.providerSubscriptionId ?? null}, ${input.checkoutId ?? null}, 'pending'
    WHERE NOT EXISTS (
      SELECT 1 FROM user_subscriptions
      WHERE (${input.checkoutId ?? null}::text IS NOT NULL AND checkout_id = ${input.checkoutId ?? null})
         OR (${input.providerSubscriptionId ?? null}::text IS NOT NULL AND provider_subscription_id = ${input.providerSubscriptionId ?? null})
    )
  `
}

/**
 * Remember which credit package a customer bought. The per-document credit
 * cost (`getCreditsPerDocumentForUser`) is read from the plan the customer's
 * active `user_subscriptions` row points at, so a credit purchase has to leave
 * that association behind - whichever provider took the money.
 */
export async function recordCreditPackagePurchase(input: {
    userId: number
    planId: number
    provider: string
    checkoutId?: string | null
    providerPaymentId?: string | null
}): Promise<void> {
    await sql`
    INSERT INTO user_subscriptions (user_id, plan_id, provider, provider_subscription_id, checkout_id, status)
    SELECT ${input.userId}, ${input.planId}, ${input.provider}, ${input.providerPaymentId ?? null}, ${input.checkoutId ?? null}, 'active'
    WHERE NOT EXISTS (
      SELECT 1 FROM user_subscriptions
      WHERE user_id = ${input.userId} AND plan_id = ${input.planId} AND status = 'active'
    )
  `
}

export interface DocCreditFulfilment {
    userId: number
    credits: number
}

/**
 * Fulfil a one-off credit purchase: consume the pending `transactions` row,
 * mark it completed and grant its credits. Returns null when there is nothing
 * left to fulfil (already completed, or no row and no usable fallback).
 */
export async function fulfilDocCreditPurchase(opts: {
    provider: string
    providerPaymentId?: string | null
    checkoutId?: string | null
    /** Used when the pending row was never written (e.g. metadata-only webhook). */
    fallback?: { userId: number; credits: number; amountCents: number } | null
}): Promise<DocCreditFulfilment | null> {
    const paymentId = opts.providerPaymentId || null
    const checkoutId = opts.checkoutId || null

    let rows: Array<{ user_id: number; credits_purchased: number | null }> = []

    if (paymentId) {
        rows = (await sql`
      UPDATE transactions
      SET status = 'completed'
      WHERE status = 'pending' AND provider = ${opts.provider} AND provider_payment_id = ${paymentId}
      RETURNING user_id, credits_purchased
    `) as unknown as Array<{ user_id: number; credits_purchased: number | null }>
    }

    if (rows.length === 0 && checkoutId) {
        rows = (await sql`
      UPDATE transactions
      SET status = 'completed',
          provider_payment_id = COALESCE(${paymentId}, provider_payment_id)
      WHERE status = 'pending' AND checkout_id = ${checkoutId}
      RETURNING user_id, credits_purchased
    `) as unknown as Array<{ user_id: number; credits_purchased: number | null }>
    }

    if (rows.length > 0) {
        const credits = Number(rows[0].credits_purchased ?? 0)
        await grantDocCredits(rows[0].user_id, credits)
        return { userId: rows[0].user_id, credits }
    }

    const alreadyFulfilled = (await sql`
    SELECT 1 FROM transactions
    WHERE status = 'completed'
      AND ((${paymentId}::text IS NOT NULL AND provider = ${opts.provider} AND provider_payment_id = ${paymentId})
        OR (${checkoutId}::text IS NOT NULL AND checkout_id = ${checkoutId}))
    LIMIT 1
  `) as unknown as unknown[]

    if (alreadyFulfilled.length > 0) return null

    const fallback = opts.fallback
    if (!fallback || !Number.isSafeInteger(fallback.userId) || !Number.isFinite(fallback.credits)) return null

    const inserted = (await sql`
    INSERT INTO transactions (user_id, provider, provider_payment_id, checkout_id, amount_cents, credits_purchased, transaction_type, status)
    SELECT ${fallback.userId}, ${opts.provider}, ${paymentId}, ${checkoutId}, ${fallback.amountCents}, ${fallback.credits}, 'credits', 'completed'
    WHERE NOT EXISTS (
      SELECT 1 FROM transactions
      WHERE (${paymentId}::text IS NOT NULL AND provider = ${opts.provider} AND provider_payment_id = ${paymentId})
         OR (${checkoutId}::text IS NOT NULL AND checkout_id = ${checkoutId})
    )
    RETURNING id
  `) as unknown as Array<{ id: number }>

    if (inserted.length === 0) return null

    await grantDocCredits(fallback.userId, fallback.credits)
    return { userId: fallback.userId, credits: fallback.credits }
}

/**
 * Fulfil a subscription payment (first invoice or renewal) for any provider:
 * activate/renew the `user_subscriptions` row and grant the monthly credits
 * exactly once per provider payment id.
 */
export async function fulfilDocSubscriptionPayment(opts: {
    provider: string
    /** The provider's own subscription id, when it has one (Stripe, Paddle). */
    providerSubscriptionId?: string | null
    providerPaymentId?: string | null
    /** Our `doc-forge:<user id>:<uuid>` reference, for providers that sell a prepaid month. */
    checkoutId?: string | null
    userId?: number | null
    planId?: number | null
    credits?: number | null
    amountCents?: number | null
    periodStart: number
}): Promise<{ userId: number } | null> {
    const providerSubscriptionId = opts.providerSubscriptionId || null
    const checkoutId = opts.checkoutId || null
    let row: { id: number; user_id: number; plan_id: number | null } | undefined

    if (providerSubscriptionId) {
        ;[row] = (await sql`
      SELECT id, user_id, plan_id FROM user_subscriptions
      WHERE provider = ${opts.provider} AND provider_subscription_id = ${providerSubscriptionId}
      LIMIT 1
    `) as Array<{ id: number; user_id: number; plan_id: number | null }>
    }

    if (!row && checkoutId) {
        ;[row] = (await sql`
      SELECT id, user_id, plan_id FROM user_subscriptions
      WHERE checkout_id = ${checkoutId}
      ORDER BY created_at DESC
      LIMIT 1
    `) as Array<{ id: number; user_id: number; plan_id: number | null }>
    }

    if (!row) {
        if (!opts.userId || !opts.planId) return null // cannot resolve this subscription
        const inserted = (await sql`
      INSERT INTO user_subscriptions (user_id, plan_id, provider, provider_subscription_id, checkout_id, status)
      SELECT ${opts.userId}, ${opts.planId}, ${opts.provider}, ${providerSubscriptionId}, ${checkoutId}, 'pending'
      WHERE NOT EXISTS (
        SELECT 1 FROM user_subscriptions
        WHERE (${providerSubscriptionId}::text IS NOT NULL AND provider = ${opts.provider} AND provider_subscription_id = ${providerSubscriptionId})
           OR (${checkoutId}::text IS NOT NULL AND checkout_id = ${checkoutId})
      )
      RETURNING id, user_id, plan_id
    `) as unknown as Array<{ id: number; user_id: number; plan_id: number | null }>
        if (inserted.length === 0) return null
        row = inserted[0]
    }

    const planId = opts.planId ?? row.plan_id

    // The plan in our database is the authority on how many credits a month
    // buys: metadata from a provider (or a customer's custom data) never is.
    let credits = opts.credits
    if (planId) {
        const [plan] = (await sql`
      SELECT credits_per_month FROM subscription_plans WHERE id = ${planId} LIMIT 1
    `) as Array<{ credits_per_month: number | null }>
        if (plan?.credits_per_month != null) credits = Number(plan.credits_per_month)
    }

    // Ledger guard: whoever records the completed transaction first fulfils.
    if (opts.providerPaymentId) {
        const amountCents = opts.amountCents ?? null
        const inserted = (await sql`
      INSERT INTO transactions (user_id, provider, provider_payment_id, checkout_id, amount_cents, transaction_type, status)
      SELECT ${row.user_id}, ${opts.provider}, ${opts.providerPaymentId}, ${checkoutId}, ${amountCents}, 'subscription', 'completed'
      WHERE NOT EXISTS (
        SELECT 1 FROM transactions
        WHERE provider = ${opts.provider} AND provider_payment_id = ${opts.providerPaymentId}
      )
      RETURNING id
    `) as unknown as Array<{ id: number }>
        if (inserted.length === 0) return null // already fulfilled by another event
    }

    await sql`
    UPDATE user_subscriptions
    SET plan_id = COALESCE(${planId ?? null}, plan_id),
        status = 'active',
        current_period_start = to_timestamp(${opts.periodStart}),
        current_period_end = to_timestamp(${opts.periodStart}) + INTERVAL '1 month',
        provider_subscription_id = COALESCE(${providerSubscriptionId}, provider_subscription_id),
        checkout_id = COALESCE(checkout_id, ${checkoutId}),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${row.id}
  `

    await grantDocCredits(row.user_id, Number(credits ?? 0))
    return { userId: row.user_id }
}

export interface DocFulfilmentOutcome {
    handled: boolean
    kind: 'credits' | 'subscription' | 'none'
    reason: string
    userId?: number
}

/**
 * Entry point for provider webhooks: fulfil whichever doc-forge purchase the
 * payment belongs to, using the metadata we sent at checkout plus the
 * provider's payment/subscription id.
 *
 * Security: metadata that arrives with a payment is only ever used to *find*
 * the purchase. The amount the provider actually took is checked against the
 * plan's price before any metadata-supplied purchase is acted on, so a
 * tampered metadata blob cannot buy credits at someone else's price.
 */
export async function fulfilDocPurchase(input: {
    provider: string
    providerPaymentId?: string | null
    subscriptionId?: string | null
    /** Our reference, when a confirm-on-return route has it but no metadata blob. */
    checkoutId?: string | null
    metadata?: unknown
    amountCents?: number | null
    periodStart?: number
}): Promise<DocFulfilmentOutcome> {
    const meta = readDocPurchaseMetadata(input.metadata)
    const checkoutId = meta?.checkoutId ?? input.checkoutId ?? null
    const paymentId = input.providerPaymentId || null
    // Every purchase records the routed attempt it came from, so the
    // storefront can tell "waiting for the provider" from "paid" without
    // depending on each provider's webhook shape.
    const closeAttempt = async () => {
        if (meta?.gatewayAttemptId) {
            await markPaymentGatewayAttempt(meta.gatewayAttemptId, 'succeeded', { providerReference: paymentId })
        }
    }
    const amountCents = Math.max(0, Math.round(input.amountCents ?? 0))
    // What the caller *says* was bought (server-set metadata), and what our own
    // pending row says. The ledger wins for deciding a subscription: a payment
    // can only activate or renew a plan the storefront recorded at initiation.
    const declaredKind = meta?.purchaseKind ?? null
    const ledgerKind = checkoutId ? await readPendingDocPurchaseKind(input.provider, checkoutId) : null
    const pendingKind = declaredKind ?? ledgerKind

    // What our own pricing says this purchase costs (null = unknown plan).
    const planPriceCents = await readPlanPriceCents(meta?.planId ?? null)
    const amountIsTrusted = (planId: number | null): boolean =>
        planId !== null && planPriceCents !== null && amountCents >= planPriceCents

    // One-off credit purchase -------------------------------------------------
    if (pendingKind !== 'subscription') {
        // 1a. A pending row written at checkout initiation is authoritative.
        const fromLedger = await fulfilDocCreditPurchase({
            provider: input.provider,
            providerPaymentId: paymentId,
            checkoutId,
        })
        if (fromLedger) {
            if (meta?.planId && amountIsTrusted(meta.planId)) {
                await recordCreditPackagePurchase({
                    userId: fromLedger.userId,
                    planId: meta.planId,
                    provider: input.provider,
                    checkoutId: meta.checkoutId,
                    providerPaymentId: paymentId,
                })
            }
            await closeAttempt()
            return { handled: true, kind: 'credits', reason: 'credits granted', userId: fromLedger.userId }
        }

        // 1b. No pending row (provider never got our initiation write, or the
        // row was already consumed). Only trust the metadata when the money
        // taken covers the plan the metadata names.
        if (meta?.userId && meta.credits != null && meta.credits > 0 && amountIsTrusted(meta.planId)) {
            const fromMetadata = await fulfilDocCreditPurchase({
                provider: input.provider,
                providerPaymentId: paymentId,
                checkoutId: meta.checkoutId,
                fallback: { userId: meta.userId, credits: meta.credits, amountCents },
            })
            if (fromMetadata) {
                await recordCreditPackagePurchase({
                    userId: fromMetadata.userId,
                    planId: meta.planId as number,
                    provider: input.provider,
                    checkoutId: meta.checkoutId,
                    providerPaymentId: paymentId,
                })
                await closeAttempt()
                return { handled: true, kind: 'credits', reason: 'credits granted', userId: fromMetadata.userId }
            }
        } else if (meta?.userId && meta.credits != null && meta.credits > 0) {
            console.error(
                `Doc fulfilment: refusing metadata-only credit purchase (${input.provider}, ${paymentId ?? meta.checkoutId ?? 'unknown reference'}) - ` +
                    `paid ${amountCents} does not cover plan ${meta.planId ?? 'unknown'}`,
            )
        }
    }

    // Subscription payment (first invoice or, on Stripe, a renewal) -----------
    const subscriptionId = input.subscriptionId || null
    // A real provider subscription id (Stripe first payment and renewals) or a
    // pending subscription row we wrote ourselves. Metadata alone is not enough.
    const canBeSubscription = ledgerKind === 'subscription' || Boolean(subscriptionId)
    const hasSubscriptionTarget = Boolean(subscriptionId || checkoutId)

    if (canBeSubscription && hasSubscriptionTarget) {
        const subscription = await fulfilDocSubscriptionPayment({
            provider: input.provider,
            providerSubscriptionId: subscriptionId,
            providerPaymentId: paymentId,
            checkoutId,
            userId: meta?.userId ?? null,
            planId: meta?.planId ?? null,
            credits: meta?.credits ?? null,
            amountCents,
            periodStart: input.periodStart ?? Math.floor(Date.now() / 1000),
        })

        if (subscription) {
            await closeAttempt()
            return { handled: true, kind: 'subscription', reason: 'subscription activated/renewed', userId: subscription.userId }
        }
    }

    // A redelivery of a purchase we already fulfilled is not a failure: the
    // payment this call describes has been fulfilled, so report it as handled
    // (and let the provider stop retrying).
    const settled = await docPurchaseAlreadyFulfilled({
        provider: input.provider,
        providerPaymentId: paymentId,
        providerSubscriptionId: subscriptionId,
        checkoutId,
    })
    if (settled) {
        return { handled: true, kind: pendingKind ?? 'none', reason: 'already fulfilled' }
    }

    return { handled: false, kind: 'none', reason: 'no matching doc-forge purchase' }
}

/**
 * Has the payment this call describes already been recorded as fulfilled?
 * Checked after the fulfilment attempts so a provider redelivering the same
 * event (or a second event about the same payment) is a clean no-op.
 */
async function docPurchaseAlreadyFulfilled(input: {
    provider: string
    providerPaymentId: string | null
    providerSubscriptionId: string | null
    checkoutId: string | null
}): Promise<boolean> {
    if (!input.providerPaymentId && !input.providerSubscriptionId && !input.checkoutId) return false

    const rows = (await sql`
    SELECT 1 FROM transactions
    WHERE provider = ${input.provider}
      AND ((${input.providerPaymentId}::text IS NOT NULL AND provider_payment_id = ${input.providerPaymentId})
        OR (${input.checkoutId}::text IS NOT NULL AND checkout_id = ${input.checkoutId}))
    LIMIT 1
    UNION ALL
    SELECT 1 FROM user_subscriptions
    WHERE provider = ${input.provider} AND status = 'active'
      AND ((${input.providerSubscriptionId}::text IS NOT NULL AND provider_subscription_id = ${input.providerSubscriptionId})
        OR (${input.checkoutId}::text IS NOT NULL AND checkout_id = ${input.checkoutId}))
    LIMIT 1
  `) as unknown as unknown[]

    return rows.length > 0
}

/**
 * What kind of purchase a checkout reference belongs to, read from the pending
 * rows written at initiation (used by confirm-on-return routes that have our
 * reference but not the metadata blob).
 */
async function readPendingDocPurchaseKind(
    provider: string,
    checkoutId: string,
): Promise<DocPurchaseKind | null> {
    const credits = (await sql`
    SELECT 1 FROM transactions
    WHERE checkout_id = ${checkoutId} AND provider = ${provider}
    LIMIT 1
  `) as unknown as unknown[]
    if (credits.length > 0) return 'credits'

    const subscriptions = (await sql`
    SELECT 1 FROM user_subscriptions
    WHERE checkout_id = ${checkoutId} AND provider = ${provider}
    LIMIT 1
  `) as unknown as unknown[]
    if (subscriptions.length > 0) return 'subscription'

    return null
}

/** Price of a plan in our own database, in cents (null when unknown). */
async function readPlanPriceCents(planId: number | null): Promise<number | null> {
    if (!planId) return null
    const [plan] = (await sql`
    SELECT COALESCE(package_price_cents, price_cents) AS price_cents
    FROM subscription_plans WHERE id = ${planId} LIMIT 1
  `) as Array<{ price_cents: number | null }>
    return plan?.price_cents != null ? Number(plan.price_cents) : null
}
