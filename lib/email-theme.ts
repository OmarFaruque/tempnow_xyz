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

    const flushList = () => {
        if (listItems.length > 0) {
            parts.push(`<ul class="email-list">${listItems.map((item) => `<li>${item}</li>`).join("")}</ul>`)
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
            parts.push(`<p class="email-section-label">${line}</p>`)
        } else {
            parts.push(`<p>${line}</p>`)
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

/** One-time-passcode box with brand-tinted background. */
export function buildCodeBox(code: string, branding: EmailBranding): string {
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:24px auto;"><tr><td align="center" bgcolor="${branding.primaryColorSoft}" style="background-color:${branding.primaryColorSoft}; border:1px solid ${tintHexColor(branding.primaryColor, 0.65)}; border-radius:14px; padding:18px 34px;"><span style="font-family:'Courier New', Courier, monospace; font-size:30px; font-weight:700; letter-spacing:8px; color:${shadeHexColor(branding.primaryColor, 0.35)};">${escapeHtml(code)}</span></td></tr></table>`
}

/** Quoted message card (ticket replies, customer messages). */
export function buildMessageCard(innerHtml: string, branding: EmailBranding): string {
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;"><tr><td bgcolor="${branding.primaryColorSoft}" style="background-color:${branding.primaryColorSoft}; border-left:4px solid ${branding.primaryColor}; border-radius:0 12px 12px 0; padding:18px 22px; font-size:15px; line-height:1.75; color:#334155;">${innerHtml}</td></tr></table>`
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

    const pageBg = tintHexColor(primaryColor, 0.93)
    const cardBorder = tintHexColor(primaryColor, 0.78)

    const logoBlock = branding.logoUrl
        ? `<img src="${escapeHtml(branding.logoUrl)}" alt="${siteName}" width="140" style="display:block; max-width:140px; width:100%; height:auto; border:0; outline:none; text-decoration:none; border-radius:8px;">`
        : `<div style="font-family:${fontStack}; font-size:20px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:#ffffff;">${siteName}</div>`

    const footerMetaParts: string[] = []
    if (branding.companyRegistration) {
        footerMetaParts.push(`Reg. ${escapeHtml(branding.companyRegistration)}`)
    }
    if (branding.supportEmail) {
        footerMetaParts.push(
            `Support: <a href="mailto:${escapeHtml(branding.supportEmail)}" style="color:#e2e8f0; text-decoration:underline;">${escapeHtml(branding.supportEmail)}</a>`
        )
    }
    if (branding.siteUrl) {
        footerMetaParts.push(
            `<a href="${escapeHtml(branding.siteUrl)}" target="_blank" rel="noopener noreferrer" style="color:#e2e8f0; text-decoration:underline;">${escapeHtml(branding.siteUrl.replace(/^https?:\/\//i, ""))}</a>`
        )
    }

    const customFooter = (footer || "").trim()
    const customFooterBlock = customFooter
        ? `<div style="margin-top:18px; padding-top:18px; border-top:1px solid rgba(255,255,255,0.14); font-size:13px; line-height:1.8; color:#cbd5e1;">${customFooter.replace(/\n/g, "<br>")}</div>`
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
:root { color-scheme: light dark; supported-color-schemes: light dark; }
body { margin:0; padding:0; word-break:break-word; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
.email-content a { color:${primaryColor}; text-decoration:underline; }
.email-content h1, .email-content h2, .email-content h3, .email-content h4 { color:#0f172a; font-weight:700; line-height:1.3; margin:0 0 14px; }
.email-content h2 { font-size:22px; }
.email-content h3 { font-size:18px; }
.email-content p { color:#334155; font-size:15px; line-height:1.75; margin:0 0 16px; }
.email-content p:last-child { margin-bottom:0; }
.email-content strong, .email-content b { color:#0f172a; }
.email-content .email-section-label { font-weight:700; color:#0f172a; margin:20px 0 10px; }
.email-content ul.email-list { margin:0 0 18px; padding:0 0 0 22px; list-style:disc; }
.email-content ul.email-list li { color:#334155; font-size:15px; line-height:1.7; margin:0 0 8px; }
.email-content ul.email-list li::marker { color:${primaryColor}; }
.email-content ol { margin:0 0 18px; padding:0 0 0 22px; }
.email-content ol li { color:#334155; font-size:15px; line-height:1.7; margin:0 0 8px; }
.email-content hr { border:0; border-top:1px solid #e2e8f0; margin:24px 0; }
.email-content blockquote { margin:16px 0; padding:14px 20px; background-color:${primaryColorSoft}; border-left:4px solid ${primaryColor}; border-radius:0 10px 10px 0; color:#334155; }
.email-content img { max-width:100%; height:auto; }
.email-content .email-card { background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:18px 22px; margin:0 0 18px; }
.email-content .email-badge { display:inline-block; background-color:${primaryColorSoft}; color:${shadeHexColor(primaryColor, 0.35)}; border-radius:999px; padding:4px 12px; font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; margin:0 0 14px; }
@media (prefers-color-scheme: dark) {
  .email-body { background-color:#0b1220 !important; }
  .email-outer { background-color:#0b1220 !important; }
  .email-container { background-color:#111a2e !important; border-color:#253352 !important; }
  .email-content { background-color:#111a2e !important; }
  .email-content p, .email-content li { color:#c7d2e4 !important; }
  .email-content h1, .email-content h2, .email-content h3, .email-content h4, .email-content strong, .email-content b, .email-content .email-section-label { color:#f1f5f9 !important; }
  .email-content hr { border-top-color:#253352 !important; }
  .email-footer { background-color:#0b1220 !important; }
}
@media only screen and (max-width:620px) {
  .email-outer { padding:12px !important; }
  .email-container { width:100% !important; border-radius:14px !important; }
  .email-header { padding:28px 22px !important; border-radius:14px 14px 0 0 !important; }
  .email-header-title { font-size:24px !important; line-height:1.25 !important; margin-top:14px !important; }
  .email-content { padding:26px 22px !important; }
  .email-footer { padding:26px 22px !important; border-radius:0 0 14px 14px !important; }
  .email-cta-table { width:100% !important; margin:20px 0 !important; }
  .email-cta-cell { width:100% !important; }
  .email-cta { display:block !important; width:100% !important; box-sizing:border-box; text-align:center; }
}
</style>
</head>
<body class="email-body" style="margin:0; padding:0; background-color:${pageBg};">
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:${pageBg};">${preheaderText}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-outer" style="background-color:${pageBg}; padding:32px 12px;">
<tr>
<td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="email-container" data-ogsb="#111a2e" style="width:600px; max-width:600px; background-color:#ffffff; border:1px solid ${cardBorder}; border-radius:20px; overflow:hidden; box-shadow:0 20px 45px rgba(15, 23, 42, 0.10);">
<tr>
<td class="email-header" bgcolor="${primaryColor}" style="background-color:${primaryColor}; background-image:radial-gradient(120% 170% at 100% 0%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 52%), linear-gradient(135deg, ${primaryColor} 0%, ${primaryColorDark} 100%); padding:36px 48px; border-radius:20px 20px 0 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td>${logoBlock}</td></tr></table>
${isDirectEmail ? "" : `<h1 class="email-header-title" style="margin:20px 0 0; font-family:${fontStack}; font-size:28px; line-height:1.25; font-weight:700; color:#ffffff; letter-spacing:-0.01em;">${escapeHtml(finalHeader)}</h1>`}
</td>
</tr>
<tr>
<td class="email-content" data-ogsb="#111a2e" data-ogsc="#c7d2e4" style="background-color:#ffffff; padding:40px 48px; font-family:${fontStack}; font-size:15px; line-height:1.75; color:#334155;">
${isDirectEmail ? `<h2 style="margin-top:0;">${escapeHtml(finalHeader)}</h2>` : ""}
${content}
</td>
</tr>
<tr>
<td class="email-footer" bgcolor="#0f172a" data-ogsb="#0b1220" style="background-color:#0f172a; padding:32px 48px; border-radius:0 0 20px 20px; font-family:${fontStack};">
<div style="font-size:13px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:#ffffff;">${siteName}</div>
<div style="margin-top:10px; font-size:13px; line-height:1.8; color:#94a3b8;">
${companyName}${footerMetaParts.length > 0 ? ` &middot; ${footerMetaParts.join(" &middot; ")}` : ""}
</div>
${customFooterBlock}
<div style="margin-top:16px; font-size:12px; line-height:1.7; color:#64748b;">&copy; ${currentYear} ${companyName}. All rights reserved.</div>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`
}