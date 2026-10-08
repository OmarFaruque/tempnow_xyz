/**
 * The invoice template itself.
 *
 * Visual language (v2 — "luxury statement"):
 * - full-bleed masthead with a horizontal brand gradient, a soft aurora wave
 *   and a ticket-perforated bottom edge
 * - a white "logo plate" so any customer logo stays readable on colour
 * - a policy/vehicle summary card
 * - a dark hero card carrying the amount payable, with a wax-seal style stamp
 *   that flips from PAID to DUE
 * - a clean, hairline-separated items table with right-aligned money columns
 * - a balanced totals block and a legal footer
 * - a second page: recap, payment summary, delivery steps, inclusions,
 *   important information and a help card
 *
 * Everything is drawn with vector primitives (no HTML, no headless browser),
 * so the PDF stays small, sharp at any zoom, and runs on every runtime.
 *
 * Layout note: page 1 content is bounded by `metrics.footerHeight` — blocks
 * that would collide with the footer (`drawClosingNote`) are skipped rather
 * than allowed to overlap.
 */

import {
    PDFDocument,
    PDFFont,
    PDFPage,
    StandardFonts,
} from 'pdf-lib';
import { loadInvoiceLogo, type InvoiceLogo } from './assets';
import { formatMoney, safeText, truncate, wrapText } from './format';
import {
    checkPath,
    circlePath,
    drawBullet,
    drawCard,
    drawGradientBand,
    drawPerforation,
    drawSeal,
    drawSparkle,
    drawWave,
    drawText,
    drawTextCenter,
    drawTextRight,
    drawTracked,
    fromTop,
    hairline,
    trackedWidth,

} from './primitives';
import { createInvoiceTheme, type InvoiceTheme } from './theme';
import type { InvoiceBranding, InvoiceDocument, InvoiceLineItem } from './types';

/* ------------------------------------------------------------------------ */
/* Shared types                                                              */
/* ------------------------------------------------------------------------ */

interface Fonts {
    regular: PDFFont;
    bold: PDFFont;
    oblique: PDFFont;
}

interface Ctx {
    doc: InvoiceDocument;
    theme: InvoiceTheme;
    fonts: Fonts;
    logo: InvoiceLogo | null;
    /** Total number of pages, for "Page 1 of 2". */
    totalPages: number;
}

interface ColumnGeometry {
    pageWidth: number;
    margin: number;
    contentWidth: number;
    descX: number;
    descWidth: number;
    qtyCenter: number;
    unitRight: number;
    amountRight: number;
}

const LINE_HEIGHT = {
    body: 13.2,
    small: 11.8,
    micro: 11.2,
};

const DETAIL_LINES_MAX = 5;

/** Baseline position for text whose block starts at `top`. */
function baseline(top: number, size: number): number {
    return top + size * 0.74;
}

function columnsFor(page: PDFPage, theme: InvoiceTheme): ColumnGeometry {
    const pageWidth = page.getSize().width;
    const margin = theme.metrics.pageMargin;
    const amountRight = pageWidth - margin;
    const amountWidth = 92;
    const unitRight = amountRight - amountWidth;
    const unitWidth = 86;
    const qtyRight = unitRight - unitWidth;
    const qtyWidth = 42;

    return {
        pageWidth,
        margin,
        contentWidth: pageWidth - margin * 2,
        descX: margin,
        descWidth: qtyRight - qtyWidth - margin - 16,
        qtyCenter: qtyRight - qtyWidth / 2,
        unitRight,
        amountRight,
    };
}

/* ------------------------------------------------------------------------ */
/* Entry point                                                               */
/* ------------------------------------------------------------------------ */

export interface RenderInvoiceOptions {
    document: InvoiceDocument;
    branding: InvoiceBranding;
    logo?: InvoiceLogo | null;
    /** Set to `false` to render the single-page invoice only. */
    includeInformationPage?: boolean;
}

/**
 * Render the invoice into `pdf`: two A4 pages (invoice + information page).
 */
export async function renderInvoicePdf(
    pdf: PDFDocument,
    options: RenderInvoiceOptions
): Promise<void> {
    const { document: doc, branding } = options;
    const theme = createInvoiceTheme(branding);

    const fonts: Fonts = {
        regular: await pdf.embedFont(StandardFonts.Helvetica),
        bold: await pdf.embedFont(StandardFonts.HelveticaBold),
        oblique: await pdf.embedFont(StandardFonts.HelveticaOblique),
    };

    const logo =
        options.logo !== undefined ? options.logo : await loadInvoiceLogo(pdf, branding.logoUrl);

    const includeInfoPage = options.includeInformationPage !== false;

    const ctx: Ctx = {
        doc,
        theme,
        fonts,
        logo: logo ?? null,
        totalPages: 1,
    };

    // --- invoice page 1: the fixed "cover" part --------------------------
    const firstPage = pdf.addPage();
    drawMasthead(ctx, firstPage);

    const afterParties = drawParties(ctx, firstPage, theme.metrics.headerHeight + 14);
    const afterCover = drawCoverPanel(ctx, firstPage, afterParties + 14);
    const afterHero = drawAmountCard(ctx, firstPage, afterCover + 16);

    // --- flowing part: charges → totals → closing note -------------------
    // The table continues onto new pages when it runs out of room, and the
    // totals block is never orphaned at the bottom of a page.
    const invoicePages: PDFPage[] = [firstPage];
    const flow: Flow = {
        ctx,
        pdf,
        pages: invoicePages,
        page: firstPage,
        cursor: afterHero + 12,
        summaryTitle: `${safeText(doc.documentTitle).toUpperCase()} ${safeText(doc.invoiceNumber)}`,
    };

    drawChargesTable(flow);
    drawTotalsSection(flow);

    // --- information page -----------------------------------------------
    const pages: Array<{ page: PDFPage; kind: 'invoice' | 'info' }> = invoicePages.map((page) => ({
        page,
        kind: 'invoice' as const,
    }));

    if (includeInfoPage) {
        const infoPage = pdf.addPage();
        drawCompactMasthead(ctx, infoPage, 'Your documents & cover information');
        const top = drawRecapCard(ctx, infoPage, theme.metrics.compactHeaderHeight + 26);
        const afterPayment = drawPaymentSummary(ctx, infoPage, top + 26);
        const afterSteps = drawAccessSteps(ctx, infoPage, afterPayment + 26);
        const afterSections = drawSectionsGrid(ctx, infoPage, afterSteps + 24);
        drawHelpCard(ctx, infoPage, afterSections + 24);
        pages.push({ page: infoPage, kind: 'info' });
    }

    ctx.totalPages = pages.length;
    pages.forEach((entry, index) => drawPageFooter(ctx, entry.page, index + 1));
}

/* ------------------------------------------------------------------------ */
/* Mastheads                                                                 */
/* ------------------------------------------------------------------------ */

function drawAuroraWave(
    page: PDFPage,
    theme: InvoiceTheme,
    /** Top of the wave zone; the waves fill downwards from here. */
    top: number,
    height: number,
    width: number
) {
    const { color } = theme;

    drawWave(page, {
        x: 0,
        top: top + height * 0.45,
        width,
        height: height * 0.55,
        color: color.onPrimary,
        opacity: 0.08,
        waves: 2.2,
        phase: 0.4,
    });

    drawWave(page, {
        x: 0,
        top,
        width,
        height,
        color: color.primaryTint,
        opacity: 0.22,
        waves: 2.6,
        phase: 2.1,
    });
}

