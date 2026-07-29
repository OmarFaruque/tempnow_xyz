"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, AlertCircle, Clock, CheckCircle, FileText } from "lucide-react"
import { useSettings } from "@/context/settings"

export default function ReturnUAE() {
  const settings = useSettings()

  return (
    <div className="space-y-6">
      {/* Section 1: Overview */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
        <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              1
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Scope of This Policy</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            This policy sets out the return, exchange and refund terms for {settings?.general?.siteName || 'Tempnow'}'s digital document services, disclosed to you before you complete your purchase as required by consumer protection and electronic commerce law.
          </p>
          <p className="text-gray-700 leading-relaxed">
            The supplier of these services, and the party responsible for handling returns and refunds, is SBR Digital, the licensed entity trading as {settings?.general?.siteName || 'Tempnow'}. Our licence details and registered address are available on request. This policy forms part of our <Link className="font-medium text-primary underline hover:text-primary/80 transition" href="/terms">Terms of Service</Link>.
          </p>
          <p className="mt-3 text-gray-700 leading-relaxed">
            Nothing in this policy removes or limits the statutory rights the law gives you as a consumer. Where any term of this policy conflicts with those rights, your statutory rights prevail.
          </p>
        </div>
      </div>

      {/* Section 2: Technical Issues Refund */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
        <div className="bg-gradient-to-r from-slate-100/80 to-slate-50/40 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-600 text-white rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              2
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Digital Content Delivered on Purchase</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Our documents are generated and delivered to you immediately once payment is confirmed. Because the service is performed in full at your express request at the moment of purchase, a delivered document cannot be returned or exchanged simply because you have changed your mind.
          </p>
          <div className="mt-4">
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 mb-1">Disclosed Before You Pay</p>
                  <p className="text-sm text-amber-800">
                    This limitation is shown to you before you confirm payment. By completing checkout you acknowledge that the document is generated and supplied immediately, and that no return right applies to a document that is delivered as described.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Non-Refundable Circumstances */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
        <div className="bg-gradient-to-r from-blue-100 to-blue-50 px-6 py-4 border-b border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              3
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">If Your Document Is Defective or Not as Described</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-700 leading-relaxed mb-4">
            A document must match the description and specifications shown at the time of sale and be fit for the purpose disclosed to you, which is reference and informational use. If it is not delivered, cannot be opened, is corrupted, or does not match what was advertised, you are entitled to a remedy at no additional cost.
          </p>
          <div className="mt-4">
            <div className="rounded-md border-l-4 border-blue-400 bg-blue-50 px-4 py-3">
              <div className="flex items-start gap-3">
                <div>
                  <p className="font-semibold text-blue-900 mb-1">Your Remedy</p>
                  <ul className="mt-1 flex flex-col gap-1 pl-4">
                    <li className="list-disc">
                      Re-delivery, regeneration or repair of the affected document at no charge
                    </li>
                    <li className="list-disc">
                      Replacement with an equivalent document where repair is not possible
                    </li>
                    <li className="list-disc">
                      A refund of the amount you paid where repair or replacement is not possible or
                      does not resolve the defect
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-gray-700 leading-relaxed text-sm">
            Approved refunds are made without undue delay to the same payment method used for the original purchase, in the currency in which that payment was charged. We do not issue refunds in cash or to a different card or account. Nothing here affects your right to raise the matter with your card issuer or bank.
          </p>

        </div>
      </div>

      {/* Section 4: Refund Request Process */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
        <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              4
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Invoices and Pricing</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Each purchase is confirmed with an invoice that itemises the document supplied, the amount paid and any tax charged. The price shown at checkout is the final amount payable, inclusive of applicable taxes; no further charge is added after you confirm your order.
          </p>
        </div>
      </div>

      {/* Section 5: Consumer Rights in UAE */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
        <div className="bg-gradient-to-r from-slate-100/80 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              5
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Complaints and Escalation</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            If you believe a document is defective, not as described, or was not delivered, contact us at {settings?.general?.supportEmail || "[EMAIL_ADDRESS]"} or through the contact form on this website, with your order and invoice number and a description of the problem. We will review your complaint and respond to you in writing.
          </p>
          <p className="text-gray-700 leading-relaxed">If we cannot resolve your complaint, you may refer it to the competent consumer protection authority, or to the competent courts, without giving up any statutory right. An Arabic version of this policy is available on request and prevails in any proceedings before those authorities.</p>
        </div>
      </div>


      {/* Section 6: Contact Information */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
        <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              6
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Contact Information</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-700 leading-relaxed mb-4">
            For refund requests or questions about this policy, please contact us via our website contact form.
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
  )
}
