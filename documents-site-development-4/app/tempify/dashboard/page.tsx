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

export default function TempifyDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const { notifications, removeNotification } = useNotifications()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/tempify/login")
    }
  }, [isAuthenticated, isLoading, router])

  const handleLogout = () => {
    router.push("/tempify/login")
  }

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev)
  const closeMobileMenu = () => setMobileMenuOpen(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-orange-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-orange-300">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-orange-950 to-slate-950 flex flex-col">
      <header className="bg-slate-950/80 backdrop-blur-xl px-4 sm:px-6 py-4 sm:py-5 border-b border-orange-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <Link
              href="/tempify"
              className="text-2xl sm:text-3xl font-black tracking-tight"
            >
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent hover:scale-105 transition-transform inline-block">
                TEMPIFY
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden sm:flex gap-6 items-center" role="navigation">
              <Link
                href="/tempify/documents"
                className="text-slate-300 hover:text-orange-400 transition-colors font-medium text-sm"
              >
                Documents
              </Link>
              <Link
                href="/tempify/contact"
                className="text-slate-300 hover:text-orange-400 transition-colors font-medium text-sm"
              >
                Contact
              </Link>
              <Button
                onClick={() => setShowLogoutDialog(true)}
                className="bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-500 hover:to-yellow-500 text-white font-semibold px-6 rounded-full shadow-lg shadow-red-600/25"
              >
                Logout
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="sm:hidden p-2 text-orange-400 hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="sm:hidden mt-6 pb-4 space-y-4" role="navigation">
              <Link href="/tempify/documents" onClick={closeMobileMenu} className="block">
                <div className="text-slate-300 hover:text-orange-400 transition-colors font-medium py-2">Documents</div>
              </Link>
              <Link href="/tempify/contact" onClick={closeMobileMenu} className="block">
                <div className="text-slate-300 hover:text-orange-400 transition-colors font-medium py-2">Contact</div>
              </Link>
              <Button
                onClick={() => {
                  closeMobileMenu()
                  setShowLogoutDialog(true)
                }}
                className="w-full bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-500 hover:to-yellow-500 text-white font-semibold rounded-full"
              >
                Logout
              </Button>
            </nav>
          )}
        </div>
      </header>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-orange-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-amber-600/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
                Your Orders
              </h1>
              <p className="text-slate-400 mt-2">View and manage all your documents</p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-sm border border-orange-500/20 rounded-xl p-6 shadow-xl shadow-orange-500/5">
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