function drawLogoPlate(
    ctx: Ctx,
    page: PDFPage,
    options: {
        x: number;
        top: number;
        height: number;
        minWidth: number;
        padding: number;
        /**
         * Hard cap for the plate. The masthead title is right-aligned, so the
         * plate must never be allowed to grow into it (a wide logo used to
         * overlap the page-2 heading).
         */
        maxWidth: number;
    }
): LogoPlate {
    const { theme, fonts, logo, doc } = ctx;
    const { color } = theme;
    const { x, top, height, minWidth, padding, maxWidth } = options;

    const wordmark = safeText(doc.seller.name || theme.palette.primary).toUpperCase();
    const maxWordmarkSize = height >= 44 ? 14.5 : 11.5;
    // Shrink the wordmark until it fits the plate — long legal entity names
    // must never spill outside the white plate.
    let wordmarkSize = maxWordmarkSize;
    let wordmarkWidth = fonts.bold.widthOfTextAtSize(wordmark, wordmarkSize);
    const maxWordmarkWidth = Math.max(minWidth, maxWidth) - 32;

    while (wordmarkWidth > maxWordmarkWidth && wordmarkSize > 7) {
        wordmarkSize -= 0.25;
        wordmarkWidth = fonts.bold.widthOfTextAtSize(wordmark, wordmarkSize);
    }

    // The plate is sized around its content so the header never looks padded.
    const contentWidth = logo
        ? height * 1.9 * Math.min(Math.max(logo.aspect, 0.9), 4)
        : wordmarkWidth;
    const plateWidth = Math.max(minWidth, Math.min(contentWidth + padding * 2, maxWidth));
    const plateHeight = height;

    drawCard(page, {
        x,
        top,
        width: plateWidth,
        height: plateHeight,
        radius: theme.metrics.radiusSmall,
        color: color.onPrimary,
    });

    const innerX = x + padding;
    const innerWidth = plateWidth - padding * 2;
    const innerHeight = plateHeight - padding * 0.9;

    if (logo) {
        const maxLogoHeight = innerHeight;
        const maxLogoWidth = innerWidth;
        let logoHeight = maxLogoHeight;
        let logoWidth = logoHeight * logo.aspect;

        if (logoWidth > maxLogoWidth) {
            logoWidth = maxLogoWidth;
            logoHeight = logoWidth / logo.aspect;
        }

        page.drawImage(logo.image, {
            x: innerX + (innerWidth - logoWidth) / 2,
            y: fromTop(page, top + padding * 0.45) - logoHeight,
            width: logoWidth,
            height: logoHeight,
        });
    } else {
        drawText(page, {
            x: innerX + (innerWidth - wordmarkWidth) / 2,
            top: baseline(top + (plateHeight - wordmarkSize) / 2 - 1, wordmarkSize),
            text: wordmark,
            font: fonts.bold,
            size: wordmarkSize,
            color: theme.color.ink,
        });
    }

    // The caller needs the right edge to lay the title out beside the plate.
    return { x, top, width: plateWidth, height: plateHeight, right: x + plateWidth };
}

/* ------------------------------------------------------------------------ */
/* Masthead title fitting                                                    */
/* ------------------------------------------------------------------------ */

/** The minimum space that must stay clear between the plate and the title. */
const MASTHEAD_TITLE_GAP = 18;

interface LogoPlate {
    x: number;
    top: number;
    width: number;
    height: number;
    /** Right edge of the plate — the title must start after this + the gap. */
    right: number;
}

interface MastheadTitleFit {
    size: number;
    lines: string[];
    lineHeight: number;
}

/**
 * Fit the right-aligned masthead title into the space left of the logo plate.
 *
 * Strategy, in order of preference:
 *   1. keep the preferred size and wrap onto up to `maxLines` lines
 *   2. shrink (down to `minSize`) until it fits the same number of lines
 *   3. truncate the last line as a last resort
 *
 * Exported (and font-agnostic) so the geometry can be unit tested.
 */
export function fitMastheadTitle(
    text: string,
    font: { widthOfTextAtSize: (text: string, size: number) => number },
    options: {
        maxWidth: number;
        preferredSize: number;
        minSize: number;
        maxLines?: number;
    }
): MastheadTitleFit {
    const { maxWidth, preferredSize, minSize, maxLines = 1 } = options;
    const clean = safeText(text);
    const available = Math.max(40, maxWidth);

    const linesFor = (value: string, size: number): string[] =>
        wrapText(value, font as never, size, available).slice(0, maxLines);

    const fits = (lines: string[], size: number): boolean =>
        lines.length > 0 &&
        lines.length <= maxLines &&
        lines.every((line) => font.widthOfTextAtSize(line, size) <= available + 0.01);

    // 1 + 2: preferred size first, then step down.
    for (let size = preferredSize; size >= minSize; size -= 0.5) {
        const lines = linesFor(clean, size);

        if (lines.length > maxLines) break;
        if (fits(lines, size)) {
            return { size, lines, lineHeight: Math.round(size * 1.12) };
        }
    }

    // 3: smallest allowed size, truncated to the available width.
    const size = minSize;
    const lines = linesFor(clean, size);
    const lastIndex = Math.max(lines.length - 1, 0);

    while (
        lines[lastIndex] &&
        lines.length <= maxLines &&
        font.widthOfTextAtSize(lines[lastIndex], size) > available
    ) {
        lines[lastIndex] = `${lines[lastIndex].slice(0, -1)}`;
    }

    return {
        size,
        lines: lines.slice(0, maxLines).map((line, index) =>
            index === lines.slice(0, maxLines).length - 1
                ? truncate(line, font as never, size, available)
                : line
        ),
        lineHeight: Math.round(size * 1.12),
    };
}

function drawStatusChip(
    page: PDFPage,
    ctx: Ctx,
    options: {
        right: number;
        top: number;
        height: number;
        label: string;
        tone: 'success' | 'warning' | 'neutral';
    }
): void {
    const { theme, fonts } = ctx;
    const { right, top, height, label, tone } = options;
    const size = theme.type.micro + 0.4;
    const text = safeText(label).toUpperCase();
    const textWidth = trackedWidth(text, fonts.bold, size, 0.9);
    const width = textWidth + 30;

    const toneColor =
        tone === 'success'
            ? theme.color.success
            : tone === 'warning'
                ? theme.color.warning
                : theme.color.primary;

    drawCard(page, {
        x: right - width,
        top,
        width,
        height,
        radius: height / 2,
        color: theme.color.onPrimary,
        opacity: 0.18,
    });

    drawBullet(page, {
        x: right - width + 13,
        top: top + height / 2,
        radius: 2.4,
        color: toneColor,
    });

    drawTracked(page, {
        x: right - width + 21,
        top: baseline(top + (height - size) / 2 - 0.4, size),
        text,
        font: fonts.bold,
        size,
        color: theme.color.onPrimary,
        tracking: 0.9,
    });
}

