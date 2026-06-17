"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationContainer } from "@/components/notification"
import { Shield, AlertCircle, ArrowLeft } from "lucide-react"

export default function PolicyViewPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { notifications, addNotification, removeNotification } = useNotifications()
  const policyNumber = searchParams.get("number")
  const [isMounted, setIsMounted] = useState(false)

  const [formData, setFormData] = useState({
    surname: "",
    dateOfBirthDay: "",
    dateOfBirthMonth: "",
    dateOfBirthYear: "",
    postcode: "",
  })

  const [isVerifying, setIsVerifying] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Refs for auto-advance functionality
  const dayRef = useRef<HTMLInputElement>(null)
  const monthRef = useRef<HTMLInputElement>(null)
  const yearRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // If no policy number is provided, redirect to home
  useEffect(() => {
    if (isMounted && !policyNumber) {
      router.push("/")
    }
  }, [policyNumber, router, isMounted])

  if (!isMounted) {
    return null
  }

  const handleInputChange = (field: string, value: string) => {
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    setFormData((prev) => ({ ...prev, [field]: value }))

    // Auto-advance logic for date fields
    if (field === "dateOfBirthDay" && value.length === 2 && monthRef.current) {
      monthRef.current.focus()
    } else if (field === "dateOfBirthMonth" && value.length === 2 && yearRef.current) {
      yearRef.current.focus()
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate surname
    if (!formData.surname.trim()) {
      newErrors.surname = "Surname is required"
    }

    // Validate date of birth
    if (!formData.dateOfBirthDay) {
      newErrors.dateOfBirthDay = "Day is required"
    } else if (Number.parseInt(formData.dateOfBirthDay) < 1 || Number.parseInt(formData.dateOfBirthDay) > 31) {
      newErrors.dateOfBirthDay = "Day must be between 1 and 31"
    }

    if (!formData.dateOfBirthMonth) {
      newErrors.dateOfBirthMonth = "Month is required"
    } else if (Number.parseInt(formData.dateOfBirthMonth) < 1 || Number.parseInt(formData.dateOfBirthMonth) > 12) {
      newErrors.dateOfBirthMonth = "Month must be between 1 and 12"
    }

    if (!formData.dateOfBirthYear) {
      newErrors.dateOfBirthYear = "Year is required"
    } else if (
      Number.parseInt(formData.dateOfBirthYear) < 1900 ||
      Number.parseInt(formData.dateOfBirthYear) > new Date().getFullYear()
    ) {
      newErrors.dateOfBirthYear = "Please enter a valid year"
    }

    // Validate postcode
    if (!formData.postcode.trim()) {
      newErrors.postcode = "Postcode is required"
    } else if (!/^[A-Z0-9]{1,4}\s?[A-Z0-9]{1,3}$/i.test(formData.postcode.trim())) {
      newErrors.postcode = "Please enter a valid UK postcode"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!validateForm()) {
      addNotification({
        type: "error",
        title: "Validation Error",
        message: "Please correct the errors in the form.",
      })
      return
    }

    setIsVerifying(true)

    try {
      const dateOfBirth = `${formData.dateOfBirthYear}-${formData.dateOfBirthMonth.padStart(2, "0")}-${formData.dateOfBirthDay.padStart(2, "0")}`

      const response = await fetch("/api/policy/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyNumber: policyNumber!,
          surname: formData.surname,
          dateOfBirth,
          postcode: formData.postcode,
        }),
      })

      const result = await response.json()

      if (response.ok && result.isValid) {
        sessionStorage.setItem(`policy_verified_${policyNumber}`, "true")
        addNotification({
          type: "success",
          title: "Verification Successful",
          message: "Document details verified successfully.",
        })
        setTimeout(() => {
          router.push(`/order/details?number=${policyNumber}`)
        }, 1500)
      } else {
        addNotification({
          type: "error",
          title: "Verification Failed",
          message: "The information provided does not match our records. Please check your details and try again.",
        })
      }
    } catch (error) {
      console.error("Verification error:", error)
      addNotification({
        type: "error",
        title: "Verification Error",
        message: "An error occurred during verification. Please try again.",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  if (!policyNumber) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Request</h1>
            <p className="text-gray-600 mb-6">No policy number was provided.</p>
            <Button onClick={() => router.push("/")} className="bg-teal-600 hover:bg-teal-700 text-white">
              Return to Home
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/20">
      <main className="px-4 sm:px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 mb-6 text-center shadow-lg">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Retrieve Your Information</h1>
            <p className="text-white/90 text-sm sm:text-base max-w-lg mx-auto">
              Please verify your identity to access your documents.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6 text-center">
              <p className="text-xs font-semibold text-teal-700 mb-1 uppercase">Docs Number</p>
              <p className="text-xl sm:text-2xl font-bold text-teal-900">{policyNumber}</p>
            </div>

            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label
                  htmlFor="surname"
                  className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide"
                >
                  Surname *
                </label>
                <Input
                  id="surname"
                  type="text"
                  value={formData.surname}
                  onChange={(e) => handleInputChange("surname", e.target.value)}
                  className={`w-full h-12 text-base focus-visible:outline-none shadow-sm border-2 rounded-lg transition-all ${errors.surname ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"}`}
                  style={{ WebkitTapHighlightColor: 'transparent', outline: 'none', boxShadow: 'none', WebkitBoxShadow: 'none' }}
                  required
                  autoComplete="family-name"
                />
                {errors.surname && <p className="text-red-500 text-xs mt-2 font-medium">{errors.surname}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Date of Birth *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Input
                      ref={dayRef}
                      type="text"
                      value={formData.dateOfBirthDay}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 2)
                        handleInputChange("dateOfBirthDay", value)
                      }}
                      className={`w-full h-12 text-center text-base shadow-sm border-2 rounded-lg transition-all font-semibold ${errors.dateOfBirthDay ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"}`}
                      placeholder="DD"
                      maxLength={2}
                      required
                      inputMode="numeric"
                      autoComplete="bday-day"
                      style={{ WebkitTapHighlightColor: 'transparent', outline: 'none', boxShadow: 'none', WebkitBoxShadow: 'none' }}
                    />
                    {errors.dateOfBirthDay && (
                      <p className="text-red-500 text-xs mt-2 font-medium">{errors.dateOfBirthDay}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      ref={monthRef}
                      type="text"
                      value={formData.dateOfBirthMonth}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 2)
                        handleInputChange("dateOfBirthMonth", value)
                      }}
                      className={`w-full h-12 text-center text-base shadow-sm border-2 rounded-lg transition-all font-semibold ${errors.dateOfBirthMonth ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"}`}
                      placeholder="MM"
                      maxLength={2}
                      required
                      inputMode="numeric"
                      autoComplete="bday-month"
                      style={{ WebkitTapHighlightColor: 'transparent', outline: 'none', boxShadow: 'none', WebkitBoxShadow: 'none' }}
                    />
                    {errors.dateOfBirthMonth && (
                      <p className="text-red-500 text-xs mt-2 font-medium">{errors.dateOfBirthMonth}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      ref={yearRef}
                      type="text"
                      value={formData.dateOfBirthYear}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 4)
                        handleInputChange("dateOfBirthYear", value)
                      }}
                      className={`w-full h-12 text-center text-base shadow-sm border-2 rounded-lg transition-all font-semibold ${errors.dateOfBirthYear ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"}`}
                      placeholder="YYYY"
                      maxLength={4}
                      required
                      inputMode="numeric"
                      autoComplete="bday-year"
                      style={{ WebkitTapHighlightColor: 'transparent', outline: 'none', boxShadow: 'none', WebkitBoxShadow: 'none' }}
                    />
                    {errors.dateOfBirthYear && (
                      <p className="text-red-500 text-xs mt-2 font-medium">{errors.dateOfBirthYear}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Format: DD/MM/YYYY (e.g., 01/01/1980)</p>
              </div>

              <div>
                <label
                  htmlFor="postcode"
                  className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide"
                >
                  Postcode *
                </label>
                <Input
                  id="postcode"
                  type="text"
                  value={formData.postcode}
                  onChange={(e) => handleInputChange("postcode", e.target.value.toUpperCase())}
                  className={`w-full h-12 text-base shadow-sm border-2 rounded-lg transition-all ${errors.postcode ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"}`}
                  style={{ WebkitTapHighlightColor: 'transparent', outline: 'none', boxShadow: 'none', WebkitBoxShadow: 'none' }}
                  required
                  autoComplete="postal-code"
                />
                {errors.postcode && <p className="text-red-500 text-xs mt-2 font-medium">{errors.postcode}</p>}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-3 h-auto text-base font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Verifying...
                  </>
                ) : (
                  "Access Documents"
                )}
              </Button>
            </form>

            <div className="mt-6 bg-amber-50 rounded-xl p-5 border border-amber-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-bold text-gray-900 mb-2">Need Help?</h2>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    If you require any assistance or experience any issues, please contact us through our contact page.
                  </p>
                  <Button
                    onClick={() => router.push("/contact")}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 h-auto text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all"
                  >
                    Contact Support
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Notification Container - This renders the actual popup notifications */}
      <NotificationContainer notifications={notifications} onClose={removeNotification} />
    </div>
  )
}
