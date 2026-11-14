"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, ChevronDown, Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { VehicleType, VehicleVariant } from "@/lib/vehicle-catalogue/types"
import type { CatalogOption, CatalogStep } from "@/lib/vehicle-catalogue/types"

const VEHICLE_TYPE_OPTIONS: { value: VehicleType; label: string }[] = [
  { value: "car", label: "Car" },
  { value: "van", label: "Van" },
]

const selectClasses =
  "w-full appearance-none rounded-xl border-2 border-slate-200 bg-white px-4 py-3.5 pr-11 text-base font-semibold text-teal-900 outline-none transition-colors focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-60"

interface StepSelectProps {
  id: string
  label: string
  placeholder: string
  value: string
  options: CatalogOption[]
  onChange: (value: string) => void
  disabled?: boolean
}

function StepSelect({ id, label, placeholder, value, options, onChange, disabled = false }: StepSelectProps) {
  return (
    <div className="animate-in fade-in slide-in-from-top-1 duration-300">
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className={selectClasses}
        >
          <option value="" className="bg-white text-slate-400">
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-white text-teal-900">
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  )
}

interface AnsweredStep {
  step: CatalogStep
  options: CatalogOption[]
  value: string
}

interface CatalogResponse {
  step: CatalogStep | null
  options?: CatalogOption[]
  vehicle?: VehicleVariant | null
  message?: string
  source?: string
  attribution?: string | null
}

export interface VehicleFinderProps {
  /** Called with the /get-quote url when the customer continues. Defaults to a router push. */
  onContinue?: (url: string) => void
  className?: string
}

/**
 * Progressive (step based) vehicle picker for customers who do not know their
 * registration number. Mirrors the tempcover flow: vehicle type, then one select
 * per question - the questions themselves come from the catalogue provider, so
 * the bundled catalogue asks make > model > variant while a paid feed can ask
 * make > model > year > engine > fuel without any change here.
 */
