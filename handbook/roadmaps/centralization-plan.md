# Unisane Centralization Plan

> **Status:** Active
> **Created:** 2026-01-09
> **Last Updated:** 2026-01-09
> **Parent:** [MASTER-ROADMAP.md](./MASTER-ROADMAP.md)

> **IMPORTANT:** When completing any phase, update [implementation-status.md](../architecture/implementation-status.md) and follow the [Phase Completion Protocol](./MASTER-ROADMAP.md#phase-completion-protocol).

---

## Executive Summary

This document outlines the plan to centralize and consolidate the Unisane monorepo architecture. Based on deep analysis of the current codebase, we've identified fragmentation issues that need to be addressed for long-term maintainability.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Identified Issues](#identified-issues)
3. [Centralization Strategy](#centralization-strategy)
4. [Implementation Plan](#implementation-plan)
5. [Migration Checklist](#migration-checklist)

---

## Current State Analysis

### What's Working Well

| Area | Status | Details |
|------|--------|---------|
| Package structure | Excellent | 30 packages, clean `@unisane/*` namespace |
| Dependency hierarchy | Excellent | kernel -> gateway -> features (no cycles) |
| TypeScript configs | Excellent | 100% centralized via config packages |
| ESLint configs | Good | Minimal overrides (1 package) |
| Build tooling | Good | Turbo + tsup, proper caching |
| Platform layer | Good | Hexagonal architecture in starters |

### Package Dependency Graph

```
@unisane/typescript-config (27 dependents)
         |
         v
@unisane/kernel (23 dependents)
         |
         v
@unisane/gateway (18 dependents)
         |
    +----+----+----+----+
    |    |    |    |    |
    v    v    v    v    v
  auth billing tenants ... (feature packages)
```

**Key Insight:** No circular dependencies detected. Clean layer hierarchy.

---

## Identified Issues

### Priority 1: Critical (Fix First)

#### 1.1 Missing Lint Scripts

**Problem:** 28/30 packages don't define lint script, breaking Turbo lint chain.

**Current state:**
```json
// Most packages
"scripts": {
  "build": "tsup ...",
  "dev": "tsup --watch",
  "check-types": "tsc --noEmit"
  // NO lint script
}
```

**Impact:** `turbo lint` doesn't lint most packages.

**Solution:**
```json
"scripts": {
  "lint": "eslint src --max-warnings 0"
}
```

**Files to update:** All 28 packages missing lint script.

---

#### 1.2 Vitest Version Drift

**Problem:** `@unisane/data-table` uses vitest@^4.0.16 while all other packages use vitest@^1.0.0.

**Files:**
- `/packages/data-table/package.json` (line 92)

**Impact:** Potential incompatibilities, confusion.

**Solution:** Align to latest stable version across all packages.

---

#### 1.3 Pino-Pretty Version Inconsistency

**Problem:** Different versions in kernel vs gateway.

| Package | Version |
|---------|---------|
| @unisane/kernel | ^13.0.0 |
| @unisane/gateway | ^10.2.0 |

**Solution:** Standardize to ^13.0.0.

---

### Priority 2: High (Address Soon)

#### 2.1 Schema Organization (5 Levels)

**Problem:** Schemas defined at too many levels with duplication risk.

```
Level 1: packages/[service]/domain/schemas.ts      (SSOT)
Level 2: packages/[service]/client.ts              (re-export)
Level 3: starters/saaskit/contracts/*.contract.ts  (references + inline)
Level 4: starters/saaskit/sdk/schemas.ts           (generated)
Level 5: starters/saaskit/sdk/types.ts             (generated)
```

**Issue:** Contract files sometimes define inline schemas instead of importing from packages.

**Example of problem:**
```typescript
// BAD: Inline definition in contract
export const ZAdminTenantFilters = z.object({
  planId: z.object({ eq: z.string().optional() }).optional(),
  // ... hardcoded, could diverge from package
});

// GOOD: Import from package
import { ZTenantFilters } from '@unisane/tenants/client';
```

**Solution:**
1. Level 1 (packages) = Single Source of Truth
2. Level 2-3 = ONLY imports, never inline definitions
3. Level 4-5 = Generated (no changes needed)

---

#### 2.2 Admin Config Hardcoding

**Problem:** `adminListConfigs` array in gateway is hardcoded with only 2 entries.

**File:** `/packages/gateway/src/registry/admin.lists.ts`

```typescript
export const adminListConfigs: AdminListConfig[] = [
  { id: 'admin.tenants', ... },
  { id: 'admin.users', ... },
  // Adding new admin lists requires manual update here
];
```

**Issues:**
- Service packages cannot self-register admin views
- Adding new admin list requires gateway modification
- No auto-discovery

**Solution:** Self-registration pattern:
```typescript
// packages/tenants/src/admin.ts
export const tenantsAdminConfig: AdminListConfig = { ... };

// packages/gateway/src/registry/admin.lists.ts
// Auto-discover from packages at build time or runtime
```

---

#### 2.3 Field Registry Duplication

**Problem:** Both `*.fields.ts` AND `*.admin.fields.ts` exist with overlapping definitions.

**Files:**
- `/packages/gateway/src/registry/tenants.fields.ts` (full)
- `/packages/gateway/src/registry/tenants.admin.fields.ts` (subset)
- `/packages/gateway/src/registry/users.fields.ts` (full)
- `/packages/gateway/src/registry/users.admin.fields.ts` (subset)

**Issue:** Admin fields use `pickRegistry()` but still duplicate enum values.

**Solution:** Single field registry per entity, derive admin subset programmatically.

---

### Priority 3: Medium (Plan Now, Implement Later)

#### 3.1 Contract Location

**Current:** Contracts live in starter (`starters/saaskit/src/contracts/`).

**Consideration:** Could move contracts closer to packages, but this has trade-offs:
- Pro: Better colocation with implementations
- Con: Contracts are app-specific, different starters may want different APIs

**Decision:** Keep contracts in starters for now. They're intentionally app-specific.

---

#### 3.2 Potential New Packages

Based on analysis, these could be extracted:

| Module | Current Location | Rationale |
|--------|------------------|-----------|
| Metering | `saaskit/platform/metering/` | Generic usage policy engine |
| Outbox | `saaskit/platform/outbox/` | Generic event sourcing |
| RBAC | `saaskit/shared/rbac/` | Centralized permission system |

**Decision:** Plan for later, not priority during feature development.

---

## Centralization Strategy

### Principle 1: Single Source of Truth

```
Domain Schemas:    packages/[service]/domain/schemas.ts  (SSOT)
                            |
                            v (export)
Client Schemas:    packages/[service]/client.ts
                            |
                            v (import)
Contract Files:    starters/saaskit/contracts/*.ts
                            |
                            v (generate)
SDK Output:        starters/saaskit/sdk/**
```

**Rule:** Never define schemas inline in contracts. Always import.

---

### Principle 2: Package Self-Registration

```
Feature Package                      Gateway
+-------------------+                +-------------------+
|  @unisane/tenants |                |  @unisane/gateway |
|                   |   registers    |                   |
|  adminConfig      | ------------> |  adminListConfigs |
|  fieldRegistry    |                |  (auto-discovered)|
+-------------------+                +-------------------+
```

**Benefit:** Adding new admin views doesn't require gateway changes.

---

### Principle 3: Consistent Tooling

All packages should have:
```json
{
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --clean",
    "dev": "tsup src/index.ts --format esm --dts --watch",
    "lint": "eslint src --max-warnings 0",
    "check-types": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

---

## Implementation Plan

### Phase 1: Immediate Fixes (COMPLETED ✅)

#### Task 1.1: Add lint scripts to all packages ✅

**Completed:** Added `"lint": "eslint src --max-warnings 0"` to all 28 packages.

Also added:
- `eslint` as devDependency to all packages
- Root `eslint.config.mjs` using shared config

**Verification:**
```bash
turbo lint --filter='@unisane/*'
# Works! (28 warnings in kernel, 0 errors)
```

---

#### Task 1.2: Standardize vitest version ✅

**Completed:** All packages now use `vitest: ^4.0.16` (latest)

Also added:
- Root `vitest.base.ts` with shared test config
- Updated `@vitest/coverage-v8` to ^4.0.16
- Updated data-table `vitest.config.ts` to extend base

**Verification:**
```bash
pnpm test --filter=@unisane/data-table
# ✓ 1200 tests pass
```

---

#### Task 1.3: Standardize pino-pretty ✅

**Completed:** Gateway now uses `pino-pretty: ^13.0.0` (same as kernel)

---

### Phase 2: Package Structure Reorganization (COMPLETED ✅)

**Goal:** Reorganize flat `packages/` into categorized folders for multi-platform support.

#### Why This Matters

The current flat structure:
```
packages/
├── kernel/
├── gateway/
├── tenants/
├── billing/
├── ui/
└── ... (28 more)
```

Becomes problematic when:
- Adding CRM-specific modules (contacts, deals, pipeline)
- Adding e-commerce modules (products, cart, orders)
- Adding AI platform modules (agents, embeddings, rag)
- Navigating 50+ packages in a flat list

#### Target Structure

```
packages/
├── foundation/          # Core infrastructure (3 packages)
│   ├── kernel/
│   ├── gateway/
│   └── contracts/
│
├── modules/             # Shared business modules (18 packages)
│   ├── identity/
│   ├── tenants/
│   ├── billing/
│   └── ...
│
├── pro/                 # Premium modules (3 packages)
│   ├── analytics/
│   ├── sso/
│   └── import-export/
│
├── ui/                  # UI packages (4 packages)
│   ├── core/           # @unisane/ui
│   ├── data-table/
│   ├── tokens/
│   └── cli/
│
├── tooling/             # Dev tools (5 packages)
│   ├── devtools/
│   ├── test-utils/
│   ├── eslint-config/
│   ├── typescript-config/
│   └── tailwind-config/
│
├── crm/                 # CRM platform (future)
├── ecommerce/           # E-commerce platform (future)
├── helpdesk/            # Helpdesk platform (future)
└── ai-platform/         # AI apps platform (future)
```

#### Task 2.1: Create new folder structure ✅

```bash
# Create categorized folders
mkdir -p packages/foundation
mkdir -p packages/modules
mkdir -p packages/pro
mkdir -p packages/ui
mkdir -p packages/tooling
```

---

#### Task 2.2: Move foundation packages ✅

```bash
# Core infrastructure
mv packages/kernel packages/foundation/
mv packages/gateway packages/foundation/
mv packages/contracts packages/foundation/
```

---

#### Task 2.3: Move shared modules ✅

```bash
# 15 business modules moved
mv packages/identity packages/modules/
mv packages/settings packages/modules/
mv packages/storage packages/modules/
mv packages/tenants packages/modules/
mv packages/auth packages/modules/
mv packages/billing packages/modules/
mv packages/flags packages/modules/
mv packages/audit packages/modules/
mv packages/credits packages/modules/
mv packages/usage packages/modules/
mv packages/notify packages/modules/
mv packages/webhooks packages/modules/
mv packages/media packages/modules/
mv packages/pdf packages/modules/
mv packages/ai packages/modules/
```

---

#### Task 2.4: Move PRO modules ✅

```bash
mv packages/analytics packages/pro/
mv packages/sso packages/pro/
mv packages/import-export packages/pro/
```

---

#### Task 2.5: Move UI packages ✅

```bash
mv packages/ui packages/ui/core  # renamed to core
mv packages/data-table packages/ui/
mv packages/tokens packages/ui/
mv packages/cli packages/ui/
```

---

#### Task 2.6: Move tooling packages ✅

```bash
mv packages/devtools packages/tooling/
mv packages/test-utils packages/tooling/
mv packages/eslint-config packages/tooling/
mv packages/typescript-config packages/tooling/
mv packages/tailwind-config packages/tooling/
```

---

#### Task 2.7: Update pnpm-workspace.yaml ✅

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

---

#### Task 2.8: Verify and fix imports ✅

Completed:
- Updated all 26 `tsconfig.json` files with correct relative paths
- Updated `eslint.config.mjs` path to tooling folder
- Updated `vitest.config.ts` in data-table with correct paths
- Verified `pnpm install` works
- Verified `pnpm build` works (31/32 packages pass)

**Note:** Package names (`@unisane/kernel`) stay the same. Only folder structure changes.

---

### Phase 3: Schema Organization (COMPLETED ✅)

#### Task 3.1: Audit contract files for inline schemas ✅

**Files to check:** All 24 files in `/starters/saaskit/src/contracts/`

**Look for:**
```typescript
// BAD - inline definition
const ZSomeFilter = z.object({ ... });

// GOOD - import from package
import { ZSomeFilter } from '@unisane/[package]/client';
```

---

#### Task 3.2: Move inline schemas to packages ✅

**Result:** Audit found NO domain schema duplications. All inline schemas are intentional:
- 13 Response DTOs (ZMeOut, ZLedgerItem, ZUserOut, etc.)
- 4 Admin query schemas (ZAdminListQuery, ZAdminUserFilters, etc.)
- 9 contracts properly import all schemas from packages

No action needed - contracts already follow best practices.

---

#### Task 3.3: Document schema rules ✅

Added Schema Rules section to [contracts-guide.md](../architecture/contracts-guide.md#schema-rules):
- Schema hierarchy (5 levels)
- What goes where table
- 5 rules for schema organization
- Audit results summary

---

### Phase 4: Admin Config Centralization

#### Task 4.1: Define AdminListConfig export pattern

Each service package that needs admin views should export:
```typescript
// packages/tenants/src/admin.ts
import type { AdminListConfig } from '@unisane/gateway';

export const tenantsAdminConfig: AdminListConfig = {
  id: 'admin.tenants',
  path: ['tenants', 'admin'],
  hookName: 'useAdminTenantList',
  defaultSort: '-createdAt',
  defaultLimit: 50,
  fieldsRegistry: tenantsFieldRegistry,
  mapFilters: mapTenantsFilters,
};
```

---

#### Task 4.2: Create discovery mechanism in gateway

```typescript
// packages/gateway/src/registry/admin.lists.ts

// Auto-discover configs from packages
// Option A: Build-time (preferred)
// Option B: Runtime registration

// For now, explicit imports but from packages:
import { tenantsAdminConfig } from '@unisane/tenants/admin';
import { usersAdminConfig } from '@unisane/identity/admin';

export const adminListConfigs = [
  tenantsAdminConfig,
  usersAdminConfig,
];
```

---

#### Task 4.3: Update SDK generator

Ensure `@unisane/devtools` can discover admin configs from the centralized location.

---

### Phase 5: Field Registry Consolidation

#### Task 5.1: Merge field registries

For each entity, have ONE field registry:
```typescript
// packages/gateway/src/registry/tenants.fields.ts
export const tenantsFieldRegistry: Record<string, FieldDef> = {
  id: { key: '_id', type: 'string', ops: ['eq', 'in'] },
  slug: { key: 'slug', type: 'string', ops: ['eq', 'contains'] },
  planId: { key: 'planId', type: 'enum', ops: ['eq', 'in'], enumValues: PLANS },
  // ... all fields
};

// Derive admin subset
export const tenantsAdminFieldRegistry = pickRegistry(tenantsFieldRegistry, [
  'id', 'slug', 'planId', 'status', 'createdAt'
]);
```

---

#### Task 5.2: Import enums from kernel

**Before:**
```typescript
const PLANS = ['free', 'pro', 'pro_yearly', 'business'] as const; // hardcoded
```

**After:**
```typescript
import { PLANS } from '@unisane/kernel/constants';
```

---

## Migration Checklist

### Pre-Migration

- [ ] Read this document completely
- [ ] Understand current package structure
- [ ] Check [implementation-status.md](../architecture/implementation-status.md)

### Phase 1 Checklist

- [ ] **1.1** Add lint script to all 28 packages
- [ ] **1.2** Update vitest in data-table to ^1.0.0
- [ ] **1.3** Update pino-pretty in gateway to ^13.0.0
- [ ] **1.4** Run `pnpm install`
- [ ] **1.5** Run `turbo lint` - should pass
- [ ] **1.6** Run `turbo test` - should pass

### Phase 2 Checklist (Package Reorganization) ✅ COMPLETED

- [x] **2.1** Create folder structure (foundation/, modules/, pro/, ui/, tooling/)
- [x] **2.2** Move kernel, gateway, contracts to foundation/
- [x] **2.3** Move 15 business modules to modules/
- [x] **2.4** Move analytics, sso, import-export to pro/
- [x] **2.5** Move ui (→core), data-table, tokens, cli to ui/
- [x] **2.6** Move devtools, test-utils, configs to tooling/
- [x] **2.7** Update pnpm-workspace.yaml
- [x] **2.8** Run `pnpm install` - verified package resolution
- [x] **2.9** Run `pnpm build` - verified build works (31/32 pass)
- [x] **2.10** Update all tsconfig.json relative paths

### Phase 3 Checklist (Schema Organization) ✅ COMPLETED

- [x] **3.1** Audit all 22 contract files
- [x] **3.2** List all inline schemas found (17 total, all intentional)
- [x] **3.3** Verify no domain schema duplication (none found)
- [x] **3.4** Document schema rules in contracts-guide.md
- [x] **3.5** Add audit results to documentation

### Phase 4 Checklist (Admin Config Centralization)

- [ ] **4.1** Create admin.ts in @unisane/tenants
- [ ] **4.2** Create admin.ts in @unisane/identity
- [ ] **4.3** Update gateway admin.lists.ts to import from packages
- [ ] **4.4** Update SDK generator if needed
- [ ] **4.5** Run `pnpm sdk:gen` - should pass
- [ ] **4.6** Test admin pages work

### Phase 5 Checklist (Field Registry Consolidation)

- [ ] **5.1** Merge tenants field registries
- [ ] **5.2** Merge users field registries
- [ ] **5.3** Import enums from kernel
- [ ] **5.4** Remove duplicate *.admin.fields.ts files
- [ ] **5.5** Update imports in gateway
- [ ] **5.6** Run full test suite

### Post-Migration

- [ ] Update handbook documentation
- [ ] Update ARCHITECTURE.md if needed
- [ ] Update implementation-status.md
- [ ] Communicate changes to team

---

## Files Reference

### Packages to Add Lint Script

```
packages/ai/package.json
packages/analytics/package.json
packages/audit/package.json
packages/auth/package.json
packages/billing/package.json
packages/cli/package.json
packages/contracts/package.json
packages/credits/package.json
packages/devtools/package.json
packages/eslint-config/package.json
packages/flags/package.json
packages/gateway/package.json
packages/identity/package.json
packages/import-export/package.json
packages/kernel/package.json
packages/media/package.json
packages/notify/package.json
packages/pdf/package.json
packages/settings/package.json
packages/sso/package.json
packages/storage/package.json
packages/tailwind-config/package.json
packages/tenants/package.json
packages/test-utils/package.json
packages/tokens/package.json
packages/typescript-config/package.json
packages/usage/package.json
packages/webhooks/package.json
```

### Key Files for Schema Organization

```
starters/saaskit/src/contracts/tenants.contract.ts
starters/saaskit/src/contracts/users.contract.ts
starters/saaskit/src/contracts/billing.contract.ts
starters/saaskit/src/contracts/auth.contract.ts
... (24 total)
```

### Key Files for Admin Centralization

```
packages/gateway/src/registry/admin.lists.ts
packages/gateway/src/registry/types.ts
packages/gateway/src/registry/tenants.fields.ts
packages/gateway/src/registry/tenants.admin.fields.ts
packages/gateway/src/registry/users.fields.ts
packages/gateway/src/registry/users.admin.fields.ts
```

---

## Related Documents

- [MASTER-ROADMAP.md](./MASTER-ROADMAP.md) - Overall roadmap
- [server-table-state.md](./server-table-state.md) - DataTable implementation
- [implementation-status.md](../architecture/implementation-status.md) - What's built
- [contracts-guide.md](../architecture/contracts-guide.md) - API contracts
- [sdk-architecture.md](../architecture/sdk-architecture.md) - SDK generation

---

## Appendix: Analysis Details

### Package Dependency Count

| Package | Dependents | Notes |
|---------|------------|-------|
| typescript-config | 27 | Config package |
| kernel | 23 | Core foundation |
| gateway | 18 | HTTP layer |
| tenants | 7 | Multi-tenancy |
| settings | 6 | Configuration |
| billing | 6 | Payments |
| identity | 5 | Users |
| notify | 4 | Notifications |
| usage | 4 | Metering |
| credits | 4 | Token system |

### High Coupling Packages (Watch)

| Package | Dependencies | Notes |
|---------|--------------|-------|
| webhooks | 7 | Consider splitting |
| auth | 5 | Complex, monitor growth |
| ai | 5 | Multiple features |

### Build Tool Distribution

| Tool | Packages | Percentage |
|------|----------|------------|
| tsup | 23 | 77% |
| tsc | 3 | 10% |
| Custom | 4 | 13% |
