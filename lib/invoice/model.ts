/**
 * Turns a quote (plus its owner and payment metadata) into the normalised
 * `InvoiceDocument` consumed by the PDF template.
 *
 * Design rules baked in here:
 * - every string is sanitised for the PDF fonts (`safeText`)
 * - money is rounded half-up to 2 decimals and the printed arithmetic always
 *   adds up: `subtotal - discount + tax = total`, `total - paid = balance due`
 * - nothing about the template (colours, fonts, positions) leaks into here
 */

import {
    amountInWords,
    formatCoverDate,
    formatDate,
    formatDateTime,
    parseAmount,
    safeText,
    toDate,
} from './format';
import type {
    InvoiceBranding,
    InvoiceCover,
    InvoiceDocument,
    InvoiceLineItem,
    InvoiceOptions,
    InvoiceParty,
    InvoiceTotals,
} from './types';

function round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

function titleCase(value: string): string {
    return value
        .toLowerCase()
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/** `stripe` → `Card payment (Stripe)`, `bank_transfer` → `Bank transfer`. */
export function paymentMethodLabel(method: unknown): string {
    const raw = safeText(method).toLowerCase();
    if (!raw) return '';

    const map: Record<string, string> = {
        stripe: 'Card payment (Stripe)',
        square: 'Card payment (Square)',
        authorize: 'Card payment (Authorize.Net)',
        'authorize.net': 'Card payment (Authorize.Net)',
        authorizenet: 'Card payment (Authorize.Net)',
        airwallex: 'Card payment (Airwallex)',
        paddle: 'Card payment (Paddle)',
        paypal: 'PayPal',
        bank: 'Bank transfer',
        bank_transfer: 'Bank transfer',
        cash: 'Cash',
        apple_pay: 'Apple Pay',
        google_pay: 'Google Pay',
    };

    return map[raw] ?? titleCase(raw);
}

function buildBuyer(quoteData: any, user: any, policyNumber: string): InvoiceParty {
    const customer = quoteData?.customerData || {};

    const nameParts = [
        quoteData?.nameTitle,
        customer.firstName || user?.firstName,
        customer.middleName,
        customer.lastName || user?.lastName,
    ]
        .map((part) => safeText(part))
        .filter(Boolean);

    const addressLines = [safeText(customer.address || user?.address)]
        .filter(Boolean)
        .concat(
            [
                safeText(customer.post_code || customer.postcode || user?.postCode),
                safeText(customer.country || user?.country),
            ].filter(Boolean)
        );

    return {
        displayName: nameParts.join(' ') || 'Customer',
        email: safeText(user?.email || customer.email),
        phone: safeText(customer.phoneNumber || user?.phone),
        addressLines,
        reference: safeText(user?.userId || user?.customerId || policyNumber),
    };
}

function buildCover(quoteData: any, buyer: InvoiceParty): InvoiceCover {
    const customer = quoteData?.customerData || {};
    const vehicle = customer.vehicle || {};

    const makeModel = [safeText(vehicle.make), safeText(vehicle.model)].filter(Boolean).join(' ');
    const engine = safeText(vehicle.engineCC);

    const registration = safeText(
        customer.registration || customer.regNumber || quoteData?.regNumber
    ).toUpperCase();

    const duration = safeText(customer.duration || quoteData?.breakdown?.duration);

    const modifications = Array.isArray(quoteData?.vehicleModifications)
        ? quoteData.vehicleModifications.map((item: unknown) => safeText(item)).filter(Boolean)
        : safeText(quoteData?.vehicleModifications)
            ? [safeText(quoteData.vehicleModifications)]
            : [];

    const licenceType = safeText(customer.licenseType);
    const licenceHeld = safeText(customer.licenseHeld);

    return {
        policyNumber: '',
        insuranceType: 'Temporary Motor Insurance',
        vehicle: makeModel || 'N/A',
        registration,
        vehicleDetail: [safeText(vehicle.year), engine ? (/(cc|litre|liter)/i.test(engine) ? engine : `${engine} cc`) : '']
            .filter(Boolean)
            .join(' · '),
        periodStart: formatCoverDate(quoteData?.startTime || quoteData?.startDate),
        periodEnd: formatCoverDate(quoteData?.expiryTime || quoteData?.endDate),
        duration: duration ? `${duration} cover` : '',
        reason: safeText(customer.reason || quoteData?.breakdown?.reason || quoteData?.coverReason),
        driver: buyer.displayName,
        licence: [licenceType, licenceHeld ? `held ${licenceHeld.toLowerCase()}` : '']
            .filter(Boolean)
            .join(' · '),
        modifications: modifications.length ? modifications.join(', ') : 'None declared',
    };
}

interface TotalsInput {
    listAmount: number | null;
    payable: number;
    discountLabel: string;
}

function buildTotals(input: TotalsInput, branding: InvoiceBranding): InvoiceTotals {
    const rate = Math.max(0, branding.taxRate);
    const payable = round2(input.payable);
    const list = round2(Math.max(input.listAmount ?? payable, payable));

    // Work backwards from the amount actually charged so the invoice always
    // balances, no matter how the quote's list price was stored.
    const divisor = rate > 0 && !branding.taxInclusive ? 1 + rate / 100 : 1;
    const netList = round2(list / divisor);
    const netPayable = round2(payable / divisor);

    const subtotal = netList;
    const discount = round2(Math.max(netList - netPayable, 0));
    const taxAmount = round2(branding.taxInclusive && rate > 0 ? netPayable - netPayable / (1 + rate / 100) : netPayable * (rate / 100));

    const total = round2(branding.taxInclusive && rate > 0 ? netPayable : netPayable + taxAmount);

    return {
        subtotal,
        discount,
        discountLabel: input.discountLabel,
        taxAmount,
        taxRate: rate,
        taxLabel: branding.taxLabel,
        taxInclusive: branding.taxInclusive,
        total,
        amountPaid: 0,
        balanceDue: total,
    };
}

function buildItems(
    quoteData: any,
    cover: InvoiceCover,
    totals: InvoiceTotals,
    branding: InvoiceBranding,
    policyNumber: string
): InvoiceLineItem[] {
    const items: InvoiceLineItem[] = [];

    const period = [cover.periodStart, cover.periodEnd].filter(Boolean).join('  -  ');

    items.push({
        description: cover.insuranceType,
        details: [
            `Policy number ${policyNumber}`,
            cover.registration ? `Vehicle ${cover.vehicle} (${cover.registration})` : `Vehicle ${cover.vehicle}`,
            period ? `Cover period ${period}` : '',
            cover.reason ? `Cover reason ${cover.reason}` : '',
        ].filter(Boolean),
        quantity: 1,
        unitPrice: totals.subtotal,
        amount: totals.subtotal,
        kind: 'charge',
    });

    if (totals.discount > 0) {
        items.push({
            description: totals.discountLabel,
            details: [],
            quantity: 1,
            unitPrice: -totals.discount,
            amount: -totals.discount,
            kind: 'discount',
        });
    }

    if (totals.taxAmount > 0 && !branding.taxInclusive) {
        items.push({
            description: `${totals.taxLabel}${totals.taxRate > 0 ? ` @ ${totals.taxRate}%` : ''}`,
            details: [],
            quantity: 1,
            unitPrice: totals.taxAmount,
            amount: totals.taxAmount,
            kind: 'tax',
        });
    }

    return items;
}

function buildNotes(documentTitle: string, cover: InvoiceCover): InvoiceDocument['notes'] {
    return {
        accessSteps: [
            {
                title: 'Account dashboard',
                body: 'Sign in to your account and open the dashboard. All of your purchased documents are listed there and can be downloaded again at any time.',
            },
            {
                title: 'Confirmation email',
                body: 'Open the confirmation email sent to your registered address and use the "View documents" button for instant access to this policy.',
            },
        ],
        included: [
            'Policy schedule and certificate of insurance (PDF)',
            'Statement of facts and product information',
            'This invoice, filed under your account for your records',
            'Unlimited re-downloads for the lifetime of your policy',
        ],
        important: [
            'This is a digital service. No physical documents are posted to you.',
            'Documents are issued electronically and are available immediately after the payment has been confirmed.',
            `Cover is only valid for the period printed on the certificate: ${cover.periodStart}${cover.periodEnd ? ` to ${cover.periodEnd}` : ''}.`,
            'Refunds: a full refund is available within 7 days of purchase when a technical issue prevents you from accessing or using your documents as intended.',
            'If anything on this invoice looks incorrect, contact our support team and we will issue a corrected document.',
        ],
        thankYou: `Thank you for choosing us for your ${documentTitle.toLowerCase().includes('tax') ? '' : ''}temporary motor insurance.`,
    };
}

export interface BuildInvoiceInput {
    quoteData: any;
    user: any;
    policyNumber: string;
    branding: InvoiceBranding;
    options?: InvoiceOptions;
}

/**
 * Build the presentation-ready invoice document. Pure function: no database,
 * no clock reads beyond `options.issuedAt` / `now` defaults for the timestamp.
 */
export function buildInvoiceDocument({
    quoteData,
    user,
    policyNumber,
    branding,
    options = {},
}: BuildInvoiceInput): InvoiceDocument {
    const payment = options.payment || {};
    const currency = (options.currency || branding.currency || 'GBP').toUpperCase();

    const buyer = buildBuyer(quoteData, user, policyNumber);
    const cover = buildCover(quoteData, buyer);
    cover.policyNumber = policyNumber;

    const payable =
        parseAmount(payment.amount) ??
        parseAmount(quoteData?.total) ??
        parseAmount(quoteData?.updatePrice) ??
        parseAmount(quoteData?.cpw) ??
        0;

    const listAmount =
        parseAmount(payment.listAmount) ??
        parseAmount(quoteData?.cpw) ??
        parseAmount(quoteData?.originalTotal);

    const promoCode = safeText(payment.promoCode || quoteData?.promoCode);
    const discountLabel = promoCode
        ? `Promotional discount (${promoCode})`
        : 'Discount applied';

    const totals = buildTotals({ listAmount, payable, discountLabel }, branding);

    const paid = payment.paid === true;
    const balanceDue = paid ? 0 : totals.total;
    totals.amountPaid = paid ? totals.total : 0;
    totals.balanceDue = balanceDue;

    const issuedAt =
        payment.date ??
        quoteData?.paymentDate ??
        options.issuedAt ??
        new Date();

    const issuedDate = toDate(issuedAt) || new Date();
    const dueDate = branding.dueDays > 0
        ? new Date(issuedDate.getTime() + branding.dueDays * 24 * 60 * 60 * 1000)
        : null;

    const items = buildItems(quoteData, cover, totals, branding, policyNumber);

    const statusLabel = paid
        ? balanceDue > 0
            ? 'PART PAID'
            : 'PAID IN FULL'
        : safeText(payment.status).toUpperCase() === 'PENDING'
            ? 'AWAITING PAYMENT'
            : 'PAYMENT DUE';

    return {
        documentTitle: branding.documentTitle || 'INVOICE',
        invoiceNumber: policyNumber,
        watermark: paid ? 'PAID' : 'DUE',
        issueDateText: formatDate(issuedDate, branding.timezone),
        issueTimeText: formatDateTime(issuedDate, branding.timezone).split(', ')[1] || '',
        dueDateText: dueDate ? formatDate(dueDate, branding.timezone) : '',
        generatedText: formatDateTime(new Date(), branding.timezone),
        currency,
        seller: {
            name: branding.companyName || branding.siteName,
            addressLines: branding.companyAddressLines,
            registration: branding.companyRegistration,
            vatNumber: branding.vatNumber,
            email: branding.supportEmail,
            phone: branding.companyPhone,
            website: branding.siteUrl.replace(/^https?:\/\//i, ''),
        },
        buyer,
        cover,
        items,
        totals,
        payment: {
            paid,
            methodLabel: paymentMethodLabel(payment.method) || 'Card payment',
            reference: safeText(payment.reference),
            dateText: paid ? formatDateTime(issuedDate, branding.timezone) : '',
            statusLabel,
        },
        amountInWords: amountInWords(totals.total, currency),
        taxNote: branding.taxNote,
        terms: branding.terms,
        footerNote: branding.footerNote,
        notes: buildNotes(cover.insuranceType, cover),
    };
}