/** Page 1 masthead: gradient band, aurora wave, logo plate, title, status. */
function drawMasthead(ctx: Ctx, page: PDFPage): void {
    const { theme, fonts, doc } = ctx;
    const { metrics, color } = theme;
    const width = page.getSize().width;
    const bandHeight = metrics.headerHeight - 12;

    drawGradientBand(page, {
        x: 0,
        top: 0,
        width,
        height: bandHeight,
        from: color.primaryDark,
        to: color.primary,
        direction: 'horizontal',
    });

    drawAuroraWave(page, theme, bandHeight - 30, 30, width * 0.72);

    // Ticket-style perforated edge under the band.
    drawPerforation(page, {
        x: 0,
        top: bandHeight,
        width,
        radius: 4.2,
        color: color.onPrimary,
        inset: 14,
    });

    const plate = drawLogoPlate(ctx, page, {
        x: metrics.pageMargin,
        top: 22,
        height: 46,
        minWidth: 150,
        padding: 14,
        // Never let a wide logo push the document title off the header.
        maxWidth: width * 0.46,
    });

    // Tagline sits under the plate, but must also stop before the title column.
    const right = width - metrics.pageMargin;
    const titleColumnWidth = Math.max(120, right - (plate.right + MASTHEAD_TITLE_GAP));
    const tagline = safeText(doc.cover.insuranceType).toUpperCase();
    const taglineWidth = trackedWidth(tagline, fonts.bold, theme.type.label, 1.5);

    drawTracked(page, {
        x: metrics.pageMargin + 2,
        top: baseline(80, theme.type.label),
        text:
            taglineWidth <= plate.width + MASTHEAD_TITLE_GAP
                ? tagline
                : truncate(tagline, fonts.bold, theme.type.label, plate.width),
        font: fonts.bold,
        size: theme.type.label,
        color: color.onPrimary,
        opacity: 0.85,
        tracking: 1.5,
    });

    drawTextRight(page, {
        x: right,
        top: baseline(28, theme.type.label),
        text: 'BILLING DOCUMENT',
        font: fonts.bold,
        size: theme.type.label,
        color: color.onPrimary,
        opacity: 0.78,
    });

    // The display title shrinks rather than sliding under the logo plate.
    const titleFit = fitMastheadTitle(safeText(doc.documentTitle).toUpperCase(), fonts.bold, {
        maxWidth: titleColumnWidth,
        preferredSize: theme.type.display,
        minSize: 20,
        maxLines: 1,
    });

    drawTextRight(page, {
        x: right,
        top: baseline(54, titleFit.size),
        text: titleFit.lines[0] || '',
        font: fonts.bold,
        size: titleFit.size,
        color: color.onPrimary,
    });

    drawStatusChip(page, ctx, {
        right,
        top: 96,
        height: 22,
        label: doc.payment.statusLabel,
        tone: doc.payment.paid ? 'success' : 'warning',
    });
}

/** Page 2 masthead: slimmer band with the same visual DNA. */
function drawCompactMasthead(ctx: Ctx, page: PDFPage, title: string): void {
    const { theme, fonts, doc } = ctx;
    const { metrics, color } = theme;
    const width = page.getSize().width;
    const bandHeight = metrics.compactHeaderHeight - 10;

    drawGradientBand(page, {
        x: 0,
        top: 0,
        width,
        height: bandHeight,
        from: color.primaryDark,
        to: color.primary,
        direction: 'horizontal',
    });

    drawAuroraWave(page, theme, bandHeight - 24, 24, width * 0.6);

    drawPerforation(page, {
        x: 0,
        top: bandHeight,
        width,
        radius: 3.6,
        color: color.onPrimary,
        inset: 14,
    });

    const plate = drawLogoPlate(ctx, page, {
        x: metrics.pageMargin,
        top: 18,
        height: 34,
        minWidth: 120,
        padding: 10,
        // Page 2's heading is long, so the plate gets a smaller share of the
        // header than on page 1.
        maxWidth: width * 0.4,
    });

    const right = width - metrics.pageMargin;

    // Everything to the right of the plate shares the remaining column, so the
    // title can never run underneath the logo (the reported overlap).
    const availableWidth = Math.max(60, right - (plate.right + MASTHEAD_TITLE_GAP));

    const metaText = `${safeText(doc.documentTitle).toUpperCase()} ${safeText(doc.invoiceNumber)}`;
    drawTextRight(page, {
        x: right,
        top: baseline(20, theme.type.label),
        text: truncate(metaText, fonts.bold, theme.type.label, availableWidth),
        font: fonts.bold,
        size: theme.type.label,
        color: color.onPrimary,
        opacity: 0.85,
    });

    const titleFit = fitMastheadTitle(title, fonts.bold, {
        maxWidth: availableWidth,
        preferredSize: theme.type.title,
        minSize: 12,
        maxLines: 2,
    });

    titleFit.lines.forEach((line, index) => {
        drawTextRight(page, {
            x: right,
            top: baseline(38 + index * titleFit.lineHeight, titleFit.size),
            text: line,
            font: fonts.bold,
            size: titleFit.size,
            color: color.onPrimary,
        });
    });
}

/* ------------------------------------------------------------------------ */
/* Page 1 — party blocks                                                     */
/* ------------------------------------------------------------------------ */

function drawParties(ctx: Ctx, page: PDFPage, startTop: number): number {
    const { theme, fonts, doc } = ctx;
    const { color, type } = theme;
    const cols = columnsFor(page, theme);

    // --- Billed to -------------------------------------------------------
    drawTracked(page, {
        x: cols.margin,
        top: baseline(startTop, type.label),
        text: 'BILLED TO',
        font: fonts.bold,
        size: type.label,
        color: color.primary,
        tracking: 1.4,
    });

    let leftTop = startTop + 16;
    drawText(page, {
        x: cols.margin,
        top: baseline(leftTop, type.heading),
        text: truncate(doc.buyer.displayName, fonts.bold, type.heading, cols.contentWidth / 2),
        font: fonts.bold,
        size: type.heading,
        color: color.ink,
    });

    leftTop += 16;
    const leftLines = [
        ...doc.buyer.addressLines.slice(0, 2),
        doc.buyer.email,
        doc.buyer.phone,
    ].filter(Boolean);

    for (const line of leftLines.slice(0, 4)) {
        drawText(page, {
            x: cols.margin,
            top: baseline(leftTop, type.small),
            text: truncate(line, fonts.regular, type.small, cols.contentWidth / 2),
            font: fonts.regular,
            size: type.small,
            color: color.body,
        });
        leftTop += LINE_HEIGHT.small;
    }

    // --- Invoice details --------------------------------------------------
    const detailWidth = 236;
    const detailX = cols.pageWidth - cols.margin - detailWidth;

    drawTracked(page, {
        x: detailX,
        top: baseline(startTop, type.label),
        text: 'INVOICE DETAILS',
        font: fonts.bold,
        size: type.label,
        color: color.muted,
        tracking: 1.4,
    });

    const rows: Array<[string, string]> = [['Invoice number', safeText(doc.invoiceNumber)]];

    if (doc.issueDateText) rows.push(['Issued on', doc.issueDateText]);
    if (doc.dueDateText) rows.push(['Payment due', doc.dueDateText]);
    if (doc.payment.methodLabel) rows.push(['Method', doc.payment.methodLabel]);
    if (doc.payment.reference) {
        rows.push(['Reference', truncate(doc.payment.reference, fonts.bold, type.small, 120)]);
    }

    let rightTop = startTop + 14;
    const rowHeight = 16;

    rows.forEach(([label, value], index) => {
        if (index > 0) {
            hairline(page, {
                x: detailX,
                top: rightTop - 4.5,
                width: detailWidth,
                color: color.hairline,
                thickness: 0.6,
            });
        }

        drawText(page, {
            x: detailX,
            top: baseline(rightTop + 2, type.micro),
            text: label,
            font: fonts.regular,
            size: type.micro,
            color: color.muted,
        });

        drawTextRight(page, {
            x: detailX + detailWidth,
            top: baseline(rightTop + 1, type.small),
            text: value,
            font: fonts.bold,
            size: type.small,
            color: color.ink,
        });

        rightTop += rowHeight;
    });

    return Math.max(leftTop, rightTop + 2);
}

/* ------------------------------------------------------------------------ */
/* Page 1 — cover summary panel                                              */
/* ------------------------------------------------------------------------ */

