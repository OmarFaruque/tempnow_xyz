
import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "./providers"

import { Inter } from "next/font/google"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

import { getSettings } from "@/lib/database"

export async function generateMetadata(): Promise<Metadata> {
  const generalSettings = (await getSettings("general")) || {}
  const title = generalSettings.seoTitle || generalSettings.siteName || process.env.APP_TITLE || "TEMPNOW"
  const description = generalSettings.seoDescription || process.env.APP_DESCRIPTION || "Document Generation Services"
  const keywords = typeof generalSettings.seoKeywords === "string"
    ? generalSettings.seoKeywords.split(",").map((keyword: string) => keyword.trim()).filter(Boolean)
    : undefined
  const siteDomain = generalSettings.seoCanonicalUrl || generalSettings.siteDomain || process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
  const metadataBase = siteDomain
    ? new URL(siteDomain.startsWith("http") ? siteDomain : `https://${siteDomain}`)
    : undefined
  const socialImage = generalSettings.seoImage || undefined

  return {
    metadataBase,
    title,
    description,
    keywords,
    applicationName: title,
    alternates: metadataBase ? { canonical: metadataBase } : undefined,
    openGraph: {
      type: "website",
      title,
      description,
      url: metadataBase,
      siteName: title,
      images: socialImage ? [{ url: socialImage }] : undefined,
    },
    twitter: {
      card: socialImage ? "summary_large_image" : "summary",
      title,
      description,
      images: socialImage ? [socialImage] : undefined,
    },
    robots: {
      index: generalSettings.seoIndex !== false,
      follow: generalSettings.seoFollow !== false,
    },
  }
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
