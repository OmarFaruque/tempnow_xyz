"use client"

import Link from "next/link"
import { useSettings } from "@/context/settings"

export function Footer() {
  const settings = useSettings()

  return (
    <footer className="bg-gradient-to-r from-teal-700 via-teal-600 to-teal-700 py-6 sm:py-8 px-4 sm:px-6 relative border-t border-white/10">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
          backgroundImage: `linear-gradient(to right, white 1px, transparent 1px),
                           linear-gradient(to bottom, white 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      ></div>
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-teal-50">
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
        <div className="text-center mt-4 sm:mt-6 text-xs text-teal-100">
          © {new Date().getFullYear()} {settings?.companyName || settings?.general?.siteName || "TEMPNOW"}. All rights
          reserved.
        </div>
      </div>
    </footer>
  )
}