function drawCoverPanel(ctx: Ctx, page: PDFPage, top: number): number {
    const { theme, fonts, doc } = ctx;
    const { color, type, metrics } = theme;
    const cols = columnsFor(page, theme);
    const height = 62;

    drawCard(page, {
        x: cols.margin,
        top,
        width: cols.contentWidth,
        height,
        radius: metrics.radius,
        color: color.surface,
        borderColor: color.hairline,
        borderWidth: 0.7,
    });

    drawSparkle(page, {
        x: cols.margin + 16,
        top: top + 14,
        size: 8,
        color: color.primary,
    });

    drawTracked(page, {
        x: cols.margin + 29,
        top: baseline(top + 14, type.label),
        text: 'POLICY & VEHICLE',
        font: fonts.bold,
        size: type.label,
        color: color.ink,
        tracking: 1.3,
    });

    drawTextRight(page, {
        x: cols.pageWidth - cols.margin - 16,
        top: baseline(top + 14, type.label),
        text: `POLICY ${safeText(doc.cover.policyNumber).toUpperCase()}`,
        font: fonts.bold,
        size: type.label,
        color: color.primary,
    });

    const inner = cols.contentWidth - 32;
    const cells: Array<{ label: string; value: string; hint: string }> = [
        { label: 'VEHICLE', value: doc.cover.vehicle, hint: doc.cover.vehicleDetail },
        { label: 'REGISTRATION', value: doc.cover.registration || '-', hint: doc.cover.duration },
        {
            label: 'COVER PERIOD',
            value: doc.cover.periodStart || '-',
            hint: doc.cover.periodEnd ? `to ${doc.cover.periodEnd}` : '',
        },
        { label: 'COVER REASON', value: doc.cover.reason || '-', hint: doc.cover.licence },
    ];

    const cellWidth = inner / cells.length;

    cells.forEach((cell, index) => {
        const cellX = cols.margin + 16 + index * cellWidth;

        if (index > 0) {
            page.drawLine({
                start: { x: cellX - 10, y: fromTop(page, top + 32) },
                end: { x: cellX - 10, y: fromTop(page, top + height - 12) },
                thickness: 0.6,
                color: color.hairline,
            });
        }

        drawText(page, {
            x: cellX,
            top: baseline(top + 29, type.micro),
            text: cell.label,
            font: fonts.bold,
            size: type.micro,
            color: color.muted,
        });

        drawText(page, {
            x: cellX,
            top: baseline(top + 43, type.subheading),
            text: truncate(cell.value, fonts.bold, type.subheading, cellWidth - 16),
            font: fonts.bold,
            size: type.subheading,
            color: color.ink,
        });

        if (cell.hint) {
            drawText(page, {
                x: cellX,
                top: baseline(top + 54, type.micro),
                text: truncate(cell.hint, fonts.regular, type.micro, cellWidth - 16),
                font: fonts.regular,
                size: type.micro,
                color: color.body,
            });
        }
    });

    return top + height;
}

/* ------------------------------------------------------------------------ */
/* Page 1 — amount payable hero card                                         */
/* ------------------------------------------------------------------------ */

function drawAmountCard(ctx: Ctx, page: PDFPage, top: number): number {
    const { theme, fonts, doc } = ctx;
    const { color, type, metrics } = theme;
    const cols = columnsFor(page, theme);
    const height = 92;
    const cardBottom = top + height;

    drawCard(page, {
        x: cols.margin,
        top,
        width: cols.contentWidth,
        height,
        radius: metrics.radius,
        color: color.contrastCard,
    });

    // Soft brand glow behind the seal. Sized and positioned so it always stays
    // inside the card: a glow that bleeds past the rounded corner looks like a
    // rendering bug rather than a highlight.
    const glowX = cols.pageWidth - cols.margin - 84;
    const glowYScale = Math.min(26, height / 2 - 8);
    page.drawEllipse({
        x: glowX,
        y: fromTop(page, cardBottom - height / 2),
        xScale: 58,
        yScale: glowYScale,
        color: color.primary,
        opacity: 0.3,
    });

    // Brand wave filling the bottom strip of the card.
    drawWave(page, {
        x: cols.margin + 1,
        top: cardBottom - 22,
        width: cols.contentWidth - 2,
        height: 21,
        color: color.primary,
        opacity: 0.38,
        waves: 2.6,
        phase: 0.9,
    });

    drawTracked(page, {
        x: cols.margin + 20,
        top: baseline(top + 17, type.label),
        text: doc.totals.balanceDue > 0 ? 'AMOUNT PAYABLE' : 'TOTAL PAID',
        font: fonts.bold,
        size: type.label,
        color: color.onContrastMuted,
        tracking: 1.6,
    });

    drawText(page, {
        x: cols.margin + 20,
        top: baseline(top + 43, 27),
        text: formatMoney(doc.totals.total, doc.currency),
        font: fonts.bold,
        size: 27,
        color: color.onContrast,
    });

    const words = wrapText(doc.amountInWords, fonts.oblique, type.micro, cols.contentWidth - 200)
        .slice(0, 2);

    words.forEach((line, index) => {
        drawText(page, {
            x: cols.margin + 20,
            top: baseline(top + 69 + index * LINE_HEIGHT.micro, type.micro),
            text: line,
            font: fonts.oblique,
            size: type.micro,
            color: color.onContrastMuted,
        });
    });

    const statusLine = doc.payment.paid
        ? `Paid in full${doc.payment.dateText ? ` on ${doc.payment.dateText}` : ''}`
        : doc.dueDateText
            ? `Payment due by ${doc.dueDateText}`
            : 'Payment is required to activate cover';

    drawText(page, {
        x: cols.margin + 20,
        top: baseline(top + 69 + words.length * LINE_HEIGHT.micro, type.micro),
        text: truncate(statusLine, fonts.bold, type.micro, cols.contentWidth - 210),
        font: fonts.bold,
        size: type.micro,
        color: color.onContrast,
        opacity: 0.9,
    });

    // Seal: "PAID" stamp when settled, otherwise a "DUE" reminder.
    const sealRadius = 27;
    const sealCx = cols.pageWidth - cols.margin - 80;
    const sealTop = top + 19;

    if (doc.payment.paid && doc.totals.balanceDue <= 0) {
        drawSeal(page, {
            cx: sealCx,
            top: sealTop,
            radius: sealRadius,
            fillColor: color.success,
            fillOpacity: 0.25,
            ringColor: color.onContrast,
            ringOpacity: 0.9,
            label: 'PAID',
            labelFont: fonts.bold,
            labelSize: 14,
            labelColor: color.onContrast,
            labelOpacity: 1,
            dashedRing: true,
        });
    } else {
        drawSeal(page, {
            cx: sealCx,
            top: sealTop,
            radius: sealRadius,
            fillColor: color.onContrast,
            fillOpacity: 0.12,
            ringColor: color.onContrast,
            ringOpacity: 0.75,
            label: 'DUE',
            labelFont: fonts.bold,
            labelSize: 14,
            labelColor: color.onContrast,
            labelOpacity: 1,
            dashedRing: true,
        });
    }

    return cardBottom;
}

/* ------------------------------------------------------------------------ */
/* Page 1 — items table                                                      */
/* ------------------------------------------------------------------------ */

/**
 * Flow state shared by the table / totals renderers: which page we are on and
 * how far down it we have drawn.
 */
interface Flow {
    ctx: Ctx;
    pdf: PDFDocument;
    /** Every page used by the invoice (page 1 plus any continuation pages). */
    pages: PDFPage[];
    page: PDFPage;
    cursor: number;
    /** Right-hand masthead text used by continuation pages. */
    summaryTitle: string;
}

/** Last y content may occupy before the footer zone begins. */
function contentBottom(ctx: Ctx, page: PDFPage): number {
    return page.getSize().height - ctx.theme.metrics.footerHeight - 12;
}

