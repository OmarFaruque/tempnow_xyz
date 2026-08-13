import 'server-only'
import { cache } from 'react'
import { getSettings } from '@/lib/admin-settings'
import {
  DEFAULT_PERSONA,
  normalizeSlug,
  RESERVED_SLUGS,
  type AiPersonaSettings,
} from '@/lib/ai-persona-shared'

export type { AiPersonaSettings }

/** Validate a hex colour, falling back to the default accent. */
function normalizeAccent(input: unknown): string {
  return typeof input === 'string' && /^#[0-9a-fA-F]{6}$/.test(input.trim())
    ? input.trim()
    : DEFAULT_PERSONA.accent
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

/**
 * Merge stored settings over the defaults so a partially populated row never
 * renders blank UI. Never throws: a database problem must not break the header.
 */
export function resolvePersona(raw: unknown): AiPersonaSettings {
  const value = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>

  const name = asString(value.name, DEFAULT_PERSONA.name)
  const slug = normalizeSlug(asString(value.slug, '')) || normalizeSlug(name) || DEFAULT_PERSONA.slug

  return {
    name,
    // A slug colliding with a real route would make that route unreachable.
    slug: RESERVED_SLUGS.includes(slug) ? DEFAULT_PERSONA.slug : slug,
    tagline: asString(value.tagline, DEFAULT_PERSONA.tagline),
    headline: asString(value.headline, ''),
    intro: asString(value.intro, ''),
    accent: normalizeAccent(value.accent),
    model: asString(value.model, DEFAULT_PERSONA.model),
    enabled: value.enabled === undefined ? true : Boolean(value.enabled),
  }
}

/**
 * Cached per request so the header, page body and metadata share one query.
 */
export const getAiPersona = cache(async (): Promise<AiPersonaSettings> => {
  try {
    const stored = await getSettings('ai_persona')
    return resolvePersona(stored)
  } catch (error) {
    console.error('[v0] Failed to load AI persona settings:', error)
    return DEFAULT_PERSONA
  }
})

/** First letter of the persona name, used for the monogram mark. */
export function getPersonaInitial(persona: Pick<AiPersonaSettings, 'name'>): string {
  return (persona.name || DEFAULT_PERSONA.name).charAt(0).toUpperCase()
}
