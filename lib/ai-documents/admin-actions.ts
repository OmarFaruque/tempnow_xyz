import 'server-only'
import { revalidatePath } from 'next/cache'
import { sql } from '@/lib/db'

export async function updateTemplateFlag(templateId: number, field: string, nextValue: boolean) {
  if (field === 'is_active') {
    await sql`
      UPDATE templates
      SET is_active = ${nextValue}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${templateId}
    `
  }

  if (field === 'is_featured') {
    await sql`
      UPDATE templates
      SET is_featured = ${nextValue}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${templateId}
    `
  }

  revalidatePath('/administrator')
}

export async function updateCategoryStatus(categoryId: number, nextValue: boolean) {
  await sql`
    UPDATE categories
    SET is_active = ${nextValue}
    WHERE id = ${categoryId}
  `

  revalidatePath('/administrator')
}

export async function updateUserCredits(userId: number, creditsAvailable: number) {
  await sql`
    UPDATE user_credits
    SET credits_available = ${creditsAvailable},
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ${userId}
  `

  revalidatePath('/administrator')
}
