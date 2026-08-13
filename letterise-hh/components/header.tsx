import Link from 'next/link'
import { Button } from '@letterise/components/ui/button'
import { FileText, Menu } from 'lucide-react'
import { getCurrentUser } from '@letterise/lib/auth'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@letterise/components/ui/sheet'
import { getAiPersona, getPersonaInitial } from '@letterise/lib/ai-persona'
import { PersonaMark } from '@letterise/components/ai/persona-mark'

export async function Header() {
  const [user, persona] = await Promise.all([
    getCurrentUser(),
    getAiPersona()
  ])
  const personaInitial = getPersonaInitial(persona)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-[#0f0d15]/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/ai-documents" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-pink-600">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white to-pink-400 bg-clip-text text-transparent">
            Letterise
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          <Link href="/ai-documents/categories" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
            Templates
          </Link>
          <Link href="/ai-documents/pricing" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/ai-documents/how-it-works" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
            How It Works
          </Link>
          {persona.enabled && (
            <Link
              href={`/${persona.slug}`}
              className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
              style={{
                borderColor: `color-mix(in srgb, ${persona.accent} 40%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${persona.accent} 12%, transparent)`,
                color: persona.accent,
              }}
            >
              <PersonaMark initial={personaInitial} accent={persona.accent} size="sm" />
              {persona.name}
            </Link>
          )}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/ai-documents/dashboard">Dashboard</Link>
              </Button>
              <Button size="sm" className="hidden sm:flex bg-primary hover:bg-primary/90" asChild>
                <Link href="/ai-documents/categories">
                  <FileText className="mr-2 h-4 w-4" />
                  Create Document
                </Link>
              </Button>
              <Button size="sm" className="sm:hidden bg-primary hover:bg-primary/90" asChild>
                <Link href="/ai-documents/categories">
                  Create
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
                <Link href="/login">
                  Sign Up
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="sm">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[320px]">
            <nav className="flex flex-col gap-4 mt-8">
              <Link href="/ai-documents/categories" className="text-base font-medium py-2 hover:text-primary transition-colors">
                Browse Templates
              </Link>
              <Link href="/ai-documents/pricing" className="text-base font-medium py-2 hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link href="/ai-documents/how-it-works" className="text-base font-medium py-2 hover:text-primary transition-colors">
                How It Works
              </Link>
              {persona.enabled && (
                <Link
                  href={`/${persona.slug}`}
                  className="flex items-center gap-2 py-2 text-base font-medium transition-colors"
                  style={{ color: persona.accent }}
                >
                  <PersonaMark initial={personaInitial} accent={persona.accent} size="sm" />
                  {`Draft with ${persona.name}`}
                </Link>
              )}
              
              <div className="border-t pt-4 mt-4 space-y-2">
                {user ? (
                  <>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/ai-documents/dashboard">Dashboard</Link>
                    </Button>
                    <Button className="w-full justify-start" asChild>
                      <Link href="/ai-documents/categories">
                        <FileText className="mr-2 h-4 w-4" />
                        Create Document
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/login">Log In</Link>
                    </Button>
                    <Button className="w-full" asChild>
                      <Link href="/login">Sign Up</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
