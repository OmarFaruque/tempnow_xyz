'use client'

import { useMemo, useState, useTransition } from 'react'
import { ChevronDown, Loader2, Plus, Trash2, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type Plan = {
  id?: number
  name: string
  description: string
  plan_type: 'credits' | 'subscription'
  package_price_cents: number
  price_per_document_cents: number
  credit_amount: number
  monthly_document_limit: number
  discount_percent: number
  features: string[]
  is_active: boolean
}

type EditorPlan = Plan & {
  featuresRaw?: string
}

const emptyPlan = (): Plan => ({
  name: '',
  description: '',
  plan_type: 'subscription',
  package_price_cents: 0,
  price_per_document_cents: 0,
  credit_amount: 0,
  monthly_document_limit: 0,
  discount_percent: 0,
  features: [],
  is_active: true,
})

export function AdminPlansEditor({ initialPlans, action }: { initialPlans: Plan[]; action: (formData: FormData) => Promise<any> }) {
   const [plans, setPlans] = useState<EditorPlan[]>(
    initialPlans.map((plan) => ({
      ...emptyPlan(),
      ...plan,
      features: Array.isArray(plan.features) ? plan.features : [],
      featuresRaw: Array.isArray(plan.features) ? plan.features.join('\n') : '',
    }))
  )
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showSuccess, setShowSuccess] = useState(false)

  const serialized = useMemo(() => {
    const plansToSerialize = plans.map(p => {
      const { featuresRaw, ...rest } = p
      const updatedFeatures = typeof featuresRaw === 'string'
        ? featuresRaw.split('\n').map(f => f.trim()).filter(Boolean)
        : p.features
      return { ...rest, features: updatedFeatures }
    })
    return JSON.stringify(plansToSerialize)
  }, [plans])

  function updatePlan(index: number, patch: Partial<EditorPlan>) {
    setPlans((prev) => prev.map((plan, i) => (i === index ? { ...plan, ...patch } : plan)))
  }

  function removePlan(index: number) {
    setPlans((prev) => prev.filter((_, i) => i !== index))
    setOpenIndex((prev) => (prev === index ? null : prev))
  }

  function addPlan() {
    setPlans((prev) => [...prev, { ...emptyPlan(), featuresRaw: '' }])
    setOpenIndex(plans.length)
  }

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await action(formData)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6 relative">
      <input type="hidden" name="plansJson" value={serialized} />

      <div className={cn(
        "space-y-4 transition-all duration-300",
        isPending && "opacity-60 pointer-events-none grayscale-[0.2] blur-[1px]"
      )}>
        {plans.map((plan, index) => {
          const isOpen = openIndex === index
          return (
            <div key={`${plan.id ?? 'new'}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:bg-slate-900 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700">
              <div
                className={`flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition-colors ${isOpen ? 'bg-slate-50/50 dark:bg-slate-800/50' : 'hover:bg-slate-50/30 dark:hover:bg-slate-800/20'}`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  disabled={isPending}
                  className={cn(
                    "flex flex-1 items-center gap-4 cursor-pointer",
                    isPending && "cursor-not-allowed"
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {plan.plan_type === 'credits' ? <Plus className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                  <div className="text-left">
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{plan.name || `New plan ${index + 1}`}</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{plan.plan_type === 'credits' ? 'Credits package' : 'Monthly subscription'}</p>
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isPending}
                    className="h-9 w-9 text-slate-400 hover:bg-destructive/10 hover:text-destructive dark:text-slate-500 dark:hover:bg-destructive/20 cursor-pointer disabled:cursor-not-allowed"
                    onClick={() => removePlan(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronDown className={`h-5 w-5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Plan Name</Label>
                      <Input
                        placeholder="e.g. Basic Pack"
                        value={plan.name}
                        disabled={isPending}
                        onChange={(e) => updatePlan(index, { name: e.target.value })}
                        className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-primary focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Plan Type</Label>
                      <select
                        value={plan.plan_type}
                        disabled={isPending}
                        onChange={(e) => updatePlan(index, { plan_type: e.target.value as 'credits' | 'subscription' })}
                        className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="credits">Credits (no time limit)</option>
                        <option value="subscription">Subscription (monthly)</option>
                      </select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</Label>
                      <Textarea
                        placeholder="Describe what's included in this plan..."
                        value={plan.description}
                        disabled={isPending}
                        onChange={(e) => updatePlan(index, { description: e.target.value })}
                        className="min-h-[100px] border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-primary focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{plan.plan_type === 'credits' ? 'Package Price (£)' : 'Monthly Price (£)'}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        disabled={isPending}
                        value={plan.package_price_cents / 100}
                        onChange={(e) => updatePlan(index, { package_price_cents: Math.round(Number(e.target.value || 0) * 100) })}
                        className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-primary focus:ring-primary"
                      />
                    </div>

                    {plan.plan_type === 'credits' ? (
                      <>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Credits Per Document</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            disabled={isPending}
                           value={plan.price_per_document_cents}
                            onChange={(e) => updatePlan(index, { price_per_document_cents: Number(e.target.value || 0) })}
                            className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-primary focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Credit Amount</Label>
                          <Input
                            type="number"
                            disabled={isPending}
                            value={plan.credit_amount}
                            onChange={(e) => updatePlan(index, { credit_amount: Number(e.target.value || 0) })}
                            className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-primary focus:ring-primary"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Documents Per Month</Label>
                          <Input
                            type="number"
                            disabled={isPending}
                            value={plan.monthly_document_limit}
                            onChange={(e) => updatePlan(index, { monthly_document_limit: Number(e.target.value || 0) })}
                            className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-primary focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Discount Percentage (%)</Label>
                          <Input
                            type="number"
                            disabled={isPending}
                            value={plan.discount_percent}
                            onChange={(e) => updatePlan(index, { discount_percent: Number(e.target.value || 0) })}
                            className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-primary focus:ring-primary"
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Features (one per line)</Label>
                      <Textarea
                        placeholder="Feature 1\nFeature 2\nFeature 3"
                        value={plan.featuresRaw}
                        disabled={isPending}
                        onChange={(e) => updatePlan(index, { featuresRaw: e.target.value })}
                        className="min-h-[120px] border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-primary focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-[2px] rounded-xl p-8 flex flex-col items-center gap-3 shadow-xl border border-slate-200 dark:border-slate-800">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Saving changes...</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button 
          type="button" 
          variant="outline" 
          onClick={addPlan} 
          disabled={isPending}
          className="h-11 px-6 font-semibold shadow-sm dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer disabled:cursor-not-allowed"
        >
          <Plus className="mr-2 h-4 w-4" /> Add new plan
        </Button>

        <div className="flex items-center gap-3">
          {showSuccess && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold animate-in fade-in slide-in-from-right-4">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm">Saved successfully!</span>
            </div>
          )}
          <Button 
            type="submit" 
            disabled={isPending}
            className="h-11 min-w-48 font-bold shadow-md transition-all hover:shadow-lg active:scale-[0.98] dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 cursor-pointer disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save all plans'
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
