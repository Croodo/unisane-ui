# Unisane Distribution Architecture

> **Document Purpose**: Comprehensive guide to Unisane's monorepo structure, starter kit architecture, distribution system, and architectural assessment.
>
> **Last Updated**: 2026-01-15

---

## Table of Contents

1. [Overview](#overview)
2. [Vision & Goals](#vision--goals)
3. [Monorepo Structure](#monorepo-structure)
4. [Starter Kit Architecture](#starter-kit-architecture)
5. [Hexagonal Architecture Pattern](#hexagonal-architecture-pattern)
6. [The Distribution Model](#the-distribution-model)
7. [Import Resolution](#import-resolution)
8. [Build Process](#build-process)
9. [Critical Rules](#critical-rules)
10. [Architectural Assessment](#architectural-assessment)
11. [Known Issues & Roadmap](#known-issues--roadmap)
12. [File-by-File Reference](#file-by-file-reference)

---

## Overview

Unisane uses a **"shadcn/ui for Full-Stack"** distribution model:

- **Development**: Monorepo with packages as workspace dependencies
- **Distribution**: Flattened source code that users own and can modify

```
┌─────────────────────────────────────────────────────────────────┐
│                     MONOREPO (We Develop)                       │
│  - Packages in packages/                                        │
│  - Starters in starters/                                        │
│  - workspace:* dependencies                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ build-starter.ts
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  USER'S PROJECT (They Own)                      │
│  - Flattened source in src/modules/                             │
│  - No workspace:* dependencies                                  │
│  - Full code ownership                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Vision & Goals

### Primary Objectives

1. **Universal SaaS Platform Foundation** - Build once, deploy anywhere
2. **Shadcn-Style Distribution** - Source code that users own and can customize
3. **Zero Vendor Lock-in** - Swap any provider (database, billing, email, jobs) via configuration
4. **90%+ Code Reuse** - Same modules work across SaaS, e-commerce, marketplace
5. **Great DX** - Easy to understand, extend, and maintain

### Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Kernel (Pure Infrastructure - No Vendor Dependencies)          │
│  ├── Ports/Interfaces only                                      │
│  ├── Database abstraction (DocumentCollection<T>)               │
│  ├── Cache abstraction (CacheProvider)                          │
│  ├── Jobs abstraction (JobsProviderPort)                        │
│  └── Event system (fire-and-forget + reliable outbox)           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ implements
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Adapters (Pluggable Implementations)                           │
│  ├── @unisane/db-mongodb, @unisane/db-postgres                  │
│  ├── @unisane/cache-redis, @unisane/cache-memory                │
│  ├── @unisane/jobs-inngest, @unisane/jobs-bullmq                │
│  ├── @unisane/billing-stripe, @unisane/billing-razorpay         │
│  └── @unisane/email-resend, @unisane/email-ses                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ wired in
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Bootstrap (Type-Safe Wiring)                                   │
│  createPlatform()                                               │
│    .database('mongodb', { uri })                                │
│    .billing('stripe', { secretKey })                            │
│    .jobs('inngest', { eventKey })                               │
│    .modules([auth, billing, identity])                          │
│    .build()                                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

### Directory Layout

```
unisane-monorepo/
├── packages/
│   ├── foundation/                 # Core framework packages
│   │   ├── kernel/                 # Core utilities, env, events, DB, constants
│   │   ├── gateway/                # API gateway, auth middleware, handlers
│   │   └── contracts/              # Base contract utilities
│   │
│   ├── modules/                    # Feature modules (business logic)
│   │   ├── auth/                   # Authentication
│   │   ├── identity/               # User management
│   │   ├── tenants/                # Multi-tenancy
│   │   ├── billing/                # Subscriptions, payments
│   │   ├── credits/                # Credit system
│   │   ├── usage/                  # Usage tracking
│   │   ├── storage/                # File storage
│   │   ├── notify/                 # Notifications
│   │   ├── audit/                  # Audit logging
│   │   ├── flags/                  # Feature flags
│   │   ├── settings/               # Settings management
│   │   ├── webhooks/               # Webhook handling
│   │   ├── media/                  # Media processing
│   │   ├── ai/                     # AI features
│   │   └── pdf/                    # PDF generation
│   │
│   ├── adapters/                   # Pluggable provider implementations
│   │   ├── billing-stripe/         # Stripe billing adapter
│   │   ├── billing-razorpay/       # Razorpay billing adapter
│   │   ├── storage-s3/             # AWS S3 storage adapter
│   │   ├── storage-gcs/            # Google Cloud Storage adapter
│   │   ├── storage-local/          # Local filesystem adapter
│   │   ├── email-resend/           # Resend email adapter
│   │   ├── email-ses/              # AWS SES email adapter
│   │   ├── identity-mongodb/       # MongoDB identity adapter
│   │   ├── tenants-mongodb/        # MongoDB tenants adapter
│   │   ├── jobs-inngest/           # Inngest jobs adapter
│   │   └── outbox-mongodb/         # MongoDB outbox adapter
│   │
│   ├── pro/                        # PRO-only modules
│   │   ├── analytics/              # Advanced analytics
│   │   ├── sso/                    # SSO (SAML/OAuth)
│   │   └── import-export/          # Data import/export
│   │
│   ├── ui/                         # UI component packages
│   │   ├── core/                   # Base UI components
│   │   ├── data-table/             # Data table component (stays as npm)
│   │   └── tokens/                 # Design tokens
│   │
│   └── tooling/                    # Development tools
│       └── devtools/               # CLI, code generation
│
├── starters/
│   └── saaskit/                    # SaaS starter kit
│
└── docs/                           # Documentation
```

### Package Categories

| Category       | Location                  | Purpose                  | Distribution                               |
| -------------- | ------------------------- | ------------------------ | ------------------------------------------ |
| **Foundation** | `packages/foundation/`    | Core framework           | Flattened to `src/modules/`                |
| **Modules**    | `packages/modules/`       | Business logic           | Flattened to `src/modules/`                |
| **Adapters**   | `packages/adapters/`      | Provider implementations | Flattened to `src/adapters/`               |
| **PRO**        | `packages/pro/`           | Premium features         | Flattened (PRO) or stripped (OSS)          |
| **UI**         | `packages/ui/core/`       | Components               | Flattened to `src/components/ui/`          |
| **Data Table** | `packages/ui/data-table/` | Complex table            | Stays as `@unisane/data-table` npm package |

---

## Starter Kit Architecture

### Purpose of Starters

Starters are **application shells** that:

1. Import business logic from `packages/`
2. Define app-specific configuration
3. Wire everything together at runtime
4. Provide the Next.js application structure

### Correct Starter Structure

```
starters/saaskit/
├── package.json                    # Dependencies (workspace:* in monorepo)
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── unisane.json                    # CLI configuration
├── .env.example
│
├── e2e/                            # E2E tests
├── public/                         # Static assets
│
└── src/
    ├── bootstrap.ts                # Central initialization
    ├── instrumentation.ts          # Next.js instrumentation
    │
    ├── app/                        # Next.js App Router
    │   ├── (auth)/                 # Auth pages
    │   ├── (tenant)/w/[slug]/      # Tenant-scoped pages
    │   ├── (admin)/                # Admin pages
    │   ├── api/                    # API routes
    │   │   └── rest/v1/            # Generated route handlers
    │   └── layout.tsx
    │
    ├── contracts/                  # API contract definitions
    │   ├── meta.ts                 # defineOpMeta, withMeta
    │   ├── app.router.ts           # Combined router
    │   └── *.contract.ts           # Contract files
    │
    ├── sdk/                        # Auto-generated from contracts
    │   ├── clients/
    │   ├── hooks/
    │   └── types/
    │
    ├── platform/                   # App-specific configuration & wiring
    │   ├── init.ts                 # Module initialization
    │   ├── events.ts               # Event schema registration
    │   ├── billing/
    │   │   ├── planMap.ts          # Plan ID mappings per provider
    │   │   └── topupMap.ts         # Topup price ID mappings
    │   ├── email/templates/        # Email templates
    │   ├── metering/               # Entitlements policy
    │   ├── outbox/                 # Outbox implementation
    │   ├── jobs/                   # Job definitions
    │   ├── telemetry/              # StatsD exporter + helpers
    │   └── webhooks/               # Webhook handlers
    │
    ├── components/                 # App-specific React components
    ├── hooks/                      # App-specific React hooks
    ├── context/                    # React contexts
    ├── primitives/                 # Low-level UI primitives
    ├── types/                      # App-specific types
    ├── lib/                        # Third-party wrappers
    ├── db/migrations/              # Database migrations
    └── openapi/                    # Generated OpenAPI spec
```

### What Does NOT Belong in Starters

**CRITICAL**: Starters should NOT duplicate code from `packages/foundation/kernel`:

```
starters/saaskit/src/
├── shared/                         # ❌ WRONG - Most of this duplicates kernel
│   ├── constants/                  # ❌ Duplicate of kernel/src/constants/
│   ├── rbac/                       # ❌ Duplicate of kernel/src/rbac/
│   ├── encoding/                   # ❌ Duplicate of kernel/src/encoding/
│   └── ...
```

**CORRECT**: Import from `@unisane/kernel` instead:

```typescript
// ❌ WRONG
import { SubscriptionStatus } from "@/src/shared/constants/billing";
import { PERM, ROLE } from "@/src/shared/rbac";

// ✅ CORRECT
import { SubscriptionStatus, PERM, ROLE } from "@unisane/kernel";
```

### What CAN Be in Starters

Only **app-specific** code that doesn't exist in packages:

```
starters/saaskit/src/
├── platform/                       # ✅ App-specific wiring & configuration
│   ├── billing/                    # ✅ Plan/price mapping configs only
│   │   ├── planMap.ts              # ✅ Maps plan IDs to provider-specific IDs
│   │   └── topupMap.ts             # ✅ Maps topup amounts to price IDs
│   ├── email/templates/            # ✅ Email templates
│   ├── metering/                   # ✅ Entitlements policy implementation
│   ├── outbox/                     # ✅ MongoDB outbox implementation (to be wired)
│   ├── jobs/registry.ts            # ✅ Job definitions
│   └── telemetry/                  # ✅ StatsD exporter (app-specific)
│
├── shared/                         # ✅ ONLY app-specific additions
│   ├── kitVersion.ts               # ✅ KIT_ID, KIT_VERSION, KIT_CHANNEL
│   ├── settings/definitions.ts     # ✅ Admin UI settings definitions
│   └── index.ts                    # ✅ Re-exports
```

---

## Hexagonal Architecture Pattern

### Overview

The architecture follows hexagonal (ports and adapters) pattern:

- **Kernel** (`packages/foundation/kernel/src/platform/`) = **Ports/Interfaces**
- **Adapters** (`packages/adapters/`) = **Provider Implementations**
- **Starter** (`starters/saaskit/src/platform/`) = **App-specific Configuration**
- **Bootstrap** (`starters/saaskit/src/bootstrap.ts`) = **Wiring Layer**

```
┌─────────────────────────────────────────────────────────────────┐
│  @unisane/kernel/platform (Ports - Abstract)                    │
│  ├── billing/    → BillingProviderAdapter interface             │
│  ├── email/      → EmailProvider interface (setResendProvider)  │
│  ├── storage/    → StorageProvider interface                    │
│  ├── outbox/     → OutboxService interface (setOutboxService)   │
│  └── ports/      → IdentityPort, TenantsPort interfaces         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ implements
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  packages/adapters/ (Concrete Implementations)                  │
│  ├── billing-stripe/     → StripeBillingAdapter                 │
│  ├── billing-razorpay/   → RazorpayBillingAdapter               │
│  ├── email-resend/       → ResendEmailAdapter                   │
│  ├── email-ses/          → SESEmailAdapter                      │
│  ├── storage-s3/         → S3StorageAdapter                     │
│  ├── identity-mongodb/   → IdentityPort implementation          │
│  ├── tenants-mongodb/    → TenantsPort implementation           │
│  ├── jobs-inngest/       → JobsPort implementation              │
│  └── outbox-mongodb/     → OutboxPort implementation            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ wired in
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  starters/saaskit/src/bootstrap.ts (Wiring)                     │
│  ├── setupEmailProviders()    → Creates & registers adapters    │
│  ├── setupBillingProviders()  → Creates & registers adapters    │
│  ├── setupRepositories()      → Wires ports to adapters         │
│  └── setupOutbox()            → Wires outbox service (MISSING)  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ uses config from
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  starters/saaskit/src/platform (App-Specific Config)            │
│  ├── billing/planMap.ts  → Plan ID → Stripe/Razorpay ID mapping │
│  ├── billing/topupMap.ts → Topup → Price ID mapping             │
│  ├── email/templates/    → Email templates                      │
│  ├── metering/           → Entitlements policy                  │
│  ├── outbox/             → MongoDB outbox implementation        │
│  └── jobs/registry.ts    → Job definitions                      │
└─────────────────────────────────────────────────────────────────┘
```

### Two Outbox Systems (Both Correct)

The architecture has **two separate outbox implementations** that serve different purposes:

| System                  | Location                       | Purpose                                 | Status                    |
| ----------------------- | ------------------------------ | --------------------------------------- | ------------------------- |
| **Kernel Event Outbox** | `kernel/src/events/emitter.ts` | Domain events - `events.emitReliable()` | ✅ Correct                |
| **Platform Outbox**     | `kernel/src/platform/outbox/`  | External delivery - emails, webhooks    | ✅ Correct (needs wiring) |

**Why both exist:**

- **Domain events** (`emitTyped`) = internal module communication (loose coupling)
- **Platform outbox** (`OutboxService.enqueue`) = external delivery (reliability to 3rd parties)

---

## The Distribution Model

### Transformation Process

When running `pnpm devtools release build --starter saaskit`:

#### Step 1: Flatten Packages

```
packages/foundation/kernel/src/**   →  dist/src/modules/kernel/**
packages/foundation/gateway/src/**  →  dist/src/modules/gateway/**
packages/modules/auth/src/**        →  dist/src/modules/auth/**
packages/modules/billing/src/**     →  dist/src/modules/billing/**
packages/adapters/billing-stripe/** →  dist/src/adapters/billing-stripe/**
packages/ui/core/src/**             →  dist/src/components/ui/**
```

#### Step 2: Copy Starter Files

```
starters/saaskit/src/app/**         →  dist/src/app/**
starters/saaskit/src/contracts/**   →  dist/src/contracts/**
starters/saaskit/src/platform/**    →  dist/src/platform/**
starters/saaskit/src/components/**  →  dist/src/components/**  (merged)
starters/saaskit/src/hooks/**       →  dist/src/hooks/**
starters/saaskit/src/context/**     →  dist/src/context/**
starters/saaskit/src/bootstrap.ts   →  dist/src/bootstrap.ts
```

#### Step 3: Transform Imports

```typescript
// BEFORE (monorepo)
import { getEnv } from "@unisane/kernel";
import { signup } from "@unisane/auth";
import { StripeBillingAdapter } from "@unisane/billing-stripe";
import { Button } from "@unisane/ui/components/button";
import { DataTable } from "@unisane/data-table";

// AFTER (distributed)
import { getEnv } from "@/modules/kernel";
import { signup } from "@/modules/auth";
import { StripeBillingAdapter } from "@/adapters/billing-stripe";
import { Button } from "@/components/ui/button";
import { DataTable } from "@unisane/data-table"; // ← Stays as npm package!
```

#### Step 4: Clean package.json

```json
// BEFORE (monorepo)
{
  "dependencies": {
    "@unisane/kernel": "workspace:*",
    "@unisane/auth": "workspace:*",
    "@unisane/data-table": "workspace:*",
    "next": "16.0.0"
  }
}

// AFTER (distributed)
{
  "dependencies": {
    "@unisane/data-table": "^1.0.0",  // Only this stays
    "next": "16.0.0"
  }
}
```

### Distributed Project Structure

```
my-saas-app/                        # User's standalone project
├── package.json                    # Clean deps (only @unisane/data-table)
├── tsconfig.json
├── next.config.mjs
│
└── src/
    ├── modules/                    # FLATTENED from packages/
    │   ├── kernel/                 # Foundation
    │   ├── gateway/
    │   ├── auth/
    │   ├── billing/
    │   └── ...
    │
    ├── adapters/                   # FLATTENED from packages/adapters/
    │   ├── billing-stripe/
    │   ├── billing-razorpay/
    │   ├── storage-s3/
    │   └── email-resend/
    │
    ├── components/                 # MERGED: packages/ui + starters/components
    ├── app/                        # From starters/saaskit
    ├── contracts/                  # From starters/saaskit
    ├── platform/                   # From starters/saaskit
    └── bootstrap.ts                # From starters/saaskit
```

---

## Import Resolution

### Monorepo Development

| Import                          | Resolves To                                     |
| ------------------------------- | ----------------------------------------------- |
| `@unisane/kernel`               | `packages/foundation/kernel/src/index.ts`       |
| `@unisane/auth`                 | `packages/modules/auth/src/index.ts`            |
| `@unisane/billing-stripe`       | `packages/adapters/billing-stripe/src/index.ts` |
| `@unisane/ui/components/button` | `packages/ui/core/src/components/button.tsx`    |
| `@unisane/data-table`           | `packages/ui/data-table/src/index.ts`           |
| `@/src/platform/...`            | `starters/saaskit/src/platform/...`             |

### Distributed Project

| Import                      | Resolves To                              |
| --------------------------- | ---------------------------------------- |
| `@/modules/kernel`          | `src/modules/kernel/index.ts`            |
| `@/modules/auth`            | `src/modules/auth/index.ts`              |
| `@/adapters/billing-stripe` | `src/adapters/billing-stripe/index.ts`   |
| `@/components/ui/button`    | `src/components/ui/button.tsx`           |
| `@unisane/data-table`       | `node_modules/@unisane/data-table` (npm) |
| `@/platform/...`            | `src/platform/...`                       |

---

## Build Process

### build-starter.ts Configuration

```typescript
// packages/tooling/devtools/src/commands/release/build-starter.ts

const STARTER_PACKAGES = {
  saaskit: {
    // Foundation packages → src/modules/
    foundation: ["kernel", "gateway", "contracts"],

    // Feature modules → src/modules/
    modules: [
      "auth",
      "identity",
      "tenants",
      "billing",
      "credits",
      "usage",
      "storage",
      "notify",
      "audit",
      "flags",
      "settings",
      "webhooks",
      "media",
      "ai",
      "pdf",
    ],

    // Adapters → src/adapters/
    adapters: [
      "billing-stripe",
      "billing-razorpay",
      "storage-s3",
      "storage-gcs",
      "storage-local",
      "email-resend",
      "email-ses",
      "database-mongodb",
    ],

    // PRO modules (stripped in OSS build)
    pro: ["analytics", "sso", "import-export"],

    // UI packages → src/components/ui/
    ui: ["core"], // NOT data-table (stays as npm)
  },
};
```

### Import Transformation Rules

```typescript
const IMPORT_TRANSFORMS = {
  // Foundation & modules → @/modules/
  "@unisane/kernel": "@/modules/kernel",
  "@unisane/gateway": "@/modules/gateway",
  "@unisane/auth": "@/modules/auth",
  "@unisane/billing": "@/modules/billing",
  // ... all modules

  // Adapters → @/adapters/
  "@unisane/billing-stripe": "@/adapters/billing-stripe",
  "@unisane/storage-s3": "@/adapters/storage-s3",
  // ... all adapters

  // UI → @/components/ui/
  "@unisane/ui/components/": "@/components/ui/",
  "@unisane/ui": "@/components/ui",

  // data-table stays as npm package (NO TRANSFORM)
};
```

---

## Critical Rules

### Rule 1: No Duplicate Code

**NEVER** copy code from `packages/` into `starters/`:

```typescript
// ❌ WRONG: Copying kernel's env.ts to shared/
// starters/saaskit/src/shared/env.ts
const BaseEnvSchema = z.object({ ... });  // Copy of kernel

// ✅ CORRECT: Import from kernel
// starters/saaskit/src/platform/init.ts
import { getEnv } from '@unisane/kernel';
```

### Rule 2: Single Source of Truth

Each piece of code exists in exactly ONE place:

| Code Type       | Lives In                                    | NOT In                                 |
| --------------- | ------------------------------------------- | -------------------------------------- |
| Base env schema | `packages/foundation/kernel/src/env.ts`     | ~~Duplicated in starters~~             |
| Constants       | `packages/foundation/kernel/src/constants/` | ~~`starters/*/src/shared/constants/`~~ |
| RBAC            | `packages/foundation/kernel/src/rbac/`      | ~~`starters/*/src/shared/rbac/`~~      |
| Event schemas   | `packages/modules/*/events.ts`              | ~~Duplicated in starters~~             |
| Business logic  | `packages/modules/*/`                       | ~~`starters/*/src/shared/`~~           |

### Rule 3: Starters Only Contain App-Specific Code

Valid starter code:

- Next.js pages and layouts (`app/`)
- API contracts (`contracts/`)
- Provider wiring (`bootstrap.ts`)
- App-specific config (`platform/billing/planMap.ts`)
- App-specific components and hooks

Invalid starter code:

- Duplicates of kernel constants
- Duplicates of kernel env schema
- Business logic (belongs in modules)

### Rule 4: data-table Stays as NPM

`@unisane/data-table` is the **only** package that remains as an npm dependency.

---

## Architectural Assessment

### Current State: ~85% Hexagonal Compliance

| Goal                | Current State                           | Gap        |
| ------------------- | --------------------------------------- | ---------- |
| Zero vendor lock-in | ✅ All modules import from kernel       | ✅ Done    |
| 90% code reuse      | ~85% (modules use kernel abstractions)  | 🟡 Medium  |
| Shadcn distribution | ✅ All adapters pluggable via bootstrap | ✅ Done    |
| Easy setup          | Modular bootstrap.ts with clear setup   | ✅ Done    |
| Great DX            | Value objects, typed events, adapters   | ✅ Done    |
| Swap providers      | All providers swappable via config      | ✅ Done    |

### What's Working Well ✅

1. **Adapter Pattern for Email/Billing/Storage** - Properly abstracted
2. **Event System** - Type-safe with Zod validation, supports fire-and-forget and reliable delivery
3. **Multi-Tenancy** - AsyncLocalStorage context isolation works correctly
4. **Contract-First Code Generation** - 91% auto-generated from contracts
5. **Platform Outbox Architecture** - Two systems (domain events + external delivery) is correct
6. **Module Repository Migration** - All 22 repository files now import from `@unisane/kernel`
7. **COLLECTIONS Constants** - All collection names use centralized constants

### What Needs Improvement 🟡

1. ~~**MongoDB Hardcoded in 20 Module Files**~~ - ✅ RESOLVED - All modules now import from `@unisane/kernel`
2. ~~**Inngest Hardcoded in Kernel**~~ - ✅ RESOLVED - Deleted, using JobsPort adapter
3. ~~**ioredis Internals Leaked**~~ - ✅ RESOLVED - Cache abstraction via `KVProvider` exists
4. ~~**Platform Outbox Not Wired**~~ - ✅ RESOLVED - Properly wired via bootstrap
5. **Circular Dependencies** - auth ↔ identity ↔ tenants cycles (minor, manageable)
6. ~~**No Database Port Interface**~~ - ✅ RESOLVED - `DatabaseCollection<T>` interface exists
7. ~~**String Literal Collection Names**~~ - ✅ RESOLVED - All use `COLLECTIONS` constants

---

## Known Issues & Roadmap

### ✅ RESOLVED ISSUES

#### 1. ~~MongoDB Hardcoded in 20 Module Files~~ → ✅ COMPLETE

**Status**: All 16 module files migrated to use `@unisane/kernel` exports

**What's Done**:
- ✅ Created `DatabaseCollection<T>` interface in `kernel/src/database/port/types.ts`
- ✅ Created `mongo-adapter.ts` MongoDB implementation
- ✅ Created `memory-adapter.ts` for testing
- ✅ Created `kernel/src/database/objectid.ts` with `ObjectId`, `newObjectId()`, `toObjectId()`, `isValidObjectId()`, `maybeObjectId()`
- ✅ Created `kernel/src/database/mongo-types.ts` re-exporting MongoDB types
- ✅ All 22 module files now import from `@unisane/kernel` instead of `mongodb` directly
- ✅ All collection names use centralized `COLLECTIONS` constants (no string literals)

**Migrated Files** (22 total):
- `billing/src/data/*.repository.mongo.ts` (4 files: subscriptions, payments, invoices, scope-integrations) ✅
- `identity/src/data/*.repository.mongo.ts` (5 files: users, memberships, api-keys, users.queries, users.enrichments) ✅
- `tenants/src/data/tenants.repository.mongo.ts` ✅
- `audit/src/data/audit.repository.mongo.ts` ✅
- `settings/src/data/settings.repository.mongo.ts` ✅
- `notify/src/data/*.repository.mongo.ts` (2 files: notifications, suppression) ✅
- `storage/src/data/storage.repository.mongo.ts` ✅
- `flags/src/data/*.repository.mongo.ts` (3 files: flags, overrides, exposures) ✅
- `webhooks/src/data/webhooks.repository.mongo.ts` ✅
- `credits/src/data/credits.repository.mongo.ts` ✅
- `usage/src/data/usage.repository.mongo.ts` ✅
- `auth/src/data/auth.repository.mongo.ts` ✅

**Migration Pattern Used**:
```typescript
// Before (direct MongoDB dependency)
import type { Collection } from "mongodb";
import { ObjectId } from "mongodb";

// After (kernel abstraction)
import {
  col,
  ObjectId,
  type Collection,
  type Document,
  type Filter,
  type WithId,
} from "@unisane/kernel";
```

---

#### 2. ~~Inngest Hardcoded in Kernel~~ → RESOLVED

**Solution**:

- ✅ Deleted `kernel/src/inngest.ts`
- ✅ Created `JobsPort` interface in `kernel/src/ports/jobs.port.ts`
- ✅ Created `@unisane/jobs-inngest` adapter in `packages/adapters/jobs-inngest/`
- ✅ Starter app has its own Inngest client in `platform/inngest/client.ts`
- ✅ Wired via `bootstrap.ts` using `setJobsProvider()`

---

#### 3. ~~Platform Outbox Not Wired~~ → RESOLVED

**Solution**:

- ✅ Created `OutboxPort` interface in `kernel/src/ports/outbox.port.ts`
- ✅ Created `@unisane/outbox-mongodb` adapter in `packages/adapters/outbox-mongodb/`
- ✅ Wired via `bootstrap.ts`:
  - `setOutboxProvider()` - kernel port for outbox operations
  - `setOutboxService()` - platform outbox for email/webhook delivery
  - `setOutboxAccessor()` - for `events.emitReliable()`

---

#### 4. ~~No Database Abstraction Layer~~ → RESOLVED

**Solution**: Database port interface exists in `kernel/src/database/port/types.ts`:

```typescript
export interface DocumentCollection<T> {
  findOne(filter: Filter<T>): Promise<T | null>;
  insertOne(doc: T): Promise<{ insertedId: string }>;
  updateOne(filter: Filter<T>, update: Update<T>): Promise<void>;
  deleteOne(filter: Filter<T>): Promise<void>;
  find(filter: Filter<T>): AsyncIterable<T>;
  // ... more methods
}
```

---

#### 5. ~~Inconsistent Value Objects~~ → RESOLVED

**Solution**: Value objects created in `kernel/src/value-objects/`:

- `email.ts` - Email normalization with canonical form
- `money.ts` - Currency-aware money handling
- `phone.ts` - Phone number normalization
- `slug.ts` - URL-safe slug generation
- `username.ts` - Username validation

---

#### 6. ~~Cache Layer Leaks ioredis~~ → RESOLVED

**Solution**: Cache abstraction exists in `kernel/src/cache/`:

- `provider.ts` - Abstract `KVProvider` interface
- `redis.ts` - Redis/Upstash implementation
- `memory.ts` - In-memory fallback for development

---

#### 7. ~~Bootstrap Complexity~~ → IMPROVED

**Current Status**: Bootstrap is modular with clear setup functions:

- `setupRepositories()` - Wire module ports
- `setupProviders()` - Wire email, billing, storage adapters
- `setupOutbox()` - Wire outbox service and accessor
- `setupJobsProvider()` - Wire jobs adapter

The `createPlatform()` builder pattern is deferred as current bootstrap works well.

---

#### 8. ~~Telemetry Duplication~~ → RESOLVED

**Solution**: Deleted `platform/telemetry/pino.ts`. Only `platform/telemetry/index.ts` remains with StatsD exporter.

---

### 🟢 CURRENT ADAPTER STATUS

| Adapter Package             | Port Interface           | Status       |
| --------------------------- | ------------------------ | ------------ |
| `@unisane/jobs-inngest`     | `JobsPort`               | ✅ Created   |
| `@unisane/outbox-mongodb`   | `OutboxPort`             | ✅ Created   |
| `@unisane/billing-stripe`   | `BillingProviderAdapter` | ✅ Created   |
| `@unisane/billing-razorpay` | `BillingProviderAdapter` | ✅ Created   |
| `@unisane/email-resend`     | `EmailProvider`          | ✅ Created   |
| `@unisane/email-ses`        | `EmailProvider`          | ✅ Created   |
| `@unisane/storage-s3`       | `StorageProvider`        | ✅ Created   |
| `@unisane/storage-gcs`      | `StorageProvider`        | ✅ Created   |
| `@unisane/storage-local`    | `StorageProvider`        | ✅ Created   |
| `@unisane/identity-mongodb` | `IdentityPort`           | ✅ Created   |
| `@unisane/tenants-mongodb`  | `TenantsPort`            | ✅ Created   |
| `@unisane/database-mongodb` | `DatabasePort`           | ✅ Created   |
| `@unisane/db-postgres`      | `DatabasePort`           | 🔲 Deferred  |
| `@unisane/cache-redis`      | `KVProvider`             | 🟡 In kernel (deferred) |
| `@unisane/cache-memory`     | `KVProvider`             | 🟡 In kernel (deferred) |

---

### 🟡 REMAINING IMPROVEMENTS (Non-Blocking)

#### 1. Extract Cache Adapters to Packages

Cache implementations currently live in kernel (`packages/foundation/kernel/src/cache/`):

- `redis.ts` - ioredis adapter with pub/sub support
- `provider.ts` - KV provider with Vercel KV REST client
- `memory.ts` - In-memory fallback for dev/tests

For hexagonal consistency, could extract to:

- `@unisane/cache-redis` - Redis/ioredis adapter
- `@unisane/cache-memory` - In-memory adapter

**Why Deferred**:
1. Cache is a foundational cross-cutting concern used everywhere
2. Provider selection already works via env vars (REDIS_URL, KV_REST_API_URL, USE_MEMORY_STORE)
3. Swapping cache providers is rare in practice
4. Current code automatically falls back: Redis → Vercel KV → Memory

**Status**: Deferred - current approach works well for all deployment scenarios.

#### 2. PostgreSQL Database Adapter

For users who prefer PostgreSQL over MongoDB:

- `@unisane/db-postgres`

**Status**: Deferred - types defined, implementation pending demand.

#### 3. createPlatform() Builder

Type-safe builder pattern for bootstrap:

```typescript
const platform = createPlatform()
  .database("mongodb", { uri })
  .billing("stripe", { secretKey })
  .build();
```

**Status**: Deferred - current bootstrap.ts works well.

---

### Fix Priority Roadmap

#### Phase 1: Unblock Distribution (Critical) - ✅ COMPLETE

| Priority | Task                                                   | Status                                     |
| -------- | ------------------------------------------------------ | ------------------------------------------ |
| P0       | Wire `setOutboxService()` in bootstrap                 | ✅ Done                                    |
| P0       | Wire `setOutboxAccessor()` for `events.emitReliable()` | ✅ Done                                    |
| P0       | Move Inngest to `@unisane/jobs-inngest` adapter        | ✅ Done                                    |
| P0       | Create `JobsPort` interface in kernel                  | ✅ Done                                    |
| P0       | Database port interface (`database/port/`)             | ✅ Interface exists                        |
| P0       | **Migrate 22 module files to use kernel imports**      | ✅ Done - all modules import from kernel   |

#### Phase 2: Improve DX (High) - ✅ COMPLETE

| Priority | Task                                             | Status                                |
| -------- | ------------------------------------------------ | ------------------------------------- |
| P1       | Cache abstraction (`KVProvider` interface)       | ✅ Already existed                    |
| P1       | Create value objects (Email, Money, Phone, etc.) | ✅ Done (`value-objects/`)            |
| P1       | Create `createPlatform()` builder                | 🔲 Deferred (bootstrap.ts works well) |
| P1       | Add type-safe event handler registration         | ✅ Done (`onTyped()`, `emitTyped()`)  |

#### Phase 3: Polish (Medium) - ✅ COMPLETE

| Priority | Task                                      | Status                                              |
| -------- | ----------------------------------------- | --------------------------------------------------- |
| P2       | Delete `platform/telemetry/pino.ts`       | ✅ Done                                             |
| P2       | Extract `@unisane/outbox-mongodb` adapter | ✅ Done                                             |
| P2       | Create `OutboxPort` interface in kernel   | ✅ Done                                             |
| P2       | Create distribution CLI                   | 🔲 Deferred                                         |
| P2       | Document adapter pattern                  | ✅ Done (`handbook/architecture/adapters-guide.md`) |

#### Phase 4: Module Migration (Required for DB Swappability) - ✅ COMPLETE

| Priority | Task                                                     | Status      |
| -------- | -------------------------------------------------------- | ----------- |
| P0       | Migrate billing module (4 files) to kernel imports       | ✅ Complete |
| P0       | Migrate identity module (3 files) to kernel imports      | ✅ Complete |
| P0       | Migrate tenants module (1 file) to kernel imports        | ✅ Complete |
| P0       | Migrate audit module (1 file) to kernel imports          | ✅ Complete |
| P0       | Migrate settings module (1 file) to kernel imports       | ✅ Complete |
| P0       | Migrate notify module (1 file) to kernel imports         | ✅ Complete |
| P0       | Migrate storage module (1 file) to kernel imports        | ✅ Complete |
| P0       | Migrate flags module (2 files) to kernel imports         | ✅ Complete |
| P0       | Migrate webhooks module (1 file) to kernel imports       | ✅ Complete |

---

## File-by-File Reference

### bootstrap.ts

**Location**: `starters/saaskit/src/bootstrap.ts`

**Purpose**: Central initialization that wires everything together.

```typescript
// Key sections:
export async function bootstrap() {
  await connectDb();
  await setupRepositories(); // Wire module dependencies
  await setupProviders(); // Wire email, billing, storage adapters
  await setupOutbox(); // ← MISSING - needs to be added
  await registerEventSchemas();
  await registerEventHandlers();
}

// Outbox setup using @unisane/outbox-mongodb adapter:
async function setupOutbox() {
  const { setOutboxService, setOutboxAccessor, setOutboxProvider, col, db } = await import(
    "@unisane/kernel"
  );
  const { createMongoOutboxAdapter } = await import("@unisane/outbox-mongodb");

  // 1. Wire OutboxPort using the MongoDB adapter
  const outboxAdapter = createMongoOutboxAdapter({
    collection: () => db().collection("outbox"),
  });
  setOutboxProvider(outboxAdapter);

  // 2. Wire platform outbox service (backward compatibility)
  setOutboxService({
    enqueue: async (msg) => {
      const res = await outboxAdapter.enqueue({
        tenantId: msg.scopeId,
        kind: msg.kind as "email" | "webhook",
        payload: msg.payload,
      });
      return { id: res.id };
    },
    process: async (batchSize = 50) => {
      const items = await outboxAdapter.claimBatch(new Date(), batchSize);
      return items.length;
    },
  });

  // 3. Wire kernel event outbox for emitReliable()
  setOutboxAccessor(() => ({
    insertOne: async (entry) => {
      await col("events_outbox").insertOne(entry as never);
    },
  }));

  console.log("[bootstrap]   - Outbox providers configured");
}
```

### platform/telemetry/index.ts

**Location**: `starters/saaskit/src/platform/telemetry/index.ts`

**Purpose**: StatsD exporter + app-specific metric helpers

**Keep**:

- `initStatsD()` - StatsD exporter via `onMetricsFlush()`
- `observeHttp()` - HTTP metrics helper
- `incRateLimited()`, `incIdemReplay()`, `incIdemWaitTimeout()` - App helpers

**Delete**: `platform/telemetry/pino.ts` (use `logger` from `@unisane/kernel` instead)

### platform/jobs/registry.ts

**Location**: `starters/saaskit/src/platform/jobs/registry.ts`

**Purpose**: App-specific job definitions

**Current** (tightly coupled to Inngest via kernel):

```typescript
import { inngest } from "@unisane/kernel"; // ← Wrong!
```

**Target** (provider-agnostic):

```typescript
import type { JobContext } from "@unisane/kernel";

export const registry: Record<string, (ctx: JobContext) => Promise<void>> = {
  "deliver-notifications": async (ctx) => {
    /* ... */
  },
  "deliver-webhooks": async (ctx) => {
    /* ... */
  },
  "usage-rollup-hourly": async (ctx) => {
    /* ... */
  },
};
```

---

## Migration Checklist

### Completed Cleanup (2026-01-14)

- [x] Delete `starters/saaskit/src/shared/constants/` - All constants now in kernel
- [x] Delete `starters/saaskit/src/shared/rbac/` - RBAC utilities now in kernel
- [x] Delete `starters/saaskit/src/shared/encoding/` - Base64 utilities now in kernel
- [x] Update all imports to use `@unisane/kernel`
- [x] Keep only app-specific code in `shared/` (kitVersion.ts, settings/definitions.ts)

### Adapter Wiring Completed (2026-01-14)

- [x] Wire `@unisane/billing-stripe` adapter via `bootstrap.ts`
- [x] Wire `@unisane/billing-razorpay` adapter via `bootstrap.ts`
- [x] Wire `@unisane/email-resend` adapter via `bootstrap.ts`
- [x] Wire `@unisane/email-ses` adapter via `bootstrap.ts`
- [x] Wire `@unisane/identity-mongodb` adapter via `bootstrap.ts`
- [x] Wire `@unisane/tenants-mongodb` adapter via `bootstrap.ts`
- [x] Wire `@unisane/jobs-inngest` adapter via `bootstrap.ts`
- [x] Wire `@unisane/outbox-mongodb` adapter via `bootstrap.ts`
- [x] Remove local provider implementations from `platform/billing/providers/`
- [x] Remove local provider implementations from `platform/email/providers/`

### Completed Critical Tasks

- [x] Wire `setOutboxService()` in bootstrap.ts
- [x] Wire `setOutboxAccessor()` for `events.emitReliable()`
- [x] Move Inngest to `@unisane/jobs-inngest` adapter
- [x] Create `JobsPort` interface in kernel
- [x] Database port interface (`kernel/src/database/port/`)
- [x] Cache abstraction (`KVProvider` interface)
- [x] Create value objects (Email, Money, Phone, Slug, Username)
- [x] Type-safe event handlers (`onTyped()`, `emitTyped()`)
- [x] Delete `platform/telemetry/pino.ts`

### For New Code

- [x] Business logic → `packages/modules/`
- [x] Constants → `packages/foundation/kernel/src/constants/`
- [x] Adapters → `packages/adapters/`
- [x] App wiring → `starters/*/src/bootstrap.ts`
- [x] App-specific config → `starters/*/src/platform/`
- [x] Never duplicate kernel code

---

## Summary

| Development               | Distribution                 |
| ------------------------- | ---------------------------- |
| `@unisane/kernel`         | `@/modules/kernel`           |
| `@unisane/auth`           | `@/modules/auth`             |
| `@unisane/billing-stripe` | `@/adapters/billing-stripe`  |
| `@unisane/ui/...`         | `@/components/ui/...`        |
| `@unisane/data-table`     | `@unisane/data-table` (npm)  |
| `workspace:*`             | Removed                      |
| `shared/` duplicates      | Deleted (use modules/kernel) |

The key principle: **One source of truth, transformed for distribution.**

---

## Vision Achievement Status

| Goal                      | Status   | Details                                                    |
| ------------------------- | -------- | ---------------------------------------------------------- |
| Universal SaaS Foundation | ✅ 85%   | All modules import from kernel, DB port interface exists   |
| Shadcn Distribution       | ✅ Ready | All adapters pluggable via bootstrap                       |
| Zero Vendor Lock-in       | ✅ 85%   | Jobs, Email, Billing, DB all abstracted via kernel         |
| 90% Code Reuse            | ✅ 85%   | Event-driven done; modules use kernel abstractions         |
| Great DX                  | ✅ Done  | Value objects, typed events, COLLECTIONS constants         |

**Status**: Phase 1, 2, 3, and 4 complete. Architecture is ~85% hexagonal.

**Remaining for 100%**:
- PostgreSQL adapter (deferred - waiting for demand)
- Extract cache adapters to separate packages (deferred - current approach works)
- `createPlatform()` builder pattern (deferred - bootstrap.ts works well)
