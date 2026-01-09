# Unisane Platform Master Roadmap

> **Status:** Active
> **Created:** 2026-01-09
> **Last Updated:** 2026-01-09
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
| **UI Library** | @unisane/ui + data-table | Good |
| **SDK Generation** | @unisane/devtools | Good |
| **Platform Layer** | Hexagonal architecture | Good |
| **Linting** | All packages have lint scripts | Good |
| **Testing** | vitest ^4.0.16, shared base config | Good |
| **Distribution** | Design only, not built | Blocked |
| **Contract Registry** | Fragmented | Needs Work |
| **Schema Organization** | 5 levels, duplication risk | Needs Work |
| **Admin Configs** | Hardcoded in gateway | Needs Work |

See [implementation-status.md](../architecture/implementation-status.md) for detailed status.

---

## Strategic Goals

### Goal 1: Complete Feature Development
Build all planned features before focusing on distribution.

### Goal 2: Centralize Architecture
Reduce fragmentation, establish single sources of truth.

### Goal 3: Improve Developer Experience
Better tooling, documentation, error messages.

### Goal 4: Enable Distribution
Build tools to ship starters to end users.

---

## Roadmap Phases

### Phase 1: Foundation Consolidation (COMPLETED ✅)

**Goal:** Fix fragmentation, improve consistency.

| Task | Priority | Status |
|------|----------|--------|
| Standardize lint scripts across packages | High | ✅ Done |
| Add eslint to all packages | High | ✅ Done |
| Create root eslint.config.mjs | High | ✅ Done |
| Fix vitest version drift | High | ✅ Done (^4.0.16) |
| Create shared vitest.base.ts | High | ✅ Done |
| Standardize pino-pretty version | High | ✅ Done (^13.0.0) |
| Update SDK generator for page persistence | High | Pending (Phase 4) |
| Improve SDK naming conventions | Medium | Pending (Phase 4) |
| Remove @ts-nocheck from generated code | Medium | Pending (Phase 4) |

### Phase 2: Package Structure Reorganization (COMPLETED ✅)

**Goal:** Multi-platform architecture with categorized package folders.

| Task | Priority | Status |
|------|----------|--------|
| Create foundation/ folder (kernel, gateway, contracts) | High | ✅ Done |
| Create modules/ folder (15 shared modules) | High | ✅ Done |
| Create pro/ folder (analytics, sso, import-export) | High | ✅ Done |
| Create ui/ folder (core, data-table, tokens, cli) | High | ✅ Done |
| Create tooling/ folder (devtools, configs, test-utils) | High | ✅ Done |
| Update pnpm-workspace.yaml | High | ✅ Done |
| Update all tsconfig.json paths | High | ✅ Done |
| Verify pnpm install works | High | ✅ Done |
| Verify turbo build works | High | ✅ Done (31/32 packages) |

**Result:**
```
packages/
├── foundation/   # kernel, gateway, contracts
├── modules/      # 15 business modules
├── pro/          # analytics, sso, import-export
├── ui/           # core, data-table, tokens, cli
└── tooling/      # devtools, test-utils, configs
```

### Phase 3: Schema & Contract Centralization (COMPLETED ✅)

**Goal:** Single source of truth for schemas and contracts.

| Task | Priority | Status |
|------|----------|--------|
| Audit contract files for inline schemas | High | ✅ Done (22 files) |
| Establish schema hierarchy rules | High | ✅ Done (contracts-guide.md) |
| Document schema rules | High | ✅ Done |

