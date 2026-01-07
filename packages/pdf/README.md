# @unisane/pdf

PDF generation from HTML templates.

## Layer

6 - Extended

## Features

- PDF rendering with page count metering
- Feature flag integration
- Subscription and credits enforcement
- Token-based quota management

## Architecture Compliance

| Pattern | Status | Notes |
|---------|--------|-------|
| `selectRepo()` | 🔒 | N/A - no database layer |
| `getTenantId()` | ✅ | Used in renderPdf |
| `tenantFilter()` | 🔒 | N/A - no database layer |
| Keys builder | ✅ | `pdfKeys` in domain/keys.ts |

## Usage

```typescript
import { renderPdf } from "@unisane/pdf";

// Render PDF (uses context tenantId)
const result = await renderPdf({
  pages: 5,
  idem: "invoice-123", // Optional idempotency key
});
// { url: "https://cdn.../renders/tenant/123.pdf", pages: 5, metering: {...} }
```

## Checks Performed

1. **Feature flag** - `FLAG.PDF_RENDER` must be enabled for tenant
2. **Active subscription** - Requires valid billing subscription
3. **Quota enforcement** - Uses `FEATURE.PDF_RENDER` tokens

## Exports

- `renderPdf` - Render PDF with metering
- `pdfKeys` - Cache key builder
- `PDF_EVENTS` - Event constants
- `PdfGenerationError` - Error class
- `TemplateNotFoundError` - Error class
- `InvalidTemplateError` - Error class
