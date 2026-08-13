import 'server-only'

import { sql } from '@/lib/db'

export type AdminDashboardData = {
  stats: {
    users: number
    documents: number
    templates: number
    activeCategories: number
    activeSubscriptions: number
    revenueCents: number
    creditsUsed: number
  }
  recentDocuments: any[]
  users: any[]
  categories: any[]
  templates: any[]
  transactions: any[]
  subscriptions: any[]
  plans: any[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

function toNumber(value: unknown) {
  return Number(value ?? 0)
}

export async function getAdminDashboardData(
  search = '', 
  section = 'overview', 
  page = 1, 
  limit = 20,
  filters: { categoryId?: number; isActive?: boolean; isFeatured?: boolean } = {}
): Promise<AdminDashboardData> {
  const searchTerm = `%${search}%`
  const offset = (page - 1) * limit

  // Always fetch stats and recent documents
  const [
    statsRows,
    recentDocuments,
    plans,
    allCategories,
  ] = await Promise.all([
    sql`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM documents) AS documents,
        (SELECT COUNT(*) FROM templates) AS templates,
        (SELECT COUNT(*) FROM categories WHERE is_active = true) AS active_categories,
        (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active') AS active_subscriptions,
        (SELECT COALESCE(SUM(amount_cents), 0) FROM transactions WHERE status = 'completed') AS revenue_cents,
        (SELECT COALESCE(SUM(credits_used), 0) FROM user_credits) AS credits_used
    `,
    sql`
      SELECT
        d.id,
        d.title,
        d.status,
        d.credits_used,
        d.created_at,
        u.email,
        t.name AS template_name,
        c.name AS category_name
      FROM documents d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN templates t ON d.template_id = t.id
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY d.created_at DESC
      LIMIT 12
    `,
    sql`
      SELECT
        id, name, description, plan_type, price_cents, package_price_cents,
        price_per_document_cents, credit_amount, monthly_document_limit,
        discount_percent, features, credits_per_month, is_active, created_at
      FROM subscription_plans
      ORDER BY price_cents
    `,
    sql`
      SELECT id, name, slug FROM categories WHERE is_active = true ORDER BY name
    `,
  ])

  let users: any[] = []
  let templates: any[] = []
  let transactions: any[] = []
  let subscriptions: any[] = []
  let categories: any[] = []
  let totalCount = 0

  if (section === 'users') {
    const countResult = await sql`
      SELECT COUNT(*) FROM users u
      WHERE ${search === ''}
        OR u.email ILIKE ${searchTerm}
        OR COALESCE(u.full_name, '') ILIKE ${searchTerm}
    `
    totalCount = toNumber(countResult[0].count)
    
    users = await sql`
      SELECT
        u.id, u.email, u.full_name, u.created_at,
        COALESCE(uc.credits_available, 0) AS credits_available,
        COALESCE(uc.credits_used, 0) AS credits_used,
        (SELECT COUNT(*) FROM documents d WHERE d.user_id = u.id) AS document_count,
        (
          SELECT p.name
          FROM user_subscriptions us
          JOIN subscription_plans p ON us.plan_id = p.id
          WHERE us.user_id = u.id AND us.status = 'active'
          ORDER BY us.created_at DESC
          LIMIT 1
        ) AS active_plan
      FROM users u
      LEFT JOIN user_credits uc ON uc.user_id = u.id
      WHERE ${search === ''}
        OR u.email ILIKE ${searchTerm}
        OR COALESCE(u.full_name, '') ILIKE ${searchTerm}
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
  } else if (section === 'templates') {
    const { categoryId, isActive, isFeatured } = filters
    
    const countResult = await sql`
      SELECT COUNT(*) FROM templates t
      WHERE (t.name ILIKE ${searchTerm} OR t.slug ILIKE ${searchTerm})
      AND (${categoryId === undefined} OR t.category_id = ${categoryId})
      AND (${isActive === undefined} OR t.is_active = ${isActive})
      AND (${isFeatured === undefined} OR t.is_featured = ${isFeatured})
    `
    totalCount = toNumber(countResult[0].count)

    templates = await sql`
      SELECT
        t.id, t.category_id, t.name, t.slug, t.description, t.use_cases,
        t.system_prompt, t.questions, t.estimated_length, t.is_featured,
        t.is_active, t.updated_at, c.name AS category_name
      FROM templates t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE (t.name ILIKE ${searchTerm} OR t.slug ILIKE ${searchTerm})
      AND (${categoryId === undefined} OR t.category_id = ${categoryId})
      AND (${isActive === undefined} OR t.is_active = ${isActive})
      AND (${isFeatured === undefined} OR t.is_featured = ${isFeatured})
      ORDER BY c.display_order, t.name
      LIMIT ${limit} OFFSET ${offset}
    `
    categories = allCategories
  } else if (section === 'categories') {
    const countResult = await sql`
      SELECT COUNT(*) FROM categories c
      WHERE (c.name ILIKE ${searchTerm} OR c.slug ILIKE ${searchTerm})
    `
    totalCount = toNumber(countResult[0].count)

    categories = await sql`
      SELECT
        c.id, c.name, c.slug, c.description, c.display_order, c.is_active, c.icon,
        COUNT(t.id) AS template_count
      FROM categories c
      LEFT JOIN templates t ON t.category_id = c.id
      WHERE (c.name ILIKE ${searchTerm} OR c.slug ILIKE ${searchTerm})
      GROUP BY c.id
      ORDER BY c.display_order, c.name
      LIMIT ${limit} OFFSET ${offset}
    `
  } else if (section === 'payments') {
    const countResult = await sql`
      SELECT COUNT(*) FROM transactions tr
      LEFT JOIN users u ON tr.user_id = u.id
      WHERE ${search === ''} OR u.email ILIKE ${searchTerm}
    `
    totalCount = toNumber(countResult[0].count)

    transactions = await sql`
      SELECT
        tr.id, tr.amount_cents, tr.credits_purchased, tr.transaction_type,
        tr.status, tr.created_at, tr.stripe_payment_id, u.email
      FROM transactions tr
      LEFT JOIN users u ON tr.user_id = u.id
      WHERE ${search === ''} OR u.email ILIKE ${searchTerm}
      ORDER BY tr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
  } else if (section === 'subscriptions') {
    const countResult = await sql`
      SELECT COUNT(*) FROM user_subscriptions us
      LEFT JOIN users u ON us.user_id = u.id
      WHERE ${search === ''} OR u.email ILIKE ${searchTerm}
    `
    totalCount = toNumber(countResult[0].count)

    subscriptions = await sql`
      SELECT
        us.id, us.status, us.current_period_start, us.current_period_end,
        us.created_at, us.stripe_subscription_id, u.email, p.name AS plan_name
      FROM user_subscriptions us
      LEFT JOIN users u ON us.user_id = u.id
      LEFT JOIN subscription_plans p ON us.plan_id = p.id
      WHERE ${search === ''} OR u.email ILIKE ${searchTerm}
      ORDER BY us.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
  } else {
    // For overview or other sections, just provide basic categories
    categories = allCategories
  }

  const stats = statsRows[0] || {}

  return {
    stats: {
      users: toNumber(stats.users),
      documents: toNumber(stats.documents),
      templates: toNumber(stats.templates),
      activeCategories: toNumber(stats.active_categories),
      activeSubscriptions: toNumber(stats.active_subscriptions),
      revenueCents: toNumber(stats.revenue_cents),
      creditsUsed: toNumber(stats.credits_used),
    },
    recentDocuments,
    users,
    categories,
    templates,
    transactions,
    subscriptions,
    plans,
    pagination: totalCount > 0 ? {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    } : undefined
  }
}
