# Event-Driven Cascade Architecture

> **For LLMs**: This document describes the event-driven cascade pattern for cross-module operations.

---

## Overview

This document covers:
1. Current cascade implementation (direct/imperative)
2. Target architecture (event-driven/reactive)
3. What infrastructure exists vs gaps
4. Implementation plan for refactoring

---

## Current State Assessment

### What You Already Have (Infrastructure) ✅

| Component | Status | Location |
|-----------|--------|----------|
| Event System | ✅ Complete | `kernel/src/events/` |
| Type-Safe Events | ✅ 40+ schemas | `events/schemas.ts` |
| Outbox Pattern | ✅ Full implementation | `kernel/src/ports/outbox.port.ts` |
| Outbox Worker | ✅ With retries/DLQ | `events/outbox-worker.ts` |
| Module Handlers | ✅ Centralized registry | `events/module-handlers.ts` |
| Reliable Emit | ✅ `emitReliable()` | `events/emitter.ts` |
| MongoDB Adapter | ✅ Production-ready | `adapters/outbox-mongodb/` |
| Jobs System | ✅ Inngest integration | `adapters/jobs-inngest/` |

### What's Now Event-Driven ✅

| Operation | Pattern | Location |
|-----------|---------|----------|
| Tenant Delete | Event-driven cascade | `tenants/service/delete-tenant.ts` → `tenant.deleted` event |
| User Delete | Event-driven cascade | `identity/service/users.ts` → `user.deleted` event |
| Subscription Cancel | Event-driven cascade | `billing/service/cancel.ts` → `billing.subscription.cancelled` |
| Plan Change | Event-driven cascade | `tenants/event-handlers.ts` → `plan.changed` event |
| Member Remove | Event-driven cascade | `identity/service/membership.ts` → `membership.removed` event |
| API Key Revoke | Event-driven | `identity/service/apiKeys.ts` → `identity.api_key.revoked` event |

---

## Problem: Current Cascade Pattern

### Tenant Delete (Current Implementation)

```
DELETE /admin/tenants/:id
         ↓
   TenantService.deleteTenant()
         ↓
   TenantsRepo.deleteCascade()
         ↓
   ┌─────┴─────┬──────────────┬─────────────────┐
   ↓           ↓              ↓                 ↓
API Keys   Memberships   Storage Files      Tenant
(revoke)   (soft-del)    (mark deleted)   (soft-del)
```

### Issues with Direct Cascade

| Issue | Impact |
|-------|--------|
| **Tight Coupling** | `TenantsRepo` knows about API keys, memberships, storage internals |
| **No Transaction** | Partial deletes on failure - data inconsistency |
| **Synchronous** | Slow response time (waits for all operations) |
| **Hard to Extend** | Adding new cascade requires modifying repository |
| **Violates Hexagonal** | Data layer reaching into other domains |
| **No Retry Logic** | Failed cascade operation not retried |
| **No Visibility** | Cascade failures logged but not surfaced |

---

## Solution: Event-Driven Cascade

### Target Architecture

```
DELETE /admin/tenants/:id
         ↓
   TenantService.deleteTenant()
         ↓
   1. Soft-delete tenant
   2. Emit: tenant.deleted event (via outbox)
         ↓
   ┌─────┴─────────────────┬─────────────────────┐
   ↓                       ↓                     ↓
IdentityModule         StorageModule        BillingModule
(subscribes)           (subscribes)         (subscribes)
   ↓                       ↓                     ↓
Revoke keys            Mark files           Preserve for
Soft-del memberships   as deleted           accounting
```

### Benefits

| Aspect | Direct (Current) | Event-Driven (Target) |
|--------|------------------|----------------------|
| **Coupling** | Tenants → all modules | Tenants → just events |
| **Extensibility** | Modify repo | Add new subscriber |
| **Failure Handling** | Stops or best-effort | Retry per subscriber |
| **Response Time** | Waits for all | Returns immediately |
| **Consistency** | Synchronous (partial on fail) | Eventual (guaranteed via outbox) |
| **Testability** | Mock all dependencies | Test handlers independently |
| **Audit Trail** | Manual logging | Natural event log |

---

## Implementation Plan

### Phase 1: Tenant Delete Cascade (Priority: Critical)

#### Current Code (to be replaced)

```typescript
// packages/modules/tenants/src/data/tenants.repository.mongo.ts
async deleteCascade(args: { scopeId: string; actorId?: string }) {
  // Direct MongoDB operations across collections
  await col(COLLECTIONS.API_KEYS).updateMany(...);     // ❌ Cross-module
  await col(COLLECTIONS.MEMBERSHIPS).updateMany(...);  // ❌ Cross-module
  await col(COLLECTIONS.FILES).updateMany(...);        // ❌ Cross-module
  await tenantsCol().updateOne(...);                   // ✅ Own domain
}
```

