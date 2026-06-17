import { renderToStaticMarkup } from 'react-dom/server';
import PrintableCertificate from "@/components/server-printable-certificate";

'use server';

export async function renderCertificateToHtml(
  policyData: any,
  formatDateTime: (date: string | Date) => string,
  settings: any
) {
  const docNumber = policyData?.policyNumber;
  const registrationMark = policyData?.regNumber;
  const descriptionOfVehicles = policyData ? `${policyData.vehicleMake} ${policyData.vehicleModel}` : "";
  const make = policyData?.vehicleMake;
  const model = policyData?.vehicleModel;
  const name = policyData ? `${policyData.nameTitle} ${policyData.firstName} ${policyData.lastName}` : "";
  const dob = policyData
    ? new Date(policyData.dateOfBirth).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";
  const license = policyData?.customerData?.licenseType || "Full";
  const effectiveDate = policyData ? formatDateTime(policyData.startDate) : "";
  const expiryDate = policyData ? formatDateTime(policyData.endDate) : "";
  const address = policyData.postCode ? `${policyData?.address}, ${policyData?.postCode}` : policyData?.address;
  const premium = policyData ? Number(policyData.update_price ?? policyData.cpw).toFixed(2) : "0.00";
  const excess = "750.00";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.5;
          color: #0a0a0a;
        }
        
        .page {
          width: 210mm;
          height: 297mm;
          padding: 20px;
          background: #ffffff;
          page-break-after: always;
          position: relative;
        }
        
        .page:last-child {
          page-break-after: avoid;
        }
        
        .page-1 {
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        
        .logo-container {
          text-align: center;
          margin-bottom: 10px;
        }
        
        .logo-container img {
          height: auto;
          width: 100px;
        }
        
        .watermark {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0.08;
          overflow: hidden;
          pointer-events: none;
          z-index: 1;
        }
        
        .watermark-text {
          position: absolute;
          transform: rotate(-45deg);
          font-weight: bold;
          color: #666;
          letter-spacing: 0.5px;
          font-size: 11px;
          white-space: nowrap;
        }
        
        .content {
          position: relative;
          z-index: 10;
          border: 2px solid #333;
          padding: 15px;
          min-height: 400px;
          background: #ffffff;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          font-size: 12px;
        }
        
        .ref-section {
          flex: 1;
        }
        
        .cert-number {
          text-align: right;
        }
        
        .cert-number-label {
          font-size: 9px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .cert-number-value {
          font-weight: bold;
          font-size: 13px;
        }
        
        .section {
          margin-bottom: 12px;
          font-size: 11px;
          line-height: 1.4;
        }
        
        .section-title {
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .section-content {
          margin-left: 0;
        }
        
        .subsection {
          margin-left: 15px;
          margin-top: 5px;
        }
        
        .footer {
          border-top: 1px solid #ccc;
          margin-top: 15px;
          padding-top: 10px;
          font-size: 10px;
          line-height: 1.6;
        }
        
        .company-name {
          font-weight: bold;
          margin: 8px 0;
        }
        
        .page-2 {
          padding: 30px;
        }
        
        .schedule-header {
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
          margin-bottom: 15px;
          font-weight: bold;
        }
        
        .grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .grid-item {
          padding: 15px;
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .grid-item-label {
          font-size: 11px;
          color: #666;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        .grid-item-value {
          font-size: 12px;
          font-weight: bold;
        }
        
        .note-box {
          background: #f9f9f9;
          border: 1px solid #ddd;
          padding: 12px;
          margin-top: 15px;
          font-size: 10px;
          line-height: 1.5;
        }
        
        .note-box p {
          margin-bottom: 8px;
        }
        
        .bold {
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <!-- PAGE 1 -->
      <div class="page page-1">
        <div class="logo-container">
          <img src="${process.env.NEXT_PUBLIC_BASE_URL}/cert-logo.png" alt="Motor Covernote Limited">
        </div>
        
        <div class="watermark">
          ${Array.from({ length: 120 }).map((_, i) => {
            const cols = 10;
            const rows = 12;
            const col = i % cols;
            const row = Math.floor(i / cols);
            const left = (col * 20 - 10);
            const top = (row * 15 - 5);
            return `<div class="watermark-text" style="left: ${left}%; top: ${top}%;">${name.toUpperCase()} ${docNumber}</div>`;
          }).join('')}
        </div>
        
        <div class="content">
          <div class="header">
            <div class="ref-section">
              <div><span class="bold">Our Ref:</span> ${docNumber}</div>
              <div class="bold">Registration Mark: ${registrationMark}</div>
            </div>
            <div class="cert-number">
              <div class="cert-number-label">Certificate Number</div>
              <div class="cert-number-value">${docNumber}</div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">1. DESCRIPTION OF VEHICLES:</div>
            <div class="section-content">${descriptionOfVehicles}</div>
          </div>
          
          <div class="section">
            <div class="section-title">2. NAME OF POLICYHOLDER</div>
            <div class="section-content">${name.toUpperCase()}</div>
          </div>
          
          <div class="section">
            <div class="section-title">3. EFFECTIVE DATE OF THE COMMENCEMENT OF COVERNOTE FOR THE PURPOSES OF THE RELEVANT LAW</div>
            <div class="section-content">${effectiveDate}</div>
          </div>
          
          <div class="section">
            <div class="section-title">4. DATE OF EXPIRY OF COVERNOTE</div>
            <div class="section-content">${expiryDate}</div>
          </div>
          
          <div class="section">
            <div class="section-title">5. PERSONS OR CLASSES OF PERSONS ENTITLED TO DRIVE</div>
            <div class="section-content">${name.toUpperCase()} <span class="bold">DOB:</span> ${dob} <span class="bold">Licence:</span> ${license}</div>
          </div>
          
          <div class="section">
            <div class="section-title">6. LIMITATIONS AS TO USE</div>
            <div class="subsection">
              <div>(a) Use for social, domestic or pleasure purposes.</div>
              <div>(b) Use by the Policyholder in connection with the business of the Policyholder.</div>
              <div>(c) Use for towing any vehicle (mechanically propelled or otherwise)</div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">EXCLUSIONS</div>
            <div class="subsection">
              <div>(a) The carriage of passengers for hire or reward.</div>
              <div>(b) The carriage of goods for hire or reward.</div>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>I hereby certify that the Policy to which this Certificate relates satisfies the requirements of the relevant Law applicable in Great Britain, Northern Ireland, the Isle of Man, the Island of Guernsey, the Island of Jersey and the Island of Alderney.</p>
          <div class="company-name">motor covernote limited</div>
          <p><span class="bold">NOTE:</span> For full details of the covernote cover reference should be made to the policy.</p>
          <p><span class="bold">ADVICE TO THIRD PARTIES:</span> Nothing contained in this Certificate affects your right as a Third Party to make a claim.</p>
        </div>
      </div>
      
      <!-- PAGE 2 -->
      <div class="page page-2">
        <div class="schedule-header">Your Schedule</div>
        
        <div class="grid-2col">
          <div class="grid-item">
            <div class="grid-item-label">The Policy Holder</div>
            <div class="grid-item-value">${name.toUpperCase()}</div>
          </div>
          <div class="grid-item">
            <div class="grid-item-label">Your car</div>
            <div class="grid-item-value">
              <div>Make: ${make}</div>
              <div>Registration: ${registrationMark}</div>
              <div>Model: ${model}</div>
            </div>
          </div>
        </div>
        
        <div class="grid-2col">
          <div class="grid-item">
            <div class="grid-item-label">Address</div>
            <div class="grid-item-value">${address}</div>
          </div>
          <div class="grid-item">
            <div class="grid-item-label">Premium</div>
            <div class="grid-item-value">£${premium}</div>
          </div>
        </div>
        
        <div class="grid-2col">
          <div class="grid-item">
            <div class="grid-item-label">Persons entitled to drive</div>
            <div class="grid-item-value">${name.toUpperCase()}<br>DOB: ${dob}<br>Licence: ${license}</div>
          </div>
          <div class="grid-item">
            <div class="grid-item-label">Excess</div>
            <div class="grid-item-value">£${excess}</div>
          </div>
        </div>
        
        <div class="note-box">
          <p><span class="bold">If the information in this Schedule is incorrect or does not meet your requirements, please tell us at once.</span></p>
          <p>You are reminded of the need to notify any facts that we would take into account in our assessment or acceptance of this covernote. Failure to disclose all relevant facts may invalidate your policy, or result in your policy not operating fully. You should keep a written record of any information you give to us.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}