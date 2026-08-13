import { sql } from '@/lib/db'

export type SettingsKey = 'stripe' | 'ai_persona'

export interface StripeSettings {
  publishable_key: string
  secret_key: string
  webhook_secret: string
  sandbox: boolean
}

export interface AiPersonaSettings {
  /** Display name of the assistant, e.g. "Lettie". */
  name: string
  /** URL segment the assistant page lives at, e.g. "lettie" -> /lettie */
  slug: string
  tagline: string
  /** Optional overrides for the landing page hero copy. */
  headline: string
  intro: string
  /** Hex accent colour driving the persona gradients. */
  accent: string
  /** AI Gateway model string used for document generation. */
  model: string
  enabled: boolean
}

export async function getSettings(key: SettingsKey): Promise<any> {
  try {
    const result = await sql`
      SELECT value FROM settings WHERE key = ${key}
    `
    return result.length > 0 ? result[0].value : null
  } catch (error) {
    console.error(`Error fetching settings for key ${key}:`, error)
    return null
  }
}

export async function updateSettings(key: SettingsKey, value: any): Promise<boolean> {
  try {
    await sql`
      INSERT INTO settings (key, value, updated_at)
      VALUES (${key}, ${JSON.stringify(value)}, CURRENT_TIMESTAMP)
      ON CONFLICT (key) 
      DO UPDATE SET value = ${JSON.stringify(value)}, updated_at = CURRENT_TIMESTAMP
    `
    return true
  } catch (error) {
    console.error(`Error updating settings for key ${key}:`, error)
    return false
  }
}

export async function getAllSettings(): Promise<Record<string, any>> {
  try {
    const result = await sql`
      SELECT key, value FROM settings
    `
    const settings: Record<string, any> = {}
    result.forEach((row: any) => {
      settings[row.key] = row.value
    })
    return settings
  } catch (error) {
    console.error('Error fetching all settings:', error)
    return {}
  }
}
