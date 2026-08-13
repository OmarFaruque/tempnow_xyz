"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useSettings } from "@/context/settings"
import { Megaphone, X } from "lucide-react"
import { Button } from "@/components/ui/button"

// 🔧 DEV: Set to true to force-show popup regardless of settings/sessionStorage
const DEV_PREVIEW = false

export function AnnouncementPopup() {
  const settings = useSettings()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Don't show popup on admin routes
  const isAdminRoute = pathname?.startsWith("/administrator") || pathname?.startsWith("/admin-login")
  if (isAdminRoute) return null

  const generalSettings = settings?.general || {}
  const popupEnabled = DEV_PREVIEW || generalSettings.popupEnabled === true || generalSettings.popupEnabled === "true" || generalSettings.popupEnabled === "1"
  const popupTitle = generalSettings.popupTitle || "Announcement"
  const popupMessage = DEV_PREVIEW ? (generalSettings.popupMessage || "🔧 Dev Preview — popup is working!") : generalSettings.popupMessage || ""

  useEffect(() => {
    if (!popupEnabled || !popupMessage.trim()) {
      return
    }

    if (!DEV_PREVIEW) {
      try {
        const isDismissed = sessionStorage.getItem("announcement_dismissed")
        if (!isDismissed) {
          setIsOpen(true)
        }
      } catch (e) {
        // In case sessionStorage is blocked
        setIsOpen(true)
      }
    } else {
      setIsOpen(true)
    }
  }, [popupEnabled, popupMessage])

  const handleClose = () => {
    try {
      sessionStorage.setItem("announcement_dismissed", "true")
    } catch (e) {
      console.error("Could not set sessionStorage:", e)
    }
    setIsOpen(false)
  }

  if (!isOpen || !popupEnabled || !popupMessage.trim()) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-2xl transform transition-all duration-300 scale-100 animate-slide-in-from-top"
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-title"
      >
        {/* Header gradient banner */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
              <Megaphone className="h-5 w-5 text-white" />
            </div>
            <h3 id="popup-title" className="text-lg font-bold text-white tracking-wide">
              {popupTitle}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-1.5 text-white/80 hover:text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close Announcement"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 text-gray-700 text-sm leading-relaxed max-h-[60vh] overflow-y-auto space-y-4">
          <div
            className="prose prose-sm max-w-none text-gray-700 font-sans"
            dangerouslySetInnerHTML={{ __html: popupMessage }}
          />
        </div>

        {/* Action Footer */}
        <div className="bg-gray-50 border-t border-gray-100 px-6 py-3 flex justify-end">
          <Button
            onClick={handleClose}
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 py-2 rounded-lg shadow-sm transition-all"
          >
            Got it, Close
          </Button>
        </div>
      </div>
    </div>
  )
}
