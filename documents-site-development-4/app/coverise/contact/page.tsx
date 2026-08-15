"use client"

import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Clock, ShieldCheck, Menu, X, Mail, Send } from "lucide-react"
import { useState, useEffect } from "react"

export default function CoveriseContactPage() {
  const [isVerified, setIsVerified] = useState(false)
  const [verificationAnswer, setVerificationAnswer] = useState("")
  const [currentQuestion, setCurrentQuestion] = useState({ question: "", answer: "" })
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const verificationQuestions = [
    { question: "What is 7 + 3?", answer: "10" },
    { question: "What is 5 × 2?", answer: "10" },
    { question: "What is 15 - 6?", answer: "9" },
    { question: "What is 4 + 8?", answer: "12" },
    { question: "What is 3 × 4?", answer: "12" },
    { question: "What is 20 - 5?", answer: "15" },
  ]

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * verificationQuestions.length)
    setCurrentQuestion(verificationQuestions[randomIndex])
  }, [])

  const handleVerification = (answer: string) => {
    setVerificationAnswer(answer)
    setIsVerified(answer === currentQuestion.answer)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isVerified) {
      alert("Please complete the robot verification before submitting.")
      return
    }
    alert("Message sent successfully!")
  }

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

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
              <Link href="/coverise/login">
                <Button className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-6 rounded-full shadow-lg shadow-cyan-600/20">
                  Sign In
                </Button>
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
              <Link href="/coverise/login" onClick={() => setIsMobileMenuOpen(false)} className="block">
                <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-full">
                  Sign In
                </Button>
              </Link>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 py-12 sm:py-20 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-10 sm:mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30 text-cyan-400 rounded-full text-sm font-semibold mb-4 shadow-lg shadow-cyan-500/20 backdrop-blur-sm">
              <Mail className="w-4 h-4" />
              Get In Touch
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white text-balance drop-shadow-2xl">
              We're Here to{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 bg-clip-text text-transparent">
                Help
              </span>
            </h1>
            <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto text-pretty">
              Have questions? Need support? Our team is ready to assist you 24/7.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:gap-10">
            {/* Contact Form */}
            <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl p-6 sm:p-8 lg:p-10 rounded-2xl shadow-2xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 relative overflow-hidden group">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              <div className="relative z-10">
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Get in Touch</h2>
                  <p className="text-gray-400 text-sm sm:text-base">We typically respond within 24 hours</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name fields - side by side with floating labels */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative group">
                      <Input
                        type="text"
                        required
                        placeholder=" "
                        className="peer w-full h-14 text-base bg-gray-900/50 border-2 border-gray-700 focus:border-cyan-400 focus:ring-0 rounded-xl transition-all duration-300 text-white placeholder-transparent pt-6 pb-2 px-4"
                      />
                      <label className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-base transition-all duration-300 pointer-events-none peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-3 peer-focus:text-xs peer-focus:text-cyan-400 peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-cyan-400">
                        First Name *
                      </label>
                    </div>
                    <div className="relative group">
                      <Input
                        type="text"
                        required
                        placeholder=" "
                        className="peer w-full h-14 text-base bg-gray-900/50 border-2 border-gray-700 focus:border-cyan-400 focus:ring-0 rounded-xl transition-all duration-300 text-white placeholder-transparent pt-6 pb-2 px-4"
                      />
                      <label className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-base transition-all duration-300 pointer-events-none peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-3 peer-focus:text-xs peer-focus:text-cyan-400 peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-cyan-400">
                        Last Name *
                      </label>
                    </div>
                  </div>

                  {/* Email with floating label */}
                  <div className="relative group">
                    <Input
                      type="email"
                      required
                      placeholder=" "
                      className="peer w-full h-14 text-base bg-gray-900/50 border-2 border-gray-700 focus:border-cyan-400 focus:ring-0 rounded-xl transition-all duration-300 text-white placeholder-transparent pt-6 pb-2 px-4"
                    />
                    <label className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-base transition-all duration-300 pointer-events-none peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-3 peer-focus:text-xs peer-focus:text-cyan-400 peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-cyan-400">
                      Email Address *
                    </label>
                  </div>

                  {/* Subject with floating label */}
                  <div className="relative group">
                    <Input
                      type="text"
                      required
                      placeholder=" "
                      className="peer w-full h-14 text-base bg-gray-900/50 border-2 border-gray-700 focus:border-cyan-400 focus:ring-0 rounded-xl transition-all duration-300 text-white placeholder-transparent pt-6 pb-2 px-4"
                    />
                    <label className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-base transition-all duration-300 pointer-events-none peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-3 peer-focus:text-xs peer-focus:text-cyan-400 peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-cyan-400">
                      Subject *
                    </label>
                  </div>

                  {/* Message with floating label */}
                  <div className="relative group">
                    <Textarea
                      required
                      placeholder=" "
                      className="peer w-full min-h-36 resize-none text-base bg-gray-900/50 border-2 border-gray-700 focus:border-cyan-400 focus:ring-0 rounded-xl transition-all duration-300 text-white placeholder-transparent pt-8 pb-3 px-4"
                    />
                    <label className="absolute left-4 top-5 text-gray-500 text-base transition-all duration-300 pointer-events-none peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-3 peer-focus:text-xs peer-focus:text-cyan-400 peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-cyan-400">
                      Your Message *
                    </label>
                  </div>

                  {/* Privacy checkbox - simplified, no robot verification */}
                  <div className="flex items-start space-x-3 bg-gray-900/30 border border-gray-700 rounded-xl p-4">
                    <input
                      type="checkbox"
                      id="privacy-consent"
                      required
                      className="mt-1 h-5 w-5 rounded focus:ring-cyan-500 flex-shrink-0 cursor-pointer"
                      style={{ accentColor: "#06b6d4" }}
                    />
                    <label htmlFor="privacy-consent" className="text-sm text-gray-400 leading-relaxed cursor-pointer">
                      I agree to the{" "}
                      <Link href="/privacy-policy" className="text-cyan-400 hover:text-cyan-300 underline font-medium">
                        Privacy Policy
                      </Link>{" "}
                      and consent to the processing of my personal data. *
                    </label>
                  </div>

                  {/* Submit button with icon */}
                  <Button
                    type="submit"
                    className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 h-14 bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
                  >
                    Send Message
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </form>
              </div>
            </div>

            {/* Support Information */}
            <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl p-6 sm:p-8 lg:p-10 rounded-2xl shadow-2xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 relative overflow-hidden group">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Support Information</h2>

                <div className="space-y-6 sm:space-y-8">
                  {/* Response Time */}
                  <div className="flex items-start space-x-3 sm:space-x-4 p-4 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-xl border border-cyan-500/20">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/50">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white mb-2 text-base sm:text-lg">24/7 Response Time</h3>
                      <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                        Our email support services are available 24/7. We aim to respond to all inquiries within 24
                        hours.
                      </p>
                    </div>
                  </div>

                  {/* Data Protection */}
                  <div className="flex items-start space-x-3 sm:space-x-4 p-4 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-xl border border-cyan-500/20">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/50">
                      <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white mb-2 text-base sm:text-lg">Data Protection</h3>
                      <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                        For data protection inquiries, please mark your message as "Data Protection" in the subject
                        line.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Urgent Support Notice */}
                <div className="bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 backdrop-blur-sm p-5 sm:p-6 rounded-xl border-2 border-cyan-500/30 mt-6 sm:mt-8 shadow-lg">
                  <h3 className="font-bold text-cyan-400 mb-2 text-base sm:text-lg flex items-center gap-2">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></span>
                    Urgent Support
                  </h3>
                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                    For urgent technical issues, please mark your message as "Urgent" in the subject line.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-900 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">
              COVERISE
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
              <a href="/privacy" className="text-gray-500 hover:text-cyan-400 text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="text-gray-500 hover:text-cyan-400 text-sm transition-colors">
                Terms of Service
              </a>
              <a href="/returns" className="text-gray-500 hover:text-cyan-400 text-sm transition-colors">
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
