"use client"

const COMPANY_CONFIG = {
  name: "Letterise Ltd (16875214)",
  registration: "16644935",
  country: "England and Wales",
  address: "128 City Road, London, EC1V 2NX",
  siteName: "gosure.io",
  refer: 'Letterise Ltd (16875214), trading as Gosure ("Gosure," "we," "us," or "our")',
  lastUpdated: "11 November, 2025",
}

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Shield, Eye, Server, FileText, Database, UserCheck } from "lucide-react"
import { useState } from "react"

export default function GosurePrivacyPolicyPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="bg-black/95 backdrop-blur-sm border-b border-yellow-500/50 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shadow-lg relative">
        <div className="flex items-center">
          <Link href="/gosure">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white cursor-pointer hover:scale-105 transition-transform">
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                {COMPANY_CONFIG.siteName}
              </span>
            </h1>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-3">
          <Link href="/gosure/documents">
            <Button variant="ghost" className="text-slate-300 hover:text-yellow-400 hover:bg-yellow-500/10 font-medium">
              Documents
            </Button>
          </Link>
          <Link href="/gosure/contact">
            <Button variant="ghost" className="text-slate-300 hover:text-yellow-400 hover:bg-yellow-500/10 font-medium">
              Contact
            </Button>
          </Link>
          <Link href="/gosure/login">
            <Button className="bg-yellow-600 hover:bg-yellow-500 text-white font-medium">Sign In</Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-slate-300 hover:bg-yellow-500/10 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-sm border-b border-yellow-500/50 md:hidden z-50">
            <div className="px-4 py-3 space-y-2">
              <Link href="/gosure/documents" onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full text-slate-300 hover:text-yellow-400 hover:bg-yellow-500/10 font-medium justify-start h-12"
                >
                  Documents
                </Button>
              </Link>
              <Link href="/gosure/contact" onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full text-slate-300 hover:text-yellow-400 hover:bg-yellow-500/10 font-medium justify-start h-12"
                >
                  Contact
                </Button>
              </Link>
              <Link href="/gosure/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-medium h-12">Sign In</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-900"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-slate-900 to-black rounded-2xl shadow-2xl mb-8 relative overflow-hidden border border-yellow-500/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-600/10 rounded-full blur-3xl"></div>

              <div className="relative z-10 px-6 sm:px-12 py-8 sm:py-12">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-yellow-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-yellow-500/30">
                    <Shield className="w-8 h-8 text-yellow-400" />
                  </div>
                  <div>
                    <div className="inline-block px-4 py-1.5 bg-yellow-500/20 backdrop-blur-sm rounded-full text-sm font-semibold text-yellow-400 mb-2 border border-yellow-500/30">
                      Legal Document
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Privacy Policy</h1>
                    <p className="text-slate-400 text-base sm:text-lg mt-2">Your privacy and data protection rights</p>
                  </div>
                </div>

                <div className="bg-yellow-500/10 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/30">
                  <div className="text-sm text-yellow-400">Last Updated: {COMPANY_CONFIG.lastUpdated}</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Section 1 */}
              <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-800 overflow-hidden hover:border-yellow-500/30 transition-all duration-300">
                <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 px-6 py-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      1
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Introduction and Data Controller</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-slate-300 leading-relaxed">
                    Gosure, operated by Letterise Ltd (16875214) (registered in England and Wales at 128 City Road,
                    London, EC1V 2NX), is committed to protecting and respecting your privacy. This Privacy Policy
                    explains how we collect, use, disclose, and safeguard your personal information when you access or
                    use our services (the "Services") through our website and platform.
                  </p>
                  <p className="text-slate-300 leading-relaxed">
                    This Privacy Policy applies to all users of our Services and governs our data practices in
                    accordance with applicable data protection laws, including the UK General Data Protection Regulation
                    (UK GDPR), the Data Protection Act 2018, and other relevant privacy legislation.
                  </p>
                </div>
              </div>

              {/* Section 2 */}
              <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-800 overflow-hidden hover:border-yellow-500/30 transition-all duration-300">
                <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 px-6 py-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      2
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Information We Collect</h2>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="bg-blue-500/10 rounded-xl p-6 border-l-4 border-blue-500">
                    <div className="flex items-center gap-3 mb-4">
                      <FileText className="w-6 h-6 text-blue-400" />
                      <h3 className="text-xl font-semibold text-blue-300">2.1 Personal Information You Provide</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ul className="space-y-2 text-slate-300">
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Account registration details
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Contact form submissions
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Payment information
                        </li>
                      </ul>
                      <ul className="space-y-2 text-slate-300">
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Service requests
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Customer support communications
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Feedback and survey responses
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-green-500/10 rounded-xl p-6 border-l-4 border-green-500">
                    <div className="flex items-center gap-3 mb-4">
                      <Database className="w-6 h-6 text-green-400" />
                      <h3 className="text-xl font-semibold text-green-300">2.2 Information Collected Automatically</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ul className="space-y-2 text-slate-300">
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Device and browser information
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          IP address and location data
                        </li>
                      </ul>
                      <ul className="space-y-2 text-slate-300">
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Usage patterns and analytics
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Cookies and tracking technologies
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3 */}
              <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-800 overflow-hidden hover:border-yellow-500/30 transition-all duration-300">
                <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 px-6 py-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      3
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Legal Basis for Processing</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-purple-500/10 rounded-xl p-5 border border-purple-500/30 hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-purple-300">Contract Performance</h4>
                      </div>
                      <p className="text-sm text-slate-400">Processing necessary to provide our services</p>
                    </div>
                    <div className="bg-yellow-500/10 rounded-xl p-5 border border-yellow-500/30 hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-yellow-300">Legitimate Interests</h4>
                      </div>
                      <p className="text-sm text-slate-400">Service improvement, security, and business operations</p>
                    </div>
                    <div className="bg-red-500/10 rounded-xl p-5 border border-red-500/30 hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                          <Shield className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-red-300">Legal Compliance</h4>
                      </div>
                      <p className="text-sm text-slate-400">
                        Compliance with applicable laws and regulatory requirements
                      </p>
                    </div>
                    <div className="bg-yellow-500/10 rounded-xl p-5 border border-yellow-500/30 hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                          <UserCheck className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-yellow-300">Consent</h4>
                      </div>
                      <p className="text-sm text-slate-400">
                        Where you have provided explicit consent for specific activities
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4 */}
              <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-800 overflow-hidden hover:border-yellow-500/30 transition-all duration-300">
                <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 px-6 py-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      4
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">How We Use Your Information</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="bg-gradient-to-r from-yellow-500/10 via-blue-500/10 to-yellow-500/10 rounded-xl p-6 border border-yellow-500/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Server className="w-6 h-6 text-yellow-400" />
                          <h4 className="text-lg font-semibold text-white">Service Provision</h4>
                        </div>
                        <ul className="space-y-2 text-slate-300">
                          <li className="flex items-start gap-2">
                            <span className="text-yellow-400 mt-1">•</span>
                            <span>Service delivery and fulfillment</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-yellow-400 mt-1">•</span>
                            <span>Account management and authentication</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-yellow-400 mt-1">•</span>
                            <span>Payment processing and billing</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-yellow-400 mt-1">•</span>
                            <span>Customer support and assistance</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Shield className="w-6 h-6 text-blue-400" />
                          <h4 className="text-lg font-semibold text-white">Business Operations</h4>
                        </div>
                        <ul className="space-y-2 text-slate-300">
                          <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-1">•</span>
                            <span>Service improvement and optimization</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-1">•</span>
                            <span>Security monitoring and fraud prevention</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-1">•</span>
                            <span>Analytics and performance tracking</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-1">•</span>
                            <span>Marketing communications (with consent)</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5 */}
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-800 shadow-xl">
                <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 p-6 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      5
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Your Rights</h2>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-slate-300 mb-6">Under UK GDPR, you have the following rights:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                      <h4 className="font-semibold text-green-300 mb-2">Right to Access</h4>
                      <p className="text-sm text-slate-400">Request copies of your personal data</p>
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                      <h4 className="font-semibold text-blue-300 mb-2">Right to Rectification</h4>
                      <p className="text-sm text-slate-400">Correct inaccurate information</p>
                    </div>
                    <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
                      <h4 className="font-semibold text-red-300 mb-2">Right to Erasure</h4>
                      <p className="text-sm text-slate-400">Request deletion of your data</p>
                    </div>
                    <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/30">
                      <h4 className="font-semibold text-purple-300 mb-2">Right to Object</h4>
                      <p className="text-sm text-slate-400">Object to processing of your data</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 6 */}
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-800 shadow-xl">
                <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 p-6 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      6
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Contact Us</h2>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-slate-300 mb-4">
                    If you have any questions about this Privacy Policy or how we handle your data, please contact us:
                  </p>
                  <Link href="/gosure/contact">
                    <button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-950 font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-yellow-500/50">
                      Contact Us
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-black border-t border-slate-800 py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tighter">
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  gosure.io
                </span>
              </h2>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <Link href="/gosure/privacy-policy" className="text-slate-500 hover:text-yellow-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/gosure/terms-of-services" className="text-slate-500 hover:text-yellow-400 transition-colors">
                Terms of Service
              </Link>
              <Link href="/gosure/return-policy" className="text-slate-500 hover:text-yellow-400 transition-colors">
                Return Policy
              </Link>
            </div>
            <p className="text-slate-500 text-sm">© 2025 Gosure. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
