import Link from 'next/link'
import { FileText } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <Link href="/ai-documents" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-pink-600">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-white to-pink-400 bg-clip-text text-transparent">
                Letterise
              </span>
            </Link>
            <p className="text-sm text-muted-foreground text-pretty">
              Professional AI-powered document generation for disputes, claims, and official correspondence.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/ai-documents/categories" className="hover:text-foreground transition-colors">Browse Templates</Link></li>
              <li><Link href="/ai-documents/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link href="/ai-documents/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/ai-documents/legal/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link href="/ai-documents/legal/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/ai-documents/legal/refund" className="hover:text-foreground transition-colors">Refund Policy</Link></li>
              <li><Link href="/ai-documents/legal/disclaimer" className="hover:text-foreground transition-colors">Legal Disclaimer</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t">
          <p className="text-sm text-muted-foreground text-center">
            © <span suppressHydrationWarning>{new Date().getFullYear()}</span> Letterise. All rights reserved. This service generates template-based documents and does not provide legal advice.
          </p>
        </div>
      </div>
    </footer>
  )
}
