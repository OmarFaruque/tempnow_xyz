"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Shield, AlertCircle, Clock, CheckCircle, FileText } from "lucide-react"
import { useState } from "react"
import { useSettings } from "@/context/settings"
import { Footer } from "@/components/footer"
import {Header} from "@/components/header"

export default function ReturnPolicyPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const settings = useSettings()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50 to-gray-100 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-teal-200 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-teal-300 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gray-200 rounded-full blur-3xl opacity-10"></div>
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, #0d9488 0px, transparent 1px, transparent 40px),
                            repeating-linear-gradient(90deg, #0d9488 0px, transparent 1px, transparent 40px)`,
          }}
        ></div>
      </div>

      {/* Mobile-Optimized Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-12 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl shadow-2xl overflow-hidden mb-8 relative">
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(circle at 20px 20px, white 2px, transparent 0)`,
                  backgroundSize: "40px 40px",
                }}
              ></div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl opacity-10"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400 rounded-full blur-3xl opacity-20"></div>

            <div className="relative z-10 px-6 sm:px-12 py-8 sm:py-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">Return Policy</h1>
                  <p className="text-teal-50 text-base sm:text-lg">Understanding your refund rights</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-xs sm:text-sm text-teal-50">Last Updated: {settings?.general?.effectiveDate ? new Date(settings.general.effectiveDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "11 November, 2025"}</div>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-6">
            {/* Section 1: Overview */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    1
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Policy Overview</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  This Return Policy governs the refund procedures for {settings?.general?.siteName || 'TEMPNOW'}'s digital document
                  services. Due to the digital nature of our services and immediate delivery model, we offer a{" "}
                  <strong>14-day money-back guarantee for technical issues only</strong>.
                </p>
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900 mb-1">Important Notice</p>
                      <p className="text-sm text-amber-800">
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
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    2
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">14-Day Money-Back Guarantee</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  We offer a <strong>14-day money-back guarantee</strong> if you experience any of the following
                  technical issues:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-900 mb-1">Download Failures</p>
                        <p className="text-sm text-green-800">
                          Unable to download your document despite multiple attempts
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-900 mb-1">Corrupted Files</p>
                        <p className="text-sm text-green-800">Document file is damaged or cannot be opened</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-900 mb-1">System Errors</p>
                        <p className="text-sm text-green-800">Platform errors preventing document generation</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-900 mb-1">Payment Issues</p>
                        <p className="text-sm text-green-800">Charged but document not delivered</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Non-Refundable Circumstances */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 border-b border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    3
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Non-Refundable Circumstances</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Refunds will <strong>NOT</strong> be provided for the following:
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
                    <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 4: Refund Request Process */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    4
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">How to Request a Refund</h2>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-5 border border-teal-200">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-teal-900 text-center mb-2">Step 1: Contact Us</h3>
                    <p className="text-sm text-teal-800 text-center">
                      Submit a request via our contact form within 14 days
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-5 border border-teal-200">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-teal-900 text-center mb-2">Step 2: Provide Details</h3>
                    <p className="text-sm text-teal-800 text-center">
                      Include order number and describe the technical issue
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-5 border border-teal-200">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-teal-900 text-center mb-2">Step 3: Review Process</h3>
                    <p className="text-sm text-teal-800 text-center">
                      We'll review and respond within 2-3 business days
                    </p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Processing Time:</strong> Approved refunds are processed within 5-7 business days to your
                    original payment method.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 5: UK Consumer Rights */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    5
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your UK Consumer Rights</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Under the Consumer Rights Act 2015, you are entitled to digital content that is:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-900 mb-1">Satisfactory Quality</p>
                        <p className="text-sm text-blue-800">
                          Digital content must meet a reasonable standard of quality
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-900 mb-1">Fit for Purpose</p>
                        <p className="text-sm text-blue-800">Suitable for its intended use and as described</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-900 mb-1">As Described</p>
                        <p className="text-sm text-blue-800">Matches the description provided at purchase</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mt-4">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Your Right to Remedy:</strong> If digital content is faulty, you have the right to:
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1 ml-4">
                    <li>• Request a repair or replacement (one opportunity given to fix the issue)</li>
                    <li>
                      • Request a full or partial refund if repair/replacement is impossible, disproportionate, or
                      unsuccessful
                    </li>
                    <li>• Claim compensation if faulty content damages your device or other digital content</li>
                  </ul>
                </div>
                <p className="text-xs text-gray-600 mt-4">
                  This policy complies with the Consumer Rights Act 2015 and the Consumer Contracts Regulations 2013. By
                  downloading digital content immediately upon purchase, you acknowledge that you waive the standard
                  14-day cooling-off period for distance purchases as permitted by law.
                </p>
              </div>
            </div>

            {/* Section 6: Payment Processor Compliance */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    6
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Payment Processing</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  We use third-party payment service providers to process transactions securely. All refunds are subject
                  to the terms and conditions of these payment processors. By making a purchase, you agree to comply
                  with the payment processor's terms of service and acceptable use policies.
                </p>
                <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-lg">
                  <p className="text-sm text-purple-800 mb-2">
                    <strong>Important Information:</strong>
                  </p>
                  <ul className="text-sm text-purple-800 space-y-1 ml-4">
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
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    7
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Dispute Resolution</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  If you have a dispute regarding a refund request, we encourage you to contact us first to resolve the
                  issue directly. We are committed to fair and prompt resolution of all customer concerns.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Alternative Dispute Resolution:</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    If we cannot resolve your complaint, you may refer your dispute to the appropriate Alternative
                    Dispute Resolution (ADR) provider or the Online Dispute Resolution (ODR) platform provided by the
                    European Commission for online purchases.
                  </p>
                </div>
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Limitation of Liability:</strong> Our total liability for any refund claim shall not exceed
                    the amount you paid for the document(s) in question. We are not liable for any indirect,
                    consequential, or incidental damages arising from the use or inability to use our services.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 8: Policy Changes and Governing Law */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    8
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Policy Changes and Governing Law</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Changes to This Policy</h3>
                  <p className="text-gray-700 leading-relaxed text-sm">
                    We reserve the right to update or modify this Return Policy at any time. Changes will be effective
                    immediately upon posting to our website. Your continued use of our services after any changes
                    constitutes acceptance of the updated policy. We recommend reviewing this policy periodically.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Governing Law and Jurisdiction</h3>
                  <p className="text-gray-700 leading-relaxed text-sm">
                    This Return Policy is provided by {settings?.general?.companyName || 'Mozero AI Ltd'}, a company registered in{" "}
                    England and Wales
                    under company number {settings?.general?.companyRegistration || '16644935'}, with its registered office at{" "}
                    {settings?.general?.companyAddress || '131 Finsbury Pavement, London, United Kingdom, EC2A 1NT'}. This policy and any disputes arising from it shall be governed by and
                    construed in accordance with the laws of England and Wales. Any legal proceedings shall be subject
                    to the exclusive jurisdiction of the courts of England and Wales, except where you are a consumer
                    with mandatory rights under the law of your country of residence.
                  </p>
                </div>
                <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                  <p className="text-xs text-teal-800">
                    <strong>Data Protection:</strong> All personal data collected during the refund process is handled
                    in accordance with our Privacy Policy and the UK GDPR. We retain refund records for accounting and
                    legal compliance purposes.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 9: Contact Information */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    9
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Contact Information</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  For refund requests or questions about this policy, please contact us via our website contact form. We
                  aim to respond to all inquiries within 2-3 business days.
                </p>
                <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                  <Link href="/contact">
                    <Button className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                      Contact Support for Refund Request
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}