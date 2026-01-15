# Platform Layer Architecture

> **Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)

This guide documents the platform layer pattern used in `starters/saaskit/src/platform/`, explaining the hexagonal architecture approach that bridges generic @unisane packages with application-specific implementations.

**Last Updated:** January 2026 (reflects current codebase implementation)

---

## Overview

The platform layer implements a **hexagonal architecture** (ports and adapters) pattern. It sits between generic @unisane packages and the application layer, providing:

- **Configuration** for generic packages
- **Adaptation** of multiple packages into unified interfaces
- **Integration** with external providers
- **Application-specific domain logic**
- **Event orchestration** for cross-cutting concerns
- **Cache invalidation** based on domain events

```
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                             │
│                    (API routes, pages, components)                   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         PLATFORM LAYER                               │
│                      src/platform/*                                  │
│                                                                      │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│   │ Extensions  │  │  Adapters   │  │Integrations │  │   Core    │  │
│   │ (config)    │  │ (combine)   │  │ (providers) │  │ (domain)  │  │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘  │
└──────────┼────────────────┼────────────────┼───────────────┼────────┘
           │                │                │               │
           ▼                ▼                ▼               │
┌─────────────────────────────────────────────────────────┐ │
│                    @unisane/* PACKAGES                   │ │
│  kernel, gateway, auth, billing, usage, credits, etc.   │ │
└─────────────────────────────────────────────────────────┘ │
                                                            │
                              ┌──────────────────────────────┘
                              │ (standalone domain logic)
                              ▼
                    No package dependency
```

---

## Platform Module Types

### 1. Extensions (Thin Wrappers)

**Purpose:** Add application-specific configuration to generic packages.

**Characteristics:**
- Minimal code (usually < 50 lines)
- Read environment variables
- Return typed configuration objects
- No business logic

**Example: `platform/auth/config.ts`**

```typescript
// Extensions wrap @unisane/auth with app-specific config
import { getEnv } from "@unisane/kernel";

export interface AuthConfig {
  jwtIssuer: string;
  jwtAudience: string;
  jwtTtl: number;
  oauthProviders: string[];
}

export function getAuthConfig(): AuthConfig {
  return {
    jwtIssuer: getEnv("JWT_ISSUER", "https://app.example.com"),
    jwtAudience: getEnv("JWT_AUDIENCE", "saaskit"),
    jwtTtl: parseInt(getEnv("JWT_TTL", "3600"), 10),
    oauthProviders: getEnv("OAUTH_PROVIDERS", "google,github").split(","),
  };
}
```

**Current Extensions:**
| Module | File | Wraps | Purpose |
|--------|------|-------|---------|
| auth | `config.ts` | @unisane/auth | JWT settings, OAuth provider list |
| billing | `planMap.ts` | @unisane/billing | Map plan names → Stripe/Razorpay IDs |
| billing | `topupMap.ts` | @unisane/billing | Map topup tiers → provider price IDs |

---

### 2. Adapters (Combining Packages)

**Purpose:** Combine multiple @unisane packages into a unified interface.

**Characteristics:**
- Implement application-specific interfaces
- Coordinate multiple packages
- Provide DX helpers for common operations
- Abstract away package complexity
- Use port-based dependency injection for testability

**Example: `platform/metering/guard.ts`**

