"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { vehicleMakes } from "@/lib/vehicle-makes"
import {
  Menu,
  X,
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
  Search,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationContainer } from "@/components/notification"
import { checkBlacklist } from "@/lib/blacklist"

export default function GosureHomepage() {
  const [message, setMessage] = useState("")
  const [mainInput, setMainInput] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
            `Your access has been restricted. Reason: ${blacklistCheck.reason}. Please contact support@gosure.io for assistance.`,
          )
          return
        }

        if (cleanReg !== "LX61JYE") {
          setNotFound(true)
          showError("Vehicle Not Found", "Vehicle registration not found. Please check and try again.")
          return
        }

        window.location.href = `/gosure/get-quote?registration=${encodeURIComponent(cleanReg)}`
      } catch (error) {
        console.error("Failed to check blacklist:", error)
        if (cleanReg !== "LX61JYE") {
          setNotFound(true)
          showError("Vehicle Not Found", "Vehicle registration not found. Please check and try again.")
          return
        }
        window.location.href = `/gosure/get-quote?registration=${encodeURIComponent(cleanReg)}`
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
    window.location.href = `/gosure/get-quote?${params.toString()}`
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

  const stats = useMemo(
    () => [
      { value: "50K+", label: "Documents Created", icon: TrendingUp },
      { value: "99.9%", label: "Satisfaction Rate", icon: Award },
      { value: "24/7", label: "Always Available", icon: Clock },
      { value: "256-bit", label: "SSL Encrypted", icon: Shield },
    ],
    [],
  )

  const steps = useMemo(
    () => [
      {
        icon: Search,
        title: "Enter your registration",
        description: "Type in your vehicle registration and we'll instantly locate the right documents.",
      },
      {
        icon: FileCheck,
        title: "Choose your documents",
        description: "Select from professionally formatted templates tailored to your vehicle.",
      },
      {
        icon: Download,
        title: "Download instantly",
        description: "Complete secure checkout and download your documents in seconds.",
      },
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
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <NotificationContainer notifications={notifications} removeNotification={removeNotification} />

      {/* Header */}
      <header className="bg-slate-950/80 backdrop-blur-xl px-4 sm:px-6 py-4 sm:py-5 border-b border-yellow-500/15 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            <Link href="/gosure" className="flex items-center gap-2.5 group">
              <Image
                src="/images/gosure-shield-cropped.png"
                alt="gosure.io shield logo"
                width={40}
                height={40}
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain group-hover:scale-105 transition-transform"
                priority
              />
              <span className="text-2xl sm:text-3xl font-black tracking-tight">
                <span className="text-white">gosure</span>
                <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">.io</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden sm:flex gap-8 items-center" role="navigation">
              <Link
                href="/gosure/documents"
                className="text-slate-300 hover:text-yellow-400 transition-colors font-medium text-sm"
              >
                Documents
              </Link>
              <Link
                href="/gosure/contact"
                className="text-slate-300 hover:text-yellow-400 transition-colors font-medium text-sm"
              >
                Contact
              </Link>
              <Link href="/gosure/login">
                <Button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-slate-950 font-semibold px-6 rounded-full shadow-lg shadow-yellow-600/25">
                  Sign In
                </Button>
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="sm:hidden p-2 text-yellow-400 hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="sm:hidden mt-6 pb-4 space-y-4" role="navigation">
              <Link href="/gosure/documents" onClick={closeMobileMenu} className="block">
                <div className="text-slate-300 hover:text-yellow-400 transition-colors font-medium py-2">Documents</div>
              </Link>
              <Link href="/gosure/contact" onClick={closeMobileMenu} className="block">
                <div className="text-slate-300 hover:text-yellow-400 transition-colors font-medium py-2">Contact</div>
              </Link>
              <Link href="/gosure/login" onClick={closeMobileMenu}>
                <Button className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-slate-950 font-semibold rounded-full">
                  Sign In
                </Button>
              </Link>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section - centered emblem layout */}
      <section className="relative px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-16 overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-yellow-600/15 rounded-full blur-[140px]"></div>
        </div>
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(212, 175, 55, 0.5) 1px, transparent 0)`,
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 40%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 40%, transparent 100%)",
          }}
        ></div>

        <div className="max-w-3xl mx-auto relative z-10 flex flex-col items-center text-center space-y-7">
          {/* Shield emblem */}
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-500/30 blur-3xl rounded-full scale-125"></div>
            <Image
              src="/images/gosure-shield-cropped.png"
              alt="gosure.io verified shield"
              width={220}
              height={220}
              className="relative w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-2xl"
              priority
            />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-yellow-300 font-medium">Instant, verified document generation</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight text-balance">
            Fast, reliable{" "}
            <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">
              documents
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-xl text-pretty">Let&apos;s get started</p>

          {/* Inline search-bar lookup */}
          <div className="w-full max-w-xl pt-2">
            {message && (
              <div className="bg-red-950/50 border border-red-500/50 p-3 rounded-xl text-red-300 mb-4 text-sm backdrop-blur-sm">
                {message}
              </div>
            )}

            {!manualMode ? (
              <>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="flex flex-1 border-2 border-slate-700 rounded-2xl overflow-hidden bg-slate-900/80 backdrop-blur-sm focus-within:border-yellow-500 transition-all shadow-xl">
                  <input
                    type="text"
                    value={mainInput}
                    onChange={handleInputChange}
                    placeholder="ENTER HERE"
                    className="flex-1 py-4 px-4 text-xl sm:text-2xl font-bold uppercase bg-transparent text-white border-0 outline-0 focus:ring-0 placeholder:text-slate-600 text-center"
                    required
                    autoComplete="off"
                    aria-label="Vehicle registration"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-slate-950 py-5 rounded-2xl font-bold text-lg shadow-xl shadow-yellow-600/25"
                >
                  <Search className="w-5 h-5 mr-2" />
                  LOOKUP
                </Button>
              </form>
              <p className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400">
                <Zap className="w-4 h-4 text-yellow-400" />
                Instant delivery, no delays
              </p>
              </>
            ) : (
              <div className="bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/60 shadow-xl space-y-4 text-left">
                <p className="text-slate-400 text-sm text-center">Select your vehicle details below</p>
                <div className="relative">
                  <select
                    value={selectedMake}
                    onChange={(e) => {
                      setSelectedMake(e.target.value)
                      setSelectedModel("")
                      setSelectedVariant("")
                      if (message) setMessage("")
                    }}
                    className="w-full appearance-none py-4 px-4 pr-10 text-lg font-semibold bg-slate-950 text-white border-2 border-slate-700 rounded-2xl outline-0 focus:border-yellow-500 transition-all cursor-pointer"
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

                {selectedMake && (
                  <div className="relative">
                    <select
                      value={selectedModel}
                      onChange={(e) => {
                        setSelectedModel(e.target.value)
                        setSelectedVariant("")
                        if (message) setMessage("")
                      }}
                      className="w-full appearance-none py-4 px-4 pr-10 text-lg font-semibold bg-slate-950 text-white border-2 border-slate-700 rounded-2xl outline-0 focus:border-yellow-500 transition-all cursor-pointer"
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

                {selectedModel && (
                  <div className="relative">
                    <select
                      value={selectedVariant}
                      onChange={(e) => {
                        setSelectedVariant(e.target.value)
                        if (message) setMessage("")
                      }}
                      className="w-full appearance-none py-4 px-4 pr-10 text-lg font-semibold bg-slate-950 text-white border-2 border-slate-700 rounded-2xl outline-0 focus:border-yellow-500 transition-all cursor-pointer"
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

                <Button
                  type="button"
                  onClick={handleManualContinue}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-slate-950 py-5 rounded-2xl font-bold text-lg shadow-xl shadow-yellow-600/25"
                >
                  CONTINUE
                </Button>
              </div>
            )}

            {notFound && !manualMode && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={enableManualMode}
                  className="text-yellow-400 underline font-semibold text-sm hover:text-yellow-300 transition-colors"
                >
                  Can't find it? Choose your model manually
                </button>
              </div>
            )}
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 pt-2 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-yellow-400" />
              Instant delivery
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-yellow-400" />
              Secure payment
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              24/7 support
            </div>
          </div>
        </div>
      </section>

      {/* Stats band - horizontal divided */}
      <section className="px-4 sm:px-6 py-8">
        <div className="max-w-5xl mx-auto rounded-3xl border border-yellow-500/15 bg-slate-900/40 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="flex-1 flex items-center justify-center gap-3 px-6 py-6">
                  <Icon className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-2xl sm:text-3xl font-black text-white leading-none">{stat.value}</div>
                    <div className="text-xs text-slate-500 font-medium mt-1">{stat.label}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works - numbered steps */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-14 space-y-4">
            <span className="text-yellow-400 font-semibold text-sm uppercase tracking-widest">How it works</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white text-balance">
              Three steps to your documents
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={index}
                  className="relative bg-slate-900/50 border border-slate-800/60 rounded-3xl p-8 hover:border-yellow-500/30 transition-all group"
                >
                  <span className="absolute top-6 right-8 text-6xl font-black text-slate-800/70 group-hover:text-yellow-500/20 transition-colors select-none">
                    {index + 1}
                  </span>
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-yellow-600/20">
                    <Icon className="w-7 h-7 text-slate-950" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 relative z-10">{step.title}</h3>
                  <p className="text-slate-400 leading-relaxed relative z-10">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features - asymmetric bento */}
      <section className="py-8 sm:py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-5">
            {/* Feature large */}
            <div className="md:row-span-2 relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 border border-yellow-500/20 rounded-3xl p-8 sm:p-10 flex flex-col justify-between min-h-[340px]">
              <div className="absolute -top-10 -right-10 w-56 h-56 bg-yellow-600/10 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-yellow-600/20">
                  <Shield className="w-8 h-8 text-slate-950" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white mb-4">Secure &amp; Private</h3>
                <p className="text-slate-400 leading-relaxed max-w-md">
                  Every transaction is protected with bank-grade 256-bit SSL encryption. Your personal information is
                  never stored longer than needed and never shared with third parties.
                </p>
              </div>
              <div className="relative z-10 flex items-center gap-2 text-yellow-400 font-semibold text-sm mt-8">
                <Lock className="w-4 h-4" />
                Bank-grade encryption
              </div>
            </div>

            {/* Feature small 1 */}
            <div className="bg-slate-900/50 border border-slate-800/60 rounded-3xl p-8 hover:border-yellow-500/30 transition-all group">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-yellow-600/20">
                <Zap className="w-7 h-7 text-slate-950" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Lightning Fast</h3>
              <p className="text-slate-400 leading-relaxed">
                Generate and download documents in seconds. No waiting, no delays — instant access every time.
              </p>
            </div>

            {/* Feature small 2 */}
            <div className="bg-slate-900/50 border border-slate-800/60 rounded-3xl p-8 hover:border-yellow-500/30 transition-all group">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-yellow-600/20">
                <FileCheck className="w-7 h-7 text-slate-950" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Premium Quality</h3>
              <p className="text-slate-400 leading-relaxed">
                Professionally formatted documents built on industry-standard templates you can rely on.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - gold outline panel */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-yellow-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-yellow-950/40 p-10 sm:p-16 text-center">
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-yellow-600/15 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-center space-y-6">
              <Image
                src="/images/gosure-shield-cropped.png"
                alt="gosure.io shield"
                width={72}
                height={72}
                className="w-14 h-14 object-contain"
              />
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white text-balance">
                Ready to get started?
              </h3>
              <p className="text-lg sm:text-xl text-slate-400 max-w-2xl">
                Join thousands generating professional, verified documents instantly.
              </p>
              <Link href="/gosure/documents">
                <Button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-slate-950 px-8 py-6 text-lg font-bold rounded-full shadow-2xl shadow-yellow-600/30 group">
                  Browse documents
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ - two column editorial */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start space-y-4">
            <span className="text-yellow-400 font-semibold text-sm uppercase tracking-widest">FAQ</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white text-balance">Common questions</h2>
            <p className="text-lg text-slate-500">
              Everything you need to know before you get started. Still stuck?{" "}
              <Link href="/gosure/contact" className="text-yellow-400 hover:text-yellow-300 underline">
                Contact our team
              </Link>
              .
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-slate-900/50 border border-slate-800/60 rounded-2xl overflow-hidden hover:border-yellow-500/30 transition-all"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 sm:px-8 py-6 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
                >
                  <span className="font-bold text-white text-lg pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-6 h-6 text-yellow-400 flex-shrink-0 transition-transform ${openFaqIndex === index ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaqIndex === index && (
                  <div className="px-6 sm:px-8 py-6 bg-slate-950/50 border-t border-slate-800/60">
                    <p className="text-slate-400 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/50 py-8 px-4 sm:px-6 mt-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2.5">
              <Image
                src="/images/gosure-shield-cropped.png"
                alt="gosure.io shield logo"
                width={36}
                height={36}
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
              />
              <h3 className="text-xl sm:text-2xl font-black">
                <span className="text-white">gosure</span>
                <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">.io</span>
              </h3>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
              <a
                href="/gosure/privacy-policy"
                className="text-slate-500 hover:text-yellow-400 text-sm transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/gosure/terms-of-service"
                className="text-slate-500 hover:text-yellow-400 text-sm transition-colors"
              >
                Terms of Service
              </a>
              <a href="/gosure/return-policy" className="text-slate-500 hover:text-yellow-400 text-sm transition-colors">
                Return Policy
              </a>
            </div>
            <p className="text-slate-600 text-sm">&copy; 2025 Gosure. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
