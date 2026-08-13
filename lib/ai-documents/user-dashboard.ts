import 'server-only'
import { sql } from '@/lib/db'

export async function getUserDashboardData(userId: number) {
  const [documents, credits, subscription] = await Promise.all([
    sql`
      SELECT d.*, t.name as template_name, c.name as category_name
      FROM documents d
      LEFT JOIN templates t ON d.user_id = ${userId} AND d.template_id = t.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE d.user_id = ${userId}
      ORDER BY d.created_at DESC
      LIMIT 10
    `,
    sql`
      SELECT * FROM user_credits
      WHERE user_id = ${userId}
    `,
    sql`
      SELECT s.*, p.name as plan_name, p.credits_per_month
      FROM user_subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.user_id = ${userId} AND s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 1
    `
  ])

  return {
    documents,
    userCredits: credits[0] || { credits_available: 0, credits_used: 0 },
    activeSubscription: subscription[0] || null
  }
}

export async function getDocumentById(userId: number, documentId: number) {
  const result = await sql`
    SELECT d.*, t.name as template_name, c.name as category_name
    FROM documents d
    LEFT JOIN templates t ON d.template_id = t.id
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE d.id = ${documentId} AND d.user_id = ${userId}
  `
  return result[0] || null
}
