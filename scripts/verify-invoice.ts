/**
 * Invoice template checks.
 *
 * Run with `pnpm tsx scripts/verify-invoice.ts`. Renders a set of adversarial
 * quotes through the real generator and asserts the properties that matter for
 * a billing document:
 *
 *   1. generation never throws — no `UnsupportedEncodingError` from emoji or
 *      non-Latin names, no crash on missing customer data or empty quotes
 *   2. the printed arithmetic balances: subtotal - discount + tax = total
 *   3. paid invoices have a zero balance, unpaid ones a positive one
 *   4. typical invoices are two pages (invoice + information), never more
 *   5. money, dates and amount-in-words helpers behave
 */

import { PDFDocument } from 'pdf-lib';
import { buildInvoiceDocument } from '../lib/invoice/model';
import { buildInvoiceBranding } from '../lib/invoice/branding';
import { renderInvoicePdf } from '../lib/invoice/render';
import {
    amountInWords,
    formatCoverDate,
    formatDate,
    formatMoney,
    parseAmount,
    safeText,
    wrapText,
    truncate,
} from '../lib/invoice/format';
import { createInvoiceTheme } from '../lib/invoice/theme';
import type { InvoiceOptions } from '../lib/invoice/types';

let failures = 0;
let checks = 0;

function check(name: string, condition: boolean, detail = '') {
    checks += 1;
    if (condition) {
        console.log(`  ok   ${name}`);
    } else {
        failures += 1;
        console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
    }
}

function closeTo(a: number, b: number, epsilon = 0.011): boolean {
    return Math.abs(a - b) <= epsilon;
}

const settings = {
    siteName: 'Tempnow',
    companyName: 'Tempnow Ltd',
    companyRegistration: '12849301',
    companyAddress: 'Suite 4, 118 Piccadilly, London W1J 7NW',
    supportEmail: 'support@tempnow.uk',
    siteDomain: 'tempnow.uk',
    brandColor: '#0d9488',
    currency: 'GBP',
    timezone: 'Europe/London',
    invoiceTaxRate: 12,
    invoiceTaxLabel: 'Insurance Premium Tax',
    invoiceDueDays: 7,
};

const baseQuote = {
    nameTitle: 'Mrs',
    total: 24.51,
    cpw: '32.80',
    startTime: '18/10/2026 14:00',
    expiryTime: '19/10/2026 13:59',
    customerData: {
        firstName: 'Amelia',
        lastName: 'Hughes',
        address: '42 Marlborough Crescent',
        post_code: 'SW1A 1AA',
        phoneNumber: '+44 7700 900123',
        licenseType: 'Full UK License',
        licenseHeld: '5-10 Years',
        reason: 'Borrowing',
        duration: '1 Day',
        registration: 'LK23 ZWA',
        vehicle: { make: 'Audi', model: 'A3', year: '2021', engineCC: '1498' },
    },
};

const user = {
    userId: 'usr_1',
    firstName: 'Amelia',
    lastName: 'Hughes',
    email: 'amelia@example.com',
};

interface Case {
    name: string;
    quoteData: any;
    user: any;
    options?: InvoiceOptions;
    pages: 'two' | 'atLeastTwo';
}

