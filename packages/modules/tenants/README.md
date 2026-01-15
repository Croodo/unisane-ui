# @unisane/tenants

Tenant management for multi-tenant applications.

## Layer

**Layer 3 - Core**

## Overview

The tenants module provides workspace/organization management:

- Tenant CRUD operations
- Current tenant context resolution
- Cascade deletion with proper cleanup
- Admin operations (list, stats, export)
- Plan management integration

## Installation

```bash
pnpm add @unisane/tenants
```

## Usage

### Get Current Tenant

```typescript
import { getCurrentTenant } from '@unisane/tenants';

// In a route handler (after context is established)
const tenant = await getCurrentTenant();
console.log(tenant.slug, tenant.name, tenant.planId);
```

### Read Tenant

```typescript
import { readTenant, readTenantBySlug } from '@unisane/tenants';

// By ID
const tenant = await readTenant('tenant_123');

// By slug
const tenant = await readTenantBySlug('acme-corp');
```

### List Tenants

```typescript
import { listTenants } from '@unisane/tenants';

const { items, nextCursor } = await listTenants({
  limit: 20,
  sort: '-createdAt',
  filters: { q: 'acme' },
});
```

### Delete Tenant (Cascade)

```typescript
import { deleteTenant } from '@unisane/tenants';

const result = await deleteTenant({
  scopeId: 'tenant_123',
  actorId: 'user_456', // For audit
});

console.log('Deleted:', result.deleted);
console.log('Cascade:', result.cascade);
// { apiKeysRevoked: 5, membershipsDeleted: 12, storageFilesMarked: 100 }
```

### Bootstrap First Tenant

```typescript
import { bootstrapFirstTenantForUser, configureTenantBootstrap } from '@unisane/tenants';

// Configure providers (usually in app startup)
configureTenantBootstrap({
  membershipsRepo: membershipsRepository,
});

// Bootstrap first tenant for new user
const tenant = await bootstrapFirstTenantForUser({
  userId: 'user_123',
  name: 'My Workspace',
  slug: 'my-workspace',
});
```

### Cache Keys

```typescript
import { tenantKeys } from '@unisane/tenants';
import { kv } from '@unisane/kernel';

// Use standardized cache keys
const cached = await kv.get(tenantKeys.byId(scopeId));
await kv.del(tenantKeys.bySlug(slug));
```

### Events

```typescript
import { events } from '@unisane/kernel';
import { TENANT_EVENTS } from '@unisane/tenants';

events.on(TENANT_EVENTS.CREATED, async ({ payload }) => {
  console.log('New tenant:', payload.scopeId);
});

events.on(TENANT_EVENTS.DELETED, async ({ payload }) => {
  console.log('Deleted tenant:', payload.scopeId);
  console.log('Cascade results:', payload.cascade);
});
```

## Exports

### Services

| Function | Description |
|----------|-------------|
| `getCurrentTenant` | Get tenant from current context |
| `readTenant` | Read tenant by ID |
| `readTenantBySlug` | Read tenant by slug |
| `listTenants` | List tenants with pagination |
| `deleteTenant` | Cascade delete tenant |
| `bootstrapFirstTenantForUser` | Create first tenant for user |

### Admin Services

| Function | Description |
|----------|-------------|
| `adminListTenants` | List tenants (admin view) |
| `adminReadTenant` | Read tenant with full details |
| `adminExportTenants` | Export tenants to CSV |
| `adminTenantsStats` | Get tenant statistics |

### Types

| Type | Description |
|------|-------------|
| `TenantRow` | Basic tenant record |
| `TenantAdminView` | Admin view with enrichments |
| `DeleteTenantArgs` | Arguments for deleteTenant |
| `DeleteTenantResult` | Result of cascade delete |

### Constants

| Constant | Description |
|----------|-------------|
| `TENANT_EVENTS` | Event names |
| `TENANT_ROLES` | Role constants |
| `INVITATION_STATUS` | Invitation status values |
| `TENANT_DEFAULTS` | Default values |

### Error Classes

| Error | Description |
|-------|-------------|
| `TenantNotFoundError` | Tenant not found |
| `TenantSlugConflictError` | Slug already exists |
| `TenantAccessDeniedError` | Insufficient permissions |
| `LastOwnerError` | Cannot remove last owner |

## Architecture

### Tenant Scoping Design

The tenants collection is the **root entity** - it's NOT tenant-scoped:

- Tenants are the top-level organizational unit
- `tenantFilter()` is N/A for tenant queries
- Services use `getScopeId()` for context-based operations

### Cascade Deletion

When deleting a tenant, the following cascade occurs:

1. **API Keys** - Revoked immediately (security)
2. **Memberships** - Soft deleted (UX - users lose access)
3. **Storage Files** - Marked for deletion (cleanup job handles S3)
4. **Tenant** - Soft deleted

**Preserved for compliance:**
- Billing records (subscriptions, invoices, payments, credits)
- Audit logs

### Data Model

```typescript
{
  id: string,       // MongoDB ObjectId as string
  slug: string,     // URL-friendly identifier (unique)
  name: string,     // Display name
  planId: string,   // Current plan (default: 'free')
  createdAt: Date,
  updatedAt: Date,
  deletedAt?: Date, // Soft delete marker
}
```

## Dependencies

- `@unisane/kernel` - Core utilities, context, events

## Related Modules

- `@unisane/identity` - User and membership management
- `@unisane/billing` - Plan and subscription management
- `@unisane/storage` - File storage (cascade deletion)
