'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sql } from '@letterise/lib/db'
import { getAdminSession } from '@letterise/lib/admin-auth'

export async function saveTemplateAction(formData: FormData) {
  const admin = await getAdminSession()
  if (!admin) redirect('/admin-login')

  const id = Number(formData.get('id') || 0)
  const categoryId = Number(formData.get('category_id'))
  const name = String(formData.get('name')).trim()
  const slug = String(formData.get('slug')).trim()
  const description = String(formData.get('description') || '').trim()
  const estimatedLength = String(formData.get('estimated_length') || '').trim()
  const systemPrompt = String(formData.get('system_prompt') || '').trim()
  
  const useCasesRaw = String(formData.get('use_cases') || '')
  const useCases = useCasesRaw.split('\n').map(s => s.trim()).filter(Boolean)
  
  const questionsRaw = String(formData.get('questions') || '[]')
  let questions = []
  try {
    questions = JSON.parse(questionsRaw)
  } catch (e) {
    console.error('Failed to parse questions JSON', e)
    return { error: 'Invalid questions JSON format' }
  }

  const isFeatured = formData.get('is_featured') === 'on'
  const isActive = formData.get('is_active') === 'on'

  if (!name || !slug || !categoryId) {
    return { error: 'Name, slug, and category are required' }
  }

  try {
    if (id > 0) {
      await sql`
        UPDATE templates
        SET category_id = ${categoryId},
            name = ${name},
            slug = ${slug},
            description = ${description},
            use_cases = ${useCases},
            system_prompt = ${systemPrompt},
            questions = ${JSON.stringify(questions)},
            estimated_length = ${estimatedLength},
            is_featured = ${isFeatured},
            is_active = ${isActive},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `
    } else {
      await sql`
        INSERT INTO templates (
          category_id, name, slug, description, use_cases, system_prompt, 
          questions, estimated_length, is_featured, is_active
        ) VALUES (
          ${categoryId}, ${name}, ${slug}, ${description}, ${useCases}, ${systemPrompt},
          ${JSON.stringify(questions)}, ${estimatedLength}, ${isFeatured}, ${isActive}
        )
      `
    }
  } catch (error: any) {
    console.error('Database error saving template:', error)
    if (error.message?.includes('unique constraint') || error.code === '23505') {
      return { error: 'A template with this slug already exists' }
    }
    return { error: 'Failed to save template to database' }
  }

  revalidatePath('/administrator')
  revalidatePath('/templates')
  revalidatePath(`/templates/${slug}`)
  
  return { success: true }
}

export async function deleteTemplateAction(formData: FormData) {
  const admin = await getAdminSession()
  if (!admin) redirect('/admin-login')

  const id = Number(formData.get('id'))
  if (!id) return { error: 'Template ID is required' }

  try {
    await sql`DELETE FROM templates WHERE id = ${id}`
    revalidatePath('/administrator')
    return { success: true }
  } catch (error) {
    console.error('Database error deleting template:', error)
    return { error: 'Failed to delete template. It might be in use by existing documents.' }
  }
}
