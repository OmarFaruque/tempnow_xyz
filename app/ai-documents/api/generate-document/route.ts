import { generateText } from 'ai'
import { requireAuth } from '@letterise/lib/auth'
import { getAiPersona } from '@letterise/lib/ai-persona'
import {
  buildDocumentPrompt,
  createFallbackDocument,
  formatDynamicInputs,
} from '@letterise/lib/document-generation'
import {
  createDocument,
  deductUserCredits,
  getCreditsPerDocumentForUser,
  getTemplateName,
  getUserCredits,
} from '@letterise/lib/document-generation-repo'
import { NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const user = await requireAuth()
    const { templateId, systemPrompt, userInputs } = await req.json()

    if (!templateId || !systemPrompt || !userInputs || typeof userInputs !== 'object') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const creditsPerDocument = await getCreditsPerDocumentForUser(user.id)

    const credits = await getUserCredits(user.id)

    if (Number(credits.credits_available) < creditsPerDocument) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase credits or subscribe to a plan.' },
        { status: 402 },
      )
    }

    // Format user inputs for the AI prompt
    const { entries, inputBlock, keyBlock } = formatDynamicInputs(userInputs)

    if (entries.length === 0) {
      return NextResponse.json({ error: 'No usable input fields were provided' }, { status: 400 })
    }

    const persona = await getAiPersona()
    const aiPrompt = buildDocumentPrompt({ systemPrompt, inputBlock, keyBlock })

    let text = ''
    let generatedWithFallback = false

    // Requests are routed through the Vercel AI Gateway, so no provider key is needed.
    try {
      const aiResult = await generateText({
        model: persona.model,
        prompt: aiPrompt,
        maxOutputTokens: 2000,
        temperature: 0.7,
      })
      text = aiResult.text
    } catch (aiError: any) {
      // Any provider failure should still return a usable document rather than an error.
      console.warn('[v0] Falling back to rule-based document generation due to AI provider error.', {
        reason: String(aiError?.message || 'unknown'),
      })
      generatedWithFallback = true
      text = createFallbackDocument(systemPrompt, entries)
    }

    if (!text.trim()) {
      generatedWithFallback = true
      text = createFallbackDocument(systemPrompt, entries)
    }

    const templateName = await getTemplateName(templateId)

    const documentId = await createDocument({
      userId: user.id,
      templateId,
      templateName,
      content: text,
      userInputs,
      creditsPerDocument,
    })

    await deductUserCredits(user.id, creditsPerDocument)

    return NextResponse.json({
      success: true,
      documentId,
      usedFallback: generatedWithFallback,
    })
  } catch (error: any) {
    console.error('[v0] Document generation error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const message = error?.message || 'Unknown error'

    return NextResponse.json(
      {
        error: 'Failed to generate document. Please try again.',
        debugCode: 'DOCUMENT_GENERATION_FAILED',
        details: message,
      },
      { status: 500 },
    )
  }
}
