import 'server-only'

import type Stripe from 'stripe'
import { fetchSetting } from '@/core/data-store'

/**
 * The Stripe API version every server-side Stripe client pins.
 *
 * The deployed account still returns the fields this project reads (such as
 * `current_period_start` on subscriptions) on this version, so it is kept
 * deliberately. `stripe-node`'s `LatestApiVersion` type only names the newest
 * API version, hence the assertion - Stripe accepts the older pin at runtime.
 */
export const STRIPE_API_VERSION = '2024-04-10' as Stripe.LatestApiVersion

export interface StripeCredentials {
    /** Secret key used for server-side Stripe API calls. */
    secretKey: string
    /** Publishable key safe to expose to the browser. */
    publishableKey: string
    /** Shared webhook signing secret for /api/stripe-hook. */
    webhookSecret: string
    /** Whether the configured keys are Stripe test/sandbox keys. */
    sandbox: boolean
}

/**
 * The SINGLE project-wide Stripe credential source.
 *
 * Every Stripe integration in this repository (quote checkout, document
 * service/doc-forge, webhooks, admin dashboards) must resolve its credentials
 * here - never from a per-product settings row. Environment variables bootstrap
 * the deployment; the main database `settings.stripe` row (Ops Hub -> Payment
 * Settings) is the operator-managed override.
 *
 * Only the *records* of successful payments are stored in the database:
 * quotes and AI-document purchases (drizzle) plus document-service credit
 * transactions and subscriptions - all in the single main database since
 * migration 0009.
 */
export async function getStripeCredentials(): Promise<StripeCredentials> {
    const settings = (await fetchSetting('stripe')) || {}

    return {
        secretKey: process.env.STRIPE_SECRET_KEY || settings.secret_key || '',
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || settings.publishable_key || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || settings.webhook_secret || '',
        sandbox: Boolean(settings.sandbox),
    }
}