const cases: Case[] = [
    {
        name: 'standard paid invoice',
        quoteData: { ...baseQuote, promoCode: 'WELCOME10' },
        user,
        options: {
            payment: {
                paid: true,
                method: 'stripe',
                reference: 'pi_123',
                date: '2026-10-08T11:32:00.000Z',
                promoCode: 'WELCOME10',
                listAmount: 32.8,
                amount: 24.51,
            },
        },
        pages: 'two',
    },
    {
        name: 'unpaid invoice',
        quoteData: baseQuote,
        user,
        options: { payment: { paid: false, status: 'pending' } },
        pages: 'two',
    },
    {
        name: 'emoji + cyrillic + em dash in every field',
        quoteData: {
            ...baseQuote,
            nameTitle: 'Mr 🚗',
            promoCode: 'ПРОМО',
            customerData: {
                ...baseQuote.customerData,
                firstName: 'Ivan 💥 Petrov',
                lastName: 'Смирнов',
                address: 'Улица Ленина 15 — “квартира” 3 ’',
                vehicle: { make: 'Лада', model: 'Веста 🚙', year: '2022', engineCC: '1596' },
            },
        },
        user: { ...user, email: 'иван@пример.рф' },
        options: { payment: { paid: true, method: 'stripe', amount: 24.51 } },
        pages: 'two',
    },
    {
        name: 'missing customer data / empty user',
        quoteData: { total: 10, customerData: {} },
        user: {},
        options: {},
        pages: 'two',
    },
    {
        name: 'empty quote',
        quoteData: {},
        user: null,
        options: {},
        pages: 'two',
    },
    {
        name: 'extreme amounts and long strings',
        quoteData: {
            ...baseQuote,
            total: 9876543.21,
            cpw: '9876543.21',
            startTime: 'not-a-date',
            promoCode: 'X'.repeat(80),
            customerData: {
                ...baseQuote.customerData,
                address: 'A'.repeat(400),
                vehicle: { make: 'Mercedes-Benz '.repeat(6), model: 'Sprinter', year: '2023', engineCC: '1950' },
            },
        },
        user,
        options: {
            payment: {
                paid: true,
                method: 'airwallex',
                reference: 'r'.repeat(120),
                listAmount: 9876543.21,
                amount: 9876543.21,
            },
        },
        pages: 'two',
    },
    {
        name: 'many line items (tax + discount)',
        quoteData: {
            ...baseQuote,
            total: 1000,
            cpw: '1500',
            promoCode: 'FLEET',
            startTime: '01/12/2026 09:30',
            expiryTime: '31/12/2026 09:29',
        },
        user,
        options: {
            payment: {
                paid: true,
                method: 'square',
                promoCode: 'FLEET',
                listAmount: 1500,
                amount: 1000,
            },
        },
        pages: 'atLeastTwo',
    },
];

async function renderCase(testCase: Case) {
    const branding = buildInvoiceBranding(settings);
    const document = buildInvoiceDocument({
        quoteData: testCase.quoteData,
        user: testCase.user,
        policyNumber: 'P-2427427',
        branding,
        options: testCase.options,
    });

    const pdf = await PDFDocument.create();
    await renderInvoicePdf(pdf, { document, branding, logo: null });
    const bytes = await pdf.save();

    return { document, pdf, bytes };
}

