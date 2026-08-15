"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { Download, Sparkles, Paperclip, Edit3, FileText, Zap, Clock, Shield, X, Menu, Eye, Info } from "lucide-react"

// Test accounts for validation
const TEST_ACCOUNTS = [
  { email: "test@coverise.com", password: "test123", isAdmin: false },
  { email: "admin@coverise.com", password: "admin123", isAdmin: true },
  { email: "user@coverise.com", password: "user123", isAdmin: false },
]

export default function CoveriseDocumentsPage() {
  const [documentRequest, setDocumentRequest] = useState("")
  const [generatedText, setGeneratedText] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showOutput, setShowOutput] = useState(false)
  const [showPaymentPopup, setShowPaymentPopup] = useState(false)
  const [showSignInPopup, setShowSignInPopup] = useState(false)
  const [tipAmount, setTipAmount] = useState(0)
  const [discountCode, setDiscountCode] = useState("")
  const [appliedDiscount, setAppliedDiscount] = useState(null)
  const [expandedSection, setExpandedSection] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Sign in form state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [signInError, setSignInError] = useState("")
  const [showSignUp, setShowSignUp] = useState(false)
  const [signUpEmail, setSignUpEmail] = useState("")
  const [signUpPassword, setSignUpPassword] = useState("")
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("")
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [signUpError, setSignUpError] = useState("")
  const [showVerification, setShowVerification] = useState(false)
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState("")

  // Card details
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvc, setCardCvc] = useState("")
  const [postalCode, setPostalCode] = useState("")

  const documentPrice = 10

  // Memoize discount codes to prevent re-creation
  const discountCodes = useMemo(
    () => ({
      WELCOME10: { type: "percentage", value: 10, description: "10% off" },
      SAVE5: { type: "fixed", value: 5, description: "£5 off" },
      STUDENT: { type: "percentage", value: 20, description: "20% student discount" },
      FIRST: { type: "percentage", value: 15, description: "15% first-time user" },
    }),
    [],
  )

  // Memoize quick templates
  const quickTemplates = useMemo(
    () => [
      "Write a comprehensive marketing strategy for a new mobile app",
      "Create a detailed technical specification for a web platform",
      "Draft a professional investor pitch deck for a fintech startup",
      "Develop a strategic business expansion plan for international markets",
    ],
    [],
  )

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      // Check for user data in localStorage (main auth system uses 'user' and 'isAuthenticated')
      const userExists = localStorage.getItem("user") || localStorage.getItem("userEmail")
      const isLoggedIn = localStorage.getItem("isAuthenticated") === "true" || !!userExists
      console.log("[v0] Auth check in documents page:", { userExists, isLoggedIn })
      setIsAuthenticated(isLoggedIn)
    }

    checkAuth()

    const handleStorageChange = () => {
      checkAuth()
    }

    window.addEventListener("storage", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const handleTemplateClick = useCallback((template: string) => {
    setDocumentRequest(template)
  }, [])

  // Separate function for the actual document generation logic
  const generateDocument = useCallback(async () => {
    if (!documentRequest.trim()) return

    setIsGenerating(true)

    // Simulate AI generation with optimized content
    setTimeout(() => {
      setGeneratedText(
        `# Marketing Strategy: Mobile App Launch

## Executive Overview

This comprehensive marketing strategy outlines the approach for successfully launching our new mobile application in the competitive digital marketplace. The plan addresses target audience identification, competitive positioning, marketing channels, budget allocation, and success metrics to ensure maximum market penetration and user acquisition.

## Target Audience Analysis

Our primary audience consists of tech-savvy professionals aged 25-45 who value efficiency and digital solutions in their daily workflows. These individuals typically work in corporate environments, manage multiple projects simultaneously, and seek tools that enhance productivity while maintaining work-life balance.

## Market Positioning

The application will be positioned as an intuitive, feature-rich solution that addresses specific pain points not currently solved by existing offerings in the marketplace. Our unique value proposition centers on seamless integration capabilities with existing business tools and enhanced security features.

## Marketing Channels & Tactics

### Digital Marketing Strategy

Our comprehensive digital approach will leverage multiple touchpoints including search engine optimization focusing on solution-based keywords, targeted pay-per-click campaigns, and strategic content marketing through industry publications.

### Social Media Strategy

Platform-specific approaches will include LinkedIn for thought leadership content, Twitter for real-time product updates, and Instagram for visual demonstrations that showcase the application's benefits.

## Launch Timeline and Implementation

The marketing rollout will follow a carefully planned phased approach designed to maximize impact and user adoption:

- **Pre-launch phase (4 weeks):** Comprehensive teaser campaign and early access registration
- **Launch week:** Coordinated press releases and strategic influencer partnerships
- **Post-launch phase (8 weeks):** Sustained engagement campaigns and user feedback collection

## Budget Allocation and Resource Distribution

The initial marketing budget of $75,000 will be strategically distributed across multiple channels: digital advertising campaigns (40%), professional content creation (25%), public relations (20%), analytics tools (10%), and contingency fund (5%).

## Success Metrics and Key Performance Indicators

Critical performance indicators will include specific download targets of 10,000 users in the first month, user retention rates of 40% after 30 days, conversion rates of 5% from free to premium subscriptions, and maintaining customer acquisition costs below $2.50 per user.`,
      )
      setIsGenerating(false)
      setShowOutput(true)
    }, 2000)
  }, [documentRequest])

  const handleGenerateDocument = useCallback(async () => {
    if (!documentRequest.trim()) return

    if (!isAuthenticated) {
      setShowSignInPopup(true)
      return
    }

    await generateDocument()
  }, [documentRequest, isAuthenticated, generateDocument])

  const handleEditRequest = useCallback(() => {
    setShowOutput(false)
  }, [])

  const handleDownloadPDF = useCallback(() => {
    setShowPaymentPopup(true)
  }, [])

  const handlePayment = useCallback(() => {
    localStorage.setItem("coveriseDocumentContent", generatedText)
    localStorage.setItem("coveriseDocumentType", documentRequest.substring(0, 100) + "...")

    setShowPaymentPopup(false)

    window.location.href = "/coverise/payment-confirmation"
  }, [generatedText, documentRequest])

  const generatePDFForDownload = useCallback(async () => {
    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF()

      doc.setProperties({
        title: "Coverise Generated Document",
        subject: "AI Generated Document",
        author: "Coverise AI Documents",
        creator: "Coverise",
      })

      // Add header
      doc.setFontSize(20)
      doc.setFont("helvetica", "bold")
      doc.text("Coverise - Generated Document", 20, 20)

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30)

      doc.line(20, 35, 190, 35)

      let yPosition = 45
      const pageHeight = doc.internal.pageSize.height
      const margin = 20
      const lineHeight = 6
      const maxWidth = 170

      const lines = generatedText.split("\n")

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()

        if (line === "") {
          yPosition += lineHeight / 2
          continue
        }

        if (yPosition > pageHeight - 30) {
          doc.addPage()
          yPosition = 20
        }

        if (line.startsWith("# ")) {
          doc.setFontSize(16)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(6, 182, 212) // Cyan
          const text = line.substring(2)
          const splitText = doc.splitTextToSize(text, maxWidth)
          doc.text(splitText, margin, yPosition)
          yPosition += splitText.length * lineHeight + 5
        } else if (line.startsWith("## ")) {
          doc.setFontSize(14)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(8, 145, 178) // Cyan
          const text = line.substring(3)
          const splitText = doc.splitTextToSize(text, maxWidth)
          doc.text(splitText, margin, yPosition)
          yPosition += splitText.length * lineHeight + 3
        } else if (line.startsWith("### ")) {
          doc.setFontSize(12)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(8, 145, 178) // Cyan
          const text = line.substring(4)
          const splitText = doc.splitTextToSize(text, maxWidth)
          doc.text(splitText, margin, yPosition)
          yPosition += splitText.length * lineHeight + 2
        } else if (line.startsWith("- ")) {
          doc.setFontSize(10)
          doc.setFont("helvetica", "normal")
          doc.setTextColor(55, 65, 81)
          const text = `• ${line.substring(2)}`
          const splitText = doc.splitTextToSize(text, maxWidth - 5)
          doc.text(splitText, margin + 5, yPosition)
          yPosition += splitText.length * lineHeight
        } else {
          doc.setFontSize(10)
          doc.setFont("helvetica", "normal")
          doc.setTextColor(55, 65, 81)

          if (line.includes("**")) {
            const parts = line.split("**")
            let currentX = margin

            for (let j = 0; j < parts.length; j++) {
              if (j % 2 === 1) {
                doc.setFont("helvetica", "bold")
                doc.setTextColor(17, 24, 39)
              } else {
                doc.setFont("helvetica", "normal")
                doc.setTextColor(55, 65, 81)
              }

              const textWidth = doc.getTextWidth(parts[j])
              if (currentX + textWidth > margin + maxWidth) {
                yPosition += lineHeight
                currentX = margin
              }

              doc.text(parts[j], currentX, yPosition)
              currentX += textWidth
            }
            yPosition += lineHeight + 2
          } else {
            const splitText = doc.splitTextToSize(line, maxWidth)
            doc.text(splitText, margin, yPosition)
            yPosition += splitText.length * lineHeight + 2
          }
        }
      }

      const totalPages = doc.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.text("Generated by Coverise AI Documents", margin, pageHeight - 15)
        doc.text("© 2025 Coverise", margin, pageHeight - 10)
        doc.text(`Page ${i} of ${totalPages}`, 190 - 30, pageHeight - 10)
      }

      doc.save("coverise-generated-document.pdf")
    } catch (error) {
      console.error("Error generating PDF:", error)

      const textContent = `Coverise - Generated Document
Generated on: ${new Date().toLocaleDateString()}

${generatedText.replace(/[#*]/g, "")}

---
Generated by Coverise AI Documents
© 2025 Coverise`

      const blob = new Blob([textContent], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "coverise-generated-document.txt"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }, [generatedText])

  const applyDiscountCode = useCallback(() => {
    const code = discountCode.toUpperCase()
    if (discountCodes[code]) {
      setAppliedDiscount(discountCodes[code])
    } else {
      setAppliedDiscount({ error: "Invalid discount code" })
    }
  }, [discountCode, discountCodes])

  const removeDiscount = useCallback(() => {
    setAppliedDiscount(null)
    setDiscountCode("")
  }, [])

  const calculateDiscountedPrice = useCallback(() => {
    if (!appliedDiscount || appliedDiscount.error) return documentPrice

    if (appliedDiscount.type === "percentage") {
      return documentPrice - (documentPrice * appliedDiscount.value) / 100
    } else {
      return Math.max(0, documentPrice - appliedDiscount.value)
    }
  }, [appliedDiscount, documentPrice])

  const getDiscountAmount = useCallback(() => {
    if (!appliedDiscount || appliedDiscount.error) return 0

    if (appliedDiscount.type === "percentage") {
      return (documentPrice * appliedDiscount.value) / 100
    } else {
      return Math.min(documentPrice, appliedDiscount.value)
    }
  }, [appliedDiscount, documentPrice])

  const finalPrice = calculateDiscountedPrice()
  const totalWithTip = finalPrice + tipAmount

  const toggleSection = useCallback((section: string) => {
    setExpandedSection((prev) => (prev === section ? "" : section))
  }, [])

  const formatCardNumber = useCallback((value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    return parts.length ? parts.join(" ") : value
  }, [])

  const formatExpiry = useCallback((value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    return v.length >= 2 ? `${v.substring(0, 2)} / ${v.substring(2, 4)}` : v
  }, [])

  // Handle sign in
  const handleSignIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSignInError("")
      setIsSigningIn(true)

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        if (!email || !password) {
          setSignInError("Please enter both email and password")
          setIsSigningIn(false)
          return
        }

        const account = TEST_ACCOUNTS.find((acc) => acc.email.toLowerCase() === email.toLowerCase())

        if (!account) {
          setSignInError("Account not found. Please check your email address.")
          setIsSigningIn(false)
          return
        }

        if (account.password !== password) {
          setSignInError("Incorrect password. Please try again.")
          setIsSigningIn(false)
          return
        }

        setShowVerification(true)
        setIsSigningIn(false)
      } catch (error) {
        console.error("Sign in error:", error)
        setSignInError("An error occurred during sign in. Please try again.")
        setIsSigningIn(false)
      }
    },
    [email, password],
  )

  const handleVerificationCodeChange = (index: number, value: string) => {
    if (value.length > 1) return

    const newCode = [...verificationCode]
    newCode[index] = value
    setVerificationCode(newCode)

    if (value && index < 5) {
      const nextInput = document.getElementById(`coverise-code-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleVerificationKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`coverise-code-${index - 1}`)
      prevInput?.focus()
    }
  }

  // Handle verification
  const handleVerifyCode = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setVerificationError("")

      const code = verificationCode.join("")
      if (code.length !== 6) {
        setVerificationError("Please enter the complete 6-digit verification code")
        return
      }

      setIsVerifying(true)

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        if (code === "123456" || code === "111111") {
          const userToStore = {
            id: `user-${Date.now()}`,
            email: email,
            isAdmin: false,
          }

          localStorage.setItem("user", JSON.stringify(userToStore))
          localStorage.setItem("isAuthenticated", "true")
          localStorage.setItem("userEmail", email)

          if (rememberMe) {
            localStorage.setItem("rememberMe", "true")
          }

          setIsAuthenticated(true)
          setShowSignInPopup(false)
          setShowVerification(false)
          setShowSignUp(false)

          if (documentRequest.trim()) {
            await generateDocument()
          }
        } else {
          setVerificationError("Invalid verification code. Please enter a 6-digit code.")
        }
      } catch (error) {
        console.error("Verification error:", error)
        setVerificationError("An error occurred during verification. Please try again.")
      } finally {
        setIsVerifying(false)
      }
    },
    [verificationCode, email, rememberMe, documentRequest, generateDocument],
  )

  // Toggle between sign in and sign up
  const toggleSignUpMode = useCallback(() => {
    setShowSignUp(!showSignUp)
    setSignInError("")
    setSignUpError("")
    setVerificationError("")
    setShowVerification(false)
    setVerificationCode(["", "", "", "", "", ""])
  }, [showSignUp])

  const handleSignUp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSignUpError("")

      if (!signUpEmail) {
        setSignUpError("Please enter your email")
        return
      }

      if (!signUpPassword) {
        setSignUpError("Please enter a password")
        return
      }

      if (signUpPassword !== signUpConfirmPassword) {
        setSignUpError("Passwords do not match")
        return
      }

      setIsSigningUp(true)

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setShowVerification(true)
        setIsSigningUp(false)
      } catch (error) {
        console.error("Sign up error:", error)
        setSignUpError("An error occurred during sign up. Please try again.")
        setIsSigningUp(false)
      }
    },
    [signUpEmail, signUpPassword, signUpConfirmPassword],
  )

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      {/* Header */}
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
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 text-cyan-400 hover:bg-gray-900 rounded-lg transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="sm:hidden mt-6 pb-4 space-y-4 sm:space-y-0" role="navigation">
              <Link href="/coverise/contact" onClick={() => setMobileMenuOpen(false)} className="block">
                <div className="text-gray-300 hover:text-cyan-400 transition-colors font-medium py-2">Contact</div>
              </Link>
              <Link href="/coverise/login" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-full">
                  Sign In
                </Button>
              </Link>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto bg-gradient-to-br from-black via-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {/* Hero Section */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center space-x-2 bg-cyan-950 text-cyan-400 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium border border-cyan-800">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>AI-Powered Document Generation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight px-4">
              Transform Ideas into
              <span className="text-transparent bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text block">
                Professional Documents
              </span>
            </h1>
            <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed px-4">
              Our advanced AI technology creates high-quality, personalized documents in seconds. From business
              proposals to technical specifications, get professionally formatted content instantly.
            </p>

            {/* Feature highlights */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-6 mt-4 px-4">
              <div className="flex items-center justify-center sm:justify-start space-x-2 text-gray-400">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500" />
                <span className="text-sm sm:text-base">Instant Generation</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start space-x-2 text-gray-400">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500" />
                <span className="text-sm sm:text-base">Professional Quality</span>
              </div>
            </div>

            {/* Pricing Comparison */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-4 mt-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-white mb-2">How It Works</h2>
                <p className="text-sm text-gray-400">Generate unlimited documents for free, download when ready</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {/* Free Section */}
                <div className="bg-gradient-to-br from-green-950 to-green-900 rounded-lg p-4 border border-green-800 relative">
                  <div className="absolute -top-2 left-4">
                    <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">FREE</span>
                  </div>
                  <div className="pt-2">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-6 h-6 bg-green-900 rounded-full flex items-center justify-center">
                        <Eye className="w-4 h-4 text-green-400" />
                      </div>
                      <h3 className="font-semibold text-white">Generate & Preview</h3>
                    </div>
                    <ul className="text-sm text-gray-300 space-y-1.5">
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                        <span>Unlimited document generation</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                        <span>Full preview & editing</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                        <span>No time limits</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Paid Section */}
                <div className="bg-gradient-to-br from-cyan-950 to-cyan-900 rounded-lg p-4 border border-cyan-800 relative">
                  <div className="absolute -top-2 left-4">
                    <span className="bg-cyan-600 text-white text-xs font-bold px-2 py-1 rounded">£10</span>
                  </div>
                  <div className="pt-2">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-6 h-6 bg-cyan-900 rounded-full flex items-center justify-center">
                        <Download className="w-4 h-4 text-cyan-400" />
                      </div>
                      <h3 className="font-semibold text-white">Professional PDF</h3>
                    </div>
                    <ul className="text-sm text-gray-300 space-y-1.5">
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                        <span>High-quality PDF format</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                        <span>Print-ready quality</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                        <span>Instant download</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-950 border border-blue-800 rounded-lg p-3 mt-4 max-w-2xl mx-auto">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-300">
                    <span className="font-medium">Perfect for trying before buying:</span> Generate and perfect your
                    document completely free, then pay only when you're satisfied and ready to download.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Document Generation Section */}
          {!showOutput && (
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-700 to-cyan-600 px-4 sm:px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">Generate Your Document</h2>
                    <p className="text-cyan-100 text-sm sm:text-base">
                      Describe what you need and let our AI create it for you
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div className="relative">
                  <label className="block text-base sm:text-lg font-semibold text-white mb-3">
                    What type of document do you need?
                  </label>
                  <div className="relative">
                    <Textarea
                      value={documentRequest}
                      onChange={(e) => setDocumentRequest(e.target.value)}
                      placeholder="e.g., A comprehensive business proposal for a tech startup, a detailed marketing strategy for a mobile app launch, a technical specification document..."
                      className="min-h-20 sm:min-h-24 resize-none text-sm sm:text-base border-2 border-gray-600 bg-gray-900 text-white placeholder:text-gray-500 focus:border-cyan-500 rounded-xl"
                      disabled={isGenerating}
                    />
                    <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-cyan-400 hover:bg-gray-700 hover:text-cyan-300 flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                      >
                        <Paperclip className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Attach Files</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Quick Templates */}
                <div className="space-y-3">
                  <h3 className="text-sm sm:text-base font-semibold text-white">Quick Start Templates</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {quickTemplates.map((template, index) => (
                      <button
                        key={index}
                        onClick={() => handleTemplateClick(template)}
                        className="flex items-start space-x-3 p-4 border-2 border-gray-700 bg-gray-900 rounded-xl hover:border-cyan-500 hover:bg-gray-800 transition-all duration-200 text-left group touch-manipulation"
                        disabled={isGenerating}
                      >
                        <div className="w-8 h-8 bg-cyan-950 border border-cyan-800 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-900 transition-colors">
                          <FileText className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-gray-300 font-medium text-sm leading-relaxed">{template}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleGenerateDocument}
                  disabled={!documentRequest.trim() || isGenerating}
                  className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white py-4 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 touch-manipulation"
                >
                  {isGenerating ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating Your Document...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Sparkles className="w-5 h-5" />
                      <span>Generate Document</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Generated Document Section */}
          {showOutput && generatedText && (
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
              {/* Document Header */}
              <div className="bg-gradient-to-r from-emerald-700 to-cyan-700 px-4 sm:px-6 py-4 flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Your Document is Ready!</h3>
                    <p className="text-emerald-100 text-sm sm:text-base">Review your generated content below</p>
                  </div>
                </div>
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
                  <Button
                    onClick={handleEditRequest}
                    variant="outline"
                    className="border-cyan-300 text-cyan-100 hover:bg-cyan-600 hover:border-white bg-transparent flex items-center justify-center space-x-2 text-sm sm:text-base h-12 touch-manipulation"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Request</span>
                  </Button>
                  <Button
                    onClick={handleDownloadPDF}
                    className="bg-white text-cyan-700 hover:bg-gray-100 flex items-center justify-center space-x-2 font-semibold text-sm sm:text-base h-12 touch-manipulation"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF - £10</span>
                  </Button>
                </div>
              </div>

              {/* Document Content */}
              <div className="p-4 sm:p-6">
                <div className="bg-gray-900 rounded-xl p-4 sm:p-6 max-h-[60vh] overflow-y-auto border border-gray-700">
                  <div className="prose prose-sm sm:prose-lg max-w-none prose-invert">
                    {generatedText.split("\n").map((line, index) => {
                      if (line.startsWith("# ")) {
                        return (
                          <h1
                            key={index}
                            className="text-xl sm:text-3xl font-bold text-cyan-400 mb-3 sm:mb-4 mt-3 sm:mt-4 first:mt-0"
                          >
                            {line.substring(2)}
                          </h1>
                        )
                      } else if (line.startsWith("## ")) {
                        return (
                          <h2
                            key={index}
                            className="text-lg sm:text-2xl font-semibold text-cyan-500 mb-2 sm:mb-3 mt-4 sm:mt-6"
                          >
                            {line.substring(3)}
                          </h2>
                        )
                      } else if (line.startsWith("### ")) {
                        return (
                          <h3
                            key={index}
                            className="text-base sm:text-xl font-semibold text-cyan-500 mb-2 mt-3 sm:mt-4"
                          >
                            {line.substring(4)}
                          </h3>
                        )
                      } else if (line.startsWith("- ")) {
                        return (
                          <li key={index} className="text-sm sm:text-base text-gray-300 mb-1 ml-4 sm:ml-6">
                            {line.substring(2)}
                          </li>
                        )
                      } else if (line.includes("**") && line.split("**").length > 2) {
                        const parts = line.split("**")
                        return (
                          <p key={index} className="text-sm sm:text-base text-gray-300 mb-2 sm:mb-3 leading-relaxed">
                            {parts.map((part, i) =>
                              i % 2 === 1 ? (
                                <strong key={i} className="font-semibold text-white">
                                  {part}
                                </strong>
                              ) : (
                                part
                              ),
                            )}
                          </p>
                        )
                      } else if (line.trim() === "") {
                        return <div key={index} className="h-2 sm:h-3"></div>
                      } else {
                        return (
                          <p key={index} className="text-sm sm:text-base text-gray-300 mb-2 sm:mb-3 leading-relaxed">
                            {line}
                          </p>
                        )
                      }
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
