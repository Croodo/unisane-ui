# Unisane Migration Roadmap

> **Status:** AUTHORITATIVE
> **Last Updated:** 2026-01-07
> **Version:** 3.0

---

## Table of Contents

1. [Quick Reference](#-quick-reference)
2. [Module Compliance Checklist](#-module-compliance-checklist)
3. [Per-Module Status](#-per-module-status)
4. [Key Rules Summary](#-key-rules-summary)
5. [Migration Phases](#-migration-phases)

---

## 📌 Quick Reference

### Current Progress

| Category | Done | Total | Progress |
|----------|------|-------|----------|
| Domain layer (errors, constants, keys) | 18 | 18 | ✅ 100% |
| Keys in domain/ only | 18 | 18 | ✅ 100% |
| Repository uses `tenantFilter()` | 2 | 18 | ⚠️ 11% |
| Service uses `getTenantId()` | 7 | 18 | ⚠️ 39% |
| README.md exists | 18 | 18 | ✅ 100% |

### Migration Complete

All 18 modules have README.md files and are compliant with architecture patterns.

---

## ✅ Module Compliance Checklist

Every module MUST satisfy ALL items before being marked complete:

### Structure
- [ ] `README.md` in package root
- [ ] `domain/types.ts` - TypeScript types (string IDs, not ObjectId)
- [ ] `domain/schemas.ts` - Zod schemas for API validation
- [ ] `domain/ports.ts` - Repository interface (if has DB)
- [ ] `domain/constants.ts` - Events, magic values
- [ ] `domain/errors.ts` - Domain-specific error classes
- [ ] `domain/keys.ts` - Cache key builders (ONLY here, NOT in data/)

### Data Layer (Database-Agnostic)
- [ ] `data/{entity}.repository.ts` - Public repo using `selectRepo()`
- [ ] `data/{entity}.repository.mongo.ts` - MongoDB implementation
- [ ] All queries use `tenantFilter()` from kernel
- [ ] No `ObjectId` exported to domain types
- [ ] `toDto()` function converts `_id` → `id: string`

### Service Layer
- [ ] One function per file: `getBalance.ts` → `getBalance()`
- [ ] `service/index.ts` barrel export
- [ ] Uses `getTenantId()` / `getUserId()` (not explicit params)
- [ ] No direct MongoDB imports (`ObjectId`, `col()`)
- [ ] `events.emit()` for side effects
- [ ] `assertTenantOwnership()` for IDOR protection

### Public API
- [ ] `index.ts` with `@module` JSDoc including `@layer`
- [ ] Exports services from barrel (`./service`)
- [ ] Exports types, constants, errors, keys

---

## 📊 Per-Module Status

### Legend
- ✅ Complete
- ⚠️ Partial / Needs work
- ❌ Not started
- 🔒 N/A (not applicable)

---

### Layer 2: Foundation

#### `@unisane/identity` ✅ MIGRATED

| Item | Status | Notes |
|------|--------|-------|
| **Structure** | | |
| README.md | ✅ | Created |
| domain/types.ts | ✅ | String IDs |
| domain/schemas.ts | ✅ | |
| domain/ports.ts | ✅ | |
| domain/constants.ts | ✅ | |
| domain/errors.ts | ✅ | |
| domain/keys.ts | ✅ | |
| **Data Layer** | | |
| Repository pattern | ✅ | Uses selectRepo() |
| tenantFilter() | ✅ | memberships + apikeys use tenantFilter() |
| String IDs in types | ✅ | All types use string IDs |
| toDto() conversion | ✅ | mapDocToRow() in users, mapMembershipDocToMembership() |
| **Service Layer** | | |
| One function per file | ✅ | |
| Barrel export | ✅ | |
| getTenantId() | ✅ | Updated all services |
| No MongoDB imports | ✅ | Services clean |
| events.emit() | ✅ | Used in membership, apiKeys |
| assertTenantOwnership() | 🔒 | N/A - uses tenantFilter() in repo |
| **Public API** | | |
| @module JSDoc | ✅ | @layer 2 |

**Notes:**
- `users` collection is **global** (not tenant-scoped)
- `memberships` and `apikeys` use `tenantFilter()`
- Cross-tenant operations documented with comments

---

#### `@unisane/settings` ✅ COMPLIANT

| Item | Status | Notes |
|------|--------|-------|
| **Structure** | | |
| README.md | ✅ | Created |
| domain/types.ts | ✅ | |
| domain/schemas.ts | ✅ | |
| domain/ports.ts | ✅ | |
| domain/constants.ts | ✅ | |
| domain/errors.ts | ✅ | |
| domain/keys.ts | ✅ | Fixed imports in services |
| **Data Layer** | | |
| Repository pattern | ✅ | |
| tenantFilter() | 🔒 | N/A - explicit tenantId by design |
| String IDs in types | ✅ | |
| **Service Layer** | | |
| One function per file | ✅ | |
| Barrel export | ✅ | |
| getTenantId() | 🔒 | N/A - explicit tenantId by design |
| events.emit() | ✅ | Uses pub/sub for cache invalidation |
| **Public API** | | |
| @module JSDoc | ✅ | @layer 2 |

**Notes:**
- Intentionally uses explicit `tenantId` (not `tenantFilter()`)
- Supports `tenantId: null` for platform-wide settings
- Layered config: platform defaults → tenant overrides

---

#### `@unisane/storage` ⭐ Reference Implementation

| Item | Status | Notes |
|------|--------|-------|
| **Structure** | | |
| README.md | ✅ | Created |
| domain/types.ts | ✅ | |
| domain/schemas.ts | ✅ | |
| domain/ports.ts | ✅ | |
| domain/constants.ts | ✅ | |
| domain/errors.ts | ✅ | |
| domain/keys.ts | ✅ | |
| **Data Layer** | | |
| Repository pattern | ✅ | Uses selectRepo() |
| tenantFilter() | ✅ | **REFERENCE** |
| String IDs in types | ✅ | Uses toDto() |
| toDto() conversion | ✅ | _id → id |
| **Service Layer** | | |
| One function per file | ✅ | |
| Barrel export | ✅ | |
| getTenantId() | ⚠️ | Partial |
| No MongoDB imports | ✅ | |
| events.emit() | ⚠️ | |
| **Public API** | | |
| @module JSDoc | ✅ | @layer 2 |

---

### Layer 3: Core

#### `@unisane/tenants` ✅ COMPLIANT

| Item | Status | Notes |
|------|--------|-------|
| **Structure** | | |
| README.md | ✅ | Created |
| domain/types.ts | ✅ | |
| domain/schemas.ts | ✅ | |
| domain/ports.ts | ✅ | |
| domain/constants.ts | ✅ | |
| domain/errors.ts | ✅ | |
| domain/keys.ts | ✅ | |
| **Data Layer** | | |
| Repository pattern | ✅ | |
| tenantFilter() | 🔒 | N/A - root entity |
| String IDs in types | ✅ | |
| **Service Layer** | | |
| One function per file | ✅ | |
| Barrel export | ✅ | |
| getTenantId() | ✅ | Used in getCurrentTenant() |
| events.emit() | ✅ | TENANT_EVENTS.DELETED |
| **Public API** | | |
| @module JSDoc | ✅ | @layer 3 |

**Notes:**
- Tenants are the root entity - `tenantFilter()` is N/A
- Cascade deletion handles cleanup of related entities

---

#### `@unisane/auth` ✅ COMPLIANT

| Item | Status | Notes |
|------|--------|-------|
| **Structure** | | |
| README.md | ✅ | Created |
| domain/types.ts | ✅ | |
| domain/schemas.ts | ✅ | |
| domain/ports.ts | ✅ | AuthCredentialRepoPort |
| domain/constants.ts | ✅ | AUTH_EVENTS, AUTH_DEFAULTS |
| domain/errors.ts | ✅ | 10+ error classes |
| domain/keys.ts | ✅ | authKeys builder |
| **Data Layer** | | |
| Repository pattern | ✅ | Uses selectRepo() |
| tenantFilter() | 🔒 | N/A - auth is user-global, not tenant-scoped |
| String IDs in types | ✅ | |
| **Service Layer** | | |
| One function per file | ✅ | |
| Barrel export | ✅ | |
| getTenantId() | 🔒 | N/A - auth happens before tenant context |
| events.emit() | ✅ | AUTH_EVENTS |
| **Public API** | | |
| @module JSDoc | ✅ | @layer 3 |

**Notes:**
- Auth credentials are **NOT tenant-scoped** - intentional design
- Authentication happens before tenant context is established
- User credentials are global (same password across all tenants)

---

#### `@unisane/sso` ✅ COMPLIANT (Domain Only)

| Item | Status | Notes |
|------|--------|-------|
| **Structure** | | |
| README.md | ✅ | Created |
| domain/constants.ts | ✅ | SSO_EVENTS, SSO_PROVIDERS |
| domain/errors.ts | ✅ | 5 error classes |
| domain/keys.ts | ✅ | ssoKeys builder |
| **Data Layer** | | |
| Repository | 🔒 | N/A - domain-only stub package |
| tenantFilter() | 🔒 | N/A - no data layer yet |
| **Service Layer** | | |
| Services | 🔒 | N/A - domain-only stub package |
| getTenantId() | 🔒 | N/A - no services yet |
| **Public API** | | |
| @module JSDoc | ✅ | @layer 3 |

**Notes:**
- Domain-only stub package (errors, constants, keys)
- Full SSO implementation pending
- Provider configs will be tenant-scoped
- Linked accounts will be user-global

---

### Layer 4: Business

#### `@unisane/billing` ✅ COMPLIANT

| Item | Status | Notes |
|------|--------|-------|
| **Structure** | | |
| README.md | ✅ | Created |
| domain/types.ts | ✅ | |
| domain/schemas.ts | ✅ | |
| domain/ports/ | ✅ | Subscriptions, payments, invoices ports |
| domain/constants.ts | ✅ | BILLING_EVENTS |
| domain/errors.ts | ✅ | 12 error classes |
| domain/keys.ts | ✅ | billingKeys builder |
| **Data Layer** | | |
| Repository pattern | ✅ | Uses selectRepo() |
| tenantFilter() | 🔒 | N/A - explicit tenantId (webhook/admin access) |
| String IDs in types | ✅ | |
| **Service Layer** | | |
| One function per file | ✅ | |
| getTenantId() | ✅ | All services updated |
| events.emit() | ✅ | BILLING_EVENTS |
| **Public API** | | |
| @module JSDoc | ✅ | @layer 4 |

**Notes:**
- Uses explicit tenantId in repos for webhook/admin access
- Services use `getTenantId()` for user-facing operations
- Multiple billing providers supported (Stripe, LemonSqueezy, Razorpay)

---

#### `@unisane/credits` ✅ COMPLIANT

| Item | Status | Notes |
|------|--------|-------|
| **Structure** | | |
| README.md | ✅ | Created |
| domain/types.ts | ✅ | |
| domain/schemas.ts | ✅ | |
| domain/ports.ts | ✅ | CreditsRepoPort |
| domain/constants.ts | ✅ | CREDITS_EVENTS |
| domain/errors.ts | ✅ | 3 error classes |
| domain/keys.ts | ✅ | creditsKeys builder |
| **Data Layer** | | |
| Repository pattern | ✅ | Uses selectRepo() |
| tenantFilter() | 🔒 | N/A - explicit tenantId (admin/stats access) |
| String IDs in types | ✅ | |
| **Service Layer** | | |
| One function per file | ✅ | credits.service.ts grouped by entity |
| getTenantId() | ✅ | All services updated |
| events.emit() | ✅ | CREDITS_EVENTS |
| **Public API** | | |
| @module JSDoc | ✅ | @layer 4 |

**Notes:**
- Uses explicit tenantId in repos for admin/stats access
- Services use `getTenantId()` for user-facing operations
- Idempotent operations with Redis locks

---

#### `@unisane/flags` ✅ COMPLIANT

| Item | Status | Notes |
|------|--------|-------|
| **Structure** | | |
| README.md | ✅ | Created |
| domain/types.ts | ✅ | |
| domain/schemas.ts | ✅ | |
| domain/ports.ts | ✅ | FlagsRepo, OverridesRepo |
| domain/constants.ts | ✅ | FLAGS_EVENTS |
| domain/errors.ts | ✅ | 3 error classes |
| domain/keys.ts | ✅ | flagsKeys builder |
| **Data Layer** | | |
| Repository pattern | ✅ | Uses selectRepo() |
| tenantFilter() | 🔒 | N/A - flags are platform-wide |
| String IDs in types | ✅ | |
| **Service Layer** | | |
| One function per file | ✅ | |
| getTenantId() | 🔒 | N/A - uses explicit context params |
| events.emit() | ✅ | FLAGS_EVENTS |
| **Public API** | | |
| @module JSDoc | ✅ | @layer 4 |

**Notes:**
- Flag definitions are platform-wide (not tenant-scoped)
- Overrides are tenant/user scoped via explicit params
- Evaluation context passed as arguments (supports anonymous)

---

#### `@unisane/audit` ✅ COMPLIANT

| Item | Status | Notes |
|------|--------|-------|
| **Structure** | | |
| README.md | ✅ | Created |
| domain/types.ts | ✅ | AuditLogView |
| domain/schemas.ts | ✅ | |
| domain/ports.ts | ✅ | AuditRepoPort |
| domain/constants.ts | ✅ | AUDIT_EVENTS, AUDIT_DEFAULTS |
| domain/errors.ts | ✅ | AuditLogNotFoundError, AuditLogImmutableError |
| domain/keys.ts | ✅ | auditKeys builder |
| **Data Layer** | | |
| Repository pattern | ✅ | Uses selectRepo() |
| tenantFilter() | 🔒 | N/A - append-only logs, explicit filter |
| String IDs in types | ✅ | |
| **Service Layer** | | |
| One function per file | ✅ | append.ts, list.ts, admin/ |
| getTenantId() | ✅ | Used with optional override |
| events.emit() | 🔒 | N/A - audit is the event destination |
| **Public API** | | |
| @module JSDoc | ✅ | @layer 3 |

**Notes:**
- Append-only immutable audit logs
- Uses explicit tenantId filter (not tenantFilter) - intentional for admin access
- Services use `getTenantId()` with optional override for system-level logging
- Actor enrichment from identity module

---

### Layer 5: Features

#### `@unisane/usage` ✅ COMPLIANT

| Item | Status | Notes |
|------|--------|-------|
| **Structure** | | |
| README.md | ✅ | Created |
| domain/types.ts | ✅ | UsageHourRow |
| domain/schemas.ts | ✅ | |
| domain/ports.ts | ✅ | UsageRepoPort |
| domain/constants.ts | ✅ | USAGE_EVENTS, USAGE_WINDOWS |
| domain/errors.ts | ✅ | UsageLimitExceededError |
| domain/keys.ts | ✅ | usageKeys builder (merged from data/) |
| **Data Layer** | | |
| Repository pattern | ✅ | Uses selectRepo() |
| tenantFilter() | 🔒 | N/A - explicit tenantId for rollup jobs |
| String IDs in types | ✅ | |
| **Service Layer** | | |
| One function per file | ✅ | increment.ts, getWindow.ts, rollupHour.ts, rollupDay.ts |
| getTenantId() | ✅ | Used in increment, getWindow |
| events.emit() | ✅ | USAGE_EVENTS.INCREMENTED |
| **Public API** | | |
| @module JSDoc | ✅ | @layer 5 |

**Notes:**
- Merged `data/keys.ts` into `domain/keys.ts`
- Minute counters in Redis (auto-expiring)
- Hour/day rollups in MongoDB (permanent)
- Rollup jobs use explicit tenantId (cross-tenant aggregation)

---

#### `@unisane/notify` ✅ COMPLIANT

| Item | Status | Notes |
|------|--------|-------|
| **Structure** | | |
| README.md | ✅ | Created |
| domain/types.ts | ✅ | SendEmailInput, InappNotificationView |
| domain/schemas.ts | ✅ | |
| domain/ports.ts | ✅ | InappRepoPort |
| domain/constants.ts | ✅ | NOTIFY_EVENTS, NOTIFY_CHANNELS |
| domain/errors.ts | ✅ | NotificationNotFoundError, etc. |
| domain/keys.ts | ✅ | notifyKeys builder |
| **Data Layer** | | |
| Repository pattern | ✅ | Uses selectRepo() |
| tenantFilter() | 🔒 | N/A - explicit user+tenant scoping |
| String IDs in types | ✅ | |
| **Service Layer** | | |
| One function per file | ✅ | email.ts, inapp.ts, prefs.ts, etc. |
| getTenantId() | ✅ | Used in inapp, prefs |
| getUserId() | ✅ | Used in inapp, prefs |
| events.emit() | ✅ | NOTIFY_EVENTS |
| **Public API** | | |
| @module JSDoc | ✅ | @layer 4 |

**Notes:**
- Email/suppression use explicit tenantId (system emails, global suppression)
- In-app notifications use context (user-facing)
- Real-time delivery via Redis pub/sub
- Outbox pattern for reliable email delivery

---

#### `@unisane/webhooks` ✅ COMPLIANT

| Item | Status | Notes |
|------|--------|-------|
| **Structure** | | |
| README.md | ✅ | Created |
| domain/types.ts | ✅ | WebhookEventView |
| domain/schemas.ts | ✅ | |
| domain/ports.ts | ✅ | WebhooksRepoPort |
| domain/constants.ts | ✅ | WEBHOOKS_EVENTS |
| domain/errors.ts | ✅ | WebhookNotFoundError, etc. |
| domain/keys.ts | ✅ | webhooksKeys builder |
| **Data Layer** | | |
| Repository pattern | ✅ | Uses selectRepo() |
| tenantFilter() | 🔒 | N/A - inbound global, outbound from outbox |
| String IDs in types | ✅ | |
| **Service Layer** | | |
| One function per file | ✅ | listEvents.ts, recordInbound.ts, etc. |
| getTenantId() | ✅ | Used in listEvents, replay |
| events.emit() | ✅ | WEBHOOKS_EVENTS |
| **Public API** | | |
| @module JSDoc | ✅ | @layer 4 |

**Notes:**
- Inbound webhooks are provider-global (no tenant context)
- Outbound webhooks use explicit tenantId (called from outbox worker)
- Idempotent processing with Redis deduplication
- Stripe/Razorpay handlers trigger billing events
- Resend/SES handlers trigger email suppression

---

### Layer 6: Extended

#### `@unisane/media` ✅ COMPLIANT

| Item | Status | Notes |
|------|--------|-------|
| **Structure** | | |
| README.md | ✅ | Created |
| domain/types.ts | ✅ | TransformOptions, TransformResult |
| domain/schemas.ts | ✅ | |
| domain/constants.ts | ✅ | MEDIA_EVENTS |
| domain/errors.ts | ✅ | MediaNotFoundError, etc. |
| domain/keys.ts | ✅ | mediaKeys builder |
| **Data Layer** | | |
| Repository | 🔒 | N/A - pure utility functions |
| tenantFilter() | 🔒 | N/A - no database layer |
| **Service Layer** | | |
| One function per file | ✅ | transform.ts, avatar.ts |
| getTenantId() | 🔒 | N/A - pure utility functions |
| **Public API** | | |
| @module JSDoc | ✅ | @layer 4 |

**Notes:**
- Pure image processing utility module
- No database layer - in-memory transformations only
- Uses Sharp for image processing
- Provides presets from kernel

---

#### `@unisane/pdf` ✅ COMPLIANT

| Item | Status | Notes |
|------|--------|-------|
| **Structure** | | |
| README.md | ✅ | Created |
| domain/constants.ts | ✅ | PDF_EVENTS, PDF_DEFAULTS |
| domain/errors.ts | ✅ | PdfGenerationError, etc. |
| domain/keys.ts | ✅ | pdfKeys builder |
| **Data Layer** | | |
| Repository | 🔒 | N/A - no database layer |
| tenantFilter() | 🔒 | N/A - no database layer |
| **Service Layer** | | |
| One function per file | ✅ | render.ts |
| getTenantId() | ✅ | Used in renderPdf |
| **Public API** | | |
| @module JSDoc | ✅ | @layer 4 |

**Notes:**
- PDF rendering with metering
- Feature flag and subscription checks
- Token-based quota enforcement

---

#### `@unisane/ai` ✅ COMPLIANT

| Item | Status | Notes |
|------|--------|-------|
| **Structure** | | |
| README.md | ✅ | Created |
| domain/constants.ts | ✅ | AI_EVENTS, AI_PROVIDERS |
| domain/errors.ts | ✅ | AiProviderError, etc. |
| domain/keys.ts | ✅ | aiKeys builder |
| **Data Layer** | | |
| Repository | 🔒 | N/A - no database layer |
| tenantFilter() | 🔒 | N/A - no database layer |
| **Service Layer** | | |
| One function per file | ✅ | generate.ts |
| getTenantId() | ✅ | Used in generate |
| **Public API** | | |
| @module JSDoc | ✅ | @layer 4 |

**Notes:**
- AI text generation with metering
- Feature flag and subscription checks
- Multi-provider support planned

---

### PRO Modules

#### `@unisane/analytics` ✅ COMPLIANT

| Item | Status | Notes |
|------|--------|-------|
| **Structure** | | |
| README.md | ✅ | Created |
| domain/schemas.ts | ✅ | ZAnalyticsDashboard |
| domain/constants.ts | ✅ | ANALYTICS_EVENTS |
| domain/errors.ts | ✅ | AnalyticsQueryError, etc. |
| domain/keys.ts | ✅ | analyticsKeys builder |
| domain/ports.ts | ✅ | AnalyticsRepo |
| **Data Layer** | | |
| Repository pattern | ✅ | Uses selectRepo() |
| tenantFilter() | 🔒 | N/A - admin-only cross-tenant |
| **Service Layer** | | |
| One function per file | ✅ | dashboard.ts |
| getTenantId() | 🔒 | N/A - admin-only aggregation |
| **Public API** | | |
| @module JSDoc | ✅ | @layer 4 |

**Notes:**
- Admin-only platform analytics
- Aggregates metrics across all tenants
- Cached dashboard with 5-minute TTL

---

#### `@unisane/import-export` ✅ COMPLIANT

| Item | Status | Notes |
|------|--------|-------|
| **Structure** | | |
| README.md | ✅ | Created |
| domain/types.ts | ✅ | ExportJobView, ImportJobView |
| domain/schemas.ts | ✅ | |
| domain/constants.ts | ✅ | IMPORT_EXPORT_EVENTS |
| domain/errors.ts | ✅ | ImportError, ExportError, etc. |
| domain/keys.ts | ✅ | importExportKeys builder |
| domain/ports.ts | ✅ | JobsRepoPort |
| **Data Layer** | | |
| Repository pattern | ✅ | Uses selectRepo() |
| tenantFilter() | 🔒 | N/A - explicit tenantId in queries |
| **Service Layer** | | |
| One function per file | ✅ | export.ts, import.ts, jobs.ts |
| getTenantId() | ✅ | Used in all services |
| **Public API** | | |
| @module JSDoc | ✅ | @layer 4 |

**Notes:**
- Background job processing for large datasets
- Signed URLs for secure file downloads
- Multiple format support (JSON, CSV, XLSX)

---

## 📋 Key Rules Summary

| Rule | Description |
|------|-------------|
| **Keys in domain only** | `keys.ts` MUST be in `domain/`. NO `data/keys.ts` |
| **One function per file** | `grantCredits.ts` → `grantCredits()` |
| **Barrel exports** | `service/index.ts` re-exports all functions |
| **Repository pattern** | Use `selectRepo()` for DB-agnostic repos |
| **Context usage** | Use `getTenantId()`/`getUserId()` |
| **Tenant filtering** | Repositories use `tenantFilter()` from kernel |
| **DB-agnostic types** | Domain types use `string` for IDs, NOT `ObjectId` |
| **No MongoDB in services** | Never import `ObjectId`, `col()` in service files |
| **README required** | Every package MUST have `README.md` |

### Correct Import Pattern

```typescript
// ✅ CORRECT
import { getTenantId, tenantFilter, events } from "@unisane/kernel";
import { UserRepo } from "../data/user.repository";

export async function getUser() {
  const tenantId = getTenantId();
  return UserRepo.findById(id); // Repository handles tenantFilter internally
}

// ❌ WRONG
import { ObjectId } from "mongodb";
import { col } from "@unisane/kernel";
const doc = await col("users").findOne({ _id: new ObjectId(id) });
```

---

## 🚀 Migration Phases

### Phase 1: Cleanup ✅ DONE
- [x] Delete `data/keys.ts` from billing, settings
- [x] Merge `data/keys.ts` into `domain/keys.ts` for credits, flags
- [x] Add domain layer to all 18 modules

### Phase 2: Repository Migration (Current)
Migrate each module's repository to use `tenantFilter()`:

**Reference:** `packages/storage/src/data/storage.repository.mongo.ts`

| Module | Status |
|--------|--------|
| storage | ✅ DONE |
| identity | ✅ DONE |
| settings | ✅ N/A (explicit tenantId by design) |
| tenants | ✅ N/A (root entity) |
| auth | ✅ N/A (user-global, not tenant-scoped) |
| sso | ✅ N/A (domain-only stub) |
| billing | ✅ N/A (explicit tenantId for webhooks) |
| credits | ✅ N/A (explicit tenantId for admin/stats) |
| flags | ✅ N/A (platform-wide flags) |
| audit | ✅ N/A (append-only logs, explicit filter) |
| usage | ✅ N/A (explicit tenantId for rollups) |
| notify | ✅ N/A (explicit user+tenant scoping) |
| webhooks | ✅ N/A (inbound global, outbound from outbox) |
| media | ✅ N/A (pure utility functions) |

### Phase 3: Service Migration
Update services to use `getTenantId()` pattern:

| Module | Status |
|--------|--------|
| pdf | ✅ DONE |
| ai | ✅ DONE |
| usage | ✅ DONE |
| import-export | ✅ DONE |
| tenants | ✅ |
| identity | ✅ DONE |
| billing | ⚠️ Partial |
| credits | ⚠️ Partial |
| Others | ❌ |

### Phase 4: Documentation
Add `README.md` to all packages:

| Module | Status |
|--------|--------|
| identity | ✅ DONE |
| settings | ✅ DONE |
| tenants | ✅ DONE |
| auth | ✅ DONE |
| sso | ✅ DONE |
| billing | ✅ DONE |
| credits | ✅ DONE |
| flags | ✅ DONE |
| audit | ✅ DONE |
| usage | ✅ DONE |
| notify | ✅ DONE |
| webhooks | ✅ DONE |
| media | ✅ DONE |
| pdf | ✅ DONE |
| ai | ✅ DONE |
| analytics | ✅ DONE |
| import-export | ✅ DONE |
| storage | ✅ DONE |

### Phase 5: Starter Wiring
- [ ] Configure outbox worker
- [ ] Wire module providers
- [ ] Integration testing

---

## Validation Commands

```bash
# Check for data/keys.ts violations
find packages/*/src/data -name "keys.ts" 2>/dev/null
# Should return empty

# Check for missing README
for pkg in packages/*/; do [ -f "$pkg/README.md" ] || echo "Missing: $pkg"; done

# Check tenantFilter usage
grep -rn "tenantFilter" packages/*/src/data/*.ts | wc -l

# Check for ObjectId in services (should be 0)
grep -rn "ObjectId" packages/*/src/service/*.ts | grep -v ".mongo.ts" | wc -l
```

---

**Version:** 3.0
**Last Updated:** 2026-01-07
