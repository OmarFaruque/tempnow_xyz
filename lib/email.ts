import { Resend } from "resend"
import nodemailer from "nodemailer"
import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import {
  buildCodeBox,
  buildCtaButton,
  buildEmailShell,
  buildMessageCard,
  enhanceEmailContent,
  getEmailBranding,
} from "@/lib/email-theme"
import { escapeHtml } from "@/core/helpers"


export interface EmailTemplate {
  to: string
  subject: string
  html: string,
  attachments?: any
}

const APPLE_MAIL_DOMAINS = new Set(["icloud.com", "me.com", "mac.com"]);

export function shouldSuppressPdfAttachmentForDomain(email: string): boolean {
  const domain = (email || "").split("@").pop()?.toLowerCase() || "";
  return APPLE_MAIL_DOMAINS.has(domain);
}

function htmlToPlainText(html: string): string {
  if (!html) return "";

  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSettingValue<T = any>(value: unknown): T | null {
  if (value == null) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  if (typeof value === 'object') {
    return value as T;
  }
  return null;
}

async function getResendSettings() {
  try {
    const resendSettings = await db.query.settings.findFirst({
      where: eq(settings.param, 'resend')
    });
    if (resendSettings && resendSettings.value) {
      return parseSettingValue(resendSettings.value);
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch Resend settings:", error);
    return null;
  }
}

// Reusable function
export async function sendEmail({ to, subject, html, attachments = [] }: EmailTemplate) {
  try {
    const resendSettings = await getResendSettings();
    const mailDriver = process.env.MAIL_DRIVER;
    const text = htmlToPlainText(html);
    const branding = await getEmailBranding();

    if (mailDriver === "resend" && resendSettings && resendSettings.apiKey) {
      const resend = new Resend(resendSettings.apiKey);
      const fromAddress = resendSettings.fromEmail || `${branding.siteName} <onboarding@resend.dev>`;

      const data = await resend.emails.send({
        from: fromAddress,
        to: [to],
        subject,
        html,
        text,
        attachments,
      });

      return { success: true, data };
    } else {
      // 👉 Local dev (MailHog via SMTP)
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "localhost",
        port: parseInt(process.env.SMTP_PORT || "1025"),
        secure: false,
        auth: false, // MailHog doesn’t need auth
      })

      const info = await transporter.sendMail({
        from: `${branding.siteName} <noreply@local.dev>`,
        to,
        subject,
        html,
        text,
        attachments,
      })

      return { success: true, data: info }
    }
  } catch (error) {
    console.error("Email sending failed:", error)
    return { success: false, error }
  }
}

export async function getEmailTemplates() {
  try {
    const emailTemplatesSetting = await db.query.settings.findFirst({
      where: eq(settings.param, 'email_templates')
    });
    if (emailTemplatesSetting && emailTemplatesSetting.value) {
      return parseSettingValue(emailTemplatesSetting.value);
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch email templates:", error);
    return null;
  }
}

function replaceEmailVariables(text: string, data: Record<string, any>): string {
  if (!text) return '';
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, variable) => {
    return data[variable] !== undefined ? data[variable] : match;
  });
}

/**
 * Replace `{{variable}}` placeholders that stand for rich HTML blocks (CTA
 * buttons, code boxes, message cards) with invisible tokens, so the plain-text
 * content can be enhanced first and the blocks injected afterwards without
 * being mangled by the paragraph/list formatting.
 */
function protectBlockPlaceholders(
  content: string,
  variableNames: string[]
): { content: string; tokens: Record<string, string> } {
  const tokens: Record<string, string> = {}
  let protectedContent = content
  for (const name of variableNames) {
    const token = `\u0000EMAIL_BLOCK_${name.toUpperCase()}\u0000`
    tokens[token] = name
    protectedContent = protectedContent.replace(
      new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, "g"),
      token
    )
  }
  return { content: protectedContent, tokens }
}

function injectBlocks(
  html: string,
  tokens: Record<string, string>,
  blocks: Record<string, string>
): string {
  let result = html
  for (const [token, name] of Object.entries(tokens)) {
    const block = blocks[name]
    if (block !== undefined) {
      result = result.split(token).join(block)
    }
  }
  return result
}

