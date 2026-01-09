# Platform Layer Architecture

> **Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)

This guide documents the platform layer pattern used in `starters/saaskit/src/platform/`, explaining the hexagonal architecture approach that bridges generic @unisane packages with application-specific implementations.

---

## Overview

The platform layer implements a **hexagonal architecture** (ports and adapters) pattern. It sits between generic @unisane packages and the application layer, providing:

- **Configuration** for generic packages
- **Adaptation** of multiple packages into unified interfaces
- **Integration** with external providers
- **Application-specific domain logic**

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

**Example: `platform/metering/guard.ts`**

```typescript
// Adapter combines @unisane/usage + @unisane/credits
import { trackUsage, getQuota } from "@unisane/usage";
import { consumeCredits, getBalance } from "@unisane/credits";
import { getEntitlements } from "@unisane/billing";

export interface MeteringGuard {
  enforceTokensAndQuota(tenantId: string, feature: string, amount: number): Promise<void>;
  requireFeatureForTenant(tenantId: string, feature: string): Promise<boolean>;
  ensureCapacityForTenant(tenantId: string, resource: string, required: number): Promise<void>;
  checkQuotaWindow(tenantId: string, feature: string): Promise<QuotaStatus>;
}

export function createMeteringGuard(ctx: Context): MeteringGuard {
  return {
    async enforceTokensAndQuota(tenantId, feature, amount) {
      // 1. Check if within free tier quota
      const quota = await getQuota(ctx, tenantId, feature);
      const used = await trackUsage(ctx, tenantId, feature, amount);

      if (used > quota.free) {
        // 2. Charge credits for overage
        const overage = used - quota.free;
        await consumeCredits(ctx, tenantId, overage * quota.creditRate);
      }
    },
    // ... other methods combining multiple packages
  };
}
```

**Current Adapters:**
| Module | Purpose | Combines |
|--------|---------|----------|
| metering | Unified quota/token enforcement | @unisane/usage + @unisane/credits + @unisane/billing |
| webhooks | Secure outbound delivery | @unisane/webhooks + @unisane/settings |

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
| oauth | OAuth flows | Google, GitHub, etc. |
| inngest | Background jobs | Inngest platform |

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
│   ├── types.ts       # OutboxEntry, OutboxStatus
│   └── errors.ts      # OutboxError, DeliveryFailedError
├── data/
│   └── repo.ts        # OutboxRepo (MongoDB operations)
├── service.ts         # Outbox service (enqueue, deliver)
└── index.ts           # Public exports
```

```typescript
// Core domain service - not a wrapper, standalone implementation
import { OutboxRepo } from "./data/repo";
import { OutboxEntry, OutboxStatus } from "./domain/types";

export class OutboxService {
  constructor(private repo: OutboxRepo) {}

  async enqueue(entry: Omit<OutboxEntry, "id" | "status" | "attempts">): Promise<string> {
    return this.repo.insert({
      ...entry,
      status: OutboxStatus.Pending,
      attempts: 0,
      createdAt: new Date(),
    });
  }

  async deliverBatch(batchSize: number = 50): Promise<DeliveryResult[]> {
    const entries = await this.repo.findPending(batchSize);
    return Promise.all(entries.map(entry => this.deliver(entry)));
  }

  private async deliver(entry: OutboxEntry): Promise<DeliveryResult> {
    // Dispatch based on type (email, webhook, etc.)
    // Handle retries, backoff, dead-letter
  }
}
```

**Current Core Modules:**
| Module | Purpose | Pattern |
|--------|---------|---------|
| outbox | Transactional outbox | DDD (domain/data/service) |
| jobs/registry | Background job orchestration | Central registry |
| telemetry | Logging/metrics setup | Configuration wrapper |
| config | Shared utilities | Bus, cache, version |

---

## Jobs Registry: The Orchestrator

The `platform/jobs/registry.ts` is a special module that orchestrates all @unisane packages for background processing:

```typescript
// platform/jobs/registry.ts (~357 lines)
// Imports from 10+ @unisane packages
import { sendNotification } from "@unisane/notify";
import { reconcileBilling } from "@unisane/billing";
import { rollupUsage } from "@unisane/usage";
import { cleanupStorage } from "@unisane/storage";
import { expireCredits } from "@unisane/credits";
import { cleanupFlags } from "@unisane/flags";
// ... more imports

export const jobRegistry = {
  // Email jobs
  "email.send": createJob(async (ctx, payload) => {
    const provider = getEmailProvider();
    return provider.send(payload);
  }),

  // Webhook jobs
  "webhook.deliver": createJob(async (ctx, payload) => {
    return deliverWebhook(ctx, payload);
  }),

  // Usage aggregation
  "usage.rollup.hourly": createJob(async (ctx) => {
    return rollupUsage(ctx, "hourly");
  }),

  // Billing reconciliation
  "billing.reconcile": createJob(async (ctx, payload) => {
    return reconcileBilling(ctx, payload.tenantId);
  }),

  // Storage cleanup
  "storage.cleanup.orphaned": createJob(async (ctx) => {
    return cleanupStorage(ctx, { type: "orphaned" });
  }),

  // ... 13+ job definitions
};
```

---

## Why This Pattern?

### Problem: Generic Packages Need Application Context

@unisane packages are designed to be generic and reusable. But applications need:

1. **Configuration** - Environment-specific settings
2. **Provider choices** - Which email service? Which payment processor?
3. **Business rules** - How do quotas work? What's the credit model?
4. **Coordination** - How do multiple features work together?

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

---

## File Organization

```
src/platform/
├── auth/
│   └── config.ts              # Extension: Auth configuration
│
├── billing/
│   ├── planMap.ts             # Extension: Plan → Provider ID mapping
│   ├── topupMap.ts            # Extension: Topup → Provider ID mapping
│   └── providers/             # Integration: Payment processors
│
├── metering/
│   ├── guard.ts               # Adapter: Combined usage/credits guard
│   ├── entitlements.ts        # Extension: Entitlement definitions
│   ├── policy.ts              # Core: Metering policy rules
│   └── index.ts
│
├── webhooks/
│   ├── outbound.ts            # Adapter: Secure webhook delivery
│   ├── signing.ts             # Core: Webhook signing
│   └── verify.ts              # Core: Webhook verification
│
├── outbox/
│   ├── domain/                # Core: Domain types
│   ├── data/                  # Core: Data access
│   ├── service.ts             # Core: Outbox service
│   └── index.ts
│
├── email/
│   ├── providers/             # Integration: Email providers
│   └── templates/             # Core: Email templates
│
├── oauth/
│   └── providers/             # Integration: OAuth providers
│
├── jobs/
│   ├── registry.ts            # Orchestrator: All job definitions
│   └── service/               # Core: Job service utilities
│
├── inngest/
│   └── functions/             # Integration: Inngest function definitions
│
├── telemetry/
│   ├── index.ts               # Core: Telemetry setup
│   └── pino.ts                # Integration: Pino configuration
│
└── config/
    ├── bus.ts                 # Core: Event bus configuration
    ├── cache.ts               # Core: Cache configuration
    └── version.ts             # Core: Version utilities
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
| Core | DDD structure | `outbox/domain/`, `outbox/service.ts` |

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system architecture
- [Module Development](./module-development.md) - Creating @unisane packages
- [SDK Architecture](./sdk-architecture.md) - Client SDK patterns