/** Start a new invoice page with the compact masthead and a "(continued)" tag. */
function startContinuationPage(flow: Flow): void {
    const page = flow.pdf.addPage();
    drawCompactMasthead(flow.ctx, page, flow.summaryTitle);
    flow.pages.push(page);
    flow.page = page;
    flow.cursor = flow.ctx.theme.metrics.compactHeaderHeight + 34;

    // "Continued" marker keeps multi-page documents unambiguous.
    const { theme, fonts } = flow.ctx;
    drawTextRight(flow.page, {
        x: page.getSize().width - theme.metrics.pageMargin,
        top: baseline(flow.cursor - 16, theme.type.label),
        text: 'CONTINUED',
        font: fonts.bold,
        size: theme.type.label,
        color: theme.color.muted,
    });
}

/* ------------------------------------------------------------------------ */
/* Page 1+ — items table                                                     */
/* ------------------------------------------------------------------------ */

interface RowLayout {
    descriptionLines: string[];
    detailLines: string[];
    height: number;
}

/** Everything the table needs to know about a row before it is drawn. */
function layoutRow(ctx: Ctx, page: PDFPage, item: InvoiceLineItem): RowLayout {
    const { theme, fonts } = ctx;
    const { type } = theme;
    const cols = columnsFor(page, theme);

    const descriptionLines = wrapText(item.description, fonts.bold, type.body, cols.descWidth);
    const detailLines = item.details
        .flatMap((detail) => wrapText(detail, fonts.regular, type.micro, cols.descWidth))
        .slice(0, DETAIL_LINES_MAX);

    const descriptionHeight = descriptionLines.length * LINE_HEIGHT.body;
    const detailHeight = detailLines.length * LINE_HEIGHT.micro;

    return {
        descriptionLines,
        detailLines,
        height: Math.max(26, descriptionHeight + detailHeight + 14),
    };
}

function drawRow(
    ctx: Ctx,
    page: PDFPage,
    options: { top: number; item: InvoiceLineItem; layout: RowLayout; shaded?: boolean }
): number {
    const { theme, fonts } = ctx;
    const { color, type } = theme;
    const cols = columnsFor(page, theme);
    const { top, item, layout, shaded } = options;

    if (shaded) {
        drawCard(page, {
            x: cols.margin - 6,
            top: top - 3,
            width: cols.contentWidth + 12,
            height: layout.height,
            radius: theme.metrics.radiusSmall,
            color: color.primarySoft,
        });
    }

    const firstBaselineTop = top + 5;
    let cursor = firstBaselineTop;

    layout.descriptionLines.forEach((line) => {
        drawText(page, {
            x: cols.descX,
            top: baseline(cursor, type.body),
            text: line,
            font: fonts.bold,
            size: type.body,
            color: item.kind === 'discount' ? color.primary : color.ink,
        });
        cursor += LINE_HEIGHT.body;
    });

    layout.detailLines.forEach((line) => {
        drawText(page, {
            x: cols.descX,
            top: baseline(cursor, type.micro),
            text: line,
            font: fonts.regular,
            size: type.micro,
            color: color.muted,
        });
        cursor += LINE_HEIGHT.micro;
    });

    drawTextCenter(page, {
        x: cols.qtyCenter - 20,
        width: 40,
        top: baseline(firstBaselineTop, type.small),
        text: String(item.quantity),
        font: fonts.regular,
        size: type.small,
        color: color.body,
    });

    drawTextRight(page, {
        x: cols.unitRight,
        top: baseline(firstBaselineTop, type.small),
        text: formatMoney(item.unitPrice, ctx.doc.currency),
        font: fonts.regular,
        size: type.small,
        color: color.body,
    });

    drawTextRight(page, {
        x: cols.amountRight,
        top: baseline(firstBaselineTop, type.body),
        text: formatMoney(item.amount, ctx.doc.currency),
        font: fonts.bold,
        size: type.body,
        color: item.kind === 'discount' ? color.primary : color.ink,
    });

    return top + layout.height;
}

/** Column header row; redrawn on every page the table continues onto. */
function drawTableHeader(ctx: Ctx, page: PDFPage, top: number, continued: boolean): number {
    const { theme, fonts } = ctx;
    const { color, type } = theme;
    const cols = columnsFor(page, theme);

    drawTracked(page, {
        x: cols.margin,
        top: baseline(top, type.label),
        text: continued ? 'CHARGES (CONTINUED)' : 'CHARGES',
        font: fonts.bold,
        size: type.label,
        color: color.muted,
        tracking: 1.4,
    });

    const ruleTop = top + 12;
    hairline(page, {
        x: cols.margin,
        top: ruleTop,
        width: cols.contentWidth,
        color: color.primary,
        thickness: 1.4,
    });

    const headerTop = ruleTop + 9;

    drawText(page, {
        x: cols.descX,
        top: baseline(headerTop, type.label),
        text: 'DESCRIPTION',
        font: fonts.bold,
        size: type.label,
        color: color.ink,
    });

    drawTextCenter(page, {
        x: cols.qtyCenter - 20,
        width: 40,
        top: baseline(headerTop, type.label),
        text: 'QTY',
        font: fonts.bold,
        size: type.label,
        color: color.ink,
    });

    drawTextRight(page, {
        x: cols.unitRight,
        top: baseline(headerTop, type.label),
        text: 'UNIT PRICE',
        font: fonts.bold,
        size: type.label,
        color: color.ink,
    });

    drawTextRight(page, {
        x: cols.amountRight,
        top: baseline(headerTop, type.label),
        text: 'AMOUNT',
        font: fonts.bold,
        size: type.label,
        color: color.ink,
    });

    const headerBottom = headerTop + 8;
    hairline(page, {
        x: cols.margin,
        top: headerBottom,
        width: cols.contentWidth,
        color: color.hairline,
        thickness: 0.8,
    });

    return headerBottom + 7;
}

/**
 * Draw the charges table, continuing on new pages when it runs out of room.
 *
 * Reserves enough space at the bottom of the last page for the totals block,
 * so the totals are never orphaned on their own page unless the table itself
 * already fills a page.
 */
function drawChargesTable(flow: Flow): void {
    const { ctx } = flow;
    const { theme, doc } = ctx;
    const reserve = TABLE_TO_TOTALS_GAP + totalsHeight(ctx) + 8;

    flow.cursor = drawTableHeader(ctx, flow.page, flow.cursor, false);

    let shown = 0;
    let rowsOnPage = 0;

    for (const item of doc.items) {
        const layout = layoutRow(ctx, flow.page, item);

        const isLast = shown === doc.items.length - 1;
        const bottom = contentBottom(ctx, flow.page);
        const needed = layout.height + (isLast ? reserve : 8);

        if (flow.cursor + needed > bottom && rowsOnPage > 0) {
            startContinuationPage(flow);
            flow.cursor = drawTableHeader(ctx, flow.page, flow.cursor, true);
            rowsOnPage = 0;
        }

        if (rowsOnPage > 0) {
            const cols = columnsFor(flow.page, theme);
            hairline(flow.page, {
                x: cols.margin,
                top: flow.cursor,
                width: cols.contentWidth,
                color: theme.color.hairline,
                thickness: 0.6,
            });
            flow.cursor += 7;
        }

        flow.cursor = drawRow(ctx, flow.page, {
            top: flow.cursor,
            item,
            layout,
            shaded: item.kind === 'discount',
        });

        shown += 1;
        rowsOnPage += 1;
    }

    flow.cursor += TABLE_TO_TOTALS_GAP;
}

/* Totals block metrics — defined once so the page-break calculation and the
   renderer can never drift apart. */
const TOTALS_ROW_HEIGHT = 16;
const TOTALS_PILL_HEIGHT = 32;
const TABLE_TO_TOTALS_GAP = 10;

