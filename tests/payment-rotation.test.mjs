/**
 * Rotation policy tests.
 *
 * These cover the operator-facing rule that the checkout must alternate
 * between the configured gateways (Square, Paddle, Square, Paddle, ...) and
 * that a completed round restarts at the first gateway instead of failing.
 *
 * Run with: npm test
 */
import test from 'node:test'
import assert from 'node:assert/strict'

import {
    gatewaysForRoundReset,
    isQuotaExhausted,
    selectNextGateway,
} from '../core/payment-selection.ts'

const state = (quota, used, extra = {}) => ({ quota, used, autoPaused: false, customerCooldown: false, ...extra })

test('each provider serves one payment per round, then the round restarts', () => {
    const order = ['square', 'paddle']
    const tried = new Set()

    // Round 1: nothing used yet -> the first provider in operator order.
    let states = { square: state(1, 0), paddle: state(1, 0) }
    let decision = selectNextGateway(order, tried, states)
    assert.equal(decision.outcome, 'assign')
    assert.equal(decision.gateway, 'square')

    // Square's single payment is spent -> Paddle is next, not Square again.
    states = { square: state(1, 1), paddle: state(1, 0) }
    decision = selectNextGateway(order, tried, states)
    assert.equal(decision.outcome, 'assign')
    assert.equal(decision.gateway, 'paddle')

    // Both used up -> the caller resets the quota windows and starts round 2.
    states = { square: state(1, 1), paddle: state(1, 1) }
    decision = selectNextGateway(order, tried, states)
    assert.equal(decision.outcome, 'start-new-round')
    assert.deepEqual(decision.gateways, ['square', 'paddle'])

    // Round 2 starts at the first provider again.
    states = { square: state(1, 0), paddle: state(1, 0) }
    decision = selectNextGateway(order, tried, states)
    assert.equal(decision.outcome, 'assign')
    assert.equal(decision.gateway, 'square')
})

test('higher quotas keep serving the same provider until its quota is finished', () => {
    const order = ['square', 'paddle']

    for (const used of [0, 1, 2]) {
        const decision = selectNextGateway(order, new Set(), { square: state(3, used), paddle: state(3, 0) })
        assert.equal(decision.gateway, 'square', `expected square at ${used}/3`)
    }

    const decision = selectNextGateway(order, new Set(), { square: state(3, 3), paddle: state(3, 0) })
    assert.equal(decision.gateway, 'paddle')
})

test('a provider without a quota (0 = unlimited) never exhausts', () => {
    assert.equal(isQuotaExhausted(state(0, 999)), false)
    const decision = selectNextGateway(['square', 'paddle'], new Set(), { square: state(0, 500), paddle: state(0, 0) })
    assert.equal(decision.gateway, 'square')
    assert.deepEqual(gatewaysForRoundReset(['square', 'paddle'], { square: state(0, 5), paddle: state(2, 2) }), ['paddle'])
})

test('a provider already tried for this checkout is never reused', () => {
    const decision = selectNextGateway(['square', 'paddle'], new Set(['square']), { square: state(1, 0), paddle: state(1, 0) })
    assert.equal(decision.outcome, 'assign')
    assert.equal(decision.gateway, 'paddle')
})

test('auto-paused and cooled-down providers are skipped in favour of the next healthy one', () => {
    const paused = selectNextGateway(['square', 'paddle'], new Set(), {
        square: state(1, 0, { autoPaused: true }),
        paddle: state(1, 0),
    })
    assert.equal(paused.gateway, 'paddle')

    const cooled = selectNextGateway(['square', 'paddle'], new Set(), {
        square: state(1, 0, { customerCooldown: true }),
        paddle: state(1, 0),
    })
    assert.equal(cooled.gateway, 'paddle')
})

test('every provider blocked by quota restarts the round; health/cooldown blocks do not', () => {
    const quotaOnly = selectNextGateway(['square', 'paddle'], new Set(), { square: state(1, 2), paddle: state(1, 3) })
    assert.equal(quotaOnly.outcome, 'start-new-round')

    const unhealthy = selectNextGateway(['square', 'paddle'], new Set(), {
        square: state(1, 0, { autoPaused: true }),
        paddle: state(1, 0, { autoPaused: true }),
    })
    assert.equal(unhealthy.outcome, 'unavailable')
    assert.equal(unhealthy.reason, 'health')

    const cooled = selectNextGateway(['square', 'paddle'], new Set(), {
        square: state(1, 0, { customerCooldown: true }),
        paddle: state(1, 0, { customerCooldown: true }),
    })
    assert.equal(cooled.outcome, 'unavailable')
    assert.equal(cooled.reason, 'cooldown')
})

test('a checkout that already tried every provider reports no candidate', () => {
    const decision = selectNextGateway(['square', 'paddle'], new Set(['square', 'paddle']), {})
    assert.equal(decision.outcome, 'unavailable')
    assert.equal(decision.reason, 'none')
})

test('a finished round restarts at the first provider instead of failing the checkout', () => {
    // Square and Paddle each served one checkout in round 1 and both quotas are
    // used up - this is what brings the round to its end.
    const order = ['square', 'paddle']
    let states = { square: state(1, 1), paddle: state(1, 1) }
    let decision = selectNextGateway(order, new Set(), states)
    assert.equal(decision.outcome, 'start-new-round')

    // The caller rolls every configured window over (and releases the usage the
    // finished round left behind, including its still-live reservations - see
    // countQuotaWindowUsage), then decides again. Square must be assigned, not
    // "No healthy payment processors are available right now".
    states = { square: state(1, 0), paddle: state(1, 0) }
    decision = selectNextGateway(order, new Set(), states)
    assert.equal(decision.outcome, 'assign')
    assert.equal(decision.gateway, 'square')

    // Round 2 then alternates exactly like round 1 did.
    states = { square: state(1, 1), paddle: state(1, 0) }
    decision = selectNextGateway(order, new Set(), states)
    assert.equal(decision.outcome, 'assign')
    assert.equal(decision.gateway, 'paddle')

    // ... and the round is complete again, restarting at Square.
    states = { square: state(1, 1), paddle: state(1, 1) }
    assert.equal(selectNextGateway(order, new Set(), states).outcome, 'start-new-round')
})
