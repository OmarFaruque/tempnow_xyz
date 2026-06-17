"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Shield, Lock, Eye, Server, FileText, AlertCircle } from "lucide-react"
import { useState } from "react"
import { useSettings } from "@/context/settings"
import { Footer } from "@/components/footer"
import {Header} from "@/components/header"

export default function TermsOfServicesPage() {
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

      <Header />

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-12 relative z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-teal-50 to-gray-100"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-100 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-teal-300 rounded-full blur-3xl opacity-20"></div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(20 184 166) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        ></div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl shadow-2xl overflow-hidden mb-8 relative">
            {/* Decorative elements */}
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
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-300 rounded-full blur-3xl opacity-20"></div>

            <div className="relative z-10 px-6 sm:px-12 py-8 sm:py-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold text-white mb-2">
                    Legal Document
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Terms of Service</h1>
                  <p className="text-teal-100 mt-2 text-lg">Legal agreement governing use of our services</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-sm text-teal-50">Last Updated: {settings?.general?.effectiveDate ? new Date(settings.general.effectiveDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "11 November, 2025"}</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Section 1 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    1
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Agreement Overview</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-800 leading-relaxed">
                  These Terms of Service ("Terms") constitute a legally binding agreement between you ("User,"
                  "Customer," "you," or "your") and {settings?.general?.companyName || 'Mozero AI Ltd'} ({settings?.general?.aliases || '"Mozero", "Tempnow," "we," "us," or "our"'}).
                </p>
                <p className="text-gray-700 text-sm leading-relaxed">
                  By accessing, browsing, or using our artificial intelligence-powered document generation services,
                  website, and related platforms (collectively, the "Services"), you acknowledge that you have read,
                  understood, and agree to be bound by these Terms and our Privacy Policy.
                </p>
              </div>
            </div>

            {/* Section 2 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    2
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Service Description</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {[
                    {
                      icon: <Shield className="w-6 h-6 text-teal-600" />,
                      title: "AI-Powered Generation",
                      desc: "Advanced document creation technology",
                    },
                    {
                      icon: <Lock className="w-6 h-6 text-teal-600" />,
                      title: "Professional Formatting",
                      desc: "Industry-standard document templates",
                    },
                    {
                      icon: <Eye className="w-6 h-6 text-teal-600" />,
                      title: "Instant Delivery",
                      desc: "Immediate PDF generation and download",
                    },
                    {
                      icon: <Server className="w-6 h-6 text-teal-600" />,
                      title: "Secure Processing",
                      desc: "Protected payment and data handling",
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white border-2 border-teal-100 rounded-xl p-5 hover:border-teal-300 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        {item.icon}
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-6 h-6 text-amber-900" />
                    <div>
                      <h3 className="font-bold text-amber-900 mb-2">Important Service Limitations</h3>
                      <p className="text-sm text-amber-800 mb-2">
                        <strong>Educational and Reference Use Only:</strong> All generated documents are intended for
                        reference, educational, and informational purposes only.
                      </p>
                      <p className="text-sm text-amber-800">
                        <strong>No Professional Advice:</strong> Our Services do not constitute legal, financial,
                        medical, or professional advice of any kind.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    3
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Payment Terms</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-6 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-6 h-6 text-amber-900" />
                    <div>
                      <h3 className="font-bold text-amber-900 mb-2">Third-Party Payment Processing</h3>
                      <p className="text-sm text-amber-800 mb-3">
                        Payments are processed by secure third-party payment service providers. By making a purchase,
                        you agree to the following:
                      </p>
                      <ul className="space-y-2 text-sm text-amber-800">
                        <li>
                          • You accept and agree to be bound by our payment processors' services agreements and terms of
                          service
                        </li>
                        <li>
                          • Payment processing is subject to the terms, conditions, and privacy policies of these
                          payment processors
                        </li>
                        <li>• We do not store complete payment card details on our servers</li>
                        <li>• All payment information is transmitted securely and encrypted</li>
                        <li>
                          • You authorize us to share transaction data with our payment processors for fraud prevention
                          and payment processing
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center">
                      <span className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-xs mr-2">
                        $
                      </span>
                      Pricing Structure
                    </h3>
                    <p className="text-sm text-green-800 leading-relaxed mb-3">
                      Our AI document generation services are offered on a per-document basis. Current pricing is
                      displayed on our website at the time of purchase. All prices exclude applicable VAT and taxes.
                    </p>
                    <p className="text-xs text-green-700">
                      We reserve the right to modify pricing at any time. Prices in effect at the time of your purchase
                      will apply to that transaction.
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center">
                      <span className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white text-xs mr-2">
                        ✓
                      </span>
                      Payment Requirements
                    </h3>
                    <ul className="space-y-2 text-sm text-purple-800">
                      <li>• Payment required before document download</li>
                      <li>• Secure third-party payment processing</li>
                      <li>• All major credit and debit cards accepted</li>
                      <li>• Immediate payment confirmation</li>
                      <li>• No refunds except for technical issues (see Refund Policy)</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-bold text-blue-900 mb-3">Taxes and VAT</h4>
                  <p className="text-sm text-blue-800">
                    Prices displayed may not include applicable taxes, VAT, or other government-imposed charges. You are
                    responsible for all applicable taxes related to your purchase. Our payment processor will calculate
                    and collect appropriate taxes based on your billing location at checkout.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    4
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">User Obligations & Acceptable Use</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-6 h-6 text-red-900" />
                    <div>
                      <h3 className="font-bold text-red-900 mb-3">Strict Prohibition on Fraudulent Activities</h3>
                      <p className="text-sm text-red-800 mb-3 font-semibold">
                        You expressly agree that you will NOT use our Services to:
                      </p>
                      <ul className="space-y-2 text-sm text-red-800">
                        <li>• Create, generate, or produce any fraudulent, deceptive, or misleading documents</li>
                        <li>• Forge official documents, certificates, licenses, or government-issued materials</li>
                        <li>• Impersonate any person, entity, or government organization</li>
                        <li>• Facilitate any illegal activity, money laundering, or financial fraud</li>
                        <li>• Circumvent fraud detection or risk monitoring systems</li>
                        <li>• Violate any applicable laws, regulations, or third-party rights</li>
                        <li>
                          • Create documents for use in legal proceedings without proper professional consultation
                        </li>
                      </ul>
                      <p className="text-sm text-red-900 font-bold mt-4">
                        VIOLATION OF THESE PROHIBITIONS MAY RESULT IN IMMEDIATE ACCOUNT TERMINATION, LEGAL ACTION, AND
                        REPORTING TO LAW ENFORCEMENT.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border-2 border-green-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center">
                      <span className="text-2xl mr-2">✓</span>
                      Permitted Uses
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 mt-2"></span>
                        Educational and reference purposes
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 mt-2"></span>
                        Personal learning and development
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 mt-2"></span>
                        Business reference and internal documentation
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 mt-2"></span>
                        Compliance with all applicable laws and regulations
                      </li>
                    </ul>
                  </div>
                  <div className="bg-white border-2 border-red-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center">
                      <span className="text-2xl mr-2">✗</span>
                      Prohibited Activities
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 mt-2"></span>
                        Creating illegal, fraudulent, or harmful content
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 mt-2"></span>
                        Reverse engineering or copying our technology
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 mt-2"></span>
                        Generating documents for deceptive purposes
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 mt-2"></span>
                        Automated or bulk document generation without authorization
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    5
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Data Protection & Privacy</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-bold text-purple-900 mb-3">UK GDPR Compliance</h3>
                  <p className="text-sm text-purple-800 leading-relaxed mb-3">
                    We process your personal data in accordance with the UK General Data Protection Regulation (UK GDPR)
                    and the Data Protection Act 2018. Our full Privacy Policy is available on our website and governs
                    how we collect, use, store, and protect your information.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-semibold text-purple-900 mb-2">Your Rights</h4>
                      <ul className="text-xs text-purple-800 space-y-1">
                        <li>• Right to access your data</li>
                        <li>• Right to rectification</li>
                        <li>• Right to erasure</li>
                        <li>• Right to data portability</li>
                        <li>• Right to object to processing</li>
                      </ul>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-semibold text-purple-900 mb-2">Our Commitments</h4>
                      <ul className="text-xs text-purple-800 space-y-1">
                        <li>• Secure data storage and encryption</li>
                        <li>• Limited data retention periods</li>
                        <li>• Transparent data processing</li>
                        <li>• No sale of personal data</li>
                        <li>• Secure payment processing</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-bold text-blue-900 mb-3">Data Sharing with Payment Processors</h4>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    To process payments securely, we share necessary transaction data with our third-party payment
                    service providers. This data sharing is essential for payment processing, fraud prevention, and
                    compliance with financial regulations. Our payment processors maintain their own privacy policies
                    and data protection standards.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 6 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    6
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Intellectual Property</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-6 border border-indigo-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                        <span className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-xs mr-2">
                          ©
                        </span>
                        We Own
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li>• AI algorithms and technology</li>
                        <li>• Platform software</li>
                        <li>• Brand and trademarks</li>
                        <li>• Website design</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                        <span className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center text-white text-xs mr-2">
                          ✓
                        </span>
                        You Own
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li>• Your input content</li>
                        <li>• Generated documents (subject to Terms)</li>
                        <li>• Your account data</li>
                        <li>• Usage rights to content</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 7 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    7
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Refunds & Returns</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-orange-900 mb-3">14-Day Money-Back Guarantee</h3>
                  <p className="text-sm text-orange-800 leading-relaxed mb-3">
                    We offer refunds within 14 days of purchase <strong>only for technical issues</strong> such as:
                  </p>
                  <ul className="space-y-2 text-sm text-orange-800 mb-4">
                    <li>• Download failures or corrupted files</li>
                    <li>• System errors preventing document access</li>
                    <li>• Payment processing errors resulting in duplicate charges</li>
                  </ul>
                  <p className="text-sm text-orange-900 font-semibold">
                    Refunds are NOT available for change of mind, dissatisfaction with content, or user error. All
                    refund requests must be submitted through our contact form with evidence of the technical issue.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 8 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    8
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Disclaimers & Limitations</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 border-2 border-red-200 rounded-2xl p-6 sm:p-8 shadow-lg">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl">
                      <AlertCircle className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-red-900 mb-2">Important Legal Disclaimers</h3>
                      <p className="text-sm text-red-700">
                        Please read these limitations carefully as they affect your legal rights
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-l-4 border-red-500 shadow-md hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-red-600 font-bold text-lg">1</span>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">Service Warranty Disclaimer</h4>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed ml-11">
                        Our Services are provided <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> without
                        warranties of any kind, whether express or implied, including but not limited to warranties of
                        merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that
                        the Services will be uninterrupted, error-free, or completely secure.
                      </p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-l-4 border-orange-500 shadow-md hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-orange-600 font-bold text-lg">2</span>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">Limitation of Liability</h4>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed ml-11">
                        To the maximum extent permitted by law, we shall not be liable for any indirect, incidental,
                        special, consequential, or punitive damages, including but not limited to loss of profits, data,
                        use, goodwill, or other intangible losses resulting from your access to or use of (or inability
                        to access or use) the Services.
                      </p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-l-4 border-amber-500 shadow-md hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-amber-600 font-bold text-lg">3</span>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">Maximum Liability Cap</h4>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed ml-11">
                        Our total aggregate liability to you for all claims arising out of or relating to these Terms or
                        your use of the Services shall not exceed the amount you paid to us in the twelve (12) months
                        preceding the claim, or <strong>£100 (GBP)</strong>, whichever is greater.
                      </p>
                    </div>

                    <div className="bg-red-100/50 border border-red-300 rounded-xl p-5 mt-6">
                      <p className="text-xs text-red-800 leading-relaxed">
                        <strong>Note:</strong> Some jurisdictions do not allow the exclusion of certain warranties or
                        the limitation of liability for incidental or consequential damages. In such jurisdictions, our
                        liability will be limited to the greatest extent permitted by law.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 9 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    9
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Termination & Suspension</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <p className="text-sm text-red-800 leading-relaxed mb-4">
                    We reserve the right to immediately suspend or terminate your access to our Services, without prior
                    notice or liability, for any reason, including but not limited to:
                  </p>
                  <ul className="space-y-2 text-sm text-red-800 mb-4">
                    <li>• Breach of these Terms of Service</li>
                    <li>• Violation of our Acceptable Use Policy</li>
                    <li>• Suspected fraudulent or illegal activity</li>
                    <li>• Payment disputes or chargebacks</li>
                    <li>• Risk to our systems, users, or business operations</li>
                  </ul>
                  <p className="text-sm text-red-900 font-semibold">
                    Upon termination, your right to use the Services will immediately cease. We may retain certain data
                    as required by law or for legitimate business purposes.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 10 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    10
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Contact Information</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-700 leading-relaxed mb-4">
                  For questions regarding these Terms, legal matters, or compliance issues, please contact us through
                  our website contact form and mark your inquiry as "Legal" or "Terms of Service."
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  These Terms are entered into by and between you and {settings?.general?.companyName || 'Mozero AI Ltd'}, a company registered in
                  England and Wales (Company No. {settings?.general?.companyRegistration || '16644935'}), with its registered office at{" "}
                  {settings?.general?.companyAddress || '131 Finsbury Pavement, London, United Kingdom, EC2A 1NT'}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      
        <Footer />
      
    </div>
  )
}