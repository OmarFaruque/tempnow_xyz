import { db } from "@/lib/db"
import { settings } from "@/lib/schema"
import { eq } from "drizzle-orm"
import {
    escapeHtml,
    getContrastTextColor,
    normalizeSiteUrl,
    sanitizeHexColor,
    shadeHexColor,
    tintHexColor,
} from "@/core/helpers"

/**
 * Email theming system.
 *
 * Every deployment ("site") of this codebase keeps its own branding in the
 * `general` settings row (siteName, companyName, logo, siteDomain,
 * supportEmail, brandColor, ...). `getEmailBranding()` resolves that row with
 * environment-variable fallbacks, and `buildEmailShell()` renders a modern,
 * responsive, dark-mode aware email shell around any template content. There
 * is a single email design per site — no per-jurisdiction variations. The
 * result: each project automatically gets its own unique, branded email
 * design without sharing a single hardcoded look.
 */

export interface EmailBranding {
    siteName: string
    companyName: string
    logoUrl: string
    siteUrl: string
    supportEmail: string
    companyRegistration: string
    /** Primary brand color, always a sanitized `#rrggbb` value. */
    primaryColor: string
    /** Darker shade of the primary color (gradient end / hover tones). */
    primaryColorDark: string
    /** Very light tint of the primary color (soft backgrounds). */
    primaryColorSoft: string
    /** `#ffffff` or `#0f172a` — whichever reads better on the primary color. */
    onPrimaryColor: string
    fontStack: string
}

export interface EmailShellOptions {
    branding: EmailBranding
    subject: string
    header?: string
    content: string
    footer?: string
    /** Hidden inbox-preview text. Derived from the content when omitted. */
    preheader?: string
    /** `direct_email` renders the header inside the content area (legacy behavior). */
    emailFor?: string
}

/* ------------------------------------------------------------------------ */
/* Branding defaults                                                         */
/* ------------------------------------------------------------------------ */

/** Fallback brand color when a site has not configured one. */
export const DEFAULT_BRAND_COLOR = "#0d9488"

/* ------------------------------------------------------------------------ */
/* Branding resolution (single source: the site's `general` settings)       */
/* ------------------------------------------------------------------------ */

function str(value: unknown): string {
    return typeof value === "string" ? value.trim() : ""
}

async function getSettingsParam(param: string): Promise<Record<string, any> | null> {
    try {
        const row = await db.query.settings.findFirst({
            where: eq(settings.param, param),
        })
        if (!row || row.value === null || row.value === undefined) return null
        if (typeof row.value === "object") return row.value as Record<string, any>
        if (typeof row.value === "string") {
            try {
                return JSON.parse(row.value) as Record<string, any>
            } catch {
                return null
            }
        }
        return null
    } catch (error) {
        console.error(`Failed to fetch "${param}" settings for email branding:`, error)
        return null
    }
}

/**
 * Resolve the email branding for the current site.
 *
 * Single source of truth: the `general` settings row (one email design per
 * site — deliberately no UK/UAE variations). Priority: DB settings →
 * environment variables → built-in defaults. Because every site deployment
 * has its own settings row, each project automatically gets a unique look.
 */
export async function getEmailBranding(): Promise<EmailBranding> {
    const general = (await getSettingsParam("general")) || {}

    const siteName =
        str(general.siteName) ||
        str(process.env.NEXT_PUBLIC_SITE_NAME) ||
        str(process.env.APP_TITLE) ||
        "Tempnow"

    const companyName =
        str(general.companyName) ||
        str(process.env.EMAIL_COMPANY_NAME) ||
        siteName

    const primaryColor = sanitizeHexColor(
        general.brandColor ||
        general.primaryColor ||
        process.env.EMAIL_BRAND_COLOR ||
        process.env.NEXT_PUBLIC_BRAND_COLOR,
        DEFAULT_BRAND_COLOR
    )

    const siteUrl =
        normalizeSiteUrl(general.siteDomain || general.seoCanonicalUrl) ||
        normalizeSiteUrl(
            process.env.NEXT_PUBLIC_BASE_URL ||
            process.env.NEXT_PUBLIC_SITE_URL ||
            process.env.VERCEL_URL
        )

    return {
        siteName,
        companyName,
        logoUrl: str(general.logo) || str(process.env.EMAIL_LOGO_URL),
        siteUrl,
        supportEmail: str(general.supportEmail) || str(process.env.SUPPORT_EMAIL),
        companyRegistration: str(general.companyRegistration),
        primaryColor,
        primaryColorDark: shadeHexColor(primaryColor, 0.22),
        primaryColorSoft: tintHexColor(primaryColor, 0.92),
        onPrimaryColor: getContrastTextColor(primaryColor),
        fontStack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
    }
}

