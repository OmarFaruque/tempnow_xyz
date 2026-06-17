import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chrome from "@sparticuz/chromium";
import { getPolicyByNumber } from "@/lib/policy-server";
import { getAllSettings, getUserById } from "@/lib/database"; 
import { toDataUri } from "@/lib/image-utils";

function replaceVariablesInText(text: string, data: Record<string, any>) {
  if (!text) return "";
  return text.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
    return String(data[variable] ?? match);
  });
}

async function renderStatementOfFactToHtml(policy: any, settings: any) {
  const quoteData = JSON.parse(policy.quoteData || '{}');
  const user = policy.user || null;

  const quote = {
    ...policy,
    policy_number: policy.policyNumber,
    start_date: policy.startDate,
    start_time: policy.startTime,
    end_date: policy.endDate,
    end_time: policy.endTime,
    name_title: policy.nameTitle,
    first_name: policy.firstName,
    middle_name: "", // Not available
    last_name: policy.lastName,
    title: policy.title || quoteData.customerData?.title || "",
    address: policy.address,
    postcode: policy.postCode,
    contact_number: policy.phone,
    modifications: policy.vehicleModifications && policy.vehicleModifications.length > 0 ? policy.vehicleModifications.join(', ') : '-',
    email: user?.email || policy.email || "",
    date_of_birth: policy.dateOfBirth,
    licence_type: policy.licenceType || "N/A",
    occupation: quoteData.customerData?.occupation || "N/A",
    vehicle_make: policy.vehicleMake,
    vehicle_model: policy.vehicleModel,
    reg_number: policy.regNumber,
    vehicle_value: quoteData.customerData?.vehicleValue || "N/A",
  };

  let sex = "-";
  if (quote.name_title === "Mr") {
    sex = "Male";
  } else if (["Mrs", "Miss", "Ms"].includes(quote.name_title)) {
    sex = "Female";
  }

  const template = settings?.statementOfFactTemplate || {};

  const logoSrcCandidate = template.logo || `${process.env.NEXT_PUBLIC_BASE_URL || ''}/cert-logo.png`;

  const logoDataUri = await toDataUri(logoSrcCandidate);

  const logoHtml = logoDataUri
    ? `
    <div style="width: 100%; display:flex; justify-content:center; align-items:center; padding: 0; margin: 0; margin-top: -30px;">
      <img src="${logoDataUri}" style="height: 90px; width: auto; display:block; max-width:100%;">
    </div>
  `
    : '';
  
  const templateData = {
    ...quote,
    sex,
  };

  const classOfUseHtml = template?.classOfUse ? replaceVariablesInText(template.classOfUse, templateData) : `Use for social domestic and pleasure purposes and use in person by the Policyholder in connection with their business or profession EXCLUDING use for hire or reward, racing, pacemaking, speed testing, commercial travelling or use for any purpose in connection with the motor trade.`;
  const proposerDeclarationHtml = template?.proposerDeclaration ? replaceVariablesInText(template.proposerDeclaration, templateData) : `
    <div style="font-size:15pt; font-weight:bold">PROPOSER DECLARATION</div>
    <table class="tb1" style="padding-top:10px;"><tr><td class="td2">I declare that I:</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Have no more than 2 motoring convictions and/or 6 penalty points in the last 3 years, and have no prosecution or police enquiry pending, other than a No Covernote conviction resulting from the current seizure of the vehicle.</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Have NOT been disqualified from driving in the last 5 years.</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Have no criminal convictions.</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Have no more than 1 fault claim within the last 3 years (a pending or non-recoverable claim is considered a fault claims).</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Have <span class="bd ud">NOT</span> had a policy of covernote voided or cancelled by a covernote company</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Am a permanent UK resident for at least 36 month</td></tr></table>
    <table class="tb1"><tr><td class="td2">I declare that the vehicle:</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Will only be used for social, domestic and pleasure purposes.</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Is owned by me and I can prove legal title to the vehicle.</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Will NOT be used for commuting, business use, hire or reward, racing, pace-making, speed testing, commercial travelling or use for any purpose in relation to the motor trade.</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Will not be used to carry hazardous goods or be driven at a hazardous location.</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Has not been modified and has no more than 8 seats in total and is right-hand drive only.</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Is registered in Great Britain, Northern Ireland or the Isle of Man.</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Will be in the UK at the start of the document and will not be exported from the UK during the duration of the order.</td></tr></table>
    <table class="tb1"><tr><td class="td2">I am aware that this covernote cannot be used for any vehicle not owned by me including Hire or Loan Vehicles (i.e. Vehicle Rentals, Vehicle Salvage/Recovery Agents, Credit Hire Vehicles/Companies and Accident Management Companies).</td></tr></table>
    <table class="tb1"><tr><td class="td2">I agree that in the event of a claim I will provide the V5 registration document, a current MOT certificate (where one is required by law to be issued) and a copy of my driving licence</td></tr></table>
  `;
  const importantNoticeHtml = template?.importantNotice ? replaceVariablesInText(template.importantNotice, templateData) : `
    <div style="font-size:12pt; font-weight:bold">IMPORTANT NOTICE</div>
    <table class="tb3" style="padding-top:5px;"><tr><td class="td1">information relating to your order will be added to the Motor Covernote Database ('M information relating to your order will be added to the added to the Motor Covernote Database ('M information relating to your policy will be added to the MID') managed by the Motor Covernote Bureau ('MIB'). MID and the data stored on it may be used by certain statutory and/or authorised bodies including the Police, the DVLA, the DVLANI, the Covernote Fraud Bureau and other bodies permitted by law for purposes not limited to but including: <br>•Electronic Licensing. <br>•Continuous Covernote Enforcement. <br>Law enforcement (prevention, detection, apprehension and or prosecution of offenders) <br>•The provision of government services and or other services aimed at reducing the level and incidence of uninsured driving. <br>If you are involved in a road traffic accident (either in the UK, EEA or certain other territories), covernotes and or the MIB may search the MID to obtain relevant information. Persons (including his or her appointed representatives) pursuing a claim in respect of a road traffic accident (including citizens of other countries) may also obtain information which is held on the MID. It is vital that the MID holds your correct registration number. If it is incorrectly shown on MID you are at risk of having your vehicle seized by the Police. Covernote Act 2015 Governs covernote contracts, including temporary documents like cover notes. It does not restrict the creation of drafts or templates — the key legal obligation is that: <br/> "The covernoter must be provided with fair and accurate presentation of the risk." <br>This means <br/>Users generating a draft cover note for reference or temporary use are not in breach of the Act unless they lie or misrepresent the covernote situation. Cuverly is not a regulated covernote provider and is not authorised by the Financial Conduct Authority (FCA). The docu... 
    </td></tr></table>
  `;

  const noSignNoticeHtml = template?.noSignNotice ? replaceVariablesInText(template.noSignNotice, templateData) : `
    <table style="width:100%; margin-top: 10px;"><tr><td>
      <div style="background-color:#000; color:#FFF; font-size:10pt; text-align:center; font-weight:bold; padding: 5px;">IMPORTANT<br>There is no need to sign this document, as by agreeing to the declaration during the quotation process you have confirmed that you have read and agree to the motor covernote limited / Proposer's Declaration</div>
    </td></tr></table>
  `;

  return `
    ${logoHtml}
    <style>
        body { font-family: Helvetica, sans-serif; font-size: 10pt; color: #333; }
        .bd{ font-weight: bold; }
        .ud{ font-weight: bold; text-decoration: underline; }
        .it{ font-style: italic; }
        .tb0{ width:100%; border: 1px solid #222; border-collapse: collapse; padding:1px 6px; }
        .tb0 td { padding: 4px 8px; }
        .tb0 .td1{ width: 40%; font-size: 8.5pt; }
        .tb0 .td2{ width: 60%; font-size: 8.5pt; }
        .tb1{ width:100%; padding:1px 0px; }
        .tb1 .td1{ width: 5%; font-weight: bold; font-size: 10pt; text-align:center; }
        .tb1 .td2{ width: 95%; font-weight: bold; font-size: 10pt; }
        .tb2{ width:100%; padding:1px 0px; }
        .tb2 .td1{ width: 5%; font-size: 10pt; }
        .tb2 .td2{ width: 2.7%; font-size: 10pt; }
        .tb2 .td3{ width: 92.3%; font-size: 10pt; }
        .tb3{ width:100%; padding:0px; }
        .tb3 td { font-size: 8.3pt; padding: 3px 0; }
        .page-break { page-break-after: always; }
    </style>
    <div style="padding-bottom:6px; font-weight:bold; font-size:12pt;">STATEMENT OF FACT - Short Term Covernote</div>
    <table class="tb0">
        <tr><td class="td1 bd it">Your Agent</td><td class="td2"></td></tr>
        <tr><td class="td1">Agent</td><td class="td2">motor covernote limited</td></tr>
        <tr><td class="td1" style="padding: 2px;"></td><td class="td2"></td></tr>
        <tr><td class="td1 bd it">Your Details - Name & Address</td><td class="td2"></td></tr>
        <tr><td class="td1">Full Name</td><td class="td2">${quote.name_title ?? ''} ${quote.first_name} ${quote.middle_name} ${quote.last_name}</td></tr>
        <tr><td class="td1">Address</td><td class="td2">${quote.address}, ${quote.postcode}</td></tr>
        <tr><td class="td1">Phone Number</td><td class="td2">${quote.contact_number}</td></tr>
        <tr><td class="td1">Email address</td><td class="td2">${quote.email}</td></tr>
        <tr><td class="td1" style="padding: 2px;"></td><td class="td2"></td></tr>
        <tr><td class="td1 bd it">Your Policy Cover</td><td class="td2"></td></tr>
        <tr><td class="td1">Effective Date</td><td class="td2">${new Date(quote.start_date).toLocaleString('en-GB')}</td></tr>
        <tr><td class="td1">Expire Date</td><td class="td2">${new Date(quote.end_date).toLocaleString('en-GB')}</td></tr>
        <tr><td class="td1">Policy Cover</td><td class="td2">COMPREHENSIVE</td></tr>
        <tr><td class="td1">Number of Drivers (including you)</td><td class="td2">1</td></tr>
        <tr><td class="td1">Class of Use</td><td class="td2">${classOfUseHtml}</td></tr>
        <tr><td class="td1" style="padding: 2px;"></td><td class="td2"></td></tr>
        <tr><td class="td1 bd it">Driver Details (including you)</td><td class="td2"></td></tr>
        <tr><td class="td1">Full Name</td><td class="td2">${quote.name_title ?? ''} ${quote.first_name} ${quote.middle_name} ${quote.last_name}</td></tr>
        <tr><td class="td1">Sex</td><td class="td2">${sex}</td></tr>
        <tr><td class="td1">Date of Birth</td><td class="td2">${new Date(quote.date_of_birth).toLocaleDateString('en-GB')}</td></tr>
        <tr><td class="td1">Licence Type</td><td class="td2">${quote.licence_type}</td></tr>
        <tr><td class="td1">Occupation</td><td class="td2">${quote.occupation}</td></tr>
        <tr><td class="td1" style="padding: 2px;"></td><td class="td2"></td></tr>
        <tr><td class="td1 bd it">Vehicle Details</td><td class="td2"></td></tr>
        <tr><td class="td1">Make</td><td class="td2">${quote.vehicle_make}</td></tr>
        <tr><td class="td1">Model</td><td class="td2">${quote.vehicle_model}</td></tr>
        <tr><td class="td1">Registration number</td><td class="td2">${quote.reg_number}</td></tr>
        <tr><td class="td1">Vehicle value</td><td class="td2">${quote.vehicle_value}</td></tr>
        <tr><td class="td1">Modifications</td><td class="td2">${quote.modifications}</td></tr>
        <tr><td class="td1" style="padding: 2px;"></td><td class="td2"></td></tr>
        <tr><td class="td1 bd it">Accident / Claim Details</td><td class="td2"></td></tr>
        <tr><td class="td1">Driver Name</td><td class="td2">${quote.first_name} ${quote.middle_name} ${quote.last_name}</td></tr>
        <tr><td class="td1">Date of Claim/Incident</td><td class="td2">-</td></tr>
        <tr><td class="td1">Costs</td><td class="td2">-</td></tr>
        <tr><td class="td1">Fault or Non-Fault</td><td class="td2">-</td></tr>
        <tr><td colspan="2" style="width:100%; padding: 4px 0;"><hr style="border-top: 1.5px solid #222;"></td></tr>
        <tr><td class="td1">Driver Name</td><td class="td2">${quote.first_name} ${quote.middle_name} ${quote.last_name}</td></tr>
        <tr><td class="td1">Date of Claim/Incident</td><td class="td2">-</td></tr>
        <tr><td class="td1">Costs</td><td class="td2">-</td></tr>
        <tr><td class="td1">Fault or Non-Fault</td><td class="td2">-</td></tr>
        <tr><td colspan="2" style="width:100%;"><div style="margin-top: 4px; width:100%; background-color:#000; color:#FFF; text-align:center; font-size:9.2pt; padding: 4px;">IMPORTANT - You also must read the motor Covernote Proposer Declaration & Important Notes on Pages 2 & 3</div></td></tr>
    </table>
    <div class="page-break"></div>
    ${proposerDeclarationHtml}
    <div class="page-break"></div>
    ${importantNoticeHtml}
    ${noSignNoticeHtml}
  `;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const policyNumber = searchParams.get("number");

  if (!policyNumber) {
    return new NextResponse("Docs number is required", { status: 400 });
  }

  try {
    const policy = await getPolicyByNumber(policyNumber);
    const settings = await getAllSettings();

    if (!policy) {
      return new NextResponse("Docs not found", { status: 404 });
    }

    const user = policy.userId ? await getUserById(policy.userId) : null;
    policy.user = user;

    const html = await renderStatementOfFactToHtml(policy, settings);
    
    const headerTemplate = ``;
    const footerTemplate = `
      <div style="width: 100%; font-size: 6px; text-align: center; color: #333; padding-bottom: 10px;">
        Mulsanne Insurance Company Limited, PO Box 1338, 1st Floor, Grand Ocean Plaza, Ocean Village, Gibraltar
      </div>
    `;

    const browser = await puppeteer.launch({
      args: chrome.args,
      executablePath: await chrome.executablePath(),
      headless: chrome.headless,
    });
    const page = await browser.newPage();

    // Wait for networkidle to ensure images and other resources finished loading
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      headerTemplate: headerTemplate,
      footerTemplate: footerTemplate,
      displayHeaderFooter: false,
      margin: {
        top: "40px",
        bottom: "40px",
        right: "40px",
        left: "40px",
      },
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return new NextResponse("Error generating PDF", { status: 500 });
  }
}