# Invoice template

Design and generation for every invoice PDF the platform produces — checkout
confirmations, admin re-downloads and the confirmation email attachment.

```
Invoice-P-…pdf        lib/invoice.ts                     ← public API
   ▲                        │
   │                        ├── lib/invoice/format.ts    text safety, wrapping, money, dates, words
   │                        ├── lib/invoice/branding.ts  `general` settings → InvoiceBranding
   │                        ├── lib/invoice/model.ts     quote + user + payment → InvoiceDocument
   │  rendered by           ├── lib/invoice/theme.ts     palette / type scale / metrics
   │                        ├── lib/invoice/primitives.ts rounded cards, waves, seals, glyphs
  └────────────────────────lib/invoice/render.ts       invoice + access page
```

## Using it

```ts
import { generateInvoicePdf, isInvoicePaid } from '@/lib/invoice';

const bytes = await generateInvoicePdf(quoteData, user, quote.policyNumber, {
    siteName,                       // optional, kept for backwards compatibility
    generalSettings,                // the `general` settings row, when already loaded
    currency,                       // optional override
    payment: {
        paid: isInvoicePaid(quote.status),
        method: quote.paymentMethod,      // 'stripe' | 'square' | 'authorize' | …
        reference: quote.paymentIntentId, // gateway transaction id
        date: quote.paymentDate,
        promoCode: quote.promoCode,
        listAmount: Number(quote.cpw),    // pre-discount price
        amount: finalAmount,              // what was actually charged
    },
});
```

The legacy signature still works unchanged — the fourth argument may be a plain
site name string, and everything new is optional:

```ts
const pdfBytes = await generateInvoicePdf(quoteData, user, policyNumber, siteName);
```

The return value is a `Uint8Array` (accepted by `NextResponse`, `Buffer.from()`
and email attachments alike). `generateInvoiceBuffer()` returns a `Buffer`.

## What the document contains

Two pages: the first contains the site-name banner, invoice number and date,
invoice/delivery recipient details, a description and amount table, subtotal,
total, and a short footer. The second contains document-access instructions
and the important information shown in the previous invoice sample.

## Design system

- `lib/invoice/theme.ts` holds every colour, size and spacing value. The brand
  colour (and its darker/lighter shades and readable text colour) come from the
  `general` settings row, so each deployment's invoice is branded automatically.
- `lib/invoice/primitives.ts` provides the drawn elements: `drawCard()`
  (rounded rectangles), `drawGradientBand()`, `drawWave()`, `drawPerforation()`,
  `drawSeal()`, `drawCheck()`, `drawSparkle()`, plus text helpers such as
  `drawTracked()` for letter-spaced uppercase labels.
- **Coordinate convention:** everything public takes *top-based* `top`
  coordinates, so template code reads top-to-bottom. `fromTop()` converts to
  pdf-lib's bottom-based axis.
- **pdf-lib gotcha:** `drawSvgPath()` mirrors the SVG y axis, so a path grows
  *downwards* from its origin. Use `drawWave()`/`drawCard()` instead of calling
  `drawSvgPath()` directly. Setting `borderWidth` without a `borderColor` makes
  pdf-lib stroke in black — `drawCard()` only passes a width when a colour is set.

## Configuration (Admin → Settings → General)

| Setting | Effect on the invoice |
| --- | --- |
| `siteName`, `companyName` | Wordmark and legal entity name |
| `logo` | Embedded logo (PNG/JPEG, `https://…` or `/uploads/…`); falls back to a typographic wordmark |
| `brandColor` | Gradient, accents, seal ring, highlights |
| `currency` | ISO code used for all money (`GBP` → `£`, `AED` → `AED`) |
| `timezone` | Date and time formatting |
| `companyAddress`, `companyRegistration`, `supportEmail`, `companyPhone`, `siteDomain` | Seller block and footer |
| `vatNumber` / `trn` / `taxNumber` | Switches the title to `TAX INVOICE` and prints the tax reference |
| `invoiceTaxRate`, `invoiceTaxLabel`, `invoiceTaxInclusive`, `invoiceTaxNote` | Optional tax line (VAT, Insurance Premium Tax, …) |
| `invoiceDueDays` | Due date for unpaid invoices |
| `invoiceTerms`, `invoiceFooterNote`, `invoiceTitle` | Text overrides |

No configuration is required: without a tax rate the invoice simply has no tax
line, and `title` defaults to `INVOICE`.

## Money & robustness rules

- Text is sanitised for the standard PDF fonts (`safeText`): emoji, Cyrillic and
  Arabic are dropped instead of throwing `UnsupportedEncodingError`, which used
  to fail the whole transaction. Non-Latin characters degrade gracefully.
- The arithmetic always balances, because the totals are derived from the amount
  actually charged: `subtotal - discount + tax = total`, `total - paid = balance due`.
- Long values wrap or truncate instead of overlapping; the totals block moves to
  a new page rather than colliding with the footer.

## Visual reference

Rendered samples live in `docs/` (regenerate with `pnpm invoice:preview`):

| File | Shows |
| --- | --- |
| `docs/invoice-template-page-1.png` | Page 1 — the invoice itself |
| `docs/invoice-template-page-2.png` | Page 2 — documents & cover information |
| `docs/invoice-template-edge-case.png` | Unicode names, long values, 12% inclusive tax, £1,212.05 |
| `docs/invoice-template-sample.pdf` | The full two-page PDF |

## Working on the template

```bash
pnpm invoice:preview   # writes tmp/invoice-preview/*.pdf (paid, unpaid, tax, edge case)
  pnpm invoice:verify    # checks helpers, arithmetic, two-page output and edge cases
```

`scripts/preview-invoice.ts` renders without a database, so design changes can
be reviewed from a single command.
