import 'server-only'

import { createHash, randomUUID } from 'node:crypto'
import { sql } from '@/core/db-raw'
import { fetchSetting } from '@/core/data-store'
import {
    getProductGatewayOrder,
    getRetryLimit,
    PAYMENT_GATEWAYS,
    type PaymentGatewayId,
    type PaymentProduct,
} from '@/core/payment-gateways'
import {
    gatewaysForRoundReset,
    selectNextGateway,
    unavailableMessage,
    type ProviderQuotaState,
} from '@/core/payment-selection'

const RESERVATION_MINUTES = 30
const ROUTING_LOCK_NAMESPACE = 16392
const ROUTING_LOCK_KEY = 80421

export type GatewayAttemptStatus = 'reserved' | 'pending' | 'failed' | 'succeeded' | 'expired'

export interface PaymentGatewayAttempt {
    id: string
    checkoutId: string
    product: PaymentProduct
    gateway: PaymentGatewayId
    attemptNumber: number
    status: GatewayAttemptStatus
    providerReference: string | null
    createdAt: string
    expiresAt: string
}

export interface PublicGatewayAttempt {
    id: string
    checkoutId: string
    product: PaymentProduct
    provider: PaymentGatewayId
    attemptNumber: number
    maxAttempts: number
    status: GatewayAttemptStatus
}

export class PaymentRoutingError extends Error {
    constructor(
        message: string,
        readonly code: 'NO_GATEWAY_AVAILABLE' | 'RETRY_LIMIT' | 'PAYMENT_ALREADY_COMPLETE' | 'ATTEMPT_NOT_FOUND' | 'INVALID_ATTEMPT',
    ) {
        super(message)
        this.name = 'PaymentRoutingError'
    }
}

type AllocationInput = {
    checkoutId: string
    product: PaymentProduct
    customerId?: string | number | null
    customerEmail?: string | null
}

type DbAttempt = {
    id: string
    checkout_id: string
    product: PaymentProduct
    gateway: PaymentGatewayId
    customer_key: string
    attempt_number: number
    status: GatewayAttemptStatus
    provider_reference: string | null
    created_at: string | Date
    expires_at: string | Date
}

function toIso(value: string | Date): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function toPublicAttempt(attempt: DbAttempt, maxRetries: number): PublicGatewayAttempt {
    return {
        id: attempt.id,
        checkoutId: attempt.checkout_id,
        product: attempt.product,
        provider: attempt.gateway,
        attemptNumber: attempt.attempt_number,
        maxAttempts: maxRetries + 1,
        status: attempt.status,
    }
}

function hashCustomerKey(customerId?: string | number | null, customerEmail?: string | null): string {
    const stableIdentity = String(customerId ?? customerEmail ?? 'anonymous').trim().toLowerCase()
    return createHash('sha256').update(stableIdentity || 'anonymous').digest('hex')
}

function asNonNegativeInteger(value: unknown, fallback = 0): number {
    const number = Number(value)
    return Number.isSafeInteger(number) && number >= 0 ? number : fallback
}

function asPositiveInteger(value: unknown, fallback: number, maximum: number): number {
    const number = Number(value)
    return Number.isSafeInteger(number) && number > 0 ? Math.min(number, maximum) : fallback
}

function readAutoPauseSettings(payment: Record<string, any>) {
    return {
        enabled: payment.autoPauseEnabled !== false,
        failureRate: Math.min(100, Math.max(1, Number(payment.autoPauseFailureRate) || 50)),
        minimumAttempts: asPositiveInteger(payment.autoPauseMinAttempts, 10, 1000),
        windowMinutes: asPositiveInteger(payment.autoPauseWindowMinutes, 15, 24 * 60),
        durationMinutes: asPositiveInteger(payment.autoPauseDurationMinutes, 15, 24 * 60),
        userCooldownMinutes: asNonNegativeInteger(payment.userCooldownMinutes, 30),
    }
}

function readQuotaResetDate(providerSettings: Record<string, any> | null): string {
    const resetAt = providerSettings?.quotaResetAt
    if (typeof resetAt === 'string' && !Number.isNaN(Date.parse(resetAt))) return resetAt
    return '1970-01-01T00:00:00.000Z'
}

