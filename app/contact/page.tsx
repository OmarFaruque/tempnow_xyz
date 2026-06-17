"use client"

import type React from "react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Clock, ShieldCheck, Shield } from "lucide-react"
import { useState, useEffect } from "react"
import { useSettings } from "@/context/settings"
import { Header } from "@/components/header"
import { useToast } from "@/hooks/use-toast"

export default function ContactPage() {
  const [isVerified, setIsVerified] = useState(false)
  const [verificationAnswer, setVerificationAnswer] = useState("")
  const [currentQuestion, setCurrentQuestion] = useState({ question: "", answer: "" })
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const settings = useSettings()
  const { toast } = useToast()
  const [hasMounted, setHasMounted] = useState(false)

  // Pool of verification questions
  const verificationQuestions = [
    { question: "What is 7 + 3?", answer: "10" },
    { question: "What is 5 × 2?", answer: "10" },
    { question: "What is 15 - 6?", answer: "9" },
    { question: "What is 4 + 8?", answer: "12" },
    { question: "What is 3 × 4?", answer: "12" },
    { question: "What is 20 - 5?", answer: "15" },
    { question: "What is 6 + 7?", answer: "13" },
    { question: "What is 2 × 8?", answer: "16" },
    { question: "What is 18 - 9?", answer: "9" },
    { question: "What is 5 + 6?", answer: "11" },
    { question: "What is 3 × 5?", answer: "15" },
    { question: "What is 14 - 8?", answer: "6" },
    { question: "What is 9 + 4?", answer: "13" },
    { question: "What is 7 × 2?", answer: "14" },
    { question: "What is 16 - 7?", answer: "9" },
  ]

  // Select a random question on component mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * verificationQuestions.length)
    setCurrentQuestion(verificationQuestions[randomIndex])
    setHasMounted(true)
  }, [])

  const handleVerification = (answer: string) => {
    setVerificationAnswer(answer)
    setIsVerified(answer === currentQuestion.answer)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isVerified) {
      toast({
        variant: "destructive",
        title: "Verification Required",
        description: "Please complete the robot verification before submitting.",
      })
      return
    }
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          subject,
          message,
        }),
      })

      const result = await response.json()


      if (response.ok) {
        if (result.existingTicket) {
          toast({
            variant: "default",
            title: "Existing Open Ticket",
            description:
              "You already have an open support ticket. We've sent an email to your address with a link to view it. Please check your inbox.",
          })
        } else {
          toast({
            title: "Message Sent!",
            description: "Your message has been sent successfully. We'll get back to you shortly.",
          })
        }
        setFirstName("")
        setLastName("")
        setEmail("")
        setSubject("")
        setMessage("")
        setVerificationAnswer("")
        setIsVerified(false)
        const randomIndex = Math.floor(Math.random() * verificationQuestions.length)
        setCurrentQuestion(verificationQuestions[randomIndex])
      } else {
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: "Failed to send message. Please try again.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "An unexpected error occurred. Please try again later.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 py-12 sm:py-20 bg-gradient-to-br from-gray-50 via-teal-50 to-gray-100 relative overflow-hidden">
        <div className="absolute inset-0">
          {/* Multiple decorative blur orbs at different positions */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-100 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-teal-200 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-teal-50 rounded-full blur-3xl opacity-40"></div>
          <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-teal-300 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute top-1/4 left-1/2 w-72 h-72 bg-teal-100 rounded-full blur-3xl opacity-25"></div>

          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgb(13 148 136) 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          ></div>

          {/* Gradient accent lines */}
          <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent opacity-50"></div>
          <div className="absolute bottom-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-300 to-transparent opacity-50"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Header section with badge */}
          <div className="text-center mb-10 sm:mb-16 space-y-3">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-teal-100 to-teal-200 text-teal-700 rounded-full text-sm font-semibold mb-4 shadow-md">
              📧 Get In Touch
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 text-balance">
              We're Here to Help
            </h1>
            <p className="text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto text-pretty">
              Have questions? Need support? Our team is ready to assist you with any inquiries about our services.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:gap-10">
            {/* Contact Form with enhanced styling */}
            <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-2xl shadow-xl border-2 border-gray-100 hover:shadow-2xl transition-shadow duration-300">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Send Us a Message</h2>
              <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
                Fill out the form below and we'll get back to you as soon as possible.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                    <Input
                      type="text"
                      required
                      className="w-full h-11 sm:h-12 text-sm sm:text-base border-2 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-lg transition-all duration-200 bg-white hover:border-gray-300"
                      placeholder="Enter your first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                    <Input
                      type="text"
                      required
                      className="w-full h-11 sm:h-12 text-sm sm:text-base border-2 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-lg transition-all duration-200 bg-white hover:border-gray-300"
                      placeholder="Enter your last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                  <Input
                    type="email"
                    required
                    className="w-full h-11 sm:h-12 text-sm sm:text-base border-2 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-lg transition-all duration-200 bg-white hover:border-gray-300"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject *</label>
                  <Input
                    type="text"
                    required
                    className="w-full h-11 sm:h-12 text-sm sm:text-base border-2 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-lg transition-all duration-200 bg-white hover:border-gray-300"
                    placeholder="What is this regarding?"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
                  <Textarea
                    required
                    className="w-full min-h-32 sm:min-h-36 resize-none text-sm sm:text-base border-2 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-lg transition-all duration-200 bg-white hover:border-gray-300"
                    placeholder="Please provide details about your inquiry..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                {hasMounted && (
                  <div className="bg-gradient-to-br from-teal-50 via-white to-teal-50 border-2 border-teal-300 rounded-xl p-4 sm:p-6 shadow-md relative overflow-hidden">
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-teal-100 rounded-full blur-2xl opacity-50"></div>
                    <div className="relative z-10">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-base sm:text-lg">Robot Verification</h3>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs sm:text-sm text-gray-700 font-medium">
                          Please solve this simple math problem to verify you're human:
                        </p>
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-2">
                          <div className="bg-white px-4 py-2 rounded-lg border-2 border-teal-200 shadow-sm">
                            <span className="text-base sm:text-lg font-bold text-gray-900">
                              {currentQuestion.question}
                            </span>
                          </div>
                          <span className="text-gray-500 font-semibold">=</span>
                          <Input
                            type="text"
                            value={verificationAnswer}
                            onChange={(e) => handleVerification(e.target.value)}
                            className={`w-20 sm:w-24 h-11 sm:h-12 text-center font-bold text-lg rounded-lg border-2 transition-all duration-200 shadow-sm ${
                              verificationAnswer
                                ? isVerified
                                  ? "border-green-500 bg-green-50 text-green-700 ring-2 ring-green-200"
                                  : "border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200"
                                : "border-gray-300 bg-white"
                            }`}
                            placeholder="?"
                          />
                          {verificationAnswer && (
                            <span
                              className={`text-sm sm:text-base font-bold px-3 py-1 rounded-full ${
                                isVerified
                                  ? "text-green-700 bg-green-100 border border-green-300"
                                  : "text-red-700 bg-red-100 border border-red-300"
                              }`}
                            >
                              {isVerified ? "✓ Correct" : "✗ Incorrect"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="privacy-consent"
                    required
                    className="mt-1 h-4 w-4 text-teal-600 rounded focus:ring-teal-500 flex-shrink-0 border-background bg-background"
                    style={{ accentColor: "#0d9488", backgroundColor: "#ffffff" }}
                  />
                  <label htmlFor="privacy-consent" className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    I agree to the{" "}
                    <Link href="/privacy-policy" className="text-teal-600 hover:text-teal-700 underline font-medium">
                      Privacy Policy
                    </Link>{" "}
                    and consent to the processing of my personal data for the purpose of responding to my inquiry. *
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={!isVerified || isSubmitting}
                  className={`w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 h-12 sm:h-14 relative overflow-hidden group ${
                    isVerified && !isSubmitting
                      ? "bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-[1.02]"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isVerified && !isSubmitting && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-all duration-700"></div>
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting
                      ? "Sending..."
                      : isVerified
                      ? <>
                          Send Message
                          <span className="transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                        </>
                      : "Complete Verification to Send"}
                  </span>
                </Button>
              </form>
            </div>

            {/* Support Information with enhanced styling */}
            <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-2xl shadow-xl border-2 border-gray-100 hover:shadow-2xl transition-shadow duration-300">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Support Information</h2>

              <div className="space-y-6 sm:space-y-8">
                {/* Response Time */}
                <div className="flex items-start space-x-3 sm:space-x-4 p-4 bg-gradient-to-br from-teal-50 to-white rounded-xl border border-teal-100">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">24/7 Response Time</h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                      Our email support services are available 24/7. We aim to respond to all inquiries within 24 hours.
                    </p>
                  </div>
                </div>

                {/* Data Protection */}
                <div className="flex items-start space-x-3 sm:space-x-4 p-4 bg-gradient-to-br from-teal-50 to-white rounded-xl border border-teal-100">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">Data Protection</h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                      For data protection inquiries, please mark your message as "Data Protection" in the subject line.
                      Our Data Protection Officer will review your request in accordance with applicable privacy laws.
                    </p>
                  </div>
                </div>
              </div>

              {/* Priority Support Notice with enhanced styling */}
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-5 sm:p-6 rounded-xl border-2 border-teal-200 mt-6 sm:mt-8 shadow-md">
                <h3 className="font-bold text-teal-900 mb-2 text-base sm:text-lg flex items-center gap-2">
                  <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                  Urgent Support
                </h3>
                <p className="text-teal-700 text-sm sm:text-base leading-relaxed">
                  For urgent technical issues, please mark your message as "Urgent" in the subject line. While we
                  process all inquiries as quickly as possible, this helps us prioritize time-sensitive matters.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-teal-600 py-4 sm:py-6 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-white">
            <Link href="/privacy-policy" className="hover:text-teal-200 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-services" className="hover:text-teal-200 transition-colors">
              Terms of Services
            </Link>
            <Link href="/return-policy" className="hover:text-teal-200 transition-colors">
              Return Policy
            </Link>
          </div>
          <div className="text-center mt-2 sm:mt-4 text-xs text-teal-100">
            © {new Date().getFullYear()} {settings.companyName || "TEMPNOW"}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}