/* ------------------------------------------------------------------------ */
/* Content enhancement                                                       */
/* ------------------------------------------------------------------------ */

/**
 * Matches block-level placeholders produced by `protectBlockPlaceholders()`
 * in lib/email.ts (e.g. a CTA button or code box that must not be wrapped in
 * a paragraph).
 */
const BLOCK_TOKEN_RE = /^EMAIL_BLOCK_[A-Z0-9_]+$/

function isBlockToken(line: string): boolean {
    return line.length > 2 && line.charCodeAt(0) === 0 && line.charCodeAt(line.length - 1) === 0
        ? BLOCK_TOKEN_RE.test(line.slice(1, -1))
        : false
}

const BLOCK_LEVEL_TAG_RE = /<\s*(table|tbody|thead|tr|td|th|div|ul|ol|li|h[1-6]|blockquote|hr|p|img)\b/i

/**
 * Turn plain-text template content into polished HTML:
 * - `\n` becomes `<br>`
 * - runs of `- item` / `• item` lines become a styled list
 * - lines ending with `:` become section labels
 * - other lines become paragraphs
 *
 * Content that already contains block-level markup is left intact (only
 * newlines are normalized), and block tokens are passed through untouched so
 * callers can inject rich components (buttons, code boxes, ...) afterwards.
 */
export function enhanceEmailContent(rawContent: string): string {
    if (!rawContent) return ""

    const withBreaks = rawContent.replace(/\r\n/g, "\n").replace(/\n/g, "<br>")

    if (BLOCK_LEVEL_TAG_RE.test(withBreaks)) {
        // Already markup — keep the author's HTML, just normalize newlines.
        return withBreaks
    }

    const lines = withBreaks.split(/<br\s*\/?>/gi)
    const parts: string[] = []
    let listItems: string[] = []

    const P_STYLE = `style="margin:0 0 16px; padding:0; color:#334155; font-size:15px; line-height:1.75; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;"`
    const LABEL_STYLE = `style="margin:20px 0 8px; padding:0; color:#0f172a; font-size:13px; font-weight:700; line-height:1.4; text-transform:uppercase; letter-spacing:0.05em; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;"`
    const UL_STYLE = `style="margin:0 0 16px; padding:0 0 0 24px; list-style-type:disc;"`
    const LI_STYLE = `style="margin:0 0 8px; padding:0; color:#334155; font-size:15px; line-height:1.75; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;"`

    const flushList = () => {
        if (listItems.length > 0) {
            parts.push(`<ul class="email-list" ${UL_STYLE}>${listItems.map((item) => `<li ${LI_STYLE}>${item}</li>`).join("")}</ul>`)
            listItems = []
        }
    }

    for (const rawLine of lines) {
        const line = rawLine.trim()
        if (line === "") {
            flushList()
            continue
        }
        if (isBlockToken(line)) {
            flushList()
            parts.push(line)
            continue
        }
        const bullet = /^[-•*]\s+(.+)$/.exec(line)
        if (bullet) {
            listItems.push(bullet[1])
            continue
        }
        flushList()
        if (/^[^<>]{1,60}:$/.test(line)) {
            parts.push(`<p class="email-section-label" ${LABEL_STYLE}>${line}</p>`)
        } else {
            parts.push(`<p ${P_STYLE}>${line}</p>`)
        }
    }
    flushList()
    return parts.join("")
}

