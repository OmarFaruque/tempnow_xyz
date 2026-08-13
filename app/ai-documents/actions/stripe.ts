'use server'

import { requireAuth } from '@letterise/lib/auth'
import { getStripeInstance } from '@letterise/lib/stripe'
import { PRODUCTS } from '@letterise/lib/products'
import { sql } from '@letterise/lib/db'

export async function startCheckoutSession(productId: string) {
  const user = await requireAuth()
  const stripe = await getStripeInstance()
  let resolvedPlanId: number | null = null
  
  // Try to find in hardcoded products first
  let product = PRODUCTS.find(p => p.id === productId)
  
  // If not found, try to fetch from database
  if (!product) {
    const isCreditsPackage = productId.startsWith('credit-')
    const dbProductId = productId.replace(/^(credit-|plan-)/, '')
    
    const dbProduct = await sql`
      SELECT id, name, description, plan_type, price_cents, package_price_cents, 
             price_per_document_cents, credit_amount, monthly_document_limit, 
             discount_percent, features, credits_per_month
      FROM subscription_plans
      WHERE id = ${parseInt(dbProductId)}
    `
    
    if (dbProduct.length === 0) {
      throw new Error(`Product with id "${productId}" not found`)
    }
    
    const dbPlan = dbProduct[0]
    resolvedPlanId = Number(dbPlan.id)
    product = {
      id: productId,
      name: dbPlan.name,
      description: dbPlan.description,
      priceInCents: isCreditsPackage ? 
        Number(dbPlan.package_price_cents) : 
        Number(dbPlan.price_cents),
      credits: isCreditsPackage ? 
        Number(dbPlan.credit_amount) : 
        Number(dbPlan.monthly_document_limit || dbPlan.credits_per_month || 0),
      type: dbPlan.plan_type,
      features: dbPlan.features || []
    }
  }
  
  if (!product) {
    throw new Error(`Product with id "${productId}" not found`)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (product.type === 'credits') {
    // One-time payment for credits
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: product.priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      metadata: {
        userId: user.id.toString(),
        productId: product.id,
        credits: product.credits?.toString() || '0',
        type: 'credits'
      }
    })

    return { url: session.url }
  } else {

    if (!resolvedPlanId) {
      const matchedPlan = await sql`
        SELECT id
        FROM subscription_plans
        WHERE plan_type = 'subscription'
          AND name = ${product.name}
          AND price_cents = ${product.priceInCents}
        LIMIT 1
      `
      if (matchedPlan.length > 0) {
        resolvedPlanId = Number(matchedPlan[0].id)
      }
    }
    // Subscription
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: product.priceInCents,
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      metadata: {
        userId: user.id.toString(),
        productId: product.id,
        credits: product.credits?.toString() || '0',
        type: 'subscription',
        planId: resolvedPlanId?.toString() || ''
      }
    })

    return { url: session.url }
  }
}

export async function createPortalSession() {
  const user = await requireAuth()
  
  // Get Stripe customer ID
  const subscription = await sql`
    SELECT stripe_subscription_id FROM user_subscriptions
    WHERE user_id = ${user.id} AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
  `

  if (subscription.length === 0 || !subscription[0].stripe_subscription_id) {
    throw new Error('No active subscription found')
  }

  const stripe = await getStripeInstance()
  const stripeSubscription = await stripe.subscriptions.retrieve(subscription[0].stripe_subscription_id)
  
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeSubscription.customer as string,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
  })

  return portalSession.url
}
