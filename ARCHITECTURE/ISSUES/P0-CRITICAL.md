# P0 Critical Issues

> **For LLMs**: All P0 Critical issues have been resolved. See `RESOLVED.md` for details on fixes applied.

---

## Summary

| ID | Issue | Layer | Status |
|----|-------|-------|--------|
| K-001 | Silent cache fallback masks failures | Kernel | **Resolved** |
| BR-001 | Razorpay portal throws (contract violation) | Adapters | **Resolved** |
| BR-002 | Razorpay updatePlan throws (contract violation) | Adapters | **Resolved** |
| SG-002 | SSO Gateway throws on tenant miss | Gateway | **Resolved** |
| C-001 | Contract date mismatch | Contracts | **Resolved** |
| M-001 | Direct inter-module imports | Modules | **Resolved** |
| DT-001 | Codegen assumes built contracts | DevTools | **Resolved** |

---

## All Issues Resolved

All 7 P0 Critical issues were resolved in **Phase 1**. See [RESOLVED.md](./RESOLVED.md) for:
- Original problem descriptions
- Solutions implemented
- Verification status

### Quick Reference

| ID | Resolution Summary |
|----|-------------------|
| K-001 | Cache errors now propagate with `CacheError` class |
| BR-001 | Returns fallback URL instead of throwing |
| BR-002 | Added `updateSubscriptionPlan` and `updateSubscriptionQuantity` methods |
| SG-002 | Returns gracefully with null tenant |
| C-001 | Added `ZISODateString` schema for consistent date handling |
| M-001 | Created `scripts/check-module-imports.mjs` enforcement script |
| DT-001 | Added auto-build logic to detect stale contracts |

---

> **Last Updated**: 2025-01-15
