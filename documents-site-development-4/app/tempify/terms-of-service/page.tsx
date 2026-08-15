"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Lock, Eye, Server, FileText, AlertCircle } from "lucide-react"
import { useState } from "react"

const COMPANY_CONFIG = {
  name: "Letterise Ltd (16875214)",
  registration: "Letterise Ltd (16875214)",
  refer: 'Letterise Ltd (16875214), trading as Tempify ("Tempify", "we," "us," or "our")',
  effectiveDate: "December 1, 2025",
  address: "128 City Road, London, United Kingdom, EC1V 2NX",
}

export default function TermsOfServicePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gray-800/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <header className="bg-black/50 backdrop-blur-md border-b border-orange-500/30 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center relative z-50">
        <div className="flex items-center">
          <Link href="/tempify">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent cursor-pointer hover:from-orange-300 hover:to-orange-500 transition-all">
              TEMPIFY
            </h1>
          </Link>
        </div>

        <div className="hidden md:flex gap-3">
          <Link href="/tempify/documents">
            <Button
              variant="outline"
              className="border-orange-500/50 text-white hover:bg-orange-500/10 hover:border-orange-400 bg-transparent"
            >
              Documents
            </Button>
          </Link>
          <Link href="/tempify/contact">
            <Button
              variant="outline"
              className="border-orange-500/50 text-white hover:bg-orange-500/10 hover:border-orange-400 bg-transparent"
            >
              Contact
            </Button>
          </Link>
          <Link href="/tempify/login">
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium">
              Sign In
            </Button>
          </Link>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-white hover:bg-orange-500/10 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md border-b border-orange-500/30 md:hidden z-50">
            <div className="px-4 py-3 space-y-2">
              <Link href="/tempify/documents" onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="outline"
                  className="w-full border-orange-500/50 text-white hover:bg-orange-500/10 hover:border-orange-400 bg-transparent justify-start h-12"
                >
                  Documents
                </Button>
              </Link>
              <Link href="/tempify/contact" onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="outline"
                  className="w-full border-orange-500/50 text-white hover:bg-orange-500/10 hover:border-orange-400 bg-transparent justify-start h-12"
                >
                  Contact
                </Button>
              </Link>
              <Link href="/tempify/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium justify-start h-12">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-12 relative z-10">
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl shadow-2xl overflow-hidden mb-8 relative border border-orange-500/20">
            <div className="absolute inset-0 opacity-5">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(circle at 20px 20px, rgb(6 182 212) 2px, transparent 0)`,
                  backgroundSize: "40px 40px",
                }}
              ></div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-400/10 rounded-full blur-3xl"></div>

            <div className="relative z-10 px-6 sm:px-12 py-8 sm:py-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-orange-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-orange-500/30">
                  <FileText className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                  <div className="inline-block px-4 py-1.5 bg-orange-500/20 backdrop-blur-sm rounded-full text-sm font-semibold text-orange-300 mb-2 border border-orange-500/30">
                    Legal Document
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Terms of Service</h1>
                  <p className="text-gray-400 mt-2 text-lg">Legal agreement governing use of our services</p>
                </div>
              </div>

              <div className="bg-orange-500/10 backdrop-blur-sm rounded-xl p-4 border border-orange-500/30">
                <div className="text-sm text-gray-300">Last Updated: {COMPANY_CONFIG.effectiveDate}</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Section 1 - Agreement Overview */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-800 overflow-hidden hover:shadow-2xl hover:border-orange-500/30 transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    1
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Agreement Overview</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  These Terms of Service ("Terms") constitute a legally binding agreement between you ("User,"
                  "Customer," "you," or "your") and {COMPANY_CONFIG.refer}, registered at {COMPANY_CONFIG.address}.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  By accessing, browsing, or using our digital document services, website, and related platforms
                  (collectively, the "Services"), you acknowledge that you have read, understood, and agree to be bound
                  by these Terms and our Privacy Policy.
                </p>
              </div>
            </div>

            {/* Section 2 - Service Description */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-800 overflow-hidden hover:shadow-2xl hover:border-orange-500/30 transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    2
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Service Description</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  Tempify provides digital documents and certificates for personal record-keeping purposes. Our
                  platform allows users to generate, customize, and download digital documents based on information they
                  provide.
                </p>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-amber-300 font-bold mb-2">Usage Limitations</h3>
                      <p className="text-amber-200 text-sm leading-relaxed">
                        All documents provided by Tempify are strictly for personal use only. These documents have no
                        legal validity and cannot be used in any legal proceedings, official matters, or court cases.
                        They are intended solely for personal record-keeping and informational purposes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {[
                    {
                      icon: <FileText className="w-6 h-6 text-orange-400" />,
                      title: "Digital Documents",
                      desc: "Personal digital documents for record-keeping",
                    },
                    {
                      icon: <Lock className="w-6 h-6 text-orange-400" />,
                      title: "Instant Generation",
                      desc: "Real-time document creation and delivery",
                    },
                    {
                      icon: <Eye className="w-6 h-6 text-orange-400" />,
                      title: "Quick Access",
                      desc: "Immediate document download",
                    },
                    {
                      icon: <Server className="w-6 h-6 text-orange-400" />,
                      title: "Secure Processing",
                      desc: "Protected payment and data handling",
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-800/50 border-2 border-orange-500/20 rounded-xl p-5 hover:border-orange-500/40 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        {item.icon}
                        <h3 className="font-semibold text-white">{item.title}</h3>
                      </div>
                      <p className="text-sm text-gray-400">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-900/20 border-l-4 border-amber-500 rounded-r-xl p-6 border border-amber-500/30">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-6 h-6 text-amber-400" />
                    <div>
                      <h3 className="font-bold text-amber-300 mb-2">Important Service Information</h3>
                      <p className="text-sm text-amber-200/80 mb-2">
                        <strong>Document Generation:</strong> All documents are generated based on the information you
                        provide.
                      </p>
                      <p className="text-sm text-amber-200/80">
                        <strong>Regulatory Compliance:</strong> Our Services comply with UK document generation
                        regulations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 - Cover Note-Style Templates Disclaimer */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-red-800 overflow-hidden hover:shadow-2xl hover:border-red-500/50 transition-all duration-300">
              <div className="bg-gradient-to-r from-red-900 to-red-800 px-6 py-4 border-b border-red-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    3
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Cover Note-Style Templates Disclaimer</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-red-900/30 border-2 border-red-500/50 rounded-xl p-6 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-red-300 text-lg mb-4">
                        CRITICAL NOTICE: AI-Generated Templates Only
                      </h3>
                      <div className="space-y-4 text-red-200/90">
                        <p className="font-semibold text-base">
                          Tempify provides ONLY AI-generated document templates for personal record-keeping purposes.
                          These documents are NOT official insurance documents and have NO legal validity whatsoever.
                        </p>

                        <div className="bg-red-950/50 rounded-lg p-4 border border-red-500/30">
                          <h4 className="font-bold text-red-300 mb-3">What Our Documents Are NOT:</h4>
                          <ul className="space-y-2 text-sm">
                            <li>
                              • <strong>NOT official insurance documents</strong> - These are templates only
                            </li>
                            <li>
                              • <strong>NOT FCA-regulated</strong> - We are not an insurance provider or intermediary
                            </li>
                            <li>
                              • <strong>NOT legally valid</strong> - Cannot be used for any legal purposes
                            </li>
                            <li>
                              • <strong>NOT acceptable for official use</strong> - Not valid for DVLA, police, or any
                              government body
                            </li>
                            <li>
                              • <strong>NOT proof of insurance</strong> - Do not represent actual insurance coverage
                            </li>
                            <li>
                              • <strong>NOT enforceable</strong> - Have no legal standing in any jurisdiction
                            </li>
                          </ul>
                        </div>

                        <div className="bg-red-950/50 rounded-lg p-4 border border-red-500/30">
                          <h4 className="font-bold text-red-300 mb-3">Strict Usage Limitations:</h4>
                          <ul className="space-y-2 text-sm">
                            <li>
                              • Documents are for <strong>personal record-keeping ONLY</strong>
                            </li>
                            <li>
                              • Cannot be presented to law enforcement, government agencies, or insurance companies
                            </li>
                            <li>• Cannot be used to represent actual insurance coverage</li>
                            <li>• Cannot be used in any legal proceedings or court cases</li>
                            <li>• Cannot be used for vehicle registration, MOT, or roadworthiness purposes</li>
                            <li>• Cannot be used to comply with legal insurance requirements</li>
                          </ul>
                        </div>

                        <div className="bg-red-950/70 rounded-lg p-5 border-2 border-red-400">
                          <h4 className="font-bold text-red-200 text-base mb-3 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Fraud and Misrepresentation Warning
                          </h4>
                          <p className="text-sm text-red-100 font-semibold mb-3">
                            Using these documents for misrepresentation, fraud, or to falsely claim insurance coverage
                            is ILLEGAL and may result in:
                          </p>
                          <ul className="space-y-2 text-sm text-red-100">
                            <li>• Criminal prosecution under fraud legislation</li>
                            <li>• Driving without insurance charges (if used as false proof)</li>
                            <li>• Substantial fines and penalties</li>
                            <li>• Imprisonment in serious cases</li>
                            <li>• Criminal record</li>
                            <li>• Immediate termination of service and legal action by Tempify</li>
                          </ul>
                        </div>

                        <div className="bg-amber-900/30 rounded-lg p-5 border border-amber-500/50">
                          <h4 className="font-bold text-amber-300 text-base mb-3">Required User Understanding:</h4>
                          <p className="text-sm text-amber-200 mb-3">
                            By using Tempify services, you explicitly acknowledge and confirm that you understand:
                          </p>
                          <ul className="space-y-2 text-sm text-amber-200">
                            <li>✓ These are AI-generated templates, not official documents</li>
                            <li>✓ They have zero legal validity or enforceability</li>
                            <li>✓ They cannot be used for any official, legal, or regulatory purpose</li>
                            <li>✓ Using them fraudulently is a criminal offense</li>
                            <li>✓ You are solely responsible for any misuse</li>
                            <li>✓ Tempify bears no liability for any consequences of use or misuse</li>
                            <li>✓ You must obtain proper insurance from FCA-regulated providers for legal coverage</li>
                          </ul>
                        </div>

                        <p className="text-red-100 font-bold text-base pt-3 border-t-2 border-red-500/50">
                          IF YOU DO NOT FULLY UNDERSTAND OR ACCEPT THESE LIMITATIONS, DO NOT USE OUR SERVICES.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4 - Payment Terms */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-800 overflow-hidden hover:shadow-2xl hover:border-orange-500/30 transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    4
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Payment Terms</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-amber-900/20 border-l-4 border-amber-500 rounded-r-xl p-6 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-6 h-6 text-amber-400" />
                    <div>
                      <h3 className="font-bold text-amber-300 mb-3">Third-Party Payment Processing</h3>
                      <p className="text-sm text-amber-200/80 mb-3">
                        Payments are processed by secure third-party payment service providers. By making a purchase,
                        you agree to the following:
                      </p>
                      <ul className="space-y-2 text-sm text-amber-200/80">
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
                  <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-500/30 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-green-300 mb-3 flex items-center">
                      <span className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-xs mr-2">
                        £
                      </span>
                      Pricing Structure
                    </h3>
                    <p className="text-sm text-green-200/80 leading-relaxed mb-3">
                      Our digital document services are priced based on document type and quantity. Current pricing is
                      displayed during the generation process. All prices include applicable taxes where required.
                    </p>
                    <p className="text-xs text-green-200/70">
                      We reserve the right to modify pricing based on demand and service requirements. Prices confirmed
                      at checkout will apply to your document order.
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-500/30 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-purple-300 mb-3 flex items-center">
                      <span className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white text-xs mr-2">
                        ✓
                      </span>
                      Payment Requirements
                    </h3>
                    <ul className="space-y-2 text-sm text-purple-200/80">
                      <li>• Payment required before document generation</li>
                      <li>• Secure third-party payment processing</li>
                      <li>• All major credit and debit cards accepted</li>
                      <li>• Immediate payment confirmation</li>
                      <li>• Refunds subject to cancellation policy</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5 - User Obligations & Acceptable Use */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-800 overflow-hidden hover:shadow-2xl hover:border-orange-500/30 transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    5
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">User Obligations & Acceptable Use</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-red-900/20 border-2 border-red-500/30 rounded-xl p-6 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                    <div>
                      <h3 className="font-bold text-red-300 mb-3">User Responsibilities</h3>
                      <p className="text-sm text-red-200/80 mb-3 font-semibold">You expressly agree that you will:</p>
                      <ul className="space-y-2 text-sm text-red-200/80">
                        <li>• Provide accurate and truthful information in all document requests</li>
                        <li>• Comply with all terms and conditions of document generation</li>
                        <li>• Use the documents only for lawful purposes</li>
                        <li>• Notify us immediately of any changes to the information provided</li>
                        <li>• Not make fraudulent requests or misrepresent facts</li>
                      </ul>
                      <p className="text-sm text-red-300 font-bold mt-4">
                        VIOLATION OF THESE OBLIGATIONS MAY RESULT IN DOCUMENT REVOCATION AND LEGAL ACTION.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6 - Limitation of Liability */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-800 overflow-hidden hover:shadow-2xl hover:border-orange-500/30 transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    6
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Limitation of Liability</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, {COMPANY_CONFIG.name} SHALL NOT BE LIABLE FOR ANY INDIRECT,
                  INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF OUR SERVICES.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Our liability is limited to the amount paid for the specific document order in question. We are not
                  liable for any errors in the generated documents or for any losses resulting from their use.
                </p>
              </div>
            </div>

            {/* Section 7 - Contact Us */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-800 overflow-hidden hover:shadow-2xl hover:border-orange-500/30 transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    7
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Contact Us</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  If you have any questions, concerns, or inquiries regarding these Terms of Service, please contact us
                  through our contact form.
                </p>
                <Link href="/tempify/contact">
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-black border-t border-gray-800 py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tighter">
                <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  TEMPIFY
                </span>
              </h2>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <Link href="/tempify/privacy-policy" className="text-gray-500 hover:text-orange-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/tempify/terms-of-service" className="text-gray-500 hover:text-orange-400 transition-colors">
                Terms of Service
              </Link>
              <Link href="/tempify/return-policy" className="text-gray-500 hover:text-orange-400 transition-colors">
                Return Policy
              </Link>
            </div>
            <p className="text-gray-500 text-sm">© 2025 Tempify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
