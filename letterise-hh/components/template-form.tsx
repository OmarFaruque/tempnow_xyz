'use client'

import { AiAssistantPanel, type AssistantPersona, type Question } from '@letterise/components/ai/ai-assistant-panel'

type TemplateFormProps = {
  templateId: number
  questions: Question[]
  systemPrompt: string
  persona: AssistantPersona
  templateName?: string
}

/**
 * Thin wrapper kept for existing call sites; the assistant panel is the real UI.
 */
export function TemplateForm({
  templateId,
  questions,
  systemPrompt,
  persona,
  templateName,
}: TemplateFormProps) {
  return (
    <AiAssistantPanel
      templateId={templateId}
      questions={questions}
      systemPrompt={systemPrompt}
      persona={persona}
      templateName={templateName}
    />
  )
}
