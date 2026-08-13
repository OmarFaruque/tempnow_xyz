import { Header } from '@letterise/components/header'
import { Footer } from '@letterise/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@letterise/components/ui/card'
import { Button } from '@letterise/components/ui/button'
import Link from 'next/link'
import { FileText, MessageSquare, Sparkles, Download, ArrowRight } from 'lucide-react'

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="border-b bg-muted/50">
          <div className="container mx-auto py-12 md:py-16">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">How Letterise Works</h1>
              <p className="text-lg text-muted-foreground text-balance">
                Generate professional documents in four simple steps using AI technology
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto py-16">
          <div className="grid gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xl font-bold">
                    1
                  </div>
                  <CardTitle className="text-2xl">Choose a Template</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <FileText className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground mb-3">
                      Browse our library of professionally crafted templates across five categories: Dispute Letters, 
                      Insurance Claims, Complaint Letters, Appeals, and Official Documents.
                    </p>
                    <p className="text-muted-foreground">
                      Each template is designed for specific use cases and includes all necessary legal language and formatting.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xl font-bold">
                    2
                  </div>
                  <CardTitle className="text-2xl">Answer Questions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <MessageSquare className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground mb-3">
                      Complete our guided form with specific details about your situation. Questions are tailored to each 
                      template type to ensure we capture all relevant information.
                    </p>
                    <p className="text-muted-foreground">
                      Typical forms take 5-10 minutes to complete. The more detail you provide, the better your document will be.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xl font-bold">
                    3
                  </div>
                  <CardTitle className="text-2xl">AI Generates Your Document</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Sparkles className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground mb-3">
                      Our AI technology analyzes your information and generates a personalized, professionally formatted document 
                      tailored to your specific situation in under 30 seconds.
                    </p>
                    <p className="text-muted-foreground">
                      The AI ensures proper legal language, formatting, and structure while incorporating your unique details.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xl font-bold">
                    4
                  </div>
                  <CardTitle className="text-2xl">Download and Use</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Download className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground mb-3">
                      Review your generated document, download it as a professionally formatted PDF, and use it for your needs. 
                      All documents are saved to your account for future access.
                    </p>
                    <p className="text-muted-foreground">
                      We recommend having an attorney review important legal documents before submission.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="bg-muted/50 py-16">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create your account and start generating professional documents in minutes
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/categories">
                  Browse Templates
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
