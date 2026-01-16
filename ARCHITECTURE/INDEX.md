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
| **Implement cascade delete** | `REFERENCE/EVENT-CASCADES.md` → `REFERENCE/EVENTS.md` |
| **Review a PR** | `RULES.md` only (it's short) |
| **Understand architecture** | `ONBOARDING.md` → `RULES.md` → `PATTERNS.md` |
| **Database switching/migration** | `REFERENCE/DATABASE-PORTABILITY.md` |
| **Work with repositories** | `PATTERNS.md` → `REFERENCE/DATABASE-PORTABILITY.md` |
| **Production readiness audit** | `AUDIT-2025-01-FINDINGS.md` → `REMEDIATION/` |
| **Security fixes** | `AUDIT-2025-01-FINDINGS.md` → `REMEDIATION/PHASE-0-SECURITY.md` |

---

## Current State

| Metric | Current | Target |
|--------|---------|--------|
| **Current Phase** | Remediation Phase 6 (Polish) | Production Ready |
| **Hexagonal Compliance** | 100% | 100% |
| **Critical Issues (P0)** | 2 remaining | 0 |
| **High Priority Issues (P1)** | 1 remaining | 0 |
| **Medium Issues (P2)** | 0 | <10 |
| **Test Coverage** | ~20% | 70% |

### January 2025 Audit Status
- **Full audit completed**: 5 layers, ~80,000 LOC analyzed
- **67 issues identified**: 8 P0, 19 P1, 24 P2, 16 P3
- **Remediation progress**: Phases 1-6 substantially complete
- **See**: `REMEDIATION/INDEX.md` for current progress

### Remediation Progress
- ✅ **Phase 0**: Security emergency (5/7 - 2 deferred: secrets rotation, PII encryption)
- ✅ **Phase 1**: Critical bugs (9/9 complete)
- ✅ **Phase 2**: Reliability (7/7 complete)
- 🟡 **Phase 3**: Type safety (4/5 - 1 remaining: type assertions cleanup)
- 🟡 **Phase 4**: Observability (4/5 - 1 remaining)
- ✅ **Phase 5**: Completeness (8/8 complete)
- ✅ **Phase 6**: Polish & docs (8/9 - test coverage deferred)

---

## Document Map

```
ARCHITECTURE/
├── INDEX.md                    ← YOU ARE HERE (navigation)
├── ONBOARDING.md               ← NEW DEVELOPERS START HERE
├── RULES.md                    ← ALWAYS LOAD (hard rules, ~200 lines)
├── PATTERNS.md                 ← HOW to implement things
├── AUDIT-2025-01-FINDINGS.md   ← JANUARY 2025 FULL AUDIT (67 issues)
│
├── REMEDIATION/                ← CURRENT WORK (fixing audit issues)
│   ├── INDEX.md                ← Master tracking & progress
│   ├── PHASE-0-SECURITY.md     ← 🔴 Security emergency (Week 1)
│   ├── PHASE-1-BUGS.md         ← Critical bugs (Week 2)
│   ├── PHASE-2-RELIABILITY.md  ← Reliability (Week 3-4)
│   ├── PHASE-3-TYPESAFETY.md   ← Type safety (Week 5)
│   ├── PHASE-4-OBSERVABILITY.md← Observability (Week 6)
│   ├── PHASE-5-COMPLETENESS.md ← Completeness (Week 7-8)
│   └── PHASE-6-POLISH.md       ← Polish & docs (Week 9)
│
├── ISSUES/                     ← HISTORICAL ISSUES (previous audit)
│   ├── P0-CRITICAL.md          ← Fix immediately (7 issues) - RESOLVED
│   ├── P1-HIGH.md              ← Fix this sprint (12 issues) - RESOLVED
│   ├── P2-MEDIUM.md            ← Fix next sprint
│   └── RESOLVED.md             ← Already fixed (reference)
│
├── ROADMAP/                    ← HISTORICAL ROADMAP (architecture phases)
│   ├── PHASE-0-PREREQUISITES.md  ← Complete
│   ├── PHASE-1-FOUNDATION.md     ← Complete
│   ├── PHASE-2-DECOUPLING.md     ← Complete
│   ├── PHASE-3-QUALITY.md        ← Complete
│   ├── PHASE-4-OBSERVABILITY.md  ← Skipped (new plan)
│   ├── PHASE-5-TESTING.md        ← Skipped (new plan)
│   └── PHASE-6-DOCUMENTATION.md  ← Skipped (new plan)
│
└── REFERENCE/                  ← LOOKUP tables
    ├── PORTS.md                ← All port definitions
    ├── EVENTS.md               ← Event ownership model
    ├── EVENT-CASCADES.md       ← Event-driven cascade patterns
    ├── ADAPTERS.md             ← Adapter inventory & status
    ├── MODULES.md              ← Module inventory & status
    └── DATABASE-PORTABILITY.md ← Database switching analysis
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
| **EVENT-CASCADES.md** | Event-driven cascade patterns, implementation | When implementing cascade deletes |
| **ADAPTERS.md** | 12 adapters, status, resilience | When working with adapters |
| **MODULES.md** | 15 modules, dependencies, issues | When working with modules |
| **DATABASE-PORTABILITY.md** | DB switching blockers, migration strategy | When discussing database changes |

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

> **Last Updated**: 2025-01-16 | **Version**: 2.1
