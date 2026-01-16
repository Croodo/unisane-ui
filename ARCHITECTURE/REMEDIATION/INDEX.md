# Remediation Plan Index

> **For LLMs**: This is the master tracking document for the January 2025 audit remediation. Follow phases in order.

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Audit Date** | January 2025 |
| **Total Issues** | 67 |
| **Estimated Duration** | 9 weeks |
| **Team Size** | 2-3 engineers |

---

## Progress Tracker

| Phase | Focus | Issues | Status | Est. Hours |
|-------|-------|--------|--------|------------|
| **[Phase 0](./PHASE-0-SECURITY.md)** | Security Emergency | 7 | 🟡 In Progress (5/7) | 44h |
| **[Phase 1](./PHASE-1-BUGS.md)** | Critical Bugs | 9 | ✅ Complete (9/9) | 30h |
| **[Phase 2](./PHASE-2-RELIABILITY.md)** | Reliability | 7 | ✅ Complete (7/7) | 50h |
| **[Phase 3](./PHASE-3-TYPESAFETY.md)** | Type Safety | 5 | 🟡 In Progress (4/5) | 38h |
| **[Phase 4](./PHASE-4-OBSERVABILITY.md)** | Observability | 5 | 🟡 In Progress (4/5) | 52h |
| **[Phase 5](./PHASE-5-COMPLETENESS.md)** | Completeness | 8 | ✅ Complete (8/8) | 72h |
| **[Phase 6](./PHASE-6-POLISH.md)** | Polish & Docs | 9 | ✅ Complete (8/9) | 72h |

**Total**: ~358 hours (~9 weeks at 40h/week)

---

## Issue Summary by Severity

### P0 - Critical (8 issues)

| ID | Issue | Phase | Status |
|----|-------|-------|--------|
| P0-SEC-001 | Secrets committed in .env.local | 0 | ⬜ |
| P0-SEC-002 | API key revocation cache lag | 0 | ✅ |
| P0-SEC-003 | Path traversal in S3 CopySource | 0 | ✅ |
| P0-SEC-004 | Path traversal in local storage | 0 | ✅ |
| P0-SEC-005 | CSRF not validated on signout | 0 | ✅ |
| P0-SEC-006 | CSP allows unsafe-inline | 0 | ✅ |
| P0-BUG-001 | Credits consume idempotency bug | 1 | ✅ |
| P0-BUG-002 | Razorpay payment mode broken | 1 | ✅ |

### P1 - High (19 issues)

| ID | Issue | Phase | Status |
|----|-------|-------|--------|
| P1-SEC-001 | Missing PII encryption | 0 | ⬜ |
| P1-SEC-002 | Permission cache silent failure | 1 | ✅ |
| P1-REL-001 | No request timeout protection | 2 | ✅ |
| P1-REL-002 | 49 console.log in production | 2 | ✅ |
| P1-REL-003 | Memory leaks in timers | 2 | ✅ |
| P1-REL-004 | Missing rate limits on expensive ops | 2 | ✅ |
| P1-REL-005 | Devtools build failures ignored | 1 | ✅ |
| P1-VAL-001 | No Zod validation in Razorpay | 1 | ✅ |
| P1-VAL-002 | No Zod validation in GCS | 1 | ✅ |
| P1-VAL-003 | No Zod validation in local storage | 1 | ✅ |
| P1-VAL-004 | No env validation in bootstrap | 2 | ✅ |
| P1-BUG-001 | Stripe error swallowing | 1 | ✅ |
| P1-BUG-002 | Dynamic require in outbox | 3 | ✅ |
| P1-BUG-003 | Usage increment allows negative | 1 | ✅ |
| P1-BUG-004 | Leaky Promise.race in Resend | 2 | ✅ |
| P1-BUG-005 | Import regex too simplistic | 3 | ✅ |
| P1-TYPE-001 | Type assertions (as unknown) | 3 | ⬜ |
| P1-RACE-001 | Membership seat limit race | 3 | ✅ |
| P1-MISS-001 | Missing storage quota check | 2 | ✅ |