/** Exact height of the totals block for the current document. */
function totalsHeight(ctx: Ctx): number {
    const { doc } = ctx;
    const rows =
        1 +
        (doc.totals.discount > 0 ? 1 : 0) +
        (doc.totals.taxAmount > 0 ? 1 : 0);

    return (
        rows * TOTALS_ROW_HEIGHT +
        2 +
        TOTALS_PILL_HEIGHT +
        10 +
        (doc.totals.amountPaid > 0 ? TOTALS_ROW_HEIGHT : 0) +
        10
    );
}

function drawTotalsBlock(ctx: Ctx, page: PDFPage, top: number): number {
    const { theme, fonts, doc } = ctx;
    const { color, type, metrics } = theme;
    const cols = columnsFor(page, theme);

    const blockWidth = 236;
    const blockX = cols.pageWidth - cols.margin - blockWidth;

    let rowTop = top;
    const total = doc.totals;

    const rows: Array<{ label: string; value: string; tone?: 'primary' | 'ink' | 'muted' }> = [
        { label: 'Subtotal', value: formatMoney(total.subtotal, doc.currency) },
    ];

    if (total.discount > 0) {
        rows.push({
            label: truncate(total.discountLabel, fonts.regular, type.small, 150),
            value: `-${formatMoney(total.discount, doc.currency)}`,
            tone: 'primary',
        });
    }

    if (total.taxAmount > 0) {
        rows.push({
            label: `${total.taxLabel}${total.taxRate > 0 ? ` (${total.taxRate}%)` : ''}${total.taxInclusive ? ' incl.' : ''}`,
            value: formatMoney(total.taxAmount, doc.currency),
        });
    }

    rows.forEach((row) => {
        drawText(page, {
            x: blockX,
            top: baseline(rowTop, type.small),
            text: row.label,
            font: fonts.regular,
            size: type.small,
            color: color.body,
        });

        drawTextRight(page, {
            x: blockX + blockWidth,
            top: baseline(rowTop, type.small),
            text: row.value,
            font: fonts.bold,
            size: type.small,
            color: row.tone === 'primary' ? color.primary : color.ink,
        });

        rowTop += TOTALS_ROW_HEIGHT;
    });

    rowTop += 2;

    // Grand total: dark pill echoing the hero card.
    drawCard(page, {
        x: blockX - 12,
        top: rowTop,
        width: blockWidth + 12,
        height: TOTALS_PILL_HEIGHT,
        radius: metrics.radiusSmall,
        color: color.contrastCard,
    });

    drawTracked(page, {
        x: blockX + 2,
        top: baseline(rowTop + (TOTALS_PILL_HEIGHT - type.label) / 2 - 1, type.label),
        text: 'TOTAL',
        font: fonts.bold,
        size: type.label,
        color: color.onContrastMuted,
        tracking: 1.6,
    });

    drawTextRight(page, {
        x: blockX + blockWidth - 2,
        top: baseline(rowTop + (TOTALS_PILL_HEIGHT - 14) / 2 - 1, 14),
        text: formatMoney(total.total, doc.currency),
        font: fonts.bold,
        size: 14,
        color: color.onContrast,
    });

    rowTop += TOTALS_PILL_HEIGHT + 10;

    if (total.amountPaid > 0) {
        drawText(page, {
            x: blockX,
            top: baseline(rowTop, type.small),
            text: 'Amount paid',
            font: fonts.regular,
            size: type.small,
            color: color.body,
        });

        drawTextRight(page, {
            x: blockX + blockWidth,
            top: baseline(rowTop, type.small),
            text: `-${formatMoney(total.amountPaid, doc.currency)}`,
            font: fonts.bold,
            size: type.small,
            color: color.success,
        });

        rowTop += TOTALS_ROW_HEIGHT;
    }

    drawText(page, {
        x: blockX,
        top: baseline(rowTop, type.subheading),
        text: 'Balance due',
        font: fonts.bold,
        size: type.subheading,
        color: color.ink,
    });

    drawTextRight(page, {
        x: blockX + blockWidth,
        top: baseline(rowTop, type.subheading),
        text: formatMoney(total.balanceDue, doc.currency),
        font: fonts.bold,
        size: type.subheading,
        color: total.balanceDue > 0 ? color.warning : color.success,
    });

    return rowTop + 10;
}

/**
 * Totals block. Moved to a fresh page when it would collide with the footer.
 */
function drawTotalsSection(flow: Flow): void {
    const { ctx } = flow;
    const { theme } = ctx;
    const height = totalsHeight(ctx);

    if (flow.cursor + height > contentBottom(ctx, flow.page)) {
        startContinuationPage(flow);
        flow.cursor = theme.metrics.compactHeaderHeight + 30;
    }

    const afterTotals = drawTotalsBlock(ctx, flow.page, flow.cursor);
    flow.cursor = afterTotals;

    drawClosingNote(ctx, flow.page, afterTotals + 12);
}

/** Small closing line above the footer (skipped when there is no room). */
function drawClosingNote(ctx: Ctx, page: PDFPage, top: number): void {
    const { theme, fonts, doc } = ctx;
    const { color, type } = theme;
    const cols = columnsFor(page, theme);
    const limit = page.getSize().height - theme.metrics.footerHeight - 34;

    if (top > limit) return;

    hairline(page, {
        x: cols.margin,
        top,
        width: cols.contentWidth,
        color: color.hairline,
        thickness: 0.7,
    });

    drawTextCenter(page, {
        x: cols.margin,
        width: cols.contentWidth,
        top: baseline(top + 12, type.small),
        text: doc.notes.thankYou,
        font: fonts.bold,
        size: type.small,
        color: color.ink,
    });

    drawTextCenter(page, {
        x: cols.margin,
        width: cols.contentWidth,
        top: baseline(top + 25, type.micro),
        text: 'Keep this invoice with your policy documents. It was issued electronically.',
        font: fonts.regular,
        size: type.micro,
        color: color.muted,
    });
}

/* ------------------------------------------------------------------------ */
/* Page 2 — recap, payment summary                                           */
/* ------------------------------------------------------------------------ */

function sectionHeading(ctx: Ctx, page: PDFPage, top: number, title: string): number {
    const { theme, fonts } = ctx;
    const { color, type } = theme;

    drawBullet(page, {
        x: theme.metrics.pageMargin + 3.6,
        top: top + 4,
        radius: 3,
        color: color.primary,
    });

    drawText(page, {
        x: theme.metrics.pageMargin + 16,
        top: baseline(top, type.heading),
        text: title,
        font: fonts.bold,
        size: type.heading,
        color: color.ink,
    });

    return top + 23;
}

function drawRecapCard(ctx: Ctx, page: PDFPage, top: number): number {
    const { theme, fonts, doc } = ctx;
    const { color, type, metrics } = theme;
    const cols = columnsFor(page, theme);
    const height = 64;

    drawCard(page, {
        x: cols.margin,
        top,
        width: cols.contentWidth,
        height,
        radius: metrics.radius,
        color: color.surface,
        borderColor: color.hairline,
        borderWidth: 0.7,
    });

    const period = doc.cover.periodEnd
        ? `${doc.cover.periodStart || '-'} to ${doc.cover.periodEnd}`
        : doc.cover.periodStart || '-';

    const cells = [
        { label: 'INVOICE', value: doc.invoiceNumber },
        { label: 'VEHICLE', value: doc.cover.vehicle },
        { label: 'REGISTRATION', value: doc.cover.registration || '-' },
        { label: 'COVER PERIOD', value: period, small: true },
    ];

    const inner = cols.contentWidth - 32;
    const cellWidth = inner / cells.length;

    cells.forEach((cell, index) => {
        const cellX = cols.margin + 16 + index * cellWidth;

        if (index > 0) {
            page.drawLine({
                start: { x: cellX - 10, y: fromTop(page, top + 16) },
                end: { x: cellX - 10, y: fromTop(page, top + height - 14) },
                thickness: 0.6,
                color: color.hairline,
            });
        }

        drawText(page, {
            x: cellX,
            top: baseline(top + 17, type.micro),
            text: cell.label,
            font: fonts.bold,
            size: type.micro,
            color: color.muted,
        });

        // Periods are long: wrap to two lines at a slightly smaller size.
        const valueSize = cell.small ? type.small : type.subheading;
        const valueLines = wrapText(cell.value, fonts.bold, valueSize, cellWidth - 16).slice(0, 2);

        valueLines.forEach((line, lineIndex) => {
            drawText(page, {
                x: cellX,
                top: baseline(top + 35 + lineIndex * LINE_HEIGHT.small, valueSize),
                text: line,
                font: fonts.bold,
                size: valueSize,
                color: color.ink,
            });
        });
    });

    return top + height;
}