function mapAttempt(row: DbAttempt): PaymentGatewayAttempt {
    return {
        id: row.id,
        checkoutId: row.checkout_id,
        product: row.product,
        gateway: row.gateway,
        attemptNumber: row.attempt_number,
        status: row.status,
        providerReference: row.provider_reference,
        createdAt: toIso(row.created_at),
        expiresAt: toIso(row.expires_at),
    }
}

async function getPaymentSettings(): Promise<Record<string, any>> {
    const value = await fetchSetting('payment')
    return value && typeof value === 'object' ? value as Record<string, any> : {}
}

type RotationExecutor = <T extends readonly any[] = any[]>(
    strings: TemplateStringsArray,
    ...values: any[]
) => PromiseLike<T>

/**
 * The rotation ledger lives in its own migration (0010). When a deployment has
 * not run that migration yet the checkout would fail with "relation does not
 * exist" and the operator would silently lose every payment attempt, so the
 * table is recreated idempotently the first time the database reports it
 * missing. The create statements match drizzle/0010_payment_gateway_rotation.sql.
 */
let attemptsTablePromise: Promise<void> | null = null

export function ensurePaymentGatewayAttemptsTable(): Promise<void> {
    if (!attemptsTablePromise) {
        attemptsTablePromise = (async () => {
            await sql`
                CREATE TABLE IF NOT EXISTS "payment_gateway_attempts" (
                    "id" uuid PRIMARY KEY NOT NULL,
                    "checkout_id" text NOT NULL,
                    "product" varchar(32) NOT NULL,
                    "gateway" varchar(32) NOT NULL,
                    "customer_key" varchar(64) NOT NULL,
                    "attempt_number" integer NOT NULL,
                    "status" varchar(24) DEFAULT 'reserved' NOT NULL,
                    "provider_reference" text,
                    "failure_code" varchar(100),
                    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
                    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
                    "expires_at" timestamp with time zone NOT NULL,
                    CONSTRAINT "payment_gateway_attempts_product_check"
                        CHECK ("product" IN ('quote', 'doc-forge')),
                    CONSTRAINT "payment_gateway_attempts_status_check"
                        CHECK ("status" IN ('reserved', 'pending', 'failed', 'succeeded', 'expired')),
                    CONSTRAINT "payment_gateway_attempts_number_check"
                        CHECK ("attempt_number" > 0),
                    CONSTRAINT "payment_gateway_attempts_checkout_number_unique"
                        UNIQUE ("checkout_id", "product", "attempt_number")
                )
            `
            await sql`
                CREATE INDEX IF NOT EXISTS "payment_gateway_attempts_gateway_status_idx"
                ON "payment_gateway_attempts" ("gateway", "status", "created_at")
            `
            await sql`
                CREATE INDEX IF NOT EXISTS "payment_gateway_attempts_customer_gateway_idx"
                ON "payment_gateway_attempts" ("customer_key", "gateway", "created_at")
            `
        })().catch((error) => {
            attemptsTablePromise = null
            throw error
        })
    }
    return attemptsTablePromise
}

function isMissingAttemptsTable(error: unknown): boolean {
    const code = (error as { code?: string } | null)?.code
    const message = String((error as { message?: string } | null)?.message ?? '')
    return code === '42P01' && message.includes('payment_gateway_attempts')
}

/** Retry once after creating the attempt ledger when the migration is missing. */
async function withPaymentAttemptsTable<T>(operation: () => Promise<T>): Promise<T> {
    try {
        return await operation()
    } catch (error) {
        if (!isMissingAttemptsTable(error)) throw error
        await ensurePaymentGatewayAttemptsTable()
        return await operation()
    }
}

/**
 * Read the live rotation state for one gateway: how much of its quota the
 * current round consumed, whether the provider is auto-paused and whether this
 * customer was recently declined by it.
 */
