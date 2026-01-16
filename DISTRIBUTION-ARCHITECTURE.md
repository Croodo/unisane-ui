# Unisane Distribution Architecture

> **"Shadcn/UI for Full-Stack"** — Own your entire SaaS backend as source code.

---

## Table of Contents

1. [Vision](#vision)
2. [Architecture Overview](#architecture-overview)
3. [Monorepo Structure](#monorepo-structure)
4. [Hexagonal Architecture](#hexagonal-architecture)
5. [Distribution Model](#distribution-model)
6. [Starters](#starters)
7. [Import Transformation](#import-transformation)
8. [Critical Rules](#critical-rules)

---

## Vision

Unisane is a **full-stack SaaS framework** distributed as source code — like Shadcn/UI but for your entire backend.

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Own Your Code** | Users get full source code, not a black-box dependency |
| **Zero Vendor Lock-in** | Swap any provider (database, billing, email) via configuration |
| **Hexagonal Architecture** | Clean separation between business logic and infrastructure |
| **Single Source of Truth** | Every piece of code exists in exactly one place |

### What We're Building

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNISANE MONOREPO (We Develop)                │
│  packages/foundation/  → Core framework (kernel, gateway)       │
│  packages/modules/     → Business logic (auth, billing, etc.)   │
│  packages/adapters/    → Provider implementations (Stripe, S3)  │
│  starters/saaskit/     → Application template                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ npx @unisane/create saaskit my-app
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER'S PROJECT (They Own)                    │
│  src/lib/kernel/       → Flattened foundation                   │
│  src/lib/modules/      → Flattened business logic               │
│  src/lib/adapters/     → Flattened providers                    │
│  src/app/              → Their application code                 │
│  src/config/           → Their customizations                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architecture Overview

### Layers

```
┌─────────────────────────────────────────────────────────────────┐
│  1. KERNEL (Ports & Core Utilities)                             │
│     └── packages/foundation/kernel/                             │
│         ├── ports/        → Abstract interfaces                 │
│         ├── constants/    → Shared constants (SSOT)             │
│         ├── database/     → DB abstraction layer                │
│         ├── cache/        → Cache abstraction layer             │
│         ├── events/       → Event system                        │
│         └── utils/        → Shared utilities                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ implements
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. ADAPTERS (Provider Implementations)                         │
│     └── packages/adapters/                                      │
│         ├── billing-stripe/     → Stripe billing                │
│         ├── billing-razorpay/   → Razorpay billing              │
│         ├── email-resend/       → Resend emails                 │
│         ├── storage-s3/         → AWS S3 storage                │
│         ├── db-mongo/           → MongoDB adapter               │
│         └── ...                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ uses
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. MODULES (Business Logic)                                    │
│     └── packages/modules/                                       │
│         ├── auth/         → Authentication                      │
│         ├── tenants/      → Multi-tenancy                       │
│         ├── billing/      → Subscriptions & payments            │
│         ├── storage/      → File management                     │
│         ├── audit/        → Audit logging                       │
│         └── ...                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ wired in
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. STARTERS (Application Templates)                            │
│     └── starters/saaskit/                                       │
│         ├── src/app/           → Next.js routes                 │
│         ├── src/config/        → Plan maps, feature flags       │
│         ├── src/bootstrap.ts   → Adapter wiring                 │
│         └── src/components/    → UI components                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

```
unisane-monorepo/
├── packages/
│   ├── foundation/                 # Core framework
│   │   ├── kernel/                 # Ports, utilities, constants
│   │   ├── gateway/                # HTTP layer, middleware, errors
│   │   └── contracts/              # API contract utilities
│   │
│   ├── modules/                    # Business logic
│   │   ├── auth/                   # Authentication & authorization
│   │   ├── identity/               # User management
│   │   ├── tenants/                # Multi-tenancy
│   │   ├── billing/                # Subscriptions & payments
│   │   ├── storage/                # File storage
│   │   ├── audit/                  # Audit logging
│   │   ├── notify/                 # Notifications
│   │   ├── credits/                # Credit system
│   │   ├── usage/                  # Usage tracking
│   │   ├── flags/                  # Feature flags
│   │   ├── settings/               # Settings management
│   │   └── webhooks/               # Webhook handling
│   │
│   ├── adapters/                   # Provider implementations
│   │   ├── billing-stripe/         # Stripe adapter
│   │   ├── billing-razorpay/       # Razorpay adapter
│   │   ├── email-resend/           # Resend adapter
│   │   ├── email-ses/              # AWS SES adapter
│   │   ├── storage-s3/             # S3 adapter
│   │   ├── storage-gcs/            # Google Cloud Storage adapter
│   │   ├── storage-local/          # Local filesystem adapter
│   │   ├── db-mongo/               # MongoDB adapter
│   │   ├── jobs-inngest/           # Inngest jobs adapter
│   │   └── outbox-mongodb/         # Outbox adapter
│   │
│   └── ui/                         # UI packages
│       ├── core/                   # Base components (flattened)
│       └── data-table/             # Complex table (stays as npm)
│
├── starters/
│   └── saaskit/                    # SaaS starter template
│
└── devtools/
    └── codegen/                    # CLI & code generation
```

### Package Categories

| Category | Location | Distribution |
|----------|----------|--------------|
| Foundation | `packages/foundation/` | Flattened to `src/lib/` |
| Modules | `packages/modules/` | Flattened to `src/lib/modules/` |
| Adapters | `packages/adapters/` | Flattened to `src/lib/adapters/` |
| UI Core | `packages/ui/core/` | Flattened to `src/components/ui/` |
| Data Table | `packages/ui/data-table/` | Stays as `@unisane/data-table` npm package |

---

## Hexagonal Architecture

### Ports & Adapters Pattern

The architecture cleanly separates **what** the system does from **how** it does it:

```
┌─────────────────────────────────────────────────────────────────┐
│  KERNEL (What - Abstract Interfaces)                            │
│                                                                 │
│  BillingProviderPort     → "I need to charge customers"         │
│  EmailProviderPort       → "I need to send emails"              │
│  StorageProviderPort     → "I need to store files"              │
│  DatabasePort            → "I need to persist data"             │
│  CachePort               → "I need to cache values"             │
│  JobsPort                → "I need to run background jobs"      │
│  OutboxPort              → "I need reliable event delivery"     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────────────────────────────────────────┐
│  ADAPTERS (How - Concrete Implementations)                      │
│                                                                 │
│  billing-stripe     → "Use Stripe to charge customers"          │
│  billing-razorpay   → "Use Razorpay to charge customers"        │
│  email-resend       → "Use Resend to send emails"               │
│  email-ses          → "Use AWS SES to send emails"              │
│  storage-s3         → "Use S3 to store files"                   │
│  db-mongo           → "Use MongoDB to persist data"             │
└─────────────────────────────────────────────────────────────────┘
```

### Swapping Providers

Users swap providers by changing bootstrap configuration:

```typescript
// bootstrap.ts

// Option A: Stripe billing
import { StripeBillingAdapter } from "@/lib/adapters/billing-stripe";
setBillingProvider(new StripeBillingAdapter({ secretKey: env.STRIPE_SECRET_KEY }));

// Option B: Razorpay billing
import { RazorpayBillingAdapter } from "@/lib/adapters/billing-razorpay";
setBillingProvider(new RazorpayBillingAdapter({ keyId: env.RAZORPAY_KEY_ID }));
```

---

## Distribution Model

### Transformation: Monorepo → User Project

When a user runs `npx @unisane/create saaskit my-app`:

#### Monorepo (Development)

```
unisane-monorepo/
├── packages/
│   ├── foundation/kernel/src/     # @unisane/kernel
│   ├── foundation/gateway/src/    # @unisane/gateway
│   ├── modules/auth/src/          # @unisane/auth
│   ├── modules/billing/src/       # @unisane/billing
│   └── adapters/billing-stripe/   # @unisane/billing-stripe
│
└── starters/saaskit/
    ├── src/app/                   # Next.js routes
    ├── src/config/                # Plan maps, configs
    └── package.json               # workspace:* dependencies
```

#### User Project (Distributed)

```
my-app/
├── src/
│   ├── lib/                       # Flattened foundation
│   │   ├── kernel/                # From packages/foundation/kernel
│   │   ├── gateway/               # From packages/foundation/gateway
│   │   ├── modules/
│   │   │   ├── auth/              # From packages/modules/auth
│   │   │   └── billing/           # From packages/modules/billing
│   │   └── adapters/
│   │       └── billing-stripe/    # From packages/adapters/billing-stripe
│   │
│   ├── app/                       # From starters/saaskit/src/app
│   ├── config/                    # From starters/saaskit/src/config
│   ├── components/                # From starters + packages/ui/core
│   └── bootstrap.ts               # Adapter wiring
│
└── package.json                   # No workspace:* dependencies
```

### What Gets Flattened vs What Stays npm

| Package | Flattened? | Reason |
|---------|------------|--------|
| `@unisane/kernel` | Yes | Users may customize utilities |
| `@unisane/gateway` | Yes | Users may add middleware |
| `@unisane/auth` | Yes | Users may extend auth logic |
| `@unisane/billing-stripe` | Yes | Users may customize billing |
| `@unisane/ui/core` | Yes | Users customize components |
| `@unisane/data-table` | **No** | Complex component, versioned updates |

---

## Starters

### Purpose

Starters are **application templates** that:

1. Import business logic from flattened packages
2. Define app-specific configuration (plans, features)
3. Wire adapters to ports via `bootstrap.ts`
4. Provide the Next.js application structure

### Starter Structure

```
starters/saaskit/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # Auth pages
│   │   ├── (dashboard)/            # Dashboard pages
│   │   ├── api/                    # API routes
│   │   └── layout.tsx
│   │
│   ├── config/                     # ✏️ CUSTOMIZE
│   │   ├── planMap.ts              # Plan ID → Provider ID mapping
│   │   ├── metering.config.ts      # Usage limits & quotas
│   │   └── features.ts             # Feature flags
│   │
│   ├── emails/                     # ✏️ CUSTOMIZE
│   │   ├── welcome.tsx             # Welcome email template
│   │   └── invoice.tsx             # Invoice email template
│   │
│   ├── components/                 # ✏️ CUSTOMIZE
│   │   ├── ui/                     # Base UI components
│   │   └── features/               # Feature-specific components
│   │
│   └── bootstrap.ts                # ✏️ CUSTOMIZE (adapter wiring)
│
├── package.json
└── unisane.config.ts               # Codegen configuration
```

### What Belongs in Starters

| ✅ Belongs | ❌ Does NOT Belong |
|------------|-------------------|
| Next.js routes (`app/`) | Business logic (use modules) |
| Configuration (`config/`) | Constants (use kernel) |
| Email templates (`emails/`) | Utilities (use kernel) |
| Adapter wiring (`bootstrap.ts`) | Error handling (use gateway) |
| App-specific components | Generic middleware (use gateway) |

---

## Import Transformation

### Before (Monorepo)

```typescript
// Uses workspace:* dependencies
import { connectDb, getScopeId, PLAN_DEFS } from "@unisane/kernel";
import { signUp } from "@unisane/auth";
import { StripeBillingAdapter } from "@unisane/billing-stripe";
import { ERR } from "@unisane/gateway";
import { DataTable } from "@unisane/data-table";
```

### After (Distributed)

```typescript
// Uses flattened local paths
import { connectDb, getScopeId, PLAN_DEFS } from "@/lib/kernel";
import { signUp } from "@/lib/modules/auth";
import { StripeBillingAdapter } from "@/lib/adapters/billing-stripe";
import { ERR } from "@/lib/gateway";
import { DataTable } from "@unisane/data-table";  // ← Stays as npm!
```

### Transformation Rules

| Monorepo Import | Distributed Import |
|-----------------|-------------------|
| `@unisane/kernel` | `@/lib/kernel` |
| `@unisane/gateway` | `@/lib/gateway` |
| `@unisane/auth` | `@/lib/modules/auth` |
| `@unisane/billing` | `@/lib/modules/billing` |
| `@unisane/billing-stripe` | `@/lib/adapters/billing-stripe` |
| `@unisane/ui/...` | `@/components/ui/...` |
| `@unisane/data-table` | `@unisane/data-table` (unchanged) |

---

## Critical Rules

### Rule 1: Single Source of Truth

Every piece of code exists in **exactly one place**:

| Code Type | Lives In | NOT In |
|-----------|----------|--------|
| Constants | `kernel/src/constants/` | ~~Duplicated in starters~~ |
| Utilities | `kernel/src/utils/` | ~~Duplicated in starters~~ |
| Error handling | `gateway/src/errors/` | ~~Duplicated in starters~~ |
| Business logic | `modules/*/` | ~~Duplicated in starters~~ |
| Middleware | `gateway/src/middleware/` | ~~Duplicated in starters~~ |

### Rule 2: No Duplicate Code in Starters

```typescript
// ❌ WRONG: Duplicating kernel code
// starters/saaskit/src/lib/utils.ts
export function clampInt(n, min, max) { ... }  // Duplicate!

// ✅ CORRECT: Import from kernel
import { clampInt } from "@unisane/kernel";
```

### Rule 3: Starters Only Contain App-Specific Code

**Valid in starters:**
- Plan configurations (`planMap.ts`)
- Email templates
- Feature flag configs
- Adapter wiring (`bootstrap.ts`)
- Next.js routes and layouts
- App-specific UI components

**Invalid in starters:**
- Generic utilities (use kernel)
- Generic middleware (use gateway)
- Business logic (use modules)
- Constants (use kernel)

### Rule 4: Adapters Implement Ports

```typescript
// Kernel defines the port (interface)
// packages/foundation/kernel/src/ports/billing.ts
export interface BillingProviderPort {
  createCustomer(args: CreateCustomerArgs): Promise<Customer>;
  createSubscription(args: CreateSubArgs): Promise<Subscription>;
  // ...
}

// Adapter implements the port
// packages/adapters/billing-stripe/src/index.ts
export class StripeBillingAdapter implements BillingProviderPort {
  async createCustomer(args) { /* Stripe-specific */ }
  async createSubscription(args) { /* Stripe-specific */ }
}
```

### Rule 5: data-table Stays as npm

`@unisane/data-table` is the **only** package that remains as an npm dependency in distributed projects. It's complex, well-tested, and benefits from centralized updates.

---

## Summary

| Aspect | Monorepo | Distributed |
|--------|----------|-------------|
| **Dependencies** | `workspace:*` | Flattened, no workspaces |
| **Foundation** | `packages/foundation/` | `src/lib/` |
| **Modules** | `packages/modules/` | `src/lib/modules/` |
| **Adapters** | `packages/adapters/` | `src/lib/adapters/` |
| **UI** | `packages/ui/core/` | `src/components/ui/` |
| **Data Table** | `packages/ui/data-table/` | `@unisane/data-table` (npm) |
| **Imports** | `@unisane/*` | `@/lib/*` |

**The key principle: One source of truth, transformed for distribution.**

---

## Cleanup Roadmap

This section tracks code that needs to be moved from starters to foundation layer to comply with architectural rules.

### Current Violations in `starters/saaskit/src/`

The following code violates the "Single Source of Truth" rule and needs to be extracted:

---

### Phase 1: Move to Gateway (HTTP/Client Layer)

These are HTTP-related utilities, client hooks, and middleware that belong in `@unisane/gateway`.

#### 1.1 Client Hooks

| File | Current Location | Target Location | Status | Decision |
|------|------------------|-----------------|--------|----------|
| `use-api-error.ts` | `starters/saaskit/src/hooks/` | Keep in starters | ✅ DONE | React hooks not in foundation layer |
| `use-form-card.ts` | `starters/saaskit/src/hooks/` | Keep in starters | ✅ DONE | React hooks not in foundation layer |
| `use-scroll-lock.ts` | `starters/saaskit/src/hooks/` | Keep in starters | ✅ DONE | React hooks not in foundation layer |
| `use-prefetch.ts` | `starters/saaskit/src/hooks/` | Keep in starters | ✅ DONE | React hooks not in foundation layer |

**Note**: Gateway is a server-side foundation layer and should NOT contain React dependencies. Client-side React hooks stay in starters.

#### 1.2 UI Hooks

| File | Current Location | Target Location | Status | Reason |
|------|------------------|-----------------|--------|--------|
| `use-mobile.ts` | `starters/saaskit/src/hooks/` | Keep in starters | ✅ DONE | Simple (5 lines), users customize breakpoints |
| `use-server-table.ts` | `starters/saaskit/src/hooks/` | Keep in starters | ✅ DONE | Depends on Next.js URL state (`useRouter`, `useSearchParams`) |

**Keep in Starters** (app-specific):
- `use-session.ts` - Uses app-specific session context
- `use-tenant-context.ts` - Uses app-specific tenant model
- `use-active-tenant.ts` - Uses app-specific tenant model
- `use-feature-flags.ts` - Uses app-specific feature definitions
- `use-navigation-*.ts` - App-specific navigation
- `use-mobile.ts` - Simple hook, users often customize breakpoints
- `use-server-table.ts` - Next.js URL state dependent (framework-specific)

#### 1.3 Webhook Utilities → `gateway/src/webhooks/`

| File | Current Location | Target Location | Status |
|------|------------------|-----------------|--------|
| `signing.ts` | `starters/saaskit/src/platform/webhooks/` | `gateway/src/webhooks/signing.ts` | ✅ DONE |
| `verify.ts` | `starters/saaskit/src/platform/webhooks/` | `gateway/src/webhooks/verify.ts` | ✅ DONE |
| `outbound.ts` | `starters/saaskit/src/platform/webhooks/` | Keep in starters | ✅ DONE | App-specific delivery logic |

**Note**: `outbound.ts` stays in starters as it contains app-specific webhook delivery orchestration. Starters re-export signing/verify from `@unisane/gateway`.

#### 1.4 OAuth Providers → `auth/src/oauth/`

| File | Current Location | Target Location | Status |
|------|------------------|-----------------|--------|
| `github.ts` | `starters/saaskit/src/platform/oauth/providers/` | `auth/src/oauth/providers/github.ts` | ✅ DONE |
| `google.ts` | `starters/saaskit/src/platform/oauth/providers/` | `auth/src/oauth/providers/google.ts` | ✅ DONE |
| `index.ts` | `starters/saaskit/src/platform/oauth/providers/` | `auth/src/oauth/providers/index.ts` | ✅ DONE |
| `types.ts` | N/A | `auth/src/oauth/providers/types.ts` | ✅ DONE |

**Note**: OAuth providers moved to `@unisane/auth` module (not gateway) since they are authentication-related. Exported via `@unisane/auth` as `export * from './oauth'`.

#### 1.5 UI Utilities

| File | Current Location | Target Location | Status | Decision |
|------|------------------|-----------------|--------|----------|
| `utils.ts` (cn function) | `starters/saaskit/src/lib/` | Keep in starters | ✅ DONE | UI utility, users customize |

#### 1.6 Error Normalization → `gateway/src/client/`

| File | Current Location | Target Location | Status |
|------|------------------|-----------------|--------|
| `errors.ts` | N/A | `gateway/src/client/errors.ts` | ✅ DONE |

**Note**: Pure TypeScript error normalization utilities (no React) added to gateway client. Exported via `@unisane/gateway` as `export * from './client'`.

---

### Phase 2: Analysis Complete - Keep in Starters ✅

After detailed analysis, these files are **orchestration code** that correctly belongs in starters. They wire multiple foundation modules together for the specific application.

#### 2.1 Metering Guard (Keep in Starters) ✅

| File | Current Location | Status | Reason |
|------|------------------|--------|--------|
| `guard.ts` | `starters/saaskit/src/platform/metering/` | ✅ Keep | Orchestrates billing + usage + credits modules |
| `index.ts` | `starters/saaskit/src/platform/metering/` | ✅ Keep | Re-exports from `@unisane/billing` + guard |

**Analysis**: The metering guard is **orchestration code** that:
- Imports from `@unisane/billing` (`resolveTokenPolicy`, `resolveEntitlements`)
- Imports from `@unisane/usage` (`getWindow`, `increment`)
- Imports from `@unisane/credits` (`consume`)
- Uses app-specific telemetry (`@/src/platform/telemetry`)

This is the exact purpose of starters - wiring modules together for the specific application.

#### 2.2 Cache Invalidation (Keep in Starters) ✅

| File | Current Location | Status | Reason |
|------|------------------|--------|--------|
| `cache-invalidation.ts` | `starters/saaskit/src/platform/` | ✅ Keep | App-specific event subscriptions |

**Analysis**: This file:
- Subscribes to app-specific events (`CREDITS_EVENTS`, `IDENTITY_EVENTS`)
- Uses app-specific cache keys (`identityKeys`)
- Defines which events invalidate which caches for this specific app

This is app-specific orchestration - a different app might have different event handlers.

#### 2.3 Cursor Validation (Already in Kernel) ✅

| Item | Status | Reason |
|------|--------|--------|
| `validateCursor()` | ✅ Already done | `kernel/src/pagination/cursors.ts` exists |

The cursor validation utilities are already in `@unisane/kernel`.

#### 2.4 Telemetry (Keep in Starters) ✅

| File | Current Location | Status | Reason |
|------|------------------|--------|--------|
| `index.ts` | `starters/saaskit/src/platform/telemetry/` | ✅ Keep | App-specific StatsD configuration |

**Analysis**: This file:
- Uses app-specific prefix (`saaskit`)
- Wraps `@unisane/kernel` metrics (which is already the generic infrastructure)
- Defines app-specific helper functions (`observeHttp`, `incRateLimited`)

The kernel already has generic metrics infrastructure (`metrics`, `onMetricsFlush`). This is the app-specific facade.

#### 2.5 Job Trigger Factory (Keep in Starters) ✅

| File | Current Location | Status | Reason |
|------|------------------|--------|--------|
| `triggerFactory.ts` | `starters/saaskit/src/platform/jobs/service/` | ✅ Keep | App-specific job triggering |

**Analysis**: This file:
- Uses app-specific telemetry
- Uses app-specific URL routing (`/api/_jobs/run`)
- Is part of the app-specific admin API

---

### Phase 3: Keep in Starters (App-Specific)

These files are correctly placed and should remain in starters:

#### Configuration Files ✅

| File | Location | Reason |
|------|----------|--------|
| `planMap.ts` | `platform/billing/` | App-specific plan → provider ID mapping |
| `topupMap.ts` | `platform/billing/` | App-specific topup → price ID mapping |
| `config.ts` | `platform/auth/` | App-specific OAuth provider enablement |
| `definitions.ts` | `shared/settings/` | App-specific admin settings SSOT |
| `kitVersion.ts` | `shared/` | App version constant |

#### Email Templates ✅

| File | Location | Reason |
|------|----------|--------|
| `welcome.ts` | `platform/email/templates/` | App-specific branding |
| `auth_verify_email.ts` | `platform/email/templates/` | App-specific branding |
| `auth_password_reset.ts` | `platform/email/templates/` | App-specific branding |

#### App-Specific Hooks ✅

| File | Location | Reason |
|------|----------|--------|
| `use-session.ts` | `hooks/` | Uses app-specific session context |
| `use-tenant-context.ts` | `hooks/` | Uses app-specific tenant model |
| `use-feature-flags.ts` | `hooks/` | Uses app-specific feature definitions |
| `use-navigation-*.ts` | `hooks/` | App-specific navigation |

#### Bootstrap & Init ✅

| File | Location | Reason |
|------|----------|--------|
| `bootstrap.ts` | `src/` | App-specific adapter wiring |
| `init.ts` | `platform/` | App-specific initialization |
| `events.ts` | `platform/` | App-specific event schema registration |
| `registry.ts` | `platform/jobs/` | App-specific job definitions |

---

### Migration Checklist

#### Phase 1: Gateway & UI Extraction ✅ COMPLETE

**Client Hooks (Decision: Keep in Starters):**
- [x] **1.1** React hooks stay in starters - gateway is server-side only
- [x] **1.2** `useApiError` - kept in starters (React dependency)
- [x] **1.3** `useFormCard` - kept in starters (React dependency)
- [x] **1.4** `useScrollLock` - kept in starters (React dependency)
- [x] **1.5** `usePrefetch` - kept in starters (React dependency)

**UI Hooks (Decision: Keep in Starters):**
- [x] **1.6** `useServerTable` - kept in starters (Next.js URL state dependent)
- [x] **1.7** `useMobile` - kept in starters (simple, users customize breakpoints)

**Gateway Webhooks:**
- [x] **1.8** Created `gateway/src/webhooks/` directory
- [x] **1.9** Moved webhook signing utilities (`signing.ts`)
- [x] **1.10** Moved webhook verification (`verify.ts` - Stripe, Razorpay, Resend, SNS)
- [x] **1.11** `outbound.ts` kept in starters (app-specific delivery)

**OAuth Providers (Moved to Auth Module):**
- [x] **1.12** Created `auth/src/oauth/providers/` directory
- [x] **1.13** Moved GitHub OAuth provider
- [x] **1.14** Moved Google OAuth provider
- [x] **1.15** Created OAuth provider registry with `getProviderAdapter()`
- [x] **1.16** Added `types.ts` with `OAuthProviderName`, `ProviderProfile`, `ProviderAdapter`

**UI Utils (Decision: Keep in Starters):**
- [x] **1.17** `cn()` utility kept in starters (UI utility, users customize)

**Error Normalization (Added to Gateway):**
- [x] **1.18** Created `gateway/src/client/errors.ts` (pure TypeScript, no React)

**Finalize:**
- [x] **1.19** Exported webhooks from gateway index (`export * from './webhooks'`)
- [x] **1.20** Exported client from gateway index (`export * from './client'`)
- [x] **1.21** Exported OAuth from auth index (`export * from './oauth'`)
- [x] **1.22** Updated starters webhooks to re-export from `@unisane/gateway`
- [x] **1.23** Deleted OAuth providers directory from starters

#### Phase 2: Kernel Extraction ✅ COMPLETE (No Action Needed)

After analysis, all Phase 2 items are **orchestration code** that correctly belongs in starters:

- [x] **2.1** Metering guard - ✅ Keep in starters (orchestrates billing + usage + credits)
- [x] **2.2** Cache invalidation - ✅ Keep in starters (app-specific event subscriptions)
- [x] **2.3** Cursor validation - ✅ Already in kernel (`pagination/cursors.ts`)
- [x] **2.4** Telemetry - ✅ Keep in starters (app-specific facade over kernel metrics)
- [x] **2.5** Job trigger factory - ✅ Keep in starters (app-specific admin API)

**Conclusion**: Kernel already has the generic infrastructure. Starters correctly contain the orchestration.

#### Phase 3: Final Verification ✅ COMPLETE

- [x] **3.1** TypeScript check passes (pre-existing devtools errors only)
- [x] **3.2** All imports updated in starters
- [x] **3.3** Documentation updated

---

### File Movement Summary

```
PHASE 1 COMPLETED ✅
==================

MOVED TO GATEWAY:
starters/saaskit/src/platform/webhooks/signing.ts → gateway/src/webhooks/signing.ts ✅
starters/saaskit/src/platform/webhooks/verify.ts  → gateway/src/webhooks/verify.ts ✅
(new file)                                        → gateway/src/client/errors.ts ✅

MOVED TO AUTH MODULE:
starters/saaskit/src/platform/oauth/providers/github.ts → auth/src/oauth/providers/github.ts ✅
starters/saaskit/src/platform/oauth/providers/google.ts → auth/src/oauth/providers/google.ts ✅
starters/saaskit/src/platform/oauth/providers/index.ts  → auth/src/oauth/providers/index.ts ✅
(new file)                                              → auth/src/oauth/providers/types.ts ✅

KEPT IN STARTERS (Architecture Decisions):
starters/saaskit/src/hooks/use-api-error.ts       ✅ React hook (no React in gateway)
starters/saaskit/src/hooks/use-form-card.ts       ✅ React hook (no React in gateway)
starters/saaskit/src/hooks/use-scroll-lock.ts     ✅ React hook (no React in gateway)
starters/saaskit/src/hooks/use-prefetch.ts        ✅ React hook (no React in gateway)
starters/saaskit/src/hooks/use-server-table.ts    ✅ Next.js dependent (framework-specific)
starters/saaskit/src/hooks/use-mobile.ts          ✅ Simple UI hook, users customize
starters/saaskit/src/lib/utils.ts                 ✅ UI utility, users customize
starters/saaskit/src/platform/webhooks/outbound.ts ✅ App-specific delivery logic

PHASE 2 COMPLETE ✅ (No Movement Needed)
========================================

After analysis, these are ORCHESTRATION CODE that correctly stays in starters:
starters/saaskit/src/platform/metering/guard.ts       ✅ Orchestrates billing + usage + credits
starters/saaskit/src/platform/cache-invalidation.ts   ✅ App-specific event subscriptions
starters/saaskit/src/platform/telemetry/index.ts      ✅ App-specific metrics facade
starters/saaskit/src/platform/jobs/service/triggerFactory.ts ✅ App-specific admin API

KEEP IN STARTERS (App-Specific):
starters/saaskit/src/platform/billing/planMap.ts      ✅ App-specific
starters/saaskit/src/platform/billing/topupMap.ts     ✅ App-specific
starters/saaskit/src/platform/auth/config.ts          ✅ App-specific
starters/saaskit/src/platform/email/templates/*       ✅ App-specific
starters/saaskit/src/shared/settings/definitions.ts   ✅ App-specific SSOT
starters/saaskit/src/shared/kitVersion.ts             ✅ App-specific
starters/saaskit/src/hooks/use-session.ts             ✅ App-specific
starters/saaskit/src/hooks/use-tenant-context.ts      ✅ App-specific
starters/saaskit/src/hooks/use-feature-flags.ts       ✅ App-specific
starters/saaskit/src/platform/init.ts                 ✅ App-specific
starters/saaskit/src/platform/events.ts               ✅ App-specific
starters/saaskit/src/platform/jobs/registry.ts        ✅ App-specific
```

---

### Expected Outcome

#### Phase 1 Complete ✅

1. **Gateway now contains**:
   - Webhook signing utilities (`hmacSHA256Hex`, `timingSafeEqual`)
   - Webhook verification (`verifyInbound` for Stripe, Razorpay, Resend, SNS)
   - Error normalization utilities (pure TypeScript)

2. **Auth module now contains**:
   - OAuth provider adapters (Google, GitHub)
   - Provider types (`OAuthProviderName`, `ProviderProfile`, `ProviderAdapter`)
   - Provider registry (`getProviderAdapter()`)

3. **Starters correctly contain**:
   - React hooks (no React in foundation layer)
   - Next.js-dependent hooks (`useServerTable`)
   - App-specific webhook delivery (`outbound.ts`)
   - UI utilities (`cn()`)

#### Phase 2 Complete ✅

After analysis, Phase 2 items were found to be **orchestration code** that correctly belongs in starters:

1. **Kernel already contains** (no changes needed):
   - Metrics infrastructure (`metrics`, `onMetricsFlush`)
   - Cursor validation (`pagination/cursors.ts`)
   - Event system (`events`)
   - Cache utilities (`cacheDelete`)

2. **Starters correctly contain orchestration code**:
   - Metering guard (wires billing + usage + credits)
   - Cache invalidation handlers (app-specific event subscriptions)
   - Telemetry facade (app-specific metrics prefix)
   - Job trigger factory (app-specific admin API)

---

### Final Architecture State ✅

1. **Foundation Layer** (`@unisane/gateway`, `@unisane/kernel`):
   - Server-side only (no React)
   - Generic infrastructure utilities
   - Webhook signing/verification
   - Error normalization

2. **Modules Layer** (`@unisane/auth`, `@unisane/billing`, etc.):
   - Business logic
   - OAuth provider adapters (in auth module)
   - Domain-specific functionality

3. **Starters** (app-specific):
   - React hooks
   - Next.js-dependent code
   - Orchestration code (wiring modules together)
   - App-specific configuration
   - UI utilities

4. **Distribution works correctly**:
   - Codegen transforms `@unisane/gateway` → `@/lib/gateway`
   - Codegen transforms `@unisane/kernel` → `@/lib/kernel`
   - Codegen transforms `@unisane/auth` → `@/lib/modules/auth`
   - No duplicate code in distributed projects
   - Users can customize app-specific code without touching framework code
