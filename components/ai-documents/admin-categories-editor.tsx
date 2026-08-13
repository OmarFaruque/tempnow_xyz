'use client'

import { useState, useTransition, useEffect } from 'react'
import { ChevronDown, Loader2, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { saveCategoryAction, deleteCategoryAction } from '@/app/actions/admin-categories'
import { LucideIconPicker } from './lucide-icon-picker'

type Category = {
  id?: number
  name: string
  slug: string
  description: string
  icon: string
  display_order: number
  is_active: boolean
  template_count?: number
  tempId?: string
}

const emptyCategory = (): Category => ({
  name: '',
  slug: '',
  description: '',
  icon: 'FileText',
  display_order: 0,
  is_active: true,
})

export function AdminCategoriesEditor({ 
  initialCategories 
}: { 
  initialCategories: Category[]
}) {
  const [categories, setCategories] = useState<Category[]>(() => initialCategories)
  const [openId, setOpenId] = useState<number | string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  function updateCategoryState(index: number, patch: Partial<Category>) {
    setCategories((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }

  function addNewCategory() {
    const newCat = emptyCategory()
    const tempId = `new-${Date.now()}`
    setCategories((prev) => [{ ...newCat, tempId } as any, ...prev])
    setOpenId(tempId)
  }

  async function handleSave(index: number) {
    const category = categories[index]
    const formData = new FormData()
    
    if (category.id) formData.append('id', String(category.id))
    formData.append('name', category.name)
    formData.append('slug', category.slug)
    formData.append('description', category.description)
    formData.append('icon', category.icon)
    formData.append('display_order', String(category.display_order))
    if (category.is_active) formData.append('is_active', 'on')

    startTransition(async () => {
      const result = await saveCategoryAction(formData)
      if (result.success) {
        setStatus({ type: 'success', message: 'Category saved successfully!' })
        setTimeout(() => setStatus(null), 3000)
      } else {
        setStatus({ type: 'error', message: result.error || 'Failed to save category' })
      }
    })
  }

  async function handleDelete(index: number) {
    const category = categories[index]
    if (!category.id) {
      setCategories((prev) => prev.filter((_, i) => i !== index))
      return
    }

    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return

    const formData = new FormData()
    formData.append('id', String(category.id))

    startTransition(async () => {
      const result = await deleteCategoryAction(formData)
      if (result.success) {
        setCategories((prev) => prev.filter((_, i) => i !== index))
        setStatus({ type: 'success', message: 'Category deleted' })
        setTimeout(() => setStatus(null), 3000)
      } else {
        setStatus({ type: 'error', message: result.error || 'Failed to delete category' })
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
          onClick={addNewCategory} 
          disabled={isPending}
          className="h-10 px-4 font-semibold shadow-sm cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" /> Add new category
        </Button>
      </div>

      <div className={cn(
        "space-y-4 transition-all duration-300",
        isPending && "opacity-60 pointer-events-none grayscale-[0.2] blur-[1px]"
      )}>
        {categories.map((category: any, index) => {
          const isOpen = openId === (category.id || category.tempId)
          const toggleOpen = () => setOpenId(isOpen ? null : (category.id || category.tempId))

          return (
            <div 
              key={category.id || category.tempId || index} 
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
                        {category.name || 'New Category'}
                      </p>
                      <Badge variant={category.is_active ? 'default' : 'secondary'}>
                        {category.is_active ? 'Active' : 'Hidden'}
                      </Badge>
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {category.slug || 'no-slug'} • {category.template_count || 0} templates
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
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Category Name</Label>
                      <Input
                        value={category.name}
                        onChange={(e) => updateCategoryState(index, { name: e.target.value })}
                        placeholder="e.g. Dispute Letters"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">URL Slug</Label>
                      <Input
                        value={category.slug}
                        onChange={(e) => updateCategoryState(index, { slug: e.target.value })}
                        placeholder="e.g. disputes"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Icon Name (Lucide)</Label>
                      <LucideIconPicker
                        value={category.icon}
                        onChange={(val) => updateCategoryState(index, { icon: val })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Display Order</Label>
                      <Input
                        type="number"
                        value={category.display_order}
                        onChange={(e) => updateCategoryState(index, { display_order: Number(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</Label>
                      <Textarea
                        value={category.description}
                        onChange={(e) => updateCategoryState(index, { description: e.target.value })}
                        placeholder="Short summary of the category..."
                      />
                    </div>

                    <div className="flex items-center gap-6 md:col-span-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`cat-active-${index}`}
                          checked={category.is_active}
                          onChange={(e) => updateCategoryState(index, { is_active: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor={`cat-active-${index}`} className="cursor-pointer">Is Active</Label>
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
                        'Save Category'
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