```typescript
// Adapter combines @unisane/usage + @unisane/credits
import { getWindow, increment } from "@unisane/usage";
import { consume as consumeCredits } from "@unisane/credits";
import { resolveTokenPolicy } from "./policy";

// Port interfaces for dependency injection
export type UsagePort = {
  getWindow(args: { tenantId: string; feature: FeatureKey; window: "day" }): Promise<number>;
  increment(args: { tenantId: string; feature: FeatureKey; n: number; idempotencyKey: string }): Promise<void>;
};

export type CreditsPort = {
  consume(args: { tenantId: string; amount: number; feature: FeatureKey; idem: string }): Promise<void>;
};

export function createGuard(deps: { usage: UsagePort; credits: CreditsPort }) {
  return {
    async enforceTokensAndQuota(args: {
      tenantId: string;
      plan: PlanId;
      feature: FeatureKey;
      units?: number;
      idem: string;
    }) {
      // 1. Resolve policy (daily free tokens + cost per unit)
      const policy = resolveTokenPolicy({ feature: args.feature, plan: args.plan });
      const units = args.units ?? 1;
      const tokens = policy.cost * units;

      // 2. Check current usage
      const used = await deps.usage.getWindow({
        tenantId: args.tenantId,
        feature: args.feature,
        window: "day",
      });

      // 3. Calculate what's free vs. what needs credits
      const remainingFree = (policy.dailyFree ?? 0) - used;
      const payable = Math.max(0, tokens - Math.max(0, remainingFree));

      // 4. Track usage
      await deps.usage.increment({
        tenantId: args.tenantId,
        feature: args.feature,
        n: units,
        idempotencyKey: args.idem,
      });

      // 5. Charge credits for overage
      if (payable > 0) {
        await deps.credits.consume({
          tenantId: args.tenantId,
          amount: payable,
          feature: args.feature,
          idem: `idem:${args.idem}`,
        });
      }

      return { payable, freeUsed: Math.min(tokens, Math.max(0, remainingFree)) };
    },
  };
}

// DX helper: default guard wired to module services
export function createDefaultGuard() {
  return createGuard({
    usage: {
      getWindow: ({ feature, window }) => getWindow({ feature, window }),
      increment: ({ feature, n, idempotencyKey }) =>
        increment({ feature, n, idem: idempotencyKey }).then(() => undefined),
    },
    credits: {
      consume: ({ amount, feature, idem }) =>
        consumeCredits({ amount, feature, reason: idem }).then(() => undefined),
    },
  });
}
```

**Current Adapters:**
| Module | Purpose | Combines |
|--------|---------|----------|
| metering | Unified quota/token enforcement | @unisane/usage + @unisane/credits + policy |
| webhooks | Secure outbound delivery | @unisane/webhooks + signing |

---

### 3. Integrations (Provider Implementations)

**Purpose:** Implement provider-specific logic for external services.

**Characteristics:**
- Connect to external APIs
- Handle provider-specific protocols
- May use @unisane packages for coordination
- Provide consistent interface across providers

**Example: `platform/email/providers/`**

```typescript
// Integration with external email providers
import { EmailProvider } from "../types";

// Resend provider
export const resendProvider: EmailProvider = {
  name: "resend",
  async send(options) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    return resend.emails.send({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  },
};

// AWS SES provider
export const sesProvider: EmailProvider = {
  name: "ses",
  async send(options) {
    const ses = new SESClient({ region: process.env.AWS_REGION });
    return ses.send(new SendEmailCommand({
      Source: options.from,
      Destination: { ToAddresses: [options.to] },
      Message: {
        Subject: { Data: options.subject },
        Body: { Html: { Data: options.html } },
      },
    }));
  },
};
```

**Current Integrations:**
| Module | Purpose | External Services |
|--------|---------|-------------------|
| email | Email delivery | Resend, AWS SES |
| oauth | OAuth flows | Google, GitHub |
| inngest | Background jobs | Inngest platform |
| billing | Payment processing | Stripe, Razorpay |

---

### 4. Core (Application Domain Logic)

**Purpose:** Implement domain logic specific to the application that doesn't belong in packages.

**Characteristics:**
- DDD-style domain/data/service layers
- No @unisane package equivalent
- Application-specific business rules
- May coordinate multiple packages

**Example: `platform/outbox/`**

```
platform/outbox/
├── domain/
│   └── ports.ts          # Repository interface
├── data/
│   ├── repo.ts           # Abstract repository
│   └── repo.mongo.ts     # MongoDB implementation
├── service.ts            # Outbox service (enqueue, deliver)
├── service.admin.ts      # Admin operations
└── index.ts              # Public exports
```

