import 'server-only'
import { sql } from '@/lib/db'

export async function userHasTemplateAccess(userId: number): Promise<boolean> {
  const [credits, subscription] = await Promise.all([
    sql`
      SELECT credits_available
      FROM user_credits
      WHERE user_id = ${userId}
      LIMIT 1
    `,
    sql`
      SELECT id
      FROM user_subscriptions
      WHERE user_id = ${userId} AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `
  ])

  const hasCredits = Number(credits?.[0]?.credits_available || 0) > 0
  const hasActiveSubscription = Boolean(subscription?.[0])

  return hasCredits || hasActiveSubscription
}