"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationContainer } from "@/components/notification"
import { PoliciesSection } from "@/components/dashboard/policies-section"
import { LogoutDialog } from "@/components/dashboard/logout-dialog"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth"
import { X, Menu } from "lucide-react"

export default function CoveriseDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const { notifications, removeNotification } = useNotifications()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/coverise/login")
    }
  }, [isAuthenticated, isLoading, router])

  const handleLogout = () => {
    router.push("/coverise/login")
  }

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev)
  const closeMobileMenu = () => setMobileMenuOpen(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-cyan-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="bg-black/95 backdrop-blur-sm px-4 sm:px-6 py-4 sm:py-5 border-b border-cyan-900/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <Link
              href="/coverise"
              className="text-2xl sm:text-3xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent hover:scale-105 transition-transform"
            >
              COVERISE
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden sm:flex gap-6 items-center" role="navigation">
              <Link
                href="/coverise/documents"
                className="text-gray-300 hover:text-cyan-400 transition-colors font-medium text-sm"
              >
                Documents
              </Link>
              <Link
                href="/coverise/contact"
                className="text-gray-300 hover:text-cyan-400 transition-colors font-medium text-sm"
              >
                Contact
              </Link>
              <Button
                onClick={() => setShowLogoutDialog(true)}
                className="bg-red-600 hover:bg-red-500 text-white font-semibold px-6 rounded-full shadow-lg shadow-red-600/20"
              >
                Logout
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="sm:hidden p-2 text-cyan-400 hover:bg-gray-900 rounded-lg transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="sm:hidden mt-6 pb-4 space-y-4" role="navigation">
              <Link href="/coverise/documents" onClick={closeMobileMenu} className="block">
                <div className="text-gray-300 hover:text-cyan-400 transition-colors font-medium py-2">Documents</div>
              </Link>
              <Link href="/coverise/contact" onClick={closeMobileMenu} className="block">
                <div className="text-gray-300 hover:text-cyan-400 transition-colors font-medium py-2">Contact</div>
              </Link>
              <Button
                onClick={() => {
                  closeMobileMenu()
                  setShowLogoutDialog(true)
                }}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold rounded-full"
              >
                Logout
              </Button>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">
                Your Orders
              </h1>
              <p className="text-gray-400 mt-2">View and manage all your documents</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-6">
              <PoliciesSection />
            </div>
          </div>
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      <LogoutDialog isOpen={showLogoutDialog} onClose={() => setShowLogoutDialog(false)} onConfirm={handleLogout} />

      {/* Notification Container */}
      <NotificationContainer notifications={notifications} onClose={removeNotification} />
    </div>
  )
}
