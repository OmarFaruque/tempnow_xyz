/**
 * Text, number, currency and date helpers for the invoice renderer.
 *
 * Invoices are printed documents: every string that ends up in the PDF must be
 * safe for the standard PDF fonts (WinAnsi / CP1252). Quote data comes from
 * customer filled forms, so it routinely contains emojis, non-breaking spaces,
 * Cyrillic/Arabic names and smart quotes. Drawing those with `Helvetica`
 * throws `UnsupportedEncodingError` inside pdf-lib, which used to take the
 * whole invoice (and the confirmation email around it) down. Everything that
 * reaches `page.drawText()` therefore goes through `safeText()` first.
 */

import type { PDFFont } from 'pdf-lib';

/* ------------------------------------------------------------------------ */
/* Text sanitising                                                           */
/* ------------------------------------------------------------------------ */

/** Characters CP1252 encodes on top of plain ASCII and Latin-1. */
const CP1252_EXTRAS = new Set<number>([
    0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030,
    0x0160, 0x2039, 0x0152, 0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022,
    0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
]);

/**
 * Coerce any value into a string the standard PDF fonts can encode.
 *
 * - `null` / `undefined` become `fallback`
 * - non-breaking and zero-width characters become plain spaces / are dropped
 * - emoji and scripts outside CP1252 are removed instead of throwing
 */
export function safeText(value: unknown, fallback = ''): string {
    if (value === null || value === undefined) return fallback;

    const raw = typeof value === 'string' ? value : String(value);
    let out = '';

    for (const ch of raw) {
        const cp = ch.codePointAt(0) as number;

        if (cp === 9 || cp === 10 || cp === 13) {
            out += ' ';
            continue;
        }
        if (cp < 32) continue;
        if (cp === 0xa0 || cp === 0x2007 || cp === 0x202f) {
            out += ' ';
            continue;
        }
        if (
            (cp >= 0x200b && cp <= 0x200f) ||
            cp === 0x2028 ||
            cp === 0x2029 ||
            cp === 0xfeff
        ) {
            continue;
        }
        if (cp <= 0x7e || (cp >= 0xa0 && cp <= 0xff) || CP1252_EXTRAS.has(cp)) {
            out += ch;
        }
        // Anything else (emoji, CJK, Arabic, Cyrillic, ...) is dropped: the
        // invoice keeps rendering instead of failing the whole transaction.
    }

    return out.replace(/[ ]{2,}/g, ' ').trim();
}

/** `safeText()` with a `—` for empty values (handy for table cells). */
export function safeTextOr(value: unknown, dash = '-'): string {
    const text = safeText(value);
    return text.length ? text : dash;
}

export function hasText(value: unknown): boolean {
    return safeText(value).length > 0;
}

/* ------------------------------------------------------------------------ */
/* Measuring / wrapping                                                      */
/* ------------------------------------------------------------------------ */

export function measureText(text: string, font: PDFFont, size: number): number {
    try {
        return font.widthOfTextAtSize(text, size);
    } catch {
        return 0;
    }
}

/**
 * Greedy word wrap that never loses characters: words that are wider than the
 * available width are hard-split, explicit `\n` starts a new line.
 */
export function wrapText(
    text: unknown,
    font: PDFFont,
    size: number,
    maxWidth: number
): string[] {
    const clean = safeText(text);
    if (!clean) return [];

    const lines: string[] = [];

    for (const paragraph of clean.split(/\n+/)) {
        const words = paragraph.split(' ').filter(Boolean);
        let current = '';

        for (const word of words) {
            const candidate = current ? `${current} ${word}` : word;

            if (measureText(candidate, font, size) <= maxWidth) {
                current = candidate;
                continue;
            }

            if (current) lines.push(current);

            if (measureText(word, font, size) <= maxWidth) {
                current = word;
                continue;
            }

            // Single word wider than the column: split it character by character.
            let chunk = '';
            for (const ch of word) {
                if (measureText(chunk + ch, font, size) > maxWidth && chunk) {
                    lines.push(chunk);
                    chunk = ch;
                } else {
                    chunk += ch;
                }
            }
            current = chunk;
        }

        if (current) lines.push(current);
    }

    return lines;
}