```typescript
// Core domain service - not a wrapper, standalone implementation
import { OutboxRepo } from "./data/repo";
import { OutboxEntry, OutboxStatus } from "./domain/ports";

export class OutboxService {
  static async enqueue(
    entry: { type: string; payload: unknown },
    scheduledFor?: Date
  ): Promise<string> {
    const repo = OutboxRepo.create();
    return repo.insert({
      ...entry,
      status: "pending",
      attempts: 0,
      scheduledFor: scheduledFor ?? new Date(),
      createdAt: new Date(),
    });
  }

  static async deliverBatch(
    now: Date,
    batchSize: number,
    dispatchers: Record<string, (payload: unknown) => Promise<void>>
  ): Promise<void> {
    const repo = OutboxRepo.create();
    const entries = await repo.findPending(now, batchSize);

    for (const entry of entries) {
      const dispatcher = dispatchers[entry.type];
      if (!dispatcher) continue;

      try {
        await dispatcher(entry.payload);
        await repo.markDelivered(entry.id);
      } catch (error) {
        await repo.incrementAttempts(entry.id);
        // Implement exponential backoff, dead-letter logic
      }
    }
  }
}
```

**Current Core Modules:**
| Module | Purpose | Pattern |
|--------|---------|---------|
| outbox | Transactional outbox pattern | DDD (domain/data/service) |
| jobs/registry | Background job orchestration | Central registry (~355 lines) |
| telemetry | Logging/metrics setup | Configuration wrapper |
| config | Shared utilities | Bus, cache, version |
| cache-invalidation | Event-driven cache invalidation | Event subscribers (~166 lines) |
| events | Event schema registration | Bootstrap (~96 lines) |
| init | Platform initialization | Orchestrator (~51 lines) |

---

## Bootstrap & Initialization

**New in 2026:** The platform layer now has a comprehensive initialization system that orchestrates all cross-cutting concerns at application boot.

### Initialization Flow (`platform/init.ts`)

```typescript
import { initFlagsSubscriber } from "@unisane/flags";
import { initSettingsSubscriber } from "@unisane/settings";
import { registerSettingDefinition } from "@unisane/kernel";
import { validateEnvOrThrow } from "./env";
import { registerEventSchemas } from "./events";
import { initCacheInvalidation } from "./cache-invalidation";

let initialized = false;

export function initModules() {
  if (initialized) return;
  initialized = true;

  // 1. Validate environment variables at boot
  validateEnvOrThrow();

  // 2. Register domain event schemas (must happen before handlers)
  registerEventSchemas();

  // 3. Register setting definitions with kernel registry
  const defs = getAllDefinitions();
  for (const def of defs) {
    registerSettingDefinition({
      namespace: def.namespace,
      key: def.key,
      visibility: def.visibility,
      scope: def.scope,
      schema: def.schema,
      defaultValue: def.defaultValue,
    });
  }

  // 4. Initialize cache invalidation subscribers
  initFlagsSubscriber();
  initSettingsSubscriber();

  // 5. Initialize domain event cache invalidation handlers
  initCacheInvalidation();

  console.log("[initModules] Modules initialized");
}
```

### Event Schema Registration (`platform/events.ts`)

Registers typed event schemas from all modules with the kernel event system:

```typescript
import { z } from 'zod';
import { registerEvents } from '@unisane/kernel';
import { CREDITS_EVENTS } from '@unisane/credits';
import { IDENTITY_EVENTS } from '@unisane/identity';

let registered = false;

export function registerEventSchemas(): void {
  if (registered) return;
  registered = true;

  // Register credits events
  registerEvents({
    [CREDITS_EVENTS.GRANTED]: z.object({
      tenantId: z.string(),
      amount: z.number(),
      reason: z.string(),
      id: z.string(),
    }),
    [CREDITS_EVENTS.CONSUMED]: z.object({
      tenantId: z.string(),
      amount: z.number(),
      reason: z.string(),
      feature: z.string(),
    }),
    // ... more events
  });

  // Register identity events
  registerEvents({
    [IDENTITY_EVENTS.USER_CREATED]: z.object({
      userId: z.string(),
      email: z.string(),
    }),
    [IDENTITY_EVENTS.USER_UPDATED]: z.object({
      userId: z.string(),
      email: z.string().optional(),
      username: z.string().nullable().optional(),
      phone: z.string().nullable().optional(),
    }),
    // ... more events
  });

  console.log('[events] Domain event schemas registered');
}
```