export async function createAIDocumentPurchaseEmail(
  firstName: string,
  lastName: string,
  orderId: string,
  orderDate: string,
  amount: number,
  documentType: string,
  downloadLink: string,
  mediaPreviewUrl?: string,
) {
  const templates = await getEmailTemplates();
  const template = templates?.documentPurchase;
  if (!template) return { subject: "Error", html: "<body><p>Email template not found</p></body>" };

  const branding = await getEmailBranding();

  const isImagePurchase = documentType.toLowerCase().startsWith("ai image:");
  const resolvedDownloadLink = isImagePurchase
    ? downloadLink.replace("/api/ai-documents/download-pdf/", "/api/ai-images/download/")
    : downloadLink;

  const data = {
    firstName,
    lastName,
    orderId,
    orderDate,
    amount: amount.toFixed(2),
    documentType,
    downloadLink: resolvedDownloadLink,
    siteName: branding.siteName,
    companyName: branding.companyName,
  };

  const subject = replaceEmailVariables(template.subject, data);
  const header = replaceEmailVariables(template.header, data);
  const footer = replaceEmailVariables(template.footer, data);

  const { content: protectedContent, tokens } = protectBlockPlaceholders(template.content, ["downloadLink"]);
  let content = replaceEmailVariables(protectedContent, data);
  content = enhanceEmailContent(content);
  content = injectBlocks(content, tokens, {
    downloadLink: buildCtaButton(
      resolvedDownloadLink,
      isImagePurchase ? "Download Image" : "Download Document",
      branding,
      { icon: isImagePurchase ? "&#128247;" : "&#128196;" }
    ),
  });
  const html = buildEmailShell({ branding, subject, header, content, footer });

  return { subject, html };
}

export async function createInsurancePolicyEmail(
  firstName: string,
  lastName: string,
  policyNumber: string,
  vehicleReg: string,
  vehicleMake: string,
  vehicleModel: string,
  vehicleYear: string,
  startDate: string,
  endDate: string,
  amount: number,
  policyDocumentLink: string,
  coverageType: string = "Temporary Docs"
) {
  const templates = await getEmailTemplates();
  const template = templates?.policyConfirmation;
  if (!template) return { subject: "Error", html: "<body><p>Email template not found</p></body>" };

  const branding = await getEmailBranding();

  const data = {
    firstName,
    lastName,
    policyNumber,
    vehicleReg,
    vehicleMake,
    vehicleModel,
    vehicleYear,
    startDate,
    endDate,
    premium: amount.toFixed(2),
    policyDocumentLink,
    coverageType,
    siteName: branding.siteName,
    companyName: branding.companyName,
    viewDocument: policyDocumentLink
  };

  const subject = replaceEmailVariables(template.subject, data);
  const header = replaceEmailVariables(template.header, data);
  const footer = replaceEmailVariables(template.footer, data);

  const { content: protectedContent, tokens } = protectBlockPlaceholders(template.content, [
    "viewDocument",
    "policyDocumentLink",
  ]);
  let content = replaceEmailVariables(protectedContent, data);
  content = enhanceEmailContent(content);
  content = injectBlocks(content, tokens, {
    viewDocument: buildCtaButton(policyDocumentLink, "View Document", branding, { icon: "&#128196;" }),
    policyDocumentLink: buildCtaButton(policyDocumentLink, "View Document", branding, { icon: "&#128196;" }),
  });

  const html = buildEmailShell({ branding, subject, header, content, footer });

  return { subject, html };
}

export async function createAdminNotificationEmail(
  type: "ai_document" | "insurance_policy",
  customerName: string,
  customerEmail: string,
  amount: number,
  details: string,
) {
  const templates = await getEmailTemplates();
  const template = templates?.adminNotification;
  if (!template) return { subject: "Error", html: "<body><p>Email template not found</p></body>" };


  const branding = await getEmailBranding();

  const typeLabel = type === "ai_document" ? "AI Document" : "Docs";
  const data = {
    typeLabel,
    customerName,
    customerEmail,
    amount: amount.toFixed(2),
    details,
    time: new Date().toLocaleString(),
    siteName: branding.siteName,
    companyName: branding.companyName,
  };

  const subject = replaceEmailVariables(template.subject, data);
  const header = replaceEmailVariables(template.header, data);
  const content = enhanceEmailContent(replaceEmailVariables(template.content, data));
  const footer = replaceEmailVariables(template.footer, data);
  const html = buildEmailShell({ branding, subject, header, content, footer });

  return { subject, html };
}

