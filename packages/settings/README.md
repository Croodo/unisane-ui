# @unisane/settings

Typed key-value settings with version control, caching, and pub/sub invalidation.

## Layer

**Layer 2 - Foundation**

## Overview

The settings module provides a flexible key-value store for application configuration:

- Typed settings with Zod validation
- Optimistic locking with version control
- Redis caching with pub/sub invalidation
- Support for both platform-wide and tenant-specific settings
- Namespace-based organization

## Installation

```bash
pnpm add @unisane/settings
```

## Usage

### Reading Settings

```typescript
import { getSetting, getTypedSetting } from '@unisane/settings';

// Read a platform-wide setting
const platformTheme = await getSetting({
  ns: 'app',
  key: 'defaultTheme',
  tenantId: null, // Platform-wide
});

// Read a tenant-specific setting
const tenantTheme = await getSetting({
  ns: 'app',
  key: 'theme',
  tenantId: 'tenant_123',
});

// Read with type validation
const config = await getTypedSetting({
  ns: 'billing',
  key: 'config',
  tenantId: 'tenant_123',
  schema: billingConfigSchema, // Zod schema
});
```

### Writing Settings

```typescript
import { patchSetting, patchSettingWithPolicy } from '@unisane/settings';

// Update a setting with optimistic locking
const result = await patchSetting({
  namespace: 'app',
  key: 'theme',
  value: 'dark',
  tenantId: 'tenant_123',
  expectedVersion: 1, // Optional - for optimistic locking
  actorId: 'user_456', // Optional - for audit
});

if ('conflict' in result) {
  console.log('Version conflict, expected:', result.expected);
} else {
  console.log('Updated to version:', result.setting.version);
}

// Update with access policy check
const policyResult = await patchSettingWithPolicy({
  namespace: 'billing',
  key: 'config',
  value: { currency: 'USD' },
  tenantId: 'tenant_123',
  policy: 'admin', // Requires admin permission
});
```

### Cache Keys

```typescript
import { settingsKeys } from '@unisane/settings';
import { kv } from '@unisane/kernel';

// Invalidate specific setting cache
await kv.del(settingsKeys.setting('production', 'app', 'theme', 'tenant_123'));

// Get pattern for namespace
const pattern = settingsKeys.namespace('production', 'billing', 'tenant_123');
```

### Pub/Sub Invalidation

```typescript
import { initSettingsSubscriber } from '@unisane/settings';

// Initialize subscriber (usually in app startup)
initSettingsSubscriber();

// Settings changes are automatically propagated across instances
```

## Exports

### Services

| Function | Description |
|----------|-------------|
| `getSetting` | Read a setting value |
| `getTypedSetting` | Read with Zod validation |
| `patchSetting` | Update a setting with optional versioning |
| `patchSettingWithPolicy` | Update with access policy check |
| `initSettingsSubscriber` | Initialize cache invalidation subscriber |

### Types

| Type | Description |
|------|-------------|
| `SettingRow` | Full setting record |
| `GetSettingArgs` | Arguments for getSetting |
| `PatchSettingArgs` | Arguments for patchSetting |
| `PatchResult` | Result of patch operation |

### Constants

| Constant | Description |
|----------|-------------|
| `SETTINGS_EVENTS` | Event names for the module |
| `SETTING_VISIBILITY` | Visibility levels |
| `SETTING_NAMESPACES` | Standard namespace names |
| `SETTINGS_DEFAULTS` | Default values |

### Error Classes

| Error | Description |
|-------|-------------|
| `SettingNotFoundError` | Setting not found |
| `SettingVersionConflictError` | Version mismatch |
| `SettingAccessDeniedError` | Insufficient permissions |
| `SettingValidationError` | Invalid value |
| `UnknownNamespaceError` | Invalid namespace |

## Architecture

### Tenant Scoping Design

The settings module intentionally uses **explicit tenantId** instead of `tenantFilter()`:

- `tenantId: null` - Platform-wide settings (global defaults)
- `tenantId: string` - Tenant-specific settings (overrides)

This design allows:
1. Reading platform defaults without tenant context
2. Layered configuration (platform → tenant)
3. Admin operations across tenants

### Data Model

```typescript
{
  env: string,        // Environment (production, staging)
  tenantId: string | null,  // null for platform settings
  namespace: string,  // Logical grouping (app, billing, etc.)
  key: string,        // Setting name
  value: unknown,     // JSON-serializable value
  version: number,    // For optimistic locking
  updatedBy?: string, // Actor ID
  updatedAt?: Date,   // Last update timestamp
}
```

### Caching Strategy

1. Settings cached in Redis with 90s TTL
2. Cache invalidated on write via pub/sub
3. Cross-instance invalidation via `setting.updated` channel

## Dependencies

- `@unisane/kernel` - Core utilities, caching, pub/sub

## Related Modules

- `@unisane/flags` - Feature flags (different use case)
- `@unisane/tenants` - Tenant management
