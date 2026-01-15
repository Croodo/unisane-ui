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
| `getScopeId()` | ✅ | Used in services (with optional override) |
| `scopeFilter()` | N/A | Explicit filter for append-only logs |
| Keys builder | ✅ | `auditKeys` in domain/keys.ts |

## Usage

```typescript
import { appendAudit, listAudit, listAuditAdmin, getScopeLastActivity } from "@unisane/audit";

// Append audit entry (uses context scopeId)
await appendAudit({
  action: "user.created",
  resourceType: "user",
  resourceId: userId,
  before: null,
  after: userData,
});

// List audit logs for current scope
const { items, nextCursor } = await listAudit({ limit: 50 });

// Admin: list all audit logs (optional scopeId filter)
const { items: allLogs } = await listAuditAdmin({ limit: 100, scopeId: "scope-123" });

// Get last activity per scope (batch)
const activityMap = await getScopeLastActivity(["scope-1", "scope-2"]);
```

## Exports

- `appendAudit` - Append immutable audit entry
- `listAudit` - List scope's audit logs with pagination
- `listAuditAdmin` - Admin: list all logs (optional scope filter)
- `getScopeLastActivity` - Batch get last activity timestamps
- `auditKeys` - Cache key builder
- `AUDIT_EVENTS` - Event constants
- `AUDIT_DEFAULTS` - Default configuration
- `AUDIT_COLLECTIONS` - MongoDB collection names
