import { sql } from '@/lib/db'

export async function addCreditPlanPurchaseForUser(userId: number, planId: number) {
  await sql`
    INSERT INTO user_subscriptions (user_id, plan_id, status)
    VALUES (${userId}, ${planId}, 'active')
  `
}