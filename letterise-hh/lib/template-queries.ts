import 'server-only'
import { sql } from '@letterise/lib/db'

/** Headline counts for the AI assistant landing page. */
export async function getLibraryStats() {
  try {
    const rows = await sql`
      SELECT
        (SELECT COUNT(*) FROM templates WHERE is_active = true) AS template_count,
        (SELECT COUNT(*) FROM categories) AS category_count
    `
    return {
      templateCount: Number(rows[0]?.template_count ?? 0),
      categoryCount: Number(rows[0]?.category_count ?? 0),
    }
  } catch (error) {
    console.error('Error fetching library stats:', error)
    return { templateCount: 0, categoryCount: 0 }
  }
}

/**
 * Templates offered in the landing page's live generator. Questions are included
 * so the picker can switch templates without another round trip.
 */
export async function getAssistantDemoTemplates(limit = 6) {
  try {
    const rows = await sql`
      SELECT id, name, slug, description, system_prompt, questions
      FROM templates
      WHERE is_active = true
      ORDER BY is_featured DESC, name ASC
      LIMIT ${limit}
    `

    return rows.map((row: any) => ({
      id: row.id as number,
      name: row.name as string,
      slug: row.slug as string,
      description: (row.description as string) || '',
      systemPrompt:
        (row.system_prompt as string) ||
        'Write a professional, formal letter based on the provided information.',
      questions: row.questions
        ? typeof row.questions === 'string'
          ? JSON.parse(row.questions)
          : row.questions
        : [],
    }))
  } catch (error) {
    console.error('Error fetching assistant demo templates:', error)
    return []
  }
}

export async function getTemplateBySlug(slug: string) {
  try {
    const templates = await sql`
      SELECT 
        id, name, slug, description, category_id, system_prompt, questions, use_cases,
        COALESCE(estimated_length, '1-2 pages') as estimated_length
      FROM templates
      WHERE slug = ${slug} AND is_active = true
      LIMIT 1
    `
    
    if (templates.length === 0) {
      return null
    }
    
    const template = templates[0]
    
    // Get category info
    const categories = await sql`
      SELECT id, name, slug FROM categories WHERE id = ${template.category_id} LIMIT 1
    `
    
    const category = categories.length > 0 ? categories[0] : null
    
    return {
      ...template,
      category_name: category?.name,
      questions: template.questions ? (typeof template.questions === 'string' ? JSON.parse(template.questions) : template.questions) : [],
      system_prompt: template.system_prompt || 'Write a professional, formal letter based on the provided information.'
    }
  } catch (error) {
    console.error('Error fetching template:', error)
    return null
  }
}
