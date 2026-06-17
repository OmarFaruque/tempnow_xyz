"use client"

import Link from "next/link"
import { useSettings } from "@/context/settings"

export function Footer() {
  const settings = useSettings()

  return (
    <footer className="bg-gradient-to-r from-teal-600 to-teal-700 py-6 px-4 sm:px-6 shadow-lg relative z-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-white font-medium">
          <Link href="/privacy-policy" className="hover:text-teal-200 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms-of-services" className="hover:text-teal-200 transition-colors">
            Terms of Services
          </Link>
          <Link href="/return-policy" className="hover:text-teal-200 transition-colors">
            Return Policy
          </Link>
        </div>
        <div className="text-center mt-4 text-xs text-teal-100">
          © {new Date().getFullYear()} {settings?.general?.siteName || 'TEMPNOW'}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