/* ------------------------------------------------------------------------ */
/* Reusable email components                                                 */
/* ------------------------------------------------------------------------ */

/**
 * Bulletproof CTA button (table-based, brand gradient, Outlook `bgcolor`
 * fallback, full-width on mobile).
 */
export function buildCtaButton(
    href: string,
    label: string,
    branding: EmailBranding,
    options: { icon?: string; align?: "left" | "center" } = {}
): string {
    const { icon = "", align = "center" } = options
    const iconHtml = icon
        ? `<span style="vertical-align:middle; margin-right:8px; font-size:15px;">${icon}</span>`
        : ""
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${align}" class="email-cta-table" style="margin:24px ${align === "center" ? "auto" : "0"};"><tr><td align="center" class="email-cta-cell" bgcolor="${branding.primaryColor}" style="background-color:${branding.primaryColor}; background-image:linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.primaryColorDark} 100%); border-radius:12px;"><a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="email-cta" style="display:inline-block; padding:14px 30px; font-family:${branding.fontStack}; font-size:16px; line-height:20px; font-weight:600; letter-spacing:0.2px; color:${branding.onPrimaryColor}; text-decoration:none; border-radius:12px;">${iconHtml}<span style="vertical-align:middle;">${escapeHtml(label)}</span></a></td></tr></table>`
}

/** Prominent, accessible one-time-passcode panel with a clear label. */
export function buildCodeBox(code: string, branding: EmailBranding): string {
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; margin:28px 0;">
<tr><td align="center" style="padding:0 8px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
<tr><td align="center" style="padding:0 0 10px; font-family:${branding.fontStack}; font-size:11px; line-height:16px; font-weight:700; letter-spacing:1.6px; text-transform:uppercase; color:${shadeHexColor(branding.primaryColor, 0.28)};">Your verification code</td></tr>
<tr><td align="center" bgcolor="#f7f9fa" style="background-color:#f7f9fa; border:1px solid #e5eaf0; border-top:3px solid ${branding.primaryColor}; border-radius:12px; padding:18px 30px;">
<span style="font-family:'Courier New', Courier, monospace; font-size:30px; line-height:1.3; font-weight:700; letter-spacing:6px; color:#183143; white-space:nowrap;">${escapeHtml(code)}</span>
</td></tr></table></td></tr></table>`
}

/** Quoted message card (ticket replies, customer messages). */
export function buildMessageCard(innerHtml: string, branding: EmailBranding): string {
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;"><tr><td bgcolor="${branding.primaryColorSoft}" style="background-color:${branding.primaryColorSoft}; border-left:4px solid ${branding.primaryColor}; border-radius:0 12px 12px 0; padding:18px 22px; font-size:15px; line-height:1.75; color:#334155; margin-top:20px;">${innerHtml}</td></tr></table>`
}

/* ------------------------------------------------------------------------ */
/* Email shell                                                               */
/* ------------------------------------------------------------------------ */

function toPlainText(html: string): string {
    return html
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/\s+/g, " ")
        .trim()
}

/**
 * Render the full branded email document around template content.
 *
 * Design goals: modern card layout, brand gradient header with logo/wordmark,
 * generous typography, styled lists/links/labels inside the content area,
 * dark-mode + mobile support, and a rich footer with company details.
 */
