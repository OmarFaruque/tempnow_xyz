/**
 * Low-level PDF drawing primitives that give the invoice its "designed"
 * feel — rounded cards, gradient bands, ticket perforations, seals and
 * vector glyphs — all built on pdf-lib's `drawSvgPath` / `drawRectangle`.
 *
 * Geometry convention: everything public in this module takes *top based*
 * coordinates (`top` measured downwards from the top of the page), because
 * that is how the template code reads top-to-bottom like a web page.
 */

import type { PDFFont, PDFPage } from 'pdf-lib';
import type { InvoicePalette } from './theme';

type PdfColor = ReturnType<typeof import('pdf-lib')['rgb']>;

export const PT_PER_MM = 2.83465;

export function mm(value: number): number {
    return value * PT_PER_MM;
}

/** Convert a top-based coordinate into pdf-lib's bottom-based y axis. */
export function fromTop(page: PDFPage, top: number): number {
    return page.getSize().height - top;
}

/* ------------------------------------------------------------------------ */
/* Paths                                                                     */
/* ------------------------------------------------------------------------ */

/** Rounded rectangle as an SVG path (pdf-lib converts it to PDF operators). */
export function roundedRectPath(width: number, height: number, radius: number): string {
    const r = Math.max(0, Math.min(radius, width / 2, height / 2));
    return [
        `M 0 ${r}`,
        `A ${r} ${r} 0 0 1 ${r} 0`,
        `L ${width - r} 0`,
        `A ${r} ${r} 0 0 1 ${width} ${r}`,
        `L ${width} ${height - r}`,
        `A ${r} ${r} 0 0 1 ${width - r} ${height}`,
        `L ${r} ${height}`,
        `A ${r} ${r} 0 0 1 0 ${height - r}`,
        'Z',
    ].join(' ');
}

/** Circle as an SVG path, used for ring-style seals. */
export function circlePath(radius: number): string {
    const k = 0.5522847498;
    const r = radius;
    return [
        `M ${-r} 0`,
        `C ${-r} ${-k * r} ${-k * r} ${-r} 0 ${-r}`,
        `C ${k * r} ${-r} ${r} ${-k * r} ${r} 0`,
        `C ${r} ${k * r} ${k * r} ${r} 0 ${r}`,
        `C ${-k * r} ${r} ${-r} ${k * r} ${-r} 0`,
        'Z',
    ].join(' ');
}

/** A single scallop used for the ticket-style perforation edge. */
export function scallopPath(radius: number): string {
    return `M ${-radius} 0 A ${radius} ${radius} 0 0 0 ${radius} 0 Z`;
}

/**
 * Decorative wave band.
 *
 * Note on coordinates: pdf-lib draws SVG paths with the y axis flipped, so the
 * shape produced by `wavePath()` occupies `[origin.y - height, origin.y]`.
 * Always position waves through `drawWave()` (below) rather than calling
 * `page.drawSvgPath()` directly, which is easy to get wrong.
 */