async function loadProviderRotationState(
    executor: RotationExecutor,
    gateway: PaymentGatewayId,
    providerSettings: Record<string, any> | null,
    customerKey: string,
    healthSettings: ReturnType<typeof readAutoPauseSettings>,
): Promise<ProviderQuotaState> {
    const quota = asNonNegativeInteger(providerSettings?.paymentQuota, 0)

    let used = 0
    if (quota > 0) {
        const quotaResetAt = readQuotaResetDate(providerSettings)
        const usageRows = await executor<{ used: number }[]>`
          SELECT COUNT(*)::int AS used
          FROM payment_gateway_attempts
          WHERE gateway = ${gateway}
            AND created_at >= ${quotaResetAt}::timestamptz
            AND (
              status = 'succeeded'
              OR (status IN ('reserved', 'pending') AND expires_at > CURRENT_TIMESTAMP)
            )
        `
        used = Number(usageRows[0]?.used ?? 0)
    }

    let customerCooldown = false
    if (healthSettings.userCooldownMinutes > 0) {
        const recentlyRejected = await executor<{ found: boolean }[]>`
          SELECT EXISTS (
            SELECT 1
            FROM payment_gateway_attempts
            WHERE customer_key = ${customerKey}
              AND gateway = ${gateway}
              AND status = 'failed'
              AND created_at >= CURRENT_TIMESTAMP - (${healthSettings.userCooldownMinutes} * INTERVAL '1 minute')
          ) AS found
        `
        customerCooldown = recentlyRejected[0]?.found === true
    }

    let autoPaused = false
    if (healthSettings.enabled) {
        const recentOutcomes = await executor<{ attempts: number; failures: number; last_failure: string | Date | null }[]>`
          SELECT
            COUNT(*)::int AS attempts,
            COUNT(*) FILTER (WHERE status = 'failed')::int AS failures,
            MAX(created_at) FILTER (WHERE status = 'failed') AS last_failure
          FROM payment_gateway_attempts
          WHERE gateway = ${gateway}
            AND status IN ('failed', 'succeeded')
            AND created_at >= CURRENT_TIMESTAMP - (${healthSettings.windowMinutes} * INTERVAL '1 minute')
        `
        const outcomes = recentOutcomes[0]
        const sampleSize = Number(outcomes?.attempts ?? 0)
        const failures = Number(outcomes?.failures ?? 0)
        const recentFailureAt = outcomes?.last_failure ? new Date(outcomes.last_failure).getTime() : 0
        autoPaused =
            sampleSize >= healthSettings.minimumAttempts &&
            (failures / sampleSize) * 100 >= healthSettings.failureRate &&
            recentFailureAt > Date.now() - healthSettings.durationMinutes * 60_000
    }

    return { quota, used, autoPaused, customerCooldown }
}

/** Reservations that still hold a quota slot right after a round reset. */
async function countLiveReservations(
    executor: RotationExecutor,
    gateway: PaymentGatewayId,
): Promise<number> {
    const rows = await executor<{ used: number }[]>`
      SELECT COUNT(*)::int AS used
      FROM payment_gateway_attempts
      WHERE gateway = ${gateway}
        AND status IN ('reserved', 'pending')
        AND expires_at > CURRENT_TIMESTAMP
    `
    return Number(rows[0]?.used ?? 0)
}

/**
 * Roll the quota window of a completed round over so the next payment starts
 * again at the first provider. `quotaRound` keeps the cycle visible in the Ops
 * Hub with everything else unchanged.
 */
async function resetQuotaRound(
    executor: RotationExecutor,
    gateways: readonly PaymentGatewayId[],
): Promise<void> {
    for (const gateway of gateways) {
        await executor`
          UPDATE settings
          SET value = (
            jsonb_set(
              jsonb_set(
                COALESCE(NULLIF(value, '')::jsonb, '{}'::jsonb),
                '{quotaResetAt}',
                to_jsonb(CURRENT_TIMESTAMP)
              ),
              '{quotaRound}',
              to_jsonb(COALESCE((COALESCE(NULLIF(value, '')::jsonb, '{}'::jsonb)->>'quotaRound')::int, 0) + 1)
            )
          )::text
          WHERE param = ${gateway}
            AND value IS NOT NULL
            AND value ~ '^[[:space:]]*\\{'
        `
    }
}

function validateAllocationInput(input: AllocationInput): void {
    if (!input.checkoutId || input.checkoutId.length > 160) {
        throw new PaymentRoutingError('A valid checkout reference is required.', 'NO_GATEWAY_AVAILABLE')
    }
    if (input.product !== 'quote' && input.product !== 'doc-forge') {
        throw new PaymentRoutingError('Unsupported checkout product.', 'NO_GATEWAY_AVAILABLE')
    }
}

