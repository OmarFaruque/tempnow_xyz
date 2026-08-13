import { Header } from '@letterise/components/header'
import { Footer } from '@letterise/components/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@letterise/components/ui/card'
import { Button } from '@letterise/components/ui/button'
import { Badge } from '@letterise/components/ui/badge'
import Link from 'next/link'
import { FileText, Plus, CreditCard, Zap } from 'lucide-react'
import { requireAuth } from '@letterise/lib/auth'
import { getUserDashboardData } from '@letterise/lib/user-dashboard'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await requireAuth().catch(() => null)
  
  if (!user) {
    redirect('/login')
  }

  const { documents, userCredits, activeSubscription } = await getUserDashboardData(user.id)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 bg-muted/30">
        <section className="border-b bg-background">
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Welcome back, {user.full_name || user.email}
                </p>
              </div>
              <Button size="lg" className="w-full sm:w-auto min-h-[48px]" asChild>
                <Link href="/categories">
                  <Plus className="mr-2 h-5 w-5" />
                  New Document
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6 sm:mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Available Credits
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userCredits.credits_available}</div>
                <p className="text-xs text-muted-foreground">
                  {userCredits.credits_used} credits used
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Documents
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documents.length}</div>
                <p className="text-xs text-muted-foreground">
                  All time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Subscription
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {activeSubscription ? activeSubscription.plan_name : 'None'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {activeSubscription ? (
                    `${activeSubscription.credits_per_month} credits/month`
                  ) : (
                    <Link href="/pricing" className="text-primary hover:underline">
                      View plans
                    </Link>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {userCredits.credits_available === 0 && (
            <Card className="mb-6 sm:mb-8 border-primary/50 bg-primary/5">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold mb-1">You're out of credits</h3>
                    <p className="text-sm text-muted-foreground">
                      Purchase more credits or subscribe to continue generating documents
                    </p>
                  </div>
                  <Button className="w-full sm:w-auto" asChild>
                    <Link href="/pricing">View Pricing</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Recent Documents</CardTitle>
              <CardDescription>
                Your most recently generated documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No documents yet</p>
                  <Button className="min-h-[44px]" asChild>
                    <Link href="/categories">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Document
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 truncate">{doc.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary">{doc.category_name}</Badge>
                          <span className="hidden sm:inline">•</span>
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto min-h-[40px]" asChild>
                        <Link href={`/dashboard/documents/${doc.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
