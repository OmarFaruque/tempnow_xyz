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
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationContainer } from "@/components/notification"
import { checkBlacklist } from "@/lib/blacklist"

export default function CoveriseHomepage() {
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
            `Your access has been restricted. Reason: ${blacklistCheck.reason}. Please contact support@coverise.co.uk for assistance.`,
          )
          return
        }

        // Redirect immediately after blacklist check passes
        window.location.href = `/coverise/get-quote?registration=${encodeURIComponent(cleanReg)}`
      } catch (error) {
        console.error("Failed to check blacklist:", error)
        // Redirect even if blacklist check fails
        window.location.href = `/coverise/get-quote?registration=${encodeURIComponent(cleanReg)}`
      }
    },
    [mainInput, showError],
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
        text: "Needed documents fast and Coverise delivered instantly. Professional quality, downloaded in seconds!",
        date: "2 days ago",
      },
      {
        name: "Michael Chen",
        rating: 5,
        text: "The document quality looked exactly like how I wanted. Super affordable and instant download. Perfect!",
        date: "1 week ago",
      },
      {
        name: "Emma Thompson",
        rating: 5,
        text: "Brilliant service! Got all the vehicle documents I needed. Fast, secure, and hassle-free.",
        date: "2 weeks ago",
      },
      {
        name: "David Martinez",
        rating: 5,
        text: "Best document service online. Ordered a document at midnight and had it instantly. Amazing quality!",
        date: "3 days ago",
      },
      {
        name: "Sophie Williams",
        rating: 5,
        text: "Incredible! The documents are professionally formatted and look amazing. Saved me so much time.",
        date: "5 days ago",
      },
      {
        name: "James Anderson",
        rating: 5,
        text: "Used Coverise for some work documents. Lightning fast delivery, perfect quality. Will definitely use again!",
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
      { value: "10,000+", label: "Documents", icon: TrendingUp },
      { value: "99%", label: "Customer Satisfaction", icon: Award },
      { value: "24/7", label: "Support Available", icon: Clock },
      { value: "256-bit", label: "SSL Encryption", icon: Shield },
    ],
    [],
  )

  const faqs = useMemo(
    () => [
      {
        question: "How quickly will I receive my documents?",
        answer:
          "All documents are delivered instantly! Once your payment is processed, you can immediately view your documents. No waiting, no delays - get your docs in seconds.",
      },
      {
        question: "What is your refund policy?",
        answer:
          "We offer refunds within 14 days of purchase only if you experience technical issues with your document. If you encounter a technical problem, please contact our support team and we will resolve it promptly or issue a full refund.",
      },
      {
        question: "Are the documents secure and private?",
        answer:
          "We use 256-bit SSL encryption to protect all transactions and personal data. Your information is secure, and we never share your details with third parties.",
      },
      {
        question: "Do you offer customer support?",
        answer:
          "Yes! Our support team is available 24/7 to help with any questions or issues. You can reach us through our contact page.",
      },
      {
        question: "What types of documents do you offer?",
        answer:
          "We provide AI-generated cover-note style templates for personal and educational use. Each purchase gives you access to three different example document layouts inside your account. These templates are for reference only and are not official insurance documents or proof of cover.",
      },
    ],
    [],
  )

  const toggleFaq = useCallback((index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index))
  }, [])

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <NotificationContainer notifications={notifications} removeNotification={removeNotification} />

      <header className="bg-black/95 backdrop-blur-sm px-4 sm:px-6 py-4 sm:py-5 border-b border-cyan-900/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <Link
              href="/coverise"
              className="text-2xl sm:text-3xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent hover:scale-105 transition-transform"
            >
              COVERISE
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden sm:flex gap-6 items-center" role="navigation">
              <Link
                href="/coverise/documents"
                className="text-gray-300 hover:text-cyan-400 transition-colors font-medium text-sm"
              >
                Documents
              </Link>
              <Link
                href="/coverise/contact"
                className="text-gray-300 hover:text-cyan-400 transition-colors font-medium text-sm"
              >
                Contact
              </Link>
              <Link href="/coverise/login">
                <Button className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-6 rounded-full shadow-lg shadow-cyan-600/20">
                  Sign In
                </Button>
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="sm:hidden p-2 text-cyan-400 hover:bg-gray-900 rounded-lg transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="sm:hidden mt-6 pb-4 space-y-4" role="navigation">
              <Link href="/coverise/documents" onClick={closeMobileMenu} className="block">
                <div className="text-gray-300 hover:text-cyan-400 transition-colors font-medium py-2">Documents</div>
              </Link>
              <Link href="/coverise/contact" onClick={closeMobileMenu} className="block">
                <div className="text-gray-300 hover:text-cyan-400 transition-colors font-medium py-2">Contact</div>
              </Link>
              <Link href="/coverise/login" onClick={closeMobileMenu}>
                <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-full">
                  Sign In
                </Button>
              </Link>
            </nav>
          )}
        </div>
      </header>

      <section className="relative px-4 sm:px-6 py-12 sm:py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-black to-cyan-950/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-950/50 border border-cyan-800/50 rounded-full">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-cyan-400 font-medium">Instant Docs</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight">
                Fast, Reliable &
                <br />
                <span className="bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">
                  Affordable
                </span>
                <br />
                Services
              </h1>

              <p className="text-lg sm:text-xl text-gray-300 mb-8 text-center lg:text-left">Let's get started</p>

              <div className="hidden lg:flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/coverise/documents">
                  <Button className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-6 text-lg font-semibold rounded-full shadow-2xl shadow-cyan-600/30 group">
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/coverise/contact">
                  <Button
                    variant="outline"
                    className="border-2 border-gray-700 text-gray-300 hover:border-cyan-600 hover:text-cyan-400 px-8 py-6 text-lg font-semibold rounded-full bg-transparent"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative w-full">
              {message && (
                <div className="bg-red-950/50 border border-red-800 p-4 rounded-lg text-red-400 mb-6 text-sm sm:text-base">
                  {message}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="bg-gradient-to-br from-gray-900 to-gray-950 p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border-2 border-gray-800 shadow-2xl space-y-4 sm:space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-gray-400 text-sm sm:text-base font-medium">Enter Details Below</label>
                  <div className="flex border-2 border-gray-700 rounded-xl sm:rounded-2xl overflow-hidden focus-within:border-cyan-600 transition-colors">
                    <div className="bg-cyan-600 text-white px-3 sm:px-4 lg:px-5 py-3 sm:py-4 font-bold text-base sm:text-lg flex items-center justify-center">
                      GB
                    </div>
                    <input
                      type="text"
                      value={mainInput}
                      onChange={handleInputChange}
                      placeholder="AB12 CDE"
                      className="flex-1 py-3 sm:py-4 px-3 sm:px-4 text-xl sm:text-2xl font-bold uppercase bg-black text-white border-0 outline-0 focus:ring-0 placeholder:text-gray-700"
                      required
                      autoComplete="off"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-lg shadow-cyan-600/30"
                >
                  SUBMIT
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-gray-950 to-black py-12 sm:py-16 lg:py-24 border-y border-cyan-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div
                  key={index}
                  className="bg-gradient-to-br from-gray-900 to-gray-950 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-800 hover:border-cyan-600 transition-all hover:-translate-y-1 group"
                >
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 mb-3 sm:mb-4 group-hover:scale-110 transition-transform" />
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-1 sm:mb-2">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 font-medium">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-black py-12 sm:py-20 lg:py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 text-cyan-400 font-semibold mb-2">
              <Star className="w-5 h-5 fill-cyan-400" />
              <span>5.0 Rating</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white">What People Say</h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-500">Join thousands of satisfied customers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {currentReviews.map((review, index) => (
              <div
                key={`${currentReviewIndex}-${index}`}
                className={`bg-gradient-to-br from-gray-900 to-gray-950 p-8 rounded-3xl border border-gray-800 hover:border-cyan-600 transition-all duration-700 hover:-translate-y-2 ${
                  fadeOut ? "opacity-0" : "opacity-100"
                }`}
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-lg leading-relaxed mb-6">{review.text}</p>
                <div className="flex items-center gap-3 pt-6 border-t border-gray-800">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600 to-cyan-800 flex items-center justify-center text-white font-bold text-lg">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{review.name}</div>
                    <div className="text-sm text-gray-600">{review.date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-black to-gray-950 py-12 sm:py-20 lg:py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white">Why Coverise?</h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-500">Everything you need, nothing you don't</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-cyan-950/30 to-gray-950 p-10 rounded-3xl border border-cyan-900/30 hover:border-cyan-600 transition-all hover:-translate-y-1 group">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Lightning Fast</h3>
              <p className="text-gray-400 leading-relaxed">
                Generate documents in seconds, not hours. Instant delivery to your inbox.
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-950/30 to-gray-950 p-10 rounded-3xl border border-cyan-900/30 hover:border-cyan-600 transition-all hover:-translate-y-1 group">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Professional Quality</h3>
              <p className="text-gray-400 leading-relaxed">
                Industry-standard templates that look polished and professional every time.
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-950/30 to-gray-950 p-10 rounded-3xl border border-cyan-900/30 hover:border-cyan-600 transition-all hover:-translate-y-1 group">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Secure & Private</h3>
              <p className="text-gray-400 leading-relaxed">
                256-bit encryption protects your data. We never share your information.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-black py-12 sm:py-20 lg:py-32 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 p-8 sm:p-12 lg:p-16 rounded-2xl sm:rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.05]"></div>

            <div className="relative z-10 max-w-2xl text-center sm:text-left mx-auto sm:mx-0">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-6">
                Ready to get started?
              </h3>
              <p className="text-base sm:text-lg lg:text-xl text-cyan-50 mb-6 sm:mb-8">
                Join thousands of users generating professional documents instantly.
              </p>
              <Link href="/ai-documents">
                <Button className="bg-white text-cyan-600 hover:bg-gray-100 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-bold rounded-full shadow-lg group">
                  Get Started Now
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-black to-gray-950 py-20 sm:py-32 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl sm:text-5xl font-black text-white">Common Questions</h2>
            <p className="text-xl text-gray-500">Everything you need to know</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden hover:border-cyan-600 transition-all"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-gray-900 transition-colors"
                >
                  <span className="font-bold text-white text-lg pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-6 h-6 text-cyan-400 flex-shrink-0 transition-transform ${openFaqIndex === index ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaqIndex === index && (
                  <div className="px-8 py-6 bg-black/50 border-t border-gray-800">
                    <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-black border-t border-gray-900 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">
              COVERISE
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
              <a
                href="/coverise/privacy-policy"
                className="text-gray-500 hover:text-cyan-400 text-sm transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/coverise/terms-of-service"
                className="text-gray-500 hover:text-cyan-400 text-sm transition-colors"
              >
                Terms of Service
              </a>
              <a href="/coverise/return-policy" className="text-gray-500 hover:text-cyan-400 text-sm transition-colors">
                Return Policy
              </a>
            </div>
            <p className="text-gray-600 text-sm">&copy; 2025 Coverise. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
