# @unisane/storage

File storage with presigned URLs, lifecycle management, and cleanup.

## Layer

2 - Foundation

## Features

- Presigned upload URLs (S3-compatible)
- Upload confirmation workflow
- Presigned download URLs
- File listing with pagination
- Soft delete with retention
- Orphan cleanup for abandoned uploads
- Tenant-scoped file isolation

## Architecture Compliance

| Pattern | Status | Notes |
|---------|--------|-------|
| `selectRepo()` | ✅ | Used in repository facade |
| `getTenantId()` | ⚠️ | Partial - some services need update |
| `tenantFilter()` | ✅ | **REFERENCE IMPLEMENTATION** |
| Keys builder | ✅ | `storageKeys` in domain/keys.ts |

## Usage

```typescript
import {
  requestUpload,
  confirmUpload,
  getDownloadUrl,
  listFiles,
  deleteFile,
  cleanupOrphanedUploads,
  cleanupDeletedFiles,
} from "@unisane/storage";

// Request presigned upload URL (uses context tenantId)
const { uploadUrl, key, fields, expiresAt } = await requestUpload({
  filename: "document.pdf",
  contentType: "application/pdf",
  sizeBytes: 1024 * 1024,
});
// Client uploads directly to uploadUrl with fields

// Confirm upload after client completes
await confirmUpload({ key });

// Get download URL
const { url, expiresAt } = await getDownloadUrl({ key });

// List tenant's files
const { items, nextCursor } = await listFiles({
  limit: 50,
  status: "confirmed",
});

// Soft delete file
await deleteFile({ key });

// Cleanup jobs (run via scheduler)
await cleanupOrphanedUploads(); // Delete unconfirmed uploads
await cleanupDeletedFiles();    // Permanently delete old soft-deleted files
```

## File Lifecycle

```
pending → confirmed → deleted (soft) → purged
   ↓
orphaned (cleanup)
```

| State | Description |
|-------|-------------|
| pending | Upload URL issued, waiting for upload |
| confirmed | Upload completed and confirmed |
| deleted | Soft deleted, retained for recovery |
| purged | Permanently deleted from storage |
| orphaned | Pending too long, cleaned up |

## Exports

- `requestUpload` - Get presigned upload URL
- `confirmUpload` - Confirm upload completion
- `getDownloadUrl` - Get presigned download URL
- `listFiles` - List tenant's files
- `deleteFile` - Soft delete file
- `cleanupOrphanedUploads` - Clean abandoned uploads
- `cleanupDeletedFiles` - Purge old deleted files
- `StorageRepo` - Repository facade
- `storageKeys` - Cache key builder
- `STORAGE_EVENTS` - Event constants
- Error classes for various failure modes
