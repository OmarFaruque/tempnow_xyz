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
   └────────────────────────lib/invoice/render.ts       the two-page template
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

**Page 1 — the invoice**

| Block | Notes |
| --- | --- |
| Masthead | Brand gradient, aurora waves, ticket-perforated edge, logo plate, document title, status chip |
| Billed to / Invoice details | Customer block and invoice number, issue date, due date, payment method and reference |
| Policy & vehicle | Vehicle, registration, cover period, cover reason, licence |
| Amount card | Total, amount in words, tax note, wax-seal PAID / DUE stamp |
| Charges table | Description, quantity, unit price, amount; discount rows are highlighted; continues onto new pages when long |
| Totals | Subtotal, discount, tax, total, amount paid, balance due (dark pill echoes the hero card) |
| Footer | Legal entity, registration/VAT, support email, website, page number, generation timestamp |

**Page 2 — documents & cover information**

Recap card, payment summary + terms, "how to access your documents" steps,
"what's included" checklist, "important information" bullets and a help card.

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

## Masthead layout rules

Page 1 and page 2 use the same rule set, so nothing can overlap:

1. `drawLogoPlate()` returns its own geometry (`{ x, top, width, height, right }`)
   and is capped at a share of the page width — **46% on page 1, 40% on page 2**
   (`drawMasthead` / `drawCompactMasthead`). The wordmark also shrinks to fit the
   plate, and logo art is scaled to fit inside it.
2. The right-hand column (document title, heading, invoice reference, status
   chip) always starts at `plate.right + MASTHEAD_TITLE_GAP` (18pt).
3. `fitMastheadTitle()` fits the title into that column: keep the preferred size
   and wrap onto up to two lines, shrink down to a minimum size, then truncate.
   It is exported and font-agnostic, so `pnpm invoice:verify` unit tests the
   geometry directly.

Increasing `maxWidth` on those two calls is the only knob needed if a site's
logo wants more room.

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
| `docs/invoice-template-wide-logo-page-2.png` | Page 2 with a wide (2.89:1) logo — the title wraps instead of overlapping |
| `docs/invoice-template-edge-case.png` | Unicode names, long values, 12% inclusive tax, £1,212.05 |
| `docs/invoice-template-sample.pdf` | The full two-page PDF |

## Working on the template

```bash
pnpm invoice:preview   # writes tmp/invoice-preview/*.pdf (paid, unpaid, tax, edge case)
pnpm invoice:verify    # 57 checks: helpers, arithmetic, page counts, adversarial inputs
```

`scripts/preview-invoice.ts` renders without a database, so design changes can
be reviewed from a single command.
