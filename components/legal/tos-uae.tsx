"use client"

import { AlertCircle } from "lucide-react"
import { useSettings } from "@/context/settings"
import Link from "next/link"

export default function TosUAE() {
  const settings = useSettings()

  return (
    <div className="space-y-6">
      {/* Section 1 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
        <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              1
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Who You Are Contracting With</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-800 leading-relaxed">
            This website operates under the name {settings?.general?.siteName || 'Tempnow'}. The services are supplied to you by SBR Digital, the licensed entity trading under that name, and your contract is with SBR Digital. Our licence details and registered address are available on request.
          </p>
          <p className="text-gray-700 text-sm leading-relaxed">
            By placing an order you accept these terms. Acceptance given by electronic means has the same legal effect as a signature, and the electronic records of your order and payment are valid evidence of the contract between us.
          </p>
        </div>
      </div>

      {/* Section 2: What We Supply */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
        <div className="bg-gradient-to-r from-slate-100/80 to-slate-50/40 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-600 text-white rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              2
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">What We Supply</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            We supply computer-generated documents in digital form. Each document is produced from the information you enter and is delivered to you as a downloadable file once payment is confirmed. The description, format and specifications of each document are shown to you before you pay, and we supply the document as described.
          </p>
          <div className="mt-4">
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 mb-1">Reference Use Only</p>
                  <p className="text-sm text-amber-800">
                    Our documents are supplied for reference and informational use. They are not legal, financial, medical or other professional advice, they are not official or government-issued records, and they must not be presented as such to any person or authority.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Price, Payment and Invoicing */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
        <div className="bg-gradient-to-r from-blue-100 to-blue-50 px-6 py-4 border-b border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              3
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Price, Payment and Invoicing</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-700 leading-relaxed mb-4">
            The price shown at checkout is the final amount payable and includes all applicable taxes. The currency of the transaction is stated at checkout and is the currency in which your card is charged. No charge is added after you confirm your order, and we issue an itemised invoice for every purchase showing the document supplied, the amount paid and the tax charged. The charge on your card or bank statement appears under our registered name, SBR Digital.
          </p>
          <div className="mt-4">
            <div className="rounded-md border-l-4 border-blue-400 bg-blue-50 px-4 py-3">
              <div className="flex items-start gap-3 text-sm text-blue-800">
                <div>
                  <p className="font-semibold text-blue-900 mb-1">Card Payments</p>
                  <ul className="mt-1 flex flex-col gap-1 pl-4">
                    <li className="list-disc">
                      Card payments are processed by a licensed third-party payment service provider,
                      whose own terms and privacy policy apply to the payment.
                    </li>
                    <li className="list-disc">
                      We do not receive or store your full card details. Card data is captured and
                      handled by the payment provider over an encrypted connection.
                    </li>
                    <li className="list-disc">
                      We share the transaction data the provider needs to process your payment and to
                      carry out fraud and risk checks.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-gray-700 leading-relaxed text-sm">
            Refunds, defective documents and non-delivery are dealt with in our <Link className="hover:text-decoration-none transition font-medium text-primary underline hover:text-primary/80 transition" href="/return-policy">Return Policy</Link>, which forms part of these terms and is disclosed to you before you pay. Nothing in these terms removes or limits your statutory rights as a consumer; where a term conflicts with those rights, your rights prevail.
          </p>
        </div>
      </div>


      {/* Section 4: Permitted and Prohibited Use */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
        <div className="bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 border-b border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              4
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Permitted and Prohibited Use</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-700 leading-relaxed mb-4">
            You may use our services only for lawful purposes. Forgery, impersonation and the use of a document to deceive another person or a public authority are criminal offences, and they are also prohibited by the payment networks through which your payment is processed.
          </p>
          <div className="mt-4">
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 mb-1">You Must Not Use Our Services To</p>
                  <ul className="mt-1 flex flex-col gap-1 pl-4 text-sm text-amber-800 ml-0 pl-0">
                    <li className="list-disc">
                      Produce forged, counterfeit or misleading documents, or anything presented as an
                      official, government-issued or bank-issued record
                    </li>
                    <li className="list-disc">
                      Impersonate another person, business or authority, or misstate your identity
                    </li>
                    <li className="list-disc">
                      Commit or facilitate fraud, money laundering or any other unlawful act, or evade
                      fraud and risk controls
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed text-sm mt-4">
            We may refuse or cancel an order, and suspend access, where use breaches this section, where the law requires it, or where our payment provider or the card networks require it. Unlawful use may be reported to the competent authorities.
          </p>
        </div>
      </div>

      {/* Section 5: Your Personal Data */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
        <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              5
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your Personal Data</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            We collect and process only the personal data needed to generate your document, take payment, issue your invoice and meet our record-keeping obligations. We do so on the basis of your consent and of performing this contract, and we do not sell your personal data.
          </p>
          <p className="text-gray-700 leading-relaxed">
            To take payment we share the necessary data with our payment service provider, which may process it outside the country in which you are located under safeguards required by applicable data protection legislation. You may ask us to give you access to your data, correct it, delete it or stop processing it, and you may withdraw your consent, by contacting us through this website. Full details are set out in our <Link className="hover:text-decoration-none transition font-medium text-primary underline hover:text-primary/80 transition" href="/privacy-policy">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      {/* Section 6: Complaints, Governing Law and Contact */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
        <div className="bg-gradient-to-r from-slate-100/80 to-slate-50/40 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-600 text-white rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              6
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Complaints, Governing Law and Contact</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Send any complaint or question about these terms to {settings?.general?.supportEmail || "[EMAIL_ADDRESS]"} or through the contact form on this website, quoting your order and invoice number. We will review it and reply to you in writing.
          </p>
          <p className="text-gray-700 leading-relaxed">
            These terms are governed by the federal consumer protection, electronic commerce and data protection laws in force in the jurisdiction in which we are licensed. If we cannot resolve your complaint, you may refer it to the competent consumer protection authority or to the competent courts, without giving up any statutory right. An Arabic version of these terms is available on request and prevails in any proceedings before those authorities.
          </p>
        </div>
      </div>
    </div>
  )
}
