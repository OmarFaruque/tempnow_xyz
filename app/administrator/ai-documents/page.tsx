import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BarChart3,
  CreditCard,
  FileText,
  FolderOpen,
  LayoutTemplate,
  LogOut,
  Search,
  Settings,
  Users,
  Zap,
  SquareKanban,
  Sparkles,
  ArrowLeft,
} from 'lucide-react'

import { Badge } from '@letterise/components/ui/badge'
import { Button } from '@letterise/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@letterise/components/ui/card'
import { Input } from '@letterise/components/ui/input'
import { Label } from '@letterise/components/ui/label'
import { AdminPlansEditor } from '@letterise/components/admin-plans-editor'
import { AdminSettingsEditor } from '@letterise/components/admin-settings-editor'
import { AdminAiPersonaEditor } from '@letterise/components/admin-ai-persona-editor'
import { getAiPersona } from '@letterise/lib/ai-persona'
import { AdminTemplatesEditor } from '@letterise/components/admin-templates-editor'
import { AdminCategoriesEditor } from '@letterise/components/admin-categories-editor'
import { Pagination } from '@letterise/components/ui/pagination'
import { deleteAdminSession, getAdminSession } from '@letterise/lib/admin-auth'
import { getAdminDashboardData } from '@letterise/lib/admin-dashboard'
import { saveAllPlansAction } from '@letterise/lib/plans'
import { getSettings } from '@letterise/lib/admin-settings'
import { saveAdminSettingsAction } from '@/app/ai-documents/actions/admin-settings'
import { 
  updateTemplateFlag, 
  updateCategoryStatus, 
  updateUserCredits 
} from '@letterise/lib/admin-actions'

export const dynamic = 'force-dynamic'

const navItems = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'categories', label: 'Categories', icon: FolderOpen },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'subscriptions', label: 'Subscriptions', icon: Zap },
  { id: 'plans', label: 'Plans', icon: SquareKanban },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles },
  { id: 'settings', label: 'Settings', icon: Settings },
]

function money(cents: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(cents / 100)
}

