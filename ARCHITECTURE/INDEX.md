# Architecture Documentation Index

> **For LLMs**: This is your navigation guide. Read this first to know which documents to load for any task.

---

## Quick Reference: Which Documents to Load

| Your Task | Load These Documents (in order) |
|-----------|--------------------------------|
| **New to the codebase** | `ONBOARDING.md` → `RULES.md` |
| **Fix a bug in a module** | `RULES.md` → `ISSUES/RESOLVED.md` (check if already fixed) |
| **Add a new module** | `RULES.md` → `PATTERNS.md` → `REFERENCE/MODULES.md` |
| **Add a new adapter** | `RULES.md` → `PATTERNS.md` → `REFERENCE/ADAPTERS.md` |
| **Add/modify a port** | `RULES.md` → `REFERENCE/PORTS.md` |
| **Add cross-module feature** | `RULES.md` → `PATTERNS.md` → `REFERENCE/PORTS.md` |
| **Work with events** | `RULES.md` → `REFERENCE/EVENTS.md` |
| **Review a PR** | `RULES.md` only (it's short) |
| **Understand architecture** | `ONBOARDING.md` → `RULES.md` → `PATTERNS.md` |

---

## Current State

| Metric | Current | Target |
|--------|---------|--------|
| **Current Phase** | Phase 6 (Documentation) | Phase 6 (Complete) |
| **Hexagonal Compliance** | 95% | 100% |
| **Critical Issues (P0)** | 0 | 0 |
| **High Priority Issues (P1)** | 0 | 0 |
| **Test Coverage** | ~20% | 70% |

### Completed Phases
- **Phase 0**: Kernel ports created (13 ports)
- **Phase 1**: P0 critical issues resolved (7 issues)
- **Phase 2**: Module decoupling complete
- **Phase 3**: Code quality improvements applied

---

## Document Map

```
ARCHITECTURE/
├── INDEX.md                    ← YOU ARE HERE (navigation)
├── ONBOARDING.md               ← NEW DEVELOPERS START HERE
├── RULES.md                    ← ALWAYS LOAD (hard rules, ~200 lines)
├── PATTERNS.md                 ← HOW to implement things
│
├── ISSUES/                     ← WHAT was broken (all resolved)
│   ├── P0-CRITICAL.md          ← Fix immediately (7 issues)
│   ├── P1-HIGH.md              ← Fix this sprint (12 issues)
│   ├── P2-MEDIUM.md            ← Fix next sprint
│   └── RESOLVED.md             ← Already fixed (reference)
│
├── ROADMAP/                    ← WHEN to fix things
│   ├── PHASE-0-PREREQUISITES.md  ← CURRENT PHASE
│   ├── PHASE-1-FOUNDATION.md
│   ├── PHASE-2-DECOUPLING.md
│   ├── PHASE-3-QUALITY.md
│   ├── PHASE-4-OBSERVABILITY.md
│   ├── PHASE-5-TESTING.md
│   └── PHASE-6-DOCUMENTATION.md
│
└── REFERENCE/                  ← LOOKUP tables
    ├── PORTS.md                ← All port definitions
    ├── EVENTS.md               ← Event ownership model
    ├── ADAPTERS.md             ← Adapter inventory & status
    └── MODULES.md              ← Module inventory & status
```

---

## Document Descriptions

### Core Documents

| Document | Size | Purpose | When to Load |
|----------|------|---------|--------------|
| **ONBOARDING.md** | ~300 lines | Quick start for new developers | First time working in codebase |
| **RULES.md** | ~200 lines | Hard rules that MUST be followed | ALWAYS - load for every task |
| **PATTERNS.md** | ~600 lines | Implementation patterns with code | When implementing new things |

### Issues (All Resolved)

| Document | Contents | When to Load |
|----------|----------|--------------|
| **P0-CRITICAL.md** | 7 critical issues (all resolved) | Reference only |
| **P1-HIGH.md** | 12 high priority issues (all resolved) | Reference only |
| **P2-MEDIUM.md** | Medium priority improvements | When doing cleanup work |
| **RESOLVED.md** | 32 fixed issues with solutions | When checking how an issue was fixed |

### Roadmap (When to Fix)

| Document | Phase | Status | Dependencies |
|----------|-------|--------|--------------|
| **PHASE-0-PREREQUISITES.md** | Create kernel ports | Complete | None |
| **PHASE-1-FOUNDATION.md** | Fix foundation issues | Complete | Phase 0 |
| **PHASE-2-DECOUPLING.md** | Fix module coupling | Complete | Phase 0, 1 |
| **PHASE-3-QUALITY.md** | Code quality | Complete | Phase 2 |
| **PHASE-4-OBSERVABILITY.md** | Logging & metrics | Skipped | Phase 3 |
| **PHASE-5-TESTING.md** | Test coverage | Skipped | Phase 4 |
| **PHASE-6-DOCUMENTATION.md** | Final docs | **CURRENT** | Phase 5 |

### Reference (Lookup Tables)

| Document | Contents | When to Load |
|----------|----------|--------------|
| **PORTS.md** | All 13 kernel ports with definitions | When working with ports |
| **EVENTS.md** | Event ownership, schemas, registration | When working with events |
| **ADAPTERS.md** | 12 adapters, status, resilience | When working with adapters |
| **MODULES.md** | 15 modules, dependencies, issues | When working with modules |

---

## LLM Instructions

### Before Starting Any Task

1. **Always load `RULES.md`** - it's short and contains hard rules
2. Check if the task relates to a known issue in `ISSUES/`
3. Load relevant `REFERENCE/` docs based on what you're touching

### When Fixing a Bug

```
1. Load RULES.md
2. Search ISSUES/ for the bug (may already be documented)
3. Load relevant REFERENCE/ doc for the component
4. Fix following patterns in PATTERNS.md
5. Verify fix doesn't violate RULES.md
```

### When Adding New Code

```
1. Load RULES.md
2. Load PATTERNS.md
3. Load relevant REFERENCE/ doc
4. Follow the pattern exactly
5. Verify against RULES.md before committing
```

### When Reviewing Code

```
1. Load RULES.md only
2. Check all changes against rules
3. Flag any violations
```

---

## Cross-References

- **Original audit document**: `../ARCHITECTURE-AUDIT-FINDINGS.md` (comprehensive but long)
- **Distribution model**: `../DISTRIBUTION-ARCHITECTURE.md`
- **This index**: Keep this as your starting point

---

> **Last Updated**: 2025-01-15 | **Version**: 2.0