/**
 * Reserve the next eligible provider in operator order. The advisory lock and
 * active reservation ensure concurrent requests cannot overrun a provider's
 * configured quota. Failed attempts release their capacity; successful charges
 * keep consuming quota until an operator resets that provider's usage.
 */
async function allocateNextForCustomer(
    input: AllocationInput,
    customerKey: string,
): Promise<{ attempt: PaymentGatewayAttempt; maxRetries: number }> {
    validateAllocationInput(input)
    const paymentSettings = await getPaymentSettings()
    const order = getProductGatewayOrder(paymentSettings, input.product)
    const maxRetries = getRetryLimit(paymentSettings)
    const maxAttempts = maxRetries + 1
    const healthSettings = readAutoPauseSettings(paymentSettings)

    if (order.length === 0) {
        throw new PaymentRoutingError('No active payment processors are available for this checkout.', 'NO_GATEWAY_AVAILABLE')
    }

    const providerConfigs = new Map<PaymentGatewayId, Record<string, any> | null>()
    await Promise.all(order.map(async (gateway) => {
        const value = await fetchSetting(gateway)
        providerConfigs.set(gateway, value && typeof value === 'object' ? value as Record<string, any> : null)
    }))

    const attempt = await sql.begin(async (transaction) => {
        // A short critical section makes quota checks safe across app instances.
        await transaction`SELECT pg_advisory_xact_lock(${ROUTING_LOCK_NAMESPACE}, ${ROUTING_LOCK_KEY})`

        await transaction`
      UPDATE payment_gateway_attempts
      SET status = 'expired', updated_at = CURRENT_TIMESTAMP
      WHERE checkout_id = ${input.checkoutId}
        AND product = ${input.product}
        AND status IN ('reserved', 'pending')
        AND expires_at <= CURRENT_TIMESTAMP
    `

        const activeRows = await transaction<DbAttempt[]>`
      SELECT id, checkout_id, product, gateway, customer_key, attempt_number,
             status, provider_reference, created_at, expires_at
      FROM payment_gateway_attempts
      WHERE checkout_id = ${input.checkoutId}
        AND product = ${input.product}
        AND status IN ('reserved', 'pending')
        AND expires_at > CURRENT_TIMESTAMP
      ORDER BY attempt_number DESC
      LIMIT 1
    `
        if (activeRows[0]) return activeRows[0]

        const existingRows = await transaction<DbAttempt[]>`
      SELECT id, checkout_id, product, gateway, customer_key, attempt_number,
             status, provider_reference, created_at, expires_at
      FROM payment_gateway_attempts
      WHERE checkout_id = ${input.checkoutId}
        AND product = ${input.product}
      ORDER BY attempt_number ASC
    `

        if (existingRows.some((row) => row.status === 'succeeded')) {
            throw new PaymentRoutingError('This checkout has already been paid.', 'PAYMENT_ALREADY_COMPLETE')
        }

        const liveRows = existingRows.filter((row) => row.status !== 'expired')
        if (liveRows.length >= maxAttempts) {
            throw new PaymentRoutingError('The payment retry limit has been reached.', 'RETRY_LIMIT')
        }

        const previouslyTried = new Set(liveRows.map((row) => row.gateway))
        const nextAttemptNumber = Math.max(0, ...existingRows.map((row) => row.attempt_number)) + 1

        let states: Record<string, ProviderQuotaState> = {}
        for (const gateway of order) {
            states[gateway] = await loadProviderRotationState(
                transaction,
                gateway,
                providerConfigs.get(gateway) ?? null,
                customerKey,
                healthSettings,

            )
        }

        let decision = selectNextGateway(order, previouslyTried, states)

        if (decision.outcome === 'start-new-round') {
            // Every provider with a finite quota finished its round. Roll the
            // quota windows over and route the next payment to the first
            // provider in operator order again.
            const resetGateways = gatewaysForRoundReset(order, states)
            await resetQuotaRound(transaction, resetGateways)
            for (const gateway of resetGateways) {
                // The quota window restarted, so only live reservations still
                // consume a slot in the new round.
                states[gateway] = {
                    ...states[gateway],
                    used: await countLiveReservations(transaction, gateway),
                }
            }
            decision = selectNextGateway(order, previouslyTried, states)
        }

        if (decision.outcome === 'start-new-round') {
            throw new PaymentRoutingError('No healthy payment processors are available right now.', 'NO_GATEWAY_AVAILABLE')
        }
        if (decision.outcome === 'unavailable') {
            throw new PaymentRoutingError(unavailableMessage(decision.reason), 'NO_GATEWAY_AVAILABLE')
        }


        const id = randomUUID()
        const inserted = await transaction<DbAttempt[]>`
        INSERT INTO payment_gateway_attempts(
                id, checkout_id, product, gateway, customer_key, attempt_number,
                status, created_at, updated_at, expires_at
            ) VALUES(
                ${id}::uuid, ${input.checkoutId}, ${input.product}, ${decision.gateway},
                ${customerKey}, ${nextAttemptNumber}, 'reserved', CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + (${RESERVATION_MINUTES} * INTERVAL '1 minute')
        )
        RETURNING id, checkout_id, product, gateway, customer_key, attempt_number,
        status, provider_reference, created_at, expires_at
            `
        return inserted[0]
    })

    return { attempt: mapAttempt(attempt), maxRetries }
}