function date(value: string | Date | null) {
  if (!value) return 'N/A'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

async function logoutAdmin() {
  'use server'
  const cookieStore = await import('next/headers').then(m => m.cookies())
  // Clear letterise session cookie
  cookieStore.delete('admin_session')
  // Also clear the main admin cookies so a single logout works for both dashboards
  cookieStore.delete('adminAuthToken')
  cookieStore.delete('isAdminAuthenticated')
  redirect('/admin-login')
}

// Server actions wrapper for the page
async function updateTemplateFlagAction(formData: FormData) {
  'use server'
  const templateId = Number(formData.get('templateId'))
  const field = String(formData.get('field') || '')
  const nextValue = formData.get('nextValue') === 'true'
  await updateTemplateFlag(templateId, field, nextValue)
}

async function updateCategoryStatusAction(formData: FormData) {
  'use server'
  const categoryId = Number(formData.get('categoryId'))
  const nextValue = formData.get('nextValue') === 'true'
  await updateCategoryStatus(categoryId, nextValue)
}

async function updateUserCreditsAction(formData: FormData) {
  'use server'
  const userId = Number(formData.get('userId'))
  const creditsAvailable = Number(formData.get('creditsAvailable'))
  await updateUserCredits(userId, creditsAvailable)
}

type PageProps = {
  searchParams?: Promise<{
    section?: string
    q?: string
    page?: string
    categoryId?: string
    status?: string
    featured?: string
  }>
}

export default async function AdministratorPage({ searchParams }: PageProps) {
  const admin = await getAdminSession()
  if (!admin) redirect('/admin-login')

  const params = await searchParams
  const section = navItems.some((item) => item.id === params?.section)
    ? params?.section || 'overview'
    : 'overview'
  const search = params?.q?.trim() || ''
  const currentPage = Number(params?.page || '1')
  
  const categoryId = params?.categoryId ? Number(params.categoryId) : undefined
  const statusFilter = params?.status
  const featuredFilter = params?.featured
  
  const data = await getAdminDashboardData(search, section, currentPage, 20, {
    categoryId: !isNaN(categoryId as number) ? categoryId : undefined,
    isActive: statusFilter === 'active' ? true : statusFilter === 'hidden' ? false : undefined,
    isFeatured: featuredFilter === 'featured' ? true : undefined
  })
  
  const stripeSettings = await getSettings('stripe')
  const aiPersona = await getAiPersona()
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/stripe`

  let paginationBaseUrl = `/administrator/ai-documents?section=${section}${search ? `&q=${encodeURIComponent(search)}` : ''}`
  if (categoryId) paginationBaseUrl += `&categoryId=${categoryId}`
  if (statusFilter) paginationBaseUrl += `&status=${statusFilter}`
  if (featuredFilter) paginationBaseUrl += `&featured=${featuredFilter}`

  return (
    <div className="letterise-theme admin-dashboard min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/ai-documents" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              AI Documents (Letterise)
            </Link>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Administrator</h1>
            <p className="text-sm text-muted-foreground">
              Signed in as {admin.email}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/administrator">
              <Button variant="outline" type="button">
                <ArrowLeft className="h-4 w-4" />
                Main Admin
              </Button>
            </Link>
            <form action={logoutAdmin}>
              <Button variant="outline" type="submit">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="container mx-auto grid gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const selected = section === item.id

            return (
              <Button
                key={item.id}
                variant={selected ? 'default' : 'ghost'}
                className="w-full justify-start"
                asChild
              >
                <Link href={`/administrator/ai-documents?section=${item.id}`}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            )
          })}
        </aside>

        <main className="space-y-6">
          {section === 'overview' && (
            <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Users" value={data.stats.users} icon={Users} />
                <StatCard label="Documents" value={data.stats.documents} icon={FileText} />
                <StatCard label="Templates" value={data.stats.templates} icon={LayoutTemplate} />
                <StatCard label="Revenue" value={money(data.stats.revenueCents)} icon={CreditCard} />
                <StatCard label="Active Subscriptions" value={data.stats.activeSubscriptions} icon={Zap} />
                <StatCard label="Credits Used" value={data.stats.creditsUsed} icon={Zap} />
                <StatCard label="Active Categories" value={data.stats.activeCategories} icon={FolderOpen} />
              </section>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Documents</CardTitle>
                  <CardDescription>Latest generated documents from customers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.recentDocuments.length === 0 ? (
                    <EmptyState message="No documents have been generated yet." />
                  ) : (
                    data.recentDocuments.map((doc) => (
                      <div key={doc.id} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_160px_140px] md:items-center">
                        <div className="min-w-0">
                          <div className="font-medium">{doc.title}</div>
                          <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <span>{doc.email || 'Unknown user'}</span>
                            <span>{doc.template_name || 'Deleted template'}</span>
                            {doc.category_name && <Badge variant="secondary">{doc.category_name}</Badge>}
                          </div>
                        </div>
                        <Badge variant={doc.status === 'finalized' ? 'default' : 'secondary'}>
                          {doc.status || 'draft'}
                        </Badge>
                        <div className="text-sm text-muted-foreground">{date(doc.created_at)}</div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {section === 'users' && (
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>Review accounts, documents, credits, and active subscriptions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form className="flex w-full gap-2">
                  <input type="hidden" name="section" value="users" />
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input name="q" defaultValue={search} placeholder="Search users" className="pl-9" />
                  </div>
                  <Button type="submit" variant="outline">Search</Button>
                </form>

                {data.users.length === 0 ? (
                  <EmptyState message="No users found." />
                ) : (
                  data.users.map((user) => (
                    <div key={user.id} className="grid gap-4 rounded-lg border p-4 xl:grid-cols-[1.4fr_1fr_220px] xl:items-center">
                      <div>
                        <div className="font-medium">{user.full_name || 'Unnamed user'}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        <div className="mt-2 text-xs text-muted-foreground">Joined {date(user.created_at)}</div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{Number(user.document_count)} documents</Badge>
                        <Badge variant="secondary">{Number(user.credits_used)} used</Badge>
                        <Badge>{user.active_plan || 'No plan'}</Badge>
                      </div>

                      <form action={updateUserCreditsAction} className="flex items-end gap-2">
                        <input type="hidden" name="userId" value={user.id} />
                        <div className="flex-1 space-y-1">
                          <Label htmlFor={`credits-${user.id}`}>Credits</Label>
                          <Input
                            id={`credits-${user.id}`}
                            name="creditsAvailable"
                            type="number"
                            min="0"
                            defaultValue={Number(user.credits_available)}
                          />
                        </div>
                        <Button type="submit" variant="outline">Save</Button>
                      </form>
                    </div>
                  ))
                )}
                {data.pagination && (
                  <Pagination 
                    currentPage={data.pagination.page} 
                    totalPages={data.pagination.totalPages} 
                    baseUrl={paginationBaseUrl} 
                  />
                )}
              </CardContent>
            </Card>
          )}

          {section === 'templates' && (
            <Card>
              <CardHeader>
                <CardTitle>Templates Management</CardTitle>
                <CardDescription>Add, edit, and organize document templates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form className="flex flex-wrap gap-4 p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                  <input type="hidden" name="section" value="templates" />
                  
                  <div className="flex-1 min-w-[240px]">
                    <Label className="text-xs font-bold uppercase mb-1.5 block">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input name="q" defaultValue={search} placeholder="Search by name or slug" className="pl-9 h-10 bg-white dark:bg-slate-950" />
                    </div>
                  </div>

                  <div className="w-[200px]">
                    <Label className="text-xs font-bold uppercase mb-1.5 block">Category</Label>
                    <select 
                      name="categoryId" 
                      defaultValue={categoryId || ''}
                      className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">All Categories</option>
                      {data.categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-[150px]">
                    <Label className="text-xs font-bold uppercase mb-1.5 block">Status</Label>
                    <select 
                      name="status" 
                      defaultValue={statusFilter || ''}
                      className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Any Status</option>
                      <option value="active">Active</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>

                  <div className="w-[150px]">
                    <Label className="text-xs font-bold uppercase mb-1.5 block">Featured</Label>
                    <select 
                      name="featured" 
                      defaultValue={featuredFilter || ''}
                      className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">All</option>
                      <option value="featured">Featured Only</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <Button type="submit" className="h-10 px-6">Apply</Button>
                  </div>
                </form>

                <AdminTemplatesEditor 
                  initialTemplates={data.templates} 
                  categories={data.categories} 
                />
                {data.pagination && (
                  <Pagination 
                    currentPage={data.pagination.page} 
                    totalPages={data.pagination.totalPages} 
                    baseUrl={paginationBaseUrl} 
                  />
                )}
              </CardContent>
            </Card>
          )}

          {section === 'categories' && (
            <Card>
              <CardHeader>
                <CardTitle>Categories Management</CardTitle>
                <CardDescription>Add, edit, and organize document categories.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form className="flex w-full gap-2">
                  <input type="hidden" name="section" value="categories" />
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input name="q" defaultValue={search} placeholder="Search categories" className="pl-9 h-10 !text-amber-50" />
                  </div>
                  <Button type="submit" variant="outline">Search</Button>
                </form>

                <AdminCategoriesEditor 
                  initialCategories={data.categories} 
                />
              </CardContent>
            </Card>
          )}

          {section === 'payments' && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest credit and subscription payments.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form className="flex w-full gap-2">
                  <input type="hidden" name="section" value="payments" />
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input name="q" defaultValue={search} placeholder="Search by email" className="pl-9 h-10" />
                  </div>
                  <Button type="submit" variant="outline">Search</Button>
                </form>

                {data.transactions.length === 0 ? (
                  <EmptyState message="No transactions yet." />
                ) : (
                  data.transactions.map((transaction) => (
                    <div key={transaction.id} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_120px_120px_140px] md:items-center">
                      <div>
                        <div className="font-medium">{transaction.email || 'Unknown user'}</div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.transaction_type} / {transaction.credits_purchased || 0} credits
                        </div>
                        {transaction.stripe_payment_id && (
                          <div className="mt-1">
                            <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">
                              {transaction.stripe_payment_id}
                            </div>
                            <a 
                              href={`https://dashboard.stripe.com/${stripeSettings?.sandbox ? 'test/' : ''}payments/${transaction.stripe_payment_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-blue-600 hover:underline inline-block mt-0.5"
                            >
                              View on Stripe
                            </a>
                          </div>
                        )}
                      </div>
                      <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                        {transaction.status}
                      </Badge>
                      <div className="text-sm font-medium">{money(Number(transaction.amount_cents))}</div>
                      <div className="text-xs text-muted-foreground text-right">{date(transaction.created_at)}</div>
                    </div>
                  ))
                )}
                {data.pagination && (
                  <Pagination 
                    currentPage={data.pagination.page} 
                    totalPages={data.pagination.totalPages} 
                    baseUrl={paginationBaseUrl} 
                  />
                )}
              </CardContent>
            </Card>
          )}

          {section === 'subscriptions' && (
            <Card>
              <CardHeader>
                <CardTitle>User Subscriptions</CardTitle>
                <CardDescription>Active and historical customer subscriptions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form className="flex w-full gap-2">
                  <input type="hidden" name="section" value="subscriptions" />
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input name="q" defaultValue={search} placeholder="Search by email" className="pl-9 h-10" />
                  </div>
                  <Button type="submit" variant="outline">Search</Button>
                </form>

                {data.subscriptions.length === 0 ? (
                  <EmptyState message="No subscriptions found." />
                ) : (
                  data.subscriptions.map((subscription) => (
                    <div key={subscription.id} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_120px_140px_140px] md:items-center">
                      <div>
                        <div className="font-medium">{subscription.email || 'Unknown user'}</div>
                        <div className="text-sm text-muted-foreground">
                          {subscription.plan_name || 'Unknown Plan'}
                        </div>
                        {subscription.stripe_subscription_id && (
                          <div className="mt-1">
                            <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">
                              {subscription.stripe_subscription_id}
                            </div>
                            <a 
                              href={`https://dashboard.stripe.com/${stripeSettings?.sandbox ? 'test/' : ''}subscriptions/${subscription.stripe_subscription_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-blue-600 hover:underline inline-block mt-0.5"
                            >
                              View on Stripe
                            </a>
                          </div>
                        )}
                      </div>
                      <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                        {subscription.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        Period: {date(subscription.current_period_start)} - {date(subscription.current_period_end)}
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        Started: {date(subscription.created_at)}
                      </div>
                    </div>
                  ))
                )}
                {data.pagination && (
                  <Pagination 
                    currentPage={data.pagination.page} 
                    totalPages={data.pagination.totalPages} 
                    baseUrl={paginationBaseUrl} 
                  />
                )}
              </CardContent>
            </Card>
          )}

          {section === 'ai-assistant' && <AdminAiPersonaEditor initial={aiPersona} />}

          {section === 'settings' && (
            <AdminSettingsEditor 
              initialStripeSettings={stripeSettings} 
              webhookUrl={webhookUrl}
              onSave={saveAdminSettingsAction}
            />
          )}

           {section === 'plans' && (
            <Card>
              <CardHeader>
                <CardTitle>Plans Management</CardTitle>
                <CardDescription>Create and manage credit and monthly plans from one place.</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminPlansEditor initialPlans={data.plans} action={saveAllPlansAction} />
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: any
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}
