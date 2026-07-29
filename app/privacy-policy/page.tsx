"use client"

import { useEffect, useState } from "react"
import { useSettings } from "@/context/settings"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { Shield } from "lucide-react"
import { RegionSwitcher, type Region } from "@/components/legal/region-switcher"
import PrivacyUK from "@/components/legal/privacy-uk"
import PrivacyUAE from "@/components/legal/privacy-uae"

export default function PrivacyPolicyPage() {
  const [region, setRegion] = useState<Region>("UK")
  const settings = useSettings()

  useEffect(() => {
    const savedRegion = localStorage.getItem("legal_region") as Region
    if (savedRegion === "UK" || savedRegion === "UAE") {
      setRegion(savedRegion)
    }
  }, [])

  const handleRegionChange = (newRegion: Region) => {
    setRegion(newRegion)
    localStorage.setItem("legal_region", newRegion)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-teal-50 to-gray-100"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-100 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-teal-300 rounded-full blur-3xl opacity-20"></div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(20 184 166) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        ></div>

        <div className="relative z-10 px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl shadow-2xl mb-8 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute inset-0 opacity-10">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `radial-gradient(circle at 20px 20px, white 2px, transparent 0)`,
                    backgroundSize: "40px 40px",
                  }}
                ></div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl opacity-10"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-300 rounded-full blur-3xl opacity-20"></div>

              <div className="relative z-10 px-6 sm:px-12 py-8 sm:py-12">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold text-white mb-2">
                      Legal Document
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Privacy Policy</h1>
                    <p className="text-teal-50 text-base sm:text-lg mt-2">Your privacy and data protection rights</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-sm text-teal-50">Last Updated: {settings?.general?.effectiveDate ? new Date(settings.general.effectiveDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "11 November, 2025"}</div>
                </div>
              </div>
            </div>

            {/* Region Switcher */}
            <RegionSwitcher currentRegion={region} onChange={handleRegionChange} />

            {/* Content Sections based on selected Region */}
            {region === "UK" ? <PrivacyUK /> : <PrivacyUAE />}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}