### Cache Invalidation (`platform/cache-invalidation.ts`)

Subscribes to domain events and automatically invalidates relevant caches:

```typescript
import { events, cacheDelete, logger } from '@unisane/kernel';
import { CREDITS_EVENTS } from '@unisane/credits';
import { IDENTITY_EVENTS, identityKeys } from '@unisane/identity';

let initialized = false;

export function initCacheInvalidation(): void {
  if (initialized) return;
  initialized = true;

  // Identity events
  events.on(IDENTITY_EVENTS.USER_UPDATED, async (event) => {
    const { userId, email, username, phone } = event.payload;

    // Invalidate user caches
    await Promise.all([
      cacheDelete(identityKeys.userById(userId)),
      cacheDelete(identityKeys.userProfile(userId)),
      email ? cacheDelete(identityKeys.userByEmail(email)) : Promise.resolve(),
      username ? cacheDelete(identityKeys.userByUsername(username)) : Promise.resolve(),
      phone ? cacheDelete(identityKeys.userByPhone(phone)) : Promise.resolve(),
    ]);
  });

  events.on(IDENTITY_EVENTS.API_KEY_CREATED, async (event) => {
    const { tenantId, userId } = event.payload;
    await cacheDelete(identityKeys.userApiKeys(tenantId, userId));
  });

  events.on(IDENTITY_EVENTS.API_KEY_REVOKED, async (event) => {
    const { tenantId, userId, keyId, keyHash } = event.payload;
    await Promise.all([
      cacheDelete(identityKeys.userApiKeys(tenantId, userId)),
      cacheDelete(identityKeys.apiKeyById(keyId)),
      keyHash ? cacheDelete(identityKeys.apiKeyByHash(keyHash)) : Promise.resolve(),
    ]);
  });

  events.on(IDENTITY_EVENTS.MEMBERSHIP_ROLE_CHANGED, async (event) => {
    const { tenantId, userId } = event.payload;
    await Promise.all([
      cacheDelete(identityKeys.membership(tenantId, userId)),
      cacheDelete(identityKeys.userMemberships(userId)),
      cacheDelete(identityKeys.tenantMembers(tenantId)),
      cacheDelete(identityKeys.tenantMemberCount(tenantId)),
    ]);
  });

  logger.info('cache-invalidation: Event handlers registered');
}

// Manual invalidation helpers
export async function invalidateUserCache(userId: string): Promise<void> {
  await Promise.all([
    cacheDelete(identityKeys.userById(userId)),
    cacheDelete(identityKeys.userProfile(userId)),
    cacheDelete(identityKeys.userMemberships(userId)),
  ]);
}
```

**Benefits of this pattern:**
- Automatic cache coherence across the application
- Decoupled cache invalidation from business logic
- Single source of truth for event-driven side effects
- Testable in isolation

---

## Jobs Registry: The Orchestrator

The `platform/jobs/registry.ts` is a special module that orchestrates all @unisane packages for background processing:

