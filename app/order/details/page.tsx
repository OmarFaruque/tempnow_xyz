"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"
import { FileText, Car, MessageSquare, ArrowLeft, Shield, Download } from "lucide-react"
import { useSettings } from "@/context/settings"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

const PrintableCertificate = ({ policyData, formatDateTime, settings }) => {
  const [logoUrl, setLogoUrl] = useState(process.env.NEXT_PUBLIC_BASE_URL + "/cert-logo.png")

  useEffect(() => {
    setLogoUrl(`${process.env.NEXT_PUBLIC_BASE_URL}/cert-logo.png`)
  }, [])
  
  if (!policyData) return null
  const template = settings?.certificateTemplate

  const quoteData = policyData.quoteData ? JSON.parse(policyData.quoteData) : {}
  const customerData = quoteData.customerData || {}

  const docNumber = policyData.policyNumber
  const registrationMark = policyData.regNumber
  const descriptionOfVehicles = `${policyData.vehicleMake} ${policyData.vehicleModel}`
  const make = policyData.vehicleMake
  const model = policyData.vehicleModel
  const name = `${policyData.nameTitle} ${policyData.firstName} ${policyData.lastName}`
  const dob = new Date(policyData.dateOfBirth).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  const license = customerData.licenseType || "Full"
  const effectiveDate = formatDateTime(policyData.startDate)
  const expiryDate = formatDateTime(policyData.endDate)
  const address = policyData.postCode ? `${policyData.address}, ${policyData.postCode}` : policyData.address

  const premium = Number(policyData.update_price ?? policyData.cpw).toFixed(2)
  const excess = "750.00"

  const templateData = {
    docNumber,
    registrationMark,
    descriptionOfVehicles,
    make,
    model,
    name: name.toUpperCase(),
    dob,
    license,
    effectiveDate,
    expiryDate,
    address,
    premium,
    excess,
  }

  const replaceVariables = (text: string) => {
    if (!text) return ""
    return text.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return templateData[variable as keyof typeof templateData] || match
    })
  }

  const page1Content = template ? replaceVariables(template.page1) : "Template not loaded."
  const page2Content = template ? replaceVariables(template.page2) : "Template not loaded."
  const page1FooterContent = template ? replaceVariables(template.page1_footer) : ""

  return (
    <div id="printable-certificate" className="printable-certificate hidden print:block">
      {/* Page 1 */}
      <div id="certificate-page-1" className="rounded-lg bg-white shadow-2xl overflow-hidden print:shadow-none print:border-none">
        <div className="flex flex-col items-center justify-center pt-1 -mb-2">
          <img
            src={logoUrl}
            alt="Motor Covernote Limited"
            width={128}
            height={38}
            className="h-auto w-[128px]"
            crossOrigin="anonymous"
          />
        </div>

        <div className="px-2 pb-2" style={{ backgroundColor: "#ffffff", color: "#0a0a0a" }}>
          <div className="border-2 rounded border-gray-900 p-2 relative overflow-hidden" style={{ minHeight: "420px" }}>
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: 0.08 }}>
              {Array.from({ length: 120 }).map((_, i) => {
                const cols = 10
                const rows = 12
                const col = i % cols
                const row = Math.floor(i / cols)

                return (
                  <div
                    key={i}
                    className="absolute font-bold whitespace-nowrap"
                    style={{
                      transform: "rotate(-45deg)",
                      left: `${col * 20 - 10}%`,
                      top: `${row * 15 - 5}%`,
                      fontSize: "12px",
                      color: "#666666",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {name.toUpperCase()} {docNumber}
                  </div>
                )
              })}
            </div>

            <div className="relative z-10" dangerouslySetInnerHTML={{ __html: page1Content }} />
          </div>

          <div className="mt-2" dangerouslySetInnerHTML={{ __html: page1FooterContent }} />
        </div>
      </div>

      {/* Page 2 */}
      <div
        id="certificate-page-2"
        className="rounded-lg bg-white shadow-2xl overflow-hidden print:shadow-none print:border-none print:mt-0"
      >
        <div className="p-8" style={{ backgroundColor: "#ffffff", color: "#0a0a0a" }} dangerouslySetInnerHTML={{ __html: page2Content }}></div>
      </div>
    </div>
  )
}

