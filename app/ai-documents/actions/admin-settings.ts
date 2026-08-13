'use server'

import { revalidatePath } from 'next/cache'
import { getAdminSession } from '@letterise/lib/admin-auth'
import { updateSettings } from '@letterise/lib/admin-settings'
import { normalizeSlug, RESERVED_SLUGS } from '@letterise/lib/ai-persona-shared'
import { redirect } from 'next/navigation'

export async function saveAdminSettingsAction(formData: FormData) {
  const admin = await getAdminSession()
  if (!admin) redirect('/admin-login')

  const stripeSettingsJson = formData.get('stripeSettings')
  
  if (stripeSettingsJson) {
    const stripeSettings = JSON.parse(stripeSettingsJson as string)
    await updateSettings('stripe', stripeSettings)
  }

  revalidatePath('/administrator')
}

export async function updateAiPersonaAction(input: {
  name: string
  slug: string
  tagline: string
  headline: string
  intro: string
  accent: string
  model: string
  enabled: boolean
}): Promise<{ success: boolean; error?: string; slug?: string }> {
  const admin = await getAdminSession()
  if (!admin) return { success: false, error: 'Not authorised.' }

  const name = (input.name || '').trim()
  if (name.length < 2) {
    return { success: false, error: 'Assistant name must be at least 2 characters.' }
  }
  if (name.length > 40) {
    return { success: false, error: 'Assistant name must be 40 characters or fewer.' }
  }

  // Fall back to the name when the slug field is left empty.
  const slug = normalizeSlug(input.slug) || normalizeSlug(name)
  if (!slug) {
    return { success: false, error: 'Enter a URL slug using letters or numbers.' }
  }
  if (RESERVED_SLUGS.includes(slug)) {
    return {
      success: false,
      error: `"/${slug}" is used by an existing page. Choose a different URL slug.`,
    }
  }

  if (!/^#[0-9a-fA-F]{6}$/.test((input.accent || '').trim())) {
    return { success: false, error: 'Accent colour must be a hex value such as #ec4899.' }
  }

  const saved = await updateSettings('ai_persona', {
    name,
    slug,
    tagline: (input.tagline || '').trim(),
    headline: (input.headline || '').trim(),
    intro: (input.intro || '').trim(),
    accent: input.accent.trim(),
    model: (input.model || '').trim() || 'openai/gpt-4o',
    enabled: Boolean(input.enabled),
  })

  if (!saved) {
    return { success: false, error: 'Could not save settings. Please try again.' }
  }

  // The header and the persona route both depend on this, so refresh everything.
  revalidatePath('/', 'layout')

  return { success: true, slug }
}