/** Shorten a string to `maxWidth`, appending `…` when it had to be cut. */
export function truncate(text: unknown, font: PDFFont, size: number, maxWidth: number): string {
    const clean = safeText(text);
    if (measureText(clean, font, size) <= maxWidth) return clean;

    const ellipsis = '...';
    let cut = clean;
    while (cut.length > 1 && measureText(cut + ellipsis, font, size) > maxWidth) {
        cut = cut.slice(0, -1);
    }
    return cut.replace(/[\s.,;:-]+$/, '') + ellipsis;
}

/* ------------------------------------------------------------------------ */
/* Numbers & money                                                           */
/* ------------------------------------------------------------------------ */

/** Parse `"399.99"`, `399.99`, `"£399.99"`, `null`, `undefined` → number. */
export function parseAmount(value: unknown): number | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
        const cleaned = value.replace(/[^0-9.,-]/g, '').replace(/,/g, '');
        if (!cleaned) return null;
        const parsed = Number.parseFloat(cleaned);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
    GBP: '£',
    USD: '$',
    EUR: '€',
    AED: 'AED',
    SAR: 'SAR',
    QAR: 'QAR',
    KWD: 'KWD',
    OMR: 'OMR',
    BHD: 'BHD',
    INR: '₹',
    PKR: 'PKR',
    AUD: 'A$',
    CAD: 'C$',
    NZD: 'NZ$',
    CHF: 'CHF',
    JPY: '¥',
};

/**
 * Symbol for an ISO currency code. Codes without a CP1252 glyph (AED, SAR,
 * ...) deliberately return their ISO code so the PDF keeps rendering.
 */
export function currencySymbol(currency: string | null | undefined): string {
    const code = safeText(currency).toUpperCase();
    if (!code) return CURRENCY_SYMBOLS.GBP;
    return CURRENCY_SYMBOLS[code] ?? code;
}

/** `399.9` + `GBP` → `"£399.90"` (`"AED 399.90"` for codes without glyphs). */
export function formatMoney(amount: unknown, currency: string): string {
    const value = parseAmount(amount) ?? 0;
    const symbol = currencySymbol(currency);
    const absolute = Math.abs(value);

    let formatted: string;
    try {
        formatted = new Intl.NumberFormat('en-GB', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(absolute);
    } catch {
        formatted = absolute.toFixed(2);
    }

    const sign = value < 0 ? '-' : '';
    const separator = /^[A-Za-z]/.test(symbol) ? ' ' : '';
    return `${sign}${symbol}${separator}${formatted}`;
}

/* ------------------------------------------------------------------------ */
/* Amount in words                                                           */
/* ------------------------------------------------------------------------ */

const ONES = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
    'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
    'sixteen', 'seventeen', 'eighteen', 'nineteen',
];

const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

const SCALES = ['', ' thousand', ' million', ' billion'];

function underHundred(n: number): string {
    if (n < 20) return ONES[n];
    const tens = Math.floor(n / 10);
    const rest = n % 10;
    return rest ? `${TENS[tens]}-${ONES[rest]}` : TENS[tens];
}

function underThousand(n: number): string {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    if (!hundreds) return underHundred(rest);
    return rest ? `${ONES[hundreds]} hundred and ${underHundred(rest)}` : `${ONES[hundreds]} hundred`;
}

/** `1234` → `"one thousand two hundred and thirty-four"`. */
export function numberToWords(value: number): string {
    const n = Math.floor(Math.abs(value));
    if (n === 0) return 'zero';

    const groups: number[] = [];
    let remaining = n;
    while (remaining > 0) {
        groups.push(remaining % 1000);
        remaining = Math.floor(remaining / 1000);
    }

    let words = '';
    for (let i = groups.length - 1; i >= 0; i--) {
        const group = groups[i];
        if (!group) continue;
        const groupWords = underThousand(group) + SCALES[i];
        if (!words) {
            words = groupWords;
        } else if (group < 100) {
            // British style: "... million and five"
            words += ` and ${groupWords}`;
        } else {
            words += ` ${groupWords}`;
        }
    }

    return words;
}