**Result:** Audited all 22 contract files. Found 0 domain schema duplications. All inline schemas are intentionally contract-specific (response DTOs, request bodies, admin queries). Schema rules documented in [contracts-guide.md](../architecture/contracts-guide.md#schema-rules).

**Note:** Admin config self-registration and field registry consolidation moved to Phase 4 (feature completion) as they require more implementation work.

### Phase 4: Feature Completion (IN PROGRESS)

**Goal:** Complete all planned features for saaskit.

#### 4.1 Completed Tasks

| Task | Priority | Status |
|------|----------|--------|
| Server table state pattern (Phase 0-5) | High | ✅ Done |
| useServerTable hook | High | ✅ Done |
| SDK page persistence | High | ✅ Done |
| Apply patterns to other admin pages | Medium | ✅ Analyzed (no changes needed) |
| Apply patterns to tenant pages | Medium | ✅ Analyzed (no changes needed) |

**Server Table State Completed (Phase 0-5):**
- `useServerTable` hook at `starters/saaskit/src/hooks/useServerTable.ts`
- SDK hooks with page persistence in `gen-admin-hooks.ts`
- UsersClient (server-first) and TenantsClient (client-first) patterns working

See [server-table-state.md](./server-table-state.md) for full details.

---

#### 4.2 Feature Gap Analysis (2026-01-09)

**Admin Pages:** 13 exist, 8 modules missing UI
**Tenant Pages:** 9 exist, 9 modules missing UI

---

#### 4.3 Admin Panel Tasks (Priority Order)

| Task | Priority | Backend | Notes |
|------|----------|---------|-------|
| Admin credits dashboard | High | ✅ @unisane/credits | View credit consumption across tenants |
| Admin usage dashboard | High | ✅ @unisane/usage | Monitor quotas and rate limits |
| Admin import/export management | Medium | ✅ @unisane/import-export | View/manage import/export jobs |
| Admin notify management | Medium | ✅ @unisane/notify | Email campaigns, notification logs |
| Admin storage dashboard | Low | ✅ @unisane/storage | Storage quota monitoring |
| Admin media library | Low | ✅ @unisane/media | Asset management |
| Admin PDF templates | Low | ✅ @unisane/pdf | Template management |

**Already Implemented Admin:**
- `/admin/overview` - Analytics dashboard ✅
- `/admin/tenants` - Tenant management ✅
- `/admin/users` - User management ✅
- `/admin/audit` - Audit logs ✅
- `/admin/flags` - Feature flags ✅
- `/admin/settings` - Global settings ✅
- `/admin/health` - System health ✅
- `/admin/outbox` - Dead letter queue ✅

---

#### 4.4 Tenant Feature Tasks (Priority Order)

| Task | Priority | Backend | Notes |
|------|----------|---------|-------|
| Tenant usage dashboard | High | ✅ @unisane/usage | View usage vs quotas |
| Tenant import/export UI | High | ✅ @unisane/import-export | Export/import workspace data |
| Tenant notify preferences | Medium | ✅ @unisane/notify | Notification settings |
| Tenant storage management | Low | ✅ @unisane/storage | File management |
| Tenant media library | Low | ✅ @unisane/media | Asset uploads |
| Tenant AI settings | Low | ✅ @unisane/ai | AI feature controls |

**Already Implemented Tenant:**
- `/w/[slug]/dashboard` - Workspace overview ✅
- `/w/[slug]/settings` - Workspace settings ✅
- `/w/[slug]/billing` - Billing & credits ✅
- `/w/[slug]/team` - Team management ✅
- `/w/[slug]/account` - Account settings ✅
- `/w/[slug]/apikeys` - API keys ✅
- `/w/[slug]/webhooks` - Webhooks ✅
- `/w/[slug]/audit` - Audit logs ✅

---

#### 4.5 Analytics Enhancement

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Admin analytics dashboard | High | ✅ Done | `/admin/overview` with revenue, users, churn |
| Tenant analytics page | Medium | Pending | Per-workspace analytics |
| Custom date range queries | Low | Pending | Currently fixed 30-day windows |
| Event-based analytics | Low | Pending | Constants exist, not implemented |

---

#### 4.6 Import/Export Implementation

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Backend services | High | ✅ Done | Full service/repo/domain layer |
| REST API routes | High | ✅ Done | 3 tenant endpoints |
| SDK hooks | High | ✅ Done | Auto-generated React Query hooks |
| Admin import/export UI | Medium | Pending | Job management, history viewer |
| Tenant import/export UI | Medium | Pending | File upload, format selection |

---

#### 4.7 Recommended Implementation Order

**Phase 4a - High Value, Low Effort:**
1. Tenant usage dashboard (usage data already exists)
2. Admin credits dashboard (credit data already exists)
3. Tenant import/export UI (backend ready, just needs UI)

**Phase 4b - Medium Value:**
4. Admin import/export management
5. Tenant notify preferences
6. Tenant analytics page

**Phase 4c - Nice-to-Have:**
7. Admin storage dashboard
8. Tenant media library
9. Admin notify management
10. Admin PDF templates

### Phase 5: Testing & Quality

**Goal:** Comprehensive test coverage.

| Task | Priority | Document |
|------|----------|----------|
| Add tests to all packages | High | [testing.md](../architecture/testing.md) |
| E2E tests for critical flows | High | - |
| Performance benchmarks | Medium | - |
| Bundle size monitoring | Medium | - |

### Phase 6: Distribution

**Goal:** Ship starters to end users.

| Task | Priority | Document |
|------|----------|----------|
| Build tools/release/ infrastructure | High | [build-distribution.md](../architecture/build-distribution.md) |
| Implement import transformation | High | [build-distribution.md](../architecture/build-distribution.md) |
| OSS/PRO code stripping | Medium | [build-distribution.md](../architecture/build-distribution.md) |
| create-unisane-app CLI | Medium | - |

### Phase 7: Documentation & Polish

**Goal:** Production-ready documentation.

| Task | Priority | Document |
|------|----------|----------|
| Complete API documentation | High | - |
| Migration guides | High | - |
| Video tutorials | Medium | - |
| Example projects | Medium | - |

---

## Detailed Roadmaps

| Roadmap | Focus | Status |
|---------|-------|--------|
| [centralization-plan.md](./centralization-plan.md) | Architecture consolidation | Active |
| [server-table-state.md](./server-table-state.md) | DataTable patterns | Active |

---

## Document Index

### Architecture (How things work)

| Document | Description | When to Read |
|----------|-------------|--------------|
| [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) | Complete platform spec | Understanding the system |
| [implementation-status.md](../architecture/implementation-status.md) | What's built vs planned | Quick status check |
| [platform-layer.md](../architecture/platform-layer.md) | Hexagonal architecture | Understanding starters |
| [sdk-architecture.md](../architecture/sdk-architecture.md) | SDK generation | Working with SDK |
| [build-distribution.md](../architecture/build-distribution.md) | Distribution design | Shipping starters |
| [kernel.md](../architecture/kernel.md) | Core utilities | Working with kernel |
| [contracts-guide.md](../architecture/contracts-guide.md) | API contracts | Creating APIs |

### Roadmaps (What to build)

| Document | Description | When to Read |
|----------|-------------|--------------|
| [MASTER-ROADMAP.md](./MASTER-ROADMAP.md) | This document | Overall direction |
| [centralization-plan.md](./centralization-plan.md) | Architecture fixes | Consolidation work |
| [server-table-state.md](./server-table-state.md) | DataTable patterns | Table implementation |

### Guides (How to do things)

| Document | Description | When to Read |
|----------|-------------|--------------|
| [module-development.md](../architecture/module-development.md) | Creating modules | Building features |
| [testing.md](../architecture/testing.md) | Test patterns | Writing tests |
| [troubleshooting.md](../architecture/troubleshooting.md) | Common issues | Debugging |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-09 | Focus on features before distribution | Need complete features to distribute |
| 2026-01-09 | Plan OSS/PRO split, implement later | Not needed until distribution |
| 2026-01-09 | Move admin grid gen to devtools | Consolidate SDK generation |
| 2026-01-09 | Skip testing improvements for now | Feature completion priority |

---

## Metrics

### Code Quality

| Metric | Current | Target |
|--------|---------|--------|
| Packages with lint script | 30/30 | 30/30 ✅ |
| Package organization | 5 categories | 5 categories ✅ |
| Test coverage | ~5% | 80% |
| Generated code with @ts-nocheck | Many | 0 |
| Circular dependencies | 0 | 0 |

### Architecture Health

| Metric | Current | Target |
|--------|---------|--------|
| Schema duplication levels | 5 | 3 |
| Hardcoded admin configs | 2 | 0 (self-register) |
| Manual route handlers | 0 | 0 |
| Documentation coverage | 60% | 95% |

---

## Related Documents

- [Architecture README](../architecture/README.md) - Architecture documentation index
- [Handbook README](../README.md) - Full handbook index
- [QUICK-REFERENCE.md](../architecture/QUICK-REFERENCE.md) - Patterns cheat sheet

---

**Next Steps:**
1. Review [centralization-plan.md](./centralization-plan.md) for immediate tasks
2. Review [server-table-state.md](./server-table-state.md) for DataTable work
3. Check [implementation-status.md](../architecture/implementation-status.md) before starting any work

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
