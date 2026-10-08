/**
 * The invoice design system.
 *
 * One place that defines the look of every generated invoice: palette, type
 * scale, spacing and corner radii. The brand colour comes from the site
 * settings, everything else is a deliberately restrained, print-first system
 * so that any deployment's invoice looks like it was designed on purpose.
 */

import { rgb } from 'pdf-lib';
import { shadeHexColor, tintHexColor } from '@/core/helpers';
import type { InvoiceBranding } from './types';

/**
 * Fallback brand colour for sites that have not configured one.
 * Mirrors `DEFAULT_BRAND_COLOR` in `lib/email-theme.ts` (kept local so the
 * renderer never imports the database-backed email module).
 */
export const DEFAULT_BRAND_COLOR = '#0d9488';

export interface InvoicePalette {
    /** Headline / high-emphasis text. */
    ink: string;
    /** Body copy. */
    body: string;
    /** Secondary and meta text. */
    muted: string;
    /** Faintest text (footer small print). */
    faint: string;
    /** Hairlines and table borders. */
    hairline: string;
    /** Panel background. */
    surface: string;
    /** Slightly darker surface for table headers. */
    surfaceAlt: string;
    /** Brand colour. */
    primary: string;
    /** Darker brand shade used for gradients and emphasis. */
    primaryDark: string;
    /** Very light brand tint used for soft fills. */
    primarySoft: string;
    /** Mid brand tint used for decorative waves. */
    primaryTint: string;
    /** Text colour that reads on the brand colour. */
    onPrimary: string;
    /** Success (paid) accent. */
    success: string;
    /** Warning (due) accent. */
    warning: string;
    /** Card that carries the amount payable. */
    contrastCard: string;
    contrastCardEnd: string;
    onContrast: string;
    onContrastMuted: string;
}

export interface InvoiceTypeScale {
    display: number;
    title: number;
    heading: number;
    subheading: number;
    label: number;
    body: number;
    small: number;
    micro: number;
}

export interface InvoiceMetrics {
    pageMargin: number;
    /** Height of the full masthead on page 1. */
    headerHeight: number;
    /** Height of the compact masthead on continuation pages. */
    compactHeaderHeight: number;
    /** Height of the footer zone reserved at the bottom of every page. */
    footerHeight: number;
    /** Standard card radius. */
    radius: number;
    radiusSmall: number;
}

export interface InvoiceTheme {
    palette: InvoicePalette;
    type: InvoiceTypeScale;
    metrics: InvoiceMetrics;
    /** `rgb()` colours pre-computed for pdf-lib. */
    color: Record<keyof InvoicePalette, ReturnType<typeof rgb>>;
    fonts: 'helvetica';
}

export function createInvoiceTheme(branding: InvoiceBranding): InvoiceTheme {
    const primary = branding.primaryColor;

    const palette: InvoicePalette = {
        ink: '#0B1220',
        body: '#3F4C5F',
        muted: '#7A889B',
        faint: '#98A5B6',
        hairline: '#E5EAF0',
        surface: '#F6F8FA',
        surfaceAlt: '#EFF3F7',
        primary,
        primaryDark: branding.primaryColorDark || shadeHexColor(primary, 0.5),
        primarySoft: tintHexColor(primary, 0.93),
        primaryTint: tintHexColor(primary, 0.78),
        onPrimary: branding.onPrimaryColor,
        success: '#0F9D58',
        warning: '#C2740B',
        contrastCard: '#0B1220',
        contrastCardEnd: shadeHexColor(primary, 0.62),
        onContrast: '#FFFFFF',
        onContrastMuted: '#C7D2DE',
    };

    const type: InvoiceTypeScale = {
        display: 31,
        title: 20,
        heading: 13,
        subheading: 11,
        label: 8,
        body: 10,
        small: 9,
        micro: 7.8,
    };

    const metrics: InvoiceMetrics = {
        pageMargin: 46,
        headerHeight: 144,
        compactHeaderHeight: 92,
        footerHeight: 72,
        radius: 12,
        radiusSmall: 8,
    };

    const color = Object.fromEntries(
        Object.entries(palette).map(([key, hex]) => [key, hexToPdfColor(hex)])
    ) as Record<keyof InvoicePalette, ReturnType<typeof rgb>>;

    return { palette, type, metrics, color, fonts: 'helvetica' };
}

function hexToPdfColor(hex: string) {
    const clean = hex.replace('#', '');
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    const r = parseInt(full.slice(0, 2), 16) / 255;
    const g = parseInt(full.slice(2, 4), 16) / 255;
    const b = parseInt(full.slice(4, 6), 16) / 255;
    return rgb(
        Number.isFinite(r) ? r : 0,
        Number.isFinite(g) ? g : 0,
        Number.isFinite(b) ? b : 0
    );
}

export { hexToPdfColor };
