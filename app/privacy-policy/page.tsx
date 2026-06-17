"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Shield, Lock, Eye, Server, FileText, Database, UserCheck, AlertCircle } from "lucide-react"
import { useState } from "react"
import { useSettings } from "@/context/settings"
import { Footer } from "@/components/footer"
import {Header} from "@/components/header"

export default function PrivacyPolicyPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const settings = useSettings()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 relative overflow-hidden">
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

        <div className="relative z-10 px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl shadow-2xl mb-8 relative overflow-hidden">
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
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold text-white mb-2">
                      Legal Document
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Privacy Policy</h1>
                    <p className="text-teal-50 text-base sm:text-lg mt-2">Your privacy and data protection rights</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-sm text-teal-50">Last Updated: {settings?.general?.effectiveDate ? new Date(settings.general.effectiveDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "11 November, 2025"}</div>
                </div>
              </div>
            </div>

            {/* Content Sections - Changed from one big card to individual section cards */}
            <div className="space-y-6">
              {/* Section 1 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      1
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Introduction and Data Controller</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    {settings?.general?.companyName || 'Mozero AI Ltd'} ({settings?.general?.aliases || '"Mozero", "Tempnow," "we," "us," or "our"'}) is committed to protecting and respecting your privacy. This Privacy Policy
                    explains how we collect, use, disclose, and safeguard your personal information when you access or
                    use our document services (the "Services") through our website and platform.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    This Privacy Policy applies to all users of our Services and governs our data practices in
                    accordance with applicable data protection laws, including the UK General Data Protection Regulation
                    (UK GDPR), the Data Protection Act 2018, and other relevant privacy legislation.
                  </p>
                </div>
              </div>

              {/* Section 2 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      2
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Information We Collect</h2>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-l-4 border-blue-500">
                    <div className="flex items-center gap-3 mb-4">
                      <FileText className="w-6 h-6 text-blue-600" />
                      <h3 className="text-xl font-semibold text-blue-900">2.1 Personal Information You Provide</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ul className="space-y-2 text-gray-700">
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
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Document generation requests
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

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-l-4 border-green-500">
                    <div className="flex items-center gap-3 mb-4">
                      <Database className="w-6 h-6 text-green-600" />
                      <h3 className="text-xl font-semibold text-green-900">2.2 Information Collected Automatically</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Device and browser information
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          IP address and location data
                        </li>
                      </ul>
                      <ul className="space-y-2 text-gray-700">
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
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      3
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Legal Basis for Processing</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200 hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-purple-900">Contract Performance</h4>
                      </div>
                      <p className="text-sm text-purple-800">Processing necessary to provide our document services</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200 hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-orange-900">Legitimate Interests</h4>
                      </div>
                      <p className="text-sm text-orange-800">Service improvement, security, and business operations</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 border border-red-200 hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                          <Shield className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-red-900">Legal Compliance</h4>
                      </div>
                      <p className="text-sm text-red-800">
                        Compliance with applicable laws and regulatory requirements
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-5 border border-indigo-200 hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                          <UserCheck className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-indigo-900">Consent</h4>
                      </div>
                      <p className="text-sm text-indigo-800">
                        Where you have provided explicit consent for specific activities
                      </p>
                    </div>
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
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">How We Use Your Information</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="bg-gradient-to-r from-teal-50 via-blue-50 to-indigo-50 rounded-xl p-6 border border-teal-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Server className="w-6 h-6 text-teal-600" />
                          <h4 className="text-lg font-semibold text-gray-900">Service Provision</h4>
                        </div>
                        <ul className="space-y-2 text-gray-700">
                          <li className="flex items-start gap-2">
                            <span className="text-teal-500 mt-1">•</span>
                            <span>Document generation and delivery</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-teal-500 mt-1">•</span>
                            <span>Account management and authentication</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-teal-500 mt-1">•</span>
                            <span>Payment processing and billing</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-teal-500 mt-1">•</span>
                            <span>Customer support and assistance</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Shield className="w-6 h-6 text-blue-600" />
                          <h4 className="text-lg font-semibold text-gray-900">Business Operations</h4>
                        </div>
                        <ul className="space-y-2 text-gray-700">
                          <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>Service improvement and optimization</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>Security monitoring and fraud prevention</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>Analytics and usage pattern analysis</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>Legal compliance and regulatory reporting</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 px-6 py-4 border-b border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      5
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Third-Party Payment Processors</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    We use reputable third-party payment service providers to process payments securely. When you make a
                    purchase, your payment information is transmitted directly to these payment processors and is not
                    stored on our servers.
                  </p>
                  <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-5">
                    <p className="font-semibold text-amber-900 mb-2">Important Privacy Information:</p>
                    <ul className="space-y-2 text-amber-800">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>Payment processors operate under their own privacy policies and terms of service</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>They collect payment card details, billing information, and transaction data</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>We receive limited transaction information necessary for order fulfillment</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>All processors comply with PCI-DSS requirements for secure payment handling</span>
                      </li>
                    </ul>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    We recommend reviewing the privacy policies of our payment service providers to understand how they
                    handle your payment information.
                  </p>
                </div>
              </div>

              {/* Section 6 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      6
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Data Security and Protection</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-lg transition-shadow">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Lock className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Encryption</h4>
                      <p className="text-sm text-gray-600">
                        Industry-standard encryption for data transmission and storage
                      </p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-lg transition-shadow">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Shield className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Access Controls</h4>
                      <p className="text-sm text-gray-600">Strict authentication and authorization mechanisms</p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:shadow-lg transition-shadow">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <AlertCircle className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Monitoring</h4>
                      <p className="text-sm text-gray-600">Continuous security monitoring and incident response</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 7 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-6 py-4 border-b border-indigo-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      7
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your Rights Under UK GDPR</h2>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border-2 border-indigo-200 rounded-xl p-5 hover:border-indigo-400 hover:shadow-lg transition-all">
                      <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                        <UserCheck className="w-5 h-5" />
                        Right of Access
                      </h4>
                      <p className="text-sm text-gray-600">
                        Request access to your personal information and processing details
                      </p>
                    </div>
                    <div className="bg-white border-2 border-blue-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-lg transition-all">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Right to Rectification
                      </h4>
                      <p className="text-sm text-gray-600">
                        Request correction of inaccurate or incomplete personal data
                      </p>
                    </div>
                    <div className="bg-white border-2 border-red-200 rounded-xl p-5 hover:border-red-400 hover:shadow-lg transition-all">
                      <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Right to Erasure
                      </h4>
                      <p className="text-sm text-gray-600">
                        Request deletion of your personal information under certain conditions
                      </p>
                    </div>
                    <div className="bg-white border-2 border-green-200 rounded-xl p-5 hover:border-green-400 hover:shadow-lg transition-all">
                      <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        Right to Data Portability
                      </h4>
                      <p className="text-sm text-gray-600">
                        Request transfer of your data in a structured, machine-readable format
                      </p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 rounded-r-xl p-5">
                    <p className="text-sm text-gray-800">
                      <strong className="text-yellow-900">Exercising Your Rights:</strong> To exercise any of these
                      rights, please contact us through our contact form. We will respond to your request within one
                      month of receipt, in accordance with UK GDPR requirements.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 8 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      8
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Data Retention</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    We retain your personal information only for as long as necessary to fulfill the purposes outlined
                    in this Privacy Policy, unless a longer retention period is required or permitted by law.
                  </p>
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Retention Periods:</h4>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-gray-500 mt-1">•</span>
                        <span>
                          <strong>Account Data:</strong> Retained while your account is active and for a reasonable
                          period thereafter
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gray-500 mt-1">•</span>
                        <span>
                          <strong>Transaction Records:</strong> Retained for 7 years to comply with UK tax and
                          accounting regulations
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gray-500 mt-1">•</span>
                        <span>
                          <strong>Marketing Communications:</strong> Retained until you unsubscribe or withdraw consent
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gray-500 mt-1">•</span>
                        <span>
                          <strong>Technical Logs:</strong> Typically retained for 90 days for security and
                          troubleshooting purposes
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 9 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="bg-gradient-to-r from-teal-50 to-blue-50 px-6 py-4 border-b border-teal-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      9
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Contact Information and Complaints</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-6 border border-teal-200">
                      <h4 className="font-semibold text-teal-900 mb-3">Contact Us</h4>
                      <p className="text-sm text-gray-700 mb-4">
                        For privacy-related inquiries, please use our contact form and mark your message as "Data
                        Protection" or "Privacy Inquiry".
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        We are committed to addressing your concerns promptly and transparently. Our company,{" "}
                        {settings?.general?.companyName || 'Mozero AI Ltd'} (Company No. {settings?.general?.companyRegistration || '16644935'}), registered in{" "}
                        England and Wales, operates from {settings?.general?.companyAddress || '131 Finsbury Pavement, London, United Kingdom, EC2A 1NT'}.
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-3">Regulatory Authority</h4>
                      <p className="text-sm text-gray-700 mb-3">
                        If you are not satisfied with our response, you have the right to lodge a complaint with:
                      </p>
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <p className="text-sm font-semibold text-blue-900">Information Commissioner's Office (ICO)</p>
                        <p className="text-sm text-gray-600 mt-1">Website: ico.org.uk</p>
                        <p className="text-sm text-gray-600">
                          The ICO is the UK's independent authority for data protection and privacy rights.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 10 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      10
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Changes to This Privacy Policy</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    We may update this Privacy Policy from time to time to reflect changes in our practices, technology,
                    legal requirements, or other factors. We will notify you of any material changes by posting the
                    updated Privacy Policy on our website and updating the "Last Updated" date.
                  </p>
                  <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-xl p-5">
                    <p className="text-sm text-blue-900">
                      <strong>Your Responsibility:</strong> We encourage you to review this Privacy Policy periodically
                      to stay informed about how we protect your personal information. Your continued use of our
                      Services after any changes indicates your acceptance of the updated Privacy Policy.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}