#### Target Code

**Step 1: Simplify TenantService**

```typescript
// packages/modules/tenants/src/service/delete-tenant.ts
export async function deleteTenant(args: DeleteTenantArgs): Promise<DeleteResult> {
  const { db, scope, tenantId, actorId } = args;

  // 1. Soft-delete the tenant (own domain only)
  await TenantsRepository.softDelete(db, { tenantId, actorId });

  // 2. Emit event via outbox (guaranteed delivery)
  await emitTypedReliable('tenant.deleted', {
    tenantId,
    scopeId: scope.tenantId,
    actorId,
    timestamp: new Date().toISOString(),
  });

  // 3. Return immediately - cascades happen async
  return {
    deleted: true,
    cascadeStatus: 'pending',
    trackingId: eventId, // For status polling
  };
}
```

**Step 2: Add Identity Module Handler**

```typescript
// packages/modules/identity/src/event-handlers.ts
import { events, onTyped } from '@unisane/kernel/events';

export function registerTenantDeletedHandler() {
  onTyped('tenant.deleted', async (event) => {
    const { tenantId, scopeId } = event.payload;
    const db = await getDatabase();

    // Revoke all API keys for this tenant
    const apiKeysResult = await ApiKeysRepository.revokeAllForScope(db, scopeId);

    // Soft-delete all memberships
    const membershipsResult = await MembershipsRepository.softDeleteAllForScope(db, scopeId);

    // Log completion
    await emitTypedReliable('identity.cascade.completed', {
      sourceEvent: 'tenant.deleted',
      tenantId,
      results: {
        apiKeysRevoked: apiKeysResult.modifiedCount,
        membershipsDeleted: membershipsResult.modifiedCount,
      },
    });
  });
}
```

**Step 3: Add Storage Module Handler**

```typescript
// packages/modules/storage/src/event-handlers.ts
import { onTyped } from '@unisane/kernel/events';

export function registerTenantDeletedHandler() {
  onTyped('tenant.deleted', async (event) => {
    const { tenantId, scopeId } = event.payload;
    const db = await getDatabase();

    // Mark all files as deleted
    const filesResult = await StorageRepository.markAllDeleted(db, scopeId);

    // Queue background job for actual file cleanup
    await jobs.enqueue('storage.cleanup.tenant', {
      scopeId,
      scheduledFor: addDays(new Date(), 30), // 30-day retention
    });

    await emitTypedReliable('storage.cascade.completed', {
      sourceEvent: 'tenant.deleted',
      tenantId,
      results: {
        filesMarked: filesResult.modifiedCount,
      },
    });
  });
}
```

**Step 4: Add Settings Module Handler**

```typescript
// packages/modules/settings/src/event-handlers.ts
import { onTyped } from '@unisane/kernel/events';

export function registerTenantDeletedHandler() {
  onTyped('tenant.deleted', async (event) => {
    const { scopeId } = event.payload;
    const db = await getDatabase();

    // Soft-delete all settings for this tenant
    const settingsResult = await SettingsRepository.softDeleteAllForScope(db, scopeId);

    await emitTypedReliable('settings.cascade.completed', {
      sourceEvent: 'tenant.deleted',
      tenantId: scopeId,
      results: {
        settingsDeleted: settingsResult.modifiedCount,
      },
    });
  });
}
```

**Step 5: Add Event Schemas**

```typescript
// packages/foundation/kernel/src/events/schemas.ts

// Add cascade completion events
export const IdentityCascadeCompletedSchema = z.object({
  sourceEvent: z.string(),
  tenantId: z.string(),
  results: z.object({
    apiKeysRevoked: z.number(),
    membershipsDeleted: z.number(),
  }),
});

export const StorageCascadeCompletedSchema = z.object({
  sourceEvent: z.string(),
  tenantId: z.string(),
  results: z.object({
    filesMarked: z.number(),
  }),
});

export const SettingsCascadeCompletedSchema = z.object({
  sourceEvent: z.string(),
  tenantId: z.string(),
  results: z.object({
    settingsDeleted: z.number(),
  }),
});

// Register in EventSchemas
export const EventSchemas = {
  // ... existing schemas
  'identity.cascade.completed': IdentityCascadeCompletedSchema,
  'storage.cascade.completed': StorageCascadeCompletedSchema,
  'settings.cascade.completed': SettingsCascadeCompletedSchema,
};
```

---

### Phase 2: User Delete Cascade (Priority: High)

#### Events Needed

```typescript
export const UserDeletedSchema = z.object({
  userId: z.string(),
  scopeId: z.string(),
  actorId: z.string().optional(),
  reason: z.enum(['user_request', 'admin_action', 'gdpr_compliance']),
});
```

#### Handler Chain

