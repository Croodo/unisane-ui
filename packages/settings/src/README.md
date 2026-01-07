# Settings Module

## Overview

The Settings module provides a robust, type-safe configuration management system with:
- **Unified Configuration**: Single source of truth in `definitions.ts`
- **Optimistic Concurrency Control (OCC)**: Version-based conflict detection
- **KV Caching**: Redis-backed cache with pub/sub invalidation
- **Scope & Visibility**: Platform, tenant, and user-level settings
- **Schema Validation**: Zod schemas ensure type safety

## Architecture

```
┌─────────────────┐
│  definitions.ts │  ← Single Source of Truth
│  (Zod schemas) │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼────┐
│Registry│  │UI Config│
└───┬──┘  └──┬────┘
    │         │
┌───▼─────────▼───┐
│   Service Layer  │
│ (read/patch)     │
└───┬──────────────┘
    │
┌───▼──────┐
│ Data Layer│
│ (MongoDB) │
└───────────┘
```

### Data Flow

**Read Path**:
1. Check KV cache (`setting:v1:{env}:{ns}:{key}:{tenantId}`)
2. If miss, fetch from MongoDB
3. Cache result with 90s TTL
4. Return `{ value, version }`

**Write Path**:
1. Validate with Zod schema from definitions
2. Check RBAC (platform-only settings require super admin)
3. Upsert to MongoDB with OCC (`expectedVersion`)
4. Delete cache key
5. Publish invalidation event via Redis pub/sub
6. Other instances receive event and invalidate their caches

## Adding a New Setting

### Step 1: Define in `definitions.ts`

```typescript
export const SETTING_DEFINITIONS = {
  "myNamespace.myKey": {
    namespace: "myNamespace",
    key: "myKey",
    scope: "platform", // or "tenant" or "user"
    visibility: "platform-only", // or "tenant-ui" or "hidden"
    schema: z.string().max(100),
    defaultValue: "default value",
    ui: {
      label: "My Setting",
      description: "What this setting controls",
      category: "runtime", // or "billing", "auth", "webhooks"
      type: "text", // or "number", "boolean", "select", "textarea", "array", "custom"
      placeholder: "Enter value...",
    },
  },
  // ... rest
} as const satisfies Record<string, SettingDefinition>;
```

### Step 2: Use in Code

**Read**:
```typescript
import { readTypedSetting } from '@/src/modules/settings';

const value = await readTypedSetting("myNamespace", "myKey", { tenantId: null });
// value is typed based on schema!
```

**Write**:
```typescript
import { patchTypedSetting } from '@/src/modules/settings';

await patchTypedSetting({
  tenantId: null,
  namespace: "myNamespace",
  key: "myKey",
  value: "new value",
  expectedVersion: 3, // for OCC
});
```

### Step 3: UI Automatically Updates

The UI in `/admin/settings` will automatically show your new setting based on the `ui` config!

## Scope & Visibility

### Scope
- **platform**: Deployment-wide (tenantId = null)
- **tenant**: Per-workspace (tenantId = <id>)
- **user**: Per-user (future)

### Visibility
- **platform-only**: Only super admins can edit (e.g., maintenance banner)
- **tenant-ui**: Tenant admins can edit in workspace settings
- **hidden**: Not shown in UI, only accessible via API

## Cache Invalidation

### How It Works

1. **Write** triggers cache delete + pub/sub publish
2. **Subscribers** (all app instances) receive message
3. Each instance deletes its local cache key
4. Next **read** fetches fresh data from MongoDB

### Cache Keys

Format: `setting:v1:{env}:{ns}:{key}:{tenantId|__platform__}`

Examples:
- `setting:v1:prod:billing:mode:__platform__`
- `setting:v1:dev:branding:name:tenant_abc123`

### TTL

Cache entries expire after **90 seconds** even without invalidation (safety net).

## Optimistic Concurrency Control (OCC)

### Why?

Prevents lost updates when multiple users edit the same setting simultaneously.

### How It Works

1. **Read** returns `{ value, version: 5 }`
2. User modifies value in UI
3. **Write** includes `expectedVersion: 5`
4. If current version in DB is still 5 → success, increment to 6
5. If current version is 6 (someone else updated) → conflict error
6. UI shows conflict, user can refresh and retry

### Example

```typescript
// User A reads
const { value, version } = await getSetting({ ... }); // version = 5

// User B also reads
const { value: valueB, version: versionB } = await getSetting({ ... }); // version = 5

// User A saves first
await patchSetting({ value: "A's value", expectedVersion: 5 }); // ✅ Success, version → 6

// User B tries to save
await patchSetting({ value: "B's value", expectedVersion: 5 }); // ❌ Conflict! Expected 5, got 6
```

## Schema Validation

All values are validated against Zod schemas before saving:

```typescript
// In definitions.ts
schema: z.number().int().min(60).max(3600)

// In UI or API
await patchTypedSetting({ value: 30 }); // ❌ Throws: "Number must be greater than or equal to 60"
await patchTypedSetting({ value: 600 }); // ✅ Success
```

## Environment Handling

Settings are scoped by environment (`dev`, `stage`, `prod`):

```typescript
// Different values per environment
await patchSetting({ env: "dev", namespace: "billing", key: "mode", value: "disabled" });
await patchSetting({ env: "prod", namespace: "billing", key: "mode", value: "subscription" });
```

## Testing

### Unit Tests
```bash
npm run test -- settings
```

### Integration Tests (with MongoDB)
```bash
npm run test:mongo -- settings
```

### Manual Testing
1. Open `/admin/settings`
2. Change a setting
3. Verify inline validation
4. Save and verify success toast
5. Refresh page and verify value persists
6. Open in another tab and verify cache invalidation

## Troubleshooting

### Setting not appearing in UI
- Check `ui` property exists in definition
- Verify `scope` and `visibility` are correct
- Check category matches a tab

### Validation errors
- Check Zod schema in definitions
- Use `safeParse` to debug: `def.schema.safeParse(value)`

### Cache not invalidating
- Check Redis pub/sub is working: `redis-cli SUBSCRIBE cfg-bus`
- Verify `initSettingsSubscriber()` is called on app startup
- Check cache key format matches between read and invalidate

### OCC conflicts
- This is expected behavior when concurrent edits occur
- UI should handle by showing error and allowing refresh
- Don't disable OCC - it prevents data loss!

## Files Reference

- `definitions.ts` - Single source of truth for all settings
- `registry.ts` - Auto-generated from definitions
- `service/read.ts` - Cache-first read with pub/sub subscription
- `service/patch.ts` - Core patch with cache invalidation
- `service/patchTyped.ts` - Schema validation wrapper
- `service/patchWithPolicy.ts` - RBAC enforcement wrapper
- `data/repo.mongo.ts` - MongoDB operations with OCC
- `data/keys.ts` - Cache key composition

## Related Documentation

- Handbook: `/docs-handbook/35-modules-internals/settings.mdx`
- Config Cache: `/docs-handbook/30-platform-internals/config-cache-bus-version.mdx`
- Implementation Plan: See analysis artifacts for recent improvements
