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

### Phase 1: Immediate Fixes (1-2 days)

#### Task 1.1: Add lint scripts to all packages

**Script to run:**
```bash
# For each package.json, add:
"lint": "eslint src --max-warnings 0"
```

**Packages to update (28):**
- ai, analytics, audit, auth, billing, cli, contracts, credits
- devtools, eslint-config, flags, gateway, identity, import-export
- kernel, media, notify, pdf, settings, sso, storage
- tailwind-config, tenants, test-utils, tokens, typescript-config
- usage, webhooks

**Verification:**
```bash
turbo lint --filter='@unisane/*'
```

---

#### Task 1.2: Standardize vitest version

**File:** `/packages/data-table/package.json`

**Change:**
```diff
- "vitest": "^4.0.16"
+ "vitest": "^1.0.0"
```

**Verification:**
```bash
pnpm install
pnpm test --filter=@unisane/data-table
```

---

#### Task 1.3: Standardize pino-pretty

**File:** `/packages/gateway/package.json`

**Change:**
```diff
- "pino-pretty": "^10.2.0"
+ "pino-pretty": "^13.0.0"
```

---

### Phase 2: Package Structure Reorganization

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

#### Task 2.1: Create new folder structure

```bash
# Create categorized folders
mkdir -p packages/foundation
mkdir -p packages/modules
mkdir -p packages/pro
mkdir -p packages/ui
mkdir -p packages/tooling
```

---

#### Task 2.2: Move foundation packages

```bash
# Core infrastructure
mv packages/kernel packages/foundation/
mv packages/gateway packages/foundation/
mv packages/contracts packages/foundation/
```

---

#### Task 2.3: Move shared modules

```bash
# Layer 1
mv packages/identity packages/modules/
mv packages/settings packages/modules/
mv packages/storage packages/modules/

# Layer 2
mv packages/tenants packages/modules/
mv packages/auth packages/modules/

# Layer 3
mv packages/billing packages/modules/
mv packages/flags packages/modules/
mv packages/audit packages/modules/

# Layer 4
mv packages/credits packages/modules/
mv packages/usage packages/modules/
mv packages/notify packages/modules/
mv packages/webhooks packages/modules/

# Layer 5
mv packages/media packages/modules/
mv packages/pdf packages/modules/
mv packages/ai packages/modules/
```

---

#### Task 2.4: Move PRO modules

```bash
mv packages/analytics packages/pro/
mv packages/sso packages/pro/
mv packages/import-export packages/pro/
```

---

#### Task 2.5: Move UI packages

```bash
mv packages/ui packages/ui/core
mv packages/data-table packages/ui/
mv packages/tokens packages/ui/
mv packages/cli packages/ui/
```

---

#### Task 2.6: Move tooling packages

```bash
mv packages/devtools packages/tooling/
mv packages/test-utils packages/tooling/
mv packages/eslint-config packages/tooling/
mv packages/typescript-config packages/tooling/
mv packages/tailwind-config packages/tooling/
```

---

#### Task 2.7: Update pnpm-workspace.yaml

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

#### Task 2.8: Verify and fix imports

After moving, run:
```bash
# Check if build still works
pnpm build

# Check if types still work
pnpm check-types

# Fix any broken imports
```

**Note:** Package names (`@unisane/kernel`) stay the same. Only folder structure changes.

---

### Phase 3: Schema Organization

#### Task 3.1: Audit contract files for inline schemas

**Files to check:** All 24 files in `/starters/saaskit/src/contracts/`

**Look for:**
```typescript
// BAD - inline definition
const ZSomeFilter = z.object({ ... });

// GOOD - import from package
import { ZSomeFilter } from '@unisane/[package]/client';
```

---

#### Task 3.2: Move inline schemas to packages

For each inline schema found:
1. Check if equivalent exists in package domain/schemas.ts
2. If yes: Replace inline with import
3. If no: Add to package domain/schemas.ts, then import

---

#### Task 3.3: Document schema rules

Add to contracts-guide.md:
```markdown
## Schema Rules

1. Domain schemas MUST be defined in packages
2. Contract files MUST import schemas, never define inline
3. Only contract-specific wrappers (like ZAdminListQuery) may be defined in contracts
```

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

### Phase 2 Checklist (Package Reorganization)

- [ ] **2.1** Create folder structure (foundation/, modules/, pro/, ui/, tooling/)
- [ ] **2.2** Move kernel, gateway, contracts to foundation/
- [ ] **2.3** Move 18 business modules to modules/
- [ ] **2.4** Move analytics, sso, import-export to pro/
- [ ] **2.5** Move ui, data-table, tokens, cli to ui/
- [ ] **2.6** Move devtools, test-utils, configs to tooling/
- [ ] **2.7** Update pnpm-workspace.yaml
- [ ] **2.8** Run `pnpm install` - verify package resolution
- [ ] **2.9** Run `pnpm build` - verify build works
- [ ] **2.10** Run `pnpm check-types` - verify types work

### Phase 3 Checklist (Schema Organization)

- [ ] **3.1** Audit all 24 contract files
- [ ] **3.2** List all inline schemas found
- [ ] **3.3** Move inline schemas to packages
- [ ] **3.4** Update imports in contracts
- [ ] **3.5** Run `turbo build` - should pass
- [ ] **3.6** Update contracts-guide.md

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