async function main() {
    console.log('\nInvoice helper sanity');
    check('safeText strips emoji', safeText('Hello 🚗 world') === 'Hello world');
    check('safeText keeps CP1252 punctuation', safeText('“quoted” — dash') === '“quoted” — dash');
    check('parseAmount handles currency strings', parseAmount('£1,234.50') === 1234.5);
    check('parseAmount handles junk', parseAmount('n/a') === null);
    check('formatMoney formats GBP', formatMoney(1234.5, 'GBP') === '£1,234.50', formatMoney(1234.5, 'GBP'));
    check('formatMoney prefixes ISO codes for AED', formatMoney(10, 'AED') === 'AED 10.00');
    check('amountInWords basic', amountInWords(24.51, 'GBP') === 'Twenty-four pounds and fifty-one pence only', amountInWords(24.51, 'GBP'));
    check('amountInWords thousands', amountInWords(1212.05, 'GBP').startsWith('One thousand two hundred and twelve pounds'), amountInWords(1212.05, 'GBP'));
    check('amountInWords AED', amountInWords(157.5, 'AED').includes('dirhams'), amountInWords(157.5, 'AED'));
    check('formatCoverDate handles DD/MM/YY HH:MM', formatCoverDate('18/10/26 14:00') === '18 Oct 2026, 14:00', formatCoverDate('18/10/26 14:00'));
    check('formatDate ignores invalid input', formatDate('nonsense') === '');
    check('formatDate formats ISO in timezone', formatDate('2026-10-08T23:30:00.000Z', 'Europe/London') === '09 Oct 2026', formatDate('2026-10-08T23:30:00.000Z', 'Europe/London'));
    check(
        'truncate shortens to the available width',
        truncate('a very long company name that will not fit', createFontStub(), 9, 60).endsWith('...')
    );
    check(
        'truncate leaves short text alone',
        truncate('short', createFontStub(), 9, 200) === 'short'
    );
    check(
        'wrapText respects the column width',
        wrapText('one two three four five six seven eight nine', createFontStub(), 10, 60)
            .every((line) => line.length * 10 * 0.5 <= 60 + 0.001)
    );
    check(
        'wrapText keeps every word',
        wrapText('alpha beta gamma', createFontStub(), 10, 40).join(' ') === 'alpha beta gamma'
    );

    console.log('\nDeterministic totals');
    {
        const branding = buildInvoiceBranding(settings);
        const document = buildInvoiceDocument({
            quoteData: { ...baseQuote, promoCode: 'WELCOME10' },
            user,
            policyNumber: 'P-1',
            branding,
            options: { payment: { listAmount: 32.8, amount: 24.51, promoCode: 'WELCOME10', paid: true, method: 'stripe' } },
        });
        const t = document.totals;
        check('subtotal - discount + tax = total', closeTo(t.subtotal - t.discount + t.taxAmount, t.total),
            `${t.subtotal} - ${t.discount} + ${t.taxAmount} != ${t.total}`);
        check('paid invoice has zero balance', t.balanceDue === 0);
        check('paid invoice records the payment', t.amountPaid === t.total);
        check('promotion is labelled with the code', t.discountLabel.includes('WELCOME10'));
        check('tax-exclusive invoice: tax is added on top of the net', !t.taxInclusive && closeTo(t.subtotal - t.discount + t.taxAmount, t.total));
        check('line items sum to the total', closeTo(
            document.items.reduce((sum, item) => sum + item.amount, 0),
            t.total),
            document.items.map((item) => item.amount).join(' + '));
    }

    console.log('\nTax-inclusive invoices');
    {
        const inclusiveBranding = buildInvoiceBranding({ ...settings, invoiceTaxInclusive: true });
        const document = buildInvoiceDocument({
            quoteData: { ...baseQuote, total: 1212.05 },
            user,
            policyNumber: 'P-2',
            branding: inclusiveBranding,
            options: { payment: { listAmount: 1400, amount: 1212.05, paid: true, method: 'stripe' } },
        });
        const t = document.totals;

        check('inclusive tax does not change the amount charged', closeTo(t.total, 1212.05), String(t.total));
        check('inclusive tax is shown as a breakdown, not an extra', closeTo(t.subtotal - t.discount, t.total),
            `${t.subtotal} - ${t.discount} != ${t.total}`);
        check('inclusive tax line is flagged', t.taxInclusive && t.taxAmount > 0);
        check('inclusive tax is not added as a separate line item',
            document.items.every((item) => item.kind !== 'tax'));
    }

    console.log('\nRendering (no exceptions, correct page counts)');
    for (const testCase of cases) {
        try {
            const { bytes, pdf, document } = await renderCase(testCase);
            const pages = pdf.getPages().length;
            check(`${testCase.name}: renders`, bytes.byteLength > 4000, `${bytes.byteLength} bytes`);
            check(
                `${testCase.name}: ${testCase.pages === 'two' ? 'exactly 2' : 'at least 2'} pages`,
                testCase.pages === 'two' ? pages === 2 : pages >= 2,
                `${pages} pages`
            );
            check(`${testCase.name}: balance due is never negative`, document.totals.balanceDue >= 0);
            check(`${testCase.name}: currency resolved`, /^[A-Z]{3}$/.test(document.currency));
        } catch (error) {
            failures += 1;
            checks += 1;
            console.error(`  FAIL ${testCase.name}: threw ${(error as Error).message}`);
        }
    }

    console.log('\nTheme');
    {
        const theme = createInvoiceTheme(buildInvoiceBranding({ brandColor: '#c8a24a' }));
        check('brand colour flows into the palette', theme.palette.primary === '#c8a24a');
        check('contrast text follows the luminance rule (dark brand → white)', theme.palette.onPrimary === '#ffffff');
        const lightTheme = createInvoiceTheme(buildInvoiceBranding({ brandColor: '#ffe066' }));
        check('contrast text follows the luminance rule (light brand → ink)', lightTheme.palette.onPrimary === '#0f172a');
    }

    console.log(`\n${checks - failures}/${checks} checks passed`);
    if (failures > 0) process.exit(1);
}

/** Minimal stand-in for a pdf-lib font, used by the pure-text checks. */
function createFontStub() {
    return {
        widthOfTextAtSize: (text: string, size: number) => text.length * size * 0.5,
    } as any;
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
