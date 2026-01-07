# @unisane/audit

Immutable audit logging with tenant isolation.

## Layer

3 - Business (Foundation)

## Features

- Append-only audit log entries
- Tenant-scoped log listing with pagination
- Admin access for cross-tenant queries
- Actor enrichment from identity module
- Batch tenant activity stats

## Architecture Compliance

| Pattern | Status | Notes |
|---------|--------|-------|
| `selectRepo()` | ✅ | Used in repository facade |
| `getTenantId()` | ✅ | Used in services (with optional override) |
| `tenantFilter()` | N/A | Explicit filter for append-only logs |
| Keys builder | ✅ | `auditKeys` in domain/keys.ts |

## Usage

```typescript
import { appendAudit, listAudit, listAuditAdmin, getTenantLastActivity } from "@unisane/audit";

// Append audit entry (uses context tenantId)
await appendAudit({
  action: "user.created",
  resourceType: "user",
  resourceId: userId,
  before: null,
  after: userData,
});

// List audit logs for current tenant
const { items, nextCursor } = await listAudit({ limit: 50 });

// Admin: list all audit logs (optional tenantId filter)
const { items: allLogs } = await listAuditAdmin({ limit: 100, tenantId: "tenant-123" });

// Get last activity per tenant (batch)
const activityMap = await getTenantLastActivity(["tenant-1", "tenant-2"]);
```

## Exports

- `appendAudit` - Append immutable audit entry
- `listAudit` - List tenant's audit logs with pagination
- `listAuditAdmin` - Admin: list all logs (optional tenant filter)
- `getTenantLastActivity` - Batch get last activity timestamps
- `auditKeys` - Cache key builder
- `AUDIT_EVENTS` - Event constants
- `AUDIT_DEFAULTS` - Default configuration
- `AUDIT_COLLECTIONS` - MongoDB collection names
