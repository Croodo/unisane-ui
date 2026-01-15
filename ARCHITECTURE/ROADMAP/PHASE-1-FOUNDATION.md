# Phase 1: Foundation Fixes

> **For LLMs**: Fix critical issues in foundation layer (kernel, gateway, contracts). These are production-blocking.

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Status** | Blocked |
| **Dependencies** | Phase 0 (ports must exist) |
| **Blocks** | Phase 2 (decoupling) |
| **Issues Addressed** | K-001, BR-001, BR-002, SG-002, C-001, DT-001 |

---

## Prerequisites Check

Before starting this phase, verify:

```typescript
// These must work without throwing
import {
  getCreditsPort,
  getAuditPort,
  getUsagePort,
  getNotifyPort,
  getTenantsQueryPort
} from '@unisane/kernel';

getCreditsPort();
getAuditPort();
getUsagePort();
getNotifyPort();
getTenantsQueryPort();
```

If any throw, complete Phase 0 first.

---

## Tasks

### 1. K-001: Fix Silent Cache Fallback (CRITICAL)

**File**: `packages/foundation/kernel/src/cache/provider.ts` ~line 80

**Current (Bad)**:
```typescript
async incrBy(...): Promise<number> {
  try {
    return await http<{ result: unknown }>(...);
  } catch {
    return memoryStore.incrBy(key, by, ttlMs);  // Silent fallback!
  }
}
```

**Fix**:
```typescript
async incrBy(key: string, by: number, ttlMs?: number): Promise<number> {
  try {
    return await http<{ result: unknown }>(...);
  } catch (error) {
    logger.error('KV HTTP error, NOT falling back to memory', {
      error,
      key,
      operation: 'incrBy'
    });
    throw error;  // Don't silently degrade
  }
}
```

**Checklist**:
- [ ] Remove silent fallback to memory
- [ ] Add error logging with context
- [ ] Re-throw error to caller
- [ ] Update all cache methods: `get`, `set`, `del`, `incrBy`
- [ ] Add monitoring alert for cache errors

---

### 2. BR-001: Fix Razorpay Portal Throws (CRITICAL)

**File**: `packages/adapters/billing-razorpay/src/index.ts` lines 226-232

**Current (Bad)**:
```typescript
async createPortalSession(_args: {...}): Promise<PortalSession> {
  throw new Error('Razorpay customer portal is not supported...');
}
```

**Fix**:
```typescript
async createPortalSession(args: CreatePortalArgs): Promise<PortalSession> {
  // Razorpay doesn't have a customer portal like Stripe
  // Return dashboard URL as fallback
  return {
    id: 'razorpay-fallback',
    url: `https://dashboard.razorpay.com/app/subscriptions`,
  };
}
```

**Checklist**:
- [ ] Return fallback URL instead of throwing
- [ ] Log that fallback is being used
- [ ] Update any UI that uses this to handle fallback gracefully

---

### 3. BR-002: Fix Razorpay updatePlan Throws (CRITICAL)

**File**: `packages/adapters/billing-razorpay/src/index.ts` lines 287-298

**Option A - Implement**:
```typescript
async updateSubscriptionPlan(args: UpdatePlanArgs): Promise<Subscription> {
  const result = await this.razorpay.subscriptions.update(args.subscriptionId, {
    plan_id: args.newPlanId,
    schedule_change_at: args.immediate ? 'now' : 'cycle_end',
  });
  return this.mapToSubscription(result);
}
```

**Option B - Typed Error** (if truly not supported):
```typescript
import { FeatureNotSupportedError } from '@unisane/kernel';

async updateSubscriptionPlan(_args: UpdatePlanArgs): Promise<Subscription> {
  throw new FeatureNotSupportedError(
    'billing.updatePlan',
    'razorpay',
    'Use cancel + re-subscribe workflow instead'
  );
}
```

**Checklist**:
- [ ] Decide: implement or typed error
- [ ] If implementing, test with Razorpay sandbox
- [ ] If typed error, update UI to handle gracefully
- [ ] Add FeatureNotSupportedError to kernel if needed

---

### 4. SG-002: Add GCS Resilience (CRITICAL)

**File**: `packages/adapters/storage-gcs/src/index.ts` lines 190-192

**Current (Bad)**:
```typescript
export function createGCSStorageAdapter(config: GCSAdapterConfig): StorageProvider {
  return new GCSStorageAdapter(config);
}
```

**Fix**:
```typescript
import { createResilientAdapter, ADAPTER_RESILIENCE_STANDARD } from '@unisane/kernel';

