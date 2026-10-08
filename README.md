# tempnow_xyz

## Invoice template

Invoices are generated as vector PDFs by `lib/invoice.ts` (see
[`lib/invoice/README.md`](lib/invoice/README.md) for the design system and
configuration reference).

```bash
pnpm invoice:preview   # render sample invoices to tmp/invoice-preview/
pnpm invoice:verify    # 57 checks covering helpers, arithmetic and edge cases
```

Rendered examples: `docs/invoice-template-page-1.png` and `docs/invoice-template-page-2.png`.
