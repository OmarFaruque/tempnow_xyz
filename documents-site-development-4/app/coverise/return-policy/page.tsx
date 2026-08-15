"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Shield, AlertCircle, Clock, CheckCircle, FileText } from "lucide-react"
import { useState } from "react"

const COMPANY_CONFIG = {
  name: "Letterise Ltd (16875214)",
  address: "128 City Road, London, United Kingdom, EC1V 2NX",
  jurisdiction: "England and Wales",
  siteName: "COVERISE",
  lastUpdated: "January 2025",
}

export default function ReturnPolicyPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-cyan-500/20 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center relative z-50">
        <div className="flex items-center">
          <Link href="/coverise">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent cursor-pointer hover:from-cyan-300 hover:to-cyan-500 transition-all">
              {COMPANY_CONFIG.siteName}
            </h1>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-3">
          <Link href="/coverise/documents">
            <Button variant="ghost" className="text-gray-300 hover:text-cyan-400 hover:bg-cyan-500/10">
              Documents
            </Button>
          </Link>
          <Link href="/coverise/contact">
            <Button variant="ghost" className="text-gray-300 hover:text-cyan-400 hover:bg-cyan-500/10">
              Contact
            </Button>
          </Link>
          <Link href="/coverise/login">
            <Button className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white">
              Sign In
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-lg border-b border-cyan-500/20 md:hidden z-50">
            <div className="px-4 py-3 space-y-2">
              <Link href="/coverise/documents" onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full text-gray-300 hover:text-cyan-400 hover:bg-cyan-500/10 justify-start h-12"
                >
                  Documents
                </Button>
              </Link>
              <Link href="/coverise/contact" onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full text-gray-300 hover:text-cyan-400 hover:bg-cyan-500/10 justify-start h-12"
                >
                  Contact
                </Button>
              </Link>
              <Link href="/coverise/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white justify-start h-12">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-12 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-gray-900 to-black border border-cyan-500/20 rounded-2xl shadow-2xl overflow-hidden mb-8 relative">
            <div className="absolute inset-0 opacity-5">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(circle at 20px 20px, cyan 2px, transparent 0)`,
                  backgroundSize: "40px 40px",
                }}
              ></div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500 rounded-full blur-3xl opacity-10"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400 rounded-full blur-3xl opacity-10"></div>

            <div className="relative z-10 px-6 sm:px-12 py-8 sm:py-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-cyan-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-cyan-500/30">
                  <Shield className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">Return Policy</h1>
                  <p className="text-gray-400 text-base sm:text-lg">Understanding your refund rights</p>
                </div>
              </div>

              <div className="bg-cyan-500/10 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/20">
                <div className="text-xs sm:text-sm text-gray-400">Last Updated: {COMPANY_CONFIG.lastUpdated}</div>
              </div>
            </div>
          </div>

          {/* Introduction */}
          <div className="mb-8">
            <p className="text-gray-300 leading-relaxed">
              This Return Policy applies to all purchases of digital documents from Coverise.
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-6">
            {/* Section 1: Policy Overview */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-800 overflow-hidden hover:border-cyan-500/30 transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    1
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Policy Overview</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  This Return Policy governs the refund procedures for {COMPANY_CONFIG.siteName}'s digital document
                  services. Due to the digital nature of our services and immediate delivery model, we offer a{" "}
                  <strong className="text-cyan-400">14-day money-back guarantee for technical issues only</strong>.
                </p>
                <div className="bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-400 mb-1">Important Notice</p>
                      <p className="text-sm text-gray-400">
                        Refunds are only provided for technical issues such as download failures, corrupted files, or
                        system errors. Change of mind or dissatisfaction with content quality are not eligible for
                        refunds.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: 14-Day Guarantee */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-800 overflow-hidden hover:border-cyan-500/30 transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    2
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">14-Day Money-Back Guarantee</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  We offer a <strong className="text-cyan-400">14-day money-back guarantee</strong> if you experience
                  any of the following technical issues:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-400 mb-1">Download Failures</p>
                        <p className="text-sm text-gray-400">
                          Unable to download your document despite multiple attempts
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-400 mb-1">Corrupted Files</p>
                        <p className="text-sm text-gray-400">Document file is damaged or cannot be opened</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-400 mb-1">System Errors</p>
                        <p className="text-sm text-gray-400">Platform errors preventing document generation</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-400 mb-1">Payment Issues</p>
                        <p className="text-sm text-gray-400">Charged but document not delivered</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Non-Refundable Circumstances */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-800 overflow-hidden hover:border-cyan-500/30 transition-all duration-300">
              <div className="bg-gradient-to-r from-red-900/50 to-red-800/30 px-6 py-4 border-b border-red-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    3
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Non-Refundable Circumstances</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-300 leading-relaxed mb-4">
                  Refunds will <strong className="text-red-400">NOT</strong> be provided for the following:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "Change of mind after successful delivery",
                    "Dissatisfaction with document content or quality",
                    "User errors in input specifications",
                    "Misunderstanding of service features",
                    "Requests submitted after 14-day window",
                    "Documents already successfully downloaded",
                    "Compatibility issues with user devices",
                    "Alternative service preferences",
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-gray-400">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 4: Refund Request Process */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-800 overflow-hidden hover:border-cyan-500/30 transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    4
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">How to Request a Refund</h2>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/20 rounded-xl p-5 border border-cyan-700/30">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-cyan-400 text-center mb-2">Step 1: Contact Us</h3>
                    <p className="text-sm text-gray-400 text-center">
                      Submit a request via our contact form within 14 days
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/20 rounded-xl p-5 border border-cyan-700/30">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-cyan-400 text-center mb-2">Step 2: Provide Details</h3>
                    <p className="text-sm text-gray-400 text-center">
                      Include order number and describe the technical issue
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/20 rounded-xl p-5 border border-cyan-700/30">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-cyan-400 text-center mb-2">Step 3: Review Process</h3>
                    <p className="text-sm text-gray-400 text-center">
                      We'll review and respond within 2-3 business days
                    </p>
                  </div>
                </div>
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                  <p className="text-sm text-gray-400">
                    <strong className="text-blue-400">Processing Time:</strong> Approved refunds are processed within
                    5-7 business days to your original payment method.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 5: UK Consumer Rights */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-800 overflow-hidden hover:border-cyan-500/30 transition-all duration-300">
              <div className="bg-gradient-to-r from-blue-900/50 to-blue-800/30 px-6 py-4 border-b border-blue-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    5
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Your UK Consumer Rights</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  Under the Consumer Rights Act 2015, you are entitled to digital content that is:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-400 mb-1">Satisfactory Quality</p>
                        <p className="text-sm text-gray-400">
                          Digital content must meet a reasonable standard of quality
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-400 mb-1">Fit for Purpose</p>
                        <p className="text-sm text-gray-400">Suitable for its intended use and as described</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-400 mb-1">As Described</p>
                        <p className="text-sm text-gray-400">Matches the description provided at purchase</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg mt-4">
                  <p className="text-sm text-gray-400 mb-2">
                    <strong className="text-blue-400">Your Right to Remedy:</strong> If digital content is faulty, you
                    have the right to a repair or replacement. If this isn't possible or takes too long, you can get a
                    price reduction or a full refund.
                  </p>
                  <p className="text-sm text-gray-400">
                    These rights apply for up to 6 years from the date of purchase (5 years in Scotland).
                  </p>
                </div>
              </div>
            </div>

            {/* Section 6: Payment Processing */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-800 overflow-hidden hover:border-cyan-500/30 transition-all duration-300">
              <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/30 px-6 py-4 border-b border-purple-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    6
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Payment Processing</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  We use third-party payment service providers to process transactions securely. All refunds are subject
                  to the terms and conditions of these payment processors. By making a purchase, you agree to comply
                  with the payment processor's terms of service and acceptable use policies.
                </p>
                <div className="bg-purple-900/20 border-l-4 border-purple-500 p-4 rounded-r-lg">
                  <p className="text-sm text-purple-400 mb-2">
                    <strong>Important Information:</strong>
                  </p>
                  <ul className="text-sm text-gray-400 space-y-1 ml-4">
                    <li>• Refunds are processed through the same payment method used for the original purchase</li>
                    <li>
                      • Processing times may vary depending on your payment provider (typically 5-10 business days)
                    </li>
                    <li>
                      • We reserve the right to refuse refunds for suspected fraudulent activity or abuse of our refund
                      policy
                    </li>
                    <li>• Payment processors may apply their own dispute resolution procedures</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 7: Dispute Resolution */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-800 overflow-hidden hover:border-cyan-500/30 transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    7
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Dispute Resolution</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  If you have a dispute regarding a refund request, we encourage you to contact us first to resolve the
                  issue directly. We are committed to fair and prompt resolution of all customer concerns.
                </p>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <p className="text-sm text-gray-300 mb-2">
                    <strong>Alternative Dispute Resolution:</strong>
                  </p>
                  <p className="text-sm text-gray-400">
                    If we cannot resolve your complaint, you may refer your dispute to the appropriate Alternative
                    Dispute Resolution (ADR) provider or the Online Dispute Resolution (ODR) platform provided by the
                    European Commission for online purchases.
                  </p>
                </div>
                <div className="bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg">
                  <p className="text-sm text-gray-400">
                    <strong className="text-amber-400">Limitation of Liability:</strong> Our total liability for any
                    refund claim shall not exceed the amount you paid for the document(s) in question. We are not liable
                    for any indirect, consequential, or incidental damages arising from the use or inability to use our
                    services.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 8: Policy Changes and Governing Law */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-800 overflow-hidden hover:border-cyan-500/30 transition-all duration-300">
              <div className="bg-gradient-to-r from-teal-900/50 to-teal-800/30 px-6 py-4 border-b border-teal-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    8
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Policy Changes and Governing Law</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Changes to This Policy</h3>
                  <p className="text-gray-300 leading-relaxed text-sm">
                    We reserve the right to update or modify this Return Policy at any time. Changes will be effective
                    immediately upon posting to our website. Your continued use of our services after any changes
                    constitutes acceptance of the updated policy. We recommend reviewing this policy periodically.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Governing Law and Jurisdiction</h3>
                  <p className="text-gray-300 leading-relaxed text-sm">
                    This Return Policy is provided by {COMPANY_CONFIG.name}, a company registered in{" "}
                    {COMPANY_CONFIG.jurisdiction}, with its registered office at {COMPANY_CONFIG.address}. This policy
                    and any disputes arising from it shall be governed by and construed in accordance with the laws of
                    England and Wales. Any legal proceedings shall be subject to the exclusive jurisdiction of the
                    courts of England and Wales, except where you are a consumer with mandatory rights under the law of
                    your country of residence.
                  </p>
                </div>
                <div className="bg-teal-900/20 rounded-lg p-4 border border-teal-700/30">
                  <p className="text-xs text-gray-400">
                    <strong className="text-teal-400">Data Protection:</strong> All personal data collected during the
                    refund process is handled in accordance with our Privacy Policy and the UK GDPR. We retain refund
                    records for accounting and legal compliance purposes.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 9: Contact Information */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-800 overflow-hidden hover:border-cyan-500/30 transition-all duration-300">
              <div className="bg-gradient-to-r from-teal-900/50 to-teal-800/30 px-6 py-4 border-b border-teal-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    9
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Contact Information</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  For refund requests or questions about this policy, please contact us via our website contact form. We
                  aim to respond to all inquiries within 2-3 business days.
                </p>
                <div className="bg-teal-900/20 rounded-lg p-4 border border-teal-700/30">
                  <a href="/coverise/contact">
                    <Button className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                      Contact Support for Refund Request
                    </Button>
                  </a>
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
