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
| **Monorepo Structure** | 30 packages in `@unisane/*` | Good |
| **Foundation** | kernel + gateway | Good |
| **Feature Packages** | 18 modules + 3 PRO | Good |
| **UI Library** | @unisane/ui + data-table | Good |
| **SDK Generation** | @unisane/devtools | Good |
| **Platform Layer** | Hexagonal architecture | Good |
| **Distribution** | Design only, not built | Blocked |
| **Contract Registry** | Fragmented | Needs Work |
| **Schema Organization** | 5 levels, duplication risk | Needs Work |
| **Admin Configs** | Hardcoded in gateway | Needs Work |
| **Testing** | Minimal (data-table only) | Needs Work |

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

### Phase 1: Foundation Consolidation (Current)

**Goal:** Fix fragmentation, improve consistency.

| Task | Priority | Document |
|------|----------|----------|
| Standardize lint scripts across packages | High | [centralization-plan.md](./centralization-plan.md) |
| Fix vitest version drift | High | [centralization-plan.md](./centralization-plan.md) |
| Update SDK generator for page persistence | High | [server-table-state.md](./server-table-state.md) |
| Improve SDK naming conventions | Medium | [server-table-state.md](./server-table-state.md) |
| Remove @ts-nocheck from generated code | Medium | [server-table-state.md](./server-table-state.md) |

### Phase 2: Package Structure Reorganization

**Goal:** Multi-platform architecture with categorized package folders.

| Task | Priority | Document |
|------|----------|----------|
| Create foundation/ folder (kernel, gateway, contracts) | High | [centralization-plan.md](./centralization-plan.md) |
| Create modules/ folder (18 shared modules) | High | [centralization-plan.md](./centralization-plan.md) |
| Create pro/ folder (analytics, sso, import-export) | High | [centralization-plan.md](./centralization-plan.md) |
| Create ui/ folder (ui, data-table, tokens, cli) | High | [centralization-plan.md](./centralization-plan.md) |
| Create tooling/ folder (devtools, configs, test-utils) | High | [centralization-plan.md](./centralization-plan.md) |
| Update pnpm-workspace.yaml | High | [centralization-plan.md](./centralization-plan.md) |
| Update all import paths | High | [centralization-plan.md](./centralization-plan.md) |
| Verify turbo caching works | Medium | [centralization-plan.md](./centralization-plan.md) |

**Benefits:**
- Clear separation for multi-platform development
- Future platform folders (crm/, ecommerce/, etc.)
- Better developer navigation

### Phase 3: Schema & Contract Centralization

**Goal:** Single source of truth for schemas and contracts.

| Task | Priority | Document |
|------|----------|----------|
| Establish schema hierarchy rules | High | [centralization-plan.md](./centralization-plan.md) |
| Move contracts closer to packages | Medium | [centralization-plan.md](./centralization-plan.md) |
| Admin config self-registration | Medium | [centralization-plan.md](./centralization-plan.md) |
| Field registry consolidation | Medium | [centralization-plan.md](./centralization-plan.md) |

### Phase 4: Feature Completion

**Goal:** Complete all planned features for saaskit.

| Task | Priority | Document |
|------|----------|----------|
| Server table state pattern | High | [server-table-state.md](./server-table-state.md) |
| Complete admin panels | High | - |
| Complete tenant features | High | - |
| Analytics implementation | Medium | - |
| Import/export features | Medium | - |

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
| Packages with lint script | 2/30 | 30/30 |
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
