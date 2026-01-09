# Unisane Platform Architecture

> **Status:** AUTHORITATIVE
> **Last Updated:** 2026-01-09
> **Version:** 2.1

---

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Monorepo structure | Implemented | 30 packages in `@unisane/*` namespace |
| Kernel layer | Implemented | `@unisane/kernel` |
| Gateway layer | Implemented | `@unisane/gateway` |
| Business modules | Implemented | 18 modules + 3 PRO |
| Platform layer | Implemented | Hexagonal architecture in starters |
| SDK generation | Implemented | `@unisane/devtools` |
| UI library | Implemented | `@unisane/ui` - Material 3 components |
| DataTable | Implemented | `@unisane/data-table` - Advanced data grid |
| UI CLI | Implemented | `@unisane/cli` - shadcn-style `add`/`init`/`diff` |
| Distribution build | **Not Implemented** | Design spec only - see [build-distribution.md](./build-distribution.md) |
| OSS/PRO stripping | **Not Implemented** | Planned for after feature completion |

> **Full status tracking:** See [implementation-status.md](./implementation-status.md)

---

## Related Documents

| Document | Description |
|----------|-------------|
| [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) | Cheat sheet for daily use |
| [kernel.md](./kernel.md) | Detailed kernel layer specification |
| [platform-layer.md](./platform-layer.md) | Hexagonal architecture in starters |
| [sdk-architecture.md](./sdk-architecture.md) | SDK generation and patterns |
| [testing.md](./testing.md) | Complete testing strategy |
| [migration.md](./migration.md) | Step-by-step migration guide |
| [advanced-features.md](./advanced-features.md) | Phone auth, impersonation, media, AI, analytics |
| [developer-experience.md](./developer-experience.md) | CLI, generators, seeding, DX tooling |
| [build-distribution.md](./build-distribution.md) | Starter distribution, OSS/PRO |
| [implementation-status.md](./implementation-status.md) | What's built vs planned |
| [ROADMAP.md](./ROADMAP.md) | Migration execution plan with checkpoints |
| [dev-tools.md](./dev-tools.md) | ESLint, Prettier, Vitest, CI/CD configs |

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Principles](#core-principles)
3. [Monorepo Structure](#monorepo-structure)
4. [Kernel Layer](#kernel-layer) → [Full Details](./kernel.md)
5. [Gateway Layer](#gateway-layer)
6. [Module System](#module-system)
7. [Platform Layer](#platform-layer)
8. [Contracts & SDK](#contracts--sdk)
9. [Event System](#event-system)
10. [Error Handling](#error-handling)
11. [Testing Strategy](#testing-strategy) → [Full Details](./testing.md)
12. [Distribution](#distribution)
13. [Versioning & Upgrades](#versioning--upgrades)
14. [Migration Phases](#migration-phases) → [Full Details](./migration.md)
15. [Checklists](#checklists)

---

## Executive Summary

### What We're Building

A **Clean Modular Monolith** that:
- Ships as source code (user owns everything)
- Has 18 business modules + 3 PRO modules
- Uses pnpm workspaces + Turborepo
- Targets Next.js 15+ with App Router
- Works with MongoDB (primary) + Redis/KV

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Architecture** | Modular Monolith | Simple, scalable, can split later |
| **Module Isolation** | Soft (imports allowed via barrel) | Practical over pure |
| **Communication** | Direct calls (sync) + Events (async) | Simple, debuggable |
| **Distribution** | Source code, no runtime deps | User ownership |
| **UI Integration** | Workspace packages (NOT symlinks) | Cross-platform reliable |
| **Database** | Repository pattern with transactions | Swappable, testable |
| **Events** | Typed contracts with versioning | Future-proof |
| **Errors** | Domain errors + Gateway mapping | Consistent, extensible |

---

## Core Principles

### 1. Simple Over Clever
```
DO:
✅ Direct function calls for business logic
✅ Clear folder structure (understand in < 1 hour)
✅ Explicit over implicit

DON'T:
❌ Over-engineer for problems we don't have
❌ Add patterns because they sound enterprise
❌ Magic that requires deep understanding
```

### 2. Type Safety End-to-End
```
Zod Schema (SSOT)
    ↓
├── Frontend form validation
├── API contract validation
├── Service layer types
└── Database schema hints

One change → updates everywhere
```

### 3. Practical Isolation
```
Modules CAN import each other's PUBLIC API:

// ✅ Good - import from barrel
import { getTenant } from '@unisane/tenants';

// ❌ Bad - deep import
import { TenantsRepo } from '@unisane/tenants/data/repository';
```

### 4. User Ownership
```
User downloads → Gets source code → Owns everything

✅ No @unisane/* runtime dependencies
✅ Full customization freedom
✅ No black boxes
```

### 5. Production-First
```
Every feature must have:
✅ Error handling strategy
✅ Observability (logs, metrics, traces)
✅ Testing approach
✅ Security consideration
```

---

## Monorepo Structure

### Multi-Platform Architecture

The monorepo is designed to support **multiple platforms** (SaaS, CRM, E-commerce, AI Apps, etc.) with shared foundational packages. This structure enables:

- **Reusable modules** across different products
- **Platform-specific modules** organized separately
- **Clear dependency boundaries** (each layer depends only on layers below)
- **Easy navigation** for developers working on specific platforms

### Directory Layout

```
unisane/
│
├── apps/
│   ├── web/                         # Docs & component showcase
│   └── landing/                     # Marketing website
│
├── packages/
│   │
│   ├── # ═══════════════════════════════════════════════════════════
│   ├── # FOUNDATION - Core infrastructure used by ALL platforms
│   ├── # ═══════════════════════════════════════════════════════════
│   ├── foundation/
│   │   ├── kernel/                  # @unisane/kernel (Layer 0)
│   │   │                            # ctx, db, cache, events, logging
│   │   ├── gateway/                 # @unisane/gateway (Layer 0.5)
│   │   │                            # HTTP layer, handlers, middleware
│   │   └── contracts/               # @unisane/contracts
│   │                                # Base Zod schemas shared by all
│   │
│   ├── # ═══════════════════════════════════════════════════════════
│   ├── # MODULES - Shared business modules reusable across platforms
│   ├── # ═══════════════════════════════════════════════════════════
│   ├── modules/
│   │   │
│   │   ├── # --- Layer 1: Core identity & settings ---
│   │   ├── identity/                # @unisane/identity
│   │   ├── settings/                # @unisane/settings
│   │   ├── storage/                 # @unisane/storage
│   │   │
│   │   ├── # --- Layer 2: Multi-tenancy & auth ---
│   │   ├── tenants/                 # @unisane/tenants
│   │   ├── auth/                    # @unisane/auth
│   │   │
│   │   ├── # --- Layer 3: Business capabilities ---
│   │   ├── billing/                 # @unisane/billing
│   │   ├── flags/                   # @unisane/flags
│   │   ├── audit/                   # @unisane/audit
│   │   │
│   │   ├── # --- Layer 4: Extended features ---
│   │   ├── credits/                 # @unisane/credits
│   │   ├── usage/                   # @unisane/usage
│   │   ├── notify/                  # @unisane/notify
│   │   ├── webhooks/                # @unisane/webhooks
│   │   │
│   │   ├── # --- Layer 5: Content & AI ---
│   │   ├── media/                   # @unisane/media
│   │   ├── pdf/                     # @unisane/pdf
│   │   └── ai/                      # @unisane/ai
│   │
│   ├── # ═══════════════════════════════════════════════════════════
│   ├── # PRO - Premium modules (not in OSS distribution)
│   ├── # ═══════════════════════════════════════════════════════════
│   ├── pro/
│   │   ├── analytics/               # @unisane/analytics
│   │   ├── sso/                     # @unisane/sso
│   │   └── import-export/           # @unisane/import-export
│   │
│   ├── # ═══════════════════════════════════════════════════════════
│   ├── # UI - Shared design system (works across all platforms)
│   ├── # ═══════════════════════════════════════════════════════════
│   ├── ui/
│   │   ├── core/                    # @unisane/ui (Material 3 components)
│   │   ├── data-table/              # @unisane/data-table (Advanced grid)
│   │   ├── tokens/                  # @unisane/tokens (Design tokens)
│   │   └── cli/                     # @unisane/cli (shadcn-style CLI)
│   │
│   ├── # ═══════════════════════════════════════════════════════════
│   ├── # TOOLING - Development tools & configs
│   ├── # ═══════════════════════════════════════════════════════════
│   ├── tooling/
│   │   ├── devtools/                # @unisane/devtools
│   │   ├── test-utils/              # @unisane/test-utils
│   │   ├── eslint-config/           # @unisane/eslint-config
│   │   ├── typescript-config/       # @unisane/typescript-config
│   │   └── tailwind-config/         # @unisane/tailwind-config
│   │
│   ├── # ═══════════════════════════════════════════════════════════
│   ├── # PLATFORM-SPECIFIC MODULES (Future)
│   ├── # ═══════════════════════════════════════════════════════════
│   │
│   ├── crm/                         # CRM-specific modules (future)
│   │   ├── contacts/                # Contact management
│   │   ├── deals/                   # Deal/opportunity tracking
│   │   ├── pipeline/                # Sales pipeline
│   │   └── activities/              # Activity tracking
│   │
│   ├── ecommerce/                   # E-commerce modules (future)
│   │   ├── products/                # Product catalog
│   │   ├── cart/                    # Shopping cart
│   │   ├── orders/                  # Order management
│   │   ├── inventory/               # Inventory tracking
│   │   └── shipping/                # Shipping integrations
│   │
│   ├── helpdesk/                    # Helpdesk modules (future)
│   │   ├── tickets/                 # Ticket management
│   │   ├── knowledge-base/          # Help articles
│   │   └── chat/                    # Live chat
│   │
│   └── ai-platform/                 # AI Apps modules (future)
│       ├── agents/                  # AI agent framework
│       ├── prompts/                 # Prompt management
│       ├── embeddings/              # Vector embeddings
│       └── rag/                     # RAG implementation
│
├── starters/
│   │
│   ├── saaskit/                     # SaaS starter template
│   │   ├── src/
│   │   │   ├── app/                 # Next.js App Router
│   │   │   ├── platform/            # Hexagonal architecture layer
│   │   │   ├── routes/              # API route handlers
│   │   │   └── bootstrap.ts         # Wire everything together
│   │   └── package.json
│   │
│   ├── crm-kit/                     # CRM starter (future)
│   ├── ecommerce-kit/               # E-commerce starter (future)
│   └── ai-kit/                      # AI apps starter (future)
│
├── handbook/
│   ├── architecture/                # This documentation
│   ├── roadmaps/                    # Development roadmaps
│   └── design-system/               # UI component docs
│
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
└── vitest.workspace.ts
```

> **Note:** `tools/release/` for distribution build is **planned but not implemented**.
> See [build-distribution.md](./build-distribution.md) for design spec and [implementation-status.md](./implementation-status.md) for status.

### Layer Dependency Rules

```
┌──────────────────────────────────────────────────────────────┐
│                         STARTERS                              │
│  saaskit │ crm-kit │ ecommerce-kit │ ai-kit                  │
│  (can use ANY packages below)                                 │
└────────────────────────────┬─────────────────────────────────┘
                             │ uses
┌────────────────────────────┼─────────────────────────────────┐
│                   PLATFORM-SPECIFIC MODULES                   │
│  crm/* │ ecommerce/* │ helpdesk/* │ ai-platform/*            │
│  (can use foundation, modules, pro, ui)                       │
└────────────────────────────┬─────────────────────────────────┘
                             │ uses
┌────────────────────────────┼─────────────────────────────────┐
│                    SHARED MODULES + PRO                       │
│  modules/* │ pro/*                                            │
│  (can use foundation and ui only)                             │
└────────────────────────────┬─────────────────────────────────┘
                             │ uses
┌────────────────────────────┼─────────────────────────────────┐
│                 FOUNDATION + UI + TOOLING                     │
│  foundation/* │ ui/* │ tooling/*                              │
│  (foundation has no deps, ui uses tokens, tooling is isolated)│
└──────────────────────────────────────────────────────────────┘
```

**Rules:**
1. **Foundation** packages have minimal external dependencies
2. **Modules** can import from foundation and other modules (same or lower layer)
3. **Platform-specific** packages can import from modules and foundation
4. **UI** packages are independent of business logic
5. **Starters** wire everything together

### Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  # Apps
  - "apps/*"

  # Core infrastructure
  - "packages/foundation/*"

  # Shared business modules
  - "packages/modules/*"

  # Premium modules
  - "packages/pro/*"

  # UI packages
  - "packages/ui/*"

  # Development tooling
  - "packages/tooling/*"

  # Platform-specific modules (future)
  - "packages/crm/*"
  - "packages/ecommerce/*"
  - "packages/helpdesk/*"
  - "packages/ai-platform/*"

  # Starter templates
  - "starters/*"

  # Build tools (planned)
  - "tools/*"
```

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["tsconfig.base.json"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:unit": {
      "dependsOn": [],
      "outputs": ["coverage/**"]
    },
    "check-types": {
      "dependsOn": ["^check-types"]
    },
    "lint": {},
    "codegen": {
      "cache": false,
      "outputs": ["src/**/*.gen.ts"]
    }
  }
}
```

---

## Kernel Layer

### Purpose

Foundation layer providing core infrastructure that ALL modules depend on.

### Package Structure

```
packages/kernel/
├── src/
│   ├── index.ts                # Public API
│   │
│   ├── context/
│   │   ├── context.ts          # AsyncLocalStorage-based context
│   │   ├── types.ts            # Context type definitions
│   │   └── index.ts
│   │
│   ├── database/
│   │   ├── connection.ts       # Connection management
│   │   ├── transaction.ts      # Transaction support (NEW)
│   │   ├── tenant-scope.ts     # Auto tenant filtering (NEW)
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── events/
│   │   ├── emitter.ts          # Type-safe event emitter
│   │   ├── contracts.ts        # Event schema definitions (NEW)
│   │   ├── registry.ts         # Event registration
│   │   └── index.ts
│   │
│   ├── cache/
│   │   ├── cache.ts            # KV cache abstraction
│   │   ├── providers/
│   │   │   ├── redis.ts
│   │   │   └── memory.ts
│   │   └── index.ts
│   │
│   ├── errors/
│   │   ├── base.ts             # Base error classes (NEW)
│   │   ├── catalog.ts          # Error code catalog (NEW)
│   │   └── index.ts
│   │
│   ├── observability/          # NEW
│   │   ├── logger.ts           # Structured logging
│   │   ├── tracer.ts           # Distributed tracing
│   │   ├── metrics.ts          # Metrics collection
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── crypto.ts
│   │   ├── ids.ts
│   │   ├── money.ts
│   │   ├── normalize.ts
│   │   ├── pagination.ts
│   │   └── index.ts
│   │
│   └── rbac/
│       ├── permissions.ts
│       ├── roles.ts
│       ├── check.ts
│       └── index.ts
│
├── __tests__/
├── package.json
└── tsconfig.json
```

### Context System (Improved)

```typescript
// kernel/src/context/types.ts

export interface RequestContext {
  // Request metadata
  requestId: string;
  startTime: number;

  // Authentication (populated by gateway)
  isAuthenticated: boolean;
  authMethod?: 'session' | 'apikey' | 'bearer';

  // User & Tenant (populated by gateway)
  userId?: string;
  tenantId?: string;

  // Authorization (populated by gateway)
  role?: string;
  permissions?: string[];

  // Billing (populated lazily on first access)
  plan?: string;

  // Feature flags cache (populated lazily)
  flags?: Record<string, boolean>;
}

export interface ContextAPI {
  // Run a function with context
  run<T>(ctx: RequestContext, fn: () => Promise<T>): Promise<T>;

  // Get current context (throws if not in context)
  get(): RequestContext;

  // Get context or undefined (safe)
  tryGet(): RequestContext | undefined;

  // Update context (immutable - creates new context)
  set(updates: Partial<RequestContext>): void;

  // Lazy getters (fetch on first access, cache in context)
  getPlan(): Promise<string>;
  getFlags(): Promise<Record<string, boolean>>;
}
```

```typescript
// kernel/src/context/context.ts

import { AsyncLocalStorage } from 'async_hooks';

const storage = new AsyncLocalStorage<RequestContext>();

export const ctx: ContextAPI = {
  run<T>(context: RequestContext, fn: () => Promise<T>): Promise<T> {
    return storage.run(context, fn);
  },

  get(): RequestContext {
    const context = storage.getStore();
    if (!context) {
      throw new Error('Context not initialized. Ensure code runs within ctx.run()');
    }
    return context;
  },

  tryGet(): RequestContext | undefined {
    return storage.getStore();
  },

  set(updates: Partial<RequestContext>): void {
    const current = this.get();
    Object.assign(current, updates);
  },

  async getPlan(): Promise<string> {
    const context = this.get();
    if (context.plan) return context.plan;

    // Lazy fetch from billing module
    const { getPlanForTenant } = await import('@unisane/billing');
    const plan = await getPlanForTenant(context.tenantId!);
    context.plan = plan;
    return plan;
  },

  async getFlags(): Promise<Record<string, boolean>> {
    const context = this.get();
    if (context.flags) return context.flags;

    // Lazy fetch from flags module
    const { getAllFlags } = await import('@unisane/flags');
    const flags = await getAllFlags(context.tenantId!);
    context.flags = flags;
    return flags;
  }
};
```

### Database with Transactions (NEW)

```typescript
// kernel/src/database/transaction.ts

import { ClientSession, MongoClient } from 'mongodb';
import { ctx } from '../context';

let client: MongoClient;

export function setClient(mongoClient: MongoClient) {
  client = mongoClient;
}

export function getDb() {
  return client.db();
}

export function col<T extends Document>(name: string) {
  return getDb().collection<T>(name);
}

/**
 * Execute operations within a MongoDB transaction.
 * Automatically retries on transient errors.
 */
export async function withTransaction<T>(
  fn: (session: ClientSession) => Promise<T>
): Promise<T> {
  const session = client.startSession();

  try {
    let result: T;

    await session.withTransaction(async () => {
      result = await fn(session);
    }, {
      readConcern: { level: 'majority' },
      writeConcern: { w: 'majority' },
    });

    return result!;
  } finally {
    await session.endSession();
  }
}

/**
 * Helper to include session in collection operations
 */
export function withSession<T extends Document>(
  collection: Collection<T>,
  session: ClientSession
) {
  return {
    findOne: (filter: Filter<T>) =>
      collection.findOne(filter, { session }),
    insertOne: (doc: OptionalUnlessRequiredId<T>) =>
      collection.insertOne(doc, { session }),
    updateOne: (filter: Filter<T>, update: UpdateFilter<T>) =>
      collection.updateOne(filter, update, { session }),
    deleteOne: (filter: Filter<T>) =>
      collection.deleteOne(filter, { session }),
    // ... other methods
  };
}
```

### Tenant-Scoped Queries (NEW)

```typescript
// kernel/src/database/tenant-scope.ts

import { Filter } from 'mongodb';
import { ctx } from '../context';

/**
 * Automatically adds tenantId filter to queries.
 * Prevents accidental cross-tenant data access.
 */
export function tenantFilter<T>(filter: Filter<T> = {}): Filter<T> {
  const context = ctx.tryGet();

  if (!context?.tenantId) {
    throw new Error('tenantId required for tenant-scoped query');
  }

  return {
    ...filter,
    tenantId: context.tenantId,
  } as Filter<T>;
}

/**
 * Validates that a document belongs to current tenant.
 * Use after fetching by ID to prevent IDOR attacks.
 */
export function assertTenantOwnership<T extends { tenantId: string }>(
  doc: T | null,
  resourceName: string
): asserts doc is T {
  if (!doc) {
    throw new NotFoundError(`${resourceName} not found`);
  }

  const { tenantId } = ctx.get();
  if (doc.tenantId !== tenantId) {
    // Log security event but throw generic error
    logger.warn('Tenant ownership violation attempted', {
      resourceTenantId: doc.tenantId,
      requestTenantId: tenantId,
    });
    throw new NotFoundError(`${resourceName} not found`);
  }
}
```

### Observability (NEW)

```typescript
// kernel/src/observability/logger.ts

import pino from 'pino';
import { ctx } from '../context';

const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Context-aware logger that automatically includes request metadata.
 */
export const logger = {
  trace: (msg: string, data?: object) => log('trace', msg, data),
  debug: (msg: string, data?: object) => log('debug', msg, data),
  info: (msg: string, data?: object) => log('info', msg, data),
  warn: (msg: string, data?: object) => log('warn', msg, data),
  error: (msg: string, data?: object) => log('error', msg, data),

  // Create child logger for module
  child: (module: string) => ({
    trace: (msg: string, data?: object) => log('trace', msg, { ...data, module }),
    debug: (msg: string, data?: object) => log('debug', msg, { ...data, module }),
    info: (msg: string, data?: object) => log('info', msg, { ...data, module }),
    warn: (msg: string, data?: object) => log('warn', msg, { ...data, module }),
    error: (msg: string, data?: object) => log('error', msg, { ...data, module }),
  }),
};

function log(level: string, msg: string, data?: object) {
  const context = ctx.tryGet();

  const enriched = {
    ...data,
    requestId: context?.requestId,
    tenantId: context?.tenantId,
    userId: context?.userId,
  };

  baseLogger[level](enriched, msg);
}
```

```typescript
// kernel/src/observability/tracer.ts

import { ctx } from '../context';

export interface Span {
  end(): void;
  setStatus(status: 'ok' | 'error'): void;
  setAttribute(key: string, value: string | number | boolean): void;
}

/**
 * Simple tracing abstraction.
 * Can be replaced with OpenTelemetry in production.
 */
export const tracer = {
  startSpan(name: string, attributes?: Record<string, string>): Span {
    const startTime = performance.now();
    const context = ctx.tryGet();

    return {
      end() {
        const duration = performance.now() - startTime;
        logger.debug(`span:${name}`, {
          duration,
          ...attributes,
        });
      },
      setStatus(status) {
        // Record status
      },
      setAttribute(key, value) {
        // Add attribute
      },
    };
  },

  async trace<T>(
    name: string,
    fn: () => Promise<T>,
    attributes?: Record<string, string>
  ): Promise<T> {
    const span = this.startSpan(name, attributes);
    try {
      const result = await fn();
      span.setStatus('ok');
      return result;
    } catch (error) {
      span.setStatus('error');
      throw error;
    } finally {
      span.end();
    }
  },
};
```

---

## Gateway Layer

### Purpose

HTTP-specific infrastructure that sits between routes and modules.

### Package Structure

```
packages/gateway/
├── src/
│   ├── index.ts
│   │
│   ├── handler/
│   │   ├── handler.ts          # Route handler factory
│   │   ├── types.ts            # Handler types
│   │   └── index.ts
│   │
│   ├── auth/
│   │   ├── plugin.ts           # Auth plugin interface
│   │   ├── session.ts          # Session validation
│   │   ├── apikey.ts           # API key validation
│   │   ├── bearer.ts           # Bearer token validation
│   │   └── index.ts
│   │
│   ├── middleware/
│   │   ├── rate-limit.ts       # Rate limiting
│   │   ├── idempotency.ts      # Idempotency handling
│   │   ├── csrf.ts             # CSRF protection
│   │   ├── security.ts         # Security headers
│   │   ├── cors.ts             # CORS handling
│   │   └── index.ts
│   │
│   ├── errors/
│   │   ├── mapper.ts           # Domain error → HTTP response (NEW)
│   │   ├── handler.ts          # Error handler
│   │   ├── responses.ts        # Standard error responses
│   │   └── index.ts
│   │
│   ├── query/
│   │   ├── parser.ts           # Query parameter parsing
│   │   ├── builder.ts          # MongoDB query builder
│   │   └── index.ts
│   │
│   └── response/
│       ├── envelope.ts         # Response envelope
│       ├── headers.ts          # Response headers
│       └── index.ts
│
├── __tests__/
├── package.json
└── tsconfig.json
```

### Handler Factory (Improved)

```typescript
// gateway/src/handler/handler.ts

import { ctx, logger, tracer } from '@unisane/kernel';
import { DomainError } from '@unisane/kernel/errors';
import { mapErrorToResponse } from '../errors/mapper';

export interface HandlerConfig {
  // Authentication
  auth?: 'required' | 'optional' | 'none';
  authMethods?: ('session' | 'apikey' | 'bearer')[];

  // Authorization
  permissions?: string[];
  tenantRequired?: boolean;

  // Rate limiting
  rateLimit?: {
    window: string;       // '1m', '1h', '1d'
    max: number;
    key?: 'ip' | 'user' | 'tenant' | 'apikey';
  };

  // Idempotency
  idempotent?: boolean;
  idempotencyTTL?: number;  // seconds, default 86400 (24h)

  // Caching
  cache?: {
    ttl: number;
    key?: string;
    invalidateOn?: string[];  // Event names
  };

  // Audit
  audit?: {
    action: string;
    resource: string;
  };
}

export function createHandler<TInput, TOutput>(
  config: HandlerConfig,
  handler: (input: TInput, ctx: RequestContext) => Promise<TOutput>
) {
  return async (req: Request): Promise<Response> => {
    const requestId = generateRequestId();
    const startTime = performance.now();

    // Create initial context
    const context: RequestContext = {
      requestId,
      startTime,
      isAuthenticated: false,
    };

    return ctx.run(context, async () => {
      const span = tracer.startSpan('http.request', {
        method: req.method,
        path: new URL(req.url).pathname,
      });

      try {
        // 1. Security headers
        const headers = getSecurityHeaders();

        // 2. CORS (for browser requests)
        if (req.method === 'OPTIONS') {
          return handleCORS(req, headers);
        }

        // 3. Authentication
        if (config.auth !== 'none') {
          const authResult = await authenticate(req, config.authMethods);

          if (config.auth === 'required' && !authResult.authenticated) {
            throw new AuthenticationError('Authentication required');
          }

          if (authResult.authenticated) {
            ctx.set({
              isAuthenticated: true,
              authMethod: authResult.method,
              userId: authResult.userId,
              tenantId: authResult.tenantId,
              role: authResult.role,
              permissions: authResult.permissions,
            });
          }
        }

        // 4. Tenant requirement
        if (config.tenantRequired && !ctx.get().tenantId) {
          throw new AuthorizationError('Tenant context required');
        }

        // 5. Permission check
        if (config.permissions?.length) {
          const hasPermission = config.permissions.every(p =>
            ctx.get().permissions?.includes(p)
          );
          if (!hasPermission) {
            throw new AuthorizationError('Insufficient permissions');
          }
        }

        // 6. Rate limiting
        if (config.rateLimit) {
          await checkRateLimit(config.rateLimit);
        }

        // 7. CSRF (for session auth + mutations)
        if (ctx.get().authMethod === 'session' && isMutation(req.method)) {
          await validateCSRF(req);
        }

        // 8. Idempotency check
        if (config.idempotent) {
          const cached = await checkIdempotency(req);
          if (cached) {
            return cached;
          }
        }

        // 9. Parse input
        const input = await parseInput<TInput>(req);

        // 10. Execute handler
        const result = await handler(input, ctx.get());

        // 11. Audit logging
        if (config.audit) {
          await logAudit(config.audit, input, result);
        }

        // 12. Cache idempotency result
        if (config.idempotent) {
          await cacheIdempotencyResult(req, result, config.idempotencyTTL);
        }

        // 13. Return success response
        const response = createSuccessResponse(result, headers);

        span.setStatus('ok');
        return response;

      } catch (error) {
        span.setStatus('error');
        return handleError(error, headers);
      } finally {
        span.end();

        // Log request completion
        logger.info('request.complete', {
          method: req.method,
          path: new URL(req.url).pathname,
          status: response?.status,
          duration: performance.now() - startTime,
        });
      }
    });
  };
}
```

### Error Mapping (NEW)

```typescript
// gateway/src/errors/mapper.ts

import { DomainError, ErrorCode } from '@unisane/kernel/errors';

interface ErrorResponse {
  status: number;
  body: {
    ok: false;
    error: {
      code: string;
      message: string;
      details?: unknown;
      requestId: string;
    };
  };
}

const HTTP_STATUS_MAP: Record<ErrorCode, number> = {
  // Authentication
  'AUTH_REQUIRED': 401,
  'AUTH_INVALID_CREDENTIALS': 401,
  'AUTH_TOKEN_EXPIRED': 401,

  // Authorization
  'FORBIDDEN': 403,
  'INSUFFICIENT_PERMISSIONS': 403,
  'TENANT_ACCESS_DENIED': 403,

  // Not Found
  'NOT_FOUND': 404,
  'RESOURCE_NOT_FOUND': 404,

  // Validation
  'VALIDATION_FAILED': 400,
  'INVALID_INPUT': 400,

  // Conflict
  'CONFLICT': 409,
  'DUPLICATE': 409,
  'OPTIMISTIC_LOCK_FAILED': 409,

  // Rate Limiting
  'RATE_LIMITED': 429,

  // Business Logic
  'INSUFFICIENT_CREDITS': 402,
  'SUBSCRIPTION_REQUIRED': 402,
  'FEATURE_DISABLED': 403,
  'QUOTA_EXCEEDED': 429,

  // Server Errors
  'INTERNAL_ERROR': 500,
  'SERVICE_UNAVAILABLE': 503,
};

export function mapErrorToResponse(error: unknown): ErrorResponse {
  const { requestId } = ctx.get();

  // Domain errors (expected)
  if (error instanceof DomainError) {
    const status = HTTP_STATUS_MAP[error.code] || 500;

    return {
      status,
      body: {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          requestId,
        },
      },
    };
  }

  // Zod validation errors
  if (error instanceof z.ZodError) {
    return {
      status: 400,
      body: {
        ok: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Request validation failed',
          details: formatZodError(error),
          requestId,
        },
      },
    };
  }

  // Unknown errors (unexpected)
  logger.error('Unhandled error', { error });

  return {
    status: 500,
    body: {
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        requestId,
      },
    },
  };
}

function formatZodError(error: z.ZodError) {
  return error.errors.map(e => ({
    path: e.path.join('.'),
    message: e.message,
  }));
}
```

---

## Module System

### Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MODULE LAYER ARCHITECTURE                        │
│                                                                          │
│  LAYER 0 (Foundation):                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                            kernel                                 │   │
│  │  ctx, db, events, cache, errors, observability, utils, rbac      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                           gateway                                 │   │
│  │  handler, auth, middleware, errors, query, response              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                                    ▼                                     │
│  LAYER 1 (Core - kernel only):                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                         │
│  │  identity  │  │  settings  │  │  storage   │                         │
│  └────────────┘  └────────────┘  └────────────┘                         │
│         │               │               │                                │
│         ▼               ▼               ▼                                │
│  LAYER 2 (depends on Layer 1):                                           │
│  ┌────────────┐  ┌────────────┐                                         │
│  │  tenants   │  │   auth     │                                         │
│  │ (identity) │  │ (identity) │                                         │
│  └────────────┘  └────────────┘                                         │
│         │               │                                                │
│         ▼               ▼                                                │
│  LAYER 3 (depends on Layers 1-2):                                        │
│  ┌─────────────────┐  ┌────────────┐  ┌────────────┐                    │
│  │     billing     │  │   flags    │  │   audit    │                    │
│  │ (tenants,       │  │ (settings, │  │ (identity, │                    │
│  │  settings,      │  │  tenants)  │  │  tenants)  │                    │
│  │  flags)         │  │            │  │            │                    │
│  └─────────────────┘  └────────────┘  └────────────┘                    │
│         │                    │               │                           │
│         ▼                    ▼               ▼                           │
│  LAYER 4 (depends on Layers 1-3):                                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │  credits   │  │   usage    │  │   notify   │  │  webhooks  │        │
│  │ (billing,  │  │ (tenants,  │  │  (kernel   │  │ (tenants,  │        │
│  │  tenants)  │  │  billing)  │  │   only)    │  │  events)   │        │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘        │
│                         │                                                │
│                         ▼                                                │
│  LAYER 5 (depends on Layers 1-4):                                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                         │
│  │   media    │  │    pdf     │  │     ai     │                         │
│  │ (storage,  │  │ (storage)  │  │ (usage)    │                         │
│  │  tenants)  │  │            │  │            │                         │
│  └────────────┘  └────────────┘  └────────────┘                         │
│                                                                          │
│  PRO MODULES:                                                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────────┐                     │
│  │ analytics  │  │    sso     │  │ import-export  │                     │
│  │ (tenants,  │  │ (auth,     │  │ (storage,      │                     │
│  │  usage)    │  │  tenants)  │  │  all modules)  │                     │
│  └────────────┘  └────────────┘  └────────────────┘                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Module Structure (Standardized)

Every module follows this structure:

```
packages/{module}/
├── src/
│   ├── index.ts                    # PUBLIC API (barrel export)
│   │
│   ├── domain/                     # PURE - no server dependencies
│   │   ├── schemas.ts              # Zod schemas (client + server)
│   │   ├── types.ts                # TypeScript types
│   │   ├── errors.ts               # Module-specific error classes
│   │   └── constants.ts            # Module constants
│   │
│   ├── service/                    # Business logic (server-only)
│   │   ├── {operation}.ts          # ONE FUNCTION PER FILE
│   │   ├── admin/                  # Admin-only operations
│   │   │   └── {adminOperation}.ts
│   │   ├── handlers.ts             # Event handlers
│   │   └── index.ts                # Barrel export (re-exports all)
│   │
│   └── data/                       # Data access (server-only)
│       ├── types.ts                # Repository interfaces (ports)
│       ├── {entity}.repo.ts        # Repository implementation selector
│       ├── {entity}.repo.mongo.ts  # MongoDB implementation
│       ├── keys.ts                 # Cache key builders
│       └── mappers.ts              # Entity ↔ DTO mappers
│
├── __tests__/
│   ├── unit/
│   │   ├── {operation}.test.ts       # Test per service file
│   │   └── schemas.test.ts
│   ├── integration/
│   │   └── {feature}.integration.test.ts
│   └── fixtures/
│       └── index.ts
│
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Module Public API Pattern

```typescript
// packages/billing/src/index.ts

// ════════════════════════════════════════════════════════════════════════
// TYPES (for TypeScript)
// ════════════════════════════════════════════════════════════════════════
export type {
  Subscription,
  Invoice,
  Payment,
  SubscriptionStatus,
  BillingCycle,
} from './domain/types';

// ════════════════════════════════════════════════════════════════════════
// SCHEMAS (for validation - PURE, works in browser)
// ════════════════════════════════════════════════════════════════════════
export {
  ZSubscribeInput,
  ZCancelInput,
  ZChangePlanInput,
  ZSubscription,
  ZInvoice,
} from './domain/schemas';

// ════════════════════════════════════════════════════════════════════════
// ERRORS (module-specific)
// ════════════════════════════════════════════════════════════════════════
export {
  SubscriptionNotFoundError,
  SubscriptionAlreadyExistsError,
  InsufficientCreditsError,
  InvalidPlanError,
} from './domain/errors';

// ════════════════════════════════════════════════════════════════════════
// SERVICE FUNCTIONS (server-only)
// ════════════════════════════════════════════════════════════════════════
export {
  // Subscription operations
  subscribe,
  cancelSubscription,
  changePlan,
  getSubscription,
  getActiveSubscription,

  // Invoice operations
  getInvoice,
  listInvoices,

  // Payment operations
  getPaymentMethods,
  setDefaultPaymentMethod,
} from './service';

// ════════════════════════════════════════════════════════════════════════
// ADMIN SERVICE (separate namespace)
// ════════════════════════════════════════════════════════════════════════
export * as billingAdmin from './service/admin/admin.service';

// ════════════════════════════════════════════════════════════════════════
// PROVIDER INTERFACE (for dependency injection)
// ════════════════════════════════════════════════════════════════════════
export type { BillingProvider } from './service/types';
export { setBillingProvider } from './service/provider';

// ════════════════════════════════════════════════════════════════════════
// REPOSITORY SETUP (for bootstrap)
// ════════════════════════════════════════════════════════════════════════
export {
  setSubscriptionRepo,
  setInvoiceRepo,
  setPaymentRepo,
} from './data';

export {
  createMongoSubscriptionRepo,
  createMongoInvoiceRepo,
  createMongoPaymentRepo,
} from './data/mongo';

// ════════════════════════════════════════════════════════════════════════
// EVENT HANDLERS (for registration)
// ════════════════════════════════════════════════════════════════════════
export { registerBillingHandlers } from './service/handlers';

// ════════════════════════════════════════════════════════════════════════
// DO NOT EXPORT:
// - Internal helpers
// - Repository implementations directly
// - Anything not part of public contract
// ════════════════════════════════════════════════════════════════════════
```

### Domain Purity Rule (CRITICAL)

```typescript
// ════════════════════════════════════════════════════════════════════════
// DOMAIN PURITY RULE
// ════════════════════════════════════════════════════════════════════════
//
// The domain/ folder must remain PURE - NO server dependencies.
// This is critical because domain/schemas.ts is used by:
//   - Server: Contracts and service validation
//   - Frontend: Form validation with react-hook-form/zod
//
// ════════════════════════════════════════════════════════════════════════

// ✅ ALLOWED in domain/
import { z } from 'zod';
import type { SomeType } from './types';

// ❌ NOT ALLOWED in domain/
import { ctx, db, events } from '@unisane/kernel';  // Server-only
import { getTenant } from '@unisane/tenants';        // Server-only
import { someNodeApi } from 'node:fs';               // Node.js API
```

---

## Platform Layer

### Purpose

Starter-specific infrastructure implementing hexagonal architecture (ports & adapters pattern).
Stays in user's codebase and is NOT extracted to packages.

> **Full Details:** See [platform-layer.md](./platform-layer.md) for comprehensive documentation.

### Structure in Starter (Current State)

```
starters/saaskit/src/platform/
├── auth/                          # Auth session management
├── billing/                       # Billing provider adapters (Stripe, etc.)
├── config/                        # Environment & feature configuration
├── email/                         # Email provider adapters
├── env.ts                         # Zod-validated environment vars
├── init.ts                        # Platform initialization
├── inngest/                       # Background job client
├── jobs/                          # Background job definitions
├── metering/                      # Usage metering (OpenMeter, etc.)
├── oauth/                         # OAuth provider adapters
├── outbox/                        # Guaranteed event delivery
├── telemetry/                     # Observability setup
└── webhooks/                      # Webhook processing
```

### Module Types

The platform layer uses four module types:

| Type | Purpose | Example |
|------|---------|---------|
| **Extensions** | Thin wrappers adding saaskit-specific config | `email/` wrapping `@unisane/notify` |
| **Adapters** | Combining multiple packages | `billing/` combining billing + tenants |
| **Integrations** | Provider-specific implementations | Stripe adapter, OpenMeter integration |
| **Core** | saaskit-only domain logic | Custom business rules |

> This is **intentional hexagonal architecture**, not code duplication.

### Provider Pattern (Detailed)

```typescript
// platform/providers/billing/types.ts

export interface BillingProvider {
  // Customer management
  createCustomer(input: CreateCustomerInput): Promise<Customer>;
  getCustomer(customerId: string): Promise<Customer | null>;
  updateCustomer(customerId: string, input: UpdateCustomerInput): Promise<Customer>;

  // Subscription management
  createSubscription(input: CreateSubscriptionInput): Promise<ProviderSubscription>;
  cancelSubscription(subscriptionId: string, immediate?: boolean): Promise<void>;
  updateSubscription(subscriptionId: string, input: UpdateSubscriptionInput): Promise<ProviderSubscription>;

  // Payment methods
  attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<void>;
  listPaymentMethods(customerId: string): Promise<PaymentMethod[]>;
  setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void>;

  // Invoices
  listInvoices(customerId: string, limit?: number): Promise<ProviderInvoice[]>;

  // Portal
  createPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }>;

  // Webhooks
  constructWebhookEvent(payload: string, signature: string): Promise<WebhookEvent>;
}

export interface CreateCustomerInput {
  email: string;
  name?: string;
  metadata: {
    tenantId: string;
    userId: string;
  };
}

// ... more types
```

```typescript
// platform/providers/billing/stripe.ts

import Stripe from 'stripe';
import type { BillingProvider, CreateCustomerInput } from './types';

export function createStripeProvider(secretKey: string): BillingProvider {
  const stripe = new Stripe(secretKey, {
    apiVersion: '2024-11-20.acacia',
  });

  return {
    async createCustomer(input: CreateCustomerInput) {
      const customer = await stripe.customers.create({
        email: input.email,
        name: input.name,
        metadata: input.metadata,
      });

      return {
        id: customer.id,
        email: customer.email!,
        name: customer.name ?? undefined,
        metadata: customer.metadata as Record<string, string>,
      };
    },

    async createSubscription(input) {
      const subscription = await stripe.subscriptions.create({
        customer: input.customerId,
        items: [{ price: input.priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      });

      return mapStripeSubscription(subscription);
    },

    // ... implement all methods
  };
}
```

```typescript
// platform/providers/billing/index.ts

import { env } from '../config/env';
import { createStripeProvider } from './stripe';
import { createRazorpayProvider } from './razorpay';
import type { BillingProvider } from './types';

export function createBillingProvider(): BillingProvider {
  switch (env.BILLING_PROVIDER) {
    case 'stripe':
      return createStripeProvider(env.STRIPE_SECRET_KEY);
    case 'razorpay':
      return createRazorpayProvider(env.RAZORPAY_KEY_ID, env.RAZORPAY_KEY_SECRET);
    default:
      throw new Error(`Unknown billing provider: ${env.BILLING_PROVIDER}`);
  }
}

export type { BillingProvider };
```

### Jobs System (Inngest)

```typescript
// platform/jobs/client.ts

import { Inngest } from 'inngest';
import { env } from '../config/env';

export const inngest = new Inngest({
  id: 'saaskit',
  eventKey: env.INNGEST_EVENT_KEY,
});
```

```typescript
// platform/jobs/functions/billing.jobs.ts

import { inngest } from '../client';
import { syncSubscription, processWebhook } from '@unisane/billing';

export const syncSubscriptionJob = inngest.createFunction(
  {
    id: 'billing/sync-subscription',
    retries: 3,
  },
  { event: 'billing/subscription.sync-requested' },
  async ({ event, step }) => {
    const { tenantId, subscriptionId } = event.data;

    await step.run('sync-subscription', async () => {
      await syncSubscription(tenantId, subscriptionId);
    });
  }
);

export const processWebhookJob = inngest.createFunction(
  {
    id: 'billing/process-webhook',
    retries: 5,
    concurrency: {
      limit: 10,
    },
  },
  { event: 'billing/webhook.received' },
  async ({ event, step }) => {
    await step.run('process-webhook', async () => {
      await processWebhook(event.data);
    });
  }
);
```

### Outbox Pattern (Detailed)

```typescript
// platform/outbox/types.ts

export interface OutboxEntry {
  id: string;
  eventType: string;
  payload: unknown;
  createdAt: Date;
  processedAt: Date | null;
  attempts: number;
  lastError: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface OutboxRepository {
  insert(entry: Omit<OutboxEntry, 'id' | 'createdAt' | 'processedAt' | 'attempts' | 'lastError' | 'status'>): Promise<OutboxEntry>;
  findPending(limit: number): Promise<OutboxEntry[]>;
  markProcessing(id: string): Promise<void>;
  markCompleted(id: string): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
  deleteOld(olderThan: Date): Promise<number>;
}
```

```typescript
// platform/outbox/processor.ts

import { logger } from '@unisane/kernel';
import { events } from '@unisane/kernel';
import type { OutboxRepository, OutboxEntry } from './types';

export class OutboxProcessor {
  private repository: OutboxRepository;
  private running = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(repository: OutboxRepository) {
    this.repository = repository;
  }

  start(intervalMs = 1000) {
    if (this.running) return;

    this.running = true;
    this.intervalId = setInterval(() => this.processNext(), intervalMs);

    logger.info('Outbox processor started');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.running = false;

    logger.info('Outbox processor stopped');
  }

  private async processNext() {
    const entries = await this.repository.findPending(10);

    for (const entry of entries) {
      await this.processEntry(entry);
    }
  }

  private async processEntry(entry: OutboxEntry) {
    try {
      await this.repository.markProcessing(entry.id);

      // Emit the event
      await events.emit(entry.eventType as any, entry.payload);

      await this.repository.markCompleted(entry.id);

      logger.debug('Outbox entry processed', {
        entryId: entry.id,
        eventType: entry.eventType
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.repository.markFailed(entry.id, errorMessage);

      logger.error('Outbox entry failed', {
        entryId: entry.id,
        eventType: entry.eventType,
        error: errorMessage,
        attempts: entry.attempts + 1,
      });
    }
  }
}
```

---

## Event System

### Event Contract Pattern (NEW)

```typescript
// kernel/src/events/contracts.ts

import { z } from 'zod';

// ════════════════════════════════════════════════════════════════════════
// EVENT VERSIONING
// ════════════════════════════════════════════════════════════════════════
// All events have a version number. When event shape changes:
// 1. Increment version
// 2. Keep old handler for backwards compatibility
// 3. Deprecate old version after migration period
// ════════════════════════════════════════════════════════════════════════

export const EventMeta = z.object({
  eventId: z.string(),
  eventType: z.string(),
  version: z.number(),
  timestamp: z.string().datetime(),
  source: z.string(),
  correlationId: z.string().optional(),
});

export type EventMeta = z.infer<typeof EventMeta>;

// ════════════════════════════════════════════════════════════════════════
// BILLING EVENTS
// ════════════════════════════════════════════════════════════════════════

export const SubscriptionCreatedV1 = z.object({
  _meta: EventMeta,
  tenantId: z.string(),
  subscriptionId: z.string(),
  planId: z.string(),
  billingCycle: z.enum(['monthly', 'yearly']),
  trialEndsAt: z.string().datetime().optional(),
});

export const SubscriptionCancelledV1 = z.object({
  _meta: EventMeta,
  tenantId: z.string(),
  subscriptionId: z.string(),
  reason: z.string().optional(),
  cancelledAt: z.string().datetime(),
  effectiveAt: z.string().datetime(),
});

export const InvoicePaidV1 = z.object({
  _meta: EventMeta,
  tenantId: z.string(),
  invoiceId: z.string(),
  amount: z.number(),
  currency: z.string(),
});

// ════════════════════════════════════════════════════════════════════════
// IDENTITY EVENTS
// ════════════════════════════════════════════════════════════════════════

export const UserCreatedV1 = z.object({
  _meta: EventMeta,
  userId: z.string(),
  email: z.string(),
  name: z.string().optional(),
});

export const UserDeletedV1 = z.object({
  _meta: EventMeta,
  userId: z.string(),
  reason: z.string().optional(),
});

// ════════════════════════════════════════════════════════════════════════
// TENANT EVENTS
// ════════════════════════════════════════════════════════════════════════

export const TenantCreatedV1 = z.object({
  _meta: EventMeta,
  tenantId: z.string(),
  name: z.string(),
  slug: z.string(),
  ownerId: z.string(),
});

export const TenantDeletedV1 = z.object({
  _meta: EventMeta,
  tenantId: z.string(),
  deletedBy: z.string(),
});

// ════════════════════════════════════════════════════════════════════════
// EVENT REGISTRY
// ════════════════════════════════════════════════════════════════════════

export const EventRegistry = {
  // Billing
  'billing.subscription.created': SubscriptionCreatedV1,
  'billing.subscription.cancelled': SubscriptionCancelledV1,
  'billing.invoice.paid': InvoicePaidV1,

  // Identity
  'identity.user.created': UserCreatedV1,
  'identity.user.deleted': UserDeletedV1,

  // Tenants
  'tenant.created': TenantCreatedV1,
  'tenant.deleted': TenantDeletedV1,
} as const;

export type EventType = keyof typeof EventRegistry;
export type EventPayload<T extends EventType> = z.infer<typeof EventRegistry[T]>;
```

### Type-Safe Event Emitter

```typescript
// kernel/src/events/emitter.ts

import { z } from 'zod';
import { nanoid } from 'nanoid';
import { logger } from '../observability';
import { EventRegistry, EventType, EventPayload, EventMeta } from './contracts';

type EventHandler<T extends EventType> = (payload: EventPayload<T>) => Promise<void>;

class TypedEventEmitter {
  private handlers: Map<EventType, Set<EventHandler<any>>> = new Map();

  /**
   * Register an event handler with type safety.
   */
  on<T extends EventType>(
    eventType: T,
    handler: EventHandler<T>
  ): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  /**
   * Emit an event with validation.
   */
  async emit<T extends EventType>(
    eventType: T,
    payload: Omit<EventPayload<T>, '_meta'>
  ): Promise<void> {
    const schema = EventRegistry[eventType];

    // Add metadata
    const fullPayload = {
      ...payload,
      _meta: {
        eventId: nanoid(),
        eventType,
        version: 1,
        timestamp: new Date().toISOString(),
        source: 'saaskit',
      },
    };

    // Validate payload
    const result = schema.safeParse(fullPayload);
    if (!result.success) {
      logger.error('Event validation failed', {
        eventType,
        errors: result.error.errors,
      });
      throw new Error(`Invalid event payload for ${eventType}`);
    }

    logger.debug('Event emitted', { eventType, eventId: fullPayload._meta.eventId });

    // Get handlers
    const handlers = this.handlers.get(eventType);
    if (!handlers?.size) {
      return;
    }

    // Execute handlers (fire and forget)
    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(result.data);
      } catch (error) {
        logger.error('Event handler failed', {
          eventType,
          eventId: fullPayload._meta.eventId,
          error: error instanceof Error ? error.message : 'Unknown',
        });
        // Don't throw - let other handlers continue
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Emit event through outbox for guaranteed delivery.
   */
  async emitReliable<T extends EventType>(
    eventType: T,
    payload: Omit<EventPayload<T>, '_meta'>,
    outbox: OutboxRepository
  ): Promise<void> {
    await outbox.insert({
      eventType,
      payload,
    });

    logger.debug('Event queued in outbox', { eventType });
  }
}

export const events = new TypedEventEmitter();
```

### Event vs Job Decision Tree

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WHEN TO USE WHAT                                      │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  DIRECT FUNCTION CALL (Synchronous)                              │    │
│  │  ─────────────────────────────────────────────────────────────   │    │
│  │  Use when:                                                       │    │
│  │  • Operations MUST succeed together (transactional)             │    │
│  │  • Result needed immediately                                    │    │
│  │  • Same process, same request                                   │    │
│  │                                                                  │    │
│  │  Examples:                                                       │    │
│  │  • Create tenant → Create owner membership                      │    │
│  │  • Subscribe → Update tenant plan                               │    │
│  │  • Create user → Hash password                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  EVENTS - events.emit() (Fire and Forget)                        │    │
│  │  ─────────────────────────────────────────────────────────────   │    │
│  │  Use when:                                                       │    │
│  │  • Side effects that can fail independently                     │    │
│  │  • Multiple listeners need notification                         │    │
│  │  • Decoupling is important                                      │    │
│  │  • Best-effort delivery is OK                                   │    │
│  │                                                                  │    │
│  │  Examples:                                                       │    │
│  │  • User created → Log audit entry                               │    │
│  │  • Subscription created → Update analytics                      │    │
│  │  • Settings changed → Invalidate cache                          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  OUTBOX - events.emitReliable() (Guaranteed)                     │    │
│  │  ─────────────────────────────────────────────────────────────   │    │
│  │  Use when:                                                       │    │
│  │  • Delivery MUST happen (business critical)                     │    │
│  │  • External webhook must be fired                               │    │
│  │  • Email must be sent                                           │    │
│  │  • Retry on failure is required                                 │    │
│  │                                                                  │    │
│  │  Examples:                                                       │    │
│  │  • Invoice paid → Send receipt email                            │    │
│  │  • Subscription cancelled → Fire webhook                        │    │
│  │  • User deleted → Notify external systems                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  INNGEST JOBS (Background Processing)                            │    │
│  │  ────────────────────────────��────────────────────────────────   │    │
│  │  Use when:                                                       │    │
│  │  • Long-running operations                                      │    │
│  │  • Scheduled/cron tasks                                         │    │
│  │  • Complex workflows with steps                                 │    │
│  │  • Rate-limited operations                                      │    │
│  │  • Fan-out processing                                           │    │
│  │                                                                  │    │
│  │  Examples:                                                       │    │
│  │  • Generate monthly report (cron)                               │    │
│  │  • Process bulk import (long-running)                           │    │
│  │  • Sync with external API (rate-limited)                        │    │
│  │  • Send batch emails (fan-out)                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Error Handling

### Domain Error Classes

```typescript
// kernel/src/errors/base.ts

export type ErrorCode =
  // Authentication
  | 'AUTH_REQUIRED'
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_TOKEN_EXPIRED'
  | 'AUTH_SESSION_INVALID'

  // Authorization
  | 'FORBIDDEN'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'TENANT_ACCESS_DENIED'

  // Not Found
  | 'NOT_FOUND'
  | 'RESOURCE_NOT_FOUND'

  // Validation
  | 'VALIDATION_FAILED'
  | 'INVALID_INPUT'

  // Conflict
  | 'CONFLICT'
  | 'DUPLICATE'
  | 'ALREADY_EXISTS'
  | 'OPTIMISTIC_LOCK_FAILED'

  // Rate Limiting
  | 'RATE_LIMITED'

  // Business Logic
  | 'INSUFFICIENT_CREDITS'
  | 'SUBSCRIPTION_REQUIRED'
  | 'FEATURE_DISABLED'
  | 'QUOTA_EXCEEDED'
  | 'INVALID_STATE'

  // Server Errors
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'PROVIDER_ERROR';

/**
 * Base class for all domain errors.
 * These are expected errors that should be mapped to HTTP responses.
 */
export class DomainError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

// ════════════════════════════════════════════════════════════════════════
// CONVENIENCE ERROR CLASSES
// ════════════════════════════════════════════════════════════════════════

export class AuthenticationError extends DomainError {
  constructor(message = 'Authentication required') {
    super('AUTH_REQUIRED', message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends DomainError {
  constructor(message = 'Access denied') {
    super('FORBIDDEN', message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;
    super('NOT_FOUND', message, { resource, id });
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_FAILED', message, details);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, details?: unknown) {
    super('CONFLICT', message, details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends DomainError {
  constructor(
    message = 'Too many requests',
    public readonly retryAfter?: number
  ) {
    super('RATE_LIMITED', message, { retryAfter });
    this.name = 'RateLimitError';
  }
}

export class BusinessError extends DomainError {
  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(code, message, details);
    this.name = 'BusinessError';
  }
}
```

### Module-Specific Errors

```typescript
// packages/billing/src/domain/errors.ts

import { DomainError, NotFoundError, BusinessError } from '@unisane/kernel/errors';

export class SubscriptionNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super('Subscription', id);
  }
}

export class InvoiceNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super('Invoice', id);
  }
}

export class SubscriptionAlreadyExistsError extends DomainError {
  constructor(tenantId: string) {
    super('ALREADY_EXISTS', 'Tenant already has an active subscription', { tenantId });
  }
}

export class InsufficientCreditsError extends BusinessError {
  constructor(required: number, available: number) {
    super(
      'INSUFFICIENT_CREDITS',
      `Insufficient credits. Required: ${required}, Available: ${available}`,
      { required, available }
    );
  }
}

export class InvalidPlanError extends DomainError {
  constructor(planId: string) {
    super('INVALID_INPUT', `Invalid plan: ${planId}`, { planId });
  }
}

export class SubscriptionInvalidStateError extends BusinessError {
  constructor(current: string, expected: string[]) {
    super(
      'INVALID_STATE',
      `Cannot perform operation. Subscription is ${current}, expected: ${expected.join(' or ')}`,
      { current, expected }
    );
  }
}
```

---

## Testing Strategy

### Test Types and Locations

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          TESTING PYRAMID                                 │
│                                                                          │
│                        ┌─────────────┐                                   │
│                        │    E2E      │  Few, slow, high confidence       │
│                        │   Tests     │  starters/saaskit/e2e/            │
│                        └─────────────┘                                   │
│                                                                          │
│                   ┌───────────────────────┐                              │
│                   │   Integration Tests    │  Some, medium speed         │
│                   │   packages/*/__tests__/│  packages/*/integration/    │
│                   │   integration/         │                             │
│                   └───────────────────────┘                              │
│                                                                          │
│          ┌───────────────────────────────────────┐                       │
│          │            Unit Tests                  │  Many, fast          │
│          │      packages/*/__tests__/unit/        │  Mocked deps         │
│          └───────────────────────────────────────┘                       │
│                                                                          │
│    ┌───────────────────────────────────────────────────┐                 │
│    │                 Schema Tests                       │  Fast           │
│    │           packages/*/__tests__/schemas.test.ts     │  No deps        │
│    └───────────────────────────────────────────────────┘                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Test File Locations

```
packages/{module}/
├── src/
│   └── ...
│
└── __tests__/
    ├── unit/                           # Fast, mocked dependencies
    │   ├── {entity}.service.test.ts
    │   └── ...
    │
    ├── integration/                    # Slower, real database
    │   └── {entity}.integration.test.ts
    │
    ├── schemas.test.ts                 # Schema validation tests
    │
    └── fixtures/                       # Test data factories
        ├── index.ts
        ├── {entity}.fixture.ts
        └── ...
```

### Test Utilities Package

```typescript
// packages/test-utils/src/index.ts

export { createMockContext, mockContext } from './context';
export { createTestDb, cleanupTestDb } from './database';
export { createMockEvents, expectEvent } from './events';
export { createMockCache } from './cache';
export { createMockLogger } from './logger';

// Re-export fixtures
export * from './fixtures';
```

```typescript
// packages/test-utils/src/context.ts

import { vi } from 'vitest';
import type { RequestContext } from '@unisane/kernel';

export function createMockContext(overrides: Partial<RequestContext> = {}): RequestContext {
  return {
    requestId: 'test-request-id',
    startTime: Date.now(),
    isAuthenticated: true,
    authMethod: 'session',
    userId: 'test-user-id',
    tenantId: 'test-tenant-id',
    role: 'owner',
    permissions: ['*'],
    ...overrides,
  };
}

export function mockContext(overrides: Partial<RequestContext> = {}) {
  const mockCtx = createMockContext(overrides);

  vi.mock('@unisane/kernel', async (importOriginal) => {
    const original = await importOriginal<typeof import('@unisane/kernel')>();
    return {
      ...original,
      ctx: {
        ...original.ctx,
        get: vi.fn(() => mockCtx),
        tryGet: vi.fn(() => mockCtx),
      },
    };
  });

  return mockCtx;
}
```

```typescript
// packages/test-utils/src/database.ts

import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';

let mongod: MongoMemoryServer;
let client: MongoClient;

export async function createTestDb() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  client = new MongoClient(uri);
  await client.connect();

  return client.db();
}

export async function cleanupTestDb() {
  await client?.close();
  await mongod?.stop();
}

export function getTestDb() {
  return client.db();
}
```

### Unit Test Example

```typescript
// packages/billing/src/__tests__/unit/subscription.service.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockContext, createMockEvents } from '@unisane/test-utils';
import { subscribe, cancelSubscription } from '../../service/subscription.service';
import { setSubscriptionRepo } from '../../data';
import { SubscriptionAlreadyExistsError } from '../../domain/errors';

describe('subscription.service', () => {
  const mockRepo = {
    findByTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  const mockEvents = createMockEvents();

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext({ tenantId: 'tenant-123', userId: 'user-123' });
    setSubscriptionRepo(mockRepo);
  });

  describe('subscribe', () => {
    it('creates subscription for new tenant', async () => {
      mockRepo.findByTenant.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue({
        id: 'sub-123',
        tenantId: 'tenant-123',
        planId: 'pro',
        status: 'active',
      });

      const result = await subscribe({
        planId: 'pro',
        billingCycle: 'monthly',
      });

      expect(result.id).toBe('sub-123');
      expect(result.planId).toBe('pro');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-123',
          planId: 'pro',
        })
      );
    });

    it('throws if tenant already has subscription', async () => {
      mockRepo.findByTenant.mockResolvedValue({
        id: 'existing-sub',
        status: 'active',
      });

      await expect(subscribe({ planId: 'pro', billingCycle: 'monthly' }))
        .rejects.toThrow(SubscriptionAlreadyExistsError);
    });
  });

  describe('cancelSubscription', () => {
    it('cancels active subscription', async () => {
      mockRepo.findByTenant.mockResolvedValue({
        id: 'sub-123',
        status: 'active',
      });
      mockRepo.update.mockResolvedValue({
        id: 'sub-123',
        status: 'cancelled',
        cancelledAt: expect.any(Date),
      });

      const result = await cancelSubscription({ reason: 'Too expensive' });

      expect(result.status).toBe('cancelled');
      expect(mockEvents.emitted('billing.subscription.cancelled')).toBe(true);
    });
  });
});
```

### Integration Test Example

```typescript
// packages/billing/src/__tests__/integration/subscription.integration.test.ts

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createTestDb, cleanupTestDb, getTestDb } from '@unisane/test-utils';
import { ctx } from '@unisane/kernel';
import { subscribe, getSubscription } from '../../service';
import { setSubscriptionRepo } from '../../data';
import { createMongoSubscriptionRepo } from '../../data/subscription.repo.mongo';

describe('subscription integration', () => {
  beforeAll(async () => {
    await createTestDb();
    setSubscriptionRepo(createMongoSubscriptionRepo(getTestDb()));
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  beforeEach(async () => {
    // Clear collections
    await getTestDb().collection('subscriptions').deleteMany({});
  });

  it('full subscription lifecycle', async () => {
    await ctx.run({
      requestId: 'test',
      startTime: Date.now(),
      isAuthenticated: true,
      tenantId: 'tenant-123',
      userId: 'user-123',
      permissions: ['*'],
    }, async () => {
      // Subscribe
      const subscription = await subscribe({
        planId: 'pro',
        billingCycle: 'monthly',
      });

      expect(subscription.id).toBeDefined();
      expect(subscription.status).toBe('active');

      // Fetch
      const fetched = await getSubscription(subscription.id);
      expect(fetched?.planId).toBe('pro');
    });
  });
});
```

### Contract Test Example

```typescript
// packages/billing/src/__tests__/contract.test.ts

import { describe, it, expect } from 'vitest';
import { ZSubscribeInput, ZSubscription, ZCancelInput } from '../domain/schemas';

describe('billing contracts', () => {
  describe('ZSubscribeInput', () => {
    it('accepts valid input', () => {
      const result = ZSubscribeInput.safeParse({
        planId: 'pro',
        billingCycle: 'monthly',
      });

      expect(result.success).toBe(true);
    });

    it('rejects invalid planId', () => {
      const result = ZSubscribeInput.safeParse({
        planId: 'invalid',
        billingCycle: 'monthly',
      });

      expect(result.success).toBe(false);
    });

    it('accepts optional couponCode', () => {
      const result = ZSubscribeInput.safeParse({
        planId: 'pro',
        billingCycle: 'yearly',
        couponCode: 'SAVE20',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.couponCode).toBe('SAVE20');
      }
    });
  });

  describe('ZSubscription', () => {
    it('validates subscription output', () => {
      const result = ZSubscription.safeParse({
        id: 'sub_123',
        tenantId: 'ten_456',
        planId: 'pro',
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodStart: '2025-01-01T00:00:00Z',
        currentPeriodEnd: '2025-02-01T00:00:00Z',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      });

      expect(result.success).toBe(true);
    });
  });
});
```

---

## Distribution

> **Implementation Status:** The build pipeline described below is a **design spec** - not yet implemented.
> See [build-distribution.md](./build-distribution.md) for full details and [implementation-status.md](./implementation-status.md) for current status.

### UI Integration (IMPROVED - No Symlinks)

```
┌─────────────────────────────────────────────────────────────────────────┐
│           UI INTEGRATION - WORKSPACE PACKAGES (NOT SYMLINKS)             │
│                                                                          │
│  WHY NOT SYMLINKS:                                                       │
│  ❌ Windows requires admin for symlinks                                  │
│  ❌ Git doesn't handle symlinks well cross-platform                      │
│  ❌ IDE issues with symlinked directories                                │
│  ❌ CI/CD complexity                                                     │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════    │
│                                                                          │
│  SOLUTION: Workspace packages + Build-time copy                          │
│                                                                          │
│  IN MONOREPO (development):                                              │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  starters/saaskit/package.json                                   │    │
│  │  {                                                               │    │
│  │    "dependencies": {                                             │    │
│  │      "@unisane/ui": "workspace:*",                              │    │
│  │      "@unisane/data-table": "workspace:*"                       │    │
│  │    }                                                             │    │
│  │  }                                                               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  IMPORTS (development):                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  // In starter - imports from workspace package                  │    │
│  │  import { Button } from '@unisane/ui';                          │    │
│  │  import { DataTable } from '@unisane/data-table';               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════    │
│                                                                          │
│  BUILD PROCESS (distribution):                                           │
│  1. Copy UI source to output/src/components/                            │
│  2. Transform imports: @unisane/ui → @/components/ui                    │
│  3. User gets source code, no workspace deps                            │
│                                                                          │
│  OUTPUT (what user gets):                                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  my-saas/src/                                                    │    │
│  │  ├── components/                                                 │    │
│  │  │   ├── ui/                   # Copied from @unisane/ui        │    │
│  │  │   │   ├── button.tsx                                         │    │
│  │  │   │   └── ...                                                │    │
│  │  │   ├── data-table/           # Copied from @unisane/data-table│    │
│  │  │   └── lib/                  # Utilities                      │    │
│  │  └── ...                                                         │    │
│  │                                                                  │    │
│  │  // User's imports (transformed):                                │    │
│  │  import { Button } from '@/components/ui';                      │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  BENEFITS:                                                               │
│  ✅ Cross-platform (no symlink issues)                                   │
│  ✅ Standard pnpm workspace pattern                                      │
│  ✅ IDE autocomplete works                                               │
│  ✅ Hot reload works                                                     │
│  ✅ User owns the code (shadcn pattern)                                  │
│  ✅ No @unisane/* in user's package.json                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Build Pipeline (Design Spec)

> **Status:** NOT IMPLEMENTED - This is the planned design.

```typescript
// tools/release/src/build-starter.ts (PLANNED - NOT IMPLEMENTED)

import { copySync, readFileSync, writeFileSync, rmSync } from 'fs-extra';
import { glob } from 'glob';
import path from 'path';
import { transform } from './transforms';

interface BuildOptions {
  template: 'oss' | 'pro';
  starter: string;
  outputDir: string;
  version: string;
}

export async function buildStarter(options: BuildOptions) {
  const { template, starter, outputDir, version } = options;

  console.log(`Building ${starter} (${template}) v${version}...`);

  // 1. Clean output directory
  rmSync(outputDir, { recursive: true, force: true });

  // 2. Copy starter source
  copySync(`starters/${starter}`, outputDir, {
    filter: (src) => !src.includes('node_modules'),
  });

  // 3. Flatten business modules
  await flattenModules(outputDir);

  // 4. Copy UI packages to components
  await copyUIPackages(outputDir);

  // 5. Strip PRO content (for OSS builds)
  if (template === 'oss') {
    await stripProContent(outputDir);
  }

  // 6. Transform imports
  await transformImports(outputDir);

  // 7. Update package.json
  await updatePackageJson(outputDir, version, template);

  // 8. Generate types
  await generateTypes(outputDir);

  // 9. Validate output
  await validateOutput(outputDir);

  console.log(`✅ Build complete: ${outputDir}`);
}

async function flattenModules(outputDir: string) {
  const modules = [
    'kernel', 'gateway', 'identity', 'settings', 'storage',
    'tenants', 'auth', 'billing', 'flags', 'audit',
    'credits', 'usage', 'notify', 'webhooks',
    'media', 'pdf', 'ai',
  ];

  for (const module of modules) {
    const source = `packages/${module}/src`;
    const target = path.join(outputDir, 'src/modules', module);

    copySync(source, target);
  }

  console.log(`  ✓ Flattened ${modules.length} modules`);
}

async function copyUIPackages(outputDir: string) {
  // Copy @unisane/ui
  copySync('packages/ui/src/components', path.join(outputDir, 'src/components/ui'));
  copySync('packages/ui/src/hooks', path.join(outputDir, 'src/components/hooks'));
  copySync('packages/ui/src/lib', path.join(outputDir, 'src/components/lib'));

  // Copy @unisane/data-table
  copySync('packages/data-table/src', path.join(outputDir, 'src/components/data-table'));

  console.log('  ✓ Copied UI packages');
}

async function transformImports(outputDir: string) {
  const files = glob.sync(path.join(outputDir, 'src/**/*.{ts,tsx}'));

  for (const file of files) {
    let content = readFileSync(file, 'utf-8');

    // Transform module imports
    content = content.replace(
      /@unisane\/(kernel|gateway|identity|tenants|auth|billing|credits|settings|flags|audit|notify|webhooks|storage|usage|media|pdf|ai)/g,
      '@/modules/$1'
    );

    // Transform UI imports
    content = content.replace(/@unisane\/ui/g, '@/components/ui');
    content = content.replace(/@unisane\/data-table/g, '@/components/data-table');

    writeFileSync(file, content);
  }

  console.log(`  ✓ Transformed imports in ${files.length} files`);
}

async function updatePackageJson(outputDir: string, version: string, template: string) {
  const pkgPath = path.join(outputDir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

  // Update version
  pkg.version = version;

  // Remove workspace dependencies
  delete pkg.dependencies['@unisane/kernel'];
  delete pkg.dependencies['@unisane/gateway'];
  delete pkg.dependencies['@unisane/ui'];
  delete pkg.dependencies['@unisane/data-table'];
  // ... remove all @unisane/* deps

  // Add metadata
  pkg.unisane = {
    template,
    version,
    generatedAt: new Date().toISOString(),
  };

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  console.log('  ✓ Updated package.json');
}
```

### PRO Stripping (AST-based)

```typescript
// tools/release/src/strip-pro.ts

import { Project, SyntaxKind } from 'ts-morph';

const PRO_MARKER_START = '@pro-only - start';
const PRO_MARKER_END = '@pro-only - end';

export async function stripProContent(outputDir: string) {
  const project = new Project({
    tsConfigFilePath: path.join(outputDir, 'tsconfig.json'),
  });

  // Remove PRO modules entirely
  const proModules = ['analytics', 'sso', 'import-export'];
  for (const module of proModules) {
    const modulePath = path.join(outputDir, 'src/modules', module);
    rmSync(modulePath, { recursive: true, force: true });
  }

  // Remove PRO-marked code sections
  const sourceFiles = project.getSourceFiles();

  for (const sourceFile of sourceFiles) {
    const text = sourceFile.getFullText();

    // Remove @pro-only marked sections
    const stripped = removeProSections(text);

    if (stripped !== text) {
      sourceFile.replaceWithText(stripped);
    }
  }

  await project.save();

  console.log('  ✓ Stripped PRO content');
}

function removeProSections(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let inProSection = false;

  for (const line of lines) {
    if (line.includes(PRO_MARKER_START)) {
      inProSection = true;
      continue;
    }

    if (line.includes(PRO_MARKER_END)) {
      inProSection = false;
      continue;
    }

    if (!inProSection) {
      result.push(line);
    }
  }

  return result.join('\n');
}
```

---

## Versioning & Upgrades

### Semantic Versioning

```
MAJOR.MINOR.PATCH

MAJOR: Breaking changes to module APIs
  - Function signatures changed
  - Types restructured
  - Removal of deprecated features

MINOR: New features, backward-compatible
  - New service functions
  - New schemas
  - New optional parameters

PATCH: Bug fixes only
  - Security patches
  - Performance improvements
  - Documentation fixes
```

### Module Versioning (NEW)

Each module package has its own version:

```json
// packages/billing/package.json
{
  "name": "@unisane/billing",
  "version": "1.2.0"
}
```

### Changelog Format

```markdown
# Changelog

## [1.2.0] - 2025-02-01

### Added
- `pauseSubscription()` - Pause subscription temporarily
- `resumeSubscription()` - Resume paused subscription
- New `SubscriptionPausedV1` event

### Changed
- `cancelSubscription()` now accepts optional `immediate` parameter

### Deprecated
- `cancelImmediately()` - Use `cancelSubscription({ immediate: true })` instead

### Migration
See [v1.1 to v1.2 Migration Guide](./migrations/1.1-to-1.2.md)

---

## [1.1.0] - 2025-01-15

### Added
- Credits module for usage-based billing
- `getUsageReport()` function

### Fixed
- Race condition in concurrent subscription updates
```

### Upgrade CLI

```bash
# Check for updates
npx unisane upgrade --check

# Output:
# Current: v1.1.0
# Latest: v1.2.0
#
# Changes:
#   + pauseSubscription() added
#   + resumeSubscription() added
#   ~ cancelSubscription() signature changed (optional param added)
#   ! cancelImmediately() deprecated
#
# Run `npx unisane upgrade` to apply

# Show diff
npx unisane upgrade --diff

# Apply upgrade interactively
npx unisane upgrade

# Auto-apply non-breaking changes
npx unisane upgrade --auto
```

---

## Migration Phases

### Phase 0: Preparation (1-2 days)

```
□ Backup all repositories
□ Document current SaasKit module boundaries
□ Create dependency graph from actual imports
□ Audit UI components: SaasKit vs Unisane UI
□ Set up new branch for migration
```

### Phase 1: Restructure Monorepo (2-3 days)

```
□ Create new directory structure
□ Update pnpm-workspace.yaml
□ Update turbo.json
□ Create tsconfig hierarchy
□ Set up ESLint import restrictions
□ Verify existing packages still build
```

### Phase 2: Create Kernel (3-4 days)

```
□ Implement context system
□ Implement database with transactions
□ Implement event system with contracts
□ Implement cache layer
□ Implement error classes
□ Implement observability (logger, tracer, metrics)
□ Implement utilities (crypto, ids, money, normalize)
□ Implement RBAC
□ Write tests for all kernel components
□ Document kernel API
```

### Phase 3: Create Gateway (2-3 days)

```
□ Implement handler factory
□ Implement auth plugin interface
□ Implement middleware (rate limit, idempotency, csrf)
□ Implement error mapping
□ Implement query DSL
□ Write tests for gateway components
□ Document gateway API
```

### Phase 4: Extract Modules (5-7 days)

```
LAYER 1 (kernel only):
□ Extract identity module
□ Extract settings module
□ Extract storage module

LAYER 2 (kernel + Layer 1):
□ Extract tenants module
□ Extract auth module

LAYER 3 (kernel + Layers 1-2):
□ Extract billing module
□ Extract flags module
□ Extract audit module

LAYER 4 (kernel + Layers 1-3):
□ Extract credits module
□ Extract usage module
□ Extract notify module
□ Extract webhooks module

LAYER 5 (kernel + Layers 1-4):
□ Extract media module
□ Extract pdf module
□ Extract ai module

For each module:
□ Create package structure
□ Copy code from SaasKit
□ Organize service files (one function per file, barrel export)
□ Refactor to use @unisane/kernel
□ Create barrel export (index.ts)
□ Write/update tests
□ Verify builds
```

### Phase 5: Create Starter Template (3-4 days)

```
□ Create starters/saaskit/
□ Set up Next.js App Router structure
□ Create platform/ layer (providers, jobs, outbox)
□ Create routes/ layer (API handlers)
□ Create bootstrap.ts
□ Set up UI package dependencies
□ Update package.json
□ Verify dev server works
□ Verify build works
```

### Phase 6: Build Tools (2-3 days)

```
□ Create build-starter.ts
□ Create strip-pro.ts
□ Create import transformer
□ Create package.json updater
□ Create output validator
□ Test OSS build
□ Test PRO build
□ Verify output structure
```

### Phase 7: CLI (2-3 days)

```
□ Create unified CLI package
□ Implement `create` command
□ Implement `upgrade` command
□ Implement `add` command (UI components)
□ Implement `db` command (migrate, seed)
□ Implement `doctor` command
□ Test CLI locally
□ Prepare for npm publish
```

### Phase 8: Testing & Documentation (3-4 days)

```
□ E2E test: create new project via CLI
□ E2E test: all features work in output project
□ E2E test: upgrade flow
□ Performance test: build times
□ Update all documentation
□ Create migration guide for existing users
□ Review and fix issues
```

### Phase 9: Launch (1-2 days)

```
□ Archive old SaasKit repository
□ Publish CLI to npm
□ Update landing page
□ Announce migration complete
□ Monitor for issues
```

---

## Checklists

### New Module Checklist

```
□ Create package directory structure
□ Implement domain/ (schemas, types, errors)
□ Implement service/ (one function per file, barrel export)
□ Implement data/ (repository interface + mongo implementation)
□ Create barrel export (index.ts)
□ Add to layer architecture (update dependency docs)
□ Add to pnpm-workspace.yaml
□ Add to turbo.json
□ Write unit tests
□ Write integration tests
□ Write schema tests
□ Document public API
□ Add to build script
```

### New Event Checklist

```
□ Define event schema in kernel/src/events/contracts.ts
□ Add version number (start with V1)
□ Add to EventRegistry
□ Document event in module docs
□ Implement event emission in service
□ Register event handlers (if any)
□ Write tests for event emission
□ Write tests for event handling
```

### Pre-Release Checklist

```
□ All tests passing
□ No TypeScript errors
□ No ESLint errors
□ Build completes successfully
□ OSS build tested
□ PRO build tested
□ CLI create command tested
□ CLI upgrade command tested
□ Documentation updated
□ Changelog updated
□ Version numbers updated
□ Migration guide written (if breaking changes)
```

---

## Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FINALIZED ARCHITECTURE v2.0                           │
│                                                                          │
│  PATTERN: Clean Modular Monolith                                         │
│                                                                          │
│  KEY IMPROVEMENTS FROM v1:                                               │
│  ✅ Transactions in kernel (data integrity)                              │
│  ✅ Typed event contracts with versioning                                │
│  ✅ Domain error classes + gateway mapping                               │
│  ✅ Observability (logging, tracing, metrics)                            │
│  ✅ Workspace packages instead of symlinks                               │
│  ✅ AST-based PRO stripping                                              │
│  ✅ Comprehensive testing strategy                                       │
│  ✅ Module versioning + upgrade path                                     │
│  ✅ Tenant isolation helpers                                             │
│                                                                          │
│  MODULES: 18 + 3 PRO                                                     │
│  Layer 0: kernel, gateway                                                │
│  Layer 1: identity, settings, storage                                    │
│  Layer 2: tenants, auth                                                  │
│  Layer 3: billing, flags, audit                                          │
│  Layer 4: credits, usage, notify, webhooks                               │
│  Layer 5: media, pdf, ai                                                 │
│  PRO:     analytics, sso, import-export                                  │
│                                                                          │
│  DISTRIBUTION:                                                           │
│  • Source code ownership (no runtime deps)                               │
│  • Workspace packages → Build-time copy                                  │
│  • OSS (MIT) + PRO (Commercial)                                          │
│  • CLI for create/upgrade/add                                            │
│                                                                          │
│  TIMELINE: ~30 days for full migration                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

**This document is the AUTHORITATIVE source for Unisane architecture.**

Previous docs (01-08) should be considered deprecated and eventually removed or updated to reference this document.

