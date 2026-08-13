import 'server-only'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sql } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'

export async function saveAllPlansAction(formData: FormData) {
  'use server'
  const admin = await getAdminSession()
  if (!admin) redirect('/admin-login')

  const plansJson = String(formData.get('plansJson') || '[]')
  let plans: any[] = []
  try {
    plans = JSON.parse(plansJson)
  } catch {
    return { error: 'Invalid plans data' }
  }

  const validPlans = plans.filter((plan) => typeof plan?.name === 'string' && plan.name.trim().length > 0)
  const keepIds = validPlans.map((plan) => Number(plan.id)).filter((id) => Number.isInteger(id) && id > 0)
  
  // Clean up plans that are not in the list anymore
  if (keepIds.length > 0) {
    // Correct way to pass array for NOT IN equivalent in Neon/Postgres
    await sql`DELETE FROM subscription_plans WHERE id != ALL(${keepIds})`
  } else {
    await sql`DELETE FROM subscription_plans`
  }

  for (const plan of validPlans) {
    const planType = plan.plan_type === 'credits' ? 'credits' : 'subscription'
    const name = String(plan.name).trim()
    const description = String(plan.description || '').trim()
    const packagePriceCents = Number(plan.package_price_cents || 0)
    const features = Array.isArray(plan.features) ? plan.features.map((item: any) => String(item).trim()).filter(Boolean) : []
    const creditAmount = planType === 'credits' ? Number(plan.credit_amount || 0) : 0
    const pricePerDocumentCents = planType === 'credits' ? Number(plan.price_per_document_cents || 0) : 0
    const monthlyDocumentLimit = planType === 'subscription' ? Number(plan.monthly_document_limit || 0) : 0
    const discountPercent = planType === 'subscription' ? Number(plan.discount_percent || 0) : 0
    const id = Number(plan.id || 0)

    if (id > 0) {
      await sql`
        UPDATE subscription_plans
        SET name = ${name}, 
            description = ${description}, 
            plan_type = ${planType}, 
            price_cents = ${packagePriceCents},
            package_price_cents = ${packagePriceCents}, 
            price_per_document_cents = ${pricePerDocumentCents},
            credit_amount = ${creditAmount}, 
            monthly_document_limit = ${monthlyDocumentLimit}, 
            discount_percent = ${discountPercent},
            features = ${features}, 
            credits_per_month = ${monthlyDocumentLimit}
        WHERE id = ${id}
      `
    } else {
      await sql`
        INSERT INTO subscription_plans (
          name, description, plan_type, price_cents, package_price_cents, price_per_document_cents,
          credit_amount, monthly_document_limit, discount_percent, features, credits_per_month, is_active
        ) VALUES (
          ${name}, ${description}, ${planType}, ${packagePriceCents}, ${packagePriceCents}, ${pricePerDocumentCents},
          ${creditAmount}, ${monthlyDocumentLimit}, ${discountPercent}, ${features}, ${monthlyDocumentLimit}, true
        )
      `
    }
  }

  revalidatePath('/administrator')
  revalidatePath('/pricing')
  return { success: true }
}

export async function updatePlanStatusAction(formData: FormData) {
  'use server'

  const admin = await getAdminSession()
  if (!admin) redirect('/admin-login')

  const planId = Number(formData.get('planId'))
  const nextValue = formData.get('nextValue') === 'true'

  if (!Number.isInteger(planId)) return

  await sql`
    UPDATE subscription_plans
    SET is_active = ${nextValue}
    WHERE id = ${planId}
  `

  revalidatePath('/administrator')
  return { success: true }
}

export async function getActivePlans() {
  return await sql`
    SELECT id, name, description, plan_type, price_cents, package_price_cents, price_per_document_cents,
           credit_amount, monthly_document_limit, discount_percent, features, credits_per_month, is_active
    FROM subscription_plans
    WHERE is_active = true 
    ORDER BY price_cents ASC
  `
}