```typescript
// platform/jobs/registry.ts (~355 lines)
import { rollupHour, rollupDay } from "@unisane/usage";
import { OutboxService } from "@/src/platform/outbox/service";
import { deliverWebhook } from "@/src/platform/webhooks/outbound";
import { sendEmail } from "@unisane/notify";
import { reconcileStripe, reconcileRazorpay } from "@unisane/billing";
import { cleanupOrphanedUploads, cleanupDeletedFiles } from "@unisane/storage";
import { listExpiredOverridesForCleanup, clearScopeOverride } from "@unisane/flags";

export const registry: Record<string, (ctx: { deadlineMs: number }) => Promise<void>> = {
  // Email delivery
  "deliver-notifications": async () => {
    await connectDb();
    const dispatchers = { email: async (payload) => { /* ... */ } };
    await OutboxService.deliverBatch(new Date(), 50, dispatchers);
  },

  // Webhook delivery
  "deliver-webhooks": async () => {
    await OutboxService.deliverBatch(new Date(), 50, {
      webhook: async (payload) => {
        await deliverWebhook(payload);
      },
    });
  },

  // Usage aggregation
  "usage.rollup.hourly": async () => {
    await connectDb();
    await rollupHour();
  },

  "usage.rollup.daily": async () => {
    await connectDb();
    await rollupDay();
  },

  // Billing reconciliation
  "billing.reconcile.stripe": async () => {
    await connectDb();
    await reconcileStripe();
  },

  "billing.reconcile.razorpay": async () => {
    await connectDb();
    await reconcileRazorpay();
  },

  // Storage cleanup
  "storage.cleanup.orphaned": async () => {
    await connectDb();
    await cleanupOrphanedUploads();
  },

  "storage.cleanup.deleted": async () => {
    await connectDb();
    await cleanupDeletedFiles();
  },

  // Feature flag cleanup
  "flags.cleanup.expired": async () => {
    await connectDb();
    const expired = await listExpiredOverridesForCleanup();
    for (const override of expired) {
      await clearScopeOverride({
        key: override.flag,
        scopeType: override.scope as "tenant" | "user",
        scopeId: override.scopeId,
      });
    }
  },

  // ... 10+ more job definitions
};
```

**This registry demonstrates all four platform patterns:**
- **Extensions:** Uses config for providers
- **Adapters:** Combines multiple packages (usage + billing + storage)
- **Integrations:** Calls external services (Stripe, Razorpay)
- **Core:** Orchestrates via OutboxService

---

## Why This Pattern?

### Problem: Generic Packages Need Application Context

@unisane packages are designed to be generic and reusable. But applications need:

1. **Configuration** - Environment-specific settings
2. **Provider choices** - Which email service? Which payment processor?
3. **Business rules** - How do quotas work? What's the credit model?
4. **Coordination** - How do multiple features work together?
5. **Cross-cutting concerns** - Cache invalidation, event registration, initialization

### Solution: Platform as Adapter Layer

The platform layer provides these without polluting packages:

```
❌ Bad: Put app config in @unisane/auth
   → Breaks reusability
   → Every app has different config

✅ Good: Platform wraps @unisane/auth with config
   → Package stays generic
   → Platform handles app-specific needs
```

### Benefits

| Benefit | Explanation |
|---------|-------------|
| **Package independence** | @unisane packages have no app knowledge |
| **Clear boundaries** | App logic stays in platform, not packages |
| **Testability** | Platform can mock packages easily |
| **Flexibility** | Swap providers without touching packages |
| **Discoverability** | All app integrations in one place |
| **Maintainability** | Bootstrap logic centralized in init.ts |
| **Cache coherence** | Automatic invalidation via events |

---

## File Organization

