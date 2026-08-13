import 'server-only'
import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.warn('DATABASE_URL environment variable is not set. Database features will fail.')
}

export const sql = DATABASE_URL 
  ? postgres(DATABASE_URL, { prepare: false, idle_timeout: 30 }) 
  : (() => { throw new Error('DATABASE_URL environment variable is not set') }) as any


export type User = {
  id: number
  email: string
  password_hash: string
  full_name: string | null
  created_at: Date
  updated_at: Date
}

export type Category = {
  id: number
  name: string
  slug: string
  description: string | null
  icon: string | null
  display_order: number
  is_active: boolean
}

export type Template = {
  id: number
  category_id: number
  name: string
  slug: string
  description: string | null
  use_cases: string[] | null
  system_prompt: string
  questions: any
  estimated_length: string | null
  is_featured: boolean
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export type Document = {
  id: number
  user_id: number
  template_id: number | null
  title: string
  content: string
  user_inputs: any
  status: string
  credits_used: number
  created_at: Date
  updated_at: Date
}

export type SubscriptionPlan = {
  id: number
  name: string
  description: string | null
  price_cents: number
  credits_per_month: number | null
  is_active: boolean
  created_at: Date
}

export type UserSubscription = {
  id: number
  user_id: number
  plan_id: number
  stripe_subscription_id: string | null
  status: string
  current_period_start: Date | null
  current_period_end: Date | null
  cancel_at_period_end: boolean
  created_at: Date
  updated_at: Date
}

export type UserCredits = {
  id: number
  user_id: number
  credits_available: number
  credits_used: number
  updated_at: Date
}


export type AdminUser = {
  id: number
  first_name: string
  last_name: string
  email: string
  password_hash: string
  role: 'admin' | 'super_admin' | 'manager'
  is_active: boolean
  last_login_at: Date | null
  created_at: Date
  updated_at: Date
}
