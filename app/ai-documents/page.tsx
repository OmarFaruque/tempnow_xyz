import { Button } from '@letterise/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@letterise/components/ui/card'
import { Badge } from '@letterise/components/ui/badge'
import Link from 'next/link'
import { ArrowRight, Shield, Zap, FileText, CheckCircle, FileWarning, ShieldCheck, MessageSquareWarning, Repeat, Clock, Sparkles } from 'lucide-react'
import { Header } from '@letterise/components/header'
import { Footer } from '@letterise/components/footer'
import { getAiPersona, getPersonaInitial } from '@letterise/lib/ai-persona'
import { PersonaMark } from '@letterise/components/ai/persona-mark'

export default async function HomePage() {
  const persona = await getAiPersona()
  const personaInitial = getPersonaInitial(persona)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:py-28">
          <div className="mx-auto max-w-3xl text-center space-y-4 sm:space-y-6">
            <Badge variant="secondary" className="mb-2 bg-primary/20 text-primary border-primary/30">
              AI-Powered Document Generation
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance leading-tight bg-gradient-to-r from-pink-400 via-pink-500 to-pink-400 bg-clip-text text-transparent">
              Generate Professional Documents in Minutes
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-foreground/70 text-balance px-2">
              Create dispute letters, insurance claims, complaints, appeals, and official documents using AI. Fast, accurate, and legally sound.
            </p>
            {persona.enabled && (
              <div className="flex justify-center">
                <Link
                  href={`/${persona.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
                  style={{
                    borderColor: `color-mix(in srgb, ${persona.accent} 40%, transparent)`,
                    backgroundColor: `color-mix(in srgb, ${persona.accent} 12%, transparent)`,
                    color: persona.accent,
                  }}
                >
                  <PersonaMark initial={personaInitial} accent={persona.accent} size="sm" />
                  {`Meet ${persona.name}, your AI assistant`}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4 w-full sm:w-auto px-4 sm:px-0">
              <Button size="lg" className="w-full sm:w-auto min-h-[48px] bg-primary hover:bg-primary/90" asChild>
                <Link href={`/${persona.slug}`}>
                  {`Draft with ${persona.name}`}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto min-h-[48px] border-border/40 hover:bg-card" asChild>
                <Link href="/categories">
                  Browse Templates
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto min-h-[48px] border-border/40 hover:bg-card" asChild>
                <Link href="/how-it-works">
                  How It Works
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Disclaimer Banner */}
        <section className="bg-primary/5 border-y border-primary/10">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <p className="text-center text-xs sm:text-sm text-muted-foreground leading-relaxed">
              <Shield className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Letterise generates template-based documents and does not provide legal advice. For legal matters, consult a licensed attorney.
            </p>
          </div>
        </section>

        {/* Categories Section */}
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Document Categories</h2>
            <p className="text-base sm:text-lg text-foreground/70 text-balance max-w-2xl mx-auto px-4">
              Choose from professionally crafted templates for every situation
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow border-border/40 bg-card/50 backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                    <FileWarning className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">Dispute Letters</CardTitle>
                </div>
                <CardDescription className="text-sm leading-relaxed">
                  Challenge incorrect charges, billing errors, and service disputes
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="ghost" className="w-full justify-between min-h-[44px]" asChild>
                  <Link href="/categories/disputes">
                    View Templates
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-border/40 bg-card/50 backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">Insurance</CardTitle>
                </div>
                <CardDescription className="text-sm leading-relaxed">
                  File claims for health, auto, property, and more
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="ghost" className="w-full justify-between min-h-[44px]" asChild>
                  <Link href="/categories/insurance">
                    View Templates
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-border/40 bg-card/50 backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                    <MessageSquareWarning className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">Complaint Letters</CardTitle>
                </div>
                <CardDescription className="text-sm leading-relaxed">
                  Formal complaints about products, services, and businesses
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="ghost" className="w-full justify-between min-h-[44px]" asChild>
                  <Link href="/categories/complaint">
                    View Templates
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-border/40 bg-card/50 backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                    <Repeat className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">Appeals</CardTitle>
                </div>
                <CardDescription className="text-sm leading-relaxed">
                  Appeal denied claims, decisions, and administrative actions
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="ghost" className="w-full justify-between min-h-[44px]" asChild>
                  <Link href="/categories/appeal">
                    View Templates
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-border/40 bg-card/50 backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">Official Documents</CardTitle>
                </div>
                <CardDescription className="text-sm leading-relaxed">
                  Request records, certifications, and official correspondence f
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="ghost" className="w-full justify-between min-h-[44px]" asChild>
                  <Link href="/categories/official">
                    View Templates
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-600 to-pink-500 text-white hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1 border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg sm:text-xl">70+ Templates</CardTitle>
                <CardDescription className="text-white/80 text-sm leading-relaxed">
                  Browse all categories and templates
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="secondary" className="w-full justify-between min-h-[44px]" asChild>
                  <Link href="/categories">
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-card/30 py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Why Choose Letterise?</h2>
              <p className="text-base sm:text-lg text-foreground/70 text-balance max-w-2xl mx-auto px-4">
                Professional document generation powered by advanced AI
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-pink-600">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">AI-Powered</h3>
                <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                  Advanced AI generates personalized, professional documents tailored to your specific situation and needs.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-pink-600">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">Save Time</h3>
                <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                  Generate documents in minutes instead of hours. Simply answer a few questions and let AI do the rest.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-pink-600">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">Legally Sound</h3>
                <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                  Templates based on legal standards and best practices. Professional formatting and proper legal language.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-pink-600">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">Easy to Use</h3>
                <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                  No legal expertise required. Our guided forms walk you through every step of the document creation process.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-pink-600">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">Export Options</h3>
                <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                  Download your documents as professionally formatted PDFs ready to send or print immediately.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-pink-600">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">Flexible Pricing</h3>
                <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                  Pay per document or choose a subscription plan. No hidden fees. Cancel anytime.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:py-24">
          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-pink-500 text-white border-0 shadow-2xl">
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            
            {/* Animated glow effect */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-pink-400/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-400/30 rounded-full blur-3xl pointer-events-none" />
            
            {/* Decorative dots pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />
            
            <CardContent className="relative p-8 sm:p-12 md:p-16 text-center space-y-4 sm:space-y-6">
              <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-2">
                <Sparkles className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Start Creating Today</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-balance leading-tight">
                Ready to Create Your Document?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/90 text-balance max-w-2xl mx-auto leading-relaxed px-2">
                Get started with Letterise today. Generate professional documents in minutes with our AI-powered platform.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto px-2 sm:px-0 pt-2">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto min-h-[48px] bg-white text-pink-600 hover:bg-white/90 font-semibold shadow-lg" asChild>
                  <Link href="/signup">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto min-h-[48px] bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm font-semibold" asChild>
                  <Link href="/categories">
                    Browse Templates
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-center justify-center gap-8 pt-4 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>No credit card required</span>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>3 free documents</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  )
}
