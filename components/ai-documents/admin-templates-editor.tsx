'use client'

import { useState, useTransition, useEffect } from 'react'
import { ChevronDown, Loader2, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { saveTemplateAction, deleteTemplateAction } from '@/app/actions/admin-templates'
import { QuestionsEditor, Question } from './admin-questions-editor'

type Template = {
  id?: number
  category_id: number
  name: string
  slug: string
  description: string
  use_cases: string[]
  system_prompt: string
  questions: Question[]
  estimated_length: string
  is_featured: boolean
  is_active: boolean
  category_name?: string
}

type Category = {
  id: number
  name: string
}

const emptyTemplate = (categories: Category[]): Template => ({
  category_id: categories.length > 0 ? categories[0].id : 0,
  name: '',
  slug: '',
  description: '',
  use_cases: [],
  system_prompt: '',
  questions: [],
  estimated_length: '',
  is_featured: false,
  is_active: true,
})

export function AdminTemplatesEditor({ 
  initialTemplates, 
  categories 
}: { 
  initialTemplates: Template[]
  categories: Category[]
}) {
  const [templates, setTemplates] = useState<Template[]>(
    initialTemplates.map(t => ({
      ...t,
      use_cases: Array.isArray(t.use_cases) ? t.use_cases : [],
      questions: typeof t.questions === 'string' ? JSON.parse(t.questions) : (t.questions || [])
    }))
  )
  const [openId, setOpenId] = useState<number | string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  function updateTemplateState(index: number, patch: Partial<Template>) {
    setTemplates((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)))
  }
function addNewTemplate() {
  const newTemp = emptyTemplate(categories)
  const tempId = `new-${Date.now()}`
  setTemplates((prev) => [{ ...newTemp, tempId } as any, ...prev])
  setOpenId(tempId)
}

async function handleSave(index: number) {
  const template = templates[index]
  const formData = new FormData()

  if (template.id) formData.append('id', String(template.id))
  formData.append('category_id', String(template.category_id))
  // ...

    formData.append('name', template.name)
    formData.append('slug', template.slug)
    formData.append('description', template.description)
    formData.append('estimated_length', template.estimated_length)
    formData.append('system_prompt', template.system_prompt)
    formData.append('use_cases', template.use_cases.join('\n'))
    formData.append('questions', JSON.stringify(template.questions))
    if (template.is_featured) formData.append('is_featured', 'on')
    if (template.is_active) formData.append('is_active', 'on')

    startTransition(async () => {
      const result = await saveTemplateAction(formData)
      if (result.success) {
        setStatus({ type: 'success', message: 'Template saved successfully!' })
        setTimeout(() => setStatus(null), 3000)
      } else {
        setStatus({ type: 'error', message: result.error || 'Failed to save template' })
      }
    })
  }

  async function handleDelete(index: number) {
    const template = templates[index]
    if (!template.id) {
      setTemplates((prev) => prev.filter((_, i) => i !== index))
      return
    }

    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) return

    const formData = new FormData()
    formData.append('id', String(template.id))

    startTransition(async () => {
      const result = await deleteTemplateAction(formData)
      if (result.success) {
        setTemplates((prev) => prev.filter((_, i) => i !== index))
        setStatus({ type: 'success', message: 'Template deleted' })
        setTimeout(() => setStatus(null), 3000)
      } else {
        setStatus({ type: 'error', message: result.error || 'Failed to delete template' })
      }
    })
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center pb-4 border-b">
        <div className="flex items-center gap-3">
          {status && (
            <div className={cn(
              "flex items-center gap-2 font-semibold animate-in fade-in slide-in-from-top-2",
              status.type === 'success' ? "text-green-600 dark:text-green-400" : "text-destructive"
            )}>
              {status.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span className="text-sm">{status.message}</span>
            </div>
          )}
        </div>
        <Button 
          type="button" 
          onClick={addNewTemplate} 
          disabled={isPending}
          className="h-10 px-4 font-semibold shadow-sm cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" /> Add new template
        </Button>
      </div>

      <div className={cn(
        "space-y-4 transition-all duration-300",
        isPending && "opacity-60 pointer-events-none grayscale-[0.2] blur-[1px]"
      )}>
        {templates.map((template, index) => {
          const isOpen = openId === (template.id || `new-${index}`)
          const toggleOpen = () => setOpenId(isOpen ? null : (template.id || `new-${index}`))

          return (
            <div 
              key={template.id || `new-${index}`} 
              className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:bg-slate-900 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
            >
              <div
                className={`flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition-colors ${isOpen ? 'bg-slate-50/50 dark:bg-slate-800/50' : 'hover:bg-slate-50/30 dark:hover:bg-slate-800/20'}`}
              >
                <button
                  type="button"
                  onClick={toggleOpen}
                  disabled={isPending}
                  className={cn(
                    "flex flex-1 items-center gap-4 cursor-pointer",
                    isPending && "cursor-not-allowed"
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ChevronDown className={cn("h-5 w-5 transition-transform", isOpen && "rotate-180")} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {template.name || 'New Template'}
                      </p>
                      <Badge variant={template.is_active ? 'default' : 'secondary'}>
                        {template.is_active ? 'Active' : 'Hidden'}
                      </Badge>
                      {template.is_featured && <Badge variant="outline" className="border-primary text-primary">Featured</Badge>}
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {categories.find(c => c.id === template.category_id)?.name || 'Uncategorized'} • {template.slug || 'no-slug'}
                    </p>
                  </div>
                </button>
                
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isPending}
                    className="h-9 w-9 text-slate-400 hover:bg-destructive/10 hover:text-destructive cursor-pointer disabled:cursor-not-allowed"
                    onClick={() => handleDelete(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Template Name</Label>
                      <Input
                        value={template.name}
                        onChange={(e) => updateTemplateState(index, { name: e.target.value })}
                        placeholder="e.g. Credit Card Dispute"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">URL Slug</Label>
                      <Input
                        value={template.slug}
                        onChange={(e) => updateTemplateState(index, { slug: e.target.value })}
                        placeholder="e.g. credit-card-dispute"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Category</Label>
                      <select
                        value={template.category_id}
                        onChange={(e) => updateTemplateState(index, { category_id: Number(e.target.value) })}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 md:text-sm"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Estimated Length</Label>
                      <Input
                        value={template.estimated_length}
                        onChange={(e) => updateTemplateState(index, { estimated_length: e.target.value })}
                        placeholder="e.g. 1-2 pages"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</Label>
                      <Textarea
                        value={template.description}
                        onChange={(e) => updateTemplateState(index, { description: e.target.value })}
                        placeholder="Short summary of the template..."
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Use Cases (one per line)</Label>
                      <Textarea
                        value={template.use_cases.join('\n')}
                        onChange={(e) => updateTemplateState(index, { use_cases: e.target.value.split('\n') })}
                        placeholder="Case 1\nCase 2"
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">System Prompt (AI Instructions)</Label>
                      <Textarea
                        value={template.system_prompt}
                        onChange={(e) => updateTemplateState(index, { system_prompt: e.target.value })}
                        placeholder="You are an expert at writing..."
                        className="min-h-[150px] font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2 pt-4">
                      <QuestionsEditor 
                        questions={template.questions} 
                        onChange={(questions) => updateTemplateState(index, { questions })} 
                      />
                    </div>

                    <div className="flex items-center gap-6 md:col-span-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`active-${index}`}
                          checked={template.is_active}
                          onChange={(e) => updateTemplateState(index, { is_active: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor={`active-${index}`} className="cursor-pointer text-gray-600">Is Active</Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`featured-${index}`}
                          checked={template.is_featured}
                          onChange={(e) => updateTemplateState(index, { is_featured: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor={`featured-${index}`} className="cursor-pointer text-gray-600">Is Featured</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button 
                      onClick={() => handleSave(index)} 
                      disabled={isPending}
                      className="min-w-[120px]"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Template'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {isPending && (
        <div className="fixed inset-0 bg-white/20 dark:bg-slate-900/20 backdrop-blur-[1px] z-50 pointer-events-none" />
      )}
    </div>
  )
}
