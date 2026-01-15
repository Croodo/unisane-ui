# Architecture Rules

> **For LLMs**: ALWAYS load this document. These are hard rules that MUST be followed for every change.

---

## Golden Rules (Memorize These)

### Rule 1: Modules Only Import from Kernel
```
✅ ALLOWED:  import { something } from '@unisane/kernel'
❌ FORBIDDEN: import { something } from '@unisane/other-module'
```

### Rule 2: Cross-Module Communication via Ports or Events
```
✅ ALLOWED:  const flags = getFlagsPort(); await flags.isEnabled(...)
✅ ALLOWED:  await events.emit('billing.subscription.created', payload)
❌ FORBIDDEN: import { isEnabled } from '@unisane/flags'
```

### Rule 3: Adapters Must Use Standard Resilience
```
✅ ALLOWED:  createResilientAdapter('billing-stripe', adapter)
❌ FORBIDDEN: new StripeAdapter() // without resilience wrapper
```

### Rule 4: Events Owned by Emitting Module
```
✅ ALLOWED:  // In @unisane/billing: emit('billing.subscription.created')
❌ FORBIDDEN: // In @unisane/ai: emit('billing.subscription.created')
```

---

## Dependency Rules

### What Modules CAN Import

```typescript
// ✅ ALL modules can import from kernel
import {
  getEnv,           // Environment
  events,           // Event system
  col,              // Database
  cache,            // Cache
  logger,           // Logging
  getFlagsPort,     // Ports
  getBillingPort,
  getSettingsPort,
  getCreditsPort,
  // ... all ports
} from '@unisane/kernel';
```

### What Modules CANNOT Import

```typescript
// ❌ NEVER import from other modules
import { isEnabled } from '@unisane/flags';           // ❌ NO
import { consumeTokens } from '@unisane/credits';     // ❌ NO
import { getTypedSetting } from '@unisane/settings';  // ❌ NO
import { type LatestSub } from '@unisane/tenants';    // ❌ NO (even types!)
```

### Visual Dependency Map

```
                    ┌─────────────────────────┐
                    │      @unisane/kernel    │
                    │                         │
                    │  ┌─────────────────┐    │
                    │  │     PORTS       │    │
                    │  │  FlagsPort      │    │
                    │  │  BillingPort    │    │
                    │  │  SettingsPort   │    │
                    │  │  CreditsPort    │    │
                    │  │  AuditPort      │    │
                    │  │  UsagePort      │    │
                    │  │  NotifyPort     │    │
                    │  │  TenantsQuery   │    │
                    │  └─────────────────┘    │
                    └───────────┬─────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
          ▼                     ▼                     ▼
    ┌──────────┐          ┌──────────┐          ┌──────────┐
    │   ai     │          │ billing  │          │ webhooks │
    └──────────┘          └──────────┘          └──────────┘
          │                     │                     │
          │     ❌ FORBIDDEN    │    ❌ FORBIDDEN     │
          │◄────────────────────┼────────────────────►│
          │                     │                     │
          └─────────────────────┴─────────────────────┘
                    MODULES CANNOT IMPORT EACH OTHER
```

---

## Port Usage Rules

### Before Using Another Module's Functionality

```
1. Check if a port exists in kernel → Use get*Port()
2. No port exists? → Create one FIRST (see REFERENCE/PORTS.md)
3. NEVER import directly from the module
```

### Port Usage Pattern

```typescript
// ✅ CORRECT: Using a port
import { getFlagsPort } from '@unisane/kernel';

export async function generate(args: GenerateArgs) {
  const flags = getFlagsPort();
  const enabled = await flags.isEnabled('ai.generate', args.scopeId);
  if (!enabled) throw new FeatureDisabledError();
  // ...
}

// ❌ WRONG: Direct import
import { isEnabledForScope } from '@unisane/flags';

export async function generate(args: GenerateArgs) {
  const enabled = await isEnabledForScope({ key: 'ai.generate', ... });
  // ...
}
```

---

## Event Rules

### Who Can Emit Which Events

| Event Prefix | Owner Module | Others Can |
|--------------|--------------|------------|
| `billing.*` | @unisane/billing | Listen only |
| `credits.*` | @unisane/credits | Listen only |
| `tenant.*` | @unisane/tenants | Listen only |
| `user.*` | @unisane/identity | Listen only |
| `auth.*` | @unisane/auth | Listen only |
| `storage.*` | @unisane/storage | Listen only |
| `flags.*` | @unisane/flags | Listen only |

### Event Listening Pattern

```typescript
// ✅ CORRECT: Any module can LISTEN to any event
import { onTyped } from '@unisane/kernel';

onTyped('billing.subscription.created', async (event) => {
  // React to the event
  await grantInitialCredits(event.payload.scopeId);
});

// ❌ WRONG: Module emitting another module's event
import { events } from '@unisane/kernel';

// In @unisane/ai - WRONG!
events.emit('billing.subscription.created', payload); // ❌ Not your event!
```

---

## Adapter Rules

### Standard Resilience Configuration

ALL external-facing adapters MUST use this:

```typescript
import { ADAPTER_RESILIENCE_STANDARD, createResilientAdapter } from '@unisane/kernel';

// Standard config (DO NOT modify without approval):
// - Circuit breaker: 5 failures, 30s reset
// - Retry: 3 attempts, 200ms base delay, exponential backoff
// - Timeout: 10s request, 5s connect

export function createMyAdapter(config: Config): MyPort {
  const adapter = new MyAdapterImpl(config);
  return createResilientAdapter('my-adapter', adapter);
}
```