### P2 - Medium (24 issues)

See full list in [AUDIT-2025-01-FINDINGS.md](../AUDIT-2025-01-FINDINGS.md#p2---medium-priority-fix-within-sprint-2-3)

### P3 - Low (16 issues)

See full list in [AUDIT-2025-01-FINDINGS.md](../AUDIT-2025-01-FINDINGS.md#p3---low-priority-nice-to-have)

---

## Phase Dependencies

```
Phase 0 (Security)
    │
    ▼
Phase 1 (Bugs)
    │
    ▼
Phase 2 (Reliability)
    │
    ▼
Phase 3 (Type Safety)
    │
    ▼
Phase 4 (Observability)
    │
    ▼
Phase 5 (Completeness)
    │
    ▼
Phase 6 (Polish)
```

**Rules:**
- Complete phases in order
- Do not start Phase N+1 until Phase N is 100% complete
- Exception: Phase 4-6 can be parallelized if team size allows

---

## Weekly Schedule (Suggested)

| Week | Phase | Focus | Deliverables |
|------|-------|-------|--------------|
| 1 | Phase 0 | Security | All secrets rotated, vulnerabilities patched |
| 2 | Phase 1 | Bugs | All critical bugs fixed |
| 3-4 | Phase 2 | Reliability | Timeouts, logging, rate limits |
| 5 | Phase 3 | Types | Type safety improvements |
| 6 | Phase 4 | Observability | Logging, metrics, tracing |
| 7-8 | Phase 5 | Completeness | Missing features |
| 9 | Phase 6 | Polish | Documentation, cleanup |

---

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Secret rotation causes outage | Keep old secrets valid 24h overlap |
| PII migration corrupts data | Full backup before migration, test on staging |
| Rate limiting blocks users | Start with high limits, monitor and adjust |
| CSP breaks pages | Deploy report-only first, then enforce |

---

## Verification Checklist

After each phase, verify:

```bash
# All tests pass
npm run test

# No type errors
npm run typecheck

# No lint errors
npm run lint

# Build succeeds
npm run build

# E2E tests pass (if applicable)
npm run test:e2e
```

---

## Sign-off Requirements

Each phase requires sign-off from:
- [ ] Engineering Lead
- [ ] Security Team (for Phase 0)
- [ ] QA (after Phase 5)

---

## Documents

| Document | Purpose |
|----------|---------|
| [AUDIT-2025-01-FINDINGS.md](../AUDIT-2025-01-FINDINGS.md) | Full audit findings |
| [PHASE-0-SECURITY.md](./PHASE-0-SECURITY.md) | Security emergency tasks |
| [PHASE-1-BUGS.md](./PHASE-1-BUGS.md) | Critical bug fixes |
| [PHASE-2-RELIABILITY.md](./PHASE-2-RELIABILITY.md) | Reliability improvements |
| [PHASE-3-TYPESAFETY.md](./PHASE-3-TYPESAFETY.md) | Type safety fixes |
| [PHASE-4-OBSERVABILITY.md](./PHASE-4-OBSERVABILITY.md) | Logging, metrics, tracing |
| [PHASE-5-COMPLETENESS.md](./PHASE-5-COMPLETENESS.md) | Missing features |
| [PHASE-6-POLISH.md](./PHASE-6-POLISH.md) | Documentation & cleanup |

---

## Quick Commands

```bash
# View current phase status
cat ARCHITECTURE/REMEDIATION/INDEX.md | grep "Status"

# Run all tests
npm run test

# Check for console.log usage
grep -r "console\." packages/ --include="*.ts" | wc -l

# Check type assertions
grep -r "as unknown\|as any" packages/ --include="*.ts" | wc -l

# Verify no secrets in repo
git log -p --all -S 'BEGIN PRIVATE KEY' --source --all
```

---

> **Last Updated**: 2025-01-16
