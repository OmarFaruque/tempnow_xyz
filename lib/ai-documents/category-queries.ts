import 'server-only'
import { sql } from '@/lib/db'

export async function categoriesLists() {
  try {
    return await sql`
      SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        COUNT(t.id) AS template_count
      FROM categories c
      LEFT JOIN templates t
        ON t.category_id = c.id
        AND t.is_active = true
      WHERE c.is_active = true
      GROUP BY c.id
      HAVING COUNT(t.id) > 0
      ORDER BY c.display_order, c.name
    `
  } catch (error) {
    console.error('Error fetching categories with template count:', error)
    return []
  }
}

export async function getTemplateByCategorySlug(slug: string) {
  try {
    const rows = await sql`
      SELECT
        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        c.description AS category_description,
        t.id AS template_id,
        t.slug AS template_slug,
        t.name AS template_name,
        t.description AS template_description,
        t.use_cases,
        COALESCE(t.estimated_length, '1-2 pages') AS estimated_pages,
        t.is_featured AS is_popular
      FROM categories c
      LEFT JOIN templates t
        ON t.category_id = c.id
        AND t.is_active = true
      WHERE c.slug = ${slug}
        AND c.is_active = true
      ORDER BY t.name
    `

    if (rows.length === 0) {
      return null
    }

    const firstRow = rows[0]
    const category = {
      id: firstRow.category_id,
      name: firstRow.category_name,
      slug: firstRow.category_slug,
      description: firstRow.category_description,
    }

    return {
      category,
      templates: rows
        .filter((row) => row.template_id !== null)
        .map((row) => ({
        id: row.template_id,
        slug: row.template_slug,
        name: row.template_name,
        description: row.template_description,
        estimated_pages: row.estimated_pages,
        is_popular: row.is_popular,
        use_cases: (() => {
          if (typeof row.use_cases !== 'string') {
            return row.use_cases
          }

          try {
            return JSON.parse(row.use_cases)
          } catch {
            return []
          }
        })(),
      })),
    }
  } catch (error) {
    console.error('Error fetching category page data:', error)
    return null
  }
}