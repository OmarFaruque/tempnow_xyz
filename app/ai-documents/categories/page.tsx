import { Header } from '@letterise/components/header'
import { Footer } from '@letterise/components/footer'
import { Badge } from '@letterise/components/ui/badge'
import { Button } from '@letterise/components/ui/button'
import Link from 'next/link'
import { ArrowRight, FileWarning, ShieldCheck, MessageSquareWarning, Repeat, FileText } from 'lucide-react'

import { categoriesLists } from '@letterise/lib/category-queries'

const categoryIcons = {
  'disputes': FileWarning,
  'insurance': ShieldCheck,
  'complaint': MessageSquareWarning,
  'appeal': Repeat,
  'official': FileText,
}

export default async function CategoriesPage() {
  const categories = await categoriesLists();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="border-b bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-12 md:py-16">
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 leading-tight">Browse Templates</h1>
              <p className="text-base sm:text-lg text-muted-foreground text-pretty leading-relaxed">
                Choose from our comprehensive library of professional document templates. Each template includes guided questions to help you create a personalized, legally sound document.
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid gap-6 sm:gap-8">
            {categories.map((category) => {
              const Icon = categoryIcons[category.slug as keyof typeof categoryIcons] || FileText
              
              return (
                <div key={category.id} className="border rounded-lg overflow-hidden bg-card">
                  <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[200px_1fr] gap-0 md:gap-6">
                    <div className="bg-muted/50 p-6 md:p-6 flex flex-row md:flex-col items-center justify-between md:justify-center border-b md:border-b-0 md:border-r gap-4">
                      <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-lg bg-primary">
                        <Icon className="h-6 w-6 md:h-8 md:w-8 text-primary-foreground" />
                      </div>
                      <Badge variant="secondary" className="text-xs sm:text-sm">{category.template_count} Templates</Badge>
                    </div>
                    
                    <div className="p-4 sm:p-6">
                      <div className="mb-3 sm:mb-4">
                        <h2 className="text-xl sm:text-2xl font-semibold mb-2">{category.name}</h2>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                          {category.description}
                        </p>
                      </div>
                      
                      <div>
                        <Button className="min-h-[44px]" asChild>
                          <Link href={`/categories/${category.slug}`}>
                            View Templates
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