export async function reserveNextPaymentGateway(input: AllocationInput): Promise<{
    attempt: PublicGatewayAttempt
    maxRetries: number
}> {
    const customerKey = hashCustomerKey(input.customerId, input.customerEmail)
    const result = await withPaymentAttemptsTable(() => allocateNextForCustomer(input, customerKey))
    return {
        attempt: toPublicAttempt({
            id: result.attempt.id,
            checkout_id: result.attempt.checkoutId,
            product: result.attempt.product,
            gateway: result.attempt.gateway,
            customer_key: customerKey,
            attempt_number: result.attempt.attemptNumber,
            status: result.attempt.status,
            provider_reference: result.attempt.providerReference,
            created_at: result.attempt.createdAt,
            expires_at: result.attempt.expiresAt,
        }, result.maxRetries), maxRetries: result.maxRetries
    }
}

export async function getPaymentGatewayAttempt(attemptId: string): Promise<PaymentGatewayAttempt | null> {
    if (!attemptId || !/^[0-9a-f-]{36}$/i.test(attemptId)) return null
    return withPaymentAttemptsTable(async () => {
        const rows = await sql<DbAttempt[]>`
    SELECT id, checkout_id, product, gateway, customer_key, attempt_number,
        status, provider_reference, created_at, expires_at
    FROM payment_gateway_attempts
    WHERE id = ${attemptId}:: uuid
    LIMIT 1
        `
        return rows[0] ? mapAttempt(rows[0]) : null
    })
}

export async function isPaymentGatewayAttemptOwnedByCustomer(
    attemptId: string,
    customerId: string | number,
    customerEmail?: string | null,
): Promise<boolean> {
    if (!attemptId || !/^[0-9a-f-]{36}$/i.test(attemptId)) return false
    const customerKey = hashCustomerKey(customerId, customerEmail)
    return withPaymentAttemptsTable(async () => {
        const rows = await sql<{ owned: boolean }[]>`
    SELECT customer_key = ${customerKey} AS owned
    FROM payment_gateway_attempts
    WHERE id = ${attemptId}:: uuid
    LIMIT 1
        `
        return rows[0]?.owned === true
    })
}

export async function verifyPaymentGatewayAttempt(
    attemptId: string,
    expectedGateway: PaymentGatewayId,
    expectedProduct: PaymentProduct = 'quote',
): Promise<PaymentGatewayAttempt | null> {
    const attempt = await getPaymentGatewayAttempt(attemptId)
    if (!attempt || attempt.gateway !== expectedGateway || attempt.product !== expectedProduct) return null
    if (!['reserved', 'pending'].includes(attempt.status) || Date.parse(attempt.expiresAt) <= Date.now()) return null
    return attempt
}

