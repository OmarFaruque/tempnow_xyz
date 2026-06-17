import React from "react"

const PrintableCertificate = ({ policyData, formatDateTime, settings }) => {
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

  // Directly use the absolute URL for the logo
  const logoUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/cert-logo.png`;

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
            // Removed crossOrigin as it's not needed for server-side generated HTML
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
                      left: `${col * 20 - 10}%`, // Increased horizontal spacing
                      top: `${row * 15 - 5}%`, // Increased vertical spacing
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

export default PrintableCertificate
