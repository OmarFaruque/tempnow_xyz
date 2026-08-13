import { streamText } from 'ai'
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

export const maxDuration = 60

/**
 * Streams a generated document as newline-delimited JSON so the client can render
 * text as it arrives and still receive the persisted document id at the end.
 *
 *   {"type":"delta","text":"..."}
 *   {"type":"done","documentId":123,"usedFallback":false}
 *   {"type":"error","error":"..."}
 *
 * Auth and credit checks run *before* the stream opens, because once a streaming
 * response has started we can no longer return a meaningful HTTP status code.
 */
export async function POST(req: Request) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let templateId: number
  let systemPrompt: string
  let userInputs: Record<string, unknown>

  try {
    const body = await req.json()
    templateId = Number(body.templateId)
    systemPrompt = body.systemPrompt
    userInputs = body.userInputs
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (
    !Number.isFinite(templateId) ||
    templateId <= 0 ||
    !systemPrompt ||
    !userInputs ||
    typeof userInputs !== 'object'
  ) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { entries, inputBlock, keyBlock } = formatDynamicInputs(userInputs)

  if (entries.length === 0) {
    return NextResponse.json({ error: 'No usable input fields were provided' }, { status: 400 })
  }

  const creditsPerDocument = await getCreditsPerDocumentForUser(user.id)
  const credits = await getUserCredits(user.id)

  if (Number(credits.credits_available) < creditsPerDocument) {
    return NextResponse.json(
      { error: 'Insufficient credits. Please purchase credits or subscribe to a plan.' },
      { status: 402 },
    )
  }

  const persona = await getAiPersona()
  const prompt = buildDocumentPrompt({ systemPrompt, inputBlock, keyBlock })
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`))
      }

      let text = ''
      let usedFallback = false

      try {
        const result = streamText({
          model: persona.model,
          prompt,
          maxOutputTokens: 2000,
          temperature: 0.7,
        })

        for await (const delta of result.textStream) {
          text += delta
          send({ type: 'delta', text: delta })
        }
      } catch (aiError: any) {
        console.warn('[v0] Streaming generation failed, using fallback document.', {
          reason: String(aiError?.message || 'unknown'),
        })
        usedFallback = true
        text = createFallbackDocument(systemPrompt, entries)
        // Replace whatever partial text the client already rendered.
        send({ type: 'reset', text })
      }

      if (!text.trim()) {
        usedFallback = true
        text = createFallbackDocument(systemPrompt, entries)
        send({ type: 'reset', text })
      }

      try {
        const templateName = await getTemplateName(templateId)

        const documentId = await createDocument({
          userId: user.id,
          templateId,
          templateName,
          content: text,
          userInputs,
          creditsPerDocument,
        })

        // Credits are only charged once a document has actually been produced.
        await deductUserCredits(user.id, creditsPerDocument)

        send({ type: 'done', documentId, usedFallback })
      } catch (persistError: any) {
        console.error('[v0] Failed to persist streamed document:', persistError)
        send({ type: 'error', error: 'Document could not be saved. Please try again.' })
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      // 'no-transform' stops intermediaries from re-encoding (and thus buffering) the
      // body, and 'X-Accel-Buffering: no' opts out of nginx-style proxy buffering.
      // Without these the whole document arrives as a single chunk and the
      // progressive "Lettie is writing" effect silently degrades to a long spinner.
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
