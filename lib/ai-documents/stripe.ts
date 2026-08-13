import 'server-only'
import Stripe from 'stripe'
import { sql } from '@/lib/db'

let stripeInstance: Stripe | null = null

export async function getStripeInstance(): Promise<Stripe> {
  const result = await sql`SELECT value FROM settings WHERE key = 'stripe'`
  
  if (result.length === 0) {
    // Fallback to env if DB settings are missing
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || ''
    if (!stripeSecretKey) {
      throw new Error('Stripe is not configured. Please set settings in admin or STRIPE_SECRET_KEY environment variable.')
    }
    return new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    })
  }

  const settings = result[0].value
  const secretKey = settings.secret_key || process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error('Stripe secret key not found in database or environment.')
  }

  return new Stripe(secretKey, {
    apiVersion: '2024-11-20.acacia',
    typescript: true,
  })
}

// Keep the proxy for backward compatibility where possible, but it will use env vars
// For DB-driven stripe, use getStripeInstance()
export const stripe = new Proxy({} as Stripe, {
  get(target, prop) {
    if (!stripeInstance) {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY || ''
      if (!stripeSecretKey) {
        throw new Error('Stripe is not configured via environment variables. Use getStripeInstance() for DB-based config.')
      }
      stripeInstance = new Stripe(stripeSecretKey, {
        apiVersion: '2024-11-20.acacia',
        typescript: true,
      })
    }
    
    const value = stripeInstance[prop as keyof Stripe]
    if (typeof value === 'function') {
      return value.bind(stripeInstance)
    }
    return value
  }
})
