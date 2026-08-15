"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Mail, ArrowRight, Shield, Clock, RefreshCw, Menu, X } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationContainer } from "@/components/notification"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth"

export default function CoveriseLoginPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])
  const [timeLeft, setTimeLeft] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [formData, setFormData] = useState({
    email: "",
  })
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const { login } = useAuth()
  const { notifications, removeNotification, showSuccess, showError, showInfo } = useNotifications()

  // Timer for verification resend
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (showVerification && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setCanResend(true)
            return 0
          }
          return time - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [showVerification, timeLeft])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!formData.email) {
        showError("Missing Information", "Please enter your email address.")
        setIsLoading(false)
        return
      }

      setUserEmail(formData.email)
      setShowVerification(true)
      setTimeLeft(60)
      setCanResend(false)
      setVerificationCode(["", "", "", "", "", ""])

      showInfo(
        "Verification Required",
        `A 6-digit verification code has been sent to ${formData.email}. Please check your inbox.`,
        8000,
      )
    } catch (error) {
      console.error("Form submission error:", error)
      showError("Error", "An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationCodeChange = (index: number, value: string) => {
    if (value.length > 1) return

    const newCode = [...verificationCode]
    newCode[index] = value
    setVerificationCode(newCode)

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleVerificationKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = verificationCode.join("")

    if (code.length !== 6) {
      showError("Incomplete Code", "Please enter the complete 6-digit verification code.")
      return
    }

    if (code === "000000") {
      try {
        const expires = new Date()
        expires.setTime(expires.getTime() + 24 * 60 * 60 * 1000)

        document.cookie = `userLoggedIn=true; path=/; expires=${expires.toUTCString()}; SameSite=Lax`
        document.cookie = `userEmail=${userEmail}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`

        const userData = {
          id: `user-${Date.now()}`,
          email: userEmail,
          isAdmin: false,
        }

        localStorage.setItem("user", JSON.stringify(userData))
        localStorage.setItem("isAuthenticated", "true")
        localStorage.setItem("userEmail", userEmail)

        if (rememberMe) {
          localStorage.setItem("userLoggedIn", "true")
          localStorage.setItem("rememberMe", "true")
        } else {
          sessionStorage.setItem("userLoggedIn", "true")
          sessionStorage.setItem("userEmail", userEmail)
        }

        login(userData)

        showSuccess("Login Successful!", "Welcome back! Redirecting to dashboard...")

        setShowVerification(false)

        setTimeout(() => {
          router.push("/coverise/dashboard")
        }, 1500)
      } catch (error) {
        console.error("Authentication error:", error)
        showError("Authentication Error", "An error occurred during authentication.")
      }
    } else {
      showError("Invalid Code", "The verification code is incorrect. Please try again.")
      setVerificationCode(["", "", "", "", "", ""])
      const firstInput = document.getElementById("code-0")
      firstInput?.focus()
    }
  }

  const handleResendCode = () => {
    setTimeLeft(60)
    setCanResend(false)
    setVerificationCode(["", "", "", "", "", ""])
    showInfo("Verification Code Resent", "A new verification code has been sent to your email.")
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 flex flex-col relative overflow-hidden">
      {/* Testing Mode Banner */}
      <div className="bg-black/95 backdrop-blur-sm px-4 sm:px-6 py-4 sm:py-5 border-b border-cyan-900/30 sticky top-0 z-50">
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
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-2 text-cyan-400 hover:bg-gray-900 rounded-lg transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <nav className="sm:hidden mt-6 pb-4 space-y-4" role="navigation">
              <Link href="/coverise/documents" onClick={() => setIsMobileMenuOpen(false)} className="block">
                <div className="text-gray-300 hover:text-cyan-400 transition-colors font-medium py-2">Documents</div>
              </Link>
              <Link href="/coverise/contact" onClick={() => setIsMobileMenuOpen(false)} className="block">
                <div className="text-gray-300 hover:text-cyan-400 transition-colors font-medium py-2">Contact</div>
              </Link>
            </nav>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-8 relative z-10">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-black/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-cyan-500/20 overflow-hidden relative">
            {/* Decorative top border glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />

            {/* Form Header */}
            <div className="relative bg-gradient-to-br from-cyan-600 via-cyan-700 to-cyan-800 px-6 py-8 text-white text-center overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">Welcome Back</h2>
                <p className="text-cyan-50 text-sm">Sign in to your account</p>
              </div>
            </div>

            {/* Form Content */}
            <div className="px-6 py-8 relative">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="your@email.com"
                      className="pl-11 h-12 bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 text-white placeholder:text-gray-500 rounded-xl transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Remember Me checkbox */}
                <div className="relative overflow-hidden rounded-xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-cyan-800/10" />
                  <div className="relative flex items-center space-x-3 bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                    <input
                      type="checkbox"
                      id="remember-me"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-5 w-5 text-cyan-600 border-2 border-gray-600 rounded focus:ring-cyan-500 bg-gray-700 cursor-pointer"
                    />
                    <label htmlFor="remember-me" className="text-sm font-medium text-gray-300 cursor-pointer flex-1">
                      Keep me signed in
                    </label>
                    <Shield className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white h-13 font-bold shadow-lg shadow-cyan-900/30 hover:shadow-cyan-600/50 transition-all duration-300 flex items-center justify-center space-x-2 rounded-xl text-base"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>

              {/* Toggle to signup */}
              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  Don't have an account?{" "}
                  <Link
                    href="/coverise/signup"
                    className="text-cyan-400 hover:text-cyan-300 font-semibold underline decoration-cyan-500/50 underline-offset-2 transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Email Verification Popup */}
      {showVerification && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-gray-900/98 via-gray-900/95 to-black/98 backdrop-blur-xl border-2 border-cyan-500/30 rounded-3xl p-8 max-w-sm sm:max-w-md w-full shadow-2xl shadow-cyan-900/20 relative">
            {/* Decorative top glow */}
            <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-4 ring-cyan-500/20 shadow-lg shadow-cyan-600/30 relative">
                <div className="absolute inset-0 bg-cyan-400/20 rounded-2xl blur animate-pulse" />
                <Shield className="w-10 h-10 text-white relative z-10" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Verify Your Email</h3>
              <p className="text-gray-400 text-sm">We've sent a 6-digit verification code to:</p>
              <p className="font-semibold text-cyan-400 mt-2 break-all text-base">{userEmail}</p>
            </div>

            <form onSubmit={handleVerificationSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4 text-center">
                  Enter Verification Code
                </label>
                <div className="flex justify-center gap-2 sm:gap-3">
                  {verificationCode.map((digit, index) => (
                    <Input
                      key={index}
                      id={`code-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleVerificationCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleVerificationKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold bg-gray-800/50 backdrop-blur-sm border-2 border-gray-600/50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/30 rounded-xl text-white transition-all shadow-lg focus:shadow-cyan-500/20"
                      autoComplete="off"
                    />
                  ))}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 to-amber-600/20 blur-sm" />
                <div className="relative bg-gradient-to-r from-yellow-900/40 to-amber-900/40 border border-yellow-600/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-100">
                      <p className="font-semibold mb-1">Testing Mode</p>
                      <p className="text-yellow-200">
                        For testing purposes, use code:{" "}
                        <strong className="text-yellow-50 text-base px-2 py-0.5 bg-yellow-600/20 rounded">
                          000000
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold underline decoration-cyan-500/50 flex items-center justify-center space-x-2 mx-auto text-sm transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Resend Code</span>
                  </button>
                ) : (
                  <p className="text-gray-500 text-sm flex items-center justify-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Resend available in {formatTime(timeLeft)}</span>
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white h-12 font-bold shadow-lg shadow-cyan-900/30 hover:shadow-cyan-600/50 transition-all duration-300 rounded-xl"
              >
                Verify Email
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setShowVerification(false)}
                className="text-gray-400 hover:text-gray-300 text-sm underline decoration-gray-500/50 transition-colors"
              >
                Cancel and go back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Container */}
      <NotificationContainer notifications={notifications} removeNotification={removeNotification} />

      {/* Footer */}
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