function drawPaymentSummary(ctx: Ctx, page: PDFPage, top: number): number {
    const { theme, fonts, doc } = ctx;
    const { color, type, metrics } = theme;
    const cols = columnsFor(page, theme);

    let cursor = sectionHeading(ctx, page, top, 'Payment summary');

    const rows: Array<[string, string]> = [['Status', doc.payment.statusLabel]];
    if (doc.payment.methodLabel) rows.push(['Method', doc.payment.methodLabel]);
    if (doc.payment.paid && doc.payment.dateText) rows.push(['Paid on', doc.payment.dateText]);
    if (doc.payment.reference) rows.push(['Reference', doc.payment.reference]);
    if (doc.buyer.reference) rows.push(['Account', doc.buyer.reference]);
    rows.push(['Amount', formatMoney(doc.totals.total, doc.currency)]);
    if (doc.totals.balanceDue !== doc.totals.total) {
        rows.push(['Balance due', formatMoney(doc.totals.balanceDue, doc.currency)]);
    }

    const detailWidth = cols.contentWidth * 0.52 - 20;
    const termsWidth = cols.contentWidth * 0.48 - 20;
    const termLines = doc.terms
        ? wrapText(doc.terms, fonts.regular, type.micro, termsWidth).slice(0, 8)
        : [];

    const rowsHeight = rows.length * 13.8;
    const termsHeight = termLines.length ? termLines.length * LINE_HEIGHT.micro + 12 : 0;
    const height = Math.max(rowsHeight, termsHeight, 60) + 34;

    drawCard(page, {
        x: cols.margin,
        top: cursor,
        width: cols.contentWidth,
        height,
        radius: metrics.radius,
        color: color.onPrimary,
        borderColor: color.hairline,
        borderWidth: 0.8,
    });

    // Left: payment details.
    let rowTop = cursor + 20;
    rows.forEach(([label, value]) => {
        drawText(page, {
            x: cols.margin + 18,
            top: baseline(rowTop, type.micro),
            text: label,
            font: fonts.regular,
            size: type.micro,
            color: color.muted,
        });

        drawTextRight(page, {
            x: cols.margin + 18 + detailWidth,
            top: baseline(rowTop, type.small),
            text: truncate(value, fonts.bold, type.small, detailWidth),
            font: fonts.bold,
            size: type.small,
            color: label === 'Balance due' ? color.warning : color.ink,
        });

        rowTop += 13.8;
    });

    // Divider between the two halves.
    const dividerX = cols.margin + cols.contentWidth * 0.52;
    page.drawLine({
        start: { x: dividerX, y: fromTop(page, cursor + 16) },
        end: { x: dividerX, y: fromTop(page, cursor + height - 16) },
        thickness: 0.6,
        color: color.hairline,
    });

    // Right: terms & conditions.
    drawTracked(page, {
        x: dividerX + 18,
        top: baseline(cursor + 20, type.label),
        text: 'TERMS & REFUNDS',
        font: fonts.bold,
        size: type.label,
        color: color.primary,
        tracking: 1.3,
    });

    let lineTop = cursor + 36;
    termLines.forEach((line) => {
        drawText(page, {
            x: dividerX + 18,
            top: baseline(lineTop, type.micro),
            text: line,
            font: fonts.regular,
            size: type.micro,
            color: color.body,
        });
        lineTop += LINE_HEIGHT.micro;
    });

    return cursor + height;
}

/* ------------------------------------------------------------------------ */
/* Page 2 — delivery steps                                                   */
/* ------------------------------------------------------------------------ */

function drawAccessSteps(ctx: Ctx, page: PDFPage, top: number): number {
    const { theme, fonts, doc } = ctx;
    const { color, type, metrics } = theme;
    const cols = columnsFor(page, theme);

    let cursor = sectionHeading(ctx, page, top, 'How to access your documents');

    const gap = 16;
    const cardWidth = (cols.contentWidth - gap) / 2;
    const steps = doc.notes.accessSteps.slice(0, 2);

    const bodyLines = steps.map((step) =>
        wrapText(step.body, fonts.regular, type.micro, cardWidth - 32)
    );
    const cardHeight = 66 + Math.max(...bodyLines.map((lines) => lines.length)) * LINE_HEIGHT.micro;

    steps.forEach((step, index) => {
        const cardX = cols.margin + index * (cardWidth + gap);

        drawCard(page, {
            x: cardX,
            top: cursor,
            width: cardWidth,
            height: cardHeight,
            radius: metrics.radius,
            color: color.onPrimary,
            borderColor: color.hairline,
            borderWidth: 0.8,
        });

        page.drawSvgPath(circlePath(11), {
            x: cardX + 23,
            y: fromTop(page, cursor + 25),
            color: color.primarySoft,
        });

        const number = String(index + 1);
        const numberWidth = fonts.bold.widthOfTextAtSize(number, type.subheading);
        drawText(page, {
            x: cardX + 23 - numberWidth / 2,
            top: baseline(cursor + 25 - type.subheading * 0.34, type.subheading),
            text: number,
            font: fonts.bold,
            size: type.subheading,
            color: color.primary,
        });

        drawText(page, {
            x: cardX + 42,
            top: baseline(cursor + 21, type.subheading),
            text: step.title,
            font: fonts.bold,
            size: type.subheading,
            color: color.ink,
        });

        let lineTop = cursor + 40;
        bodyLines[index].forEach((line) => {
            drawText(page, {
                x: cardX + 16,
                top: baseline(lineTop, type.micro),
                text: line,
                font: fonts.regular,
                size: type.micro,
                color: color.body,
            });
            lineTop += LINE_HEIGHT.micro;
        });
    });

    cursor += cardHeight;
    return cursor;
}

/* ------------------------------------------------------------------------ */
/* Page 2 — inclusions + important information grid                          */
/* ------------------------------------------------------------------------ */

