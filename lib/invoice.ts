/**
 * Invoice generation — public entry point.
 *
 * `generateInvoicePdf()` is the stable API used by the checkout flows, the
 * confirmation emails and the admin panel:
 *
 * ```ts
 * const pdfBytes = await generateInvoicePdf(quoteData, user, policyNumber, siteName);
 * ```
 *
 * The 1500-line drawing code that used to live in this file is now a small
 * template system:
 *
 * | module                | responsibility                                        |
 * |-----------------------|-------------------------------------------------------|
 * | `invoice/format.ts`   | text safety, wrapping, money, dates, amount in words  |
 * | `invoice/branding.ts` | `general` settings → `InvoiceBranding`                |
 * | `invoice/model.ts`    | quote + user + payment → `InvoiceDocument`            |
 * | `invoice/primitives.ts`| rounded cards, gradients, seals, vector glyphs       |
 * | `invoice/render.ts`   | the two-page template                                 |
 *
 * The signature stays backwards compatible: the optional fourth argument is
 * still the site name, and everything new (currency, payment metadata,
 * branding overrides) is passed via the trailing options object. All extra
 * arguments are optional, so existing call sites keep working untouched.
 */

import { PDFDocument } from 'pdf-lib';
import { resolveInvoiceBranding } from './invoice/branding';
import { buildInvoiceDocument, paymentMethodLabel } from './invoice/model';
import { renderInvoicePdf } from './invoice/render';
import type { InvoiceBranding, InvoiceDocument, InvoiceOptions } from './invoice/types';

export type { InvoiceBranding, InvoiceDocument, InvoiceOptions };
export { buildInvoiceBranding, resolveInvoiceBranding } from './invoice/branding';
export { buildInvoiceDocument, paymentMethodLabel } from './invoice/model';
export { renderInvoicePdf } from './invoice/render';
export * from './invoice/format';

/** Payment statuses that mean "the customer has paid". */
const PAID_STATUSES = new Set(['paid', 'completed', 'complete', 'succeeded', 'settled', 'captured']);

/**
 * Whether an invoice/receipt should be watermarked and sealed as paid.
 * Accepts either the raw status string or the `payment` block of `InvoiceOptions`.
 */
export function isInvoicePaid(source: unknown): boolean {
    if (!source) return false;

    if (typeof source === 'string') {
        return PAID_STATUSES.has(source.trim().toLowerCase());
    }

    const payment = source as NonNullable<InvoiceOptions['payment']>;
    if (payment.paid === true) return true;

    return PAID_STATUSES.has(String(payment.status ?? '').trim().toLowerCase());
}

interface SellerContext {
    /** Site name from the `general` settings row (legacy argument). */
    siteName?: string;
    /** Raw `general` settings row, when the caller already loaded it. */
    generalSettings?: Record<string, any> | null;
    currency?: string;
    /** Quote row fields the invoice needs but that are not in `quoteData`. */
    payment?: InvoiceOptions['payment'];
    /** Anything else the caller wants to override (branding, issue date, ...). */
    options?: InvoiceOptions;
}

/**
 * Build the invoice PDF as a `Uint8Array`.
 *
 * @param quoteData   Parsed quote JSON (`quote.quoteData`), or a merged object.
 * @param user        User row owning the quote.
 * @param policyNumber Policy / invoice number.
 * @param siteNameOrContext Site name (legacy) or a context object.
 * @param extraOptions Optional `InvoiceOptions`.
 */
export async function generateInvoicePdf(
    quoteData: any,
    user: any,
    policyNumber: string,
    siteNameOrContext?: string | SellerContext,
    extraOptions?: InvoiceOptions
): Promise<Uint8Array> {
    const context: SellerContext =
        typeof siteNameOrContext === 'string' || siteNameOrContext === undefined
            ? { siteName: siteNameOrContext }
            : siteNameOrContext || {};

    const options: InvoiceOptions = {
        ...(context.options || {}),
        ...(extraOptions || {}),
    };

    if (!options.currency && context.currency) options.currency = context.currency;
    if (!options.payment && context.payment) options.payment = context.payment;

    const brandingOverrides: Partial<InvoiceBranding> = { ...(options.branding || {}) };
    if (context.siteName && !brandingOverrides.siteName) {
        brandingOverrides.siteName = context.siteName;
    }

    const branding = await resolveInvoiceBranding(
        brandingOverrides,
        context.generalSettings ?? undefined
    );

    const payment = {
        ...options.payment,
        paid: options.payment?.paid ?? isInvoicePaid(options.payment?.status),
    };

    const document = buildInvoiceDocument({
        quoteData,
        user,
        policyNumber,
        branding,
        options: { ...options, payment },
    });

    const pdf = await PDFDocument.create();
    await renderInvoicePdf(pdf, { document, branding });

    return pdf.save();
}

/** Create an invoice PDF as a Node `Buffer` (for email attachments). */
export async function generateInvoiceBuffer(
    quoteData: any,
    user: any,
    policyNumber: string,
    siteNameOrContext?: string | SellerContext,
    extraOptions?: InvoiceOptions
): Promise<Buffer> {
    const bytes = await generateInvoicePdf(quoteData, user, policyNumber, siteNameOrContext, extraOptions);
    return Buffer.from(bytes);
}