```
src/platform/
├── init.ts                       # Bootstrap orchestrator (51 lines)
├── events.ts                     # Event schema registration (96 lines)
├── cache-invalidation.ts         # Cache invalidation handlers (166 lines)
├── env.ts                        # Environment validation
│
├── auth/
│   └── config.ts                 # Extension: Auth configuration
│
├── billing/
│   ├── planMap.ts                # Extension: Plan → Provider ID mapping
│   ├── topupMap.ts               # Extension: Topup → Provider ID mapping
│   └── providers/                # Integration: Payment processors
│       ├── stripe.ts
│       ├── razorpay.ts
│       └── index.ts
│
├── metering/
│   ├── guard.ts                  # Adapter: Combined usage/credits guard
│   ├── entitlements.ts           # Extension: Entitlement definitions
│   ├── policy.ts                 # Core: Metering policy rules
│   └── index.ts
│
├── webhooks/
│   ├── outbound.ts               # Adapter: Secure webhook delivery
│   ├── signing.ts                # Core: Webhook signing
│   ├── verify.ts                 # Core: Webhook verification
│   └── index.ts
│
├── outbox/
│   ├── domain/                   # Core: Domain types
│   │   └── ports.ts
│   ├── data/                     # Core: Data access
│   │   ├── repo.ts
│   │   └── repo.mongo.ts
│   ├── service.ts                # Core: Outbox service
│   ├── service.admin.ts          # Core: Admin operations
│   └── index.ts
│
├── email/
│   ├── providers/                # Integration: Email providers
│   │   ├── resend.ts
│   │   ├── ses.ts
│   │   └── index.ts
│   └── templates/                # Core: Email templates
│       ├── welcome.ts
│       ├── auth_verify_email.ts
│       ├── auth_password_reset.ts
│       └── index.ts
│
├── oauth/
│   └── providers/                # Integration: OAuth providers
│       ├── google.ts
│       ├── github.ts
│       └── index.ts
│
├── jobs/
│   ├── registry.ts               # Orchestrator: All job definitions (355 lines)
│   └── service/                  # Core: Job service utilities
│       └── triggerFactory.ts
│
├── inngest/
│   └── functions/                # Integration: Inngest function definitions
│       └── export.ts
│
├── telemetry/
│   ├── index.ts                  # Core: Telemetry setup
│   └── pino.ts                   # Integration: Pino configuration
│
└── config/
    ├── bus.ts                    # Core: Event bus configuration
    ├── cache.ts                  # Core: Cache configuration
    ├── version.ts                # Core: Version utilities
    └── index.ts
```

---

## Guidelines for Adding Platform Modules

### When to Create a Platform Module

| Scenario | Platform Module? | Type |
|----------|------------------|------|
| App-specific config for @unisane package | Yes | Extension |
| Combining 2+ @unisane packages | Yes | Adapter |
| External service integration | Yes | Integration |
| App-specific domain logic | Yes | Core |
| Bootstrap/initialization logic | Yes | Core (init.ts, events.ts) |
| Event-driven side effects | Yes | Core (cache-invalidation.ts) |
| Generic utility that could be a package | No | Create package |
| One-off helper function | No | Put in `lib/` |

### Module Structure Template

```typescript
// platform/{module}/index.ts

// Re-export public interface
export { MyService } from "./service";
export type { MyConfig, MyOptions } from "./types";

// Don't export internals
// - No data layer exports
// - No domain types that aren't part of public API
```

### Naming Conventions

| Type | File Pattern | Example |
|------|--------------|---------|
| Extension | `config.ts`, `{name}Map.ts` | `auth/config.ts`, `billing/planMap.ts` |
| Adapter | `guard.ts`, `{name}.ts` | `metering/guard.ts`, `webhooks/outbound.ts` |
| Integration | `providers/{name}.ts` | `email/providers/resend.ts` |
| Core | DDD structure or descriptive name | `outbox/domain/`, `cache-invalidation.ts` |
| Bootstrap | `init.ts`, `events.ts` | `init.ts`, `events.ts` |

---

## Testing Platform Layer

Based on actual test coverage (800+ tests total):

### Unit Tests

Test platform modules in isolation with mocked dependencies:

```typescript
// platform/metering/guard.test.ts
import { describe, it, expect, vi } from "vitest";
import { createGuard } from "./guard";

describe("metering guard", () => {
  it("should charge credits for overage", async () => {
    const mockUsage = {
      getWindow: vi.fn().mockResolvedValue(100), // Already used 100
      increment: vi.fn().mockResolvedValue(undefined),
    };

    const mockCredits = {
      consume: vi.fn().mockResolvedValue(undefined),
    };

    const guard = createGuard({ usage: mockUsage, credits: mockCredits });

    await guard.enforceTokensAndQuota({
      tenantId: "tenant_1",
      plan: "pro",
      feature: "api_calls",
      units: 10,
      idem: "req_123",
    });

    expect(mockCredits.consume).toHaveBeenCalled();
  });
});
```

