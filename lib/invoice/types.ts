/**
 * The invoice document model.
 *
 * `lib/invoice.ts` used to render a PDF straight from the raw quote blob,
 * which made the template impossible to reason about, preview or test. The
 * renderer now only ever sees an `InvoiceDocument`: a fully normalised,
 * presentation-ready description of the invoice. Everything that knows about
 * database columns, quote JSON quirks and settings lives in the model builder.
 */

export interface InvoiceBranding {
    /** Public storefront name, e.g. "TEMPNOW". */
    siteName: string;
    /** Registered entity name used in the legal footer, e.g. "Tempnow Ltd". */
    companyName: string;
    /** Seller postal address lines (optional, shown under the seller block). */
    companyAddressLines: string[];
    /** Company registration number text (optional). */
    companyRegistration: string;
    /** VAT / tax registration number (optional). */
    vatNumber: string;
    supportEmail: string;
    companyPhone: string;
    siteUrl: string;
    /** Logo URL or `/public` relative path (optional). */
    logoUrl: string;
    primaryColor: string;
    primaryColorDark: string;
    primaryColorSoft: string;
    /** Readable text colour on top of `primaryColor`. */
    onPrimaryColor: string;
    /** ISO currency code, e.g. `GBP`. */
    currency: string;
    /** IANA timezone used for date formatting. */
    timezone: string;
    /** Tax rate in percent; `0` disables the tax line entirely. */
    taxRate: number;
    /** Label for the tax line, e.g. `VAT` or `Insurance Premium Tax`. */
    taxLabel: string;
    /** When true the line items already include tax. */
    taxInclusive: boolean;
    /** Optional free-text note about tax printed under the totals. */
    taxNote: string;
    /** Payment term in days (used for the due date of unpaid invoices). */
    dueDays: number;
    /** Terms / refund policy paragraph (optional). */
    terms: string;
    /** Small print shown in the footer. */
    footerNote: string;
    /** Document title, e.g. `Invoice` or `Tax Invoice`. */
    documentTitle: string;
    /** Jurisdiction marker (`uk`, `uae`, ...) used for sensible defaults. */
    jurisdiction: string;
}

export interface InvoiceParty {
    displayName: string;
    email: string;
    phone: string;
    addressLines: string[];
    /** e.g. customer reference / user id. */
    reference: string;
}

export interface InvoiceCover {
    policyNumber: string;
    insuranceType: string;
    vehicle: string;
    registration: string;
    vehicleDetail: string;
    periodStart: string;
    periodEnd: string;
    duration: string;
    reason: string;
    driver: string;
    licence: string;
    modifications: string;
}

export type InvoiceLineKind = 'charge' | 'discount' | 'tax';

export interface InvoiceLineItem {
    description: string;
    /** Small muted lines printed under the description. */
    details: string[];
    quantity: number;
    unitPrice: number;
    amount: number;
    kind: InvoiceLineKind;
}

export interface InvoiceTotals {
    /** Net subtotal (before tax when tax is added on top). */
    subtotal: number;
    discount: number;
    discountLabel: string;
    taxAmount: number;
    taxRate: number;
    taxLabel: string;
    /** True when the line items already include tax (tax is informational). */
    taxInclusive: boolean;
    /** Amount that is actually payable for this invoice. */
    total: number;
    amountPaid: number;
    balanceDue: number;
}

export interface InvoicePayment {
    paid: boolean;
    /** Human label, e.g. `Card payment (Stripe)`. */
    methodLabel: string;
    reference: string;
    dateText: string;
    /** Pill text, e.g. `PAID`. */
    statusLabel: string;
}

export interface InvoiceNotes {
    /** Numbered "how to access your documents" steps. */
    accessSteps: Array<{ title: string; body: string }>;
    /** "What's included" checklist for the second page. */
    included: string[];
    /** Important information bullets (refund policy, digital goods, ...). */
    important: string[];
    /** Optional closing message. */
    thankYou: string;
}

export interface InvoiceDocument {
    documentTitle: string;
    invoiceNumber: string;
    /** `PAID` / `DUE` watermark; empty string disables it. */
    watermark: string;
    issueDateText: string;
    issueTimeText: string;
    dueDateText: string;
    generatedText: string;
    currency: string;
    seller: {
        name: string;
        addressLines: string[];
        registration: string;
        vatNumber: string;
        email: string;
        phone: string;
        website: string;
    };
    buyer: InvoiceParty;
    cover: InvoiceCover;
    items: InvoiceLineItem[];
    totals: InvoiceTotals;
    payment: InvoicePayment;
    amountInWords: string;
    taxNote: string;
    terms: string;
    footerNote: string;
    notes: InvoiceNotes;
}

/** Optional extras callers may pass to `generateInvoicePdf()`. */
export interface InvoiceOptions {
    /** ISO currency code; defaults to the `general` settings currency. */
    currency?: string;
    /** Payment metadata captured by the checkout / admin flow. */
    payment?: {
        paid?: boolean;
        method?: string | null;
        reference?: string | null;
        date?: string | Date | null;
        status?: string | null;
        promoCode?: string | null;
        /** Pre-discount amount (quote `cpw`). */
        listAmount?: number | null;
        /** Final charged amount. */
        amount?: number | null;
    };
    /** Overrides for any branding field resolved from settings. */
    branding?: Partial<InvoiceBranding>;
    /** Issue date override (defaults to the payment date or `now`). */
    issuedAt?: string | Date | null;
}
