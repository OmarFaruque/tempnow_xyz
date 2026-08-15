"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ArrowLeft, Lock, CreditCard, Building2, Shield, Car, FileText, Clock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CheckoutDesignPage() {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank" | "apple">("card")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [paymentView, setPaymentView] = useState<"selection" | "card-details" | "bank-details" | "apple-details">(
    "selection",
  )
  const [cardNumber, setCardNumber] = useState("")
  const [cardType, setCardType] = useState<"visa" | "mastercard" | "amex" | null>(null)
  const [shuffleIndex, setShuffleIndex] = useState(0)
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")
  const [cardName, setCardName] = useState("")
  const [isExpiryValid, setIsExpiryValid] = useState(true)

  const cardLogos = [
    "https://raw.githubusercontent.com/datatrans/payment-logos/master/assets/cards/visa.svg",
    "https://raw.githubusercontent.com/datatrans/payment-logos/master/assets/cards/mastercard.svg",
    "https://raw.githubusercontent.com/datatrans/payment-logos/master/assets/cards/american-express.svg",
    "https://raw.githubusercontent.com/datatrans/payment-logos/master/assets/generic/card-generic-alt.svg",
  ]

  useEffect(() => {
    if (!cardType) {
      const interval = setInterval(() => {
        setShuffleIndex((prev) => (prev + 1) % cardLogos.length)
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [cardType, cardLogos.length])

  const detectCardType = (number: string) => {
    const cleaned = number.replace(/\s/g, "")
    if (cleaned.startsWith("4")) {
      return "visa"
    } else if (/^5[1-5]/.test(cleaned) || /^222[1-9]|22[3-9]|2[3-6]|27[01]|2720/.test(cleaned)) {
      return "mastercard"
    } else if (/^3[47]/.test(cleaned)) {
      return "amex"
    }
    return null
  }

  const validateExpiry = (expiryValue: string) => {
    if (expiryValue.length < 5) {
      setIsExpiryValid(true)
      return
    }

    const [month, year] = expiryValue.split("/")
    const monthNum = Number.parseInt(month, 10)
    const yearNum = Number.parseInt("20" + year, 10)

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    if (monthNum < 1 || monthNum > 12) {
      setIsExpiryValid(false)
      return
    }

    if (yearNum < currentYear) {
      setIsExpiryValid(false)
    } else if (yearNum === currentYear && monthNum < currentMonth) {
      setIsExpiryValid(false)
    } else {
      setIsExpiryValid(true)
    }
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s/g, "")
    value = value.replace(/\D/g, "").slice(0, 16)
    const formatted = value.match(/.{1,4}/g)?.join(" ") || value
    setCardNumber(formatted)
    setCardType(detectCardType(value))
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const previousLength = expiry.length

    let value = inputValue.replace(/\D/g, "")

    const isDeleting = inputValue.length < previousLength

    if (!isDeleting) {
      if (value.length === 1) {
        const firstDigit = Number.parseInt(value, 10)
        if (firstDigit >= 2 && firstDigit <= 9) {
          value = "0" + value
        }
      } else if (value.length === 2) {
        const month = Number.parseInt(value, 10)
        if (value.startsWith("1") && month > 12) {
          value = "12"
        }
        if (month > 12) {
          value = "12"
        }
      }
    }

    value = value.slice(0, 4)

    if (value.length >= 3 || (!isDeleting && value.length >= 2)) {
      value = value.slice(0, 2) + "/" + value.slice(2)
    }

    setExpiry(value)
    validateExpiry(value)
  }

  const isCardFormValid = () => {
    const cleanedCardNumber = cardNumber.replace(/\s/g, "")
    return (
      cleanedCardNumber.length >= 15 &&
      expiry.length >= 5 &&
      isExpiryValid &&
      cvv.length >= 3 &&
      cardName.trim().length > 0
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-48 top-1/4 h-96 w-96 rounded-full bg-yellow-500/20 blur-3xl animate-pulse" />
        <div className="absolute -right-48 top-2/3 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl animate-pulse delay-1000" />
      </div>

      <header className="relative border-b border-slate-800/50 bg-black/80 backdrop-blur-sm px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-lg font-bold tracking-wide bg-gradient-to-r from-yellow-400 to-teal-400 bg-clip-text text-transparent">
            gosure.io
          </h1>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-6 py-6">
        <Button variant="ghost" size="sm" className="gap-2 text-slate-400 hover:text-white hover:bg-slate-800/50">
          <ArrowLeft className="h-4 w-4" />
          Back to Quote
        </Button>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pb-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-yellow-500/20 bg-slate-900/50 backdrop-blur-sm px-6 py-5 shadow-lg shadow-yellow-500/10">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500/20 to-teal-500/20">
                <Lock className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">Secure Checkout</h1>
                <p className="text-sm text-slate-400">Your payment information is protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="relative mx-auto max-w-7xl px-6 pb-12">
        <div className="mx-auto max-w-2xl">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-xl border border-yellow-500/20 bg-slate-900/50 backdrop-blur-sm shadow-lg shadow-yellow-500/10">
              <div className="h-1 bg-gradient-to-r from-yellow-500/80 to-teal-500/80" />

              <div className="border-b border-slate-800 bg-slate-900/80 px-6 py-4">
                <h2 className="text-sm font-semibold text-white">Documents Summary</h2>
              </div>
              <div className="divide-y divide-slate-800 p-6">
                <div className="flex items-center gap-4 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500/20 to-teal-500/20">
                    <FileText className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-slate-400">Registration</div>
                    <div className="text-base font-semibold text-white">LX61 JYE</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500/20 to-teal-500/20">
                    <Car className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-slate-400">Vehicle</div>
                    <div className="text-base font-semibold text-white">BMW 1 Series</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500/20 to-teal-500/20">
                    <Clock className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-slate-400">Duration</div>
                    <div className="text-base font-semibold text-white">1 hour</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500/20 to-teal-500/20">
                    <User className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-slate-400">Name</div>
                    <div className="text-base font-semibold text-white">John Doe</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-yellow-500/20 bg-slate-900/50 backdrop-blur-sm shadow-lg shadow-yellow-500/10">
              <div className="h-1 bg-gradient-to-r from-yellow-500/80 to-teal-500/80" />

              <div className="p-6">
                <div className="mb-6 flex items-center gap-3 border-b border-slate-800 pb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500/20 to-teal-500/20">
                    <CreditCard className="h-4 w-4 text-yellow-400" />
                  </div>
                  <h2 className="text-base font-semibold text-white">Payment Method</h2>
                </div>

                <div className="mb-6 rounded-lg border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-teal-500/10 p-5 text-center">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Amount Due</div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-teal-400 bg-clip-text text-transparent">
                    £24.51
                  </div>
                </div>

                {paymentView === "selection" && (
                  <>
                    <h3 className="mb-4 text-sm font-medium text-white">Select Payment Method</h3>

                    <div className="space-y-3">
                      <button
                        onClick={() => setPaymentView("card-details")}
                        className="w-full rounded-lg border border-slate-700/50 bg-slate-800/50 p-4 text-left transition-all hover:border-yellow-500/50 hover:bg-slate-800/80"
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-yellow-400" />
                          <div className="flex-1">
                            <div className="font-medium text-white">Credit or Debit Card</div>
                            <div className="text-sm text-slate-400">Visa, Mastercard, Amex accepted</div>
                          </div>
                          <ArrowLeft className="h-5 w-5 rotate-180 text-slate-400" />
                        </div>
                      </button>

                      <button
                        onClick={() => setPaymentView("apple-details")}
                        className="w-full rounded-lg border border-slate-700/50 bg-slate-800/50 p-4 text-left transition-all hover:border-yellow-500/50 hover:bg-slate-800/80"
                      >
                        <div className="flex items-center gap-3">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                          </svg>
                          <div className="flex-1">
                            <div className="font-medium text-white">Apple Pay</div>
                            <div className="text-sm text-slate-400">Pay instantly with saved cards</div>
                          </div>
                          <ArrowLeft className="h-5 w-5 rotate-180 text-slate-400" />
                        </div>
                      </button>

                      <button
                        onClick={() => setPaymentView("bank-details")}
                        className="w-full rounded-lg border border-slate-700/50 bg-slate-800/50 p-4 text-left transition-all hover:border-yellow-500/50 hover:bg-slate-800/80"
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-yellow-400" />
                          <div className="flex-1">
                            <div className="font-medium text-white">Bank Transfer</div>
                            <div className="text-sm text-slate-400">Secure direct payment from your bank</div>
                          </div>
                          <ArrowLeft className="h-5 w-5 rotate-180 text-slate-400" />
                        </div>
                      </button>
                    </div>
                  </>
                )}

                {paymentView === "card-details" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 rounded-lg bg-gradient-to-br from-yellow-500/10 to-teal-500/10 border border-yellow-500/20 p-4">
                      <CreditCard className="h-5 w-5 text-yellow-400" />
                      <div>
                        <div className="font-medium text-white">Credit or Debit Card</div>
                        <div className="text-sm text-slate-400">Enter your card details below</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber" className="text-sm font-medium text-slate-300">
                          Card Number
                        </Label>
                        <div className="relative">
                          <Input
                            id="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            className="h-11 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 pr-14"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                          />
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-60 transition-opacity duration-700">
                            {cardType === "visa" && (
                              <div
                                key="visa"
                                className="flex h-6 w-9 items-center justify-center rounded-sm animate-in fade-in duration-500"
                              >
                                <img
                                  src="https://raw.githubusercontent.com/datatrans/payment-logos/master/assets/cards/visa.svg"
                                  alt="Visa"
                                  className="h-full w-full rounded-sm object-contain"
                                />
                              </div>
                            )}
                            {cardType === "mastercard" && (
                              <div
                                key="mastercard"
                                className="flex h-6 w-9 items-center justify-center rounded-sm animate-in fade-in duration-500"
                              >
                                <img
                                  src="https://raw.githubusercontent.com/datatrans/payment-logos/master/assets/cards/mastercard.svg"
                                  alt="Mastercard"
                                  className="h-full w-full rounded-sm object-contain"
                                />
                              </div>
                            )}
                            {cardType === "amex" && (
                              <div
                                key="amex"
                                className="flex h-6 w-9 items-center justify-center rounded-sm animate-in fade-in duration-500"
                              >
                                <img
                                  src="https://raw.githubusercontent.com/datatrans/payment-logos/master/assets/cards/american-express.svg"
                                  alt="American Express"
                                  className="h-full w-full rounded-sm object-contain"
                                />
                              </div>
                            )}
                            {!cardType && (
                              <div
                                key={`shuffle-${shuffleIndex}`}
                                className="flex h-6 w-9 items-center justify-center rounded-sm animate-in fade-in duration-700"
                              >
                                <img
                                  src={cardLogos[shuffleIndex] || "/placeholder.svg"}
                                  alt="Card"
                                  className="h-full w-full rounded-sm object-contain"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry" className="text-sm font-medium text-slate-300">
                            Expiry Date
                          </Label>
                          <Input
                            id="expiry"
                            placeholder="MM/YY"
                            className={`h-11 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 ${!isExpiryValid && expiry.length >= 5 ? "text-red-500 border-red-500" : ""}`}
                            value={expiry}
                            onChange={handleExpiryChange}
                            maxLength={5}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv" className="text-sm font-medium text-slate-300">
                            CVV
                          </Label>
                          <Input
                            id="cvv"
                            placeholder="123"
                            className="h-11 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            maxLength={4}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cardName" className="text-sm font-medium text-slate-300">
                          Cardholder Name
                        </Label>
                        <Input
                          id="cardName"
                          placeholder="John Doe"
                          className="h-11 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="flex cursor-pointer items-start gap-3">
                        <Checkbox
                          id="terms"
                          checked={termsAccepted}
                          onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                          className="mt-0.5 border-slate-600 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                        />
                        <span className="text-sm text-slate-400">
                          I confirm I've read and agree to the{" "}
                          <a href="/gosure/terms-of-service" className="font-medium text-yellow-400 hover:underline">
                            Terms of Service
                          </a>{" "}
                          and understand this is a non-refundable digital document service.
                        </span>
                      </label>
                    </div>

                    <Button
                      className="h-14 w-full rounded-lg bg-gradient-to-r from-yellow-500 to-teal-500 text-base font-semibold text-white shadow-lg shadow-yellow-500/25 transition-all hover:shadow-xl hover:shadow-yellow-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                      disabled={!termsAccepted || !isCardFormValid()}
                    >
                      <Lock className="mr-2 h-5 w-5" />
                      Pay £24.51
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setPaymentView("selection")}
                      className="w-full gap-2 border-slate-700 bg-slate-800/50 text-white hover:bg-slate-800"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Return to Payment Methods
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                      <Shield className="h-4 w-4 text-yellow-400" />
                      <span>Secure & Encrypted</span>
                    </div>
                  </div>
                )}

                {paymentView === "bank-details" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 rounded-lg bg-gradient-to-br from-yellow-500/10 to-teal-500/10 border border-yellow-500/20 p-4">
                      <Building2 className="h-5 w-5 text-yellow-400" />
                      <div>
                        <div className="font-medium text-white">Bank Transfer</div>
                        <div className="text-sm text-slate-400">Direct payment from your bank</div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 text-center">
                      <p className="text-sm leading-relaxed text-slate-400">
                        Once you confirm your order, we'll provide complete bank transfer instructions including all
                        account details needed to complete your payment securely.
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="flex cursor-pointer items-start gap-3">
                        <Checkbox
                          id="terms-bank"
                          checked={termsAccepted}
                          onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                          className="mt-0.5 border-slate-600 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                        />
                        <span className="text-sm text-slate-400">
                          I confirm I've read and agree to the{" "}
                          <a href="/gosure/terms-of-service" className="font-medium text-yellow-400 hover:underline">
                            Terms of Service
                          </a>{" "}
                          and understand this is a non-refundable digital document service.
                        </span>
                      </label>
                    </div>

                    <Button
                      className="h-14 w-full rounded-lg bg-gradient-to-r from-yellow-500 to-teal-500 text-base font-semibold text-white shadow-lg shadow-yellow-500/25 transition-all hover:shadow-xl hover:shadow-yellow-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                      disabled={!termsAccepted}
                    >
                      <Lock className="mr-2 h-5 w-5" />
                      Continue to payment
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setPaymentView("selection")}
                      className="w-full gap-2 border-slate-700 bg-slate-800/50 text-white hover:bg-slate-800"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Return to Payment Methods
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                      <Shield className="h-4 w-4 text-yellow-400" />
                      <span>Secure & Encrypted</span>
                    </div>
                  </div>
                )}

                {paymentView === "apple-details" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 rounded-lg bg-gradient-to-br from-yellow-500/10 to-teal-500/10 border border-yellow-500/20 p-4">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                      <div>
                        <div className="font-medium text-white">Apple Pay</div>
                        <div className="text-sm text-slate-400">Quick and secure payment</div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 text-center">
                      <p className="text-sm leading-relaxed text-slate-400">
                        Once you confirm your order, you'll be able to complete your payment using Apple Pay. Your
                        payment information is securely processed through Apple's encrypted payment system.
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="flex cursor-pointer items-start gap-3">
                        <Checkbox
                          id="terms-apple"
                          checked={termsAccepted}
                          onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                          className="mt-0.5 border-slate-600 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                        />
                        <span className="text-sm text-slate-400">
                          I confirm I've read and agree to the{" "}
                          <a href="/gosure/terms-of-service" className="font-medium text-yellow-400 hover:underline">
                            Terms of Service
                          </a>{" "}
                          and understand this is a non-refundable digital document service.
                        </span>
                      </label>
                    </div>

                    <Button
                      className="h-14 w-full rounded-lg bg-gradient-to-r from-yellow-500 to-teal-500 text-base font-semibold text-white shadow-lg shadow-yellow-500/25 transition-all hover:shadow-xl hover:shadow-yellow-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                      disabled={!termsAccepted}
                    >
                      <Lock className="mr-2 h-5 w-5" />
                      Continue with Apple Pay
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setPaymentView("selection")}
                      className="w-full gap-2 border-slate-700 bg-slate-800/50 text-white hover:bg-slate-800"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Return to Payment Methods
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                      <Shield className="h-4 w-4 text-yellow-400" />
                      <span>Secure & Encrypted</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-yellow-500/20 bg-slate-900/50 backdrop-blur-sm p-6 shadow-lg shadow-yellow-500/10">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500/20 to-teal-500/20">
                  <Shield className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white">Technical Support & Refunds</h3>
                  <p className="text-sm leading-relaxed text-slate-400">
                    If you experience any technical issues during your payment or delivery, please contact our support
                    team immediately. Refunds are available if any issues occur during the delivery process that prevent
                    you from using the service as intended.
                  </p>
                  <a
                    href="/gosure/contact"
                    className="inline-flex items-center gap-1 text-sm font-medium text-yellow-400 hover:underline"
                  >
                    Contact Support
                    <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