export async function sendTicketConfirmationEmail({
  to,
  name,
  ticketId,
}: {
  to: string
  name: string
  ticketId: string
}) {
  const templates = await getEmailTemplates();
  const template = templates?.ticketConfirmation;
  if (!template) return;

  const branding = await getEmailBranding();

  const data = { name, ticketId, siteName: branding.siteName, companyName: branding.companyName };
  const subject = replaceEmailVariables(template.subject, data);
  const header = replaceEmailVariables(template.header, data);
  const content = enhanceEmailContent(replaceEmailVariables(template.content, data));

  const footer = replaceEmailVariables(template.footer, data);
  const html = buildEmailShell({ branding, subject, header, content, footer });

  return sendEmail({ to, subject, html, attachments: [] });
}

export async function sendExistingTicketEmail({
  to,
  name,
  ticketToken,
}: {
  to: string;
  name: string;
  ticketToken: string;
}) {
  const branding = await getEmailBranding();

  const subject = "You have an existing open ticket";
  const header = "Open Ticket Notification";
  const ticketUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/ticket/${ticketToken}`;

  const P = `style="margin:0 0 16px; padding:0; color:#334155; font-size:15px; line-height:1.75; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;"`
  const content = `
    <p ${P}>Hello ${escapeHtml(name)},</p>
    <p ${P}>You are receiving this email because you tried to open a new support ticket, but you already have an open ticket with us.</p>
    <p ${P}>Please check the status of your existing ticket or add a new reply using the button below.</p>
    ${buildCtaButton(ticketUrl, "View Your Open Ticket", branding, { icon: "&#127915;" })}
    <p ${P}>Submitting a new ticket is not necessary. We will respond to your existing ticket as soon as possible.</p>
  `;
  const footer = "Thank you for your patience.";

  const html = buildEmailShell({ branding, subject, header, content, footer });

  return sendEmail({ to, subject, html });
}

export async function sendTicketReplyEmail({
  to,
  name,
  ticketId,
  message,
  attachments = [],
  ticketUrl
}: {
  to: string
  name: string
  ticketId: string
  message: string
  attachments?: any[]
  ticketUrl: string
}) {
  const templates = await getEmailTemplates();
  const template = templates?.ticketReply;
  if (!template) return;

  const branding = await getEmailBranding();

  const data = {
    name,
    ticketId,
    message: message.trim().replace(/\n/g, '<br>'),
    siteName: branding.siteName,
    companyName: branding.companyName,
    ticketUrl,
  };
  const subject = replaceEmailVariables(template.subject, data);
  const header = replaceEmailVariables(template.header, data);
  const footer = replaceEmailVariables(template.footer, data);

  const { content: protectedContent, tokens } = protectBlockPlaceholders(template.content, [
    "message",
    "ticketUrl",
  ]);
  let content = replaceEmailVariables(protectedContent, data);
  content = enhanceEmailContent(content);
  content = injectBlocks(content, tokens, {
    message: buildMessageCard(data.message, branding),
    ticketUrl: buildCtaButton(ticketUrl, "View Ticket", branding, { icon: "&#127915;" }),
  });

  const html = buildEmailShell({ branding, subject, header, content, footer });

  return sendEmail({ to, subject, html, attachments });
}

export async function createPolicyExpiryEmail(
  firstName: string,
  lastName: string,
  policyNumber: string,
  vehicleDetails: string,
  expiresAt: string,
  policyDocumentLink: string,
) {
  const templates = await getEmailTemplates();
  const template = templates?.policyExpiry;
  if (!template) return { subject: "Error", html: "<body><p>Email template not found</p></body>" };

  const branding = await getEmailBranding();

  const data = {
    firstName,
    lastName,
    policyNumber,
    vehicleDetails,
    endDate: new Date(expiresAt).toLocaleString(),
    renewalLink: policyDocumentLink,
    siteName: branding.siteName,
    companyName: branding.companyName,
  };
  const subject = replaceEmailVariables(template.subject, data);
  const header = replaceEmailVariables(template.header, data);
  const footer = replaceEmailVariables(template.footer, data);

  const { content: protectedContent, tokens } = protectBlockPlaceholders(template.content, [
    "renewalLink",
    "policyDocumentLink",
  ]);
  let content = replaceEmailVariables(protectedContent, data);
  content = enhanceEmailContent(content);
  content = injectBlocks(content, tokens, {
    renewalLink: buildCtaButton(policyDocumentLink, "Get a New Order", branding, { icon: "&#128260;" }),
    policyDocumentLink: buildCtaButton(policyDocumentLink, "Get a New Order", branding, { icon: "&#128260;" }),
  });


  const html = buildEmailShell({ branding, subject, header, content, footer });

  return { subject, html };
}

export async function createDirectEmail(subject: string, message: string) {
  const templates = await getEmailTemplates();
  const template = templates?.directEmail;
  if (!template) return { subject: "Error", html: "<body><p>Email template not found</p></body>" };
  const branding = await getEmailBranding();

  const data = { subject, message, siteName: branding.siteName, companyName: branding.companyName };
  const finalSubject = replaceEmailVariables(template.subject, data);
  const header = replaceEmailVariables(template.header, data);
  const content = enhanceEmailContent(replaceEmailVariables(template.content, data));
  const footer = replaceEmailVariables(template.footer, data);

  const html = buildEmailShell({ branding, subject: finalSubject, header, content, footer, emailFor: 'direct_email' });

  return { subject: finalSubject, html };
}


export async function createOrderCancelEmail({
  firstName,
  lastName,
  policyNumber,
  reason,
}: {
  firstName: string
  lastName: string
  policyNumber: string
  reason: string
}) {
  const templates = await getEmailTemplates();
  const template = templates?.orderCancel;
  if (!template) return { subject: "Error", html: "<body><p>Email template not found</p></body>" };

  const branding = await getEmailBranding();

  const data = {
    firstName,
    lastName,
    policyNumber,
    reason: reason || 'No reason provided.',
    siteName: branding.siteName,
    companyName: branding.companyName,
  };

  const subject = replaceEmailVariables(template.subject, data);
  const header = replaceEmailVariables(template.header, data);
  const footer = replaceEmailVariables(template.footer, data);
  const content = enhanceEmailContent(replaceEmailVariables(template.content, data));
  const html = buildEmailShell({ branding, subject, header, content, footer });

  return { subject, html };
}


export async function getAdminEmail() {
  try {
    const adminSettings = await db.query.settings.findFirst({
      where: eq(settings.param, "general"),
    })
    if (adminSettings && adminSettings.value) {
      const parsed = parseSettingValue<Record<string, any>>(adminSettings.value) || {}
      return parsed.adminEmail || process.env.ADMIN_EMAIL
    }
    return process.env.ADMIN_EMAIL
  } catch (error) {
    console.error("Failed to fetch admin email:", error)
    return process.env.ADMIN_EMAIL
  }
}

export async function createVerificationCodeEmail(firstName: string, code: string, expiryMinutes: string) {
  const templates = await getEmailTemplates();
  const template = templates?.verificationCode;
  if (!template) return { subject: "Error", html: "<body><p>Email template not found</p></body>" };

  const branding = await getEmailBranding();

  const data = {
    firstName: firstName || 'Customer',
    code,
    expiryMinutes,
    siteName: branding.siteName,
    companyName: branding.companyName
  };

  const subject = replaceEmailVariables(template.subject, data);
  const header = replaceEmailVariables(template.header, data);
  const footer = replaceEmailVariables(template.footer, data);

  const { content: protectedContent, tokens } = protectBlockPlaceholders(template.content, ["code"]);
  let content = replaceEmailVariables(protectedContent, data);
  content = enhanceEmailContent(content);
  content = injectBlocks(content, tokens, {
    code: buildCodeBox(code, branding),
  });

  const html = buildEmailShell({ branding, subject, header, content, footer });

  return { subject, html };
}

export async function createCustomerReplyEmail({
  ticketId,
  ticketSubject,
  customerName,
  message,
  ticketUrl,
}: {
  ticketId: string;
  ticketSubject: string;
  customerName: string;
  message: string;
  ticketUrl: string;
}) {
  const branding = await getEmailBranding();

  const subject = `New Customer Reply on Ticket #${ticketId}: ${ticketSubject}`;
  const header = `Ticket Reply: #${ticketId}`;
  const P = `style="margin:0 0 16px; padding:0; color:#334155; font-size:15px; line-height:1.75; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;"`
  const content = `
    <p ${P}>A customer has replied to ticket #${escapeHtml(ticketId)} (${escapeHtml(ticketSubject)}).</p>
    <p ${P}><strong style="color:#0f172a;">Customer:</strong> ${escapeHtml(customerName)}</p>
    <p ${P}><strong style="color:#0f172a;">Message:</strong></p>
    ${buildMessageCard(escapeHtml(message).replace(/\n/g, '<br>'), branding)}
    ${buildCtaButton(ticketUrl, "View Ticket", branding, { icon: "&#127915;" })}
  `;
  const footer = `This is an automated notification. Please do not reply directly to this email.`;

  const html = buildEmailShell({ branding, subject, header, content, footer });

  return { subject, html };
}