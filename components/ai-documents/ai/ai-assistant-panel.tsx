'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react'
import { PersonaMark } from '@/components/ai/persona-mark'

export type Question = {
  id: string
  label: string
  type: string
  required: boolean
  placeholder?: string
  options?: string[]
}

export type AssistantPersona = {
  name: string
  accent: string
  initial: string
}

type Props = {
  templateId: number
  questions: Question[]
  systemPrompt: string
  persona: AssistantPersona
  /** Shown in the assistant's opening line. */
  templateName?: string
}

export function AiAssistantPanel({
  templateId,
  questions,
  systemPrompt,
  persona,
  templateName,
}: Props) {
  const router = useRouter()
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [step, setStep] = useState(0)
  const [status, setStatus] = useState<'idle' | 'drafting' | 'done'>('idle')
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const total = questions.length
  const current = questions[step]
  const isLast = step === total - 1
  const answeredCount = questions.filter((q) => (formData[q.id] || '').trim() !== '').length
  const progress = total > 0 ? Math.round((answeredCount / total) * 100) : 0

  // Keep the newest streamed text in view while drafting.
  useEffect(() => {
    if (status === 'drafting' && canvasRef.current) {
      canvasRef.current.scrollTop = canvasRef.current.scrollHeight
    }
  }, [draft, status])

  const setValue = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
    setError(null)
  }

  const currentAnswer = current ? formData[current.id] || '' : ''
  const currentIsMissing = Boolean(current?.required && currentAnswer.trim() === '')

  const goNext = () => {
    if (currentIsMissing) {
      setError(`${current.label} is required.`)
      return
    }
    setError(null)
    if (!isLast) setStep((s) => s + 1)
  }

  const goBack = () => {
    setError(null)
    setStep((s) => Math.max(0, s - 1))
  }

  const missingRequired = useMemo(
    () => questions.filter((q) => q.required && (formData[q.id] || '').trim() === ''),
    [questions, formData],
  )

  /** Non-streaming fallback used when the stream endpoint is unavailable. */
  const generateWithoutStreaming = async () => {
    const response = await fetch('/api/generate-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, systemPrompt, userInputs: formData }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to generate document')
    return data.documentId as number
  }

  const handleGenerate = async () => {
    if (missingRequired.length > 0) {
      setError(`Please answer: ${missingRequired.map((q) => q.label).join(', ')}`)
      setStep(questions.indexOf(missingRequired[0]))
      return
    }

    setError(null)
    setDraft('')
    setStatus('drafting')

    try {
      const response = await fetch('/api/generate-document/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, systemPrompt, userInputs: formData }),
      })

      // Auth/credit problems are returned as normal JSON before the stream opens.
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to generate document')
      }

      if (!response.body) {
        const documentId = await generateWithoutStreaming()
        router.push(`/dashboard/documents/${documentId}`)
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let documentId: number | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        // The trailing entry may be a partial line; keep it for the next chunk.
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) continue
          let event: any
          try {
            event = JSON.parse(line)
          } catch {
            continue
          }

          if (event.type === 'delta') setDraft((prev) => prev + event.text)
          else if (event.type === 'reset') setDraft(event.text)
          else if (event.type === 'done') documentId = event.documentId
          else if (event.type === 'error') throw new Error(event.error)
        }
      }

      if (documentId == null) throw new Error('Document could not be saved. Please try again.')

      setStatus('done')
      router.push(`/dashboard/documents/${documentId}`)
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the document')
      setStatus('idle')
    }
  }

  const renderField = (question: Question) => {
    const value = formData[question.id] || ''

    if (question.type === 'textarea') {
      return (
        <Textarea
          id={question.id}
          value={value}
          onChange={(e) => setValue(question.id, e.target.value)}
          placeholder={question.placeholder}
          rows={5}
          className="resize-none text-base"
        />
      )
    }

    if (question.type === 'select' && question.options) {
      return (
        <Select value={value} onValueChange={(v) => setValue(question.id, v)}>
          <SelectTrigger id={question.id} className="min-h-[44px] text-base">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent className="bg-background">
            {question.options.map((option) => (
              <SelectItem key={option} value={option} className="text-base">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    return (
      <Input
        id={question.id}
        type={question.type === 'date' ? 'date' : 'text'}
        value={value}
        onChange={(e) => setValue(question.id, e.target.value)}
        placeholder={question.placeholder}
        className="min-h-[44px] text-base"
        // Enter advances the flow, but must not fire mid-IME composition.
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return
          if (e.nativeEvent.isComposing || e.keyCode === 229) return
          e.preventDefault()
          if (isLast) handleGenerate()
          else goNext()
        }}
      />
    )
  }

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This template has no questions configured yet.
      </p>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Conversation pane */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <PersonaMark initial={persona.initial} accent={persona.accent} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">{persona.name}</p>
            <p className="text-xs text-muted-foreground">
              {status === 'drafting' ? 'Drafting your document…' : 'Online · ready to draft'}
            </p>
          </div>
          <span className="ml-auto text-xs text-muted-foreground">
            Step {step + 1} of {total}
          </span>
        </div>

        <div
          className="h-1 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Questions answered"
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: persona.accent }}
          />
        </div>

        {/* Assistant turn */}
        <div className="flex gap-3">
          <PersonaMark initial={persona.initial} accent={persona.accent} size="sm" className="mt-1" />
          <div className="flex-1 rounded-2xl rounded-tl-sm border border-border bg-card p-4">
            {step === 0 && (
              <p className="mb-2 text-sm text-muted-foreground leading-relaxed">
                {`Hi, I'm ${persona.name}. I'll draft your ${templateName || 'document'} — just answer a few questions.`}
              </p>
            )}
            <Label htmlFor={current.id} className="text-base font-medium">
              {current.label}
              {current.required && <span className="ml-1 text-destructive">*</span>}
            </Label>
            <div className="mt-3">{renderField(current)}</div>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive leading-relaxed"
          >
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={status === 'drafting'}
              className="min-h-[44px]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}

          {!isLast ? (
            <Button type="button" onClick={goNext} className="ml-auto min-h-[44px]">
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={status === 'drafting'}
              className="ml-auto min-h-[44px]"
            >
              {status === 'drafting' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {persona.name} is writing…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate with {persona.name}
                </>
              )}
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          By generating a document you agree to our Terms of Service and acknowledge that this is
          not legal advice.
        </p>
      </div>

      {/* Live document canvas */}
      <div className="flex min-h-[360px] flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          </div>
          <p className="ml-2 text-xs font-medium text-muted-foreground">
            {templateName || 'Document preview'}
          </p>
          {status === 'drafting' && (
            <span
              className="ml-auto flex items-center gap-1.5 text-xs"
              style={{ color: persona.accent }}
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              drafting
            </span>
          )}
          {status === 'done' && (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="h-3 w-3" />
              complete
            </span>
          )}
        </div>

        <div ref={canvasRef} className="flex-1 overflow-y-auto p-5">
          {draft ? (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
              {draft}
              {status === 'drafting' && (
                <span
                  className="ml-0.5 inline-block h-4 w-[2px] animate-pulse align-middle"
                  style={{ backgroundColor: persona.accent }}
                />
              )}
            </pre>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <PersonaMark initial={persona.initial} accent={persona.accent} size="lg" />
              <p className="text-sm text-muted-foreground max-w-[24ch] leading-relaxed">
                {`Your document appears here as ${persona.name} writes it.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
