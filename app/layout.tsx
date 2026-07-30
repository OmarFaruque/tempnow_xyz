
import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "./providers"

import { Inter } from "next/font/google"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

import { getSettings } from "@/lib/database"

export const metadata: Metadata = {
  title: process.env.APP_TITLE || "TEMPNOW",
  description: process.env.APP_DESCRIPTION || "Temporary Email Service",
  generator: process.env.APP_GENERATOR || "v0.dev",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const generalSettings = (await getSettings("general")) || {}
  const generalUaeSettings = (await getSettings("general_uae")) || {}
  const openaiSettings = await getSettings("openai")
  const bankSettings = await getSettings("bank")
  const stripeSettings = await getSettings("stripe")
  const squareSettings = await getSettings("square")
  const vivaSettings = await getSettings("viva")
  const authorizenetSettings = await getSettings("authorizenet")
  const paymentSettings = await getSettings("payment")
  const certificateTemplate = await getSettings("certificateTemplate")

  const activeJurisdiction = generalSettings?.activeJurisdiction || "uk"

  // Merge UAE settings over UK settings if active jurisdiction is UAE
  const activeGeneralSettings = { ...generalSettings }
  if (activeJurisdiction === "uae") {
    for (const key of Object.keys(generalUaeSettings)) {
      if (
        generalUaeSettings[key] !== undefined &&
        generalUaeSettings[key] !== null &&
        generalUaeSettings[key] !== ""
      ) {
        activeGeneralSettings[key] = generalUaeSettings[key]
      }
    }
  }
  activeGeneralSettings.siteName = activeGeneralSettings.siteName || "TEMPNOW"
  activeGeneralSettings.activeJurisdiction = activeJurisdiction

  const settings = {
    general: activeGeneralSettings,
    general_uk: generalSettings,
    general_uae: generalUaeSettings,
    openai: openaiSettings,
    bank: bankSettings,
    stripe: stripeSettings,
    square: squareSettings,
    viva: vivaSettings,
    authorizenet: authorizenetSettings,
    paymentProvider: paymentSettings,
    certificateTemplate: certificateTemplate,
  }

  return (
    <html lang="en">
      <head>
        {activeGeneralSettings.favicon && (
          <link rel="icon" href={activeGeneralSettings.favicon} />
        )}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                document.documentElement.classList.remove('dark');
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers settings={settings}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
