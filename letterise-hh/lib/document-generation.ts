export interface PromptEntry {
  key: string
  label: string
  value: string
}

function formatFieldLabel(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (s) => s.toUpperCase())
}

/**
 * Turn the dynamic, template-defined answers into prompt-ready blocks.
 * Field names are not fixed, so both the raw key and a human label are kept.
 */
export function formatDynamicInputs(userInputs: Record<string, unknown>) {
  const entries: PromptEntry[] = Object.entries(userInputs)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]) => ({
      key,
      label: formatFieldLabel(key),
      value: String(value).trim(),
    }))

  const inputBlock = entries.map(({ label, value }) => `- ${label}: ${value}`).join('\n')
  const keyBlock = entries.map(({ key, label }) => `- ${key} => ${label}`).join('\n')

  return { entries, inputBlock, keyBlock }
}

/** The single prompt used by both the streaming and non-streaming routes. */
export function buildDocumentPrompt({
  systemPrompt,
  inputBlock,
  keyBlock,
}: {
  systemPrompt: string
  inputBlock: string
  keyBlock: string
}): string {
  return `${systemPrompt}

      You are generating a document from dynamic backend form fields. Field names are not fixed and may change by template.

      Dynamic field mapping (raw key => human label):
      ${keyBlock}

      Provided template data:
      ${inputBlock}

      Instructions:
      1) Use only provided facts. Do not invent names, addresses, dates, legal references, diagnoses, or outcomes.
      2) If any expected legal or procedural fact is missing, continue professionally using neutral placeholders like "[not provided]" and avoid hallucinations.
      3) Convert dynamic keys into natural language in the final document (never show raw JSON keys).
      4) Follow the document type and jurisdiction requested in the system prompt. Do not force UK format unless explicitly requested.
      5) Produce a complete, ready-to-use professional document with suitable structure for the requested type (for example: letter, statement, notice, agreement, submission, or application).
      6) If the requested output is a letter, include sender/recipient/date/subject/salutation/body/closing where available.
      7) Where relevant, include concise legal/procedural framing aligned to the user's system prompt, but do not cite fictional laws or case law.

      Return only the final document content with proper line breaks.`
}

/**
 * Deterministic document built purely from the submitted answers. Used only as a
 * safety net when the model call fails, so the user still receives something.
 */
export function createFallbackDocument(
  systemPrompt: string,
  entries: Array<{ label: string; value: string }>,
) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const structuredAnswers = entries.map(({ label, value }) => `${label}:\n${value}`).join('\n\n')

  return `Generated on: ${today}

  Document Type Context:
  ${systemPrompt.trim() || '[not provided]'}

  Submitted Information:
  ${structuredAnswers}
`
}
