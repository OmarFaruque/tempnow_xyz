import 'server-only'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { sql } from './db'

const MAIN_SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret'
)

export type SessionData = {
  id: string
  email: string
  firstName?: string
  lastName?: string
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, MAIN_SECRET_KEY)
    return payload as unknown as SessionData
  } catch (error) {
    console.error('Failed to verify main JWT token in letterise getSession:', error)
    return null
  }
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null

  try {
    const email = session.email
    const firstName = session.firstName || ''
    const lastName = session.lastName || ''
    const fullName = `${firstName} ${lastName}`.trim()

    // Look up user by email in the letterise Neon database
    let userResult = await sql`
      SELECT id, email, full_name, created_at
      FROM users
      WHERE email = ${email}
    `

    if (userResult.length === 0) {
      // Provision the user in the letterise Neon database (JIT SSO)
      const insertResult = await sql`
        INSERT INTO users (email, password_hash, full_name, created_at, updated_at)
        VALUES (${email}, 'dummy_sso_password', ${fullName || null}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, email, full_name, created_at
      `
      
      const newUserId = insertResult[0].id
      // Provision initial credits
      await sql`
        INSERT INTO user_credits (user_id, credits_available, credits_used, updated_at)
        VALUES (${newUserId}, 10, 0, CURRENT_TIMESTAMP)
      `
      
      return insertResult[0]
    }

    return userResult[0]
  } catch (error) {
    console.error('SSO decoding or JIT provisioning failed in letterise:', error)
    return null
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