export function buildEmailShell(options: EmailShellOptions): string {
    const { branding, subject, header, content, footer, preheader, emailFor } = options

    const isDirectEmail = emailFor === "direct_email"
    const finalHeader = header || subject
    const currentYear = new Date().getFullYear()

    const siteName = escapeHtml(branding.siteName)
    const companyName = escapeHtml(branding.companyName)
    const { primaryColor, primaryColorDark, primaryColorSoft, onPrimaryColor, fontStack } = branding

    // Keep the canvas calm and neutral so the brand color is an accent, not a
    // wall of color. This also remains readable in clients that strip CSS.
    const pageBg = "#f3f6f8"
    const cardBorder = "#e5eaf0"

    const logoBlock = branding.logoUrl
        ? `<img src="${escapeHtml(branding.logoUrl)}" alt="${siteName}" width="140" style="display:block; max-width:140px; width:100%; height:auto; border:0; outline:none; text-decoration:none; border-radius:8px;">`
        : `<div style="font-family:${fontStack}; font-size:18px; font-weight:700; letter-spacing:-0.02em; color:#183143;">${siteName}</div>`

    const footerMetaParts: string[] = []
    if (branding.companyRegistration) {
        footerMetaParts.push(`Reg. ${escapeHtml(branding.companyRegistration)}`)
    }
    if (branding.supportEmail) {
        footerMetaParts.push(
            `Support: <a href="mailto:${escapeHtml(branding.supportEmail)}" style="color:#526b7a; text-decoration:underline;">${escapeHtml(branding.supportEmail)}</a>`
        )
    }
    if (branding.siteUrl) {
        footerMetaParts.push(
            `<a href="${escapeHtml(branding.siteUrl)}" target="_blank" rel="noopener noreferrer" style="color:#526b7a; text-decoration:underline;">${escapeHtml(branding.siteUrl.replace(/^https?:\/\//i, ""))}</a>`
        )
    }

    const customFooter = (footer || "").trim()
    const customFooterBlock = customFooter
        ? `<div style="margin-top:18px; padding-top:18px; border-top:1px solid #e2e8ec; font-size:13px; line-height:1.8; color:#526573;">${customFooter.replace(/\n/g, "<br>")}</div>`
        : ""

    const preheaderText = escapeHtml(
        (preheader || toPlainText(content) || finalHeader).slice(0, 140)
    )

    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(subject)}</title>
