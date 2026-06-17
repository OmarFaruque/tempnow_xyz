'use client'

import { createContext, useContext, ReactNode } from 'react'


interface Settings {
  siteName: string
  activeRedirection?: string
  redirectUrl?: string
  [key: string]: any
}

const SettingsContext = createContext<Settings | null>(null)

export function SettingsProvider({ children, settings }: { children: ReactNode; settings: Settings }) {
  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
