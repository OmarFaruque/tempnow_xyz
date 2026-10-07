/**
 * Pure rotation policy for ordered payment gateways.
 *
 * The database code in `payment-rotation.ts` gathers per-provider state and
 * then delegates the actual "who gets this payment" decision to this module so
 * the rule can be unit tested without a database. See
 * `tests/payment-rotation.test.mjs`.
 *
 * Rules, in operator order:
 *  1. A gateway already attempted for the same checkout is skipped.
 *  2. A gateway that is auto-paused or in this customer's decline cooldown is skipped.
 *  3. A gateway whose configured quota is used up is skipped.
 *  4. The first remaining gateway receives the payment.
 *  5. When every remaining gateway is skipped only because its quota is used
 *     up, the round is complete: callers reset the quota windows and start a
 *     new round at the first provider again.
 */

export type ProviderQuotaState = {
    /** Configured quota for the current round; 0 means unlimited. */
    quota: number
    /** Successful charges plus live reservations inside the current quota window. */
    used: number
    /** Gateway paused automatically because of its recent failure rate. */
    autoPaused: boolean
    /** This customer was declined by the gateway inside the cooldown window. */
    customerCooldown: boolean
}

export const DEFAULT_PROVIDER_STATE: ProviderQuotaState = {
    quota: 0,
    used: 0,
    autoPaused: false,
    customerCooldown: false,
}

export type RotationUnavailableReason = 'none' | 'health' | 'cooldown'

export type RotationDecision =
    | { outcome: 'assign'; gateway: string }
    | { outcome: 'start-new-round'; gateways: string[] }
    | { outcome: 'unavailable'; reason: RotationUnavailableReason }

export function isQuotaExhausted(state: ProviderQuotaState): boolean {
    return state.quota > 0 && state.used >= state.quota
}

/**
 * Decide where the next payment attempt should go.
 *
 * @param order  Active gateways in operator order.
 * @param tried  Gateways already attempted for this checkout (never retried).
 * @param states Per-gateway quota/health state, keyed by gateway id.
 */
export function selectNextGateway(
    order: readonly string[],
    tried: ReadonlySet<string>,
    states: Readonly<Record<string, ProviderQuotaState>>,
): RotationDecision {
    const candidates = order.filter((gateway) => !tried.has(gateway))
    if (candidates.length === 0) return { outcome: 'unavailable', reason: 'none' }

    const quotaBlocked: string[] = []
    let blockedByCooldown = false
    let blockedByHealth = false

    for (const gateway of candidates) {
        const state = states[gateway] ?? DEFAULT_PROVIDER_STATE
        if (state.autoPaused) {
            blockedByHealth = true
            continue
        }
        if (state.customerCooldown) {
            blockedByCooldown = true
            continue
        }
        if (isQuotaExhausted(state)) {
            quotaBlocked.push(gateway)
            continue
        }
        return { outcome: 'assign', gateway }
    }

    // A completed round restarts from the first provider instead of failing.
    if (quotaBlocked.length > 0) return { outcome: 'start-new-round', gateways: quotaBlocked }
    if (blockedByCooldown) return { outcome: 'unavailable', reason: 'cooldown' }
    if (blockedByHealth) return { outcome: 'unavailable', reason: 'health' }
    return { outcome: 'unavailable', reason: 'none' }
}

/**
 * Gateways whose quota window should be rolled over when a new round starts.
 * Providers without a configured quota are never part of the cycle.
 */
export function gatewaysForRoundReset<Gateway extends string>(
    order: readonly Gateway[],
    states: Readonly<Record<string, ProviderQuotaState>>,
): Gateway[] {
    return order.filter((gateway) => {
        const state = states[gateway] ?? DEFAULT_PROVIDER_STATE
        return state.quota > 0
    })
}

export function unavailableMessage(reason: RotationUnavailableReason): string {
    if (reason === 'health') {
        return 'All payment processors are temporarily paused while we review recent failures. Please try again shortly.'
    }
    if (reason === 'cooldown') {
        return 'Your recent payment attempts were declined. Please try again later or use a different card.'
    }
    return 'No active payment processors are available for this checkout.'
}