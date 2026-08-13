'use client'

import { useState, useTransition } from 'react'
import { Button } from '@letterise/components/ui/button'
import { Input } from '@letterise/components/ui/input'
import { Label } from '@letterise/components/ui/label'
import { Textarea } from '@letterise/components/ui/textarea'
import { Checkbox } from '@letterise/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@letterise/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@letterise/components/ui/select'
import { Check, ExternalLink, Loader2 } from 'lucide-react'
import { PersonaMark } from '@letterise/components/ai/persona-mark'
import { normalizeSlug, type AiPersonaSettings } from '@letterise/lib/ai-persona-shared'
import { updateAiPersonaAction } from '@/app/ai-documents/actions/admin-settings'

const MODELS = [
  { value: 'openai/gpt-4o', label: 'GPT-4o — best quality' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o mini — faster, cheaper' },
  { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4' },
  { value: 'openai/gpt-4.1', label: 'GPT-4.1' },
]

export function AdminAiPersonaEditor({ initial }: { initial: AiPersonaSettings }) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [form, setForm] = useState<AiPersonaSettings>(initial)

  const set = <K extends keyof AiPersonaSettings>(key: K, value: AiPersonaSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setMessage(null)
  }

  // Mirrors the server-side normalisation so the preview matches the saved URL.
  const previewSlug = normalizeSlug(form.slug) || normalizeSlug(form.name) || 'lettie'
  const initialLetter = (form.name || 'A').charAt(0).toUpperCase()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateAiPersonaAction({
        name: form.name,
        slug: form.slug,
        tagline: form.tagline,
        headline: form.headline,
        intro: form.intro,
        accent: form.accent,
        model: form.model,
        enabled: form.enabled,
      })

      if (result.success) {
        if (result.slug) setForm((prev) => ({ ...prev, slug: result.slug! }))
        setMessage({ type: 'success', text: 'AI assistant updated.' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Could not save settings.' })
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Assistant</CardTitle>
        <CardDescription>
          Name and brand the AI assistant for this website. The name appears in the header, on the
          homepage and throughout the document generator.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Live preview */}
          <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-4">
            <PersonaMark initial={initialLetter} accent={form.accent} size="lg" />
            <div className="min-w-0">
              <p className="text-lg font-semibold">{form.name || 'Unnamed'}</p>
              <p className="text-sm text-muted-foreground">{form.tagline || 'No tagline set'}</p>
              <a
                href={`/${previewSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {`/${previewSlug}`}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="persona-name">Assistant name</Label>
              <Input
                id="persona-name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Lettie"
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">Shown on the header button.</p>
            </div>

            <div>
              <Label htmlFor="persona-slug">URL slug</Label>
              <Input
                id="persona-slug"
                value={form.slug}
                onChange={(e) => set('slug', e.target.value)}
                placeholder="lettie"
                className="mt-1 font-mono text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {`The assistant page will live at /${previewSlug}`}
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="persona-tagline">Tagline</Label>
            <Input
              id="persona-tagline"
              value={form.tagline}
              onChange={(e) => set('tagline', e.target.value)}
              placeholder="Your AI legal document assistant"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="persona-headline">Hero headline (optional)</Label>
            <Input
              id="persona-headline"
              value={form.headline}
              onChange={(e) => set('headline', e.target.value)}
              placeholder={`Meet ${form.name || 'Lettie'}.`}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Leave blank to use the default headline.
            </p>
          </div>

          <div>
            <Label htmlFor="persona-intro">Hero intro (optional)</Label>
            <Textarea
              id="persona-intro"
              value={form.intro}
              onChange={(e) => set('intro', e.target.value)}
              rows={3}
              placeholder="Leave blank to use the default description."
              className="mt-1 resize-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="persona-accent">Accent colour</Label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id="persona-accent"
                  type="color"
                  value={form.accent}
                  onChange={(e) => set('accent', e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent"
                  aria-label="Accent colour picker"
                />
                <Input
                  value={form.accent}
                  onChange={(e) => set('accent', e.target.value)}
                  placeholder="#ec4899"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="persona-model">AI model</Label>
              <Select value={form.model} onValueChange={(v) => set('model', v)}>
                <SelectTrigger id="persona-model" className="mt-1">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Used to generate every document.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-md bg-muted/30 p-3">
            <Checkbox
              id="persona-enabled"
              checked={form.enabled}
              onCheckedChange={(checked) => set('enabled', !!checked)}
            />
            <div className="grid gap-1 leading-none">
              <Label htmlFor="persona-enabled" className="text-sm font-medium">
                Show the assistant publicly
              </Label>
              <p className="text-xs text-muted-foreground">
                {`When unchecked, the header button is hidden and /${previewSlug} returns 404.`}
              </p>
            </div>
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save AI Assistant
          </Button>

          {message && (
            <div
              role="status"
              className={
                message.type === 'success'
                  ? 'flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-900 dark:bg-green-950 dark:text-green-100'
                  : 'rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive'
              }
            >
              {message.type === 'success' && <Check className="h-4 w-4" />}
              {message.text}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
