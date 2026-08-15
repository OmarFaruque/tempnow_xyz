"use client"

import { useState } from "react"
import { CheckCircle, User, Car, Calculator, ArrowLeft, CreditCard, Edit, Check, X, Tag, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Header } from "@/components/header"

export default function ReviewPage() {
  const [promoCode, setPromoCode] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [promoError, setPromoError] = useState("")
  const [promoApplied, setPromoApplied] = useState(false)
  const [discount, setDiscount] = useState(0)

  const [formData] = useState({
    title: "Mr",
    name: "John Doe",
    dob: "15/03/1985",
    address: "123 High Street, London, SW1A 1AA",
    licenseType: "Full UK",
    occupation: "Software Engineer",
    vehicle: "Ford Focus",
    registration: "AB12 CDE",
    duration: "1 Hour",
    reason: "Borrowing",
    modifications: ["Alloy Wheels", "Tinted Windows", "Sports Exhaust"],
  })

  const getNext5MinuteTime = () => {
    const now = new Date()
    const minutes = Math.ceil(now.getMinutes() / 5) * 5
    now.setMinutes(minutes)
    now.setSeconds(0)
    return now
  }

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const calculateQuote = () => {
    return { total: 24.99 }
  }

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase()

    if (code === "TEST") {
      setPromoError("")
      setPromoApplied(true)
      setDiscount(20) // 20% off
    } else if (code === "") {
      setPromoError("Please enter a promo code")
      setPromoApplied(false)
      setDiscount(0)
    } else {
      setPromoError("Invalid promo code. Please try again.")
      setPromoApplied(false)
      setDiscount(0)
    }
  }

  const startTime = getNext5MinuteTime()
  const expiryTime = new Date(startTime)
  expiryTime.setHours(expiryTime.getHours() + 1)

  const basePrice = calculateQuote().total
  const discountAmount = (basePrice * discount) / 100
  const finalPrice = basePrice - discountAmount

  const handleProceedToPayment = () => {
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <Link
            href="/get-quote"
            className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quote
          </Link>

          {/* Main Card */}
          <div className="bg-white rounded-lg p-6 sm:p-8 shadow-sm border border-gray-200">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Review Your Details</h1>
              <p className="text-gray-600">Please review your information before proceeding</p>
            </div>

            {/* Stacked Sections */}
            <div className="space-y-6">
              {/* Customer Details */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Customer Details</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Full Name:</span>
                    <span className="font-semibold text-gray-900">{formData.name}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Date of Birth:</span>
                    <span className="font-semibold text-gray-900">{formData.dob}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Address:</span>
                    <span className="font-semibold text-gray-900 text-right max-w-[60%]">{formData.address}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                    <span className="text-gray-600">License Type:</span>
                    <span className="font-semibold text-gray-900">{formData.licenseType || "Full UK"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Occupation:</span>
                    <span className="font-semibold text-gray-900">{formData.occupation || "Software Engineer"}</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Car className="w-5 h-5 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Vehicle Details</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Registration Number:</span>
                    <span className="font-semibold text-gray-900">{formData.registration}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Make & Model:</span>
                    <span className="font-semibold text-gray-900">{formData.vehicle}</span>
                  </div>
                  <div className="flex justify-between text-sm items-start">
                    <span className="text-gray-600">Modifications:</span>
                    <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                      {formData.modifications.length > 0 ? (
                        formData.modifications.map((mod, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"
                          >
                            {mod}
                          </span>
                        ))
                      ) : (
                        <span className="font-semibold text-gray-900">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Details */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Document Details</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-semibold text-gray-900">1 Hour</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Reason:</span>
                    <span className="font-semibold text-gray-900">Borrowing</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Start Time:</span>
                    <span className="font-semibold text-gray-900">{formatDateTime(startTime)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Expiry Time:</span>
                    <span className="font-semibold text-gray-900">{formatDateTime(expiryTime)}</span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 rounded-xl p-4 sm:p-6 shadow-lg border border-teal-500/30">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-inner">
                      <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight drop-shadow-sm">
                        Total Price
                      </h3>
                      <p className="text-xs sm:text-sm text-teal-100/90 font-medium">Your final amount to pay</p>
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
                  <p className="text-xs sm:text-sm text-teal-100/80 mt-2 sm:mt-3 font-medium tracking-wide uppercase">
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
                  <p className="text-xs sm:text-sm text-teal-100/90 mb-3 sm:mb-4 font-medium">
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
                          className="flex-1 h-11 sm:h-12 text-sm sm:text-base bg-white/90 border-2 border-teal-300 rounded-lg shadow-sm font-medium outline-none ring-0 focus:border-teal-400 focus:ring-0 focus:outline-none placeholder:text-teal-600/50"
                        />
                        <Button
                          type="button"
                          onClick={handleApplyPromo}
                          className="h-11 sm:h-12 px-6 sm:px-8 bg-white text-teal-700 hover:bg-teal-50 font-bold shadow-sm tracking-tight"
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
                  variant="outline"
                  className="flex-1 h-12 border-2 border-gray-300 hover:border-teal-500 hover:bg-teal-50 text-gray-700 font-semibold bg-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Change Details
                </Button>
                <Button
                  onClick={handleProceedToPayment}
                  disabled={isProcessing}
                  className="flex-1 h-12 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold shadow-lg"
                >
                  {isProcessing ? (
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
        </div>
      </main>
    </div>
  )
}