export default function PolicyDetailsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { addNotification } = useNotifications()
  const policyNumber = searchParams.get("number")
  const settings = useSettings()

  const [isClient, setIsClient] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [policyData, setPolicyData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !policyNumber) {
      return
    }

    const verified = sessionStorage.getItem(`policy_verified_${policyNumber}`)
    if (verified !== "true") {
      router.push(`/order/view?number=${policyNumber}`)
      return
    }

    setIsVerified(true)

    const fetchPolicyData = async () => {
      try {
        const response = await fetch(`/api/policy/details?number=${policyNumber}`)
        if (!response.ok) {
          throw new Error("Policy not found")
        }
        const data = await response.json()

        const now = new Date()
        let status = "Active"
        if (now < new Date(data.startDate)) {
          status = "Pending"
        } else if (now > new Date(data.endDate)) {
          status = "Expired"
        }

        const mappedData = {
          ...data,
          vehicleReg: data.regNumber,
          customerFirstName: data.firstName,
          customerSurname: data.lastName,
          premium: Number(data.update_price ?? data.cpw).toFixed(2),
          status: status,
        }
        setPolicyData(mappedData)
      } catch (error) {
        console.error("Failed to fetch policy data:", error)
        addNotification({
          type: "error",
          title: "Policy Not Found",
          message: "The requested policy could not be found.",
        })
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPolicyData()
  }, [isClient, policyNumber, router, addNotification])



  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  if (!isClient || isLoading || !isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/30 to-gray-50">
        <main className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!policyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/30 to-gray-50">
        <main className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
            <p className="text-gray-600 mb-6">The requested order could not be found.</p>
            <Button onClick={() => router.push("/")} className="bg-teal-600 hover:bg-teal-700 text-white">
              Return to Home
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const quoteData = policyData?.quoteData ? JSON.parse(policyData.quoteData) : {}
  const customerData = quoteData.customerData || {}

  const docNumber = policyData?.policyNumber
  const registrationMark = policyData?.regNumber
  const descriptionOfVehicles = policyData ? `${policyData.vehicleMake} ${policyData.vehicleModel}` : ""
  const make = policyData?.vehicleMake
  const model = policyData?.vehicleModel
  const name = policyData ? `${policyData.nameTitle} ${policyData.firstName} ${policyData.lastName}` : ""
  const dob = policyData
    ? new Date(policyData.dateOfBirth).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    : ""
  const license = customerData.licenseType || "Full"
  const effectiveDate = policyData ? formatDateTime(policyData.startDate) : ""
  const expiryDate = policyData ? formatDateTime(policyData.endDate) : ""
  const address = policyData.postCode ? `${policyData?.address}, ${policyData?.postCode}` : policyData?.address
  const premium = policyData ? Number(policyData.update_price ?? policyData.cpw).toFixed(2) : "0.00"
  const excess = "750.00"

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/30 to-gray-50">
      <PrintableCertificate policyData={policyData} formatDateTime={formatDateTime} settings={settings} />
      <main className="px-3 sm:px-6 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="mb-4 text-teal-700 hover:text-teal-900 hover:bg-white/70"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>

            <div className="relative bg-gradient-to-br from-teal-50 via-white to-cyan-50 rounded-2xl p-8 shadow-xl border-2 border-teal-100 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-100/30 to-cyan-100/30 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-teal-100/20 to-cyan-100/20 rounded-full blur-2xl -ml-24 -mb-24" />

              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/30">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-teal-800 to-gray-900 bg-clip-text text-transparent">
                      Document Details
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">View and download your order information</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-md ${
                      policyData.status === "Active"
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                        : policyData.status === "Expired"
                        ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                        : "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white"
                    }`}
                  >
                    {policyData.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200 hover:border-teal-200 transition-colors">
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mr-3">
                    <Car className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{policyData.vehicleReg}</h3>
                    <p className="text-lg text-gray-600 font-medium">
                      {policyData.vehicleMake} {policyData.vehicleModel}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <span className="text-sm text-gray-600 font-medium block mb-1">Document Number</span>
                  <span className="text-base font-bold text-gray-900">{policyData.policyNumber}</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <span className="text-sm text-gray-600 font-medium block mb-1">Premium</span>
                  <span className="text-base font-bold text-gray-900">£{policyData.premium}</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <span className="text-sm text-gray-600 font-medium block mb-1">Valid From</span>
                  <span className="text-base font-bold text-gray-900">
                    {formatDateTime(policyData.startDate)}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <span className="text-sm text-gray-600 font-medium block mb-1">Valid Until</span>
                  <span className="text-base font-bold text-gray-900">
                    {formatDateTime(policyData.endDate)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200 hover:border-teal-200 transition-colors">
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mr-3">
                    <FileText className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Documents</h2>
                    <p className="text-sm text-gray-600 font-medium">Download your documents securely</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="group bg-gradient-to-r from-teal-50 to-white p-4 rounded-xl border-2 border-teal-200 hover:border-teal-300 transition-all hover:shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-teal-200 transition-colors">
                        <FileText className="w-5 h-5 text-teal-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-base text-gray-900">Certificate</p>
                      </div>
                    </div>
                    <Button
                      onClick={() =>
                        window.open(`/api/generate-certificate?number=${policyNumber}`, "_blank")
                      }
                      className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </div>

                {settings?.general?.policyScheduleVisible && policyData.status !== "Expired" && (
                  <div className="group bg-gradient-to-r from-teal-50 to-white p-4 rounded-xl border-2 border-teal-200 hover:border-teal-300 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-teal-200 transition-colors">
                          <FileText className="w-5 h-5 text-teal-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-base text-gray-900">Schedule</p>
                        </div>
                      </div>
                      <Button
                        onClick={() =>
                          window.open(`/api/generate-policy-schedule?number=${policyNumber}`, "_blank")
                        }
                        className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}

                {settings?.general?.statementOfFactVisible && policyData.status !== "Expired" && (
                  <div className="group bg-gradient-to-r from-teal-50 to-white p-4 rounded-xl border-2 border-teal-200 hover:border-teal-300 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-teal-200 transition-colors">
                          <FileText className="w-5 h-5 text-teal-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-base text-gray-900">Statement of Fact</p>
                        </div>
                      </div>
                      <Button
                        onClick={() =>
                          window.open(`/api/generate-statement-of-fact?number=${policyNumber}`, "_blank")
                        }
                        className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}

                {settings?.general?.productInformationVisible && policyData.status !== "Expired" && (
                  <div className="group bg-gradient-to-r from-teal-50 to-white p-4 rounded-xl border-2 border-teal-200 hover:border-teal-300 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-teal-200 transition-colors">
                          <FileText className="w-5 h-5 text-teal-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-base text-gray-900">Product Information</p>
                        </div>
                      </div>
                      <Button
                        onClick={() =>
                          window.open(`${process.env.NEXT_PUBLIC_BASE_URL}/.pdf/tempnow.pdf`, "_blank")
                        }
                        className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900 mb-1">Need Help?</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      If you require any assistance or experience any issues, please contact us through our contact
                      page.
                    </p>
                    <Button
                      onClick={() => router.push("/contact")}
                      variant="outline"
                      size="sm"
                      className="border-teal-300 text-teal-700 hover:bg-teal-50"
                    >
                      Contact Support
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}