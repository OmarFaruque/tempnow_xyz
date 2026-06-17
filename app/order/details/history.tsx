"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { Header } from "@/components/header"
import { useNotifications } from "@/hooks/use-notifications"
import { FileText, Download, User, Car, Calendar, X, MessageSquare, ArrowLeft, Shield } from "lucide-react"
import Image from "next/image"

import { useSettings } from "@/context/settings";

const PrintableCertificate = ({ policyData, formatDateTime, settings }) => {
  const [logoUrl, setLogoUrl] = useState(process.env.NEXT_PUBLIC_BASE_URL +"/cert-logo.png");

  useEffect(() => {
    // Construct absolute URL for html2canvas compatibility
    setLogoUrl(`${process.env.NEXT_PUBLIC_BASE_URL}/cert-logo.png`);
  }, []);
  if (!policyData) return null;
  const template = settings?.certificateTemplate;

  const quoteData = policyData.quoteData ? JSON.parse(policyData.quoteData) : {};
  const customerData = quoteData.customerData || {};

  const docNumber = policyData.policyNumber;
  const registrationMark = policyData.regNumber;
  const descriptionOfVehicles = `${policyData.vehicleMake} ${policyData.vehicleModel}`;
  const make = policyData.vehicleMake;
  const model = policyData.vehicleModel;
  const name = [policyData?.nameTitle, policyData?.firstName, policyData?.lastName].filter(Boolean).join(" ");
  const dob = new Date(policyData.dateOfBirth).toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: 'numeric' });
  const license = customerData.licenseType || "Full";
  const effectiveDate = formatDateTime(policyData.startDate, policyData.startDate.split(" ")[1]);
  const expiryDate = formatDateTime(policyData.endDate, policyData.endDate.split(" ")[1]);
  const address = policyData.postCode ? `${policyData.address}, ${policyData.postCode}` : policyData.address;

  const premium = Number(policyData.update_price ?? policyData.cpw).toFixed(2);
  const excess = "750.00";

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
  };

  const replaceVariables = (text: string) => {
    if (!text) return "";
    return text.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return templateData[variable as keyof typeof templateData] || match;
    });
  };

  const page1Content = template ? replaceVariables(template.page1) : "Template not loaded.";
  const page2Content = template ? replaceVariables(template.page2) : "Template not loaded.";
  const page1FooterContent = template ? replaceVariables(template.page1_footer) : "";


  return (
    <div id="printable-certificate" className="printable-certificate hidden print:block">
      {/* Page 1 */}
      <div
        id="certificate-page-1"
        className="rounded-lg bg-white shadow-2xl overflow-hidden print:shadow-none print:border-none"
      >
        <div className="flex flex-col items-center justify-center pt-1 -mb-2">
          {/* Use a standard img tag with an absolute URL for html2canvas compatibility */}
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
          <div
            className="border-2 rounded border-gray-900 p-2 relative overflow-hidden"
            style={{ minHeight: "420px" }}
          >
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
                      left: `${col * 20 - 10}%`, // Increased horizontal spacing
                      top: `${row * 15 - 5}%`,   // Increased vertical spacing
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

            <div
              className="relative z-10"
              dangerouslySetInnerHTML={{ __html: page1Content }}
            />
          </div>

          <div
            className="mt-2"
            dangerouslySetInnerHTML={{ __html: page1FooterContent }}
          />
        </div>
      </div>

      {/* Page 2 */}
      <div
        id="certificate-page-2"
        className="rounded-lg bg-white shadow-2xl overflow-hidden print:shadow-none print:border-none print:mt-0"
      >
        <div 
          className="p-8" 
          style={{ backgroundColor: "#ffffff", color: "#0a0a0a" }}
          dangerouslySetInnerHTML={{ __html: page2Content }}
        >
        </div>
      </div>
    </div>
  )
};

