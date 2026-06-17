"use client"

import { AuthProvider } from "@/context/auth"
import { AdminAuthProvider } from "@/context/admin-auth"
import { SettingsProvider } from "@/context/settings"
import { Toaster } from "@/components/ui/toaster"

export function Providers({ children, settings }: { children: React.ReactNode, settings: any }) {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <SettingsProvider settings={settings}>
          {children}
          <Toaster />
        </SettingsProvider>
      </AdminAuthProvider>
    </AuthProvider>
  )
}
