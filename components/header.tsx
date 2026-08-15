"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth"
import { Menu, X } from "lucide-react"

import { useSettings } from "@/context/settings"

type HeaderProps = {
  mobileMenuOpen?: boolean
  setMobileMenuOpen?: React.Dispatch<React.SetStateAction<boolean>>
}

export function Header({ mobileMenuOpen, setMobileMenuOpen }: HeaderProps = {}) {
  const [internalMobileMenuOpen, setInternalMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const settings = useSettings()
  const isControlled = typeof mobileMenuOpen === "boolean" && typeof setMobileMenuOpen === "function"
  const isMobileMenuOpen = isControlled ? mobileMenuOpen : internalMobileMenuOpen

  const toggleMobileMenu = () => {
    if (isControlled && setMobileMenuOpen) {
      setMobileMenuOpen((prev) => !prev)
      return
    }
    setInternalMobileMenuOpen((prev) => !prev)
  }

  const closeMobileMenu = () => {
    if (isControlled && setMobileMenuOpen) {
      setMobileMenuOpen(false)
      return
    }
    setInternalMobileMenuOpen(false)
  }

  return (
    <header className="px-4 sm:px-6 py-3 sm:py-4 relative overflow-hidden isolate border-b border-white/10">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(120deg, #115e59 0%, #0d9488 50%, #14b8a6 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none animate-dot-drift opacity-[0.14]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1.5px, transparent 0)",
          backgroundSize: "56px 56px",
        }}
      ></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-xl sm:text-2xl font-bold text-white hover:text-teal-100 transition-colors">
              {settings?.general?.siteName || "TEMPNOW"}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex gap-2 md:gap-3" role="navigation">
            <Link href="/ai-documents">
              <Button className="bg-white hover:bg-teal-50 text-teal-600 font-medium text-sm md:text-base px-3 md:px-4">
                AI Documents
              </Button>
            </Link>
            {pathname !== "/contact" && (
              <Link href="/contact">
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-teal-700 hover:border-teal-100 bg-transparent text-sm md:text-base px-3 md:px-4"
                >
                  Contact
                </Button>
              </Link>
            )}
            <Link href={isAuthenticated ? "/dashboard" : "/login"}>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-teal-700 hover:border-teal-100 bg-transparent text-sm md:text-base px-3 md:px-4"
              >
                {isAuthenticated ? "Dashboard" : "Sign In"}
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="sm:hidden p-2 text-white hover:bg-teal-700 rounded-md transition-colors"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="sm:hidden mt-4 pb-4 border-t border-teal-500 pt-4" role="navigation">
            <div className="flex flex-col space-y-3">
              <Link href="/ai-documents" onClick={closeMobileMenu}>
                <Button className="w-full bg-white hover:bg-teal-50 text-teal-600 font-medium">AI Documents</Button>
              </Link>
              {pathname !== "/contact" && (
                <Link href="/contact" onClick={closeMobileMenu}>
                  <Button
                    variant="outline"
                    className="w-full border-white text-white hover:bg-teal-700 hover:border-teal-100 bg-transparent"
                  >
                    Contact
                  </Button>
                </Link>
              )}
              <Link href={isAuthenticated ? "/dashboard" : "/login"} onClick={closeMobileMenu}>
                <Button
                  variant="outline"
                  className="w-full border-white text-white hover:bg-teal-700 hover:border-teal-100 bg-transparent"
                >
                  {isAuthenticated ? "Dashboard" : "Sign In"}
                </Button>
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