export default function PolicyDetailsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { addNotification } = useNotifications()
  const policyNumber = searchParams.get("number")
  const settings = useSettings();

  const [isVerified, setIsVerified] = useState(false)
  const [showCertificate, setShowCertificate] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [isDownloading, setIsDownloading] = useState(false)
  const [policyData, setPolicyData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is verified and load policy data
  useEffect(() => {
    const fetchPolicyData = async () => {
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

      try {
        // Load policy data
        const response = await fetch(`/api/policy/details?number=${policyNumber}`);
        const policy = await response.json();

        if (response.ok) {
          setPolicyData(policy)
        } else {
          addNotification({
            type: "error",
            title: "Order Not Found",
            message: policy.error || "The requested order could not be found.",
          })
          router.push("/")
        }
      } catch (error) {
        console.error("Error loading order:", error)
        addNotification({
          type: "error",
          title: "Error",
          message: "Failed to load order details.",
        })
      } finally {
        setIsLoading(false)
      }
  }

  fetchPolicyData()
  }, [policyNumber, router, addNotification])



const handleViewPdf = async () => {
  setIsDownloading(true)
  const certificateElement = document.getElementById("printable-certificate")
  const page1 = document.getElementById("certificate-page-1")
  const page2 = document.getElementById("certificate-page-2")

  if (!certificateElement || !page1 || !page2) {
    addNotification({
      type: "error",
      title: "Failed to generate PDF",
      message: "Could not find certificate elements to generate PDF.",
    })
    setIsDownloading(false)
    return
  }

  // Temporarily make the certificate visible but off-screen for rendering
  certificateElement.classList.remove("hidden")
  certificateElement.style.position = "absolute"
  // Force the component to render at A4 width to ensure correct styling
  certificateElement.style.width = "210mm" 
  certificateElement.style.left = "-9999px"
  certificateElement.style.top = "0"

  // Add a small delay to ensure fonts and styles are fully rendered
  await new Promise(resolve => setTimeout(resolve, 200));

    try {
      const canvasOptions = { scale: 2, useCORS: true };
      const canvas1 = await html2canvas(page1, canvasOptions);
      const canvas2 = await html2canvas(page2, canvasOptions);

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();

      // --- Page 1 ---
      const imgData1 = canvas1.toDataURL("image/png");
      const img1Height = (canvas1.height * pdfWidth) / canvas1.width;
      // Check if height exceeds page, though it's unlikely for this content
      const page1Height = img1Height > pdf.internal.pageSize.getHeight() ? pdf.internal.pageSize.getHeight() : img1Height;
      pdf.addImage(imgData1, "PNG", 0, 0, pdfWidth, page1Height);

      // --- Page 2 ---
      pdf.addPage();
      const imgData2 = canvas2.toDataURL("image/png");
      const img2Height = (canvas2.height * pdfWidth) / canvas2.width;
      const page2Height = img2Height > pdf.internal.pageSize.getHeight() ? pdf.internal.pageSize.getHeight() : img2Height;
      pdf.addImage(imgData2, "PNG", 0, 0, pdfWidth, page2Height);
      
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');


      addNotification({
        type: "success",
        title: "PDF Generated",
        message: "Your certificate has been opened in a new tab.",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      addNotification({
        type: "error",
        title: "Failed to generate PDF",
        message: "There was an error generating the PDF. Please try again.",
      })
    } finally {
      // Hide the certificate element again
      certificateElement.classList.add("hidden")
      certificateElement.style.position = ""
      certificateElement.style.width = ""
      certificateElement.style.left = ""
      certificateElement.style.top = ""
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

  const getPolicyStatus = (policy) => {
    if (!policy || !policy.startDate || !policy.endDate) {
        return "Unknown";
    }
    const now = new Date();
    const startDate = new Date(policy.startDate);
    const endDate = new Date(policy.endDate);

    if (endDate < now) {
      return "Expired";
    }
    if (startDate > now) {
      return "Upcoming";
    }
    return "Active";
  };

  const policyStatus = getPolicyStatus(policyData);

  if (isLoading || !isVerified) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="flex items-center justify-center min-h-[calc(100vh-80px)]">
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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="flex items-center justify-center min-h-[calc(100vh-80px)]">
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

  const quoteData = policyData?.quoteData ? JSON.parse(policyData.quoteData) : {};
  const customerData = quoteData.customerData || {};

  const docNumber = policyData?.policyNumber;
  const registrationMark = policyData?.regNumber;
  const descriptionOfVehicles = policyData ? `${policyData.vehicleMake} ${policyData.vehicleModel}` : "";
  const make = policyData?.vehicleMake;
  const model = policyData?.vehicleModel;
  const name = policyData ? `${policyData.nameTitle} ${policyData.firstName} ${policyData.lastName}` : "";
  const dob = policyData ? new Date(policyData.dateOfBirth).toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "";
  const license = customerData.licenseType || "Full";
  const effectiveDate = policyData ? formatDateTime(policyData.startDate, policyData.startDate.split(" ")[1]) : "";
  const expiryDate = policyData ? formatDateTime(policyData.endDate, policyData.endDate.split(" ")[1]) : "";
  const address = policyData.postCode ? `${policyData?.address}, ${policyData?.postCode}` : policyData?.address;
  const premium = policyData ? Number(policyData.update_price ?? policyData.cpw).toFixed(2) : "0.00";
  const excess = "750.00";



  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <PrintableCertificate policyData={policyData} formatDateTime={formatDateTime} settings={settings} />
      <main className="px-3 sm:px-6 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-4 text-gray-600 hover:text-gray-900"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          <div className="bg-white rounded-xl p-3 sm:p-6 shadow-lg border border-gray-200">
            <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Order {policyNumber}</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  {policyData.customerFirstName} {policyData.customerSurname}
                </p>
              </div>
              <div className="flex justify-start">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    policyStatus === "Active"
                      ? "bg-green-100 text-green-800"
                      : policyStatus === "Expired"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {policyStatus}
                </span>
              </div>
            </div>

            <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 sm:mb-6 w-full grid grid-cols-2">
                <TabsTrigger value="details" className="text-sm sm:text-base">
                  Docs Details
                </TabsTrigger>
                <TabsTrigger value="documents" className="text-sm sm:text-base">
                  Documents
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-2 sm:mb-3">
                      <Car className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 mr-2" />
                      <h2 className="text-base sm:text-lg font-semibold">Vehicle Information</h2>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Registration:</span>
                        <span className="font-medium">{policyData.regNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Make:</span>
                        <span className="font-medium">{policyData.vehicleMake}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Model:</span>
                        <span className="font-medium">{policyData.vehicleModel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Value:</span>
                        <span className="font-medium">{JSON.parse(policyData.quoteData)?.customerData?.vehicleValue}</span>
                        
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-2 sm:mb-3">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 mr-2" />
                      <h2 className="text-base sm:text-lg font-semibold">Personal Details</h2>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium text-right">
                          {policyData.nameTitle} {policyData.firstName} {policyData.lastName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date of Birth:</span>
                        <span className="font-medium">{policyData.dateOfBirth ? new Date(policyData.dateOfBirth).toLocaleDateString() : "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{policyData.phone}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-gray-600">Address:</span>
                        <span className="font-medium text-right">{policyData.postCode ? `${policyData.address}, ${policyData.postCode}` : policyData.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-2 sm:mb-3">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 mr-2" />
                    <h2 className="text-base sm:text-lg font-semibold">Docs Information</h2>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="flex justify-between sm:flex-col">
                        <span className="text-gray-600 text-sm">Order Number:</span>
                        <span className="font-medium text-sm">{policyData.policyNumber}</span>
                      </div>
                      <div className="flex justify-between sm:flex-col">
                        
                      </div>
                      <div className="flex justify-between sm:flex-col">
                        <span className="text-gray-600 text-sm">Premium:</span>
                        <span className="font-medium text-sm">£{Number(policyData.update_price ?? policyData.cpw).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      <div className="flex justify-between sm:flex-col">
                        <span className="text-gray-600 text-sm">Valid From:</span>
                        <span className="font-medium text-sm text-right sm:text-left">
                          {formatDateTime(policyData.startDate, policyData.startDate.split(" ")[1])}
                        </span>
                      </div>
                      <div className="flex justify-between sm:flex-col">
                        <span className="text-gray-600 text-sm">Valid Until:</span>
                        <span className="font-medium text-sm text-right sm:text-left">
                          {formatDateTime(policyData.endDate, policyData.endDate.split(" ")[1])}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-3">
                    <MessageSquare className="w-5 h-5 text-teal-600 mr-2" />
                    <h2 className="text-lg font-semibold">Need Help?</h2>
                  </div>
                  <div className="space-y-3 text-sm">
                    <p>
                      For any inquiries or if you need assistance regarding your order, please fill out the contact
                      form on our website. We will respond to your message as promptly as possible.
                    </p>
                    <div>
                      <a
                        href="/contact"
                        className="inline-flex items-center text-teal-600 hover:text-teal-700 hover:underline"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Contact Form
                      </a>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                  <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Available Documents</h2>

                  <div className="space-y-2 sm:space-y-3">
                    <div
                      className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setShowCertificate(true)}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 mr-2 sm:mr-3 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm sm:text-base truncate">Cover note</p>
                          {/* <p className="text-xs text-gray-500">Insurance Certificate PDF</p> */}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-teal-600 ml-2 flex-shrink-0">
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                    </div>
                    {settings?.general?.policyScheduleVisible && policyStatus.toLowerCase() != 'expired' && (
                                              <div
                                                className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer"
                                                onClick={() =>
                                                  window.open(
                                                    `/api/generate-policy-schedule?number=${policyNumber}`,
                                                    "_blank"
                                                  )
                                                }
                                              >                        
                          <div className="flex items-center flex-1 min-w-0">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm sm:text-base truncate">Document Schedule</p>
                            <p className="text-xs text-gray-500">Detailed document terms and conditions</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="text-blue-600 ml-2 flex-shrink-0">
                          <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                      </div>
                    )}



                    {settings?.general?.productInformationVisible && policyStatus.toLowerCase() != 'expired' && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer"
                          onClick={() =>
                            window.open(
                              `${process.env.NEXT_PUBLIC_BASE_URL}/.pdf/tempnow.pdf`,
                              "_blank"
                            )
                          }
                                              >                        
                          <div className="flex items-center flex-1 min-w-0">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600 mr-2 sm:mr-3 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm sm:text-base truncate">Product Information</p>
                            <p className="text-xs text-gray-500">Detailed product information</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="text-pink-600 ml-2 flex-shrink-0">
                          <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                      </div>
                    )}


                    {settings?.general?.statementOfFactVisible && policyStatus.toLowerCase() != 'expired' && (
                      <div
                        className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer"
                        onClick={() =>
                          handleViewPDF(
                            `/api/generate-statement-of-fact?number=${policyNumber}`
                          )
                        }
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mr-2 sm:mr-3 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm sm:text-base truncate">Statement of Fact</p>
                            <p className="text-xs text-gray-500">View your statement of fact document</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="text-purple-600 ml-2 flex-shrink-0">
                          <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {showCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-3 sm:p-4 border-b">
              <h2 className="text-lg sm:text-xl font-bold">Cover Note</h2>
              <button onClick={() => setShowCertificate(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-2 sm:p-4">
              <div className="space-y-8">
                {/* Page 1 */}
                <div
                  id="certificate-page-1-popup"
                  className="rounded-lg border-2 border-gray-300 bg-white shadow-2xl overflow-hidden print:shadow-none print:border-none"
                >
                  <div className="flex flex-col items-center justify-center pt-1 -mb-2">
                    <Image
                      src="/cert-logo.png"
                      alt="Motor Covernote Limited"
                      width={128}
                      height={38}
                      className="h-auto w-[128px]"
                      priority
                    />
                  </div>

                  <div className="px-3 pb-3" style={{ backgroundColor: "#ffffff", color: "#0a0a0a" }}>
                    <div
                      className="border-2 rounded border-gray-900 p-3 relative overflow-hidden"
                      style={{ minHeight: "420px" }}
                    >
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
                                left: `${col * 12 - 5}%`,
                                top: `${row * 10 - 5}%`,
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

                      <div className="relative z-10 space-y-3">
                        <div className="text-xs flex justify-between items-start">
                          <div className="space-y-1">
                            <div>
                              <span className="font-bold">Our Ref:</span> {docNumber}
                            </div>
                            <div className="font-bold">Registration Mark: {registrationMark}</div>
                          </div>
                          <div className="text-right">
                            <div className="uppercase tracking-wider text-gray-600 text-[9px]">Certificate Number</div>
                            <div className="font-bold">{docNumber}</div>
                          </div>
                        </div>

                        <div className="space-y-2 text-[10px] leading-tight">
                          <div className="flex gap-2">
                            <span className="font-bold">1. DESCRIPTION OF VEHICLES:</span>
                            <span>{descriptionOfVehicles}</span>
                          </div>

                          <div className="flex gap-2">
                            <span className="font-bold">2. NAME OF POLICYHOLDER</span>
                            <span>{name.toUpperCase()}</span>
                          </div>

                          <div>
                            <div className="font-bold">3. EFFECTIVE DATE OF THE COMMENCEMENT OF</div>
                            <div className="font-bold">COVERNOTE FOR THE PURPOSES OF THE RELEVANT LAW</div>
                            <div className="mt-1">{effectiveDate}</div>
                          </div>

                          <div>
                            <div className="font-bold">4. DATE OF EXPIRY OF COVERNOTE</div>
                            <div className="mt-1">{expiryDate}</div>
                          </div>

                          <div>
                            <div className="font-bold">5. PERSONS OR CLASSES OF PERSONS ENTITLED TO DRIVE</div>
                            <div className="mt-1">
                              {name.toUpperCase()} <span className="font-bold">DOB:</span> {dob}{" "}
                              <span className="font-bold">Licence:</span> {license}
                            </div>
                          </div>

                          <div>
                            <div className="font-bold">
                              6. LIMITATIONS AS TO USE SUBJECT TO THE EXCLUSIONS BELOW AND THE ADDITIONAL EXCLUSION OF USE IN
                              ANY COMPETITION, TRIAL, PERFORMANCE TEST, RACE OR TRIAL OF SPEED, INCLUDING OFF-ROAD EVENTS,
                              WHETHER BETWEEN MOTOR VEHICLES OR OTHERWISE, AND IRRESPECTIVE OF WHETHER THIS TAKES PLACE ON ANY
                              CIRCUIT OR TRACK, FORMED OR OTHERWISE, AND REGARDLESS OF ANY STATUTORY AUTHORISATION OF ANY SUCH
                              EVENTS.
                            </div>
                            <div className="mt-2 pl-4 space-y-1">
                              <div>(a) Use for social, domestic or pleasure purposes.</div>
                              <div>(b) Use by the Policyholder in connection with the business of the Policyholder.</div>
                              <div>(c) Use for towing any vehicle (mechanically propelled or otherwise)</div>
                            </div>
                          </div>

                          <div>
                            <div className="font-bold">EXCLUSIONS</div>
                            <div className="mt-1 pl-4 space-y-1">
                              <div>(a) The carriage of passengers for hire or reward.</div>
                              <div>(b) The carriage of goods for hire or reward.</div>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="font-bold">IMPOUNDED VEHICLES:</div>
                            <div>
                              This Short Term Covernote certificate cannot be used for the purpose of recovering an impounded
                              vehicle.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5 text-[10px] leading-snug">
                      <p>
                        I hereby certify that the Policy to which this Certificate relates satisfies the requirements of the
                        relevant Law applicable in Great Britain, Northern Ireland, the Isle of Man, the Island of Guernsey, the
                        Island of Jersey and the Island of Alderney.
                      </p>

                      <div className="font-bold text-xs" style={{ color: "#0a0a0a" }}>
                        motor covernote limited
                      </div>

                      <div className="space-y-2 text-xs">
                        <p>
                          <span className="font-bold">NOTE:</span> For full details of the covernote cover reference should be
                          made to the policy.
                        </p>
                        <p>
                          <span className="font-bold">ADVICE TO THIRD PARTIES:</span> Nothing contained in this Certificate
                          affects your right as a Third Party to make a claim.
                        </p>
                        <p>
                          Any query relating to this covernote or any alteration should be referred to the Agent through whom
                          the Covernote is arranged or the motor cover limited Office - address obtainable from the policy.
                        </p>
                        <p>The number under the heading 'CERTIFICATE NUMBER' should be quoted in all correspondence.</p>
                        <p>
                          <span className="font-bold">TRANSFER OF INTEREST</span> This certificate is not transferable.
                        </p>
                        <p>
                          <span className="font-bold">TERMINATION:</span> If for any reason the Covernote is terminated during
                          its currency, the Certificate must be returned.
                        </p>
                        <p>Failure to comply with this obligation is an offence under the Road Traffic Acts.</p>
                        <p className="font-bold">
                          THIS CERTIFICATE HAS BEEN PRODUCED ON A COMPUTER PRINTER AND IS NOT VALID IF ALTERED IN ANY WAY.
                        </p>
                      </div>

                      <div className="mt-4 text-xs">
                        <div className="font-bold">motor covernote limited</div>
                        <div>Registered in Scotland Number 2169</div>
                        <div>Registed office:</div>
                        <div>Travellers lane office</div>
                        <div>Hatfield, England</div>
                        <div>AL10 8SF</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Page 2 */}
                <div
                  id="certificate-page-2-popup"
                  className="rounded-lg border-2 bg-white shadow-2xl overflow-hidden print:shadow-none print:border-none print:mt-0"
                  style={{ borderColor: "#d1d5db" }}
                >
                  <div className="p-8" style={{ backgroundColor: "#ffffff", color: "#0a0a0a" }}>
                    <div className="flex justify-between items-start pb-3 border-b border-gray-200">
                      <div>
                        <div className="font-bold">Our Ref: {docNumber}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-3">
                      <div>
                        <div className="text-xs mb-1">Your policy starts on</div>
                        <div className="font-bold text-xs">{effectiveDate}</div>
                      </div>
                      <div>
                        <div className="text-xs mb-1">Your policy expires on</div>
                        <div className="font-bold text-xs">{expiryDate}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-3">
                      <div>
                        <div className="text-xs mb-1">Agent</div>
                        <div className="font-bold text-xs">motor covernote limited.</div>
                        <div className="text-[10px] text-gray-600 mt-1">Registered in Scotland Number 2169</div>
                        <div className="text-[10px] text-gray-600">Registed office:</div>
                        <div className="text-[10px] text-gray-600">Travellers lane office</div>
                        <div className="text-[10px] text-gray-600">Hatfield, England</div>
                        <div className="text-[10px] text-gray-600">AL10 8SF</div>
                      </div>
                      <div>
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs mb-1">Type of policy</div>
                            <div className="font-bold text-xs">Short Term Covernote</div>
                          </div>
                          <div>
                            <div className="text-xs mb-1">Policy Number</div>
                            <div className="font-bold text-xs">{docNumber}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t-2 border-gray-300">
                      <h2 className="text-lg font-bold mb-1">Your Schedule</h2>
                      <div className="text-[10px] text-gray-600 mb-4">Produced on: {effectiveDate}</div>
                      <div className="text-xs italic text-gray-700 mb-4">This schedule forms part of your policy</div>

                      <div className="grid grid-cols-2 gap-6 mb-4">
                        <div className="space-y-3">
                          <div>
                            <div className="font-bold text-xs mb-1">The Policy Holder</div>
                            <div className="text-xs">{name.toUpperCase()}</div>
                          </div>
                          <div>
                            <div className="font-bold text-xs mb-1">Address</div>
                            <div className="text-xs">{address}</div>
                          </div>
                          <div>
                            <div className="font-bold text-xs mb-1">Premium</div>
                            <div className="text-xs">£{premium}</div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="font-bold text-xs mb-1">Your car</div>
                            <div className="text-xs space-y-1">
                              <div>
                                <span className="font-semibold">Make</span> {make}
                              </div>
                              <div>
                                <span className="font-semibold">Registration Mark</span> {registrationMark}
                              </div>
                              <div>
                                <span className="font-semibold">Model</span> {model}
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="font-bold text-xs mb-1">Excess</div>
                            <div className="text-xs">£{excess}</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mt-4">
                        <div>
                          <div className="font-bold text-xs mb-1">Persons entitled to drive</div>
                          <div className="text-xs">
                            {name.toUpperCase()} <span className="font-semibold">DOB:</span> {dob}{" "}
                            <span className="font-semibold">Licence:</span> {license}
                          </div>
                        </div>

                        <div>
                          <div className="font-bold text-xs mb-1">Limitations as to use</div>
                          <div className="text-xs leading-relaxed">
                            Use for social, domestic and pleasure purposes and business use by the Policyholder excluding the
                            carriage of passengers or goods for hire or reward.
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-gray-50 border border-gray-300 rounded text-[10px] leading-relaxed">
                        <p className="font-bold mb-2">
                          If the information in this Schedule is incorrect or does not meet your requirements, please tell us at
                          once.
                        </p>
                        <p>
                          You are reminded of the need to notify any facts that we would take into account in our assessment or
                          acceptance of this covernote. Failure to disclose all relevant facts may invalidate your policy, or
                          result in your policy not operating fully. You should keep a written record of any information you
                          give to us.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 border-t flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <Button variant="outline" onClick={() => setShowCertificate(false)} className="w-full sm:w-auto">
                Close
              </Button>
              <Button
                onClick={handleViewPdf}
                disabled={isDownloading}
                className="bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto"
              >
                {isDownloading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    View as PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
