import { Header } from '@letterise/components/header'
import { Footer } from '@letterise/components/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@letterise/components/ui/card'
import { Badge } from '@letterise/components/ui/badge'
import { Alert, AlertDescription } from '@letterise/components/ui/alert'
import { Shield, FileText, Clock, CheckCircle } from 'lucide-react'
import { notFound } from 'next/navigation'
import { TemplateForm } from '@letterise/components/template-form'
import { getCurrentUser } from '@letterise/lib/auth'
import { getTemplateBySlug } from '@letterise/lib/template-queries'
import { redirect } from 'next/navigation'
import { userHasTemplateAccess } from '@letterise/lib/billing-access'
import { getAiPersona, getPersonaInitial } from '@letterise/lib/ai-persona'

export const dynamic = 'force-dynamic'

export default async function TemplatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const hasTemplateAccess = await userHasTemplateAccess(user.id)

  if (!hasTemplateAccess) {
    redirect('/pricing')
  }

  const template = await getTemplateBySlug(slug)
  
  if (!template) {
    notFound()
  }

  const persona = await getAiPersona()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 bg-muted/30">
        <section className="border-b bg-background">
          <div className="container mx-auto px-4 sm:px-6 py-8">
            <div className="max-w-4xl">
              {template.category_name && (
                <Badge variant="secondary" className="mb-3">
                  {template.category_name}
                </Badge>
              )}
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{template.name}</h1>
              <p className="text-muted-foreground text-pretty">
                {template.description}
              </p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="grid lg:grid-cols-[1fr_320px] gap-8 max-w-6xl">
            <div>
              <Alert className="mb-6 border-primary/50 bg-primary/5">
                <Shield className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  <strong>Important:</strong> This service generates template-based documents and does not constitute legal advice. 
                  For legal matters, please consult with a licensed attorney.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>{`Draft with ${persona.name}`}</CardTitle>
                  <CardDescription>
                    {`Answer a few questions and ${persona.name} will write your document live. Fields marked with * are required.`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TemplateForm
                    templateId={template.id}
                    questions={template.questions}
                    systemPrompt={template.system_prompt}
                    templateName={template.name}
                    persona={{
                      name: persona.name,
                      accent: persona.accent,
                      initial: getPersonaInitial(persona),
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Template Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Estimated Length</p>
                      <p className="text-sm text-muted-foreground">{template.estimated_length || '1-2 pages'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Time to Complete</p>
                      <p className="text-sm text-muted-foreground">5-10 minutes</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Format</p>
                      <p className="text-sm text-muted-foreground">Professional PDF</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {template.use_cases && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Common Use Cases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(() => {
                        // Handle both string (JSON) and array formats
                        const useCases = typeof template.use_cases === 'string' 
                          ? JSON.parse(template.use_cases) 
                          : template.use_cases
                        
                        return Array.isArray(useCases) ? useCases.map((useCase, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start">
                            <span className="mr-2 text-primary">•</span>
                            <span>{useCase}</span>
                          </li>
                        )) : null
                      })()}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