export function wavePath(width: number, height: number, waves: number, phase = 0): string {
    const step = width / 60;
    const points: Array<[number, number]> = [];

    for (let x = 0; x <= width + 0.001; x += step) {
        const t = (x / width) * Math.PI * 2 * waves + phase;
        const y = height * (0.5 + 0.5 * Math.sin(t));
        points.push([x, y]);
    }

    const line = points
        .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${(height - y).toFixed(2)}`)
        .join(' ');

    return `${line} L ${width} ${height} L 0 ${height} Z`;
}

/** Check mark glyph (scaled to a `size` box, origin at its centre-left). */
export function checkPath(size: number): string {
    const s = size;
    return `M ${0.06 * s} ${0.52 * s} L ${0.4 * s} ${0.86 * s} L ${0.98 * s} ${0.1 * s}`;
}

/** Small "sparkle"/star used as a brand flourish. */
export function sparklePath(size: number): string {
    const s = size;
    return [
        `M ${s * 0.5} 0`,
        `Q ${s * 0.58} ${s * 0.42} ${s} ${s * 0.5}`,
        `Q ${s * 0.58} ${s * 0.58} ${s * 0.5} ${s}`,
        `Q ${s * 0.42} ${s * 0.58} 0 ${s * 0.5}`,
        `Q ${s * 0.42} ${s * 0.42} ${s * 0.5} 0`,
        'Z',
    ].join(' ');
}

/* ------------------------------------------------------------------------ */
/* Fills & bands                                                             */
/* ------------------------------------------------------------------------ */

export interface TopRectOptions {
    x: number;
    top: number;
    width: number;
    height: number;
    color?: PdfColor;
    opacity?: number;
}

export function fillRectTop(page: PDFPage, options: TopRectOptions): void {
    const { x, top, width, height, color, opacity } = options;
    page.drawRectangle({
        x,
        y: fromTop(page, top + height),
        width,
        height,
        color,
        opacity,
    });
}

export interface TopCardOptions extends TopRectOptions {
    radius?: number;
    borderColor?: PdfColor;
    borderWidth?: number;
}

/**
 * Rounded card. `top` is the top edge; the shape grows downwards.
 *
 * pdf-lib runs `fillAndStroke()` whenever `borderWidth` is set — even without
 * a `borderColor` — and strokes with whatever colour is currently active
 * (black), which silently drew outlines on every borderless card. The border
 * width is therefore only passed when a border colour is given.
 */
export function drawCard(page: PDFPage, options: TopCardOptions): void {
    const { x, top, width, height, color, radius = 12, borderColor, borderWidth = 0.8, opacity } = options;

    page.drawSvgPath(roundedRectPath(width, height, radius), {
        x,
        y: fromTop(page, top),
        color,
        borderColor,
        borderWidth: borderColor ? borderWidth : undefined,
        opacity,
        borderOpacity: opacity,
    });
}

/**
 * Vertical (or horizontal) gradient fill, approximated with thin slices —
 * the standard trick for gradients across every PDF viewer.
 */
export function drawGradientBand(
    page: PDFPage,
    options: {
        x: number;
        top: number;
        width: number;
        height: number;
        from: PdfColor;
        to: PdfColor;
        direction?: 'vertical' | 'horizontal';
        slices?: number;
        opacity?: number;
    }
): void {
    const {
        x,
        top,
        width,
        height,
        from,
        to,
        direction = 'horizontal',
        slices = 160,
        opacity,
    } = options;

    const count = Math.max(2, Math.min(slices, Math.ceil((direction === 'horizontal' ? width : height) / 1)));
    const step = (direction === 'horizontal' ? width : height) / count;

    for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        const color = mixColor(from, to, t);
        const offset = i * step;

        if (direction === 'horizontal') {
            fillRectTop(page, { x: x + offset, top, width: step + 0.6, height, color, opacity });
        } else {
            fillRectTop(page, { x, top: top + offset, width, height: step + 0.6, color, opacity });
        }
    }
}

/** Linear interpolation between two `rgb()` colours. */
export function mixColor(from: PdfColor, to: PdfColor, t: number): PdfColor {
    const a = from as unknown as { red: number; green: number; blue: number };
    const b = to as unknown as { red: number; green: number; blue: number };
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    return {
        type: 'RGB' as const,
        red: clamp(a.red + (b.red - a.red) * t),
        green: clamp(a.green + (b.green - a.green) * t),
        blue: clamp(a.blue + (b.blue - a.blue) * t),
    } as unknown as PdfColor;
}

/** Hairline rule drawn from a top-based y coordinate. */
export function hairline(
    page: PDFPage,
    options: {
        x: number;
        top: number;
        width: number;
        color: PdfColor;
        thickness?: number;
        dashArray?: number[];
    }
): void {
    const { x, top, width, color, thickness = 0.7, dashArray } = options;
    const y = fromTop(page, top);
    page.drawLine({
        start: { x, y },
        end: { x: x + width, y },
        thickness,
        color,
        dashArray,
        dashPhase: dashArray ? 2 : undefined,
    });
}

/**
 * Ticket perforation: a row of small semicircles punched out of a coloured
 * band's top edge. Painted in the page background colour on top of the band.
 */
export function drawPerforation(
    page: PDFPage,
    options: {
        x: number;
        top: number;
        width: number;
        radius?: number;
        color: PdfColor;
        /** `down` punches bumps downwards (band above), `up` bumps upwards. */
        direction?: 'down' | 'up';
        inset?: number;
    }
): void {
    const { x, top, width, radius = 4.2, color, direction = 'down', inset = 18 } = options;
    const usable = width - inset * 2;
    const count = Math.max(6, Math.floor(usable / (radius * 3.4)));
    const step = usable / (count - 1);

    for (let i = 0; i < count; i++) {
        page.drawSvgPath(scallopPath(radius), {
            x: x + inset + i * step,
            y: fromTop(page, top),
            color,
            rotate: direction === 'down' ? undefined : undefined,
        });
    }
}

/**
 * Fill a wave across a zone: `top` is the zone's top edge and the wave fills
 * `height` downwards from it.
 */
export function drawWave(
    page: PDFPage,
    options: {
        x: number;
        top: number;
        width: number;
        height: number;
        color: PdfColor;
        opacity?: number;
        waves?: number;
        phase?: number;
    }
): void {
    const { x, top, width, height, color, opacity, waves = 2.4, phase = 0 } = options;

    page.drawSvgPath(wavePath(width, height, waves, phase), {
        // `drawSvgPath` grows downwards from this origin, so the origin is the
        // *top* of the wave zone once measured in top-based coordinates.
        y: fromTop(page, top),
        x,
        color,
        opacity,
    });
}

/** Circular wax-seal style stamp (ring + glyph text + label). */
export function drawSeal(
    page: PDFPage,
    options: {
        cx: number;
        top: number;
        radius: number;
        fillColor: PdfColor;
        ringColor: PdfColor;
        innerFillColor?: PdfColor;
        label: string;
        labelFont: PDFFont;
        labelSize: number;
        labelColor: PdfColor;
        subLabel?: string;
        subLabelFont?: PDFFont;
        subLabelSize?: number;
        subLabelColor?: PdfColor;
        rotate?: number;
        ringWidth?: number;
        dashedRing?: boolean;
        fillOpacity?: number;
        ringOpacity?: number;
        labelOpacity?: number;
    }
): void {
    const {
        cx,
        top,
        radius,
        fillColor,
        ringColor,
        innerFillColor,
        label,
        labelFont,
        labelSize,
        labelColor,
        subLabel,
        subLabelFont,
        subLabelSize = 5.6,
        subLabelColor,
        rotate = -14,
        ringWidth = 1.2,
        dashedRing = false,
        fillOpacity,
        ringOpacity,
        labelOpacity,
    } = options;

    const cy = fromTop(page, top);
    const centreY = cy - radius;

    page.drawSvgPath(circlePath(radius), { x: cx, y: centreY, color: fillColor, opacity: fillOpacity });

    if (innerFillColor) {
        page.drawSvgPath(circlePath(radius - ringWidth * 2.4), {
            x: cx,
            y: centreY,
            color: innerFillColor,
            opacity: fillOpacity,
        });
    }

    page.drawSvgPath(circlePath(radius - ringWidth / 2), {
        x: cx,
        y: centreY,
        borderColor: ringColor,
        borderWidth: ringWidth,
        borderOpacity: ringOpacity,
        borderDashArray: dashedRing ? [2.4, 2.4] : undefined,
    });

    const labelWidth = labelFont.widthOfTextAtSize(label, labelSize);
    page.drawText(label, {
        x: cx - labelWidth / 2,
        y: centreY - labelSize * (subLabel ? 0.5 : 0.355),
        font: labelFont,
        size: labelSize,
        color: labelColor,
        opacity: labelOpacity,
    });

    if (subLabel && subLabelFont) {
        const subWidth = subLabelFont.widthOfTextAtSize(subLabel, subLabelSize);
        page.drawText(subLabel, {
            x: cx - subWidth / 2,
            y: centreY - radius * 0.34,
            font: subLabelFont,
            size: subLabelSize,
            color: subLabelColor || labelColor,
            opacity: labelOpacity,
        });
    }

}

/* ------------------------------------------------------------------------ */
/* Text helpers                                                              */
/* ------------------------------------------------------------------------ */

export interface TextOptions {
    x: number;
    /** Baseline position measured from the top of the page. */
    top: number;
    text: string;
    font: PDFFont;
    size: number;
    color: PdfColor;
    opacity?: number;
}

export function drawText(page: PDFPage, options: TextOptions): void {
    const { x, top, text, font, size, color, opacity } = options;
    if (!text) return;
    page.drawText(text, { x, y: fromTop(page, top), font, size, color, opacity });
}

export function drawTextRight(page: PDFPage, options: TextOptions): void {
    const width = options.font.widthOfTextAtSize(options.text, options.size);
    drawText(page, { ...options, x: options.x - width });
}

export function drawTextCenter(page: PDFPage, options: TextOptions & { width: number }): void {
    const width = options.font.widthOfTextAtSize(options.text, options.size);
    drawText(page, { ...options, x: options.x + (options.width - width) / 2 });
}

/**
 * Uppercase "tracked" label: the typographic trick that makes documents look
 * considered. pdf-lib has no letter-spacing, so the spacing is faked by
 * drawing each character at a manually advanced x position.
 */
export function drawTracked(
    page: PDFPage,
    options: TextOptions & { tracking?: number }
): number {
    const { x, top, text, font, size, color, tracking = 0.9, opacity } = options;
    let cursor = x;

    for (const ch of text) {
        page.drawText(ch, {
            x: cursor,
            y: fromTop(page, top),
            font,
            size,
            color,
            opacity,
        });
        cursor += font.widthOfTextAtSize(ch, size) + tracking;
    }

    return cursor - x - tracking;
}

/** Width of a tracked label (mirrors `drawTracked`). */
export function trackedWidth(text: string, font: PDFFont, size: number, tracking = 0.9): number {
    let width = 0;
    for (const ch of text) width += font.widthOfTextAtSize(ch, size) + tracking;
    return Math.max(0, width - tracking);
}

/** Bullet glyph used in lists: a filled dot. */
export function drawBullet(
    page: PDFPage,
    options: { x: number; top: number; radius?: number; color: PdfColor; opacity?: number }
): void {
    const { x, top, radius = 1.7, color, opacity } = options;
    page.drawSvgPath(circlePath(radius), { x, y: fromTop(page, top), color, opacity });
}

/** Vector check mark used in "what's included" lists. */
export function drawCheck(
    page: PDFPage,
    options: { x: number; top: number; size?: number; color: PdfColor; thickness?: number }
): void {
    const { x, top, size = 8, color, thickness = 1.4 } = options;
    page.drawSvgPath(checkPath(size), {
        x,
        y: fromTop(page, top),
        borderColor: color,
        borderWidth: thickness,
        borderLineCap: undefined,
    });
}

/** Vector sparkle used as a brand flourish next to uppercase labels. */
export function drawSparkle(
    page: PDFPage,
    options: { x: number; top: number; size?: number; color: PdfColor; opacity?: number }
): void {
    const { x, top, size = 7, color, opacity } = options;
    page.drawSvgPath(sparklePath(size), { x, y: fromTop(page, top), color, opacity });
}

export type { InvoicePalette };