export function createGCSStorageAdapter(config: GCSAdapterConfig): StorageProvider {
  const adapter = new GCSStorageAdapter(config);
  return createResilientAdapter('storage-gcs', adapter, {
    ...ADAPTER_RESILIENCE_STANDARD,
    timeout: { requestTimeout: 30000 }, // Larger for file uploads
  });
}
```

**Checklist**:
- [ ] Wrap adapter with `createResilientAdapter`
- [ ] Use standard resilience config
- [ ] Increase timeout for large file operations
- [ ] Test circuit breaker behavior

---

### 5. C-001: Fix ZAdminStatsQuery Duplication (CRITICAL)

**Locations**:
- `packages/foundation/contracts/src/index.ts`
- `packages/foundation/kernel/src/contracts/index.ts`
- `starters/saaskit/src/contracts/tenants.contract.ts`
- `starters/saaskit/src/contracts/users.contract.ts`

**Fix**:

Step 1: Keep canonical version in foundation
```typescript
// packages/foundation/contracts/src/index.ts
export const ZDateRangeQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  granularity: z.enum(['day', 'week', 'month']).optional(),
});
```

Step 2: Rename starter versions to be specific
```typescript
// starters/saaskit/src/contracts/tenants.contract.ts
import { ZDateRangeQuery } from '@unisane/contracts';

export const ZAdminTenantStatsQuery = z.object({
  filters: ZAdminTenantFilters.optional(),
}).merge(ZDateRangeQuery);
```

```typescript
// starters/saaskit/src/contracts/users.contract.ts
import { ZDateRangeQuery } from '@unisane/contracts';

export const ZAdminUserStatsQuery = z.object({
  filters: ZAdminUserFilters.optional(),
}).merge(ZDateRangeQuery);
```

Step 3: Delete from kernel contracts
```typescript
// packages/foundation/kernel/src/contracts/index.ts
// DELETE: export const ZAdminStatsQuery = ...
```

**Checklist**:
- [ ] Create `ZDateRangeQuery` in foundation contracts
- [ ] Rename `ZAdminStatsQuery` → `ZAdminTenantStatsQuery` in tenants.contract.ts
- [ ] Rename `ZAdminStatsQuery` → `ZAdminUserStatsQuery` in users.contract.ts
- [ ] Delete `ZAdminStatsQuery` from kernel contracts
- [ ] Update all imports to use new names
- [ ] Verify no import ambiguity

---

### 6. DT-001: Fix Silent Metadata Extraction (CRITICAL)

**File**: `packages/tooling/devtools/src/extraction/meta-extract.ts` lines 71-80

**Current (Bad)**:
```typescript
const arg = call.getArguments()[0]?.asKind(SyntaxKind.ObjectLiteralExpression);
if (!arg) continue;  // Silent skip!

const opKey = getStringProp(arg, 'op') ?? '';
if (!opKey) continue;  // Silent skip!
```

**Fix**:
```typescript
interface SkippedEntry {
  file: string;
  line: number;
  reason: string;
}

const skipped: SkippedEntry[] = [];

const arg = call.getArguments()[0]?.asKind(SyntaxKind.ObjectLiteralExpression);
if (!arg) {
  skipped.push({
    file: sf.getFilePath(),
    line: call.getStartLineNumber(),
    reason: 'Invalid argument to defineOpMeta - expected object literal'
  });
  continue;
}

const opKey = getStringProp(arg, 'op') ?? '';
if (!opKey) {
  skipped.push({
    file: sf.getFilePath(),
    line: call.getStartLineNumber(),
    reason: 'Missing "op" property in defineOpMeta'
  });
  continue;
}

// At end of extraction
if (skipped.length > 0) {
  console.warn(`⚠️  Skipped ${skipped.length} metadata entries:`);
  for (const entry of skipped) {
    console.warn(`   ${entry.file}:${entry.line} - ${entry.reason}`);
  }
}
```

**Checklist**:
- [ ] Track skipped entries with file, line, reason
- [ ] Print warning summary at end of extraction
- [ ] Include file:line for easy navigation
- [ ] Test with intentionally malformed metadata

---

## Verification

After completing all tasks:

```bash
# Build should pass
pnpm build

# No import errors for ZAdminStatsQuery
pnpm typecheck

# Routes generate without silent skips
pnpm gen:routes

# Integration tests pass
pnpm test:integration
```

---

## Success Criteria

Phase 1 is complete when:

1. Cache errors propagate (no silent fallback)
2. Razorpay methods don't throw generic errors
3. GCS adapter has resilience wrapper
4. Only ONE `ZAdminStatsQuery` exists (or renamed versions)
5. Metadata extraction reports skipped entries
6. All P0 issues marked resolved

---

## Next Phase

After Phase 1 is complete, proceed to **[PHASE-2-DECOUPLING.md](./PHASE-2-DECOUPLING.md)** to fix module coupling.

---

> **Last Updated**: 2025-01-15