### Adapter Checklist

Before shipping an adapter:
- [ ] Uses `createResilientAdapter()` wrapper
- [ ] Has structured logging on errors
- [ ] Validates config in constructor
- [ ] Implements full port interface (no throwing "not implemented")

---

## Naming Convention Rules

### Zod Schema Naming

All Zod schemas MUST follow the `Z<Entity><Action>` convention:

```typescript
// ✅ CORRECT: Entity first, then action
export const ZUserCreate = z.object({ ... });
export const ZUserUpdate = z.object({ ... });
export const ZSubscriptionCancel = z.object({ ... });
export const ZTokenGrant = z.object({ ... });
export const ZTokenBurn = z.object({ ... });

// ✅ CORRECT: For responses/output
export const ZUserResponse = z.object({ ... });
export const ZSubscriptionResponse = z.object({ ... });

// ✅ CORRECT: For queries
export const ZUserListQuery = z.object({ ... });
export const ZSubscriptionListQuery = z.object({ ... });

// ❌ WRONG: Action first
export const ZCreateUser = z.object({ ... });
export const ZGrantTokens = z.object({ ... });
export const ZEmailEnqueue = z.object({ ... });

// ❌ WRONG: Missing entity context
export const ZCancel = z.object({ ... });
export const ZRefund = z.object({ ... });
export const ZTopup = z.object({ ... });
```

### Schema Suffix Conventions

| Suffix | Use Case | Example |
|--------|----------|---------|
| `Create` | Creating new resources | `ZUserCreate`, `ZTenantCreate` |
| `Update` | Partial updates | `ZUserUpdate`, `ZSettingUpdate` |
| `Patch` | Partial updates (alternative) | `ZUserPatch` |
| `Query` | Query parameters | `ZUserListQuery`, `ZDateRangeQuery` |
| `Response` | API responses | `ZUserResponse`, `ZErrorResponse` |
| `Request` | API requests | `ZUploadRequest`, `ZTransformRequest` |

---

## Type Rules

### Shared Types Location

| Type Kind | Location | Example |
|-----------|----------|---------|
| Port interfaces | `kernel/src/ports/*.port.ts` | `FlagsPort`, `BillingPort` |
| Domain types | `kernel/src/types/*.ts` | `ScopeContext`, `Money` |
| Zod schemas | `kernel/src/schemas/*.ts` | `ZMoney`, `ZEmail` |
| Module-specific | Within the module | `Subscription`, `CreditBalance` |

### Type Import Rules

```typescript
// ✅ CORRECT: Import shared types from kernel
import type { ScopeContext, Money } from '@unisane/kernel';

// ❌ WRONG: Import types from other modules
import type { LatestSub } from '@unisane/tenants';
import type { Subscription } from '@unisane/billing';

// ✅ CORRECT: Define locally if needed
interface SubscriptionView {
  id: string;
  status: 'active' | 'canceled';
  // ...
}
```

---

## Bootstrap Rules

### Port Wiring Order

Ports must be wired in `bootstrap.ts` BEFORE modules use them:

```typescript
// bootstrap.ts - CORRECT ORDER
export async function bootstrap() {
  await connectDb();           // 1. Database first
  await setupRepositories();   // 2. Then repositories
  await setupModulePorts();    // 3. Then module ports ← CRITICAL
  await setupProviders();      // 4. Then external providers
  await registerEventHandlers(); // 5. Finally event handlers
}
```

### Port Must Be Set Before Use

```typescript
// If you see this error:
// "CreditsPort not configured. Call setCreditsPort() in bootstrap."
//
// It means bootstrap.ts is missing:
setCreditsPort({
  consume: credits.consumeTokens,
  grant: credits.grantTokens,
  getBalance: credits.getBalance,
});
```

---

## Code Review Checklist

When reviewing any PR, check:

- [ ] No direct imports between `@unisane/*` modules
- [ ] No type imports from other modules
- [ ] Cross-module calls use ports (`get*Port()`)
- [ ] Events are only emitted by owning module
- [ ] Adapters use resilience wrapper
- [ ] New ports are defined in kernel, not in modules

---

## Quick Reference Card

```
╔════════════════════════════════════════════════════════════════╗
║                    UNISANE ARCHITECTURE RULES                   ║
╠════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  IMPORTS:                                                        ║
║    ✅ from '@unisane/kernel'     ❌ from '@unisane/other-mod'   ║
║                                                                  ║
║  CROSS-MODULE:                                                   ║
║    ✅ getFlagsPort().isEnabled() ❌ import { isEnabled }        ║
║    ✅ events.emit() / onTyped()  ❌ direct function call        ║
║                                                                  ║
║  EVENTS:                                                         ║
║    ✅ Emit your own events       ❌ Emit other's events         ║
║    ✅ Listen to any event        ❌ Modify other's payloads     ║
║                                                                  ║
║  ADAPTERS:                                                       ║
║    ✅ createResilientAdapter()   ❌ new Adapter() directly      ║
║                                                                  ║
║  TYPES:                                                          ║
║    ✅ Import from kernel         ❌ Import from other modules   ║
║    ✅ Define locally if needed   ❌ Re-export other's types     ║
║                                                                  ║
╚════════════════════════════════════════════════════════════════╝
```

---

> **Last Updated**: 2025-01-15 | **Version**: 2.0
