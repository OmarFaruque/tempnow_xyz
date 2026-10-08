import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidOrderNumber(policyNumber: string): boolean {
  // Policy number format: POL- followed by 6 digits (e.g., POL-001234)
  const policyRegex = /^POL-\d{6}$/i
  return policyRegex.test(policyNumber.trim())
}

export function isValidMotorReg(registration: string): boolean {
  if (!registration) {
    return false
  }

  // Regular expression for valid UK registration formats
  const ukRegEx = /^[A-Z]{2}[0-9]{2}\s?[A-Z]{3}$|^[A-Z][0-9]{1,3}[A-Z]{3}$|^[A-Z]{3}[0-9]{1,3}[A-Z]$|^[0-9]{1,4}[A-Z]{1,2}$|^[A-Z]{1,2}[0-9]{1,4}$|^[A-Z]{1,3}[0-9]{1,3}$/i

  return ukRegEx.test(registration.trim())
}


export function parseConfigValue(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  if (typeof value === "object") return value as Record<string, any>;
  return {};
}

export function sanitizeMarkup(html?: string): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

/* ------------------------------------------------------------------------ */
/* Color utilities                                                           */
/* ------------------------------------------------------------------------ */

/** Strictly validate/normalize a hex color to `#rrggbb` (expands `#rgb`). Anything else falls back safely. */
export function sanitizeHexColor(value: unknown, fallback = "#000000"): string {
  if (typeof value !== "string") return fallback
  const match = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(value.trim())
  if (!match) return fallback
  let hex = match[1].toLowerCase()
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("")
  return `#${hex}`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = sanitizeHexColor(hex).replace("#", "")
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")
  return `#${to(r)}${to(g)}${to(b)}`
}

/** Mix two hex colors. `weight` (0..1) is the share of `mix`. */
export function mixHexColors(base: string, mix: string, weight: number): string {
  const a = hexToRgb(base)
  const b = hexToRgb(mix)
  const w = Math.max(0, Math.min(1, weight))
  return rgbToHex(a.r + (b.r - a.r) * w, a.g + (b.g - a.g) * w, a.b + (b.b - a.b) * w)
}

/** Darken a hex color by mixing it with black (amount 0..1). */
export function shadeHexColor(hex: string, amount: number): string {
  return mixHexColors(hex, "#000000", amount)
}

/** Lighten a hex color by mixing it with white (amount 0..1). */
export function tintHexColor(hex: string, amount: number): string {
  return mixHexColors(hex, "#ffffff", amount)
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const channel = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** Pick black or white text for a given background color (WCAG contrast). */
export function getContrastTextColor(hex: string): string {
  return relativeLuminance(hex) > 0.45 ? "#0f172a" : "#ffffff"
}

/* ------------------------------------------------------------------------ */
/* HTML / URL escaping                                                       */
/* ------------------------------------------------------------------------ */

/** Escape a value for safe interpolation into HTML text or attribute contexts. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Normalize a site URL: adds `https://` when missing and strips trailing slashes. */
export function normalizeSiteUrl(raw: unknown): string {
  if (typeof raw !== "string") return ""
  let url = raw.trim()
  if (!url) return ""
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`
  return url.replace(/\/+$/, "")
}