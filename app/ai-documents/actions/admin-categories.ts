'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sql } from '@letterise/lib/db'
import { getAdminSession } from '@letterise/lib/admin-auth'

export async function saveCategoryAction(formData: FormData) {
  const admin = await getAdminSession()
  if (!admin) redirect('/admin-login')

  const id = Number(formData.get('id') || 0)
  const name = String(formData.get('name')).trim()
  const slug = String(formData.get('slug')).trim()
  const description = String(formData.get('description') || '').trim()
  const icon = String(formData.get('icon') || '').trim()
  const displayOrder = Number(formData.get('display_order') || 0)
  const isActive = formData.get('is_active') === 'on'

  if (!name || !slug) {
    return { error: 'Name and slug are required' }
  }

  try {
    if (id > 0) {
      await sql`
        UPDATE categories
        SET name = ${name},
            slug = ${slug},
            description = ${description},
            icon = ${icon},
            display_order = ${displayOrder},
            is_active = ${isActive}
        WHERE id = ${id}
      `
    } else {
      await sql`
        INSERT INTO categories (
          name, slug, description, icon, display_order, is_active
        ) VALUES (
          ${name}, ${slug}, ${description}, ${icon}, ${displayOrder}, ${isActive}
        )
      `
    }
  } catch (error: any) {
    console.error('Database error saving category:', error)
    if (error.message?.includes('unique constraint') || error.code === '23505') {
      return { error: 'A category with this slug already exists' }
    }
    return { error: 'Failed to save category to database' }
  }

  revalidatePath('/administrator')
  revalidatePath('/categories')
  revalidatePath(`/categories/${slug}`)
  
  return { success: true }
}

export async function deleteCategoryAction(formData: FormData) {
  const admin = await getAdminSession()
  if (!admin) redirect('/admin-login')

  const id = Number(formData.get('id'))
  if (!id) return { error: 'Category ID is required' }

  try {
    // Check if there are templates using this category
    const templates = await sql`SELECT id FROM templates WHERE category_id = ${id} LIMIT 1`
    if (templates.length > 0) {
      return { error: 'Cannot delete category that has templates assigned to it. Move or delete the templates first.' }
    }

    await sql`DELETE FROM categories WHERE id = ${id}`
    revalidatePath('/administrator')
    return { success: true }
  } catch (error) {
    console.error('Database error deleting category:', error)
    return { error: 'Failed to delete category.' }
  }
}