```
user.deleted
    ↓
┌───┴────────────┬─────────────────┬────────────────┐
↓                ↓                 ↓                ↓
Identity      Storage          Notify          Billing
(memberships) (user files)   (prefs)         (preserve)
```

#### Implementation

```typescript
// packages/modules/identity/src/service/delete-user.ts
export async function deleteUser(args: DeleteUserArgs): Promise<DeleteResult> {
  const { db, userId, actorId, reason } = args;

  // 1. Soft-delete user record
  await UsersRepository.softDelete(db, userId);

  // 2. Emit event
  await emitTypedReliable('user.deleted', {
    userId,
    actorId,
    reason,
  });

  return { deleted: true, cascadeStatus: 'pending' };
}

// packages/modules/identity/src/event-handlers.ts
onTyped('user.deleted', async (event) => {
  const { userId } = event.payload;

  // Soft-delete all memberships for this user
  await MembershipsRepository.softDeleteByUser(db, userId);
});

// packages/modules/storage/src/event-handlers.ts
onTyped('user.deleted', async (event) => {
  const { userId } = event.payload;

  // Mark user's personal files for deletion
  await StorageRepository.markUserFilesDeleted(db, userId);
});

// packages/modules/notify/src/event-handlers.ts
onTyped('user.deleted', async (event) => {
  const { userId } = event.payload;

  // Clear notification preferences
  await NotifyRepository.deletePreferences(db, userId);
});
```

---

### Phase 3: Subscription Cancel Cascade (Priority: High)

#### Events Needed

```typescript
export const SubscriptionCancelledSchema = z.object({
  subscriptionId: z.string(),
  tenantId: z.string(),
  reason: z.enum(['user_cancelled', 'payment_failed', 'admin_cancelled']),
  effectiveAt: z.string(), // When access should be revoked
  currentPlan: z.string(),
});
```

#### Handler Chain

```
subscription.cancelled
    ↓
┌───┴────────────┬─────────────────┬────────────────┐
↓                ↓                 ↓                ↓
Tenants       Flags            Identity         Credits
(downgrade)   (access)         (seats)          (limits)
```

#### Implementation

```typescript
// packages/modules/tenants/src/event-handlers.ts
onTyped('subscription.cancelled', async (event) => {
  const { tenantId, effectiveAt } = event.payload;

  // Downgrade to free plan at effective date
  await TenantsRepository.schedulePlanChange(db, tenantId, {
    targetPlan: 'free',
    effectiveAt,
  });
});

// packages/modules/flags/src/event-handlers.ts
onTyped('subscription.cancelled', async (event) => {
  const { tenantId, effectiveAt } = event.payload;

  // Update feature access rules
  await FlagsRepository.updateTenantAccess(db, tenantId, {
    plan: 'free',
    effectiveAt,
  });
});

// packages/modules/identity/src/event-handlers.ts
onTyped('subscription.cancelled', async (event) => {
  const { tenantId, currentPlan } = event.payload;

  // Enforce seat limits for free plan
  const freePlanSeats = await getFreePlanSeatLimit();
  await MembershipsRepository.enforceSeatLimit(db, tenantId, freePlanSeats);
});
```

---

### Phase 4: Plan Change Cascade (Priority: Medium)

#### Events Needed

```typescript
export const PlanChangedSchema = z.object({
  tenantId: z.string(),
  previousPlan: z.string(),
  newPlan: z.string(),
  changeType: z.enum(['upgrade', 'downgrade', 'lateral']),
  effectiveAt: z.string(),
});
```

#### Handler Chain

```
plan.changed
    ↓
┌───┴────────────┬─────────────────┬────────────────┐
↓                ↓                 ↓                ↓
Tenants       Flags            Usage           Credits
(limits)      (features)       (quotas)        (grants)
```

---

### Phase 5: Member Remove Cascade (Priority: Medium)

#### Events Needed

```typescript
export const MemberRemovedSchema = z.object({
  membershipId: z.string(),
  userId: z.string(),
  tenantId: z.string(),
  removedBy: z.string(),
  reason: z.enum(['left', 'removed', 'transferred']),
});
```

#### Handler Chain

```
membership.removed
    ↓
┌───┴────────────┬─────────────────┐
↓                ↓                 ↓
Audit          Notify           Usage
(log)          (inform)         (recalc)
```

---

### Phase 6: API Key Revoke Cascade (Priority: Medium)

#### Handler Chain

```
apikey.revoked
    ↓
┌───┴────────────┬─────────────────┐
↓                ↓                 ↓
Auth           Usage            Notify
(sessions)     (tracking)       (alert)
```

---

## Cascade Status Tracking

### Option A: Saga Pattern

For operations requiring cascade completion visibility:

