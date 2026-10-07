import postgres from 'postgres'

/**
 * Single Postgres connection pool shared by the Drizzle client (`core/db`) and
 * the raw SQL client (`core/db-raw`).
 *
 * Two things matter here:
 *
 * 1. One pool per process. `core/db` and `core/db-raw` used to create a pool
 *    each, and in development Next.js re-evaluates modules on every edit, so
 *    hot reloads kept opening new pools and leaking the old ones until the
 *    database (or its pooler) refused new connections. A saturated pool does
 *    not fail fast: `postgres.js` waits for a free connection and the request
 *    dies with `CONNECT_TIMEOUT` after the default 30 second timeout, which is
 *    exactly what made `/api/paddle/client-token` answer 500 after 56-79s
 *    while every other settings-backed route was slow as well.
 * 2. Fail fast. `connect_timeout` is lowered from the 30s default so an
 *    unreachable or saturated database surfaces an error in ~10s instead of
 *    hanging an API route (and the checkout UI) for over a minute.
 *
 * The client is cached on `globalThis` outside production so hot reloads reuse
 * the existing pool instead of opening another one.
 */
const globalForPg = globalThis as typeof globalThis & { __gosurePg?: postgres.Sql }

function createClient(): postgres.Sql {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set')
    }

    const configuredPool = Number(process.env.DATABASE_POOL_MAX)

    return postgres(connectionString, {
        // Not supported in "Transaction" pool mode (PgBouncer / Neon pooler).
        prepare: false,
        max: Number.isSafeInteger(configuredPool) && configuredPool > 0 ? configuredPool : 10,
        connect_timeout: 10,
        idle_timeout: 30,
        max_lifetime: 60 * 5, // 5 minutes in seconds
    })
}

export const pg = globalForPg.__gosurePg ?? createClient()

if (process.env.NODE_ENV !== 'production') {
    globalForPg.__gosurePg = pg
}