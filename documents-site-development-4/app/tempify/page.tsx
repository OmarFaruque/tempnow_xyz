"use client"

import type React from "react"
import { useState, useCallback, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { vehicleMakes } from "@/lib/vehicle-makes"
import {
  Menu,
  X,
  Star,
  Shield,
  Clock,
  TrendingUp,
  Award,
  ChevronDown,
  Zap,
  FileCheck,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Download,
  Lock,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationContainer } from "@/components/notification"
import { checkBlacklist } from "@/lib/blacklist"

export default function TempifyHomepage() {
  const [message, setMessage] = useState("")
  const [mainInput, setMainInput] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [selectedMake, setSelectedMake] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [selectedVariant, setSelectedVariant] = useState("")
  const router = useRouter()
  const { notifications, removeNotification, showError } = useNotifications()

  const formatRegistration = useCallback((value: string) => {
    let formatted = value.toUpperCase()
    if (formatted.length > 7) {
      formatted = formatted.substring(0, 7)
    }
    return formatted
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!mainInput.trim()) {
        setMessage("Please enter a vehicle registration number.")
        return
      }

      const cleanReg = mainInput.replace(/\s+/g, "").toUpperCase()

      try {
        const response = await fetch("/api/get-client-ip")
        const { ip } = await response.json()

        const blacklistCheck = checkBlacklist(undefined, undefined, undefined, ip)
        if (blacklistCheck.isBlacklisted) {
          showError(
            "Access Restricted",
            `Your access has been restricted. Reason: ${blacklistCheck.reason}. Please contact support@tempify.co.uk for assistance.`,
          )
          return
        }

        if (cleanReg !== "LX61JYE") {
          setNotFound(true)
          showError("Vehicle Not Found", "Vehicle registration not found. Please check and try again.")
          return
        }

        window.location.href = `/tempify/get-quote?registration=${encodeURIComponent(cleanReg)}`
      } catch (error) {
        console.error("Failed to check blacklist:", error)
        if (cleanReg !== "LX61JYE") {
          setNotFound(true)
          showError("Vehicle Not Found", "Vehicle registration not found. Please check and try again.")
          return
        }
        window.location.href = `/tempify/get-quote?registration=${encodeURIComponent(cleanReg)}`
      }
    },
    [mainInput, showError],
  )

  const enableManualMode = useCallback(() => {
    setManualMode(true)
    setNotFound(false)
    setMessage("")
  }, [])

  const handleManualContinue = useCallback(() => {
    if (!selectedMake || !selectedModel || !selectedVariant) {
      setMessage("Please select a make, model and variant.")
      return
    }
    const params = new URLSearchParams({
      make: selectedMake,
      model: selectedModel,
      variant: selectedVariant,
    })
    window.location.href = `/tempify/get-quote?${params.toString()}`
  }, [selectedMake, selectedModel, selectedVariant])

  const availableModels = useMemo(
    () => vehicleMakes.find((m) => m.name === selectedMake)?.models ?? [],
    [selectedMake],
  )

  const availableVariants = useMemo(
    () => availableModels.find((m) => m.name === selectedModel)?.variants ?? [],
    [availableModels, selectedModel],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatRegistration(e.target.value)
      setMainInput(formatted)

      if (message) {
        setMessage("")
      }
    },
    [formatRegistration, message],
  )

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev)
  }, [])

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  const allReviews = useMemo(
    () => [
      {
        name: "Sarah Johnson",
        rating: 5,
        text: "Tempify delivered exactly what I needed. Fast, professional, and incredibly easy to use!",
        date: "2 days ago",
      },
      {
        name: "Michael Chen",
        rating: 5,
        text: "The document quality exceeded my expectations. Super affordable and instant download. Highly recommend!",
        date: "1 week ago",
      },
      {
        name: "Emma Thompson",
        rating: 5,
        text: "Brilliant service! Got all my documents sorted in minutes. Fast, secure, and hassle-free.",
        date: "2 weeks ago",
      },
      {
        name: "David Martinez",
        rating: 5,
        text: "Best document service I've used. Ordered late at night and had everything instantly. Amazing!",
        date: "3 days ago",
      },
      {
        name: "Sophie Williams",
        rating: 5,
        text: "Incredible quality and speed. The documents look professional and saved me so much time.",
        date: "5 days ago",
      },
      {
        name: "James Anderson",
        rating: 5,
        text: "Used Tempify for work documents. Lightning fast delivery, perfect quality. Will definitely use again!",
        date: "1 week ago",
      },
    ],
    [],
  )

  const currentReviews = useMemo(() => {
    const reviews = []
    for (let i = 0; i < 3; i++) {
      reviews.push(allReviews[(currentReviewIndex + i) % allReviews.length])
    }
    return reviews
  }, [currentReviewIndex, allReviews])

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeOut(true)
      setTimeout(() => {
        setCurrentReviewIndex((prev) => (prev + 3) % allReviews.length)
        setFadeOut(false)
      }, 700)
    }, 4000)

    return () => clearInterval(interval)
  }, [allReviews.length])

  const stats = useMemo(
    () => [
      { value: "50K+", label: "Documents Created", icon: TrendingUp },
      { value: "99.9%", label: "Satisfaction Rate", icon: Award },
      { value: "24/7", label: "Always Available", icon: Clock },
      { value: "256-bit", label: "SSL Encrypted", icon: Shield },
    ],
    [],
  )

  const faqs = useMemo(
    () => [
      {
        question: "How quickly will I receive my documents?",
        answer:
          "All documents are delivered instantly! Once your payment is processed, you can immediately download and access your documents. No waiting, no delays.",
      },
      {
        question: "What is your refund policy?",
        answer:
          "We offer a 14-day refund policy for technical issues. If you experience any problems with your document download or access, our support team will resolve it or provide a full refund.",
      },
      {
        question: "Are my documents secure and private?",
        answer:
          "Absolutely. We use 256-bit SSL encryption for all transactions and data. Your personal information is never shared with third parties.",
      },
      {
        question: "Do you offer customer support?",
        answer:
          "Yes! Our dedicated support team is available 24/7 to assist with any questions or concerns. Reach out through our contact page for prompt assistance.",
      },
      {
        question: "What types of documents do you offer?",
        answer:
          "We provide AI-generated document templates for personal and educational use. Each purchase includes access to multiple document layouts through your account dashboard.",
      },
    ],
    [],
  )

  const toggleFaq = useCallback((index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-orange-950 to-slate-950 flex flex-col">
      <NotificationContainer notifications={notifications} removeNotification={removeNotification} />

      {/* Header */}
      <header className="bg-slate-950/80 backdrop-blur-xl px-4 sm:px-6 py-4 sm:py-5 border-b border-orange-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <Link
              href="/tempify"
              className="text-2xl sm:text-3xl font-black tracking-tight"
            >
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
                TEMPIFY
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden sm:flex gap-6 items-center" role="navigation">
              <Link
                href="/tempify/documents"
                className="text-slate-300 hover:text-orange-400 transition-colors font-medium text-sm"
              >
                Documents
              </Link>
              <Link
                href="/tempify/contact"
                className="text-slate-300 hover:text-orange-400 transition-colors font-medium text-sm"
              >
                Contact
              </Link>
              <Link href="/tempify/login">
                <Button className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold px-6 rounded-full shadow-lg shadow-orange-600/25">
                  Sign In
                </Button>
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="sm:hidden p-2 text-orange-400 hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="sm:hidden mt-6 pb-4 space-y-4" role="navigation">
              <Link href="/tempify/documents" onClick={closeMobileMenu} className="block">
                <div className="text-slate-300 hover:text-orange-400 transition-colors font-medium py-2">Documents</div>
              </Link>
              <Link href="/tempify/contact" onClick={closeMobileMenu} className="block">
                <div className="text-slate-300 hover:text-orange-400 transition-colors font-medium py-2">Contact</div>
              </Link>
              <Link href="/tempify/login" onClick={closeMobileMenu}>
                <Button className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold rounded-full">
                  Sign In
                </Button>
              </Link>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 py-16 sm:py-24 lg:py-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-600/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-600/10 rounded-full blur-[150px]"></div>
        </div>

        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        ></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-orange-300 font-medium">Instant Document Generation</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.1]">
                Documents
                <br />
                <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
                  Made Simple
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-400 max-w-lg mx-auto lg:mx-0">
                Professional documents delivered instantly. Fast, secure, and affordable.
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700/50">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-slate-300">Instant Delivery</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700/50">
                  <Lock className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-slate-300">Secure Payment</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700/50">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-slate-300">24/7 Support</span>
                </div>
              </div>

              {/* Desktop CTA Buttons */}
              <div className="hidden lg:flex gap-4">
                <Link href="/tempify/documents">
                  <Button className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white px-8 py-6 text-lg font-semibold rounded-full shadow-2xl shadow-orange-600/30 group">
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/tempify/contact">
                  <Button
                    variant="outline"
                    className="border-2 border-slate-600 text-slate-300 hover:border-orange-500 hover:text-orange-400 px-8 py-6 text-lg font-semibold rounded-full bg-transparent"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right - Form Card */}
            <div className="relative">
              {message && (
                <div className="bg-red-950/50 border border-red-500/50 p-4 rounded-xl text-red-300 mb-6 text-sm backdrop-blur-sm">
                  {message}
                </div>
              )}

              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 rounded-3xl blur-xl opacity-30"></div>
                
                <form
                  onSubmit={handleSubmit}
                  className="relative bg-slate-900/90 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-slate-700/50 shadow-2xl space-y-6"
                >
                  <div className="text-center mb-2">
                    <h2 className="text-xl font-bold text-white mb-1">Get Your Documents</h2>
                    <p className="text-slate-400 text-sm">
                      {manualMode ? "Select your vehicle details below" : "Enter your vehicle registration below"}
                    </p>
                  </div>

                  {!manualMode ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex border-2 border-slate-600 rounded-2xl overflow-hidden focus-within:border-orange-500 transition-all">
                          <div className="bg-gradient-to-b from-orange-600 to-amber-600 text-white px-4 sm:px-5 py-4 font-bold text-lg flex items-center justify-center">
                            GB
                          </div>
                          <input
                            type="text"
                            value={mainInput}
                            onChange={handleInputChange}
                            placeholder="AB12 CDE"
                            className="flex-1 py-4 px-4 text-2xl font-bold uppercase bg-slate-900 text-white border-0 outline-0 focus:ring-0 placeholder:text-slate-600"
                            required
                            autoComplete="off"
                          />
                        </div>
                      </div>

                      {notFound && (
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={enableManualMode}
                            className="text-red-500 underline font-semibold text-sm hover:text-red-400 transition-colors"
                          >
                            Choose model manually
                          </button>
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 hover:from-orange-500 hover:via-amber-500 hover:to-yellow-500 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-orange-600/25"
                      >
                        CONTINUE
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {/* Make */}
                        <div className="relative">
                          <select
                            value={selectedMake}
                            onChange={(e) => {
                              setSelectedMake(e.target.value)
                              setSelectedModel("")
                              setSelectedVariant("")
                              if (message) setMessage("")
                            }}
                            className="w-full appearance-none py-4 px-4 pr-10 text-lg font-semibold bg-slate-900 text-white border-2 border-slate-600 rounded-2xl outline-0 focus:border-orange-500 transition-all cursor-pointer"
                          >
                            <option value="">Make</option>
                            {vehicleMakes.map((make) => (
                              <option key={make.name} value={make.name}>
                                {make.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* Model */}
                        {selectedMake && (
                          <div className="relative">
                            <select
                              value={selectedModel}
                              onChange={(e) => {
                                setSelectedModel(e.target.value)
                                setSelectedVariant("")
                                if (message) setMessage("")
                              }}
                              className="w-full appearance-none py-4 px-4 pr-10 text-lg font-semibold bg-slate-900 text-white border-2 border-slate-600 rounded-2xl outline-0 focus:border-orange-500 transition-all cursor-pointer"
                            >
                              <option value="">Model</option>
                              {availableModels.map((model) => (
                                <option key={model.name} value={model.name}>
                                  {model.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        )}

                        {/* Variant */}
                        {selectedModel && (
                          <div className="relative">
                            <select
                              value={selectedVariant}
                              onChange={(e) => {
                                setSelectedVariant(e.target.value)
                                if (message) setMessage("")
                              }}
                              className="w-full appearance-none py-4 px-4 pr-10 text-lg font-semibold bg-slate-900 text-white border-2 border-slate-600 rounded-2xl outline-0 focus:border-orange-500 transition-all cursor-pointer"
                            >
                              <option value="">Variant</option>
                              {availableVariants.map((variant) => (
                                <option key={variant} value={variant}>
                                  {variant}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        )}
                      </div>

                      <Button
                        type="button"
                        onClick={handleManualContinue}
                        className="w-full bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 hover:from-orange-500 hover:via-amber-500 hover:to-yellow-500 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-orange-600/25"
                      >
                        CONTINUE
                      </Button>
                    </>
                  )}

                  <p className="text-center text-slate-500 text-xs">
                    By continuing, you agree to our Terms of Service
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 border-y border-orange-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div
                  key={index}
                  className="text-center p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50 hover:border-orange-500/30 transition-all group"
                >
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-orange-600 to-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 text-orange-400 font-semibold">
              <Star className="w-5 h-5 fill-orange-400" />
              <span>5.0 Average Rating</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
              Trusted by Thousands
            </h2>
            <p className="text-lg text-slate-500">See what our customers have to say</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {currentReviews.map((review, index) => (
              <div
                key={`${currentReviewIndex}-${index}`}
                className={`bg-slate-900/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-800/50 hover:border-orange-500/30 transition-all duration-700 ${
                  fadeOut ? "opacity-0" : "opacity-100"
                }`}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-lg leading-relaxed mb-6">{review.text}</p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center text-white font-bold">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{review.name}</div>
                    <div className="text-sm text-slate-500">{review.date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">Why Choose Tempify?</h2>
            <p className="text-lg text-slate-500">Everything you need, nothing you don't</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 p-8 sm:p-10 rounded-3xl border border-slate-800/50 hover:border-orange-500/30 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-orange-600/20">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Lightning Fast</h3>
              <p className="text-slate-400 leading-relaxed">
                Generate and download documents in seconds. No waiting, no delays - instant access.
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 p-8 sm:p-10 rounded-3xl border border-slate-800/50 hover:border-orange-500/30 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-yellow-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-amber-600/20">
                <FileCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Premium Quality</h3>
              <p className="text-slate-400 leading-relaxed">
                Professionally formatted documents with industry-standard templates.
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 p-8 sm:p-10 rounded-3xl border border-slate-800/50 hover:border-orange-500/30 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-600 to-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-yellow-600/20">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Secure & Private</h3>
              <p className="text-slate-400 leading-relaxed">
                256-bit encryption protects your data. We never share your information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 rounded-3xl blur-xl opacity-40"></div>
            <div className="relative bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 p-10 sm:p-16 rounded-3xl overflow-hidden">
              {/* Pattern Overlay */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `radial-gradient(circle at 20px 20px, white 2px, transparent 0)`,
                  backgroundSize: '40px 40px'
                }}
              ></div>

              <div className="relative z-10 text-center space-y-6">
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
                  Ready to Get Started?
                </h3>
                <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
                  Join thousands of satisfied customers generating professional documents instantly.
                </p>
                <Link href="/tempify/documents">
                  <Button className="bg-white text-orange-600 hover:bg-slate-100 px-8 py-6 text-lg font-bold rounded-full shadow-2xl group">
                    Start Now
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">Common Questions</h2>
            <p className="text-lg text-slate-500">Everything you need to know</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden hover:border-orange-500/30 transition-all"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 sm:px-8 py-6 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
                >
                  <span className="font-bold text-white text-lg pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-6 h-6 text-orange-400 flex-shrink-0 transition-transform ${openFaqIndex === index ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaqIndex === index && (
                  <div className="px-6 sm:px-8 py-6 bg-slate-900/50 border-t border-slate-800/50">
                    <p className="text-slate-400 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/50 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-xl sm:text-2xl font-black">
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
                TEMPIFY
              </span>
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
              <a
                href="/tempify/privacy-policy"
                className="text-slate-500 hover:text-orange-400 text-sm transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/tempify/terms-of-service"
                className="text-slate-500 hover:text-orange-400 text-sm transition-colors"
              >
                Terms of Service
              </a>
              <a href="/tempify/return-policy" className="text-slate-500 hover:text-orange-400 text-sm transition-colors">
                Return Policy
              </a>
            </div>
            <p className="text-slate-600 text-sm">&copy; 2025 Tempify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