```typescript
// packages/foundation/kernel/src/sagas/cascade-saga.ts
export interface CascadeSaga {
  id: string;
  sourceEvent: string;
  sourceId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  handlers: {
    module: string;
    status: 'pending' | 'completed' | 'failed';
    completedAt?: Date;
    result?: unknown;
    error?: string;
  }[];
  startedAt: Date;
  completedAt?: Date;
}

// Create saga when cascade starts
await CascadeSagaRepository.create({
  sourceEvent: 'tenant.deleted',
  sourceId: tenantId,
  handlers: [
    { module: 'identity', status: 'pending' },
    { module: 'storage', status: 'pending' },
    { module: 'settings', status: 'pending' },
  ],
});

// Update saga when handler completes
onTyped('identity.cascade.completed', async (event) => {
  await CascadeSagaRepository.markHandlerComplete(
    event.payload.tenantId,
    'identity',
    event.payload.results
  );
});
```

### Option B: Status Endpoint

```typescript
// GET /admin/tenants/:id/delete-status
export async function getTenantDeleteStatus(tenantId: string) {
  const saga = await CascadeSagaRepository.findBySourceId('tenant.deleted', tenantId);

  return {
    status: saga.status,
    progress: {
      total: saga.handlers.length,
      completed: saga.handlers.filter(h => h.status === 'completed').length,
    },
    handlers: saga.handlers.map(h => ({
      module: h.module,
      status: h.status,
      result: h.result,
    })),
  };
}
```

---

## Security-Critical Operations

Some cascades require synchronous execution for security:

```typescript
// Hybrid approach for tenant delete
export async function deleteTenant(args: DeleteTenantArgs) {
  // SYNC: Must complete before response (security-critical)
  await TenantsRepository.softDelete(db, tenantId);
  await ApiKeysRepository.revokeAllForScope(db, scopeId); // Immediate revocation

  // ASYNC: Via outbox (can be eventual)
  await emitTypedReliable('tenant.deleted', { tenantId, scopeId });

  return {
    deleted: true,
    apiKeysRevoked: count,
    cascadeStatus: 'pending',
  };
}
```

---

## Files to Modify

### Phase 1: Tenant Delete

```
packages/modules/tenants/
├── src/data/tenants.repository.mongo.ts  # Remove deleteCascade()
├── src/service/delete-tenant.ts          # Simplify to emit event

packages/modules/identity/
├── src/event-handlers.ts                 # Add tenant.deleted handler
├── src/data/api-keys.repository.ts       # Add revokeAllForScope()
├── src/data/memberships.repository.ts    # Add softDeleteAllForScope()

packages/modules/storage/
├── src/event-handlers.ts                 # Add tenant.deleted handler
├── src/data/storage.repository.ts        # Add markAllDeleted()

packages/modules/settings/
├── src/event-handlers.ts                 # Add tenant.deleted handler (new)
├── src/data/settings.repository.ts       # Add softDeleteAllForScope()

packages/foundation/kernel/
├── src/events/schemas.ts                 # Add cascade completion schemas
```

### Phase 2-6: Other Cascades

Similar pattern for each cascade operation.

---

## Migration Strategy

### Step 1: Add New Event Handlers (Parallel)

Deploy new event handlers alongside existing direct cascade. Both paths execute.

### Step 2: Feature Flag Transition

```typescript
const useEventCascade = await flags.evaluate('event-driven-cascade', { tenantId });

if (useEventCascade) {
  // New event-driven path
  await emitTypedReliable('tenant.deleted', payload);
} else {
  // Legacy direct cascade
  await TenantsRepo.deleteCascade(args);
}
```

### Step 3: Monitor and Validate

- Compare cascade results between old and new paths
- Monitor outbox delivery rates
- Track cascade completion times

### Step 4: Remove Legacy Code

Once validated, remove `deleteCascade()` and feature flag.

---

## Verification Commands

```bash
# Check for direct cross-module cascade calls
grep -r "COLLECTIONS\." packages/modules/tenants/src/data/*.ts

# Verify event handlers exist
grep -r "onTyped.*tenant.deleted" packages/modules/*/src/event-handlers.ts

# Check cascade completion events
grep -r "cascade.completed" packages/modules/*/src/event-handlers.ts

# Monitor outbox health
curl http://localhost:3000/admin/outbox/stats
```

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Cross-module calls in repos | 0 |
| Event handlers per cascade | 3+ (Identity, Storage, Settings) |
| Cascade completion tracking | Saga pattern implemented |
| Outbox delivery rate | 99.9% |
| Cascade failure alerts | Configured |

---

## References

- [PATTERNS.md](../PATTERNS.md) - Event emission patterns
- [REFERENCE/EVENTS.md](./EVENTS.md) - Event schema registry
- [kernel/src/events/](../../packages/foundation/kernel/src/events/) - Event system implementation

---

> **Status**: ✅ **IMPLEMENTED** - All 6 cascade phases have been refactored to event-driven architecture.
>
> **Last Updated**: 2026-01-16
