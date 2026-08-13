import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header } from '@letterise/components/header'
import { Footer } from '@letterise/components/footer'
import { Button } from '@letterise/components/ui/button'
import { PersonaMark } from '@letterise/components/ai/persona-mark'
import { AssistantWorkbench } from '@letterise/components/ai/assistant-workbench'
import { getAiPersona, getPersonaInitial } from '@letterise/lib/ai-persona'
import { getAssistantDemoTemplates, getLibraryStats } from '@letterise/lib/template-queries'
import { getCurrentUser } from '@letterise/lib/auth'
import { userHasTemplateAccess } from '@letterise/lib/billing-access'
import {
  ArrowRight,
  FileCheck2,
  Gavel,
  MessagesSquare,
  PenLine,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ aiSlug: string }>
}): Promise<Metadata> {
  const { aiSlug } = await params
  const persona = await getAiPersona()

  if (aiSlug !== persona.slug || !persona.enabled) {
    return { title: 'Not found' }
  }

  const title = `${persona.name} — ${persona.tagline}`
  const description =
    persona.intro ||
    `${persona.name} is the AI assistant that drafts professional letters, notices and statements in minutes.`

  return {
    title,
    description,
    openGraph: { title, description },
  }
}

const capabilities = [
  {
    icon: PenLine,
    title: 'Formal letters',
    body: 'Complaints, requests and responses written in the correct register and structure.',
  },
  {
    icon: Gavel,
    title: 'Notices & appeals',
    body: 'Procedurally framed documents that reference only the facts you provide.',
  },
  {
    icon: MessagesSquare,
    title: 'Statements',
    body: 'Clear chronological accounts built from your answers, ready to submit.',
  },
  {
    icon: FileCheck2,
    title: 'Agreements',
    body: 'Structured terms drafted from a guided set of questions.',
  },
]

const steps = [
  { n: 1, title: 'Pick a document', body: 'Choose from the template library, organised by situation.' },
  { n: 2, title: 'Answer questions', body: 'Short, plain-language prompts — no legal knowledge needed.' },
  { n: 3, title: 'Watch it write', body: 'Your document streams in live, then saves to your dashboard.' },
]

export default async function AiPersonaPage({
  params,
}: {
  params: Promise<{ aiSlug: string }>
}) {
  const { aiSlug } = await params
  const persona = await getAiPersona()

  // Static routes take priority in Next.js, so this only catches unmatched
  // single-segment paths. Anything that is not the persona slug is a 404.
  if (aiSlug !== persona.slug || !persona.enabled) {
    notFound()
  }

  const initial = getPersonaInitial(persona)
  const accent = persona.accent

  const [stats, templates, user] = await Promise.all([
    getLibraryStats(),
    getAssistantDemoTemplates(6),
    getCurrentUser(),
  ])

  const canGenerate = user ? await userHasTemplateAccess(user.id) : false

  const headline = persona.headline || `Meet ${persona.name}.`
  const intro =
    persona.intro ||
    `${persona.name} turns a few plain answers into a properly structured, professional document — drafted live, in minutes, not hours.`

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(60% 60% at 50% 0%, color-mix(in srgb, ${accent} 18%, transparent) 0%, transparent 70%)`,
            }}
          />
          <div className="container relative mx-auto flex flex-col items-center px-4 py-16 text-center sm:px-6 md:py-24">
            <PersonaMark initial={initial} accent={accent} size="xl" />

            <span
              className="mt-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
              style={{
                borderColor: `color-mix(in srgb, ${accent} 35%, transparent)`,
                color: accent,
              }}
            >
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              AI document assistant
            </span>

            <h1 className="mt-5 max-w-3xl text-4xl font-semibold text-balance md:text-6xl">
              {headline}
            </h1>
            <p className="mt-3 text-lg" style={{ color: accent }}>
              {persona.tagline}
            </p>
            <p className="mt-5 max-w-2xl text-base text-muted-foreground text-pretty leading-relaxed">
              {intro}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="min-h-[48px]">
                <a href="#draft">
                  {`Draft with ${persona.name}`}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-h-[48px]">
                <Link href="/categories">Browse templates</Link>
              </Button>
            </div>

            {/* Stats */}
            <dl className="mt-12 grid w-full max-w-2xl grid-cols-3 gap-4 border-t border-border pt-8">
              <div>
                <dt className="text-xs text-muted-foreground">Templates</dt>
                <dd className="text-2xl font-semibold">{stats.templateCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Categories</dt>
                <dd className="text-2xl font-semibold">{stats.categoryCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Draft time</dt>
                <dd className="text-2xl font-semibold">~2 min</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Capabilities */}
        <section className="container mx-auto px-4 py-16 sm:px-6 md:py-20">
          <h2 className="max-w-2xl text-3xl font-semibold text-balance md:text-4xl">
            {`What ${persona.name} can write for you`}
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-6">
                <Icon className="h-5 w-5" style={{ color: accent }} aria-hidden="true" />
                <h3 className="mt-4 text-lg font-medium">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Live generator */}
        <section id="draft" className="border-y border-border bg-card/30 scroll-mt-20">
          <div className="container mx-auto px-4 py-16 sm:px-6 md:py-20">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold text-balance md:text-4xl">
                {`Draft with ${persona.name} now`}
              </h2>
              <p className="mt-3 text-muted-foreground text-pretty leading-relaxed">
                Choose a document, answer the questions, and watch it appear line by line.
              </p>
            </div>

            <div className="mt-10">
              <AssistantWorkbench
                templates={templates}
                canGenerate={canGenerate}
                persona={{ name: persona.name, accent, initial }}
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="container mx-auto px-4 py-16 sm:px-6 md:py-20">
          <h2 className="text-3xl font-semibold text-balance md:text-4xl">How it works</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map(({ n, title, body }) => (
              <li key={n} className="rounded-xl border border-border bg-card p-6">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${accent} 18%, transparent)`,
                    color: accent,
                  }}
                >
                  {n}
                </span>
                <h3 className="mt-4 text-lg font-medium">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex items-start gap-3 rounded-xl border border-border bg-card p-5">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accent }} aria-hidden="true" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              {`${persona.name} writes only from the details you provide and never invents names, dates or legal references. Generated documents are not legal advice.`}
            </p>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-border">
          <div className="container mx-auto flex flex-col items-center px-4 py-16 text-center sm:px-6 md:py-20">
            <PersonaMark initial={initial} accent={accent} size="lg" />
            <h2 className="mt-6 max-w-2xl text-3xl font-semibold text-balance md:text-4xl">
              {`Let ${persona.name} write your first document`}
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground text-pretty leading-relaxed">
              {`${stats.templateCount} templates across ${stats.categoryCount} categories, ready when you are.`}
            </p>
            <Button asChild size="lg" className="mt-8 min-h-[48px]">
              <Link href="/categories">
                Get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