function drawSectionsGrid(ctx: Ctx, page: PDFPage, top: number): number {
    const { theme, fonts, doc } = ctx;
    const { color, type, metrics } = theme;
    const cols = columnsFor(page, theme);

    const gap = 16;
    const columnWidth = (cols.contentWidth - gap) / 2;

    // --- two headings sharing one baseline -------------------------------
    const rightX = cols.margin + columnWidth + gap;

    for (const [headingX, heading] of [
        [cols.margin, "What's included"],
        [rightX, 'Important information'],
    ] as Array<[number, string]>) {
        drawBullet(page, {
            x: headingX + 3.6,
            top: top + 4,
            radius: 3,
            color: color.primary,
        });

        drawText(page, {
            x: headingX + 16,
            top: baseline(top, type.heading),
            text: heading,
            font: fonts.bold,
            size: type.heading,
            color: color.ink,
        });
    }

    const cursor = top + 23;

    // --- left card: what's included --------------------------------------
    const included = doc.notes.included.slice(0, 4);
    const itemWidth = columnWidth - 44;
    const includedLines = included.map((item) =>
        wrapText(item, fonts.regular, type.small, itemWidth).slice(0, 2)
    );
    const includedRowHeight = Math.max(...includedLines.map((lines) => lines.length)) * 12 + 8;

    // --- right card: important bullets -----------------------------------
    const important = doc.notes.important.slice(0, 5);
    const bulletLines = important.map((bullet) =>
        wrapText(bullet, fonts.regular, type.micro, columnWidth - 35)
    );
    const bulletHeight =
        bulletLines.reduce((sum, lines) => sum + lines.length * LINE_HEIGHT.micro + 5, 0) + 22;

    const includedHeight = includedRowHeight * included.length + 22;
    const cardHeight = Math.max(includedHeight, bulletHeight);

    drawCard(page, {
        x: cols.margin,
        top: cursor,
        width: columnWidth,
        height: cardHeight,
        radius: metrics.radius,
        color: color.primarySoft,
    });

    let checkTop = cursor + 22;

    includedLines.forEach((lines, index) => {
        const itemTop = checkTop + 5.5;
        const itemX = cols.margin + 18;

        page.drawSvgPath(circlePath(6.6), {
            x: itemX + 6.6,
            y: fromTop(page, itemTop),
            color: color.primary,
        });

        const checkSize = 7.6;
        page.drawSvgPath(checkPath(checkSize), {
            x: itemX + 6.6 - checkSize / 2,
            y: fromTop(page, itemTop + 0.4) + checkSize * 0.3,
            borderColor: color.onPrimary,
            borderWidth: 1.3,
        });

        lines.forEach((line, lineIndex) => {
            drawText(page, {
                x: itemX + 20,
                top: baseline(cursor + 22 + index * includedRowHeight + lineIndex * 12, type.small),
                text: line,
                font: fonts.regular,
                size: type.small,
                color: color.ink,
            });
        });

        checkTop += includedRowHeight;
    });

    drawCard(page, {
        x: rightX,
        top: cursor,
        width: columnWidth,
        height: cardHeight,
        radius: metrics.radius,
        color: color.surface,
        borderColor: color.hairline,
        borderWidth: 0.7,
    });

    let bulletTop = cursor + 18;
    bulletLines.forEach((lines, index) => {
        drawBullet(page, {
            x: rightX + 18,
            top: bulletTop + 3.4,
            radius: 1.9,
            color: color.primary,
        });

        lines.forEach((line) => {
            drawText(page, {
                x: rightX + 28,
                top: baseline(bulletTop, type.micro),
                text: line,
                font: fonts.regular,
                size: type.micro,
                color: color.body,
            });
            bulletTop += LINE_HEIGHT.micro;
        });

        if (index < bulletLines.length - 1) bulletTop += 5;
    });

    return cursor + cardHeight;
}

/* ------------------------------------------------------------------------ */
/* Page 2 — help card                                                        */
/* ------------------------------------------------------------------------ */

function drawHelpCard(ctx: Ctx, page: PDFPage, top: number): void {
    const { theme, fonts, doc } = ctx;
    const { color, type, metrics } = theme;
    const cols = columnsFor(page, theme);
    const height = 74;
    const limit = page.getSize().height - metrics.footerHeight - 12;

    if (top + height > limit) return;

    drawCard(page, {
        x: cols.margin,
        top,
        width: cols.contentWidth,
        height,
        radius: metrics.radius,
        color: color.contrastCard,
    });

    drawWave(page, {
        x: cols.margin + 1,
        top: top + height - 22,
        width: cols.contentWidth - 2,
        height: 21,
        color: color.primary,
        opacity: 0.45,
        waves: 2.4,
        phase: 1.6,
    });

    drawTracked(page, {
        x: cols.margin + 20,
        top: baseline(top + 18, type.label),
        text: 'NEED HELP?',
        font: fonts.bold,
        size: type.label,
        color: color.onContrastMuted,
        tracking: 1.5,
    });

    drawText(page, {
        x: cols.margin + 20,
        top: baseline(top + 36, type.small),
        text: 'Our support team can re-issue documents, correct details and answer cover questions.',
        font: fonts.regular,
        size: type.small,
        color: color.onContrast,
    });

    const contactParts = [
        doc.seller.email ? `Email ${doc.seller.email}` : '',
        doc.seller.phone ? `Phone ${doc.seller.phone}` : '',
        doc.seller.website ? `Web ${doc.seller.website}` : '',
    ].filter(Boolean);

    drawText(page, {
        x: cols.margin + 20,
        top: baseline(top + 52, type.small),
        text: truncate(
            contactParts.join('   -   ') || 'Contact us through the contact page on our website.',
            fonts.bold,
            type.small,
            cols.contentWidth - 40
        ),
        font: fonts.bold,
        size: type.small,
        color: color.onContrast,
    });

    const legal = [
        doc.seller.name,
        doc.seller.registration ? `Reg. ${doc.seller.registration}` : '',
        doc.seller.vatNumber ? `Tax/VAT ${doc.seller.vatNumber}` : '',
    ].filter(Boolean);

    drawText(page, {
        x: cols.margin + 20,
        top: baseline(top + 63, type.micro),
        text: truncate(legal.join('  ·  '), fonts.regular, type.micro, cols.contentWidth - 40),
        font: fonts.regular,
        size: type.micro,
        color: color.onContrastMuted,
    });
}

/* ------------------------------------------------------------------------ */
/* Footer                                                                    */
/* ------------------------------------------------------------------------ */

function drawPageFooter(ctx: Ctx, page: PDFPage, pageNumber: number): void {
    const { theme, fonts, doc } = ctx;
    const { color, type, metrics } = theme;
    const cols = columnsFor(page, theme);
    const pageHeight = page.getSize().height;
    const footerTop = pageHeight - metrics.footerHeight;
    const baselineTop = footerTop + 18;

    hairline(page, {
        x: cols.margin,
        top: footerTop,
        width: cols.contentWidth,
        color: color.hairline,
        thickness: 0.7,
    });

    const leftParts = [
        doc.seller.name,
        doc.seller.registration ? `Reg. ${doc.seller.registration}` : '',
        doc.seller.email,
        doc.seller.website,
    ].filter(Boolean);

    drawText(page, {
        x: cols.margin,
        top: baseline(baselineTop, type.micro),
        text: truncate(leftParts.join('  ·  '), fonts.regular, type.micro, cols.contentWidth - 120),
        font: fonts.regular,
        size: type.micro,
        color: color.muted,
    });

    drawTextRight(page, {
        x: cols.pageWidth - cols.margin,
        top: baseline(baselineTop, type.micro),
        text: `Page ${pageNumber} of ${ctx.totalPages}`,
        font: fonts.bold,
        size: type.micro,
        color: color.muted,
    });

    drawText(page, {
        x: cols.margin,
        top: baseline(baselineTop + 12, type.micro),
        text: truncate(doc.footerNote, fonts.regular, type.micro, cols.contentWidth - 150),
        font: fonts.regular,
        size: type.micro,
        color: color.faint,
    });

    drawTextRight(page, {
        x: cols.pageWidth - cols.margin,
        top: baseline(baselineTop + 12, type.micro),
        text: `Generated ${doc.generatedText}`,
        font: fonts.regular,
        size: type.micro,
        color: color.faint,
    });

    // Small brand flourish above the footer rule.
    drawSparkle(page, {
        x: cols.pageWidth - cols.margin - 8,
        top: footerTop - 16,
        size: 6,
        color: color.primary,
        opacity: 0.7,
    });
}

export type { InvoiceLogo };