interface CurrencyWordSet {
    major: [string, string];
    minor: [string, string];
}

const CURRENCY_WORDS: Record<string, CurrencyWordSet> = {
    GBP: { major: ['pound', 'pounds'], minor: ['penny', 'pence'] },
    USD: { major: ['dollar', 'dollars'], minor: ['cent', 'cents'] },
    EUR: { major: ['euro', 'euros'], minor: ['cent', 'cents'] },
    AED: { major: ['dirham', 'dirhams'], minor: ['fils', 'fils'] },
    SAR: { major: ['riyal', 'riyals'], minor: ['halala', 'halalas'] },
    QAR: { major: ['riyal', 'riyals'], minor: ['dirham', 'dirhams'] },
    INR: { major: ['rupee', 'rupees'], minor: ['paisa', 'paise'] },
    PKR: { major: ['rupee', 'rupees'], minor: ['paisa', 'paise'] },
};

/**
 * `399.99` + `GBP` → `"Three hundred and ninety-nine pounds and ninety-nine
 * pence only"`. Unsupported currencies fall back to the ISO code.
 */
export function amountInWords(amount: unknown, currency: string): string {
    const value = parseAmount(amount) ?? 0;
    const code = safeText(currency).toUpperCase() || 'GBP';
    const words = CURRENCY_WORDS[code];

    const majorUnits = Math.floor(Math.abs(value));
    const minorUnits = Math.round((Math.abs(value) - majorUnits) * 100);

    const parts: string[] = [];
    if (majorUnits > 0 || minorUnits === 0) {
        const majorName = words
            ? words.major[majorUnits === 1 ? 0 : 1]
            : code;
        parts.push(`${numberToWords(majorUnits)} ${majorName}`);
    }
    if (minorUnits > 0) {
        const minorName = words
            ? words.minor[minorUnits === 1 ? 0 : 1]
            : 'cents';
        parts.push(`${numberToWords(minorUnits)} ${minorName}`);
    }

    const sentence = parts.join(' and ');
    const signed = value < 0 ? `minus ${sentence}` : sentence;
    return `${signed.charAt(0).toUpperCase()}${signed.slice(1)} only`;
}

/* ------------------------------------------------------------------------ */
/* Dates                                                                     */
/* ------------------------------------------------------------------------ */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function toDate(value: unknown): Date | null {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }
    return null;
}

/**
 * `"30 Oct 2025"`. When a timezone is supplied (e.g. `Europe/London` from the
 * site settings) the date is formatted in the site's timezone, otherwise the
 * runtime timezone is used. Invalid timezones fall back gracefully.
 */
export function formatDate(value: unknown, timeZone?: string): string {
    const date = toDate(value);
    if (!date) return '';

    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    };

    try {
        return new Intl.DateTimeFormat(
            'en-GB',
            timeZone ? { ...options, timeZone } : options
        ).format(date);
    } catch {
        return new Intl.DateTimeFormat('en-GB', options).format(date);
    }
}

/** `"30 Oct 2025, 06:00"`. */
export function formatDateTime(value: unknown, timeZone?: string): string {
    const date = toDate(value);
    if (!date) return '';

    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    };

    try {
        return new Intl.DateTimeFormat(
            'en-GB',
            timeZone ? { ...options, timeZone } : options
        ).format(date);
    } catch {
        return new Intl.DateTimeFormat('en-GB', options).format(date);
    }
}

/** `DD/MM/YYYY` or `DD/MM/YY` (+ optional `HH:MM`) as stored in quote data. */
export function formatCoverDate(raw: unknown, withTime = true): string {
    const text = safeText(raw);
    if (!text) return '';

    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/.exec(text);
    if (!match) {
        // ISO or arbitrary string — show the date part if we can parse it.
        return formatDateTime(text);
    }

    const [, day, month, year, hour, minute] = match;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const monthName = MONTHS[Math.min(Math.max(Number(month) - 1, 0), 11)];
    const datePart = `${day.padStart(2, '0')} ${monthName} ${fullYear}`;

    if (withTime && hour !== undefined) {
        return `${datePart}, ${hour.padStart(2, '0')}:${minute}`;
    }
    return datePart;
}
