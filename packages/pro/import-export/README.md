# @unisane/import-export

Data import/export: CSV, JSON, XLSX with background jobs.

## Layer

PRO - Extended

## Features

- Export tenant data to various formats
- Import data from files or URLs
- Background job processing
- Signed download URLs for exports
- Job status tracking

## Architecture Compliance

| Pattern | Status | Notes |
|---------|--------|-------|
| `selectRepo()` | ✅ | Used in repository facade |
| `getTenantId()` | ✅ | Used in export and import services |
| `tenantFilter()` | 🔒 | N/A - explicit tenantId in queries |
| Keys builder | ✅ | `importExportKeys` in domain/keys.ts |

## Usage

```typescript
import {
  startExport,
  getExportStatus,
  startImport,
  listJobs,
} from "@unisane/import-export";

// Start export job (uses context tenantId)
const { jobId, url } = await startExport({
  resource: "users",
  format: "csv",
});

// Check export status
const status = await getExportStatus({ jobId });
if (status.status === "done") {
  // Download from status.url
}

// Start import job
const importResult = await startImport({
  resource: "users",
  format: "csv",
  source: "https://example.com/data.csv",
});

// List jobs for tenant
const { items, nextCursor } = await listJobs({ limit: 20 });
```

## Supported Formats

| Format | Export | Import |
|--------|--------|--------|
| JSON | ✅ | ✅ |
| CSV | ✅ | ✅ |
| XLSX | 🚧 | 🚧 |

## Exports

- `startExport` - Start export job
- `getExportStatus` - Get export job status
- `startImport` - Start import job
- `listJobs` - List tenant's jobs
- `importExportKeys` - Cache key builder
- `IMPORT_EXPORT_EVENTS` - Event constants
- `ImportError` / `ExportError` - Error classes