<!--[if mso]>
<xml>
<o:OfficeDocumentSettings>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
<style>
table, td, div, p, a, span, li { font-family: Arial, Helvetica, sans-serif !important; }
</style>
<![endif]-->
<style>
:root { color-scheme:light; supported-color-schemes:light; }
body { margin:0; padding:0; word-break:break-word; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
.email-content a { color:${primaryColor}; text-decoration:underline; text-underline-offset:2px; font-weight:500; }
.email-content h1, .email-content h2, .email-content h3, .email-content h4 { color:#0f172a; font-weight:700; line-height:1.3; margin:0 0 16px; }
.email-content h2 { font-size:20px; }
.email-content h3 { font-size:17px; }
.email-content p { color:#334155; font-size:15px; line-height:1.75; margin:0 0 18px; padding:0; }
.email-content p:last-child { margin-bottom:0; }
.email-content strong, .email-content b { color:#0f172a; }
.email-content .email-section-label { font-weight:700; color:#0f172a; margin:24px 0 10px; font-size:14px; text-transform:uppercase; letter-spacing:0.05em; }
.email-content ul.email-list { margin:0 0 20px; padding:0 0 0 24px; list-style:disc; }
.email-content ul.email-list li { color:#334155; font-size:15px; line-height:1.75; margin:0 0 8px; }
.email-content ul.email-list li::marker { color:${primaryColor}; }
.email-content ol { margin:0 0 20px; padding:0 0 0 24px; }
.email-content ol li { color:#334155; font-size:15px; line-height:1.75; margin:0 0 8px; }
.email-content hr { border:0; border-top:1px solid #e2e8f0; margin:28px 0; }
.email-content blockquote { margin:20px 0; padding:16px 20px; background-color:${primaryColorSoft}; border-left:4px solid ${primaryColor}; border-radius:4px 12px 12px 4px; color:#1e293b; }
.email-content img { max-width:100%; height:auto; border-radius:8px; }
.email-content .email-card { background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px 24px; margin:0 0 20px; }
.email-content .email-badge { display:inline-block; background-color:${primaryColorSoft}; color:${shadeHexColor(primaryColor, 0.35)}; border-radius:999px; padding:6px 14px; font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; margin:0 0 16px; }
@media only screen and (max-width:620px) {
  .email-outer-cell { padding:16px 8px !important; }
  .email-container { width:100% !important; border-radius:12px !important; }
  .email-header { padding:24px 20px !important; }
  .email-header-title { font-size:22px !important; line-height:1.3 !important; margin-top:0px !important; }
  .email-content { padding:24px 20px 28px !important; }
  .email-footer { padding:24px 20px !important; }
  .email-cta-table { width:100% !important; margin:24px 0 !important; }
  .email-cta-cell { width:100% !important; }
  .email-cta { display:block !important; width:100% !important; box-sizing:border-box; text-align:center; }
}
</style>
</head>
<body class="email-body" style="margin:0; padding:0; background-color:${pageBg}; -webkit-font-smoothing:antialiased;">
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:${pageBg};">${preheaderText}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-outer" bgcolor="${pageBg}" style="width:100%; background-color:${pageBg}; border-collapse:collapse;">
<tr>
<td align="center" class="email-outer-cell" style="padding:36px 16px; background-color:${pageBg};">
<!--[if mso]>
<table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td>
<![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-container" style="max-width:600px; width:100%; background-color:#ffffff; border:1px solid ${cardBorder}; border-radius:16px; overflow:hidden; margin:0 auto; box-shadow:0 4px 20px rgba(0,0,0,0.03);">
<tr>
<td class="email-header" bgcolor="${primaryColorSoft}" style="background-color:${primaryColorSoft}; padding:0; border-top:4px solid ${primaryColor}; border-bottom:1px solid ${tintHexColor(primaryColor, 0.85)}; text-align:left;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="padding:28px 0 24px;" width="36">&nbsp;</td>
<td style="padding:28px 0 24px; text-align:left;" width="528">
${logoBlock}
${isDirectEmail ? "" : `<h1 class="email-header-title" style="margin:0 16px 0 0 !important; font-family:${fontStack}; font-size:24px; line-height:1.35; font-weight:700; color:#0f172a; letter-spacing:-0.02em; text-align:left;">${escapeHtml(finalHeader)}</h1>`}
</td>
<td style="padding:28px 0 24px;" width="36">&nbsp;</td>
</tr>
</table>
</td>
</tr>
<tr>
<td class="email-content" align="left" style="background-color:#ffffff; padding:0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="padding:32px 0 36px; background-color:#ffffff;" width="36">&nbsp;</td>
<td style="padding:32px 0 36px; background-color:#ffffff; font-family:${fontStack}; font-size:15px; line-height:1.75; color:#334155; text-align:left;" width="528">
${isDirectEmail ? `<h2 style="margin:0 0 20px; font-family:${fontStack}; font-size:20px; font-weight:700; color:#0f172a; text-align:left;">${escapeHtml(finalHeader)}</h2>` : ""}
${content}
</td>
<td style="padding:32px 0 36px; background-color:#ffffff;" width="36">&nbsp;</td>
</tr>
</table>
</td>
</tr>
<tr>
<td class="email-footer" bgcolor="#0f172a" style="background-color:#0f172a; padding:0; border-top:1px solid #1e293b;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="padding:28px 0 30px;" width="36">&nbsp;</td>
<td style="padding:28px 0 30px; font-family:${fontStack}; text-align:left;" width="528">
<div style="font-size:13px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:#ffffff; margin-top:15px;">${siteName}</div>
<div style="margin-top:8px; font-size:12px; line-height:1.8; color:#94a3b8;">
${companyName}${footerMetaParts.length > 0 ? ` &middot; ${footerMetaParts.join(" &middot; ")}` : ""}
</div>
${customFooterBlock}
<div style="margin-top:14px; font-size:11px; line-height:1.6; color:#64748b;">&copy; ${currentYear} ${companyName}. All rights reserved.</div>
</td>
<td style="padding:28px 0 30px;" width="36">&nbsp;</td>
</tr>
</table>
</td>
</tr>
</table>
<!--[if mso]>
</td></tr></table>
<![endif]-->
</td>
</tr>
</table>
</body>
</html>`
}