### Integration Tests

Test platform coordination with real @unisane packages:

```typescript
// platform/cache-invalidation.integration.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { setupTestDb } from "@unisane/test-utils";
import { events, cacheSet, cacheGet } from "@unisane/kernel";
import { IDENTITY_EVENTS, identityKeys } from "@unisane/identity";
import { initCacheInvalidation } from "./cache-invalidation";

describe("cache invalidation integration", () => {
  beforeAll(async () => {
    await setupTestDb();
    initCacheInvalidation();
  });

  it("should invalidate user cache on update", async () => {
    const userId = "user_123";
    const cacheKey = identityKeys.userById(userId);

    // Set cache
    await cacheSet(cacheKey, { id: userId, email: "old@example.com" });

    // Emit event
    events.emit(IDENTITY_EVENTS.USER_UPDATED, {
      userId,
      email: "new@example.com",
    });

    // Wait for async handler
    await new Promise(resolve => setTimeout(resolve, 100));

    // Cache should be cleared
    const cached = await cacheGet(cacheKey);
    expect(cached).toBeNull();
  });
});
```

### E2E Tests

Test full flows through platform layer (51 E2E tests with Playwright):

```typescript
// e2e/billing.spec.ts
import { test, expect } from "@playwright/test";

test("subscribe to plan and get entitlements", async ({ page }) => {
  await page.goto("/billing");

  // Select plan (hits platform/billing/planMap.ts)
  await page.click('[data-plan="pro"]');

  // Process payment (hits platform/billing/providers/stripe.ts)
  await page.fill('[name="card"]', "4242424242424242");
  await page.click('[data-testid="subscribe-button"]');

  // Verify entitlements (hits platform/metering/entitlements.ts)
  await expect(page.locator('[data-feature="api_calls"]')).toBeVisible();
});
```

---

## Recent Improvements (2026)

Based on ISSUES-ROADMAP.md:

### ✅ P2-002: Event Schema Registry
- Centralized event registration in `platform/events.ts`
- Type-safe event emission with Zod validation
- All module events registered at bootstrap

### ✅ P2-006: Request Logging
- Structured logging throughout platform layer
- Sensitive field redaction in logs
- Performance metrics for metering operations

### ✅ P1-001: OpenTelemetry Tracing
- Distributed tracing in `platform/telemetry/`
- Spans for platform operations (metering, webhooks, jobs)
- Integration with observability backends

### ✅ New: Cache Invalidation System
- Event-driven cache invalidation in `platform/cache-invalidation.ts`
- Automatic coherence for identity, credits, and more
- Manual invalidation helpers for edge cases

### ✅ New: Platform Initialization
- Centralized bootstrap in `platform/init.ts`
- Validates environment at startup
- Registers event schemas, settings, and subscribers
- Idempotent initialization (safe to call multiple times)

---

## Summary

The platform layer bridges generic @unisane packages with application-specific needs using four patterns:

1. **Extensions** - Thin configuration wrappers
2. **Adapters** - Multi-package coordination with ports
3. **Integrations** - External service implementations
4. **Core** - Application domain logic

**New in 2026:**
- `init.ts` - Centralized bootstrap orchestration
- `events.ts` - Event schema registration
- `cache-invalidation.ts` - Event-driven cache coherence

**Key principles:**
- Keep packages generic and reusable
- Put app-specific logic in platform
- Use ports for testability
- Centralize bootstrap in init.ts
- Automate cross-cutting concerns with events

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system architecture
- [Module Development](./module-development.md) - Creating @unisane packages
- [SDK Architecture](./sdk-architecture.md) - Client SDK patterns
- [Testing](./testing.md) - Testing strategy (800+ tests)
