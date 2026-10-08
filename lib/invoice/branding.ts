/**
 * Branding resolution for invoices.
 *
 * Every deployment keeps its own identity in the `general` settings row
 * (siteName, companyName, logo, brandColor, currency, timezone, ...). This
 * module turns that row — plus environment fallbacks — into a single
 * `InvoiceBranding` object, so the PDF template never has to know where its
 * colours and labels come from and every site automatically gets its own,
 * fully branded invoice.
 *
 * The database read is wrapped in a try/catch on purpose: an invoice must
 * still be produced (with sensible defaults) if settings cannot be loaded.
 */

import {
    getContrastTextColor,
    normalizeSiteUrl,
    sanitizeHexColor,
    shadeHexColor,
    tintHexColor,
} from '@/core/helpers';
import { currencySymbol, parseAmount, safeText } from './format';
import { DEFAULT_BRAND_COLOR } from './theme';
import type { InvoiceBranding } from './types';

const UAE_CURRENCIES = new Set(['AED', 'SAR', 'QAR', 'KWD', 'OMR', 'BHD']);

function str(value: unknown): string {
    return safeText(value);
}

function firstString(...values: unknown[]): string {
    for (const value of values) {
        const text = str(value);
        if (text) return text;
    }
    return '';
}

function toLines(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.map((line) => str(line)).filter(Boolean);
    }
    const text = str(value);
    if (!text) return [];
    return text
        .split(/\n|\s*\|\s*/)
        .map((line) => line.trim())
        .filter(Boolean);
}

function toRate(value: unknown, max = 100): number {
    const rate = parseAmount(value);
    if (rate === null || rate < 0) return 0;
    return Math.min(rate, max);
}

function toPositiveInt(value: unknown, fallback: number): number {
    const parsed = parseAmount(value);
    if (parsed === null || parsed < 0) return fallback;
    return Math.round(parsed);
}

/** Resolve a relative logo path (`/uploads/logo.png`) against the site URL. */
function resolveAssetUrl(path: string, siteUrl: string): string {
    if (!path) return '';
    if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:')) return path;
    if (!siteUrl) return path;
    return `${siteUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Build the invoice branding from a `general` settings object.
 * Exported for tests and for callers that already loaded the settings row.
 */
export function buildInvoiceBranding(
    general: Record<string, any> | null | undefined,
    overrides: Partial<InvoiceBranding> = {}
): InvoiceBranding {
    const g = (general || {}) as Record<string, any>;

    const siteName = firstString(
        g.siteName,
        process.env.NEXT_PUBLIC_SITE_NAME,
        process.env.APP_TITLE,
        'Tempnow'
    );
    const companyName = firstString(g.companyName, process.env.EMAIL_COMPANY_NAME, siteName);

    const primaryColor = sanitizeHexColor(
        g.brandColor || g.primaryColor || process.env.EMAIL_BRAND_COLOR || process.env.NEXT_PUBLIC_BRAND_COLOR,
        DEFAULT_BRAND_COLOR
    );

    const siteUrl = normalizeSiteUrl(
        firstString(g.siteDomain, g.seoCanonicalUrl, process.env.NEXT_PUBLIC_BASE_URL, process.env.NEXT_PUBLIC_SITE_URL, process.env.VERCEL_URL)
    );

    const jurisdiction = firstString(g.activeJurisdiction, 'uk').toLowerCase();
    const configuredCurrency = firstString(g.currency).toUpperCase();
    const currency =
        configuredCurrency ||
        (jurisdiction.includes('uae') ? 'AED' : 'GBP');

    const vatNumber = firstString(g.vatNumber, g.trn, g.taxNumber, g.companyTaxNumber);

    const taxRate = toRate(g.invoiceTaxRate ?? g.taxRate);
    const taxInclusive = g.invoiceTaxInclusive === true || g.taxInclusive === true;
    const taxLabel =
        firstString(g.invoiceTaxLabel, g.taxLabel) ||
        (jurisdiction.includes('uae') ? 'VAT' : 'Insurance Premium Tax');

    const taxNote =
        firstString(g.invoiceTaxNote) ||
        (taxRate > 0 || taxInclusive
            ? `${taxLabel} is included in the premium shown above where applicable.`
            : '');

    const isUae = jurisdiction.includes('uae');

    const branding: InvoiceBranding = {
        siteName,
        companyName,
        companyAddressLines: toLines(g.companyAddress || g.invoiceCompanyAddress),
        companyRegistration: firstString(g.companyRegistration, g.registrationNumber),
        vatNumber,
        supportEmail: firstString(g.supportEmail, process.env.SUPPORT_EMAIL),
        companyPhone: firstString(g.companyPhone, g.phone, g.supportPhone),
        siteUrl,
        logoUrl: resolveAssetUrl(firstString(g.logo, process.env.EMAIL_LOGO_URL), siteUrl),
        primaryColor,
        primaryColorDark: shadeHexColor(primaryColor, isUae ? 0.38 : 0.55),
        primaryColorSoft: tintHexColor(primaryColor, 0.93),
        onPrimaryColor: getContrastTextColor(primaryColor),
        currency,
        timezone: firstString(g.timezone, isUae ? 'Asia/Dubai' : 'Europe/London'),
        taxRate,
        taxLabel,
        taxInclusive,
        taxNote,
        dueDays: toPositiveInt(g.invoiceDueDays, 0),
        terms:
            firstString(g.invoiceTerms) ||
            'Documents are delivered electronically and are available immediately after payment confirmation. Refunds are available within 7 days of purchase where a technical issue prevents you from accessing your documents as intended.',
        footerNote:
            firstString(g.invoiceFooterNote) ||
            'This is a computer-generated invoice and is valid without a signature.',
        documentTitle: '',
        jurisdiction,
    };

    branding.documentTitle =
        firstString(g.invoiceTitle) ||
        (vatNumber ? 'TAX INVOICE' : 'INVOICE');

    return { ...branding, ...overrides };
}

/**
 * Load the `general` settings row and build the invoice branding for the
 * current site. Never throws — falls back to environment branding defaults.
 */
export async function resolveInvoiceBranding(
    overrides: Partial<InvoiceBranding> = {},
    preloadedGeneral?: Record<string, any> | null
): Promise<InvoiceBranding> {
    let general = preloadedGeneral ?? null;

    if (!preloadedGeneral) {
        try {
            // Imported lazily so pure rendering (previews, tests, scripts)
            // never needs a database connection.
            const [{ db }, { settings }, { eq }] = await Promise.all([
                import('@/lib/db'),
                import('@/lib/schema'),
                import('drizzle-orm'),
            ]);

            const row = await db.query.settings.findFirst({
                where: eq(settings.param, 'general'),
            });
            const value = row?.value;
            if (value && typeof value === 'object') {
                general = value as Record<string, any>;
            } else if (typeof value === 'string') {
                general = JSON.parse(value) as Record<string, any>;
            }
        } catch (error) {
            console.error('Invoice branding: could not read site settings, using defaults.', error);
            general = null;
        }
    }

    return buildInvoiceBranding(general, overrides);
}

/** Convenience re-export so callers can format money with the same symbol. */
export { currencySymbol };
