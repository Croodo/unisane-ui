# @unisane/flags

Feature flags with tenant overrides and evaluation.

## Layer

**Layer 4 - Business**

## Overview

The flags module provides feature flag management:

- Boolean feature flags with default values
- Tenant-level and user-level overrides
- Rule-based evaluation (plan, country, email patterns)
- Exposure logging for analytics
- Environment-aware (dev, staging, prod)

## Installation

```bash
pnpm add @unisane/flags
```

## Usage

### Get Flag Definition

```typescript
import { getFlag, getFlags } from '@unisane/flags';

// Get single flag
const flag = await getFlag({ env: 'production', key: 'new_dashboard' });
console.log(flag.enabledDefault, flag.rules);

// Get multiple flags
const flags = await getFlags({ env: 'production', keys: ['feature_a', 'feature_b'] });
```

### Evaluate Flags for User

```typescript
import { evaluateFlags } from '@unisane/flags';

const results = await evaluateFlags({
  env: 'production',
  keys: ['new_dashboard', 'beta_feature', 'premium_only'],
  context: {
    tenantId: 'tenant_123',
    userId: 'user_456',
    email: 'user@example.com',
    country: 'US',
    plan: 'pro',
  },
});

console.log(results);
// { new_dashboard: true, beta_feature: false, premium_only: true }
```

### Check If Flag Enabled

```typescript
import { isEnabledForSubject } from '@unisane/flags';

const enabled = await isEnabledForSubject({
  env: 'production',
  key: 'new_feature',
  tenantId: 'tenant_123',
  userId: 'user_456',
  ctx: { plan: 'pro', country: 'US' },
});

if (enabled) {
  // Show new feature
}
```

### Set Override

```typescript
import { setOverride, removeOverride } from '@unisane/flags';

// Enable for specific tenant
await setOverride({
  env: 'production',
  key: 'beta_feature',
  scopeType: 'tenant',
  scopeId: 'tenant_123',
  value: true,
});

// Disable for specific user
await setOverride({
  env: 'production',
  key: 'experimental',
  scopeType: 'user',
  scopeId: 'user_456',
  value: false,
  expiresAt: new Date('2026-02-01'),
});

// Remove override
await removeOverride({
  env: 'production',
  key: 'beta_feature',
  scopeType: 'tenant',
  scopeId: 'tenant_123',
});
```

### Write Flag Definition

```typescript
import { upsertFlag } from '@unisane/flags';

const result = await upsertFlag({
  env: 'production',
  key: 'new_feature',
  enabledDefault: false,
  rules: [
    { type: 'plan', plans: ['pro', 'enterprise'], enabled: true },
    { type: 'country', countries: ['US', 'CA'], enabled: true },
  ],
  expectedVersion: 0, // Optimistic locking
});

if ('conflict' in result) {
  console.log('Version conflict, expected:', result.expected);
} else {
  console.log('Flag saved');
}
```

### Cache Keys

```typescript
import { flagsKeys } from '@unisane/flags';
import { kv } from '@unisane/kernel';

// Use standardized cache keys
const flagKey = flagsKeys.flagByEnv('production', 'new_feature');
const overrideKey = flagsKeys.overrideByScope('production', 'new_feature', 'tenant', 'tenant_123');
```

### Events

```typescript
import { events } from '@unisane/kernel';
import { FLAGS_EVENTS } from '@unisane/flags';

events.on(FLAGS_EVENTS.FLAG_EVALUATED, async ({ payload }) => {
  console.log('Flag evaluated:', payload.key, payload.value);
});

events.on(FLAGS_EVENTS.OVERRIDE_SET, async ({ payload }) => {
  console.log('Override set:', payload.key, payload.scopeType, payload.scopeId);
});
```

## Exports

### Services

| Function | Description |
|----------|-------------|
| `getFlag` | Get single flag definition |
| `getFlags` | Get multiple flag definitions |
| `upsertFlag` | Create or update flag |
| `evaluateFlags` | Evaluate flags for context |
| `isEnabledForSubject` | Check if flag enabled for subject |
| `setOverride` | Set tenant/user override |
| `removeOverride` | Remove override |

### Admin Services

| Function | Description |
|----------|-------------|
| `getTenantOverrideCounts` | Count overrides per tenant |

### Types

| Type | Description |
|------|-------------|
| `FlagRow` | Flag definition record |
| `OverrideRow` | Override record |
| `EvaluateFlagsArgs` | Arguments for evaluateFlags |
| `EvalCtx` | Evaluation context |

### Constants

| Constant | Description |
|----------|-------------|
| `FLAGS_EVENTS` | Event names |
| `FLAGS_DEFAULTS` | Default values |
| `FLAGS_COLLECTIONS` | Collection names |

### Error Classes

| Error | Description |
|-------|-------------|
| `FlagNotFoundError` | Flag doesn't exist |
| `FlagDisabledError` | Flag is disabled |
| `InvalidFlagValueError` | Invalid flag value type |

## Architecture

### Tenant Scoping Design

Flags intentionally use **explicit parameters** (not `tenantFilter()`):

- Flag definitions are platform-wide (not tenant-scoped)
- Overrides can be tenant-scoped or user-scoped
- Evaluation context is passed as arguments (supports anonymous users)
- Admin operations manage flags across tenants

### Evaluation Flow

```
1. Load flag definition (from cache or DB)
2. Check user override (if userId provided)
3. Check tenant override (if tenantId provided)
4. Evaluate rules (plan, country, email, etc.)
5. Fall back to enabledDefault
6. Log exposure (async)
```

### Data Model

```typescript
// Flag Definition (platform-wide)
{
  env: string,           // 'development' | 'staging' | 'production'
  key: string,           // Flag identifier
  enabledDefault: boolean,
  rules: Rule[],         // Evaluation rules
  snapshotVersion: number, // Optimistic locking
  updatedBy: string,
}

// Override (tenant or user scoped)
{
  env: string,
  key: string,
  scopeType: 'tenant' | 'user',
  scopeId: string,       // tenantId or userId
  value: boolean,
  expiresAt?: Date,
}

// Rule Types
{ type: 'plan', plans: PlanId[], enabled: boolean }
{ type: 'country', countries: string[], enabled: boolean }
{ type: 'email', pattern: string, enabled: boolean }
{ type: 'percentage', percent: number }
```

## Dependencies

- `@unisane/kernel` - Core utilities, KV store

## Related Modules

- `@unisane/tenants` - Tenant context
- `@unisane/analytics` - Flag exposure analytics
