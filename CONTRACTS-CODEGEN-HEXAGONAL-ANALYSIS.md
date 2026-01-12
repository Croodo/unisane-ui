# Contracts & Codegen Impact Analysis: Hexagonal Architecture Migration

**Document Purpose:** Deep analysis of how hexagonal architecture changes affect contracts, codegen, and devtools.

**Date:** January 2026
**Status:** Analysis Complete

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Contracts System](#current-contracts-system)
3. [Impact Analysis](#impact-analysis)
4. [Required Changes](#required-changes)
5. [Event Contracts (NEW)](#event-contracts-new)
6. [Scope Context Changes](#scope-context-changes)
7. [Service Mapping Updates](#service-mapping-updates)
8. [Codegen Generator Updates](#codegen-generator-updates)
9. [Migration Checklist](#migration-checklist)
10. [Examples: Before vs After](#examples-before-vs-after)

---

## Executive Summary

### Impact Level: 🟡 MEDIUM (Manageable, Mostly Additive)

The hexagonal architecture migration will affect the contracts and codegen system, but the changes are **mostly additive** rather than breaking. Here's what changes:

| Component | Impact | Effort |
|-----------|--------|--------|
| **Event Contracts** | ✨ NEW - Need to create | 2-3 days |
| **Scope Context** | 🟡 Update `OpMeta` and codegen | 1-2 days |
| **Service Mappings** | 🟢 Minimal (services remain same) | 0.5 days |
| **Route Codegen** | 🟡 Update to use `getScope()` | 1-2 days |
| **SDK Codegen** | 🟢 No changes (client-side unaffected) | 0 days |
| **Type Codegen** | 🟢 No changes | 0 days |
| **Hook Codegen** | 🟢 No changes | 0 days |
| **Total Effort** | | **5-8 days** |

### Good News

1. **REST Contracts Unchanged** - API routes, request/response schemas stay the same
2. **SDK Generation Unchanged** - Client hooks, types, browser client all work as-is
3. **Service Functions Unchanged** - Business logic functions keep same signatures
4. **Codegen Architecture Solid** - Just need parameter updates, not rewrites

### What's New

1. **Event Contracts** - New system for type-safe event schemas (separate from REST)
2. **Scope Context** - `getTenantId()` → `getScope()` in generated routes
3. **Event Codegen** (Optional) - Could generate event listener registration

---

## Current Contracts System

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Current System (January 2026)            │
└─────────────────────────────────────────────────────────────┘

1. REST API Contracts (ts-rest)
   ├── starters/saaskit/src/contracts/*.contract.ts
   │   ├── billing.contract.ts      (22 operations)
   │   ├── credits.contract.ts      (8 operations)
   │   ├── tenants.contract.ts      (12 operations)
   │   └── ... (19 more contracts)
   │
   ├── app.router.ts                (Root router composition)
   └── meta.ts                      (OpMeta types + withMeta helper)

2. Codegen Generators
   ├── routes:gen                   (Next.js API route handlers)
   │   ├── packages/tooling/devtools/src/generators/routes/
   │   │   ├── render.ts           (Route handler template)
   │   │   ├── imports.ts          (Import management)
   │   │   └── params.ts           (Parameter extraction)
   │   └── Output: app/api/rest/v1/**/*.ts
   │
   └── sdk:gen                      (Client SDK + React Query hooks)
       ├── packages/tooling/devtools/src/generators/sdk/
       │   ├── clients.ts          (Browser + server clients)
       │   ├── hooks.ts            (React Query hooks)
       │   ├── types.ts            (TypeScript type extraction)
       │   └── keys.ts             (Query key factories)
       └── Output: src/sdk/

3. Service Layer
   └── packages/modules/*/src/service/*.ts
       └── Functions called by generated routes
```

### Key Characteristics

**1. REST-First Design**
- All contracts define HTTP endpoints (GET, POST, PATCH, DELETE)
- Each operation has: `method`, `path`, `body`, `query`, `responses`
- Type-safe end-to-end from frontend to backend

**2. Metadata-Driven**
```typescript
withMeta(
  { /* ts-rest definition */ },
  defineOpMeta({
    op: "billing.subscribe",
    requireUser: true,
    requireTenantMatch: true,
    service: {
      importPath: "@unisane/billing",
      fn: "subscribe",
      invoke: "object",
      callArgs: [
        { name: "tenantId", from: "params", key: "tenantId" },
        { name: "planId", from: "body", key: "planId" },
      ],
    },
  })
)
```

**3. Code Generation**
- **Routes:** AST-based generation, reads `OpMeta`, generates `makeHandler()` calls
- **SDK:** Extracts types from Zod schemas, generates React Query hooks
- **Types:** Browser-safe TypeScript types from Zod schemas

---

## Impact Analysis

### 1. REST API Contracts: 🟢 **NO CHANGES**

**Why No Changes:**
- REST API surface remains identical
- Request/response types unchanged
- Path structure unchanged (still tenant-scoped: `/api/rest/v1/tenants/:tenantId/...`)

**Example:**
```typescript
// billing.contract.ts - BEFORE hexagonal architecture
subscribe: withMeta(
  {
    method: "POST",
    path: "/api/rest/v1/tenants/:tenantId/billing/subscribe",
    pathParams: z.object({ tenantId: z.string() }),
    body: ZSubscribe,
    responses: { 200: z.object({ ok: z.literal(true), data: z.object({ url: z.string() }) }) },
  },
  defineOpMeta({
    op: "billing.subscribe",
    requireUser: true,
    requireTenantMatch: true,
    service: {
      importPath: "@unisane/billing",
      fn: "subscribe",
      invoke: "object",
      callArgs: [
        { name: "tenantId", from: "params", key: "tenantId" },
        { name: "planId", from: "body", key: "planId" },
      ],
    },
  })
)

// billing.contract.ts - AFTER hexagonal architecture
// ✅ EXACTLY THE SAME!
// API contracts don't change because:
// - External API surface must remain stable
// - tenantId still comes from URL path
// - Service layer handles scope internally
```

**Verification:**
```bash
# No contract files need to be updated
git diff starters/saaskit/src/contracts/*.contract.ts
# (Should show no changes)
```

---

### 2. Event Contracts: ✨ **NEW SYSTEM REQUIRED**

**Why New:**
- Hexagonal architecture introduces event-driven communication
- Modules emit events instead of calling each other directly
- Need type-safe event schemas (like REST contracts, but for events)

**What's Needed:**
1. **Event schema definitions** (Zod schemas for each event)
2. **Event contract registry** (central place to define all events)
3. **Type generation** (TypeScript types from event schemas)
4. **(Optional) Event listener codegen** (auto-generate event handler registration)

**Where to Create:**
```
packages/foundation/kernel/src/events/
├── contracts/                              # ✨ NEW: Event contract definitions
│   ├── index.ts                            # Barrel export + EventMap type
│   ├── billing.events.ts                   # Billing event schemas
│   ├── credits.events.ts                   # Credits event schemas
│   ├── storage.events.ts                   # Storage event schemas
│   ├── notify.events.ts                    # Notify event schemas
│   ├── webhooks.events.ts                  # Webhooks event schemas
│   ├── audit.events.ts                     # Audit event schemas
│   └── ... (one file per module)
│
└── index.ts                                # Event emitter (already exists)
```

**Example Event Contract:**
```typescript
// packages/foundation/kernel/src/events/contracts/billing.events.ts
import { z } from 'zod';

/**
 * Emitted when a payment succeeds
 * Emitter: billing module (after Stripe webhook processed)
 * Listeners: credits (grant credits), notify (send receipt), audit (log)
 */
export const BillingPaymentSucceededEvent = z.object({
  type: z.literal('billing.payment.succeeded'),
  payload: z.object({
    scopeId: z.string().min(1),
    scopeType: z.enum(['tenant', 'user', 'merchant']),
    amount: z.number().positive(),
    currency: z.string().length(3).toUpperCase(),
    providerPaymentId: z.string().min(1),
    metadata: z.record(z.unknown()).optional(),
  }),
  timestamp: z.number(),
  requestId: z.string().uuid(),
});

export type BillingPaymentSucceededEvent = z.infer<typeof BillingPaymentSucceededEvent>;

/**
 * Emitted when a subscription is created
 */
export const BillingSubscriptionCreatedEvent = z.object({
  type: z.literal('billing.subscription.created'),
  payload: z.object({
    scopeId: z.string(),
    scopeType: z.enum(['tenant', 'user', 'merchant']),
    subscriptionId: z.string(),
    planId: z.string(),
    amount: z.number(),
  }),
  timestamp: z.number(),
  requestId: z.string().uuid(),
});

export type BillingSubscriptionCreatedEvent = z.infer<typeof BillingSubscriptionCreatedEvent>;

/**
 * Emitted when a refund is processed
 */
export const BillingRefundProcessedEvent = z.object({
  type: z.literal('billing.refund.processed'),
  payload: z.object({
    scopeId: z.string(),
    amount: z.number(),
    providerPaymentId: z.string(),
  }),
  timestamp: z.number(),
  requestId: z.string().uuid(),
});

export type BillingRefundProcessedEvent = z.infer<typeof BillingRefundProcessedEvent>;
```

**Event Map (Type Registry):**
```typescript
// packages/foundation/kernel/src/events/contracts/index.ts
import { z } from 'zod';
import {
  BillingPaymentSucceededEvent,
  BillingSubscriptionCreatedEvent,
  BillingRefundProcessedEvent,
} from './billing.events';
import {
  CreditsGrantedEvent,
  CreditsConsumedEvent,
  CreditsDepletedEvent,
} from './credits.events';
// ... import all event schemas

/**
 * EventMap: Type-safe registry of all events
 * Used by event emitter for type checking
 */
export type EventMap = {
  // Billing events
  'billing.payment.succeeded': z.infer<typeof BillingPaymentSucceededEvent>;
  'billing.subscription.created': z.infer<typeof BillingSubscriptionCreatedEvent>;
  'billing.refund.processed': z.infer<typeof BillingRefundProcessedEvent>;

  // Credits events
  'credits.granted': z.infer<typeof CreditsGrantedEvent>;
  'credits.consumed': z.infer<typeof CreditsConsumedEvent>;
  'credits.depleted': z.infer<typeof CreditsDepletedEvent>;

  // Storage events
  'storage.file.uploaded': z.infer<typeof StorageFileUploadedEvent>;
  'storage.file.deleted': z.infer<typeof StorageFileDeletedEvent>;

  // Notify events
  'notify.email.sent': z.infer<typeof NotifyEmailSentEvent>;
  'notify.email.failed': z.infer<typeof NotifyEmailFailedEvent>;

  // Webhooks events
  'webhook.received': z.infer<typeof WebhookReceivedEvent>;
  'webhook.processed': z.infer<typeof WebhookProcessedEvent>;

  // Audit events (special - listens to ALL)
  // ... all other events
};

// Export all event schemas
export * from './billing.events';
export * from './credits.events';
export * from './storage.events';
export * from './notify.events';
export * from './webhooks.events';
export * from './audit.events';
```

**Type-Safe Event Emitter:**
```typescript
// packages/foundation/kernel/src/events/index.ts (ENHANCED)
import type { EventMap } from './contracts';

class TypedEventEmitter {
  async emit<K extends keyof EventMap>(
    eventName: K,
    payload: EventMap[K]['payload']
  ): Promise<void> {
    // Validate payload against schema
    const schema = getEventSchema(eventName);
    const validated = schema.parse({
      type: eventName,
      payload,
      timestamp: Date.now(),
      requestId: crypto.randomUUID(),
    });

    // Emit to all listeners
    await this.emitInternal(eventName, validated);
  }

  on<K extends keyof EventMap>(
    eventName: K,
    handler: (event: EventMap[K]) => Promise<void>
  ): void {
    // Register listener
    this.onInternal(eventName, handler);
  }

  // ... implementation
}

export const events = new TypedEventEmitter();
```

**Benefits:**
1. **Type Safety** - Compile-time errors if event payload wrong
2. **Schema Validation** - Runtime validation via Zod
3. **Documentation** - Event contracts serve as documentation
4. **Versioning** - Can version events (e.g., `billing.payment.succeeded.v2`)

**Effort Estimate:** 2-3 days
- Define ~50-70 event schemas across all modules
- Create EventMap type registry
- Update event emitter for type safety
- Write tests

---

### 3. Scope Context Changes: 🟡 **UPDATE REQUIRED**

**Problem:**
Generated route handlers currently use `getTenantId()` from context:

```typescript
// Generated route (BEFORE hexagonal)
export const POST = makeHandler(
  { op: "billing.subscribe", requireUser: true, requireTenantMatch: true },
  async ({ ctx, params, body }) => {
    const tenantId = ctx.tenantId;  // ❌ Hard-coded tenant scope
    return await subscribe({ tenantId, ...body });
  }
);
```

**Solution:**
Update route codegen to use `getScope()`:

```typescript
// Generated route (AFTER hexagonal)
import { getScope } from '@unisane/kernel';

export const POST = makeHandler(
  { op: "billing.subscribe", requireUser: true, requireTenantMatch: true },
  async ({ ctx, params, body }) => {
    const scope = getScope();  // ✅ Universal scope
    // For backward compatibility: tenantId = scope.type === 'tenant' ? scope.id : null
    return await subscribe({ tenantId: scope.id, ...body });
  }
);
```

**What Needs to Change:**

#### 3.1. Update `OpMeta` Type (meta.ts)

**File:** `starters/saaskit/src/contracts/meta.ts`

```typescript
// BEFORE
export type OpMeta = {
  op: string;
  requireTenantMatch?: boolean;  // Uses ctx.tenantId
  // ...
};

// AFTER
export type OpMeta = {
  op: string;
  requireTenantMatch?: boolean;    // Now uses getScope()
  requireScopeType?: 'tenant' | 'user' | 'merchant';  // ✨ NEW: Validate scope type
  // ...
};
```

#### 3.2. Update Route Generator (render.ts)

**File:** `packages/tooling/devtools/src/generators/routes/render.ts`

**Change 1: Import `getScope()`**
```typescript
// BEFORE
imports.add(opts.gatewayPath, 'makeHandler');

// AFTER
imports.add(opts.gatewayPath, 'makeHandler');
imports.add('@unisane/kernel', 'getScope');  // ✨ NEW: Add scope import
```

**Change 2: Generate scope access code**
```typescript
// BEFORE (in renderRouteHandler)
const beforeCall: string[] = [];
// No scope handling

// AFTER
const beforeCall: string[] = [];

// Add scope extraction if needed
const needsScope = cfg.callArgs?.some(arg => arg.from === 'scope') || cfg.requireScopeType;
if (needsScope || cfg.requireTenantMatch) {
  beforeCall.push('const __scope = getScope();');

  // Validate scope type if specified
  if (cfg.requireScopeType) {
    beforeCall.push(
      `if (__scope.type !== '${cfg.requireScopeType}') {`,
      `  throw new Error('Invalid scope type: expected ${cfg.requireScopeType}, got ' + __scope.type);`,
      `}`
    );
  }

  // Backward compatibility: extract tenantId for requireTenantMatch
  if (cfg.requireTenantMatch) {
    beforeCall.push(
      `const __tenantId = __scope.type === 'tenant' ? __scope.id : null;`,
      `if (!__tenantId) throw new Error('Tenant scope required');`
    );
  }
}
```

**Change 3: Update callArgs generation**
```typescript
// BEFORE
callArgs: [
  { name: "tenantId", from: "params", key: "tenantId" },
  { name: "planId", from: "body", key: "planId" },
]

// AFTER (supports 'scope' source)
callArgs: [
  { name: "tenantId", from: "scope", key: "id" },  // ✨ NEW: from: 'scope'
  { name: "planId", from: "body", key: "planId" },
]

// Generated code:
const __arg_tenantId = __scope.id;
const __arg_planId = __body.planId;
```

#### 3.3. Update Contract Definitions (Optional - Backward Compatible)

**Contracts can OPTIONALLY specify scope usage:**

```typescript
// Option 1: Keep using params (backward compatible)
subscribe: withMeta(
  {
    path: "/api/rest/v1/tenants/:tenantId/billing/subscribe",
    pathParams: z.object({ tenantId: z.string() }),
  },
  defineOpMeta({
    requireTenantMatch: true,  // Still works, uses ctx.tenantId from params
    service: {
      callArgs: [
        { name: "tenantId", from: "params", key: "tenantId" },  // ✅ Still works
      ],
    },
  })
)

// Option 2: Use scope directly (new way)
subscribe: withMeta(
  {
    path: "/api/rest/v1/billing/subscribe",  // No tenantId in path
  },
  defineOpMeta({
    requireScopeType: 'tenant',  // ✨ NEW: Require tenant scope
    service: {
      callArgs: [
        { name: "scopeId", from: "scope", key: "id" },  // ✨ NEW: from: 'scope'
        { name: "scopeType", from: "scope", key: "type" },
      ],
    },
  })
)
```

**Impact:** Minimal - Existing contracts work as-is, new option available for future

**Effort Estimate:** 1-2 days
- Update `OpMeta` type
- Update route generator (`render.ts`)
- Add tests for scope generation
- (Optional) Update some contracts to use scope directly

---

### 4. Service Mapping: 🟢 **NO CHANGES (Almost)**

**Good News:** Service layer remains the same!

**Why:**
- Service functions keep their signatures
- REST endpoints still call the same service functions
- Only internal implementation changes (events, scope)

**Example:**

```typescript
// packages/modules/billing/src/service/subscribe.ts

// BEFORE hexagonal
export async function subscribe(args: {
  tenantId: string;
  planId: string;
  quantity?: number;
  successUrl: string;
  cancelUrl: string;
}) {
  // Implementation
}

// AFTER hexagonal
// ✅ SAME SIGNATURE! (for backward compatibility)
export async function subscribe(args: {
  tenantId: string;  // Or scopeId - still string
  planId: string;
  quantity?: number;
  successUrl: string;
  cancelUrl: string;
}) {
  // Internal implementation changed:
  // - Uses getScope() instead of getTenantId()
  // - Emits events instead of calling other modules
  // But external interface unchanged!
}
```

**Contract service mapping unchanged:**
```typescript
service: {
  importPath: "@unisane/billing",
  fn: "subscribe",  // ✅ Same function name
  invoke: "object",
  callArgs: [
    { name: "tenantId", from: "params", key: "tenantId" },
    { name: "planId", from: "body", key: "planId" },
    // ✅ Same arguments
  ],
}
```

**Minor Change (Optional):**
Services can now accept `scope` instead of `tenantId`:

```typescript
// NEW OPTION: Accept scope directly
export async function subscribe(args: {
  scopeId: string;    // Instead of tenantId
  scopeType: ScopeType;  // NEW: Type information
  planId: string;
  // ...
}) {
  const scope = { type: args.scopeType, id: args.scopeId };
  // Use scope internally
}
```

**Effort Estimate:** 0.5 days (documentation updates only)

---

### 5. SDK Codegen: 🟢 **NO CHANGES**

**Why No Changes:**
- Client-side API remains identical
- Request/response types unchanged
- React Query hooks still work
- Browser client unchanged

**Verification:**
```typescript
// Frontend code - BEFORE hexagonal
const subscribe = useBillingSubscribe({
  onSuccess: (data) => {
    toast.success('Subscription started!');
  },
});

subscribe.mutate({
  tenantId: 'tenant_123',
  planId: 'pro',
  successUrl: '/dashboard',
  cancelUrl: '/pricing',
});

// Frontend code - AFTER hexagonal
// ✅ EXACTLY THE SAME!
const subscribe = useBillingSubscribe({
  onSuccess: (data) => {
    toast.success('Subscription started!');
  },
});

subscribe.mutate({
  tenantId: 'tenant_123',  // Still accepts tenantId
  planId: 'pro',
  successUrl: '/dashboard',
  cancelUrl: '/pricing',
});
```

**Generated files unchanged:**
- `src/sdk/clients/generated/browser.ts` - No changes
- `src/sdk/hooks/generated/domains/*.hooks.ts` - No changes
- `src/sdk/types/generated/*.types.ts` - No changes
- `src/sdk/hooks/generated/keys.ts` - No changes

**Effort Estimate:** 0 days

---

### 6. Type Generation: 🟢 **NO CHANGES**

**Why No Changes:**
- Type extraction from Zod schemas unchanged
- Request/response types unchanged
- TypeScript interfaces unchanged

**Verification:**
```typescript
// Generated types - BEFORE hexagonal
export type BillingSubscribeRequest = {
  tenantId: string;
  planId: string;
  quantity?: number;
  successUrl: string;
  cancelUrl: string;
};

// Generated types - AFTER hexagonal
// ✅ EXACTLY THE SAME!
export type BillingSubscribeRequest = {
  tenantId: string;
  planId: string;
  quantity?: number;
  successUrl: string;
  cancelUrl: string;
};
```

**Effort Estimate:** 0 days

---

### 7. Hook Generation: 🟢 **NO CHANGES**

**Why No Changes:**
- React Query hooks unchanged
- Mutation/query patterns unchanged
- Cache invalidation unchanged

**Effort Estimate:** 0 days

---

## Required Changes

### Priority 1: Critical (Must Do)

#### 1. Create Event Contracts System

**Files to Create:**
```
packages/foundation/kernel/src/events/contracts/
├── index.ts                    # EventMap + barrel exports
├── billing.events.ts           # Billing event schemas
├── credits.events.ts           # Credits event schemas
├── storage.events.ts           # Storage event schemas
├── notify.events.ts            # Notify event schemas
├── webhooks.events.ts          # Webhooks event schemas
├── audit.events.ts             # Audit event schemas
├── auth.events.ts              # Auth event schemas
├── tenants.events.ts           # Tenants event schemas
├── usage.events.ts             # Usage event schemas
└── ... (one per module)
```

**Checklist:**
- [ ] Define event schemas for all modules (~50-70 events)
- [ ] Create EventMap type registry
- [ ] Update event emitter for type safety
- [ ] Add Zod validation to event emission
- [ ] Write tests for event validation
- [ ] Document event contracts (similar to REST contracts guide)

**Effort:** 2-3 days

---

#### 2. Update Route Generator for Scope Context

**Files to Update:**
- `packages/tooling/devtools/src/generators/routes/render.ts`
- `packages/tooling/devtools/src/generators/routes/params.ts`
- `starters/saaskit/src/contracts/meta.ts`

**Changes:**
```typescript
// meta.ts
export type OpMeta = {
  // ... existing fields
  requireScopeType?: 'tenant' | 'user' | 'merchant';  // ✨ NEW
  service?: {
    // ... existing fields
    callArgs?: ReadonlyArray<{
      name: string;
      from: "params" | "query" | "body" | "ctx" | "const" | "scope";  // ✨ ADD 'scope'
      key?: string;
      // ... rest unchanged
    }>;
  };
};
```

```typescript
// render.ts
// Add scope handling
const needsScope = cfg.callArgs?.some(arg => arg.from === 'scope') || cfg.requireScopeType;
if (needsScope) {
  imports.add('@unisane/kernel', 'getScope');
  beforeCall.push('const __scope = getScope();');

  if (cfg.requireScopeType) {
    beforeCall.push(
      `if (__scope.type !== '${cfg.requireScopeType}') {`,
      `  throw new Error('Invalid scope type');`,
      `}`
    );
  }
}

// Update generateValueAccessor for 'scope' source
// In params.ts
function generateValueAccessor(arg: CallArg): string {
  switch (arg.from) {
    case 'scope':
      return `__scope${arg.key ? `.${arg.key}` : ''}`;
    // ... rest unchanged
  }
}
```

**Checklist:**
- [ ] Add `requireScopeType` to `OpMeta` type
- [ ] Add `'scope'` to `callArgs.from` union type
- [ ] Update `render.ts` to import `getScope()`
- [ ] Update `render.ts` to generate scope extraction
- [ ] Update `params.ts` to handle 'scope' source
- [ ] Add tests for scope generation
- [ ] Update docs (contracts-guide.md)

**Effort:** 1-2 days

---

### Priority 2: Nice to Have (Optional)

#### 3. Event Listener Codegen (Optional)

**Purpose:** Auto-generate event handler registration like we generate routes

**Files to Create:**
```
packages/tooling/devtools/src/generators/events/
├── index.ts                    # Main entry point
├── render.ts                   # Event handler template
└── registry.ts                 # Event listener registry
```

**What It Would Generate:**

**Input:**
```typescript
// packages/modules/credits/src/event-handlers.ts (MANUALLY WRITTEN)
import { events } from '@unisane/kernel';
import { grant } from './service/grant';

export function registerCreditEventHandlers() {
  events.on('billing.payment.succeeded', async (event) => {
    await grant({
      scopeId: event.payload.scopeId,
      amount: event.payload.amount * 10,
      reason: 'payment_received',
    });
  });

  events.on('billing.refund.processed', async (event) => {
    await deduct({
      scopeId: event.payload.scopeId,
      amount: event.payload.amount * 10,
      reason: 'payment_refunded',
    });
  });
}
```

**Output (If We Had Event Codegen):**
```typescript
// packages/modules/credits/src/event-handlers.gen.ts (AUTO-GENERATED)
/* AUTO-GENERATED by 'events:gen' - DO NOT EDIT */

import { events } from '@unisane/kernel';
import type { EventMap } from '@unisane/kernel';
import { grant } from './service/grant';
import { deduct } from './service/deduct';

export function registerCreditEventHandlers() {
  events.on<'billing.payment.succeeded'>('billing.payment.succeeded', async (event) => {
    // Type-safe: event is EventMap['billing.payment.succeeded']
    await grant({
      scopeId: event.payload.scopeId,
      amount: event.payload.amount * 10,
      reason: 'payment_received',
    });
  });

  events.on<'billing.refund.processed'>('billing.refund.processed', async (event) => {
    await deduct({
      scopeId: event.payload.scopeId,
      amount: event.payload.amount * 10,
      reason: 'payment_refunded',
    });
  });
}
```

**Benefits:**
- Type safety for event handlers
- Centralized registration
- Easy to see all event listeners

**Downsides:**
- More codegen complexity
- Event handlers are simple enough to write manually
- Not much value compared to REST route codegen

**Recommendation:** Skip for now, revisit if needed

**Effort (If Implemented):** 3-4 days

---

#### 4. Event Contract Documentation Generator

**Purpose:** Generate markdown docs from event contracts (like REST API docs)

**What It Would Generate:**

```markdown
# Event Contracts Reference

## Billing Events

### billing.payment.succeeded

**Emitted by:** `billing` module (after Stripe webhook processed)

**Listeners:**
- `credits` - Grants credits based on payment amount
- `notify` - Sends payment receipt email
- `audit` - Logs payment event

**Payload:**
```typescript
{
  scopeId: string;
  scopeType: 'tenant' | 'user' | 'merchant';
  amount: number;
  currency: string;
  providerPaymentId: string;
  metadata?: Record<string, unknown>;
}
```

**Example:**
```typescript
await events.emit('billing.payment.succeeded', {
  scopeId: 'tenant_123',
  scopeType: 'tenant',
  amount: 100,
  currency: 'USD',
  providerPaymentId: 'pi_abc123',
});
```
```

**Recommendation:** Useful for documentation, but low priority

**Effort (If Implemented):** 2-3 days

---

## Event Contracts (NEW)

### Complete Event List (Estimated 50-70 Events)

#### Billing Module Events

| Event Name | Emitter | Listeners | Description |
|------------|---------|-----------|-------------|
| `billing.payment.succeeded` | billing | credits, notify, audit | Payment completed successfully |
| `billing.payment.failed` | billing | notify, audit | Payment failed |
| `billing.subscription.created` | billing | credits, notify, audit | Subscription started |
| `billing.subscription.updated` | billing | credits, notify, audit | Subscription modified |
| `billing.subscription.canceled` | billing | credits, notify, audit | Subscription canceled |
| `billing.refund.processed` | billing | credits, notify, audit | Refund completed |
| `billing.invoice.paid` | billing | notify, audit | Invoice marked as paid |
| `billing.invoice.failed` | billing | notify, audit | Invoice payment failed |

#### Credits Module Events

| Event Name | Emitter | Listeners | Description |
|------------|---------|-----------|-------------|
| `credits.granted` | credits | notify, audit | Credits added to account |
| `credits.consumed` | credits | audit, usage | Credits used |
| `credits.depleted` | credits | notify, billing | Credits below threshold |
| `credits.expired` | credits | notify, audit | Credits expired |

#### Storage Module Events

| Event Name | Emitter | Listeners | Description |
|------------|---------|-----------|-------------|
| `storage.file.uploaded` | storage | notify, audit, media | File uploaded |
| `storage.file.deleted` | storage | audit | File deleted |
| `storage.file.failed` | storage | notify, audit | File operation failed |

#### Notify Module Events

| Event Name | Emitter | Listeners | Description |
|------------|---------|-----------|-------------|
| `notify.email.sent` | notify | audit | Email sent successfully |
| `notify.email.failed` | notify | audit | Email delivery failed |
| `notify.email.bounced` | notify | audit | Email bounced |
| `notify.inapp.created` | notify | audit | In-app notification created |

#### Webhooks Module Events

| Event Name | Emitter | Listeners | Description |
|------------|---------|-----------|-------------|
| `webhook.received` | webhooks | audit | Webhook received |
| `webhook.processed` | webhooks | audit | Webhook processed |
| `webhook.failed` | webhooks | notify, audit | Webhook processing failed |

#### Auth Module Events

| Event Name | Emitter | Listeners | Description |
|------------|---------|-----------|-------------|
| `auth.user.registered` | auth | notify, audit | New user registered |
| `auth.user.login` | auth | audit | User logged in |
| `auth.user.logout` | auth | audit | User logged out |
| `auth.password.reset` | auth | notify, audit | Password reset requested |
| `auth.password.changed` | auth | notify, audit | Password changed |

#### Tenants Module Events

| Event Name | Emitter | Listeners | Description |
|------------|---------|-----------|-------------|
| `tenant.created` | tenants | notify, audit | Tenant created |
| `tenant.updated` | tenants | audit | Tenant updated |
| `tenant.deleted` | tenants | billing, storage, audit | Tenant deleted (cascade cleanup) |
| `tenant.member.invited` | tenants | notify, audit | Team member invited |
| `tenant.member.joined` | tenants | notify, audit | Team member joined |
| `tenant.member.removed` | tenants | notify, audit | Team member removed |

#### Usage Module Events

| Event Name | Emitter | Listeners | Description |
|------------|---------|-----------|-------------|
| `usage.metered` | usage | credits, audit | Usage recorded |
| `usage.limit.reached` | usage | notify, audit | Usage limit reached |

#### Audit Module Events

**Note:** Audit listens to ALL events (wildcard listener)

---

## Scope Context Changes

### Generated Route Comparison

#### Before Hexagonal Architecture

```typescript
// app/api/rest/v1/tenants/[tenantId]/billing/subscribe/route.ts
/* AUTO-GENERATED - DO NOT EDIT */

import { makeHandler } from '@unisane/gateway';
import { subscribe, ZSubscribe as __BodySchema_POST } from '@unisane/billing';
import { z } from 'zod';

export const runtime = 'nodejs';

export const POST = makeHandler<typeof __BodySchema_POST>(
  {
    op: "billing.subscribe",
    requireUser: true,
    requireTenantMatch: true,
    zod: __BodySchema_POST
  },
  async ({ req, params, body, ctx, requestId }) => {
    const __body: z.output<typeof __BodySchema_POST> = body!;
    const __params = params as { tenantId: string };

    // ❌ Uses tenantId from params (tenant-scoped only)
    const __arg_tenantId = __params.tenantId;
    const __arg_planId = __body.planId;
    const __arg_quantity = __body.quantity;
    const __arg_successUrl = __body.successUrl;
    const __arg_cancelUrl = __body.cancelUrl;

    const result = await subscribe({
      tenantId: __arg_tenantId,
      planId: __arg_planId,
      quantity: __arg_quantity,
      successUrl: __arg_successUrl,
      cancelUrl: __arg_cancelUrl,
    });

    return result;
  }
);
```

#### After Hexagonal Architecture (Option 1: Backward Compatible)

```typescript
// app/api/rest/v1/tenants/[tenantId]/billing/subscribe/route.ts
/* AUTO-GENERATED - DO NOT EDIT */

import { makeHandler } from '@unisane/gateway';
import { getScope } from '@unisane/kernel';  // ✨ NEW: Import scope
import { subscribe, ZSubscribe as __BodySchema_POST } from '@unisane/billing';
import { z } from 'zod';

export const runtime = 'nodejs';

export const POST = makeHandler<typeof __BodySchema_POST>(
  {
    op: "billing.subscribe",
    requireUser: true,
    requireTenantMatch: true,
    zod: __BodySchema_POST
  },
  async ({ req, params, body, ctx, requestId }) => {
    const __body: z.output<typeof __BodySchema_POST> = body!;
    const __params = params as { tenantId: string };

    // ✅ Get scope (but still use tenantId for backward compatibility)
    const __scope = getScope();

    const __arg_tenantId = __params.tenantId;  // Still from params
    const __arg_planId = __body.planId;
    const __arg_quantity = __body.quantity;
    const __arg_successUrl = __body.successUrl;
    const __arg_cancelUrl = __body.cancelUrl;

    const result = await subscribe({
      tenantId: __arg_tenantId,
      planId: __arg_planId,
      quantity: __arg_quantity,
      successUrl: __arg_successUrl,
      cancelUrl: __arg_cancelUrl,
    });

    return result;
  }
);
```

#### After Hexagonal Architecture (Option 2: Full Scope)

```typescript
// app/api/rest/v1/billing/subscribe/route.ts (NO tenantId in path!)
/* AUTO-GENERATED - DO NOT EDIT */

import { makeHandler } from '@unisane/gateway';
import { getScope } from '@unisane/kernel';  // ✨ NEW: Import scope
import { subscribe, ZSubscribe as __BodySchema_POST } from '@unisane/billing';
import { z } from 'zod';

export const runtime = 'nodejs';

export const POST = makeHandler<typeof __BodySchema_POST>(
  {
    op: "billing.subscribe",
    requireUser: true,
    requireScopeType: 'tenant',  // ✨ NEW: Require tenant scope
    zod: __BodySchema_POST
  },
  async ({ req, params, body, ctx, requestId }) => {
    const __body: z.output<typeof __BodySchema_POST> = body!;

    // ✅ Get scope from context (universal)
    const __scope = getScope();

    // ✅ Validate scope type
    if (__scope.type !== 'tenant') {
      throw new Error('Invalid scope type: expected tenant, got ' + __scope.type);
    }

    const __arg_scopeId = __scope.id;       // ✨ From scope
    const __arg_scopeType = __scope.type;   // ✨ From scope
    const __arg_planId = __body.planId;
    const __arg_quantity = __body.quantity;
    const __arg_successUrl = __body.successUrl;
    const __arg_cancelUrl = __body.cancelUrl;

    const result = await subscribe({
      scopeId: __arg_scopeId,      // ✅ Universal scope
      scopeType: __arg_scopeType,  // ✅ Type information
      planId: __arg_planId,
      quantity: __arg_quantity,
      successUrl: __arg_successUrl,
      cancelUrl: __arg_cancelUrl,
    });

    return result;
  }
);
```

---

## Service Mapping Updates

### Service Function Signatures

#### Option 1: Keep tenantId (Backward Compatible)

```typescript
// packages/modules/billing/src/service/subscribe.ts

// BEFORE hexagonal
export async function subscribe(args: {
  tenantId: string;
  planId: string;
  quantity?: number;
  successUrl: string;
  cancelUrl: string;
}) {
  const provider = getBillingProvider();
  // ...
}

// AFTER hexagonal (SAME SIGNATURE!)
export async function subscribe(args: {
  tenantId: string;  // ✅ Still accepts tenantId
  planId: string;
  quantity?: number;
  successUrl: string;
  cancelUrl: string;
}) {
  // Internally uses scope:
  const scope = getScope();  // Gets { type: 'tenant', id: args.tenantId }

  const provider = getBillingProvider();
  // ...
}
```

#### Option 2: Accept Scope (New Way)

```typescript
// packages/modules/billing/src/service/subscribe.ts

// NEW: Accept scope directly
export async function subscribe(args: {
  scopeId: string;      // ✨ Universal ID
  scopeType: ScopeType; // ✨ Type information
  planId: string;
  quantity?: number;
  successUrl: string;
  cancelUrl: string;
}) {
  // Use scope directly
  const scope = { type: args.scopeType, id: args.scopeId };

  const provider = getBillingProvider();
  // ...
}
```

**Recommendation:** Keep `tenantId` for now (Option 1) - Less breaking, backward compatible

---

## Codegen Generator Updates

### Files to Update

| File | Changes | Complexity |
|------|---------|------------|
| `meta.ts` | Add `requireScopeType`, update `callArgs.from` | Low |
| `render.ts` | Add scope handling, import `getScope()` | Medium |
| `params.ts` | Add 'scope' case to `generateValueAccessor()` | Low |
| `contracts-guide.md` | Document scope usage | Low |

### Testing Strategy

```typescript
// test/codegen/scope-generation.test.ts
describe('Scope Code Generation', () => {
  it('should generate scope extraction', () => {
    const cfg = {
      op: 'test.op',
      requireScopeType: 'tenant',
      service: {
        importPath: '@unisane/test',
        fn: 'testFn',
        callArgs: [
          { name: 'scopeId', from: 'scope', key: 'id' },
        ],
      },
    };

    const code = renderRouteHandler({ method: 'POST', cfg });

    expect(code).toContain("import { getScope } from '@unisane/kernel'");
    expect(code).toContain('const __scope = getScope();');
    expect(code).toContain("if (__scope.type !== 'tenant')");
    expect(code).toContain('const __arg_scopeId = __scope.id;');
  });

  it('should handle backward compatible tenantId', () => {
    const cfg = {
      requireTenantMatch: true,
      service: {
        callArgs: [
          { name: 'tenantId', from: 'params', key: 'tenantId' },
        ],
      },
    };

    const code = renderRouteHandler({ method: 'POST', cfg });

    expect(code).toContain('const __arg_tenantId = __params.tenantId;');
  });
});
```

---

## Migration Checklist

### Phase 1: Event Contracts (Week 1)

- [ ] **Day 1-2: Define Event Schemas**
  - [ ] Create `kernel/src/events/contracts/` directory
  - [ ] Define billing event schemas (8 events)
  - [ ] Define credits event schemas (4 events)
  - [ ] Define storage event schemas (3 events)
  - [ ] Define notify event schemas (4 events)
  - [ ] Define webhooks event schemas (3 events)
  - [ ] Define auth event schemas (5 events)
  - [ ] Define tenants event schemas (6 events)
  - [ ] Define usage event schemas (2 events)
  - [ ] Define audit events (listens to all)

- [ ] **Day 3: Create EventMap**
  - [ ] Create `EventMap` type registry
  - [ ] Export all event schemas
  - [ ] Add JSDoc comments for each event

- [ ] **Day 4: Update Event Emitter**
  - [ ] Add type safety to `events.emit()`
  - [ ] Add type safety to `events.on()`
  - [ ] Add Zod validation to emission
  - [ ] Add event schema registry

- [ ] **Day 5: Testing & Documentation**
  - [ ] Write tests for event validation
  - [ ] Test type safety
  - [ ] Document event contracts
  - [ ] Create event contracts guide

### Phase 2: Scope Context (Week 2)

- [ ] **Day 1: Update OpMeta Type**
  - [ ] Add `requireScopeType` field
  - [ ] Add `'scope'` to `callArgs.from` union
  - [ ] Update JSDoc comments

- [ ] **Day 2-3: Update Route Generator**
  - [ ] Add `getScope()` import handling
  - [ ] Generate scope extraction code
  - [ ] Add scope type validation
  - [ ] Handle backward compatibility

- [ ] **Day 4: Update Params Generator**
  - [ ] Add 'scope' case to `generateValueAccessor()`
  - [ ] Test scope value extraction

- [ ] **Day 5: Testing**
  - [ ] Test scope generation
  - [ ] Test backward compatibility
  - [ ] Test scope type validation
  - [ ] Integration tests

### Phase 3: Documentation (Week 2)

- [ ] **Day 1-2: Update Contracts Guide**
  - [ ] Document scope usage patterns
  - [ ] Add examples with scope
  - [ ] Update quick reference

- [ ] **Day 3: Create Migration Guide**
  - [ ] Document REST contract unchanged
  - [ ] Document event contracts
  - [ ] Document scope changes

### Verification

```bash
# 1. Event contracts work
cd packages/foundation/kernel
pnpm test:events

# 2. Route generation works
cd starters/saaskit
pnpm routes:gen
pnpm build

# 3. SDK generation still works
pnpm sdk:gen
pnpm typecheck

# 4. Integration test
pnpm test:e2e
```

---

## Examples: Before vs After

### Example 1: Webhook Handler (Event Emission)

#### Before Hexagonal Architecture

```typescript
// packages/modules/webhooks/src/inbound/stripe/handlers.ts
import { grant } from '@unisane/credits';  // ❌ Direct import

export async function handlePaymentSucceeded(event: StripeEvent) {
  const { tenantId, amount } = parseEvent(event);

  // ❌ Direct call to another module
  await grant({
    tenantId,
    amount: amount * 10,
    reason: 'purchase',
  });
}
```

#### After Hexagonal Architecture

```typescript
// packages/modules/webhooks/src/inbound/stripe/handlers.ts
import { events } from '@unisane/kernel';  // ✅ Only kernel import
import type { BillingPaymentSucceededEvent } from '@unisane/kernel';

export async function handlePaymentSucceeded(event: StripeEvent) {
  const { scopeId, scopeType, amount } = parseEvent(event);

  // ✅ Emit event instead of direct call
  await events.emit('billing.payment.succeeded', {
    scopeId,
    scopeType,
    amount,
    currency: 'USD',
    providerPaymentId: event.id,
  });
}
```

### Example 2: Credits Module (Event Listener)

#### Before Hexagonal Architecture

```typescript
// packages/modules/credits/src/index.ts
export { grant } from './service/grant';  // ❌ Exported for other modules
```

#### After Hexagonal Architecture

```typescript
// packages/modules/credits/src/event-handlers.ts
import { events } from '@unisane/kernel';
import { grant } from './service/grant';

export function registerCreditEventHandlers() {
  // ✅ Listen to events
  events.on('billing.payment.succeeded', async (event) => {
    await grant({
      scopeId: event.payload.scopeId,
      amount: event.payload.amount * 10,
      reason: 'payment_received',
      metadata: {
        paymentId: event.payload.providerPaymentId,
      },
    });
  });

  events.on('billing.refund.processed', async (event) => {
    await deduct({
      scopeId: event.payload.scopeId,
      amount: event.payload.amount * 10,
      reason: 'payment_refunded',
    });
  });
}

// packages/modules/credits/src/index.ts
import { registerCreditEventHandlers } from './event-handlers';

// ✅ Register event handlers on init
registerCreditEventHandlers();

// ✅ NO MORE export { grant } - internal only
```

### Example 3: REST Contract (Unchanged!)

#### Before Hexagonal Architecture

```typescript
// starters/saaskit/src/contracts/billing.contract.ts
export const billingContract = c.router({
  subscribe: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants/:tenantId/billing/subscribe",
      pathParams: z.object({ tenantId: z.string() }),
      body: ZSubscribe,
      responses: { 200: z.object({ ok: z.literal(true), data: z.object({ url: z.string() }) }) },
    },
    defineOpMeta({
      op: "billing.subscribe",
      requireUser: true,
      requireTenantMatch: true,
      service: {
        importPath: "@unisane/billing",
        fn: "subscribe",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "planId", from: "body", key: "planId" },
        ],
      },
    })
  ),
});
```

#### After Hexagonal Architecture

```typescript
// starters/saaskit/src/contracts/billing.contract.ts
// ✅ EXACTLY THE SAME!
export const billingContract = c.router({
  subscribe: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants/:tenantId/billing/subscribe",
      pathParams: z.object({ tenantId: z.string() }),
      body: ZSubscribe,
      responses: { 200: z.object({ ok: z.literal(true), data: z.object({ url: z.string() }) }) },
    },
    defineOpMeta({
      op: "billing.subscribe",
      requireUser: true,
      requireTenantMatch: true,
      service: {
        importPath: "@unisane/billing",
        fn: "subscribe",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "planId", from: "body", key: "planId" },
        ],
      },
    })
  ),
});
```

---

## Summary

### What Changes

| Component | Impact | Reason |
|-----------|--------|--------|
| **REST Contracts** | 🟢 No changes | External API stable |
| **Event Contracts** | ✨ NEW system | Event-driven architecture |
| **Scope Context** | 🟡 Codegen update | Universal scope |
| **Route Codegen** | 🟡 Minor update | Scope handling |
| **SDK Codegen** | 🟢 No changes | Client unaffected |
| **Service Layer** | 🟢 No changes | Functions unchanged |

### What Stays the Same

1. ✅ REST API contracts (all 22+ files)
2. ✅ Request/response schemas
3. ✅ SDK generation (clients, hooks, types)
4. ✅ React Query hooks
5. ✅ Service function signatures
6. ✅ Frontend code

### What's New

1. ✨ Event contracts system (~50-70 events)
2. ✨ Type-safe event emitter
3. ✨ Scope context handling in routes
4. ✨ Event-driven module communication

### Total Effort

- **Critical (Must Do):** 3-5 days
  - Event contracts: 2-3 days
  - Route generator: 1-2 days

- **Optional (Nice to Have):** 5-7 days
  - Event listener codegen: 3-4 days
  - Event docs generator: 2-3 days

**Total:** 3-5 days (critical only), 8-12 days (all features)

---

## Conclusion

The hexagonal architecture migration has **minimal impact** on the contracts and codegen system. The key changes are:

1. **Event Contracts (NEW)** - Need to create event schemas, but this is additive
2. **Scope Context (UPDATE)** - Need to update route codegen to use `getScope()`

The REST contracts, SDK generation, and client-side code remain **completely unchanged**, which means the migration is **low-risk** from a contracts perspective.

**Next Steps:**
1. Review this analysis
2. Decide on event contract structure
3. Start implementing event contracts (Phase 1, Week 1)
4. Update route generator (Phase 2, Week 2)
5. Test everything
6. Ship!
