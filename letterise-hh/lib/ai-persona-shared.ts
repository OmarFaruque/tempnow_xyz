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

export const DEFAULT_PERSONA: AiPersonaSettings = {
  name: 'Lettie',
  slug: 'lettie',
  tagline: 'Your AI legal document assistant',
  headline: '',
  intro: '',
  accent: '#ec4899',
  model: 'openai/gpt-4o',
  enabled: true,
}

/**
 * Top level route segments that already exist in the app. The persona slug can
 * never take one of these over, otherwise it would shadow a real page.
 */
export const RESERVED_SLUGS = [
  'api',
  'administrator',
  'categories',
  'dashboard',
  'how-it-works',
  'login',
  'signup',
  'pricing',
  'templates',
  'documents',
  'settings',
  'checkout',
  'auth',
]

/** Normalise arbitrary admin input into a safe URL segment. */
export function normalizeSlug(input: string): string {
  return (input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}