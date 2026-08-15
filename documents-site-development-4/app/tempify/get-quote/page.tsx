"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Car,
  Clock,
  User,
  MapPin,
  CreditCard,
  Search,
  CheckCircle,
  Calculator,
  FileText,
  Tag,
  Check,
  X,
  Edit,
} from "lucide-react"

// Mock data for the demo registration
const vehicleData = {
  LX61JYE: {
    make: "Volkswagen",
    model: "Golf",
    year: "2017",
  },
}

// Mock occupation data
const occupations = [
  "Accountant",
  "Actor",
  "Architect",
  "Artist",
  "Baker",
  "Barber",
  "Carpenter",
  "Chef",
  "Dentist",
  "Designer",
  "Doctor",
  "Driver",
  "Electrician",
  "Engineer",
  "Farmer",
  "Firefighter",
  "Journalist",
  "Lawyer",
  "Manager",
  "Mechanic",
  "Nurse",
  "Pharmacist",
  "Photographer",
  "Pilot",
  "Plumber",
  "Police Officer",
  "Professor",
  "Programmer",
  "Receptionist",
  "Retired",
  "Sales Representative",
  "Scientist",
  "Self Employed",
  "Student",
  "Teacher",
  "Veterinarian",
  "Waiter/Waitress",
  "Writer",
]

// Mock address data for HA35RQ
const addressData = {
  HA35RQ: [
    "1 High Street, Harrow, HA3 5RQ",
    "2 High Street, Harrow, HA3 5RQ",
    "3 High Street, Harrow, HA3 5RQ",
    "4 High Street, Harrow, HA3 5RQ",
    "5 High Street, Harrow, HA3 5RQ",
  ],
}

const getNext5MinuteTime = () => {
  const now = new Date()
  const minutes = now.getMinutes()
  const remainder = minutes % 5
  now.setMinutes(minutes + (remainder === 0 ? 0 : 5 - remainder))
  now.setSeconds(0)
  now.setMilliseconds(0)
  return now
}

const formatDateTime = (date: Date) => {
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear().toString().slice(-2)
  const hours = date.getHours().toString().padStart(2, "0")
  const mins = date.getMinutes().toString().padStart(2, "0")
  return `${day}/${month}/${year} ${hours}:${mins}`
}

const modificationsData = {
  "Audio & Electronics": [
    "Additional screens / headrest displays",
    "Amplifiers",
    "Dashcams (front/rear)",
    "Subwoofers",
    "Upgraded speakers",
  ],
  "Body & Exterior Styling": [
    "Aftermarket grilles",
    "Body kits (full)",
    "Carbon fibre exterior parts",
    "Custom badges / debadging",
    "Dechroming",
    "Diffusers",
    "Paint changes",
    "Side skirts",
    "Smoked/tinted lights",
    "Splitters",
    "Spoilers / wings",
    "Widebody kits",
    "Wraps (full/partial)",
  ],
  "Comfort & Interior": [
    "Bucket seats",
    "Custom ambient lighting",
    "Roll cages",
    "Starlight headliner",
    "Steering wheel upgrades",
    "Upgraded infotainment systems",
    "Upholstery changes (leather/alcantara, re-trim)",
  ],
  "Drivetrain & Engine Performance": [
    "ECU remap / tuning (Stage 1/2/3)",
    "Fuel system upgrades (injectors, HPFP)",
    "Induction kits / performance intakes",
    "Intercooler upgrades",
    "Lightweight pulleys",
    "Nitrous systems",
    "Turbo upgrades / hybrid turbos",
  ],
  "Exhaust System": ["Cat-back systems", "Decat downpipes", "Exhaust tips", "Resonator delete", "Sports cat downpipes"],
  Lighting: [
    "DRL conversions (RGB, sequential)",
    "Fog light upgrades",
    "Headlight upgrades (LED/HID)",
    "Interior LED conversions",
    "Underglow lighting",
  ],
  "Safety & Security": [
    "Anti-hijack systems",
    "Ghost immobiliser",
    "Steering wheel locks/mounts",
    "Tracking systems (S5/S7)",
    "Upgraded alarm systems",
  ],
  "Suspension, Handling & Brakes": [
    "Air suspension",
    "Anti-roll bars",
    "Big brake kits",
    "Brake discs/pads (upgraded)",
    "Coilovers",
    "Lowering springs",
    "Strut braces",
    "Wheel spacers",
  ],
  "Transmission & Structural": [
    "Clutch upgrades",
    "Differential upgrades",
    "Driveshaft upgrades",
    "Tow bars",
    "Transmission tuning (TCU/gearbox map)",
  ],
  "Wheels & Tyres": [
    "Alloy wheels (aftermarket)",
    "Changing wheel size",
    "Tyre changes (performance, wider, stretch)",
    "Run-flat to non–run-flat conversion",
  ],
  Other: ["Roof racks", "Window tints", "Custom 3D/4D plates"],
}

