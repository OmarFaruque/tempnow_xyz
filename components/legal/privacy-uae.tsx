"use client"

import { Shield, Lock, Eye, Server, FileText, Database, UserCheck, AlertCircle } from "lucide-react"
import { useSettings } from "@/context/settings"
import Link from "next/link"

export default function PrivacyUAE() {
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
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Who Controls Your Data</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            This website is operated under the name {settings?.general?.siteName || 'Tempnow'} by SBR Digital, which is the controller of the personal data described in this policy. Our licence details and registered address are available on request.
          </p>
          <p className="text-gray-700 leading-relaxed">
            This policy explains what personal data we collect, why we collect it, who we share it with and the rights you hold over it. It forms part of our <Link className="underline hover:no-underline text-primary hover:text-primary/80 transition" href="/terms-of-service">Terms of Service</Link>.
          </p>
        </div>
      </div>

      {/* Section 2 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
        <div className="bg-gradient-to-r from-slate-100/80 to-slate-50/40 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              2
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">What We Collect and Why</h2>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-gray-700 leading-relaxed">
            We collect only the data we need to supply the service you order and to meet our legal obligations. We do not sell your personal data, and we do not use it for advertising or profiling.
          </p>
          <div className="mt-4">
            <div className="rounded-md border-l-4 border-primary bg-primary/20  mt-1 leading-relaxed p-4 text-sm font-light text-[#0c473e]">
              <div className="flex items-start gap-3">
                <div>
                  <p className="font-semibold mb-1">Data We Process</p>
                  <ul className="mt-1 flex flex-col gap-1 pl-4">
                    <li className="list-disc">
                      The details you enter to generate your document, and your contact details, used
                      to produce and deliver what you ordered
                    </li>
                    <li className="list-disc">
                      Transaction and invoice records, used to take payment, issue your invoice and
                      keep the accounting records the law requires us to keep
                    </li>
                    <li className="list-disc">
                      Messages you send us, used to answer your enquiry or handle your complaint
                    </li>
                    <li className="list-disc">
                      Basic technical data such as your IP address and device information, recorded by
                      our systems to keep the service secure and to prevent fraud
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed">
            We process this data on the basis of your consent, of performing our contract with you, of complying with a legal obligation, and of protecting the security of the service. We ask for your consent where the law requires it, and you may withdraw it at any time.
          </p>
        </div>
      </div>

      {/* Section 3 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              3
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Payment Data and Who We Share With</h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed">
            Card payments are processed by a licensed third-party payment service provider. Your card details are captured directly by that provider over an encrypted connection under PCI-DSS standards. We never receive or store your full card number.
          </p>
          <div className="mt-4">
            <div className="rounded-md border-l-4 border-blue-500 bg-blue-50  mt-1 leading-relaxed p-4 text-sm font-light text-blue-800">
              <div className="flex items-start gap-3">
                <div>
                  <p className="font-semibold mb-1">Data We Process</p>
                  <ul className="mt-1 flex flex-col gap-1 pl-4">
                    <li className="list-disc">
                      We share the transaction data our payment provider needs to process your payment
                      and to carry out its own fraud, risk and sanctions checks. The provider handles
                      that data under its own privacy policy.
                    </li>
                    <li className="list-disc">
                      We disclose data to a competent authority or court where the law obliges us to do
                      so. We share it with no one else.
                    </li>
                    <li className="list-disc">
                      Our payment and hosting providers may process your data outside the country in
                      which you are located, under the safeguards required by applicable data
                      protection legislation.
                    </li>
                  </ul>
                </div>
              </div>
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
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Security and How Long We Keep Data</h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed">
            We apply appropriate technical and organisational measures to protect your data, including encryption in transit and storage and restricted access to our systems. If a breach occurs that puts your data at risk, we will notify you and the competent authority as the law requires.
          </p>
          <p className="text-gray-700 leading-relaxed">
            We keep your data only for as long as it is needed for the purpose it was collected for. Transaction and invoice records are kept for the retention period set by the applicable tax and commercial record-keeping rules, after which they are deleted.
          </p>
        </div>
      </div>

      {/* Section 5 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              5
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your Rights and How to Complain</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            You may ask us to give you access to the personal data we hold about you and information about how it is processed, to correct it if it is inaccurate or incomplete, to delete it, to restrict or stop processing it, and to transfer it to you or to another controller in a structured, machine-readable form. You may also withdraw your consent at any time. Exercising these rights is free of charge.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Send your request or complaint to <a href={`mailto:${settings?.general?.adminEmail}`} className="text-teal-600 hover:text-teal-800 transition-colors">{settings?.general?.adminEmail}</a> or through the contact form on this website, marking it as a data protection request. We will reply to you in writing within the period set by the applicable data protection legislation. If you are not satisfied with our response, you may complain to the competent data protection authority or to the competent courts, without giving up any statutory right. An Arabic version of this policy is available on request and prevails in any proceedings before those authorities.
          </p>
        </div>
      </div>
    </div>
  )
}
