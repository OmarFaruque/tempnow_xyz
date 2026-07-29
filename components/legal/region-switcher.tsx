"use client"

import { Globe } from "lucide-react"

export type Region = "UK" | "UAE"

interface RegionSwitcherProps {
  currentRegion: Region
  onChange: (region: Region) => void
}

export function RegionSwitcher({ currentRegion, onChange }: RegionSwitcherProps) {
  return (
    <div className="flex justify-end items-center mb-6 gap-2">
      <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
        <Globe className="w-3.5 h-3.5" />
        <span>Jurisdiction:</span>
      </div>
      <div className="inline-flex rounded-lg border border-gray-200 bg-white/80 p-0.5 shadow-sm backdrop-blur-sm">
        <button
          onClick={() => onChange("UK")}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 ${
            currentRegion === "UK"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          UK
        </button>
        <button
          onClick={() => onChange("UAE")}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 ${
            currentRegion === "UAE"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          UAE (Dubai)
        </button>
      </div>
    </div>
  )
}
