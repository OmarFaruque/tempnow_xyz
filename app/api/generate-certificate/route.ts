import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { generatePdf } from "@/lib/pdf-generator";
import { getAllSettings } from "@/lib/database";
import { getPolicyByNumber } from "@/lib/policy-server";


function formatDateTime(dateTimeString: string) {
  if (!dateTimeString) return "";
  const d = new Date(dateTimeString);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function replaceVariablesInText(text: string, data: Record<string, any>) {
  if (!text) return "";
  return text.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
    return String(data[variable] ?? match);
  });
}

function renderCertificateToHtml(policy: any, settings: any) {
  const quote = policy?.quoteData ? JSON.parse(policy.quoteData) : {};
  const customer = quote.customerData || {};
  const name = [policy?.nameTitle, policy?.firstName, policy?.lastName].filter(Boolean).join(" ");
  const docNumber = policy?.policyNumber || "";
  const registration = policy?.regNumber || "";
  const make = policy?.vehicleMake || "";
  const model = policy?.vehicleModel || "";
  const description = `${make} ${model}`.trim();
  const dob = policy?.dateOfBirth ? new Date(policy.dateOfBirth).toLocaleDateString("en-GB") : "";
  const license = customer.licenseType || "Full";
  const effectiveDate = formatDateTime(policy?.startDate || "");
  const expiryDate = formatDateTime(policy?.endDate || "");
  const address = policy?.postCode ? `${policy?.address}, ${policy?.postCode}` : policy?.address || "";
  const premium = Number(policy.update_price ?? policy.cpw ?? 0).toFixed(2);
  const excess = "750.00";

  const logoSrc = settings?.certificateTemplate?.logo || `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/cert-logo.png`;

  // template variables (match history.tsx variables)
  const template = settings?.certificateTemplate || null;
  const templateData = {
    docNumber,
    registrationMark: registration,
    descriptionOfVehicles: description,
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

  const page1TemplateHtml = template ? replaceVariablesInText(template.page1 || "", templateData) : "";
  const page2TemplateHtml = template ? replaceVariablesInText(template.page2 || "", templateData) : "";
  const page1FooterTemplateHtml = template ? replaceVariablesInText(template.page1_footer || "", templateData) : "";

  // Inline styles intentionally similar to history.tsx printable layout
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    /* Use zero page margin and control visible gutter with the .page padding */
    @page { size: A4; margin: 0; }
    html,body{
      height:100%;
      margin:0;
      padding:0;
      /* reliable font stack with bold variants */
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      color:#0a0a0a;
      background:#ffffff;
    }
    /* outer page provides a small left/right visible gutter (12px) */
    .page{
      width:100%;
      min-height:297mm;
      box-sizing:border-box;
      padding:12px 15px;
      background:#ffffff;
      page-break-after:always;
      display:flex;
      justify-content:center;
    }
    /* the card matches history.tsx rounded border and internal padding - keep your values */
    .card{width:100%;max-width:95%;background:#fff;border-radius:12px;padding:14px;box-sizing:border-box;overflow:hidden}
    /* logo area */
    .logo{text-align:center;margin-bottom:8px}
    .logo img{width:160px;height:auto;display:block;margin:0 auto}
    /* main content box inside the card (bordered area) */
    .content{border:2px solid #111;padding:12px;min-height:460px;position:relative;background:#fff;border-radius:8px;box-sizing:border-box}
    /* watermark like history.tsx */
    .watermark{position:absolute;inset:0;opacity:0.08;pointer-events:none;overflow:hidden}
    .watermark div{position:absolute;transform:rotate(-45deg);font-weight:700;color:#666;font-size:18px;white-space:nowrap}
    /* typography to match history.tsx sizes */
    body{font-size:15px;line-height:1.45}
    .text-xs{font-size:11px}
    .text-10{font-size:10px}
    text-[12px], .text-12{font-size:12px}
    text-[13px], .text-13{font-size:13px}
    .mt-2{margin-top:2rem;}
    .mt-1{margin-top:1rem;}
    .pl-2{padding-left:2rem;}
    .pb-2{padding-bottom:2rem;}
    .pb-1{padding-bottom:1rem;}
    .border-b{border-bottom:1px solid #ddd;}
    .mb-2{margin-bottom:2rem;}
    .mb-3{margin-bottom:3rem;}
    .mb-4{margin-bottom:4rem;}
    .mb-5{margin-bottom:5rem;}
    .mb-6{margin-bottom:6rem;}
    .space-y-0.5{row-gap:2px;}
    .flex{display:flex}
    .font-bold{font-weight:700;}
    .tracking-wider{letter-spacing:0.5px;}
    .text-gray-600{color:#666666;}
    .uppercase{text-transform:uppercase;}
    .space-y-1{row-gap:4px;}
    .text-[10px]{font-size:10px;}
    .pb-3{padding-bottom:3rem;}
    .border-gray-200{border-color:#e5e5e5;}
    .border-b{border-bottom:2px solid #ddd;}
    .text-[9px]{font-size:9px;}
    .leading-snug{line-height:1.375;}
    .mt-3{margin-top:12px;}
    .space-y-2{row-gap:8px;}
    .space-y-3{row-gap:12px;}
    .text-15{font-size:15px;}
    .space-y-1.5{row-gap:6px;}
    .space-y-4{row-gap:16px;}
    .justify-between{justify-content:space-between;}
    .items-start{align-items:flex-start;}
    .items-center{align-items:center;}
    .items-end{align-items:flex-end;}
    .w-full{width:100%;}
    .text-[14px], .text-14{font-size:14px}
    /* Header: use flex with explicit child flex so space-between works in PDF render */
    .header{display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px;width:100%}
    .header > div:first-child{flex:1;min-width:0}
    .header > div:last-child{flex:0 0 auto;text-align:right}
    /* stronger section spacing (margin-block-start for better PDF engines) */
    .section{font-size:11px; margin-top:16px; margin-block-start:16px; display:block;}
    /* enforce bold with available font, inline so it works inside lines */
    .bold{font-weight:700 !important; color:black; display:inline}
    .footer{font-size:10px;margin-top:10px;color:#111}
    /* page 2 schedule padding mirrors history.tsx p-8 */
    .schedule{padding:32px}
    .grid{display:flex;gap:20px}
    .col{flex:1}
    .box{background:#f8f8f8;border:1px solid #e5e5e5;padding:10px;font-size:11px}
    
    .schedule-header{border-bottom:2px solid #d1d5db;padding-bottom:12px;margin-bottom:16px; display:block;}
  </style>
</head>
<body>
  <!-- Page 1 -->
  <div class="page">
    <div class="card">
      <div class="logo"><img src="${logoSrc}" alt="logo"/></div>

      <div class="content">
        <div class="watermark">
          ${Array.from({ length: 120 }).map((_, i) => {
            const cols = 10;
            const rows = 12;
            const col = i % cols;
            const row = Math.floor(i / cols);
            const left = col * 20 - 10;
            const top = row * 15 - 5;
            return `<div style="left:${left}%;top:${top}%">${name.toUpperCase()} ${docNumber}</div>`;
          }).join("")}
        </div>

        <!-- If template page1 exists, use it; otherwise fallback to static content -->
        <div style="position:relative;z-index:10">
          ${page1TemplateHtml || `
            <div class="header" style="display:flex;justify-content:space-between;margin-bottom:12px">
              <div>
                <div class="schedule-header"><strong class="bold">Our Ref:</strong> ${docNumber}</div>
                <div class="bold">Registration Mark: ${registration}</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:9px;color:#666;text-transform:uppercase;letter-spacing:1px">Certificate Number</div>
                <div class="bold" style="font-weight:bold;">${docNumber}</div>
              </div>
            </div>

            <div class="section text-xs"><strong class="bold">1. DESCRIPTION OF VEHICLES:</strong> ${description}</div>
            <div class="section text-xs"><strong class="bold">2. NAME OF POLICYHOLDER</strong> ${name.toUpperCase()}</div>
            <div class="section text-xs"><strong class="bold">3. EFFECTIVE DATE OF THE COMMENCEMENT OF COVERNOTE</strong><div>${effectiveDate}</div></div>
            <div class="section text-xs"><strong class="bold">4. DATE OF EXPIRY OF COVERNOTE</strong><div>${expiryDate}</div></div>
            <div class="section text-xs"><strong class="bold">5. PERSONS OR CLASSES OF PERSONS ENTITLED TO DRIVE</strong>
              <div>${name.toUpperCase()} <strong class="bold">DOB:</strong> ${dob} <strong class="bold">Licence:</strong> ${license}</div>
            </div>
            <div class="section text-xs"><strong class="bold">6. LIMITATIONS AS TO USE</strong>
              <div style="margin-top:6px">Use for social, domestic or pleasure purposes. Use by the Policyholder in connection with the business of the Policyholder. Use for towing any vehicle.</div>
            </div>
          `}
        </div>
      </div>

      ${page1FooterTemplateHtml ? `<div class="footer">${page1FooterTemplateHtml}</div>` : `
        <div class="footer text-13">
          <p>I hereby certify that the Policy to which this Certificate relates satisfies the requirements of the relevant Law applicable in Great Britain, Northern Ireland, the Isle of Man and the Islands.</p>
          <div class="bold" style="margin-top:6px">motor covernote limited</div>
          <div style="margin-top:6px">NOTE: For full details of the covernote reference should be made to the policy.</div>
        </div>
      `}
    </div>
  </div>

  <!-- Page 2 -->
  <div class="page">
    <div class="card">
      ${page2TemplateHtml || `
        <div class="schedule">
          <div style="border-bottom:2px solid #333;padding-bottom:8px;margin-bottom:10px;font-weight:bold;">Your Schedule</div>

          <div class="grid" style="margin-bottom:12px">
            <div class="col box">
              <div style="font-weight:bold;margin-bottom:6px">The Policy Holder</div>
              <div>${name.toUpperCase()}</div>
              <div style="margin-top:8px;font-weight:bold">Address</div>
              <div>${address}</div>
              <div style="margin-top:8px;font-weight:bold">Premium</div>
              <div>£${premium}</div>
            </div>

            <div class="col box">
              <div style="font-weight:bold;margin-bottom:6px">Your car</div>
              <div>Make: ${make}</div>
              <div>Registration: ${registration}</div>
              <div>Model: ${model}</div>
              <div style="margin-top:8px;font-weight:bold">Excess</div>
              <div>£${excess}</div>
            </div>
          </div>

          <div class="box">
            <div style="font-weight:bold;margin-bottom:6px">Persons entitled to drive</div>
            <div>${name.toUpperCase()}<br/>DOB: ${dob}<br/>Licence: ${license}</div>
          </div>

          <div style="margin-top:12px;font-size:10px;color:#333">
            <strong>If the information is incorrect please tell us at once.</strong>
            <p style="margin-top:6px">You are reminded of the need to notify any facts that we would take into account in our assessment or acceptance of this covernote.</p>
          </div>
        </div>
      `}
    </div>
  </div>
</body>
</html>`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const policyNumber = searchParams.get("number");
    if (!policyNumber) {
      return new NextResponse("Policy number is required", { status: 400 });
    }

    const policy = await getPolicyByNumber(policyNumber);
    const settings = await getAllSettings();

    if (!policy) {
      return new NextResponse("Policy not found", { status: 404 });
    }

    const html = renderCertificateToHtml(policy, settings);
    const pdfBuffer = await generatePdf(html);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="certificate-${policyNumber}.pdf"`,
        "Content-Length": String(pdfBuffer.length ?? 0),
      },
    });
  } catch (err: any) {
    console.error("Error generating certificate PDF:", err);
    return new NextResponse("Failed to generate PDF", { status: 500 });
  }
}