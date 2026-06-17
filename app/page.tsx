"use client"

import type React from "react"
import { useState, useCallback, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Check,
  Star,
  Shield,
  Clock,
  TrendingUp,
  Award,
  ChevronDown,
  Zap,
  FileCheck,
  Download,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationContainer } from "@/components/notification"
import { checkBlacklist } from "@/lib/blacklist"
import Image from "next/image"
import { useAuth } from "@/context/auth"
import { useSettings } from "@/context/settings"
import { Header } from "@/components/header"

export default function MonzicHomepage() {
  const [message, setMessage] = useState("")
  const [mainInput, setMainInput] = useState("")
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const router = useRouter()
  const { notifications, removeNotification, showError } = useNotifications()
  const { isAuthenticated } = useAuth()
  const settings = useSettings()
  const [loading, setLoading] = useState(false)

  const formatRegistration = useCallback((value: string) => {
    let formatted = value.toUpperCase()
    if (formatted.length > 7) {
      formatted = formatted.substring(0, 7)
    }
    return formatted
  }, [])

  const handleMainFormSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      if (!mainInput.trim()) {
        setMessage("Please enter a vehicle registration number.")
        setLoading(false)
        return
      }

      const cleanReg = mainInput.replace(/\s+/g, "").toUpperCase()

      // Check blacklist first
      try {
        const response = await fetch("/api/get-client-ip")
        const { ip } = await response.json()

        const blacklistCheck = checkBlacklist(undefined, undefined, undefined, ip)
        if (blacklistCheck.isBlacklisted) {
          showError(
            "Access Restricted",
            `Your access has been restricted. Reason: ${blacklistCheck.reason}. Please contact support@monzic.co.uk for assistance.`,
          )
          setLoading(false)
          return
        }
      } catch (error) {
        console.error("Failed to check blacklist:", error)
      }

      try {
        const vehicleResponse = await fetch("/api/check-vehicle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registration: cleanReg }),
        })

        if (!vehicleResponse.ok) {
          let errorData = { message: "Vehicle registration not found. Please check and try again." }
          try {
            errorData = await vehicleResponse.json()
          } catch (e) {
            // Ignore JSON parsing error if the response body is empty
          }
          setLoading(false)
          showError("Vehicle Not Found", errorData.message || "Vehicle registration not found. Please check and try again.")
          return
        }

        // If the vehicle is found and valid, proceed to the next page.
        router.push(`/get-quote?reg=${encodeURIComponent(cleanReg)}`)
      } catch (error) {
        console.error("Vehicle check failed:", error)
        setLoading(false)
        showError("Service Unavailable", "Could not verify vehicle registration at this time. Please try again later.")
      }
    },
    [mainInput, router, showError],
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

  const features = useMemo(
    () => [
      "Wide selection of professional documents",
      "Affordable pricing for every need",
      "Instant download after purchase",
    ],
    [],
  )

  const allReviews = useMemo(
    () => [
      {
        name: "Sarah Johnson",
        rating: 5,
        text: "Needed documents fast and TEMPNOW delivered instantly. Professional quality, downloaded in seconds!",
        date: "2 days ago",
      },
      {
        name: "Michael Chen",
        rating: 5,
        text: "The sickness certificate document looked exactly like how I wanted. Super affordable and instant download. Perfect!",
        date: "1 week ago",
      },
      {
        name: "Emma Thompson",
        rating: 5,
        text: "Brilliant service! Got all the vehicle documents I needed for my portfolio. Fast, secure, and hassle-free.",
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
        text: "Incredible! The documents are professionally formatted and look amazing. Saved me so much time and money.",
        date: "5 days ago",
      },
      {
        name: "James Anderson",
        rating: 5,
        text: "Used TEMPNOW for some work documents. Lightning fast delivery, perfect quality. Will definitely use again!",
        date: "1 week ago",
      },
      {
        name: "Olivia Brown",
        rating: 5,
        text: "Needed temporary docs urgently and TEMPNOW came through. Instant, affordable, and professional!",
        date: "4 days ago",
      },
      {
        name: "Ryan Taylor",
        rating: 5,
        text: "Outstanding document quality! Got my docs in seconds. This service is a game-changer!",
        date: "6 days ago",
      },
      {
        name: "Charlotte Davis",
        rating: 5,
        text: "Absolutely perfect! The documents are high quality and delivered instantly. Exactly what I needed for my project.",
        date: "1 week ago",
      },
      {
        name: "Daniel Wilson",
        rating: 5,
        text: "Fast, reliable, and professional. Got all my documents sorted in minutes. Highly recommend TEMPNOW!",
        date: "3 days ago",
      },
      {
        name: "Lucy Harris",
        rating: 5,
        text: "The AI document generation is incredible. Professional templates and instant delivery. Worth every penny!",
        date: "2 weeks ago",
      },
      {
        name: "Benjamin Clark",
        rating: 5,
        text: "Needed AI Docs and TEMPNOW delivered immediately. Top quality documents at great prices!",
        date: "5 days ago",
      },
      {
        name: "Amelia Lewis",
        rating: 5,
        text: "Fantastic service! The documents look completely professional and authentic. Download was instant!",
        date: "1 week ago",
      },
      {
        name: "Thomas Walker",
        rating: 5,
        text: "Best £10 I've spent! Got my document instantly. Professional quality and super easy to use.",
        date: "4 days ago",
      },
      {
        name: "Grace Robinson",
        rating: 5,
        text: "TEMPNOW is brilliant! Ordered multiple documents and all were perfect. Fast, secure, and affordable.",
        date: "6 days ago",
      },
      {
        name: "Oliver Scott",
        rating: 5,
        text: "Amazing document service! Got everything I needed in seconds. The quality is outstanding and totally legit looking!",
        date: "2 days ago",
      },
      {
        name: "Isabella Green",
        rating: 5,
        text: "Incredible turnaround time! Ordered vehicle documents late at night and downloaded them immediately. Perfect!",
        date: "1 week ago",
      },
      {
        name: "Harry Turner",
        rating: 5,
        text: "Professional, fast, and affordable. The documents are high quality and look exactly as they should. 5 stars!",
        date: "3 days ago",
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
        question: "What types of documents do you offer?",
        answer:
          "We offer a wide range of professional documents that are built to your personalised needs. All documents are professionally formatted and available for instant download.",
      },
      {
        question: "How quickly will I receive my documents?",
        answer:
          "All documents are delivered instantly! Once your payment is processed, you can immediately view your documents. No waiting, no delays - get your docs in seconds.",
      },
      {
        question: "What is your refund policy?",
        answer:
          "We offer refunds within 14 days of purchase only if you experience technical issues with your document (such as download failures, corrupted files, or system errors). Refunds are not provided for change of mind or general dissatisfaction. If you encounter a technical problem, please contact our support team and we will resolve it promptly or issue a full refund.",
      },
      {
        question: "Are the documents secure and private?",
        answer:
          "We use 256-bit SSL encryption to protect all transactions and personal data. Your information is so secure, and we never share your details with third parties. All downloads are private and confidential.",
      },
      {
        question: "Can I edit the documents after purchase?",
        answer:
          "Unfortunately we do not offer an editing document service, as once a purchase is made, it is final. However, if you've made a mistake in the details provided and would like to ammend it, in some cases we may be able to fix it for you.",
      },
      {
        question: "Do you offer customer support?",
        answer:
          "Yes! Our support team is available 24/7 to help with any questions or issues. You can reach us through our contact page and we'll respond promptly to assist you.",
      },
    ],
    [],
  )

  const toggleFaq = useCallback((index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-teal-700">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <section className="bg-gradient-to-br from-teal-600 to-teal-700 text-white px-4 sm:px-6 py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          {/* Animated wave pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="wave-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                <path d="M 0 100 Q 50 50, 100 100 T 200 100" stroke="white" strokeWidth="1" fill="none" opacity="0.5" />
                <path
                  d="M 0 150 Q 50 100, 100 150 T 200 150"
                  stroke="white"
                  strokeWidth="1"
                  fill="none"
                  opacity="0.3"
                />
                <circle cx="50" cy="50" r="2" fill="white" opacity="0.6" />
                <circle cx="150" cy="150" r="2" fill="white" opacity="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#wave-pattern)" />
          </svg>

          {/* Hexagon grid pattern */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255,255,255,0.4) 2%, transparent 0%),
                               radial-gradient(circle at 75px 75px, rgba(255,255,255,0.4) 2%, transparent 0%)`,
              backgroundSize: "100px 100px",
            }}
          />

          {/* Elegant corner accents */}
          <div className="absolute top-0 right-0 w-64 h-64">
            <div className="absolute top-8 right-8 w-32 h-32 border-4 border-white rounded-full opacity-30"></div>
            <div className="absolute top-16 right-16 w-20 h-20 border-2 border-teal-200 rounded-full opacity-40"></div>
          </div>
          <div className="absolute bottom-0 left-0 w-64 h-64">
            <div className="absolute bottom-8 left-8 w-32 h-32 border-4 border-teal-200 rounded-full opacity-30"></div>
            <div className="absolute bottom-16 left-16 w-20 h-20 border-2 border-white rounded-full opacity-40"></div>
          </div>

          {/* Soft gradient orbs for depth */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl opacity-10"></div>
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-teal-400 rounded-full blur-3xl opacity-10"></div>

          {/* Diagonal accent lines */}
          <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-20"></div>
          <div className="absolute bottom-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-20"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
            <div className="flex justify-center mb-4 sm:mb-6">
              <Image
                src={settings?.general?.logo || "/images/design-mode/tempnow2.png"}
                alt={`${settings?.general?.siteName || "TEMPNOW.uk"} Logo`}
                width={400}
                height={120}
                className="w-64 sm:w-80 lg:w-96 h-auto"
                priority
              />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-balance leading-tight">
              {"Affordable, Lightning-Fast Delivery"}
            </h1>
            <p className="text-lg sm:text-xl text-teal-50 text-balance max-w-2xl mx-auto leading-relaxed">
              {"Let's get started below"}
            </p>

            {/* Message Display */}
            {message && (
              <div className="bg-teal-700 p-4 rounded-lg border border-teal-500 text-white shadow-sm text-sm sm:text-base mx-2">
                {message}
              </div>
            )}

            <form
              onSubmit={handleMainFormSubmit}
              className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl space-y-4 max-w-lg mx-auto"
            >
              <div className="flex border-2 border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-teal-600 text-white px-3 sm:px-4 py-3 sm:py-4 font-bold text-base sm:text-lg flex items-center justify-center">
                  GB
                </div>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={mainInput}
                    onChange={handleInputChange}
                    placeholder="ENTER HERE"
                    className="w-full h-full py-3 sm:py-4 px-3 sm:px-4 text-center text-xl sm:text-2xl font-bold uppercase bg-white text-gray-900 border-0 outline-0 focus:ring-0 placeholder:text-gray-400"
                    style={{
                      border: "none",
                      outline: "none",
                      boxShadow: "none",
                      fontSize: "clamp(1.25rem, 4vw, 2rem)",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                    required
                    autoComplete="off"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 sm:py-4 rounded-md font-semibold text-base sm:text-lg shadow-lg"
              >
                {"LOOKUP"}
              </Button>
            </form>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-white via-gray-50 to-white py-12 sm:py-16 border-t border-gray-200 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/3 w-80 h-80 bg-teal-100 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-teal-200 rounded-full blur-3xl opacity-20"></div>
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgb(20 184 166) 1px, transparent 0)`,
              backgroundSize: "48px 48px",
            }}
          ></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center space-y-3 group cursor-default">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-teal-600 to-teal-800 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm sm:text-base text-gray-600 font-medium">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-gray-50 via-teal-50/20 to-gray-50 py-12 sm:py-20 px-4 sm:px-6 border-t border-gray-200 relative overflow-hidden">
        <div className="absolute inset-0">
          {/* Multiple blur orbs for depth */}
          <div className="absolute top-10 right-10 w-72 h-72 bg-teal-200 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-teal-300 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute top-20 left-1/3 w-96 h-96 bg-teal-200 rounded-full blur-3xl opacity-25"></div>
          <div className="absolute bottom-20 right-1/3 w-96 h-96 bg-teal-100 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-200 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-teal-300 rounded-full blur-3xl opacity-20"></div>

          {/* Subtle grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgb(20 184 166) 1px, transparent 0)`,
              backgroundSize: "48px 48px",
            }}
          ></div>

          {/* Gradient accent lines */}
          <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent opacity-40"></div>
          <div className="absolute bottom-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-300 to-transparent opacity-40"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-16 space-y-3">
            <div className="inline-block px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold mb-4">
              ⭐ Customer Reviews
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">Trusted by Thousands</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              See what our customers say about their experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 sm:gap-12 mb-16">
            {currentReviews.map((review, index) => (
              <div
                key={`${currentReviewIndex}-${index}`}
                className={`bg-white p-6 sm:p-8 rounded-2xl shadow-xl border-2 border-gray-100 space-y-4 transition-opacity duration-700 ease-in-out hover:shadow-2xl hover:border-teal-200 hover:-translate-y-1 ${
                  fadeOut ? "opacity-0" : "opacity-100"
                }`}
              >
                <div className="flex items-center gap-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-base sm:text-lg leading-relaxed">{review.text}</p>
                <div className="pt-4 border-t border-gray-200">
                  <div className="font-semibold text-gray-900">{review.name}</div>
                  <div className="text-sm text-gray-500">{review.date}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10 sm:mt-12 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">5.0</span>
            </div>
            <p className="text-gray-600">Based on 500+ verified reviews</p>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/3 w-96 h-96 bg-teal-100 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-20 right-1/3 w-96 h-96 bg-teal-200 rounded-full blur-3xl opacity-30"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="bg-gradient-to-br from-teal-600 via-teal-600 to-teal-800 p-8 sm:p-12 rounded-3xl shadow-2xl text-white relative overflow-hidden">
            {/* Decorative pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(circle at 20px 20px, white 2px, transparent 0)`,
                  backgroundSize: "40px 40px",
                }}
              ></div>
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <Zap className="w-5 h-5" />
                <span className="font-semibold">Instant Access</span>
              </div>

              <h3 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6">Instant Docs, Instant Delivery </h3>
              <p className="text-base sm:text-lg text-teal-50 mb-6 sm:mb-8 leading-relaxed">
                {
                  "Transform your ideas into professional documents instantly. From business proposals to technical specifications, our algorithm creates high-quality content in seconds."
                }
              </p>

              <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
                <div className="flex items-center space-x-3 group">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    <Check className="w-5 h-5 text-teal-600" />
                  </div>
                  <span className="text-base sm:text-lg text-teal-50 font-medium">
                    Instant professional document creation
                  </span>
                </div>
                <div className="flex items-center space-x-3 group">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    <Check className="w-5 h-5 text-teal-600" />
                  </div>
                  <span className="text-base sm:text-lg text-teal-50 font-medium">
                    Affordable pricing for every need
                  </span>
                </div>
                <div className="flex items-center space-x-3 group">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    <Check className="w-5 h-5 text-teal-600" />
                  </div>
                  <span className="text-base sm:text-lg text-teal-50 font-medium">Instant download after purchase</span>
                </div>
              </div>

              <Button
                onClick={() => router.push("/ai-documents")}
                className="w-full sm:w-auto bg-white hover:bg-teal-50 text-teal-600 py-4 px-8 rounded-xl font-semibold text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              >
                GET STARTED
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-gray-50 via-teal-50/30 to-gray-50 py-12 sm:py-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-200 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-300 rounded-full blur-3xl opacity-15"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-100 rounded-full blur-3xl opacity-10"></div>

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(20 184 166) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        ></div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-10 sm:mb-16 space-y-3">
            <div className="inline-block px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold mb-4">
              ✨ Our Advantages
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">Why Choose Us?</h2>
            <p className="text-lg sm:text-xl text-gray-600">Professional docs you can rely on</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border-2 border-gray-100 space-y-4 hover:shadow-2xl hover:border-teal-200 hover:-translate-y-2 transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Instant Digital Docs</h3>
              <p className="text-gray-600 leading-relaxed">
                Generate and download professional documents instantly. Get your docs ready in seconds, not hours.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border-2 border-gray-100 space-y-4 hover:shadow-2xl hover:border-teal-200 hover:-translate-y-2 transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <FileCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Professional Quality</h3>
              <p className="text-gray-600 leading-relaxed">
                All documents are professionally formatted with industry-standard templates and verified accuracy.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border-2 border-gray-100 space-y-4 hover:shadow-2xl hover:border-teal-200 hover:-translate-y-2 transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Download className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Trusted Documents</h3>
              <p className="text-gray-600 leading-relaxed">
                Join thousands who rely on our digital documents for their business and personal needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-white to-gray-50 py-12 sm:py-20 px-4 sm:px-6 border-t border-gray-200 relative overflow-hidden">
        <div className="absolute inset-0">
          {/* Multiple blur orbs for depth */}
          <div className="absolute top-20 right-1/4 w-96 h-96 bg-teal-200 rounded-full blur-3xl opacity-25"></div>
          <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-teal-100 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-teal-300 rounded-full blur-3xl opacity-20"></div>

          {/* Subtle grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgb(20 184 166) 1px, transparent 0)`,
              backgroundSize: "48px 48px",
            }}
          ></div>

          {/* Gradient accent lines */}
          <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-300 to-transparent opacity-30"></div>
          <div className="absolute bottom-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent opacity-30"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-16 space-y-3">
            <div className="inline-block px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold mb-4">
              🚀 Simple Process
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">How It Works</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Get your professional documents in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 sm:gap-12 mb-16">
            <div className="relative">
              <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-gray-100 space-y-4 hover:shadow-2xl hover:border-teal-200 hover:-translate-y-2 transition-all duration-300">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    1
                  </div>
                </div>
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 bg-teal-50 rounded-xl flex items-center justify-center">
                    <FileCheck className="w-8 h-8 text-teal-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center">Search & Select</h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  Browse our collection of professional documents and select the one you need
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-0.5 bg-gradient-to-r from-teal-300 to-transparent"></div>
            </div>

            <div className="relative">
              <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-gray-100 space-y-4 hover:shadow-2xl hover:border-teal-200 hover:-translate-y-2 transition-all duration-300">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    2
                  </div>
                </div>
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 bg-teal-50 rounded-xl flex items-center justify-center">
                    <Shield className="w-8 h-8 text-teal-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center">Secure Payment</h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  Complete your purchase securely with our encrypted payment system
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-0.5 bg-gradient-to-r from-teal-300 to-transparent"></div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-gray-100 space-y-4 hover:shadow-2xl hover:border-teal-200 hover:-translate-y-2 transition-all duration-300">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  3
                </div>
              </div>
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 bg-teal-50 rounded-xl flex items-center justify-center">
                  <Download className="w-8 h-8 text-teal-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center">Instant Download</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Download your document immediately and use it right away
              </p>
            </div>
          </div>

          {/* Money-Back Guarantee */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-8 rounded-2xl border-2 border-teal-200 shadow-xl">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-4">
                14-Day Money-Back Guarantee
              </h3>
              <p className="text-gray-700 text-center leading-relaxed text-lg">
                Experience technical difficulties with your download? We&#39;ll issue a full refund within 14 days. Your
                complete satisfaction is guaranteed.
              </p>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-teal-50 via-white to-teal-50 p-8 sm:p-12 rounded-2xl shadow-2xl border-2 border-teal-200 overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-200 rounded-full blur-3xl opacity-30"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-300 rounded-full blur-3xl opacity-30"></div>

            <div className="relative z-10">
              <div className="text-center mb-8 space-y-2">
                <div className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-3 shadow-lg">
                  <Shield className="w-4 h-4" />
                  <span>Secure Payments</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">Trusted & Secure</h3>
                <p className="text-gray-600">We accept all major payment methods</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center">
                <div className="flex flex-col items-center space-y-3 group cursor-default">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300">
                    VISA
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Visa</span>
                </div>
                <div className="flex flex-col items-center space-y-3 group cursor-default">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300">
                    MC
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Mastercard</span>
                </div>
                <div className="flex flex-col items-center space-y-3 group cursor-default">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300">
                    AMEX
                  </div>
                  <span className="text-sm font-semibold text-gray-700">American Express</span>
                </div>
                <div className="flex flex-col items-center space-y-3 group cursor-default">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">256-bit SSL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-white via-gray-50 to-white py-12 sm:py-20 px-4 sm:px-6 border-t border-gray-200 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-100 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-200 rounded-full blur-3xl opacity-25"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-50 rounded-full blur-3xl opacity-15"></div>

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgb(20 184 166) 1px, transparent 0)`,
              backgroundSize: "48px 48px",
            }}
          ></div>

          {/* Accent lines */}
          <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent opacity-30"></div>
          <div className="absolute bottom-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-300 to-transparent opacity-30"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-10 sm:mb-16 space-y-3">
            <div className="inline-block px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold mb-4">
              ❓ FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">Frequently Asked Questions</h2>
            <p className="text-lg sm:text-xl text-gray-600">Get answers to common questions about our service</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-gray-50 to-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-teal-300 transition-colors shadow-sm hover:shadow-md"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                  <ChevronDown
                    className={`w-5 h-5 text-teal-600 flex-shrink-0 transition-transform duration-300 ${
                      openFaqIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaqIndex === index && (
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 bg-white">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    {(index === 2 || index === 5) && (
                      <div className="mt-4">
                        <Link href="/contact">
                          <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl transition-all">
                            Contact Support
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-gray-50 via-teal-50/20 to-gray-50 py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto relative">
          {/* Decorative background for the section */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-teal-200 rounded-full blur-3xl opacity-20"></div>
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-teal-300 rounded-full blur-3xl opacity-20"></div>
          </div>

          <div className="bg-gradient-to-br from-teal-600 to-teal-700 py-12 sm:py-16 px-6 sm:px-12 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(circle at 20px 20px, white 2px, transparent 0)`,
                  backgroundSize: "40px 40px",
                }}
              ></div>
            </div>

            <div className="max-w-3xl mx-auto text-center relative z-10 space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Require any help?</h2>
              <p className="text-lg sm:text-xl text-teal-50 leading-relaxed max-w-2xl mx-auto">
                Our support team is here to help 24/7. Whether you need assistance with a purchase, have questions about
                our documents, or require a refund, get in touch and we&#39;ll respond as quickly as possible.
              </p>
              <Link href="/contact">
                <Button className="bg-white hover:bg-teal-50 text-teal-600 font-semibold text-lg px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                  Get In Touch
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gradient-to-r from-teal-600 via-teal-600 to-teal-700 py-6 sm:py-8 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-teal-50">
            <Link
              href="/privacy-policy"
              className="hover:text-white transition-colors text-center sm:text-left font-medium"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-services"
              className="hover:text-white transition-colors text-center sm:text-left font-medium"
            >
              Terms of Services
            </Link>
            <Link
              href="/return-policy"
              className="hover:text-white transition-colors text-center sm:text-left font-medium"
            >
              Return Policy
            </Link>
          </div>
          <div className="text-center mt-4 sm:mt-6 text-xs text-teal-100">© {new Date().getFullYear()} {settings?.companyName || 'TEMPNOW'}. All rights reserved.</div>
        </div>
      </footer>

      {/* Notification Container */}
      <NotificationContainer notifications={notifications} onClose={removeNotification} />
    </div>
  )
}