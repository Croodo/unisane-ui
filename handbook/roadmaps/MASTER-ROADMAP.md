# Unisane Platform Master Roadmap

> **Status:** Active
> **Created:** 2026-01-09
> **Last Updated:** 2026-01-10
> **Owner:** Engineering Team

---

## Vision

Build a **unified, centralized platform** for rapid SaaS development where:

1. **Developers** can build production-ready SaaS apps in days, not months
2. **Code is owned** by users (source code, not runtime dependencies)
3. **Modules are reusable** across different products (SaaS, e-commerce, AI apps)
4. **Tooling is automated** (SDK generation, routes, admin panels)
5. **Architecture is clean** (modular monolith, can split later)

---

## Current State Summary

| Area | Status | Health |
|------|--------|--------|
| **Monorepo Structure** | 30 packages in 5 categories | Excellent |
| **Package Organization** | foundation/, modules/, pro/, ui/, tooling/ | Excellent |
| **Foundation** | kernel + gateway + contracts | Good |
| **Feature Packages** | 15 modules + 3 PRO | Good |
| **UI Library** | @unisane/ui + data-table + sidebar + command + stat-card | Excellent |
| **UI Consolidation** | saaskit migrated to @unisane/ui (M3 patterns) | Excellent |
| **SDK Generation** | @unisane/devtools | Good |
| **Platform Layer** | Hexagonal architecture | Good (app-specific code correctly placed) |
| **Linting** | All packages have lint scripts | Good |
| **Testing** | vitest ^4.0.16, shared base config | Good |
| **Distribution** | build-starter.ts implemented | Good |
| **Admin Pages** | 8/15 implemented | Needs Work |
| **Tenant Pages** | 9/15 implemented | Needs Work |
| **Dependency Versions** | All aligned | Excellent |
| **Schema Consistency** | All standardized | Excellent |
| **Code Quality** | @ts-nocheck in generators (deferred) | Good |
| **Error Handling** | Complete (GlobalErrorBoundary, ErrorBanner, field errors) | Excellent |

See [implementation-status.md](../architecture/implementation-status.md) for detailed status.

---

## Strategic Goals

### Goal 1: Fix Critical Issues
Address dependency conflicts, schema inconsistencies, and potential bugs.

### Goal 2: Complete Feature Development
Build all planned admin and tenant UI pages.

### Goal 3: Improve Code Quality
Remove @ts-nocheck, fix empty catch blocks, standardize patterns.

### Goal 4: Enable Distribution
Finalize tools to ship starters to end users.

---

## Completed Phases (Archive)

<details>
<summary><strong>Phase 1: Foundation Consolidation (COMPLETED ✅)</strong></summary>

**Goal:** Fix fragmentation, improve consistency.

| Task | Status |
|------|--------|
| Standardize lint scripts across packages | ✅ Done |
| Add eslint to all packages | ✅ Done |
| Create root eslint.config.mjs | ✅ Done |
| Fix vitest version drift | ✅ Done (^4.0.16) |
| Create shared vitest.base.ts | ✅ Done |
| Standardize pino-pretty version | ✅ Done (^13.0.0) |

</details>

<details>
<summary><strong>Phase 2: Package Structure Reorganization (COMPLETED ✅)</strong></summary>

**Goal:** Multi-platform architecture with categorized package folders.

| Task | Status |
|------|--------|
| Create foundation/ folder (kernel, gateway, contracts) | ✅ Done |
| Create modules/ folder (15 shared modules) | ✅ Done |
| Create pro/ folder (analytics, sso, import-export) | ✅ Done |
| Create ui/ folder (core, data-table, tokens, cli) | ✅ Done |
| Create tooling/ folder (devtools, configs, test-utils) | ✅ Done |
| Update pnpm-workspace.yaml | ✅ Done |
| Update all tsconfig.json paths | ✅ Done |
| Verify pnpm install works | ✅ Done |
| Verify turbo build works | ✅ Done (31/32 packages) |

**Result:**
```
packages/
├── foundation/   # kernel, gateway, contracts
├── modules/      # 15 business modules
├── pro/          # analytics, sso, import-export
├── ui/           # core, data-table, tokens, cli
└── tooling/      # devtools, test-utils, configs
```

</details>

<details>
<summary><strong>Phase 3: Schema & Contract Centralization (COMPLETED ✅)</strong></summary>

