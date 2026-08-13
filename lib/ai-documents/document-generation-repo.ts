import { sql } from '@/lib/db'

export async function getCreditsPerDocumentForUser(userId: number) {
  const creditPricing = await sql`
    SELECT sp.price_per_document_cents
    FROM user_subscriptions us
    JOIN subscription_plans sp ON sp.id = us.plan_id
    WHERE us.user_id = ${userId}
      AND us.status = 'active'
      AND sp.plan_type = 'credits'
    ORDER BY us.updated_at DESC, us.created_at DESC
    LIMIT 1
  `

  return Math.max(1, Number(creditPricing[0]?.price_per_document_cents || 1))
}

export async function getUserCredits(userId: number) {
  const userCredits = await sql`
    SELECT * FROM user_credits
    WHERE user_id = ${userId}
  `

  return userCredits[0] || { credits_available: 0 }
}

export async function getTemplateName(templateId: number) {
  const template = await sql`
    SELECT name FROM templates WHERE id = ${templateId}
  `

  return template[0]?.name || `Template ${templateId}`
}

export async function createDocument(params: {
  userId: number
  templateId: number
  templateName: string
  content: string
  userInputs: Record<string, unknown>
  creditsPerDocument: number
}) {
  const result = await sql`
    INSERT INTO documents (user_id, template_id, title, content, user_inputs, status, credits_used)
    VALUES (
      ${params.userId},
      ${params.templateId},
      ${params.templateName},
      ${params.content},
      ${JSON.stringify(params.userInputs)},
      'draft',
      ${params.creditsPerDocument}
    )
    RETURNING id
  `

  return result[0].id as number
}



export async function deductUserCredits(userId: number, creditsPerDocument: number) {
  const initialCreditsAvailable = -1 * creditsPerDocument

  await sql`
    INSERT INTO user_credits (user_id, credits_available, credits_used)
    VALUES (${userId}, ${initialCreditsAvailable}, ${creditsPerDocument})
    ON CONFLICT (user_id)
    DO UPDATE SET
      credits_available = user_credits.credits_available - ${creditsPerDocument},
      credits_used = user_credits.credits_used + ${creditsPerDocument},
      updated_at = CURRENT_TIMESTAMP
  `
}