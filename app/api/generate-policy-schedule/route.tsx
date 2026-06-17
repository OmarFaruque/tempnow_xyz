import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chrome from "@sparticuz/chromium";
import { getPolicyByNumber } from "@/lib/policy-server";
import { getAllSettings } from "@/lib/database";
import { toDataUri } from "@/lib/image-utils";

function replaceVariablesInText(text: string, data: Record<string, any>) {
  if (!text) return "";
  return text.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
    return String(data[variable] ?? match);
  });
}

async function renderPolicyScheduleToHtml(policy: any, settings: any) {
  const quoteData = JSON.parse(policy.quoteData || '{}');

  const quote = {
    ...policy,
    policy_number: policy.policyNumber,
    start_date: policy.startDate,
    start_time: policy.startTime,
    end_date: policy.endDate,
    end_time: policy.endTime,
    first_name: policy.firstName,
    middle_name: '',
    last_name: policy.lastName,
    address: policy.address,
    postcode: policy.postcode,
    cover_reason: quoteData.customerData?.coverReason || 'New Business',
    update_price: policy.update_price ?? policy.cpw,
    reg_number: policy.regNumber,
    vehicle_value: quoteData.customerData?.vehicleValue,
    vehicle_name: policy.vehicleMake,
    vehicle_model: policy.vehicleModel,
  };

  const parts = quote.address?.split(", ") || ["", ""];
  const lastPart = parts.pop() || "";
  const firstPart = parts.join(", ");

  const template = settings?.policyScheduleTemplate || {};
  const logoSrcCandidate = template.logo || `${process.env.NEXT_PUBLIC_BASE_URL || ''}/cert-logo.png`;
  const logoDataUri = await toDataUri(logoSrcCandidate);
  const logoHtml = logoDataUri
    ? `
    <div style="width: 100%; display:flex; justify-content:center; align-items:center; padding: 0; margin: 0; margin-top: -10px; margin-bottom: 20px;">
      <img src="${logoDataUri}" style="height: 100px; width: auto; display:block; max-width:100%;">
    </div>
  `
    : '';

  const templateData = {
    ...quote,
    firstPart,
    lastPart,
    startDate: new Date(quote.start_date).toLocaleDateString('en-GB'),
    endDate: new Date(quote.end_date).toLocaleDateString('en-GB'),
    startTime: new Date(quote.start_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    endTime: new Date(quote.end_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    dateOfBirth: new Date(quote.dateOfBirth).toLocaleDateString('en-GB'),
    premium: Number(quote.update_price ?? quote.cpw).toFixed(2),
  };

  const endorsementsApplicableHtml = template?.endorsementsApplicable
    ? replaceVariablesInText(template.endorsementsApplicable, templateData)
    : `<table class="tb1">
        <tr><td class="bd tdl">ENDORSEMENTS APPLICABLE (Full wordings shown within ENDORSEMENTS)</td></tr>
        <tr><td class="tdl">FCC - FULLY COMPREHENSIVE</td></tr>
      </table>`;

  const endorsementsHtml = template?.endorsements
    ? replaceVariablesInText(template.endorsements, templateData)
    : `<table class="tb1">
        <tr><td class="bd tdl">ENDORSEMENTS - only apply if noted in the ENDORSEMENTS APPLICABLE above</td></tr>
      </table>
      <div style="padding:1px 0;"></div>
      <table class="tb1">
        <tr><td class="bd tdl">FCC - FULLY COMPREHENSIVE COVER</td></tr>
        <tr><td>This Short Term Docs is for Fully Comprehensive cover. There is comprehensive cover for any damage to your vehicle.</td></tr>
      </table>
      <div style="padding:1px 0;"></div>
      <div style="padding:1px 0;"></div>
      <table class="tb1">
        <tr><td class="bd tdl">017 - USE IN THE REPUBLIC OF IRELAND</td></tr>
        <tr><td>The Territorial Limits mentioned in your docs are amended to allow your vehicle to be used in the Republic of Ireland with indemnity as if it were in the United Kingdom.</td></tr>
      </table>
      <div style="padding:1px 0;"></div>
      <table class="tb1">
        <tr><td class="bd tdl">065 - FOREIGN USE EXTENSION</td></tr>
        <tr><td>We will insure you for the cover shown in your schedule while your motor vehicle is being used within:</td></tr>
        <tr><td>-any country in the European Union (EU).</td></tr>
        <tr><td>-Andorra, Iceland, Liechtenstein, Norway and Switzerland.</td></tr>
        <tr><td>Full details of your Foreign Use terms and conditions are stated within the Foreign Use section of your docs. This endorsement only applies if we have agreed and you have paid an additional premium.</td></tr>
      </table>`;

  const importantInformationHtml = template?.importantInformation
    ? replaceVariablesInText(template.importantInformation, templateData)
    : `<table class="tb1">
        <tr><td class="bd">Important Information</td></tr>
      </table>
      <div style="padding:1px 0;"></div>
      <table class="tb1">
        <tr><td><span class="bd tdl"><strong>CONTINUOUS covernote ENFORCEMENT and the MOTOR covernote DATABASE </strong> Information relating to your policy will be added to the Motor covernote Database ('MID') managed by the Motor covernote Bureau ('MIB'). MID and the data stored on it may be used by certain statutory and/or authorised bodies including the Police, the DVLA, the DVLANI, the covernote Fraud Bureau and other bodies permitted by law for purposes including:</td></tr>
        <tr><td><ul><li>Electronic Licensing</li><li>Continuous docs Enforcement</li><li>Law enforcement (prevention, detection, apprehension and or prosecution of offenders)</li><li>The provision of government services and or other services aimed at reducing the level and incidence of uninsured driving.</li></ul></td></tr>
      </table>
      <div style="padding:1px 0;"></div>
      <table class="tb1">
        <tr><td>If you are involved in a road traffic accident (either in the UK, EEA or certain other territories), insurers and or the MIB may search the MID to obtain relevant information.</td></tr>
      </table>
      <div style="padding:1px 0;"></div>
      <table class="tb1">
        <tr><td class="tdl">Persons (including his or her appointed representatives) pursuing a claim in respect of a road traffic accident (including citizens of other countries) may also obtain information which is held on the MID. It is vital that the MID holds your correct registration number. If it is incorrectly shown on MID you are at risk of having your vehicle seized by the Police.</td></tr>
      </table>`;

  return `
    ${logoHtml}
    <style>
      body { font-family: Helvetica, sans-serif; color: #333; font-size: 9.5px; }
      .normal{ font-size: 8px; font-weight: normal; color: #333;}
      .it{ font-style: italic; }
      .bd{ font-weight: bold; color:#333; }
      .ud{ text-decoration: underline; }
      .tb0{ width:100%; border-collapse: collapse; padding:5px 6px; border-left: 0.57px solid #222; border-top: 0.57px solid #222; }
      .tb0 td { padding: 3px; }
      .tb0 .td1{ width: 28%; border-right: 0.57px solid #222; border-bottom: 0.57px solid #222; }
      .tb0 .td2{ width: 14%; border-right: 0.57px solid #222; border-bottom: 0.57px solid #222; }
      .tb0 .td3{ width: 14%; border-right: 0.57px solid #222; border-bottom: 0.57px solid #222; }
      .tb0 .td4{ width: 14%; border-right: 0.57px solid #222; border-bottom: 0.57px solid #222; }
      .tb0 .td5{ width: 30%; border-right: 0.57px solid #222; border-bottom: 0.57px solid #222; }
      .tb0 .hd{ text-align: center; font-weight:bold; font-size: 8px; }
      .tb1{ width:100%; padding:0px; font-size: 8pt; }
      .tb1 td{ font-size: 8pt; }
      .tb1 .tdl{ font-size: 8.2pt; }
    </style>
    <table class="tb0">
      <tr>
          <td style="width:56%" class="td1 hd" colspan="3"><strong style="font-size: 15px;">SHORT TERM covernote - motor covernote limited</strong></td>
          <td style="width:44%" class="td4 hd" colspan="2"><strong style="font-size: 15px;">NEW BUSINESS SCHEDULE</strong></td>
      </tr>
      <tr>
          <td class="td1"><table class="tb1"><tr><td class="bd">Docs Number:</td></tr><tr><td>${quote.policy_number}</td></tr></table></td>
          <td class="td2"><table class="tb1"><tr><td class="bd">Date Issued:</td></tr><tr><td>${templateData.startDate}</td></tr></table></td>
          <td class="td3" style="width:58%" colspan="3"><table class="tb1"><tr><td class="bd">Agent:</td></tr><tr><td>TEMPNOW Limited</td></tr></table></td>
      </tr>
      <tr>
          <td class="td1" colspan="2" style="width:42%"><table class="tb1"><tr><td class="bd">Insured:</td><td>${quote.name_title || ''} ${quote.first_name || ''} ${quote.middle_name || ''} ${quote.last_name || ''}</td></tr></table></td>
          <td class="td3" colspan="2" style="width:28%; border-right:none" ><table class="tb1"><tr><td class="bd">Effective Time/Date:</td></tr></table></td>
          <td class="td5"><table class="tb1"><tr><td>${templateData.startDate} ${templateData.startTime}</td></tr></table></td>
      </tr>
      <tr>
          <td class="td1" rowspan="3" colspan="2" style="width:42%"><table class="tb1"><tr><td class="bd">Date of Birth: ${templateData.dateOfBirth}</td></tr><tr><td class="bd">${firstPart}</td></tr><tr><td class="bd">${lastPart}, ${quote.postcode}</td></tr></table></td>
          <td  class="td3" colspan="2" style="width:28%; border-right: none;"><table class="tb1"><tr><td class="bd">Expiry Time/Date:</td></tr></table></td>
          <td class="td5"><table class="tb1"><tr><td>${templateData.endDate} ${templateData.endTime}</td></tr></table></td>
      </tr>
      <tr>
          <td  class="td3" colspan="2" style="width:28%; border-right: none;"><table class="tb1"><tr><td class="bd">Reason for Issue:</td></tr></table></td>
          <td class="td5"><table class="tb1"><tr><td>${quote.cover_reason}</td></tr></table></td>
      </tr>
      <tr>
          <td  class="td3" colspan="2" style="width:28%; border-right: none;"><table class="tb1"><tr><td class="bd">Premium (inc. IPT):</td></tr></table></td>
          <td class="td5"><table class="tb1"><tr><td>£${templateData.premium}</td></tr></table></td>
      </tr>
      <tr>
          <td class="td1" colspan="3" style="width:56%"><table class="tb1"><tr><td style="width:40%" class="bd ud">Reason for Issue:</td> <td><span class="bd">Registration Number:</span> ${quote.reg_number} </td> </tr></table></td>
          <td class="td4" colspan="2" style="width:44%"><table class="tb1"><tr><td><span class="bd">Cover:</span> FULLY COMPREHENSIVE</td></tr></table></td>
      </tr>
      <tr>
          <td class="td1" colspan="5" style="width:100%"><table class="tb1"><tr><td style="width:20%" class="bd">Vehicle Value: </td> <td style="width:20%">${quote.vehicle_value || 'N/A'} </td><td style="width:30%" class="bd">Make and Model of Vehicle: </td> <td style="width:30%">${quote.vehicle_name}  ${quote.vehicle_model} </td> </tr></table></td>
      </tr>
    </table>
    <br>
    <table class="tb0">
      <tr>
        <td style="width:100%" class="td1">${endorsementsApplicableHtml}</td>
      </tr>
    </table>
    <br>
    <table class="tb0">
      <tr>
        <td style="width:100%" class="td1">${endorsementsHtml}</td>
      </tr>
    </table>
    <br>
    <table class="tb0">
      <tr>
        <td style="width:100%" class="td1">${importantInformationHtml}</td>
      </tr>
    </table>`;
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

    const html = await renderPolicyScheduleToHtml(policy, settings);
    const headerTemplate = ``;

    const browser = await puppeteer.launch({
      args: chrome.args,
      executablePath: await chrome.executablePath(),
      headless: chrome.headless,
    });
    const page = await browser.newPage();
    
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    // ensure images finish loading before PDF generation
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
      headerTemplate: headerTemplate,
      margin: {
        top: '40px',
        right: '15px',
        bottom: '15px',
        left: '15px'
      }
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