export function VehicleFinder({ onContinue, className = "" }: VehicleFinderProps) {
  const router = useRouter()

  const [vehicleType, setVehicleType] = useState<VehicleType>("car")
  const [answered, setAnswered] = useState<AnsweredStep[]>([])
  const [current, setCurrent] = useState<{ step: CatalogStep; options: CatalogOption[] } | null>(null)
  const [vehicle, setVehicle] = useState<VehicleVariant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [attribution, setAttribution] = useState("")

  const requestId = useRef(0)

  const load = useCallback(async (type: VehicleType, selection: Record<string, string>) => {
    const id = ++requestId.current
    setLoading(true)
    setError("")

    try {
      const params = new URLSearchParams({ type })
      for (const [key, value] of Object.entries(selection)) {
        if (value) params.set(key, value)
      }

      const response = await fetch(`/api/vehicle-catalog?${params.toString()}`)
      const data: CatalogResponse = await response.json().catch(() => ({ step: null, options: [] }))

      if (id !== requestId.current) return

      if (!response.ok) {
        throw new Error(data?.message || "Could not load the vehicle list.")
      }

      setCurrent(data.step ? { step: data.step, options: data.options ?? [] } : null)
      setVehicle(data.vehicle ?? null)
      setAttribution(data.attribution ?? "")
    } catch (err) {
      if (id !== requestId.current) return
      setCurrent(null)
      setVehicle(null)
      setError(
        err instanceof Error && err.message
          ? err.message
          : "We couldn't load the vehicle list just now. Please try again.",
      )
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [])

  // Initial load, and reload whenever the vehicle type changes.
  useEffect(() => {
    setAnswered([])
    setCurrent(null)
    setVehicle(null)
    load(vehicleType, {})
  }, [vehicleType, load])

  const handleTypeChange = (value: string) => {
    if (value === vehicleType) return
    setVehicleType(value as VehicleType)
  }

  const selectionFrom = (steps: AnsweredStep[]) =>
    steps.reduce<Record<string, string>>((acc, entry) => {
      acc[entry.step.key] = entry.value
      return acc
    }, {})

  /** Change an answered step (or answer the current one when index === answered.length). */
  const choose = (index: number, value: string) => {
    if (!value) return

    const isCurrent = index >= answered.length
    const step = isCurrent ? current?.step : answered[index]?.step
    const options = isCurrent ? current?.options ?? [] : answered[index]?.options ?? []
    if (!step) return

    const nextAnswered = [...answered.slice(0, index), { step, options, value }]
    setAnswered(nextAnswered)
    setCurrent(null)
    setVehicle(null)
    load(vehicleType, selectionFrom(nextAnswered))
  }

  const handleReset = () => {
    setAnswered([])
    setCurrent(null)
    setVehicle(null)
    setError("")
    load(vehicleType, {})
  }

  const handleRetry = () => {
    load(vehicleType, selectionFrom(answered))
  }

  const handleContinue = (event: React.FormEvent) => {
    event.preventDefault()
    if (!vehicle) return

    const years =
      vehicle.yearFrom === vehicle.yearTo ? `${vehicle.yearFrom}` : `${vehicle.yearFrom}-${vehicle.yearTo}`

    const params = new URLSearchParams({
      type: vehicle.vehicleType,
      make: vehicle.make,
      model: vehicle.model,
      variant: vehicle.label,
      years,
      year: String(vehicle.year || vehicle.yearTo),
      engine: String(vehicle.engineCapacity || ""),
      fuel: vehicle.fuel || "",
    })

    const url = `/get-quote?${params.toString()}`
    if (onContinue) {
      onContinue(url)
    } else {
      router.push(url)
    }
  }

  return (
    <form onSubmit={handleContinue} className="bg-white rounded-xl shadow max-w-md mx-auto p-6 sm:p-8" noValidate>
      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold text-teal-700 mb-1">Find your vehicle</h2>
        <p className="text-teal-500 text-sm">No registration? Just pick the options below</p>
      </div>

      <div className="space-y-4 text-left">
        <StepSelect
          id="vehicle-type"
          label="Vehicle type"
          placeholder="Select vehicle type"
          value={vehicleType}
          options={VEHICLE_TYPE_OPTIONS}
          onChange={handleTypeChange}
          disabled={loading}
        />

        {answered.map((entry, index) => (
          <StepSelect
            key={`${entry.step.key}-${index}`}
            id={`vehicle-${entry.step.key}-${index}`}
            label={entry.step.label}
            placeholder={entry.step.placeholder}
            value={entry.value}
            options={entry.options}
            onChange={(value) => choose(index, value)}
            disabled={loading}
          />
        ))}

        {!loading && current && (
          <StepSelect
            key={`current-${current.step.key}`}
            id={`vehicle-${current.step.key}-current`}
            label={current.step.label}
            placeholder={current.step.placeholder}
            value=""
            options={current.options}
            onChange={(value) => choose(answered.length, value)}
          />
        )}

        {loading && (
          <div className="flex items-center gap-2 rounded-xl border-2 border-slate-700/60 bg-slate-800 px-4 py-3.5 text-sm font-medium text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
            Loading vehicle options…
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3">
          <p className="text-sm text-red-300">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-2 text-sm font-semibold text-teal-400 underline underline-offset-4 hover:text-teal-300"
          >
            Try again
          </button>
        </div>
      )}

      {vehicle && (
        <div className="mt-4 rounded-xl border border-teal-200 shadow ring-1 ring-teal-100 px-4 py-3 bg-teal-800/20">
          <p className="text-xs uppercase tracking-wide text-teal-600 font-semibold">Selected vehicle</p>
          <p className="text-sm font-bold text-teal-700">
            {vehicle.make} {vehicle.model} · {vehicle.label}
          </p>
          <p className="text-xs text-teal-600">
            {vehicle.engineCapacity > 0 ? `${vehicle.engineCapacity}cc · ` : ""}
            {vehicle.fuel || "Fuel not specified"} ·{" "}
            {vehicle.yearFrom === vehicle.yearTo
              ? vehicle.yearFrom
              : `${vehicle.yearFrom}-${vehicle.yearTo}`}
          </p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!vehicle || loading}
        className="mt-5 w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-teal-600/25 disabled:opacity-50 disabled:cursor-pointer"
      >
        Continue
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>

      {answered.length > 0 && (
        <button
          type="button"
          onClick={handleReset}
          className="mt-3 mx-auto flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-teal-400 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Start over
        </button>
      )}

      <p className="mt-4 text-center text-slate-500 text-xs">
        No registration yet? You can add it later from your dashboard.
      </p>
    </form>
  )
}