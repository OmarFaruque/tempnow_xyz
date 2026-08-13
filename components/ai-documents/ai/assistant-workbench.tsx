'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AiAssistantPanel, type AssistantPersona, type Question } from '@/components/ai/ai-assistant-panel'
import { Lock } from 'lucide-react'

export type DemoTemplate = {
  id: number
  name: string
  slug: string
  description: string
  systemPrompt: string
  questions: Question[]
}

/**
 * Live generator embedded in the persona landing page. Templates arrive with
 * their questions already loaded, so switching is instant.
 */
export function AssistantWorkbench({
  templates,
  persona,
  canGenerate,
}: {
  templates: DemoTemplate[]
  persona: AssistantPersona
  canGenerate: boolean
}) {
  const [activeId, setActiveId] = useState(templates[0]?.id ?? null)
  const active = templates.find((t) => t.id === activeId) ?? templates[0]

  if (!active) {
    return (
      <p className="text-sm text-muted-foreground">
        No templates are available yet. Add templates in the admin panel.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Choose a document type">
        {templates.map((template) => {
          const isActive = template.id === active.id
          return (
            <button
              key={template.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(template.id)}
              className="rounded-full border px-4 py-2 text-sm transition-colors"
              style={
                isActive
                  ? {
                      borderColor: persona.accent,
                      backgroundColor: `color-mix(in srgb, ${persona.accent} 15%, transparent)`,
                      color: persona.accent,
                    }
                  : undefined
              }
            >
              {template.name}
            </button>
          )
        })}
      </div>

      {canGenerate ? (
        <AiAssistantPanel
          key={active.id}
          templateId={active.id}
          questions={active.questions}
          systemPrompt={active.systemPrompt}
          templateName={active.name}
          persona={persona}
        />
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-12 text-center">
          <Lock className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="font-medium">{`Sign in to draft with ${persona.name}`}</p>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {active.description || `Create an account to generate your ${active.name}.`}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="min-h-[44px]">
              <Link href={`/login?redirect=/templates/${active.slug}`}>Sign in</Link>
            </Button>
            <Button asChild variant="outline" className="min-h-[44px]">
              <Link href="/signup">Create account</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
