'use client'

import { Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

export type Question = {
  id: string
  label: string
  type: 'text' | 'textarea' | 'date' | 'select'
  required: boolean
  placeholder?: string
  options?: string[]
}

interface QuestionsEditorProps {
  questions: Question[]
  onChange: (questions: Question[]) => void
}

export function QuestionsEditor({ questions, onChange }: QuestionsEditorProps) {
  const addQuestion = () => {
    const newQuestion: Question = {
      id: `field_${Date.now()}`,
      label: '',
      type: 'text',
      required: true,
    }
    onChange([...questions, newQuestion])
  }

  const removeQuestion = (index: number) => {
    const newQuestions = [...questions]
    newQuestions.splice(index, 1)
    onChange(newQuestions)
  }

  const updateQuestion = (index: number, patch: Partial<Question>) => {
    const newQuestions = [...questions]
    newQuestions[index] = { ...newQuestions[index], ...patch }
    onChange(newQuestions)
  }

  const addOption = (qIndex: number) => {
    const q = questions[qIndex]
    const options = q.options ? [...q.options, ''] : ['']
    updateQuestion(qIndex, { options })
  }

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const q = questions[qIndex]
    if (!q.options) return
    const options = [...q.options]
    options[optIndex] = value
    updateQuestion(qIndex, { options })
  }

  const removeOption = (qIndex: number, optIndex: number) => {
    const q = questions[qIndex]
    if (!q.options) return
    const options = [...q.options]
    options.splice(optIndex, 1)
    updateQuestion(qIndex, { options })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-bold text-gray-700">Form Questions</Label>
        <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
          <Plus className="h-4 w-4 mr-2" /> Add Question
        </Button>
      </div>

      {questions.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
          No questions defined yet. Click "Add Question" to start.
        </div>
      )}

      <div className="space-y-6">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="p-6 border rounded-xl bg-slate-50/80 dark:bg-slate-900/50 space-y-4 relative group shadow-sm">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
              onClick={() => removeQuestion(qIndex)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2 md:col-span-1 lg:col-span-2">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Question Label</Label>
                <Input 
                  value={q.label} 
                  onChange={(e) => updateQuestion(qIndex, { label: e.target.value })}
                  placeholder="e.g. What is your first name?"
                  className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Field Type</Label>
                <select
                  value={q.type}
                  onChange={(e) => updateQuestion(qIndex, { type: e.target.value as any })}
                  className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1 text-base shadow-sm transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 md:text-sm"
                >
                  <option value="text">Short Text</option>
                  <option value="textarea">Long Text</option>
                  <option value="date">Date Picker</option>
                  <option value="select">Dropdown Menu</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2 lg:col-span-2">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Placeholder Text</Label>
                <Input 
                  value={q.placeholder || ''} 
                  onChange={(e) => updateQuestion(qIndex, { placeholder: e.target.value })}
                  placeholder="Hint text shown inside the input field..."
                  className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center space-x-3 pt-8">
                <Checkbox 
                  id={`req-${qIndex}`} 
                  checked={q.required} 
                  onCheckedChange={(checked) => updateQuestion(qIndex, { required: !!checked })}
                  className="border-slate-300"
                />
                <Label htmlFor={`req-${qIndex}`} className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Required field
                </Label>
              </div>
            </div>

            {q.type === 'select' && (
              <div className="mt-4 p-3 bg-muted/50 rounded-md space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider">Dropdown Options</Label>
                <div className="space-y-2">
                  {q.options?.map((opt, optIndex) => (
                    <div key={optIndex} className="flex gap-2">
                      <Input 
                        value={opt} 
                        onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                        placeholder={`Option ${optIndex + 1}`}
                        className="h-8 text-xs bg-yellow-50 border-0"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => removeOption(qIndex, optIndex)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs w-full" onClick={() => addOption(qIndex)}>
                    <Plus className="h-3 w-3 mr-2" /> Add Option
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
