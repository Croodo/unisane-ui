# Unisane/SaasKit - Best Practices Assessment

> **Assessment Date:** 2026-01-07
> **Status:** Architecture Analysis Complete

---

## What SaasKit Is Meant To Be

**SaasKit is a production-ready SaaS starter that:**
1. Ships as **source code users own** (no runtime @unisane/* dependencies after download)
2. Provides **18+ battle-tested business modules** (billing, credits, auth, etc.)
3. Uses **clean modular monolith** architecture
4. Enables **full customization** (swap providers, extend modules)
5. Is **type-safe end-to-end** (Zod → API → UI)

**Target Users:**
- Full-stack developers building SaaS products
- Teams needing more than just auth + database
- Startups that need billing, multi-tenancy, team management

---

## Assessment: Are We Following Best Practices?

### ✅ CORRECT: Modular Monolith Architecture

| Principle | Status | Evidence |
|-----------|--------|----------|
| Layer isolation | ✅ Done | kernel → gateway → modules → contracts → distribution |
| Barrel exports | ✅ Done | Each module has public API via `src/index.ts` |
| No deep imports | ✅ Done | Modules import `@unisane/billing` not internals |
| Repository pattern | ✅ Done | All modules use `selectRepo()` pattern |
| Tenant context | ✅ Done | All modules use `getTenantId()` pattern |

### ✅ CORRECT: Type Safety End-to-End

| Principle | Status | Evidence |
|-----------|--------|----------|
| Zod as SSOT | ✅ Done | All schemas defined with Zod |
| ts-rest contracts | ✅ Done | API contracts in starters/saaskit/src/contracts |
| Auto-generated SDK | ✅ Planned | devtools will generate SDK from contracts |
| Type exports | ✅ Done | Types exported from module barrels |

### ✅ CORRECT: Separated CLI Packages

| Principle | Status | Rationale |
|-----------|--------|-----------|
| @unisane/cli | ✅ Public | For app developers consuming UI components |
| @unisane/devtools | ✅ Internal | For framework maintainers (heavy deps) |

This is correct because:
- Different audiences (app devs vs framework devs)
- Different dependency sizes (~500KB vs ~20MB)
- Different publishing (npm public vs workspace internal)

### ⚠️ GAP: Devtools Not Implemented

| Component | Status | Impact |
|-----------|--------|--------|
| routes:gen | ❌ Empty | Can't generate API routes from contracts |
| sdk:gen | ❌ Empty | Can't generate typed SDK for frontend |
| seed | ❌ Empty | Can't seed demo data |
| indexes:apply | ❌ Empty | Can't apply database indexes |
| doctor | ❌ Empty | Can't health-check the project |

**This is the critical blocker.** Without devtools, the SaasKit development workflow is broken.

### ⚠️ GAP: Contracts Have Broken Imports

| Issue | Status | Impact |
|-------|--------|--------|
| `@/src/modules/*` paths | ❌ Broken | Contracts reference non-existent paths |
| Should use `@unisane/*` | ❌ Not done | Need to update 150+ import paths |

**Root Cause:** Contracts were written for old saaskit repo structure. Modules are now npm packages but contracts still reference local paths.

### ✅ CORRECT: User Ownership Model

| Principle | Status | Evidence |
|-----------|--------|----------|
| Source code distribution | ✅ Correct | Users download starters/saaskit |
| No runtime @unisane/* deps | ⚠️ Partial | Will be true after contracts fixed |
| Full customization | ✅ Correct | All code is visible and editable |

---

## Critical Assessment: Devtools Architecture

### Current State
```
packages/devtools/src/index.ts:
export const VERSION = '0.0.0';
// That's it. Nothing else.
```

### What's Needed

The devtools roadmap (handbook/dev-tools-roadmap.md) is **well-designed** with:

1. **Modular structure** - Commands separated from generators
2. **All 20+ commands** - Code generation, database, tenant, billing, dev
3. **Clean architecture** - No bloated single files
4. **Proper phases** - Incremental implementation plan

**The plan is correct. Execution is pending.**

---

## Assessment Against SaasKit Goals

### Goal 1: "Ships as source code users own"

| Aspect | Status | Notes |
|--------|--------|-------|
| Modules in packages/ | ✅ Done | All 18+ modules implemented |
| Starters download | ⚠️ Blocked | Contracts have broken imports |
| No runtime deps | ⚠️ Blocked | Need to fix contracts first |

### Goal 2: "18+ battle-tested business modules"

| Module | Status | Build |
|--------|--------|-------|
| kernel | ✅ Done | ✅ Builds |
| gateway | ✅ Done | ✅ Builds |
| identity | ✅ Done | ✅ Builds |
| tenants | ✅ Done | ✅ Builds |
| billing | ✅ Done | ✅ Builds |
| credits | ✅ Done | ✅ Builds |
| auth | ✅ Done | ✅ Builds |
| settings | ✅ Done | ✅ Builds |
| storage | ✅ Done | ✅ Builds |
| flags | ✅ Done | ✅ Builds |
| audit | ✅ Done | ✅ Builds |
| notify | ✅ Done | ✅ Builds |
| webhooks | ✅ Done | ✅ Builds |
| usage | ✅ Done | ✅ Builds |
| media | ✅ Done | ✅ Builds |
| pdf | ✅ Done | ✅ Builds |
| ai | ✅ Done | ✅ Builds |
| analytics | ✅ Done | ✅ Builds |
| sso | ✅ Done | ✅ Builds |
| import-export | ✅ Done | ✅ Builds |

**All 20 business modules are implemented and building.**

### Goal 3: "Clean modular monolith"

| Aspect | Status | Evidence |
|--------|--------|----------|
| Layer hierarchy | ✅ Correct | kernel → gateway → modules |
| Module isolation | ✅ Correct | Barrel exports, no deep imports |
| Repository pattern | ✅ Correct | selectRepo() everywhere |
| Tenant scoping | ✅ Correct | getTenantId() everywhere |
| Event system | ✅ Correct | Domain events in each module |

### Goal 4: "Type-safe end-to-end"

| Aspect | Status | Blocker |
|--------|--------|---------|
| Zod schemas | ✅ Done | - |
| ts-rest contracts | ⚠️ Broken | Import paths wrong |
| Generated routes | ❌ Blocked | Devtools not implemented |
| Generated SDK | ❌ Blocked | Devtools not implemented |

### Goal 5: "Full customization"

| Aspect | Status | Notes |
|--------|--------|-------|
| Swap billing provider | ✅ Designed | Provider abstraction exists |
| Swap email provider | ✅ Designed | Provider abstraction exists |
| Extend modules | ✅ Possible | Clear extension points |
| Custom business logic | ✅ Possible | Service layer is editable |

---

## Summary: What's Working vs What's Blocked

### ✅ Working (Foundations Complete)

```
Layer -1: Build Infrastructure     ✅ Done (turbo, tsup, pnpm)
Layer 0:  Kernel                   ✅ Done (context, repos, types)
Layer 1:  Gateway                  ✅ Done (handlers, middleware)
Layer 2:  Business Modules (18+)   ✅ Done (all build successfully)
```

### ❌ Blocked (Execution Layer)

```
Layer 3:  Devtools                 ❌ NOT IMPLEMENTED (critical blocker)
Layer 4:  Contracts                ❌ BROKEN (wrong import paths)
Layer 5:  Distribution (saaskit)  ❌ BLOCKED (can't generate routes/SDK)
```

---

## Recommended Next Steps (Priority Order)

### 1. Build Devtools (Phase 1-3 from Roadmap)
```
Priority: CRITICAL
Why: Without devtools, nothing else works

Phase 1: CLI infrastructure (commander, utils, config)
Phase 2: Database operations (db:query, indexes:apply, seed)
Phase 3: Contract discovery & metadata extraction
```

### 2. Fix Contracts
```
Priority: HIGH
Why: Contracts reference @/src/modules/* which doesn't exist

Action: Update ~150 import paths from:
  @/src/modules/credits/service/grant → @unisane/credits
  @/src/modules/billing/domain/schemas → @unisane/billing
```

### 3. Generate Routes & SDK
```
Priority: HIGH
Why: This is what makes the starter usable

Action: Run devtools routes:gen and sdk:gen
```

### 4. Test End-to-End
```
Priority: MEDIUM
Why: Verify the full stack works

Action: Start saaskit, test billing flow, verify SDK types
```

---

## Architectural Best Practices Checklist

| Practice | Status | Notes |
|----------|--------|-------|
| Modular monolith | ✅ | Correct pattern for SaaS |
| Layer isolation | ✅ | kernel → gateway → modules |
| Repository pattern | ✅ | selectRepo() everywhere |
| Tenant context | ✅ | getTenantId() everywhere |
| Barrel exports | ✅ | Public APIs via index.ts |
| Zod as SSOT | ✅ | All schemas defined |
| ts-rest contracts | ⚠️ | Needs import fixes |
| Auto-generated code | ❌ | Devtools not implemented |
| Error handling | ✅ | ERR.* pattern in gateway |
| Event system | ✅ | Domain events defined |
| Provider abstraction | ✅ | Billing, email, storage swappable |
| CLI separation | ✅ | @unisane/cli vs @unisane/devtools |

---

## Conclusion

**The architecture is sound. The foundations are complete. The blockers are in execution layer.**

| Aspect | Assessment |
|--------|------------|
| **Architecture Design** | ✅ Excellent - follows best practices |
| **Module Implementation** | ✅ Complete - all 20 modules building |
| **Type Safety** | ⚠️ Partial - schemas done, codegen missing |
| **Developer Experience** | ❌ Blocked - devtools not implemented |
| **Distribution** | ❌ Blocked - contracts broken |

**The single most impactful next step is: Build @unisane/devtools**

Once devtools works:
1. Fix contracts (update import paths)
2. Generate routes (devtools routes:gen)
3. Generate SDK (devtools sdk:gen)
4. SaasKit becomes functional