**Goal:** Single source of truth for schemas and contracts.

| Task | Status |
|------|--------|
| Audit contract files for inline schemas | ✅ Done (22 files) |
| Establish schema hierarchy rules | ✅ Done (contracts-guide.md) |
| Document schema rules | ✅ Done |

**Result:** Audited all 22 contract files. Found 0 domain schema duplications. Schema rules documented in [contracts-guide.md](../architecture/contracts-guide.md#schema-rules).

</details>

<details>
<summary><strong>Phase 4.1: Server Table State (COMPLETED ✅)</strong></summary>

**Goal:** Implement server-first data table patterns.

| Task | Status |
|------|--------|
| Server table state pattern (Phase 0-5) | ✅ Done |
| useServerTable hook | ✅ Done |
| SDK page persistence | ✅ Done |
| Apply patterns to admin pages | ✅ Analyzed |
| Apply patterns to tenant pages | ✅ Analyzed |

**Result:**
- `useServerTable` hook at `starters/saaskit/src/hooks/useServerTable.ts`
- SDK hooks with page persistence in `gen-admin-hooks.ts`
- UsersClient (server-first) and TenantsClient (client-first) patterns working

</details>

<details>
<summary><strong>Phase 4.2: UI Library Consolidation (COMPLETED ✅)</strong></summary>

**Goal:** Migrate saaskit to use @unisane/ui with Material 3 patterns, eliminate local UI component duplication.

| Task | Status |
|------|--------|
| Add Command component to @unisane/ui | ✅ Done |
| Merge SidebarMenuButton/SidebarNavItem into @unisane/ui | ✅ Done |
| Move StatCard/StatGrid to @unisane/ui | ✅ Done |
| Update saaskit sidebar imports to @unisane/ui | ✅ Done |
| Update saaskit command imports to @unisane/ui | ✅ Done |
| Update saaskit stat-card imports to @unisane/ui | ✅ Done |
| Replace sonner with @unisane/ui toast | ✅ Done |
| Delete local duplicate components from saaskit | ✅ Done |
| Add explicit package.json exports for folder components | ✅ Done |

**Result:**

Components moved to @unisane/ui:
- `@unisane/ui/components/command` - Command palette (cmdk-based)
- `@unisane/ui/components/sidebar` - Full sidebar with SidebarMenuButton, SidebarNavItem
- `@unisane/ui/components/stat-card` - StatCard and StatGrid
- `@unisane/ui/components/toast` - Toast notifications (replaces sonner)

saaskit cleanup:
- Deleted `src/components/ui/sidebar/`
- Deleted `src/components/ui/command.tsx`
- Deleted `src/components/ui/stat-card.tsx`
- Deleted `src/components/ui/sonner.tsx`
- Kept `src/components/ui/status-badge.tsx` (app-specific dependencies)

Package.json exports added:
- `./components/sidebar` → `./dist/components/sidebar/index.js`
- `./components/navigation` → `./dist/components/navigation/index.js`
- `./components/data-table` → `./dist/components/data-table/index.js`

</details>

---

## Active Phases

### Phase 4: Critical Fixes ✅ COMPLETED

**Goal:** Fix critical issues discovered during codebase analysis.

> **Note:** See [centralization-plan.md](./centralization-plan.md) for detailed implementation checklists.

#### 4.1 Dependency Version Conflicts ✅ COMPLETED

All 6 version conflicts resolved.

#### 4.2 Schema & Type Inconsistencies ✅ COMPLETED

| Issue | Status |
|-------|--------|
| Idempotency key naming | ✅ Standardized to `idem` |
| TenantId nullability | ✅ Policy defined |
| Plan field naming (`planId` vs `plan`) | ✅ Fixed |
| Timestamp format | ✅ Standardized to Unix ms |
| Actor field naming | ✅ Policy defined |
| Pagination limits | ✅ Using kernel constants |
| ListPageArgs type | ✅ Added to kernel |

#### 4.3 Code Quality Issues ✅ COMPLETED

| Issue | Status |
|-------|--------|
| Empty catch blocks | ✅ Added error logging |
| Race condition in package-manager | ✅ Fixed |
| Console.log with auth codes | ✅ Replaced with logger |
| @ts-nocheck in SDK generators | ✅ Documented (deferred - requires upstream ts-rest changes) |

#### 4.4 Code Duplication ✅ COMPLETED

| Pattern | Status |
|---------|--------|
| List Args Types | ✅ `ListPageArgs` in kernel |
| Phone/Email validation | ✅ Using identity module |
| Error factory | ✅ `createDomainError` in kernel |
| Repository boilerplate | ✅ Documented (deferred - low priority) |

#### 4.5 Architectural Layer Fixes ✅ COMPLETED

HTTP code moved from kernel to gateway. Kernel files marked @deprecated.

#### 4.6 Enterprise Error Handling ✅ COMPLETED

All error handling improvements implemented:

| Area | Status |
|------|--------|
| Backend error consolidation | ✅ Using specific ErrorCode (E1xxx-E8xxx) |
| `retryable` flag on DomainError | ✅ Added |
| `FieldError` interface | ✅ Added to kernel |
| `ValidationError.fromZod()` | ✅ Enhanced |
| `ProviderError` base class | ✅ Created |
| Module error codes | ✅ All 18 modules migrated |
| Vendor error wrapping | ✅ Stripe/Razorpay wrapped |
| GlobalErrorBoundary | ✅ `src/components/feedback/GlobalErrorBoundary.tsx` |
| ErrorBanner component | ✅ `src/components/feedback/ErrorBanner.tsx` |
| Field errors in forms | ✅ `mapFieldErrors` helper in useApiError |
| Error display strategy | ✅ banner/redirect/inline/toast |
| Request ID propagation | ✅ Already in generated SDK |
| Contract error types | ✅ `ZErrorResponse` in contracts |

---

### Phase 5: Feature Completion

**Goal:** Complete all planned admin and tenant UI pages.

#### 5.1 Missing Admin API Routes (Prerequisite for UI)

| Endpoint | Module | Priority | Status |
|----------|--------|----------|--------|
| `/admin/credits` (stats across tenants) | @unisane/credits | High | ⬜ Not Built |
| `/admin/usage` (usage dashboard) | @unisane/usage | High | ⬜ Not Built |
| `/admin/import-export` (job management) | @unisane/import-export | Medium | ⬜ Not Built |
| `/admin/notify` (campaign management) | @unisane/notify | Medium | ⬜ Not Built |
| `/admin/storage` (quota monitoring) | @unisane/storage | Low | ⬜ Not Built |
| `/admin/media` (library management) | @unisane/media | Low | ⬜ Not Built |
| `/admin/pdf` (template management) | @unisane/pdf | Low | ⬜ Not Built |

#### 5.2 Admin Pages

**Already Implemented (8):**
- `/admin/overview` - Analytics dashboard ✅
- `/admin/tenants` - Tenant management ✅
- `/admin/users` - User management ✅
- `/admin/audit` - Audit logs ✅
- `/admin/flags` - Feature flags ✅
- `/admin/settings` - Global settings ✅
- `/admin/health` - System health ✅
- `/admin/outbox` - Dead letter queue ✅

**To Build (7):**

| Page | Priority | Backend | API Route | Status |
|------|----------|---------|-----------|--------|
| Admin credits dashboard | High | ✅ @unisane/credits | ⬜ Needs API | ⬜ Pending |
| Admin usage dashboard | High | ✅ @unisane/usage | ⬜ Needs API | ⬜ Pending |
| Admin import/export management | Medium | ✅ @unisane/import-export | ⬜ Needs API | ⬜ Pending |
| Admin notify management | Medium | ✅ @unisane/notify | ⬜ Needs API | ⬜ Pending |
| Admin storage dashboard | Low | ✅ @unisane/storage | ⬜ Needs API | ⬜ Pending |
| Admin media library | Low | ✅ @unisane/media | ⬜ Needs API | ⬜ Pending |
| Admin PDF templates | Low | ✅ @unisane/pdf | ⬜ Needs API | ⬜ Pending |

#### 5.3 Tenant Pages

**Already Implemented (9):**
- `/w/[slug]/dashboard` - Workspace overview ✅
- `/w/[slug]/settings` - Workspace settings ✅
- `/w/[slug]/billing` - Billing & credits ✅
- `/w/[slug]/team` - Team management ✅
- `/w/[slug]/account` - Account settings ✅
- `/w/[slug]/apikeys` - API keys ✅
- `/w/[slug]/webhooks` - Webhooks ✅
- `/w/[slug]/audit` - Audit logs ✅
- `/w/[slug]/templates` - Templates ✅

**To Build (6):**

| Page | Priority | Backend | API Route | Status |
|------|----------|---------|-----------|--------|
| Tenant usage dashboard | High | ✅ @unisane/usage | ✅ Exists | ⬜ Pending |
| Tenant import/export UI | High | ✅ @unisane/import-export | ✅ Exists | ⬜ Pending |
| Tenant notify preferences | Medium | ✅ @unisane/notify | ✅ Exists | ⬜ Pending |
| Tenant storage management | Low | ✅ @unisane/storage | ✅ Exists | ⬜ Pending |
| Tenant media library | Low | ✅ @unisane/media | ⚠️ Partial | ⬜ Pending |
| Tenant AI settings | Low | ✅ @unisane/ai | ✅ Exists | ⬜ Pending |

#### 5.4 Recommended Implementation Order

**Phase 5a - High Value (Backend Ready):**
1. Tenant usage dashboard (API exists, just needs UI)
2. Tenant import/export UI (API exists, just needs UI)
3. Create admin credits API + dashboard
4. Create admin usage API + dashboard

**Phase 5b - Medium Value:**
5. Tenant notify preferences
6. Admin import/export management (needs API first)
7. Tenant analytics page

**Phase 5c - Nice-to-Have:**
8. Admin storage dashboard
9. Tenant media library
10. Admin notify management
11. Admin PDF templates
12. Tenant storage management
13. Tenant AI settings

---

### Phase 6: Testing & Quality

**Goal:** Comprehensive test coverage.

| Task | Priority | Status |
|------|----------|--------|
| Add tests to all packages | High | ⬜ Pending |
| E2E tests for critical flows | High | ⬜ Pending |
| Performance benchmarks | Medium | ⬜ Pending |
| Bundle size monitoring | Medium | ⬜ Pending |

---

### Phase 7: Distribution

**Goal:** Ship starters to end users.

| Task | Priority | Status |
|------|----------|--------|
| build-starter.ts | High | ✅ Implemented |
| Import transformation | High | ⬜ Pending |
| OSS/PRO code stripping | Medium | ⬜ Pending |
| create-unisane-app CLI | Medium | ⬜ Pending |

**Note:** `build-starter.ts` is implemented at `/packages/tooling/devtools/src/commands/release/build-starter.ts`

---

### Phase 8: Documentation & Polish

**Goal:** Production-ready documentation.

| Task | Priority | Status |
|------|----------|--------|
| Complete API documentation | High | ⬜ Pending |
| Document OpenAPI endpoint (/api/openapi) | High | ⬜ Pending |
| Migration guides | High | ⬜ Pending |
| Video tutorials | Medium | ⬜ Pending |
| Example projects | Medium | ⬜ Pending |

---

## Known Issues Tracker

### Critical Issues

| ID | Issue | Impact | Status |
|----|-------|--------|--------|
| CRIT-001 | pino v8 vs v9 mismatch | Runtime compatibility | ✅ Fixed |
| CRIT-002 | AWS SDK 500+ version drift | API compatibility risk | ✅ Fixed |
| CRIT-003 | Idempotency key naming inconsistent | API contract confusion | ⬜ Open |
| CRIT-004 | Two error systems (Kernel vs Gateway) | Inconsistent error codes | ⬜ Open |
| CRIT-005 | No global error boundary (frontend) | App crashes on render errors | ✅ Fixed |
| CRIT-006 | No global error handler (backend) | Raw errors leak to client | ⬜ Open |

### High Priority Issues

| ID | Issue | Impact | Status |
|----|-------|--------|--------|
| HIGH-001 | @ts-rest version mismatch | Type inference issues | ✅ Fixed |
| HIGH-002 | TenantId nullability inconsistent | Validation failures | ✅ Fixed |
| HIGH-003 | @ts-nocheck in generators | No type safety in SDK | ⬜ Open (deferred) |
| HIGH-004 | Empty catch blocks in billing | Silent failures | ✅ Fixed |
| HIGH-005 | 7 admin API routes missing | Blocks admin UI | ⬜ Open |
| HIGH-008 | Module errors use generic codes | Can't distinguish error types | ✅ Fixed |
| HIGH-009 | Field errors not displayed in forms | Users don't know which field failed | ✅ Fixed |
| HIGH-010 | Raw vendor errors not wrapped | Internal details leak to users | ✅ Fixed |
| HIGH-011 | DomainError missing retryable flag | Frontend can't auto-retry | ✅ Fixed |
| ~~HIGH-006~~ | ~~600+ lines business logic in platform layer~~ | ~~Won't sync to starters~~ | ❌ Invalid |
| ~~HIGH-007~~ | ~~Billing used as infrastructure by ai/pdf/webhooks~~ | ~~Unexpected coupling~~ | ❌ Invalid |

### Medium Priority Issues

| ID | Issue | Impact | Status |
|----|-------|--------|--------|
| MED-001 | Timestamp format inconsistent | Client parsing issues | ✅ Fixed |
| MED-002 | List pagination limits vary | Inconsistent UX | ✅ Fixed |
| MED-003 | Code duplication in repositories | Maintenance burden | ⬜ Open (low priority) |
| MED-004 | Many CLI commands are stubs | Confusing DX | ⬜ Open |
| MED-005 | HTTP code in kernel (should be in gateway) | Layer violation | ✅ Fixed |
| MED-007 | Toast-only errors (auto-dismiss) | Users miss error messages | ✅ Fixed |
| MED-008 | No error retry mechanism | Users must refresh page | ✅ Fixed |
| MED-009 | No request ID propagation | Can't trace frontend→backend | ✅ Fixed |
| MED-010 | Error responses not typed in contracts | No type safety for errors | ✅ Fixed |
| ~~MED-006~~ | ~~Webhooks has 7 dependencies (over-coupled)~~ | ~~Cascade risk~~ | ❌ Invalid |

---

## Removed Issues (Archive)

Issues that were identified but later validated as **correct design decisions** after deep analysis.

<details>
<summary><strong>Platform Layer Business Logic (Invalid)</strong></summary>

**Original claim:** 600+ lines of business logic should move to @unisane/metering package.

**Analysis result:** These files are **correctly placed** in platform layer:
- `policy.ts` (205 lines) - Tightly coupled to app-specific plan definitions (`PLAN_DEFS`, `ENTITLEMENTS` constants)
- `guard.ts` (175 lines) - Depends on policy.ts which is app-specific
- `registry.ts` (356 lines) - Composition/wiring code, not reusable logic

**Why they belong in platform:**
- Platform layer IS for app-specific code (Extensions, Adapters, Integrations, Core)
- These files orchestrate app-specific services with app-specific configuration
- Extracting would require parameterizing entire plan/entitlements system
- Each starter should have its own metering policy based on its plans

</details>

<details>
<summary><strong>Billing as Infrastructure (Invalid)</strong></summary>

**Original claim:** ai, pdf, webhooks use billing as infrastructure, creating unexpected coupling.

**Analysis result:** Claim was **misleading**:

| Module | Actual Usage | Type |
|--------|--------------|------|
| @unisane/ai | `assertActiveSubscriptionForCredits()` | Subscription gate (auth check) |
| @unisane/pdf | `assertActiveSubscriptionForCredits()` | Subscription gate (auth check) |
| @unisane/webhooks | `paymentsRepo`, `subscriptionsRepo`, `invoicesRepo` | **TRUE infrastructure** |

**Why this is acceptable:**
- AI/PDF only call a subscription verification function (auth check, not infrastructure)
- Webhooks handling billing provider events (Stripe/Razorpay) MUST use billing repos
- Webhooks is the integration point between payment providers and billing system
- This coupling is **intentional and correct** - webhooks persist billing events

</details>

<details>
<summary><strong>Webhooks Over-Coupled (Invalid)</strong></summary>

**Original claim:** Webhooks has 7 dependencies, most of any module.

**Analysis result:** All dependencies are **necessary**:
- kernel, gateway - Foundation (required by all)
- billing - Persists payment/subscription data from provider webhooks (intentional)
- outbox - Reliable webhook delivery (core feature)
- audit - Audit logging (compliance)
- identity - Tenant context (required)
- settings - Feature flags (required)

**Why this is acceptable:** Webhooks is an integration module that bridges external providers with internal systems. High coupling is expected and correct.

</details>

---

## Documentation Corrections Needed

| Document | Issue | Fix Required |
|----------|-------|--------------|
| build-distribution.md | Claims build-starter.ts not implemented | Mark as ✅ Implemented |
| implementation-status.md | OpenAPI marked "Not Implemented" | Mark as ⚠️ Partial (endpoint works, CLI stub) |
| contracts-guide.md | Shows wrong contract location | Clarify contracts live in starters |
| implementation-status.md | Missing tenant pages (templates) | Add to list |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-09 | Focus on features before distribution | Need complete features to distribute |
| 2026-01-09 | Plan OSS/PRO split, implement later | Not needed until distribution |
| 2026-01-09 | Move admin grid gen to devtools | Consolidate SDK generation |
| 2026-01-09 | Skip testing improvements for now | Feature completion priority |
| 2026-01-09 | Fix critical dependency issues first | Prevent runtime compatibility issues |
| 2026-01-09 | Standardize on Unix ms timestamps | Most common, avoids timezone issues |
| 2026-01-09 | Use `idem` for idempotency keys | Shorter, consistent with kernel |
| 2026-01-09 | Move HTTP code from kernel to gateway | Kernel should be transport-agnostic (validated: all consumers in gateway) |
| 2026-01-09 | ~~Create @unisane/metering package~~ | ❌ Rejected: Platform metering code is app-specific (plan defs, entitlements) |
| 2026-01-09 | ~~Remove billing dependency from ai/pdf/webhooks~~ | ❌ Rejected: ai/pdf use auth gate only; webhooks coupling is intentional |
| 2026-01-09 | Keep platform metering in platform | App-specific code belongs in platform layer, not packages |

---

## Metrics

### Code Quality

| Metric | Current | Target |
|--------|---------|--------|
| Packages with lint script | 30/30 | 30/30 ✅ |
| Package organization | 5 categories | 5 categories ✅ |
| Test coverage | ~5% | 80% |
| Generated code with @ts-nocheck | 5 files | 0 |
| Circular dependencies | 0 | 0 ✅ |
| Dependency version conflicts | 0 | 0 ✅ |
| Schema inconsistencies | 0 | 0 ✅ |

### Feature Completion

| Metric | Current | Target |
|--------|---------|--------|
| Admin pages implemented | 8/15 | 15/15 |
| Tenant pages implemented | 9/15 | 15/15 |
| Admin API routes | 8/15 | 15/15 |
| Backend modules | 18/18 | 18/18 ✅ |

### Architecture Health

| Metric | Current | Target |
|--------|---------|--------|
| Empty catch blocks | 0 | 0 ✅ |
| Console.log in production code | 0 | 0 ✅ |
| Duplicate schema definitions | 0 | 0 ✅ |
| Documentation accuracy | ~85% | 95% |
| HTTP code in kernel | 0 (moved to gateway) | 0 ✅ |
| ~~Business logic in platform layer~~ | N/A | N/A (correctly placed - app-specific) |
| ~~Billing as infrastructure~~ | N/A | N/A (ai/pdf use auth gate; webhooks coupling is correct) |

---

## Related Documents

- [Architecture README](../architecture/README.md) - Architecture documentation index
- [Handbook README](../README.md) - Full handbook index
- [QUICK-REFERENCE.md](../architecture/QUICK-REFERENCE.md) - Patterns cheat sheet
- [centralization-plan.md](./centralization-plan.md) - Architecture consolidation details
- [server-table-state.md](./server-table-state.md) - DataTable patterns (completed)

---

## Phase Completion Protocol

**IMPORTANT:** When completing any phase, you MUST update the documentation:

### Required Updates

| Document | Update Required |
|----------|-----------------|
| [implementation-status.md](../architecture/implementation-status.md) | Change status from **Planned** → **Implemented** |
| [MASTER-ROADMAP.md](./MASTER-ROADMAP.md) | Update Current State Summary table |
| [centralization-plan.md](./centralization-plan.md) | Check off completed tasks in checklists |
| Relevant architecture docs | Update any outdated references |

### Checklist for Phase Completion

```markdown
## Phase [X] Completion Checklist

- [ ] All tasks in phase completed
- [ ] Code changes tested and working
- [ ] implementation-status.md updated
- [ ] MASTER-ROADMAP.md "Current State Summary" updated
- [ ] Relevant roadmap checklists marked complete
- [ ] Architecture docs updated if patterns changed
- [ ] Decision log updated (if significant decisions made)
- [ ] Last Updated dates refreshed on modified docs
```

### Why This Matters

- Prevents documentation drift
- Keeps `implementation-status.md` as single source of truth
- Helps future developers understand what's done vs planned
- Makes onboarding easier
