"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"
import { getPolicyByNumber } from "@/lib/policy-data"
import { FileText, Car, ArrowLeft, Shield, Download } from "lucide-react"

export default function CoveriseOrderDetailsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { addNotification } = useNotifications()
  const orderNumber = searchParams.get("number")

  const [isVerified, setIsVerified] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is verified and load order data
  useEffect(() => {
    if (!orderNumber) {
      router.push("/coverise")
      return
    }

    const verified = sessionStorage.getItem(`policy_verified_${orderNumber}`)
    if (verified !== "true") {
      router.push(`/coverise/order/view?number=${orderNumber}`)
      return
    }

    setIsVerified(true)

    // Load order data
    const order = getPolicyByNumber(orderNumber)
    if (order) {
      setOrderData(order)
    } else {
      addNotification({
        type: "error",
        title: "Order Not Found",
        message: "The requested order could not be found.",
      })
      router.push("/coverise")
    }

    setIsLoading(false)
  }, [orderNumber, router, addNotification])

  const handleDownloadDocument = async () => {
    setIsDownloading(true)

    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF()

      // Header with cyan theme
      doc.setFontSize(20)
      doc.setTextColor(6, 182, 212) // Cyan color
      doc.text("Certificate of Motor Insurance", 105, 20, { align: "center" })

      doc.setFontSize(9)
      doc.setTextColor(102, 102, 102)
      doc.text(
        "Here is your insurance certificate and Schedule. Extensions are visible even after the expiration date",
        105,
        26,
        { align: "center" },
      )

      doc.setTextColor(51, 51, 51)

      let yPosition = 40

      // Policy Information Box (Right side) - Cyan theme
      doc.setFillColor(240, 253, 255)
      doc.rect(130, yPosition - 2, 65, 20, "F")
      doc.setDrawColor(6, 182, 212)
      doc.rect(130, yPosition - 2, 65, 20, "S")

      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(6, 182, 212)
      doc.text("Order Information", 132, yPosition + 2)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.setTextColor(51, 51, 51)
      doc.text(`Document Number: ${orderData.policyNumber}`, 132, yPosition + 6)
      doc.text(`Valid From: ${formatDateTime(orderData.startDate, orderData.startTime)}`, 132, yPosition + 10)
      doc.text(`Valid Until: ${formatDateTime(orderData.endDate, orderData.endTime)}`, 132, yPosition + 14)

      // Holder Section (Left side)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(6, 182, 212)
      doc.text("Holder", 20, yPosition + 2)

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(51, 51, 51)
      doc.text(`Name: ${orderData.customerFirstName} ${orderData.customerSurname}`, 20, yPosition + 7)
      doc.text(
        `Date of Birth: ${new Date(orderData.dateOfBirth).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}`,
        20,
        yPosition + 12,
      )

      yPosition += 25

      // Vehicle Information Box (Right side) - Cyan theme
      doc.setFillColor(240, 253, 255)
      doc.rect(130, yPosition - 2, 65, 22, "F")
      doc.setDrawColor(6, 182, 212)
      doc.rect(130, yPosition - 2, 65, 22, "S")

      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(6, 182, 212)
      doc.text("Vehicle", 132, yPosition + 2)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.setTextColor(51, 51, 51)
      doc.text(`Make: ${orderData.vehicleMake}`, 132, yPosition + 6)
      doc.text(`Model: ${orderData.vehicleModel}`, 132, yPosition + 10)
      doc.text(`Registration: ${orderData.vehicleReg}`, 132, yPosition + 14)

      yPosition += 30

      // Coverage Section (Left side)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(6, 182, 212)
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
      doc.setTextColor(6, 182, 212)
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

      // Footer
      doc.setFontSize(8)
      doc.setTextColor(102, 102, 102)
      doc.text(`Coverise - Document Generated on ${new Date().toLocaleDateString()}`, 105, 280, {
        align: "center",
      })

      const pdfBlob = doc.output("blob")
      const pdfUrl = URL.createObjectURL(pdfBlob)
      window.open(pdfUrl, "_blank")

      addNotification({
        type: "success",
        title: "PDF Opened",
        message: "Your document has been opened in a new tab.",
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

  const handleDownloadSchedule = async () => {
    setIsDownloading(true)

    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF()

      // Header
      doc.setFontSize(20)
      doc.setTextColor(6, 182, 212)
      doc.text("Policy Schedule", 105, 20, { align: "center" })

      doc.setFontSize(10)
      doc.setTextColor(102, 102, 102)
      doc.text("Detailed breakdown of your coverage", 105, 28, { align: "center" })

      let yPosition = 45

      // Policy Details
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(6, 182, 212)
      doc.text("Policy Details", 20, yPosition)

      yPosition += 8
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(51, 51, 51)
      doc.text(`Policy Number: ${orderData.policyNumber}`, 20, yPosition)
      yPosition += 6
      doc.text(`Effective From: ${formatDateTime(orderData.startDate, orderData.startTime)}`, 20, yPosition)
      yPosition += 6
      doc.text(`Effective Until: ${formatDateTime(orderData.endDate, orderData.endTime)}`, 20, yPosition)
      yPosition += 6
      doc.text(`Premium: £${orderData.premium}`, 20, yPosition)

      yPosition += 15

      // Insured Person
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(6, 182, 212)
      doc.text("Insured Person", 20, yPosition)

      yPosition += 8
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(51, 51, 51)
      doc.text(`Name: ${orderData.customerFirstName} ${orderData.customerSurname}`, 20, yPosition)
      yPosition += 6
      doc.text(`Date of Birth: ${new Date(orderData.dateOfBirth).toLocaleDateString("en-GB")}`, 20, yPosition)
      yPosition += 6
      doc.text(`Occupation: ${orderData.occupation || "Not specified"}`, 20, yPosition)

      yPosition += 15

      // Vehicle Details
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(6, 182, 212)
      doc.text("Vehicle Details", 20, yPosition)

      yPosition += 8
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(51, 51, 51)
      doc.text(`Registration: ${orderData.vehicleReg}`, 20, yPosition)
      yPosition += 6
      doc.text(`Make: ${orderData.vehicleMake}`, 20, yPosition)
      yPosition += 6
      doc.text(`Model: ${orderData.vehicleModel}`, 20, yPosition)

      yPosition += 15

      // Coverage Details
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(6, 182, 212)
      doc.text("Coverage Details", 20, yPosition)

      yPosition += 8
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(51, 51, 51)
      doc.text("• Comprehensive coverage for social, domestic, and pleasure purposes", 20, yPosition)
      yPosition += 6
      doc.text("• Commuting included", 20, yPosition)
      yPosition += 6
      doc.text("• Class 1 business use", 20, yPosition)

      // Footer
      doc.setFontSize(8)
      doc.setTextColor(102, 102, 102)
      doc.text(`Coverise - Schedule Generated on ${new Date().toLocaleDateString()}`, 105, 280, {
        align: "center",
      })

      const pdfBlob = doc.output("blob")
      const pdfUrl = URL.createObjectURL(pdfBlob)
      window.open(pdfUrl, "_blank")

      addNotification({
        type: "success",
        title: "PDF Opened",
        message: "Your schedule has been opened in a new tab.",
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

  const handleDownloadStatement = async () => {
    setIsDownloading(true)

    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF()

      // Header
      doc.setFontSize(20)
      doc.setTextColor(6, 182, 212)
      doc.text("Payment Statement", 105, 20, { align: "center" })

      doc.setFontSize(10)
      doc.setTextColor(102, 102, 102)
      doc.text("Summary of your payment and policy details", 105, 28, { align: "center" })

      let yPosition = 45

      // Statement Details
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(6, 182, 212)
      doc.text("Statement Details", 20, yPosition)

      yPosition += 8
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(51, 51, 51)
      doc.text(`Statement Date: ${new Date().toLocaleDateString("en-GB")}`, 20, yPosition)
      yPosition += 6
      doc.text(`Policy Number: ${orderData.policyNumber}`, 20, yPosition)
      yPosition += 6
      doc.text(`Policyholder: ${orderData.customerFirstName} ${orderData.customerSurname}`, 20, yPosition)

      yPosition += 15

      // Payment Summary
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(6, 182, 212)
      doc.text("Payment Summary", 20, yPosition)

      yPosition += 8
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(51, 51, 51)
      doc.text(`Premium Amount: £${orderData.premium}`, 20, yPosition)
      yPosition += 6
      doc.text(`Payment Method: Card Payment`, 20, yPosition)
      yPosition += 6
      doc.text(`Payment Status: Paid`, 20, yPosition)
      yPosition += 6
      doc.text(`Payment Date: ${new Date(orderData.startDate).toLocaleDateString("en-GB")}`, 20, yPosition)

      yPosition += 15

      // Policy Period
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(6, 182, 212)
      doc.text("Policy Period", 20, yPosition)

      yPosition += 8
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(51, 51, 51)
      doc.text(`Start Date: ${formatDateTime(orderData.startDate, orderData.startTime)}`, 20, yPosition)
      yPosition += 6
      doc.text(`End Date: ${formatDateTime(orderData.endDate, orderData.endTime)}`, 20, yPosition)

      yPosition += 15

      // Total Breakdown
      doc.setFillColor(240, 253, 255)
      doc.rect(20, yPosition - 5, 170, 25, "F")
      doc.setDrawColor(6, 182, 212)
      doc.rect(20, yPosition - 5, 170, 25, "S")

      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(6, 182, 212)
      doc.text("Total Amount Paid", 25, yPosition)

      doc.setFontSize(16)
      doc.text(`£${orderData.premium}`, 165, yPosition, { align: "right" })

      // Footer
      doc.setFontSize(8)
      doc.setTextColor(102, 102, 102)
      doc.text(`Coverise - Statement Generated on ${new Date().toLocaleDateString()}`, 105, 280, {
        align: "center",
      })

      const pdfBlob = doc.output("blob")
      const pdfUrl = URL.createObjectURL(pdfBlob)
      window.open(pdfUrl, "_blank")

      addNotification({
        type: "success",
        title: "PDF Opened",
        message: "Your statement has been opened in a new tab.",
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
      <div className="min-h-screen bg-black relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <main className="flex items-center justify-center min-h-screen relative z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading order details...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <main className="flex items-center justify-center min-h-screen relative z-10">
          <div className="text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Order Not Found</h1>
            <p className="text-gray-400 mb-6">The requested order could not be found.</p>
            <Button
              onClick={() => router.push("/coverise")}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
            >
              Return to Home
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-3/4 left-3/4 w-64 h-64 bg-cyan-400/10 rounded-full blur-2xl animate-pulse delay-1000" />
      </div>

      <main className="px-3 sm:px-6 py-6 sm:py-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/coverise/dashboard")}
              className="mb-4 text-cyan-400 hover:text-cyan-300 hover:bg-white/10"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>

            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl p-8 shadow-2xl border-2 border-cyan-500/30 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-500/10 to-teal-500/10 rounded-full blur-2xl -ml-24 -mb-24" />

              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-white bg-clip-text text-transparent">
                      Order Details
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">View and download your document information</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-md ${
                      orderData.status === "Active"
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                        : orderData.status === "Expired"
                          ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                          : "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white"
                    }`}
                  >
                    {orderData.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-800 hover:border-cyan-500/50 transition-colors">
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mr-3">
                    <Car className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{orderData.vehicleReg}</h3>
                    <p className="text-lg text-gray-400 font-medium">
                      {orderData.vehicleMake} {orderData.vehicleModel}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-black/30 p-4 rounded-xl border border-gray-800">
                  <span className="text-sm text-gray-400 font-medium block mb-1">Document Number</span>
                  <span className="text-base font-bold text-white">{orderData.policyNumber}</span>
                </div>
                <div className="bg-black/30 p-4 rounded-xl border border-gray-800">
                  <span className="text-sm text-gray-400 font-medium block mb-1">Premium</span>
                  <span className="text-base font-bold text-white">£{orderData.premium}</span>
                </div>
                <div className="bg-black/30 p-4 rounded-xl border border-gray-800">
                  <span className="text-sm text-gray-400 font-medium block mb-1">Valid From</span>
                  <span className="text-base font-bold text-white">
                    {formatDateTime(orderData.startDate, orderData.startTime)}
                  </span>
                </div>
                <div className="bg-black/30 p-4 rounded-xl border border-gray-800">
                  <span className="text-sm text-gray-400 font-medium block mb-1">Valid Until</span>
                  <span className="text-base font-bold text-white">
                    {formatDateTime(orderData.endDate, orderData.endTime)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-800 hover:border-cyan-500/50 transition-colors">
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mr-3">
                    <FileText className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Documents</h2>
                    <p className="text-sm text-gray-400 font-medium">Download your documents securely</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="group bg-gradient-to-r from-cyan-500/10 to-black/30 p-4 rounded-xl border-2 border-cyan-500/30 hover:border-cyan-500/50 transition-all hover:shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/30 transition-colors">
                        <FileText className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-base text-white">Certificate</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleDownloadDocument}
                      disabled={isDownloading}
                      className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {isDownloading ? "Opening..." : "Download"}
                    </Button>
                  </div>
                </div>

                <div className="group bg-gradient-to-r from-cyan-500/10 to-black/30 p-4 rounded-xl border-2 border-cyan-500/30 hover:border-cyan-500/50 transition-all hover:shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/30 transition-colors">
                        <FileText className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-base text-white">Schedule</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleDownloadSchedule}
                      disabled={isDownloading}
                      className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {isDownloading ? "Opening..." : "Download"}
                    </Button>
                  </div>
                </div>

                <div className="group bg-gradient-to-r from-cyan-500/10 to-black/30 p-4 rounded-xl border-2 border-cyan-500/30 hover:border-cyan-500/50 transition-all hover:shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/30 transition-colors">
                        <FileText className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-base text-white">Statement</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleDownloadStatement}
                      disabled={isDownloading}
                      className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {isDownloading ? "Opening..." : "Download"}
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