export default function GetQuotePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registrationFromHome = searchParams.get("registration")

  const occupationInputRef = useRef<HTMLInputElement>(null)
  const dobDayRef = useRef<HTMLInputElement>(null)
  const dobMonthRef = useRef<HTMLInputElement>(null)
  const dobYearRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!registrationFromHome) {
      router.push("/tempify")
      return
    }
  }, [registrationFromHome, router])

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirthDay: "",
    dateOfBirthMonth: "",
    dateOfBirthYear: "",
    phoneNumber: "",
    occupation: "",
    postcode: "",
    address: "",
    licenseType: "",
    licenseHeld: "",
    licenseDuration: "", // Added licenseDuration state
    vehicleValue: "",
    reason: "",
    durationType: "Hours",
    duration: "1 hour",
    showDurationDropdown: false,
    startDate: "Immediate Start",
    startTime: "",
    startHour: "",
    startMinute: "",
    modifications: [] as string[],
  })

  const [vehicle, setVehicle] = useState<(typeof vehicleData)[keyof typeof vehicleData] | null>(null)
  const [addresses, setAddresses] = useState<string[]>([])
  const [showAddresses, setShowAddresses] = useState(false)
  const [filteredOccupations, setFilteredOccupations] = useState(occupations)
  const [showOccupationDropdown, setShowOccupationDropdown] = useState(false)
  const [quote, setQuote] = useState<any>(null) // Use a more specific type if available
  const [isCalculating, setIsCalculating] = useState(false)
  const [postcodeError, setPostcodeError] = useState("")
  const [showReview, setShowReview] = useState(false)
  const [ageError, setAgeError] = useState("")
  const [promoCode, setPromoCode] = useState("")
  const [showTimeSelection, setShowTimeSelection] = useState(false)
  const [occupationSearch, setOccupationSearch] = useState("")
  const [showQuote, setShowQuote] = useState(false)
  const [customModifications, setCustomModifications] = useState<Record<string, string>>({})
  const [showOtherInput, setShowOtherInput] = useState<Record<string, boolean>>({})

  // Promo code states
  const [promoApplied, setPromoApplied] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [promoError, setPromoError] = useState("")
  const [basePrice, setBasePrice] = useState(0)
  const [finalPrice, setFinalPrice] = useState(0)

  useEffect(() => {
    if (registrationFromHome && vehicleData[registrationFromHome]) {
      setVehicle(vehicleData[registrationFromHome])
    }
  }, [registrationFromHome])

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    if (field === "phoneNumber" && typeof value === "string") {
      const digitsOnly = value.replace(/\D/g, "")
      if (digitsOnly === "") {
        setFormData((prev) => ({ ...prev, [field]: "" }))
        return
      }
      const isValidStart = digitsOnly.startsWith("07") || digitsOnly.startsWith("447")
      const limitedValue = digitsOnly.slice(0, 11)
      if (isValidStart || (digitsOnly.length <= 3 && ("07".startsWith(digitsOnly) || "447".startsWith(digitsOnly)))) {
        setFormData((prev) => ({ ...prev, [field]: limitedValue }))
      }
      return
    }

    let processedValue = value
    if (field === "occupation") {
      processedValue = value.toString().replace(/[^A-Za-z\s]/g, "")
    }

    if (field === "startHour") {
      setFormData((prev) => ({ ...prev, startHour: value as string, startMinute: "", startTime: "" }))
      return
    }

    if (field === "startMinute") {
      const combinedTime = `${formData.startHour}:${value as string}`
      setFormData((prev) => ({ ...prev, startMinute: value as string, startTime: combinedTime }))
      return
    }

    if (field === "startDate") {
      setShowTimeSelection(value !== "Immediate Start")
      if (value === "Immediate Start") {
        setFormData((prev) => ({ ...prev, [field]: value, startTime: "", startHour: "", startMinute: "" }))
      } else {
        setFormData((prev) => ({ ...prev, [field]: value }))
      }
      return
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }))

    if (field === "occupation") {
      const filtered = occupations.filter((job) => job.toLowerCase().includes(value.toString().toLowerCase()))
      setFilteredOccupations(filtered)
      setShowOccupationDropdown(true)
    }
  }

  const handleModificationToggle = (modification: string) => {
    setFormData((prev) => {
      const isSelected = prev.modifications.includes(modification)
      if (isSelected) {
        return { ...prev, modifications: prev.modifications.filter((m) => m !== modification) }
      } else {
        return { ...prev, modifications: [...prev.modifications, modification] }
      }
    })
  }

  const handleOtherToggle = (category: string) => {
    setShowOtherInput((prev) => ({ ...prev, [category]: !prev[category] }))
    if (showOtherInput[category]) {
      const customModKey = `${category} - Other: ${customModifications[category]}`
      setFormData((prev) => ({ ...prev, modifications: prev.modifications.filter((m) => m !== customModKey) }))
      setCustomModifications((prev) => ({ ...prev, [category]: "" }))
    }
  }

  const handleCustomModificationChange = (category: string, value: string) => {
    setCustomModifications((prev) => ({ ...prev, [category]: value }))
    const oldCustomModKey = `${category} - Other: ${customModifications[category]}`
    const newCustomModKey = `${category} - Other: ${value}`
    setFormData((prev) => {
      const filtered = prev.modifications.filter((m) => m !== oldCustomModKey)
      return { ...prev, modifications: value.trim() ? [...filtered, newCustomModKey] : filtered }
    })
  }

  const handlePostcodeLookup = () => {
    setPostcodeError("")
    if (!formData.postcode.trim()) {
      setPostcodeError("Please enter a postcode before searching")
      return
    }
    const formattedPostcode = formData.postcode.toUpperCase().replace(/\s/g, "")
    if (formattedPostcode === "HA35RQ") {
      setAddresses(addressData[formattedPostcode])
      setShowAddresses(true)
      setPostcodeError("")
    } else {
      setAddresses([])
      setShowAddresses(false)
      setPostcodeError("Address not found. Please enter your address manually below.")
      setFormData((prev) => ({ ...prev, address: "" }))
    }
  }

  const calculateQuote = () => {
    const basePriceRaw = 15.0
    const durationValue = Number.parseInt(formData.duration.split(" ")[0])
    let durationMultiplier = 1
    if (formData.durationType === "Hours") {
      durationMultiplier = durationValue * 0.8
    } else if (formData.durationType === "Days") {
      durationMultiplier = durationValue * 1.2
    } else if (formData.durationType === "Weeks") {
      durationMultiplier = durationValue * 5.5
    }

    const currentYear = new Date().getFullYear()
    const birthYear = Number.parseInt(formData.dateOfBirthYear)
    const age = currentYear - birthYear
    let ageFactor = 1.0
    if (age < 25) {
      ageFactor = 1.8
    } else if (age < 30) {
      ageFactor = 1.4
    } else if (age < 50) {
      ageFactor = 1.0
    } else {
      ageFactor = 1.1
    }

    let licenseFactor = 1.0
    switch (formData.licenseHeld) {
      case "Under 1 Year":
        licenseFactor = 2.0
        break
      case "1-2 Years":
        licenseFactor = 1.6
        break
      case "2-4 Years":
        licenseFactor = 1.2
        break
      case "5-10 Years":
        licenseFactor = 1.0
        break
      case "10+ Years":
        licenseFactor = 0.9
        break
    }

    let vehicleValueFactor = 1.0
    switch (formData.vehicleValue) {
      case "£1,000 - £5,000":
        vehicleValueFactor = 0.8
        break
      case "£5,000 - £10,000":
        vehicleValueFactor = 1.0
        break
      case "£10,000 - £20,000":
        vehicleValueFactor = 1.2
        break
      case "£20,000 - £30,000":
        vehicleValueFactor = 1.4
        break
      case "£30,000 - £50,000":
        vehicleValueFactor = 1.8
        break
      case "£50,000 - £80,000":
        vehicleValueFactor = 2.2
        break
      case "£80,000+":
        vehicleValueFactor = 3.0
        break
    }

    let reasonFactor = 1.0
    switch (formData.reason) {
      case "Borrowing":
        reasonFactor = 1.1
        break
      case "Buying/Selling/Testing":
        reasonFactor = 0.9
        break
      case "Learning":
        reasonFactor = 1.5
        break
      case "Maintenance":
        reasonFactor = 0.8
        break
      case "Other":
        reasonFactor = 1.2
        break
    }

    const subtotal = basePriceRaw * durationMultiplier * ageFactor * licenseFactor * vehicleValueFactor * reasonFactor
    const insurancePremiumTax = subtotal * 0.12
    let total = subtotal + insurancePremiumTax

    // Apply promo discount if active
    if (promoApplied && discount > 0) {
      total = total * (1 - discount / 100)
    }

    // Ensure minimum price
    total = Math.max(total, 8.5)

    const startTime = getNext5MinuteTime()
    const expiryTime = new Date(startTime)
    const durationVal = Number.parseInt(formData.duration.split(" ")[0])
    if (formData.durationType === "Hours") {
      expiryTime.setHours(expiryTime.getHours() + durationVal)
    } else if (formData.durationType === "Days") {
      expiryTime.setDate(expiryTime.getDate() + durationVal)
    } else {
      expiryTime.setDate(expiryTime.getDate() + durationVal * 7)
    }

    // Update state for promo code calculations
    setBasePrice(
      basePriceRaw * durationMultiplier * ageFactor * licenseFactor * vehicleValueFactor * reasonFactor +
        insurancePremiumTax,
    ) // Price before discount
    setFinalPrice(total)

    return {
      basePrice: basePriceRaw, // This seems to be the initial base price before multipliers
      durationMultiplier,
      ageFactor,
      licenseFactor,
      vehicleValueFactor,
      reasonFactor,
      subtotal, // Subtotal before IPT and promo discount
      insurancePremiumTax,
      total: total,
      breakdown: {
        age,
        duration: `${durationValue} ${formData.durationType.toLowerCase()}`,
        licenseExperience: formData.licenseHeld,
        vehicleValue: formData.vehicleValue,
        reason: formData.reason,
      },
      startTime: formatDateTime(startTime),
      expiryTime: formatDateTime(expiryTime),
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Calculate quote price before showing review
    const calculatedQuote = calculateQuote()
    setShowReview(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleNewQuote = () => {
    setShowQuote(false)
    setQuote(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const selectOccupation = (occupation: string) => {
    handleInputChange("occupation", occupation)
    setShowOccupationDropdown(false)
    setOccupationSearch(occupation)
  }

  const handleDurationTypeChange = (type: string) => {
    setFormData((prev) => {
      let newDuration = ""
      let showDropdown = prev.showDurationDropdown
      if (type === "Hours") {
        newDuration = "1 hour"
        showDropdown = false
      } else if (type === "Days") {
        newDuration = "1 day"
        showDropdown = false
      } else if (type === "Weeks") {
        newDuration = "1 week"
        showDropdown = false
      }
      return { ...prev, durationType: type, duration: newDuration, showDurationDropdown: showDropdown }
    })
  }

  const handleDurationChange = (duration: string) => {
    setFormData((prev) => ({ ...prev, duration: duration }))
  }

  const handleOtherDurationClick = () => {
    setFormData((prev) => ({ ...prev, showDurationDropdown: true }))
  }

  const generateDateOptions = () => {
    const options = ["Immediate Start"]
    const today = new Date()
    for (let i = 0; i < 28; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      let dayName = ""
      if (i === 0) dayName = "Today"
      else if (i === 1) dayName = "Tomorrow"
      else dayName = date.toLocaleDateString("en-GB", { weekday: "long" })
      const dateStr = date.toLocaleDateString("en-GB", { day: "numeric", month: "long" })
      options.push(`${dayName}, ${dateStr}`)
    }
    return options
  }

  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i < 10 ? `0${i}` : `${i}`
    return `${hour}:00`
  })
  const minuteOptions = Array.from({ length: 12 }, (_, i) => {
    const minute = i * 5
    return minute.toString().padStart(2, "0")
  })

  const getDurationOptions = () => {
    if (formData.durationType === "Hours") {
      return Array.from({ length: 23 }, (_, i) => `${i + 1} ${i === 0 ? "hour" : "hours"}`)
    } else if (formData.durationType === "Days") {
      return Array.from({ length: 28 }, (_, i) => `${i + 1} ${i === 0 ? "day" : "days"}`)
    } else {
      return Array.from({ length: 4 }, (_, i) => `${i + 1} ${i === 0 ? "week" : "weeks"}`)
    }
  }

  const generateMinuteOptions = (selectedHour: string) => {
    const options: string[] = []
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const hourNum = Number.parseInt(selectedHour)

    for (let minute = 0; minute < 60; minute += 5) {
      const minuteString = minute.toString().padStart(2, "0")
      if (formData.startDate.includes("Today") && hourNum === currentHour && minute < currentMinute) {
        continue
      }
      options.push(minuteString)
    }
    return options
  }

  const generateHourOptions = () => {
    const options: string[] = []
    const now = new Date()
    const currentHour = now.getHours()
    for (let hour = 0; hour < 24; hour++) {
      const hourString = hour.toString().padStart(2, "0")
      if (formData.startDate.includes("Today") && hour < currentHour) {
        continue
      }
      options.push(hourString)
    }
    return options
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest(".occupation-dropdown-container")) {
        setShowOccupationDropdown(false)
      }
    }
    if (showOccupationDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showOccupationDropdown])

  const handleChangeDetails = () => {
    setShowReview(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleProceedToPayment = () => {
    setIsCalculating(true)
    setTimeout(() => {
      const calculatedQuote = calculateQuote()
      const quoteDataForCheckout = {
        total: calculatedQuote.total,
        startTime: calculatedQuote.startTime,
        expiryTime: calculatedQuote.expiryTime,
        breakdown: { duration: calculatedQuote.breakdown.duration, reason: calculatedQuote.breakdown.reason },
        customerData: {
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          dateOfBirth: `${formData.dateOfBirthDay}/${formData.dateOfBirthMonth}/${formData.dateOfBirthYear}`,
          phoneNumber: formData.phoneNumber,
          occupation: formData.occupation,
          address: formData.address,
          licenseType: formData.licenseType,
          licenseHeld: formData.licenseHeld,
          vehicleValue: formData.vehicleValue,
          reason: formData.reason,
          duration: formData.duration,
          registration: registrationFromHome,
          vehicle: {
            make: vehicle?.make || "Unknown",
            model: vehicle?.model || "Unknown",
            year: vehicle?.year || "Unknown",
            engineCC: "1400",
          },
        },
      }
      localStorage.setItem("quoteData", JSON.stringify(quoteDataForCheckout))
      setIsCalculating(false)
      window.location.href = "/tempify/checkout"
    }, 2000)
  }

  const validateAge = (day: string, month: string, year: string) => {
    if (day && month && year) {
      const birthDate = new Date(`${year}-${month}-${day}`)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      if (age < 17) {
        setAgeError("You must be at least 17 years old to get a quote.")
      } else {
        setAgeError("")
      }
    }
  }

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      setPromoError("Please enter a promo code.")
      setPromoApplied(false)
      setDiscount(0)
      setFinalPrice(basePrice) // Reset to base price if promo is invalid
      return
    }
    // Mock promo code logic
    if (promoCode.toUpperCase() === "SAVE10") {
      setDiscount(10)
      setPromoApplied(true)
      setPromoError("")
      // Recalculate price with discount
      const currentPrice = calculateQuote().total
      setFinalPrice(currentPrice * (1 - 10 / 100))
    } else {
      setPromoError("Invalid promo code. Please try again.")
      setPromoApplied(false)
      setDiscount(0)
      setFinalPrice(basePrice) // Reset to base price if promo is invalid
    }
  }

  // Calculate initial base and final prices when component mounts or formData changes
  useEffect(() => {
    const quoteData = calculateQuote()
    setBasePrice(quoteData.total) // Initial price before any promo
    setFinalPrice(quoteData.total) // Initial price before any promo
  }, [formData, promoApplied, discount, promoCode]) // Recalculate when relevant state changes

  if (!registrationFromHome) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Redirecting to home page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-900 -z-10" />

      {/* Animated glowing orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-orange-400/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <header className="bg-black/95 border-b border-orange-900/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/tempify" className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent tracking-tighter hover:scale-105 transition-transform">
                TEMPIFY
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/tempify/contact">
                <Button variant="ghost" className="text-gray-300 hover:text-orange-400 hover:bg-gray-900">
                  Contact
                </Button>
              </Link>
              <Link href="/tempify/login">
                <Button className="bg-orange-600 hover:bg-orange-500 text-white">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Get Your Quote Header Banner - Only show when not in review mode */}
          {!showReview && !showQuote && (
            <>
              {/* Dark Theme Header Banner */}
              <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 mb-6 border border-orange-500/20">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Get Your Quote</h1>
                    <p className="text-gray-400 text-sm sm:text-base">Complete the form to get your instant price</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Details Card - Dark Theme */}
              {vehicle && (
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-6 border border-orange-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Car className="w-5 h-5 text-orange-400" />
                      </div>
                      <h2 className="text-lg font-bold text-white">Vehicle Details</h2>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-400">Verified</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-700/50">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Registration</p>
                      <div className="inline-block bg-yellow-400 border-2 border-gray-900 rounded px-3 py-1.5">
                        <span className="font-bold text-gray-900 tracking-wider">{registrationFromHome}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Make</p>
                      <p className="font-bold text-white uppercase">{vehicle.make}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Model</p>
                      <p className="font-bold text-white uppercase">{vehicle.model}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Review Page */}
          {showReview && !showQuote && (
            <div className="bg-gray-900 rounded-lg p-6 sm:p-8 shadow-sm border border-gray-800">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Review Your Details</h1>
                <p className="text-gray-400">Please review your information before proceeding</p>
              </div>

              {/* Stacked Sections */}
              <div className="space-y-6">
                {/* Customer Details */}
                <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-orange-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Customer Details</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm border-b border-gray-700 pb-2">
                      <span className="text-gray-400">Full Name:</span>
                      <span className="font-semibold text-white">
                        {formData.title} {formData.firstName} {formData.middleName} {formData.lastName}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-b border-gray-700 pb-2">
                      <span className="text-gray-400">Date of Birth:</span>
                      <span className="font-semibold text-white">
                        {formData.dateOfBirthDay}/{formData.dateOfBirthMonth}/{formData.dateOfBirthYear}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-b border-gray-700 pb-2">
                      <span className="text-gray-400">Address:</span>
                      <span className="font-semibold text-white text-right max-w-[60%]">{formData.address}</span>
                    </div>
                    <div className="flex justify-between text-sm border-b border-gray-700 pb-2">
                      <span className="text-gray-400">License Type:</span>
                      <span className="font-semibold text-white">{formData.licenseType || "Full UK"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Occupation:</span>
                      <span className="font-semibold text-white">{formData.occupation || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {vehicle && (
                  <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
                        <Car className="w-5 h-5 text-orange-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Vehicle Details</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm border-b border-gray-700 pb-2">
                        <span className="text-gray-400">Registration Number:</span>
                        <span className="font-semibold text-white">{registrationFromHome}</span>
                      </div>
                      <div className="flex justify-between text-sm border-b border-gray-700 pb-2">
                        <span className="text-gray-400">Make & Model:</span>
                        <span className="font-semibold text-white uppercase">
                          {vehicle.make} {vehicle.model}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Modifications:</span>
                        <span className="font-semibold text-white">
                          {formData.modifications.length > 0 ? formData.modifications.join(", ") : "None"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Document Details */}
                <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-orange-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Document Details</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm border-b border-gray-700 pb-2">
                      <span className="text-gray-400">Duration:</span>
                      <span className="font-semibold text-white">{formData.duration}</span>
                    </div>
                    <div className="flex justify-between text-sm border-b border-gray-700 pb-2">
                      <span className="text-gray-400">Reason:</span>
                      <span className="font-semibold text-white">{formData.reason || "Borrowing"}</span>
                    </div>
                    <div className="flex justify-between text-sm border-b border-gray-700 pb-2">
                      <span className="text-gray-400">Start Time:</span>
                      <span className="font-semibold text-white">{formatDateTime(getNext5MinuteTime())}</span>
                    </div>
                    <div className="flex justify-between text-sm border-b border-gray-700 pb-2">
                      <span className="text-gray-400">Expiry Time:</span>
                      <span className="font-semibold text-white">
                        {(() => {
                          const startTime = getNext5MinuteTime()
                          const expiryTime = new Date(startTime)
                          const durationValue = Number.parseInt(formData.duration.split(" ")[0])
                          if (formData.durationType === "Hours") {
                            expiryTime.setHours(expiryTime.getHours() + durationValue)
                          } else if (formData.durationType === "Days") {
                            expiryTime.setDate(expiryTime.getDate() + durationValue)
                          } else {
                            expiryTime.setDate(expiryTime.getDate() + durationValue * 7)
                          }
                          return formatDateTime(expiryTime)
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="bg-gradient-to-br from-orange-600 via-orange-700 to-orange-800 rounded-xl p-4 sm:p-6 shadow-lg border border-orange-500/30">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-inner">
                        <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight drop-shadow-sm">
                          Total Price
                        </h3>
                        <p className="text-xs sm:text-sm text-orange-100/90 font-medium">Your final amount to pay</p>
                      </div>
                    </div>
                  </div>

                  {/* Price Display */}
                  <div className="text-center py-6 sm:py-8 mb-4 sm:mb-6 bg-white/10 backdrop-blur rounded-xl">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                      {promoApplied && (
                        <span className="text-lg sm:text-2xl font-semibold text-white/50 line-through decoration-2">
                          £{basePrice.toFixed(2)}
                        </span>
                      )}
                      <span className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight drop-shadow-lg">
                        £{finalPrice.toFixed(2)}
                      </span>
                      {promoApplied && (
                        <span className="text-xs sm:text-sm font-bold text-green-200 bg-green-500/40 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-sm uppercase tracking-wide">
                          {discount}% off
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-orange-100/80 mt-2 sm:mt-3 font-medium tracking-wide uppercase">
                      Calculated
                    </p>
                  </div>

                  {/* Promo Code Section */}
                  <div
                    className={`p-4 sm:p-5 rounded-xl ${promoApplied ? "bg-green-500/20 border border-green-400/30" : promoError ? "bg-red-500/20 border border-red-400/30" : "bg-white/10 border border-white/20"}`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      <span className="text-sm sm:text-base font-bold text-white tracking-tight">Promo Code</span>
                    </div>
                    <p className="text-xs sm:text-sm text-orange-100/90 mb-3 sm:mb-4 font-medium">
                      Have a discount code? Enter it below:
                    </p>
                    {promoApplied ? (
                      <div className="flex items-center justify-between bg-green-500/30 rounded-lg p-3 sm:p-4">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-400/30 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-300" />
                          </div>
                          <div>
                            <span className="font-bold text-green-100 block tracking-tight text-sm sm:text-base">
                              {promoCode} applied
                            </span>
                            <span className="text-xs sm:text-sm text-green-200/90 font-medium">
                              You saved £{(basePrice - finalPrice).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setPromoApplied(false)
                            setDiscount(0)
                            setPromoCode("")
                            setPromoError("")
                            setFinalPrice(basePrice) // Reset to base price
                          }}
                          className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                          <Input
                            type="text"
                            placeholder="Enter your promo code"
                            value={promoCode}
                            onChange={(e) => {
                              setPromoCode(e.target.value)
                              setPromoError("")
                            }}
                            className="flex-1 h-11 sm:h-12 text-sm sm:text-base bg-white/90 border-2 border-orange-300 rounded-lg shadow-sm font-medium outline-none ring-0 focus:border-orange-400 focus:ring-0 focus:outline-none placeholder:text-orange-600/50"
                          />
                          <Button
                            type="button"
                            onClick={handleApplyPromo}
                            className="h-11 sm:h-12 px-6 sm:px-8 bg-white text-orange-700 hover:bg-orange-50 font-bold shadow-sm tracking-tight"
                          >
                            Apply
                          </Button>
                        </div>
                        {promoError && (
                          <p className="text-red-200 text-xs sm:text-sm mt-2 sm:mt-3 flex items-center">
                            <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            {promoError}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    onClick={handleChangeDetails}
                    variant="outline"
                    className="flex-1 h-12 border-2 border-gray-700 hover:border-orange-500 hover:bg-orange-900/20 text-gray-300 font-semibold bg-transparent"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Change Details
                  </Button>
                  <Button
                    onClick={handleProceedToPayment}
                    disabled={isCalculating}
                    className="flex-1 h-12 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold shadow-lg"
                  >
                    {isCalculating ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Form - only show when not in review mode */}
          {!showQuote && !showReview && (
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-8">
              {/* Duration and Timing */}
              <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Duration & Timing</h2>
                </div>

                {/* Duration Type */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">
                    DURATION TYPE?
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["Hours", "Days", "Weeks"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleDurationTypeChange(type)}
                        className={`py-3 rounded-lg font-medium transition-colors text-base ${
                          formData.durationType === type
                            ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Amount */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">
                    HOW LONG?
                  </label>

                  {!formData.showDurationDropdown ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {formData.durationType === "Hours" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDurationChange("1 hour")}
                            className={`py-3 rounded-lg font-medium transition-colors text-base ${
                              formData.duration === "1 hour"
                                ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md"
                                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            }`}
                          >
                            1 hour
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDurationChange("3 hours")}
                            className={`py-3 rounded-lg font-medium transition-colors text-base ${
                              formData.duration === "3 hours"
                                ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md"
                                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            }`}
                          >
                            3 hours
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDurationChange("5 hours")}
                            className={`py-3 rounded-lg font-medium transition-colors text-base ${
                              formData.duration === "5 hours"
                                ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md"
                                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            }`}
                          >
                            5 hours
                          </button>
                          <button
                            type="button"
                            onClick={handleOtherDurationClick}
                            className="py-3 rounded-lg font-medium transition-colors text-base bg-gray-800 text-gray-300 hover:bg-gray-700"
                          >
                            Other
                          </button>
                        </>
                      )}

                      {formData.durationType === "Days" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDurationChange("1 day")}
                            className={`py-3 rounded-lg font-medium transition-colors text-base ${
                              formData.duration === "1 day"
                                ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md"
                                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            }`}
                          >
                            1 day
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDurationChange("3 days")}
                            className={`py-3 rounded-lg font-medium transition-colors text-base ${
                              formData.duration === "3 days"
                                ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md"
                                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            }`}
                          >
                            3 days
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDurationChange("7 days")}
                            className={`py-3 rounded-lg font-medium transition-colors text-base ${
                              formData.duration === "7 days"
                                ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md"
                                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            }`}
                          >
                            7 days
                          </button>
                          <button
                            type="button"
                            onClick={handleOtherDurationClick}
                            className="py-3 rounded-lg font-medium transition-colors text-base bg-gray-800 text-gray-300 hover:bg-gray-700"
                          >
                            Other
                          </button>
                        </>
                      )}

                      {formData.durationType === "Weeks" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDurationChange("1 week")}
                            className={`py-3 rounded-lg font-medium transition-colors text-base ${
                              formData.duration === "1 week"
                                ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md"
                                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            }`}
                          >
                            1 week
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDurationChange("2 weeks")}
                            className={`py-3 rounded-lg font-medium transition-colors text-base ${
                              formData.duration === "2 weeks"
                                ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md"
                                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            }`}
                          >
                            2 weeks
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDurationChange("3 weeks")}
                            className={`py-3 rounded-lg font-medium transition-colors text-base ${
                              formData.duration === "3 weeks"
                                ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md"
                                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            }`}
                          >
                            3 weeks
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDurationChange("4 weeks")}
                            className={`py-3 rounded-lg font-medium transition-colors text-base ${
                              formData.duration === "4 weeks"
                                ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md"
                                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            }`}
                          >
                            4 weeks
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex space-x-3">
                      <select
                        value={formData.duration}
                        onChange={(e) => handleDurationChange(e.target.value)}
                        className="flex-1 h-12 px-3 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base text-white shadow-sm [&>option]:bg-black [&>option]:text-white"
                        required
                      >
                        {getDurationOptions().map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            showDurationDropdown: false,
                          }))
                        }
                        className="px-4 py-3 text-base border-2 border-gray-700 hover:border-orange-500 hover:bg-orange-900/20 text-white"
                      >
                        Back
                      </Button>
                    </div>
                  )}
                </div>

                {/* Start Date/Time Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">
                    WHEN DO YOU WANT TO START?
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    <select
                      value={formData.startDate}
                      onChange={(e) => handleInputChange("startDate", e.target.value)}
                      className="w-full h-12 px-3 bg-black/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base text-white shadow-sm"
                      required
                    >
                      {generateDateOptions().map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    {showTimeSelection && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">
                            SELECT HOUR
                          </label>
                          <select
                            value={formData.startHour}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, startHour: e.target.value, startMinute: "" }))
                            }
                            disabled={!showTimeSelection}
                            className="w-full h-12 px-3 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-black [&>option]:text-white"
                            required={showTimeSelection}
                          >
                            <option value="">Select hour...</option>
                            {generateHourOptions().map((hour) => (
                              <option key={hour} value={hour}>
                                {hour}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">
                            SELECT MINUTE
                          </label>
                          <select
                            value={formData.startMinute}
                            onChange={(e) => setFormData((prev) => ({ ...prev, startMinute: e.target.value }))}
                            disabled={!formData.startHour || !showTimeSelection}
                            className="w-full h-12 px-3 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-black [&>option]:text-white"
                            required={showTimeSelection}
                          >
                            <option value="">{formData.startHour ? "Select minute..." : "Select hour first"}</option>
                            {formData.startHour &&
                              generateMinuteOptions(formData.startHour).map((minute) => (
                                <option key={minute} value={minute}>
                                  {minute}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-orange-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Driver Details</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">
                      TITLE *
                    </label>
                    <select
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className="w-full h-12 px-3 bg-black/50 border border-orange-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base text-white shadow-sm transition-all [&>option]:bg-black [&>option]:text-white [&>option:checked]:bg-gray-700"
                      required
                    >
                      <option value="">Select title</option>
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Miss">Miss</option>
                      <option value="Ms">Ms</option>
                    </select>
                  </div>

                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">
                      FIRST NAME *
                    </label>
                    <Input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="w-full h-12 text-base shadow-sm bg-black/50 border-gray-700 text-white"
                      required
                    />
                  </div>

                  {/* Middle Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">
                      MIDDLE NAME
                    </label>
                    <Input
                      type="text"
                      value={formData.middleName}
                      onChange={(e) => handleInputChange("middleName", e.target.value)}
                      className="w-full h-12 text-base shadow-sm bg-black/50 border-gray-700 text-white"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">
                      LAST NAME *
                    </label>
                    <Input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="w-full h-12 text-base shadow-sm bg-black/50 border-gray-700 text-white"
                      required
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">
                      DATE OF BIRTH *
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div>
                        <Input
                          ref={dobDayRef}
                          type="text"
                          value={formData.dateOfBirthDay}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 2)
                            handleInputChange("dateOfBirthDay", value)
                            validateAge(value, formData.dateOfBirthMonth, formData.dateOfBirthYear)
                            if (value.length === 2) {
                              dobMonthRef.current?.focus()
                            }
                          }}
                          className="w-full h-12 text-base text-center shadow-sm bg-black/50 border-gray-700 text-white"
                          placeholder="DD"
                          maxLength={2}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          ref={dobMonthRef}
                          type="text"
                          value={formData.dateOfBirthMonth}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 2)
                            handleInputChange("dateOfBirthMonth", value)
                            validateAge(formData.dateOfBirthDay, value, formData.dateOfBirthYear)
                            if (value.length === 2) {
                              dobYearRef.current?.focus()
                            }
                          }}
                          className="w-full h-12 text-base text-center shadow-sm bg-black/50 border-gray-700 text-white"
                          placeholder="MM"
                          maxLength={2}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          ref={dobYearRef}
                          type="text"
                          value={formData.dateOfBirthYear}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 4)
                            handleInputChange("dateOfBirthYear", value)
                            validateAge(formData.dateOfBirthDay, formData.dateOfBirthMonth, value)
                          }}
                          className="w-full h-12 text-base text-center shadow-sm bg-black/50 border-gray-700 text-white"
                          placeholder="YYYY"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>
                    {ageError && <p className="text-red-500 text-sm mt-2">{ageError}</p>}
                  </div>

                  {/* Occupation */}
                  <div className="relative z-[999]" style={{ zIndex: 999 }}>
                    <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">
                      OCCUPATION *
                    </label>
                    <div className="relative">
                      <Input
                        ref={occupationInputRef}
                        type="text"
                        value={occupationSearch}
                        onChange={(e) => {
                          setOccupationSearch(e.target.value)
                          setShowOccupationDropdown(true)
                          const filtered = occupations.filter((job) =>
                            job.toLowerCase().includes(e.target.value.toLowerCase()),
                          )
                          setFilteredOccupations(filtered)
                        }}
                        onFocus={() => setShowOccupationDropdown(true)}
                        onBlur={() => {
                          setTimeout(() => setShowOccupationDropdown(false), 200)
                        }}
                        className="w-full h-12 text-base shadow-sm bg-black/50 border-gray-700 text-white"
                        placeholder="Start typing your occupation..."
                        required
                      />
                      {showOccupationDropdown && filteredOccupations.length > 0 && (
                        <div
                          className="absolute left-0 right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl max-h-60 overflow-y-auto"
                          style={{ zIndex: 99999 }}
                        >
                          {filteredOccupations.map((occupation) => (
                            <div
                              key={occupation}
                              className="px-4 py-2 hover:bg-orange-900/30 cursor-pointer transition-colors border-b border-gray-700 last:border-b-0 text-white"
                              onMouseDown={(e) => {
                                e.preventDefault()
                                setOccupationSearch(occupation)
                                handleInputChange("occupation", occupation)
                                setShowOccupationDropdown(false)
                              }}
                            >
                              {occupation}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">
                      PHONE NUMBER *
                    </label>
                    <Input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                      className="w-full h-12 text-base shadow-sm bg-black/50 border-gray-700 text-white"
                      placeholder="07123456789"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-orange-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Address Information</h2>
                </div>

                <div className="space-y-4 sm:space-6">
                  {/* Postcode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">
                      POSTCODE *
                    </label>
                    <div className="flex space-x-3">
                      <Input
                        type="text"
                        value={formData.postcode}
                        onChange={(e) => {
                          handleInputChange("postcode", e.target.value.toUpperCase())
                          setPostcodeError("")
                        }}
                        className="flex-1 h-12 text-base shadow-sm bg-black/50 border-gray-700 text-white"
                        placeholder="Enter postcode"
                        required
                      />
                      <Button
                        type="button"
                        onClick={handlePostcodeLookup}
                        className="bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
                      >
                        <Search className="w-4 h-4" />
                        <span>Search</span>
                      </Button>
                    </div>
                    {postcodeError && <p className="text-red-500 text-sm mt-2">{postcodeError}</p>}
                  </div>

                  {/* Address Selection */}
                  {showAddresses && addresses.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">
                        SELECT ADDRESS *
                      </label>
                      <select
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        className="w-full h-12 px-3 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base text-white shadow-sm [&>option]:bg-black [&>option]:text-white"
                        required
                        disabled={addresses.length === 0}
                      >
                        <option value="">Select an address...</option>
                        {addresses.map((address, index) => (
                          <option key={index} value={address}>
                            {address}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {postcodeError && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">
                        ENTER ADDRESS *
                      </label>
                      <Input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        className="w-full h-12 text-base shadow-sm bg-black/50 border-gray-700 text-white"
                        placeholder="Enter your full address"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* License Information */}
              <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">License Information</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* License Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">
                      LICENSE TYPE *
                    </label>
                    <select
                      value={formData.licenseType}
                      onChange={(e) => handleInputChange("licenseType", e.target.value)}
                      className="w-full h-12 px-3 bg-black/50 border border-orange-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base text-white shadow-sm transition-all [&>option]:bg-black [&>option]:text-white [&>option:checked]:bg-gray-700"
                      required
                    >
                      <option value="">Select license type...</option>
                      <option value="Full UK License">Full UK</option>
                      <option value="Provisional License">Provisional UK</option>
                      <option value="International License">International</option>
                      <option value="EU License">Full EU</option>
                    </select>
                  </div>

                  {/* License Held */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">
                      HOW LONG HELD? *
                    </label>
                    <select
                      value={formData.licenseHeld}
                      onChange={(e) => handleInputChange("licenseHeld", e.target.value)}
                      className="w-full h-12 px-3 bg-black/50 border border-orange-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base text-white shadow-sm transition-all [&>option]:bg-black [&>option]:text-white [&>option:checked]:bg-gray-700"
                      required
                    >
                      <option value="">Select duration...</option>
                      <option value="Under 1 Year">Under 1 Year</option>
                      <option value="1-2 Years">1-2 Years</option>
                      <option value="2-4 Years">2-4 Years</option>
                      <option value="5-10 Years">5-10 Years</option>
                      <option value="10+ Years">10+ Years</option>
                    </select>
                  </div>

                  {/* License Duration (NEW FIELD) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">
                      LICENSE DURATION *
                    </label>
                    <select
                      value={formData.licenseDuration}
                      onChange={(e) => handleInputChange("licenseDuration", e.target.value)}
                      className="w-full h-12 px-3 bg-black/50 border border-orange-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base text-white shadow-sm transition-all [&>option]:bg-black [&>option]:text-white [&>option:checked]:bg-gray-700"
                      required
                    >
                      <option value="">Select duration...</option>
                      <option value="Less than 1 year">Less than 1 year</option>
                      <option value="1-2 years">1-2 years</option>
                      <option value="2-5 years">2-5 years</option>
                      <option value="5+ years">5+ years</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
                    <Car className="w-5 h-5 text-orange-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Vehicle Information</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Vehicle Value */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">
                      VEHICLE VALUE *
                    </label>
                    <select
                      value={formData.vehicleValue}
                      onChange={(e) => handleInputChange("vehicleValue", e.target.value)}
                      className="w-full h-12 px-3 bg-black/50 border border-orange-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base text-white shadow-sm transition-all [&>option]:bg-black [&>option]:text-white [&>option:checked]:bg-gray-700"
                      required
                    >
                      <option value="">Select vehicle value...</option>
                      <option value="£1,000 - £5,000">£1,000 - £5,000</option>
                      <option value="£5,000 - £10,000">£5,000 - £10,000</option>
                      <option value="£10,000 - £20,000">£10,000 - £20,000</option>
                      <option value="£20,000 - £30,000">£20,000 - £30,000</option>
                      <option value="£30,000 - £50,000">£30,000 - £50,000</option>
                      <option value="£50,000 - £80,000">£50,000 - £80,000</option>
                      <option value="£80,000+">£80,000+</option>
                    </select>
                  </div>

                  {/* Reason for Cover */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">
                      REASON FOR COVER *
                    </label>
                    <select
                      value={formData.reason}
                      onChange={(e) => handleInputChange("reason", e.target.value)}
                      className="w-full h-12 px-3 bg-black/50 border border-orange-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base text-white shadow-sm transition-all [&>option]:bg-black [&>option]:text-white [&>option:checked]:bg-gray-700"
                      required
                    >
                      <option value="">Select reason...</option>
                      <option value="Borrowing">Borrowing</option>
                      <option value="Test Drive">Test Drive</option>
                      <option value="One-off Journey">One-off Journey</option>
                      <option value="Temporary">Temporary</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Vehicle Modifications */}
              <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-800">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Car className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Vehicle Modifications</h2>
                    <p className="text-sm text-gray-400 mt-1">Optional - Select any modifications your vehicle has</p>
                  </div>
                </div>

                <div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-6 rounded">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-300 font-medium">
                        Declaring modifications does not affect your quote price. This information is for order accuracy
                        only.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className="max-h-96 overflow-y-auto pr-2"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#374151 #1f2937",
                  }}
                >
                  {Object.entries(modificationsData).map(([category, modifications]) => (
                    <div key={category} className="border-b border-gray-800 pb-4 mb-4 last:border-b-0">
                      <h3 className="text-base font-semibold text-gray-300 mb-3">{category}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {modifications.map((modification) => (
                          <label
                            key={modification}
                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.modifications.includes(modification)}
                              onChange={() => handleModificationToggle(modification)}
                              className="w-4 h-4 appearance-none border-2 border-gray-600 rounded bg-black/50 checked:bg-orange-600 checked:border-orange-600 cursor-pointer focus:ring-2 focus:ring-orange-500 focus:ring-offset-0 relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-xs checked:after:left-0.5 checked:after:top-[-2px]"
                            />
                            <span className="text-sm text-gray-300">{modification}</span>
                          </label>
                        ))}

                        <div className="col-span-1 sm:col-span-2">
                          <label className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={showOtherInput[category] || false}
                              onChange={() => handleOtherToggle(category)}
                              className="w-4 h-4 appearance-none border-2 border-gray-600 rounded bg-black/50 checked:bg-orange-600 checked:border-orange-600 cursor-pointer focus:ring-2 focus:ring-orange-500 focus:ring-offset-0 relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-xs checked:after:left-0.5 checked:after:top-[-2px]"
                            />
                            <span className="text-sm text-gray-300 font-medium">Other (please specify)</span>
                          </label>

                          {showOtherInput[category] && (
                            <div className="mt-2 ml-6">
                              <Input
                                type="text"
                                placeholder="Enter custom modification..."
                                value={customModifications[category] || ""}
                                onChange={(e) => handleCustomModificationChange(category, e.target.value)}
                                className="text-sm bg-black/50 border-gray-700 text-white"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {formData.modifications.length > 0 && (
                  <div className="mt-6 p-4 bg-orange-900/20 border border-orange-700/50 rounded-lg">
                    <p className="text-sm font-medium text-orange-300 mb-2">
                      Selected Modifications (
                      {formData.modifications.filter((m) => !m.startsWith("Other:")).length +
                        Object.values(customModifications).filter(Boolean).length}
                      ):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.modifications.map((mod) => (
                        <span
                          key={mod}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-900/30 text-orange-300 border border-orange-700/50"
                        >
                          {mod}
                          <button
                            type="button"
                            onClick={() => {
                              handleModificationToggle(mod)
                              if (mod.startsWith("Other:")) {
                                const category = mod.split(" - ")[0]
                                setCustomModifications((prev) => ({ ...prev, [category]: "" }))
                                setShowOtherInput((prev) => ({ ...prev, [category]: false }))
                              }
                            }}
                            className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-orange-800/50 transition-colors"
                          >
                            <span className="text-orange-300">×</span>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-4 px-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl"
                  disabled={
                    !!ageError ||
                    !formData.title ||
                    !formData.firstName ||
                    !formData.lastName ||
                    !formData.dateOfBirthDay ||
                    !formData.dateOfBirthMonth ||
                    !formData.dateOfBirthYear ||
                    !formData.occupation ||
                    !formData.phoneNumber ||
                    !formData.address ||
                    !formData.licenseType ||
                    !formData.licenseHeld ||
                    !formData.vehicleValue ||
                    !formData.reason ||
                    !formData.duration
                  }
                >
                  Review Details
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>

      <footer className="bg-black border-t border-orange-900/20 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent tracking-tighter">
                TEMPIFY
              </span>
            </div>
            <div className="flex items-center gap-6 flex-wrap justify-center">
              <Link
                href="/tempify/privacy-policy"
                className="text-gray-500 hover:text-orange-400 text-sm transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/tempify/terms-of-service"
                className="text-gray-500 hover:text-orange-400 text-sm transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/tempify/return-policy"
                className="text-gray-500 hover:text-orange-400 text-sm transition-colors"
              >
                Return Policy
              </Link>
            </div>
            <p className="text-gray-500 text-sm">© 2025 Tempify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