export async function markPaymentGatewayAttempt(
    attemptId: string,
    status: 'pending' | 'failed' | 'succeeded',
    details: { providerReference?: string | null; failureCode?: string | null } = {},
): Promise<void> {
    if (!attemptId || !/^[0-9a-f-]{36}$/i.test(attemptId)) return
    const providerReference = details.providerReference?.slice(0, 500) ?? null
    const failureCode = details.failureCode?.replace(/[^a-zA-Z0-9_.:-]/g, '').slice(0, 100) ?? null

    await withPaymentAttemptsTable(async () => {
        if (status === 'succeeded') {
            await sql`
      UPDATE payment_gateway_attempts
      SET status = 'succeeded',
        provider_reference = COALESCE(${providerReference}, provider_reference),
        failure_code = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${attemptId}:: uuid
        AND status <> 'succeeded'
        `
            return
        }

        if (status === 'failed') {
            await sql`
      UPDATE payment_gateway_attempts
      SET status = 'failed',
        provider_reference = COALESCE(${providerReference}, provider_reference),
        failure_code = COALESCE(${failureCode}, failure_code),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${attemptId}:: uuid
        AND status NOT IN('succeeded', 'failed')
        `
            return
        }

        await sql`
    UPDATE payment_gateway_attempts
    SET status = 'pending',
        provider_reference = COALESCE(${providerReference}, provider_reference),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${attemptId}:: uuid
      AND status IN('reserved', 'pending')
        `
    })
}

export async function retryPaymentGatewayAttempt(
    attemptId: string,
    failureCode: string,
    customer: { id: string | number; email?: string | null },
): Promise<{ attempt: PublicGatewayAttempt; maxRetries: number }> {
    const previous = await getPaymentGatewayAttempt(attemptId)
    if (!previous) throw new PaymentRoutingError('Payment attempt was not found.', 'ATTEMPT_NOT_FOUND')
    if (!(await isPaymentGatewayAttemptOwnedByCustomer(attemptId, customer.id, customer.email))) {
        throw new PaymentRoutingError('Payment attempt was not found.', 'ATTEMPT_NOT_FOUND')
    }
    if (previous.status === 'succeeded') {
        throw new PaymentRoutingError('This checkout has already been paid.', 'PAYMENT_ALREADY_COMPLETE')
    }

    await markPaymentGatewayAttempt(attemptId, 'failed', { failureCode })

    const paymentSettings = await getPaymentSettings()
    const maxRetries = getRetryLimit(paymentSettings)
    const customerKey = (await readStoredCustomerKey(attemptId)) ?? hashCustomerKey()
    const next = await withPaymentAttemptsTable(() => allocateNextForCustomer({
        checkoutId: previous.checkoutId,
        product: previous.product,
    }, customerKey))

    return {
        attempt: toPublicAttempt({
            id: next.attempt.id,
            checkout_id: next.attempt.checkoutId,
            product: next.attempt.product,
            gateway: next.attempt.gateway,
            customer_key: '',
            attempt_number: next.attempt.attemptNumber,
            status: next.attempt.status,
            provider_reference: next.attempt.providerReference,
            created_at: next.attempt.createdAt,
            expires_at: next.attempt.expiresAt,
        }, maxRetries),
        maxRetries,
    }
}

async function readStoredCustomerKey(attemptId: string): Promise<string | null> {
    const rows = await sql<{ customer_key: string }[]>`
    SELECT customer_key FROM payment_gateway_attempts WHERE id = ${attemptId}::uuid LIMIT 1
        `
    return rows[0]?.customer_key ?? null
}

function calculateAutoPause(
    succeeded: number,
    failed: number,
    lastFailureAt: string | Date | null,
    settings: ReturnType<typeof readAutoPauseSettings>,
): boolean {
    const attempts = succeeded + failed
    const lastFailureMs = lastFailureAt ? new Date(lastFailureAt).getTime() : 0
    return settings.enabled &&
        attempts >= settings.minimumAttempts &&
        failed / attempts * 100 >= settings.failureRate &&
        lastFailureMs > Date.now() - settings.durationMinutes * 60_000
}

