"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"
import { getPolicyByNumber } from "@/lib/policy-data"
import { FileText, Car, MessageSquare, ArrowLeft, Shield, Download } from "lucide-react"

export default function PolicyDetailsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { addNotification } = useNotifications()
  const policyNumber = searchParams.get("number")

  const [isVerified, setIsVerified] = useState(false)
  const [showCertificate, setShowCertificate] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [policyData, setPolicyData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [policyScheduleVisible, setPolicyScheduleVisible] = useState(true)

  // Add this useEffect to fetch the visibility setting
  useEffect(() => {
    const fetchPolicyScheduleVisibility = async () => {
      try {
        const response = await fetch("/api/admin/policy-schedule-visibility")
        const result = await response.json()
        if (result.success) {
          setPolicyScheduleVisible(result.visible)
        }
      } catch (error) {
        console.error("Error fetching policy schedule visibility:", error)
      }
    }

    fetchPolicyScheduleVisibility()
  }, [])

  // Check if user is verified and load policy data
  useEffect(() => {
    if (!policyNumber) {
      router.push("/")
      return
    }

    const verified = sessionStorage.getItem(`policy_verified_${policyNumber}`)
    if (verified !== "true") {
      router.push(`/policy/view?number=${policyNumber}`)
      return
    }

    setIsVerified(true)

    // Load policy data
    const policy = getPolicyByNumber(policyNumber)
    if (policy) {
      setPolicyData(policy)
    } else {
      addNotification({
        type: "error",
        title: "Policy Not Found",
        message: "The requested policy could not be found.",
      })
      router.push("/")
    }

    setIsLoading(false)
  }, [policyNumber, router, addNotification])

  const handleDownloadCertificate = async () => {
    setIsDownloading(true)

    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF()

      // Header
      doc.setFontSize(20)
      doc.setTextColor(13, 148, 136) // Teal color
      doc.text("Certificate of Motor Insurance", 105, 20, { align: "center" })

      doc.setFontSize(9)
      doc.setTextColor(102, 102, 102)
      doc.text(
        "Here is your insurance certificate and Schedule. Extensions are visible even after the expiration date",
        105,
        26,
        { align: "center" },
      )

      // Reset color for content
      doc.setTextColor(51, 51, 51)

      let yPosition = 40

      // Policy Information Box (Right side)
      doc.setFillColor(248, 249, 250)
      doc.rect(130, yPosition - 2, 65, 20, "F")
      doc.setDrawColor(229, 231, 235)
      doc.rect(130, yPosition - 2, 65, 20, "S")

      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(13, 148, 136)
      doc.text("Policy Information", 132, yPosition + 2)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.setTextColor(51, 51, 51)
      doc.text(`Document Number: ${policyData.policyNumber}`, 132, yPosition + 6)
      doc.text(`Valid From: ${formatDateTime(policyData.startDate, policyData.startTime)}`, 132, yPosition + 10)
      doc.text(`Valid Until: ${formatDateTime(policyData.endDate, policyData.endTime)}`, 132, yPosition + 14)

      // Holder Section (Left side)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(13, 148, 136)
      doc.text("Holder", 20, yPosition + 2)

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(51, 51, 51)
      doc.text(`Name: ${policyData.customerFirstName} ${policyData.customerSurname}`, 20, yPosition + 7)
      doc.text(
        `Date of Birth: ${new Date(policyData.dateOfBirth).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}`,
        20,
        yPosition + 12,
      )

      yPosition += 25

      // Vehicle Information Box (Right side)
      doc.setFillColor(248, 249, 250)
      doc.rect(130, yPosition - 2, 65, 22, "F")
      doc.setDrawColor(229, 231, 235)
      doc.rect(130, yPosition - 2, 65, 22, "S")

      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(13, 148, 136)
      doc.text("Vehicle", 132, yPosition + 2)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.setTextColor(51, 51, 51)
      doc.text(`Make: ${policyData.vehicleMake}`, 132, yPosition + 6)
      doc.text(`Model: ${policyData.vehicleModel}`, 132, yPosition + 10)
      doc.text(`Registration: ${policyData.vehicleReg}`, 132, yPosition + 14)

      yPosition += 30

      // Coverage Section (Left side)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(13, 148, 136)
      doc.text("Coverage", 20, yPosition + 2)

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(51, 51, 51)
      const coverageText =
        "The insurance policy provides comprehensive coverage for social, domestic, and pleasure purposes, including commuting. Additionally, it includes Class 1 business use."
      const splitCoverage = doc.splitTextToSize(coverageText, 100)
      doc.text(splitCoverage, 20, yPosition + 7)

      yPosition += 30

      // Restrictions & Exclusions
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(13, 148, 136)
      doc.text("Restrictions & Exclusions", 20, yPosition)

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(51, 51, 51)

      const restrictions = [
        "• Does not cover the carriage of passengers or goods for hire or reward.",
        "• Only provides coverage for the policyholder to drive the vehicle.",
        "• Does not provide coverage for the recovery of an impounded vehicle.",
        "• Please refer to your full policy document to familiarize yourself with any specific restrictions and exclusions that may apply to your insurance coverage.",
      ]

      let restrictionY = yPosition + 5
      restrictions.forEach((restriction) => {
        const splitRestriction = doc.splitTextToSize(restriction, 170)
        doc.text(splitRestriction, 20, restrictionY)
        restrictionY += splitRestriction.length * 3.5
      })

      yPosition = restrictionY + 8

      // Endorsements
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(13, 148, 136)
      doc.text("Endorsements", 20, yPosition)

      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(51, 51, 51)
      doc.text("- Accidental Damage Fire & Theft Excess (001) -", 20, yPosition + 5)

      doc.setFont("helvetica", "normal")
      const endorsementText =
        "We will not be liable to cover the initial amount, as indicated below, for any claims or series of claims arising from a single event covered by the Accidental Damage Section and/or Fire and Theft Section of your policy."
      const splitEndorsement = doc.splitTextToSize(endorsementText, 170)
      doc.text(splitEndorsement, 20, yPosition + 10)

      yPosition += 20

      // Excess
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(13, 148, 136)
      doc.text("Excess", 20, yPosition)

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(51, 51, 51)
      doc.text("The mandatory excess for accidental damage, fire, and theft is set at", 20, yPosition + 5)

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(13, 148, 136)
      doc.text(`£250`, 20, yPosition + 12)

      yPosition += 20

      // Contact
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(13, 148, 136)
      doc.text("Contact", 20, yPosition)

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(51, 51, 51)
      const contactText =
        "For any inquiries or if you need to contact Monzic regarding your policy, please fill out the contact form on our website. We will respond to your message as promptly as possible."
      const splitContact = doc.splitTextToSize(contactText, 170)
      doc.text(splitContact, 20, yPosition + 5)

      yPosition += 15

      // Underwriter Declaration
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(13, 148, 136)
      doc.text("Underwriter Declaration", 20, yPosition)

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(51, 51, 51)
      const declarationText =
        "I confirm that the insurance mentioned in this Certificate complies with the applicable laws in Great Britain, Northern Ireland, the Isle of Man, the Island of Guernsey, the Island of Jersey, and the Island of Alderney. This certification is provided on behalf of the authorizing insurers, Mulsanne Insurance Company Limited. Mulsanne Insurance Company Limited is licensed by the Financial Services Commission in Gibraltar to conduct insurance operations under the Financial Services (Insurance Companies) Act."
      const splitDeclaration = doc.splitTextToSize(declarationText, 170)
      doc.text(splitDeclaration, 20, yPosition + 5)

      // Footer
      doc.setFontSize(8)
      doc.setTextColor(102, 102, 102)
      doc.text(`Monzic Insurance Ltd - Certificate Generated on ${new Date().toLocaleDateString()}`, 105, 280, {
        align: "center",
      })

      const pdfBlob = doc.output("blob")
      const pdfUrl = URL.createObjectURL(pdfBlob)
      window.open(pdfUrl, "_blank")

      addNotification({
        type: "success",
        title: "PDF Opened",
        message: "Your certificate has been opened in a new tab.",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      addNotification({
        type: "error",
        title: "Download Failed",
        message: "There was an error generating the PDF. Please try again.",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const formatDateTime = (dateString: string, timeString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear().toString().slice(-2)
    return `${day}/${month}/${year} ${timeString}`
  }

  if (isLoading || !isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/30 to-gray-50">
        <main className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading policy details...</p>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Policy Not Found</h1>
            <p className="text-gray-600 mb-6">The requested policy could not be found.</p>
            <Button onClick={() => router.push("/")} className="bg-teal-600 hover:bg-teal-700 text-white">
              Return to Home
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/30 to-gray-50">
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
                    <p className="text-sm text-gray-600 mt-1">View and download your policy information</p>
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
            {/* Vehicle & Policy Information */}
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
                    {formatDateTime(policyData.startDate, policyData.startTime)}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <span className="text-sm text-gray-600 font-medium block mb-1">Valid Until</span>
                  <span className="text-base font-bold text-gray-900">
                    {formatDateTime(policyData.endDate, policyData.endTime)}
                  </span>
                </div>
              </div>
            </div>

            {/* Documents & Help - moved below */}
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

              {/* Documents */}
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
                      onClick={handleDownloadCertificate}
                      disabled={isDownloading}
                      className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {isDownloading ? "Opening..." : "Download"}
                    </Button>
                  </div>
                </div>

                {policyScheduleVisible && (
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
                        onClick={handleDownloadCertificate}
                        disabled={isDownloading}
                        className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {isDownloading ? "Opening..." : "Download"}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="group bg-gradient-to-r from-teal-50 to-white p-4 rounded-xl border-2 border-teal-200 hover:border-teal-300 transition-all hover:shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-teal-200 transition-colors">
                        <FileText className="w-5 h-5 text-teal-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-base text-gray-900">Statement</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleDownloadCertificate}
                      disabled={isDownloading}
                      className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {isDownloading ? "Opening..." : "Download"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Help Section */}
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