export async function getPaymentGatewayStats(): Promise<Array<{
    gateway: PaymentGatewayId
    succeeded: number
    failed: number
    active: number
    used: number
    quota: number
    round: number
    quotaExhausted: boolean
    failureRate: number
    autoPaused: boolean
    lastFailureAt: string | null
}>> {
    // The stats panel runs before any payment has been attempted too; make
    // sure the ledger exists instead of failing the whole Ops Hub tab.
    await ensurePaymentGatewayAttemptsTable()
    const paymentSettings = await getPaymentSettings()
    const rows = await sql<{
        gateway: string
        succeeded: number
        failed: number
        active: number
        used: number
        window_succeeded: number
        window_failed: number
        last_failure_at: string | Date | null
    }[]>`
    SELECT
    gateway,
        COUNT(*) FILTER(WHERE status = 'succeeded')::int AS succeeded,
            COUNT(*) FILTER(WHERE status = 'failed')::int AS failed,
                COUNT(*) FILTER(WHERE status IN('reserved', 'pending') AND expires_at > CURRENT_TIMESTAMP)::int AS active,
                    COUNT(*) FILTER(
                        WHERE status = 'succeeded'
             OR(status IN('reserved', 'pending') AND expires_at > CURRENT_TIMESTAMP)
                    )::int AS used,
                        COUNT(*) FILTER(
                            WHERE status = 'succeeded'
            AND created_at >= CURRENT_TIMESTAMP - (GREATEST(1, COALESCE(NULLIF((SELECT value:: jsonb ->> 'autoPauseWindowMinutes' FROM settings WHERE param = 'payment'), ''):: int, 15)) * INTERVAL '1 minute')
        )::int AS window_succeeded,
        COUNT(*) FILTER(
            WHERE status = 'failed'
            AND created_at >= CURRENT_TIMESTAMP - (GREATEST(1, COALESCE(NULLIF((SELECT value:: jsonb ->> 'autoPauseWindowMinutes' FROM settings WHERE param = 'payment'), ''):: int, 15)) * INTERVAL '1 minute')
        )::int AS window_failed,
        MAX(created_at) FILTER(WHERE status = 'failed') AS last_failure_at
      FROM payment_gateway_attempts
      GROUP BY gateway
        `

    const autoPause = readAutoPauseSettings(paymentSettings)
    const settingsByGateway = new Map<PaymentGatewayId, Record<string, any> | null>()
    await Promise.all(PAYMENT_GATEWAYS.map(async ({ id }) => {
        const value = await fetchSetting(id)
        settingsByGateway.set(id, value && typeof value === 'object' ? value as Record<string, any> : null)
    }))

    const rowsByGateway = new Map(rows.map((row) => [row.gateway, row]))
    const result = await Promise.all(
        PAYMENT_GATEWAYS.map(async ({ id }) => {
            const gateway = id as PaymentGatewayId
            const providerSettings = settingsByGateway.get(gateway)
            const stats = rowsByGateway.get(gateway)
            const resetAt = readQuotaResetDate(providerSettings)
            const quota = asNonNegativeInteger(providerSettings?.paymentQuota, 0)
            const quotaRows = await sql<{ used: number }[]>`
          SELECT COUNT(*)::int AS used
          FROM payment_gateway_attempts
          WHERE gateway = ${gateway}
            AND created_at >= ${resetAt}:: timestamptz
    AND(
        status = 'succeeded'
              OR(status IN('reserved', 'pending') AND expires_at > CURRENT_TIMESTAMP)
    )
        `
            const quotaRound = asNonNegativeInteger(providerSettings?.quotaRound, 0)
            const used = Number(quotaRows[0]?.used ?? 0)
            const succeeded = Number(stats?.succeeded ?? 0)
            const failed = Number(stats?.failed ?? 0)
            const windowSucceeded = Number(stats?.window_succeeded ?? 0)
            const windowFailed = Number(stats?.window_failed ?? 0)
            const lastFailureAt = stats?.last_failure_at ?? null
            const sampleCount = windowSucceeded + windowFailed

            return {
                gateway,
                succeeded,
                failed,
                active: Number(stats?.active ?? 0),
                used,
                quota,
                round: quotaRound,
                quotaExhausted: quota > 0 && used >= quota,
                failureRate: sampleCount === 0 ? 0 : Math.round((windowFailed / sampleCount) * 100),
                autoPaused: calculateAutoPause(windowSucceeded, windowFailed, lastFailureAt, autoPause),
                lastFailureAt: lastFailureAt ? toIso(lastFailureAt) : null,
            }
        })
    )

    return result
}