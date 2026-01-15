# Resolved Issues

> **For LLMs**: Reference for previously fixed issues. Check here before investigating if an issue was already addressed.

---

## Summary

| ID | Issue | Resolved | Phase |
|----|-------|----------|-------|
| K-001 | Silent Cache Fallback | 2025-01-15 | Phase 1 |
| BR-001 | Razorpay Portal Throws | 2025-01-15 | Phase 1 |
| BR-002 | Subscription Quantity Throws | 2025-01-15 | Phase 1 |
| SG-002 | SSO Gateway Throws on Tenant Miss | 2025-01-15 | Phase 1 |
| C-001 | Contract Date Mismatch | 2025-01-15 | Phase 1 |
| M-001 | Direct Module Imports | 2025-01-15 | Phase 1 |
| DT-001 | Codegen Assumes Built Contracts | 2025-01-15 | Phase 1 |
| M-002 | Event Ownership Not Enforced | 2025-01-15 | Phase 2 |
| M-003 | Circular Dependencies | 2025-01-15 | Phase 2 |
| G-001 | Handler Code Duplication | 2025-01-15 | Phase 3 |
| G-002 | Dev Auth Headers Security | 2025-01-15 | Phase 3 |
| C-002 | Pagination Limits Inconsistent | 2025-01-15 | Phase 3 |
| ER-001 | Email Adapter Timeout | 2025-01-15 | Phase 3 |
| DM-001 | MongoDB Connection Race | 2025-01-15 | Phase 3 |
| SL-001 | Storage Local Resilience | 2025-01-15 | Phase 3 |
| DT-002 | Auto-build Contracts | 2025-01-15 | Phase 3 |
| DT-003 | Validate defineOpMeta | 2025-01-15 | Phase 3 |
| BS-001 | Silent Stripe Errors | 2025-01-15 | Phase 3 |
| ES-001 | Inconsistent Circuit Breaker Thresholds | 2025-01-15 | Phase 3 |

---

## Phase 0: Kernel Ports

All 13 kernel ports were created to enable hexagonal architecture.

| Port | Description | Location |
|------|-------------|----------|
| `AuthIdentityPort` | User identity operations | `kernel/ports/auth-identity.port.ts` |
| `SettingsPort` | Settings key-value operations | `kernel/ports/settings.port.ts` |
| `FlagsPort` | Feature flag evaluation | `kernel/ports/flags.port.ts` |
| `BillingServicePort` | Billing mode and subscription checks | `kernel/ports/billing.port.ts` |
| `IdentityPort` | User profile operations | `kernel/ports/identity.port.ts` |
| `TenantsPort` | Tenant status and subscriptions | `kernel/ports/tenants.port.ts` |
| `CreditsPort` | Credit balance and transactions | `kernel/ports/credits.port.ts` |
| `AuditPort` | Audit log entries | `kernel/ports/audit.port.ts` |
| `UsagePort` | Usage tracking and aggregation | `kernel/ports/usage.port.ts` |
| `NotifyPort` | Email and in-app notifications | `kernel/ports/notify.port.ts` |
| `JobsPort` | Background job dispatch | `kernel/ports/jobs.port.ts` |
| `OutboxPort` | Transactional outbox pattern | `kernel/ports/outbox.port.ts` |

---

## Phase 1: P0 Critical Issues

### K-001: Silent Cache Fallback

**Resolved**: 2025-01-15
**Phase**: Phase 1

**Original Problem**: Cache errors were silently swallowed and returned null, masking failures.

**Solution**: Cache errors now propagate. Added `CacheError` class for proper error handling.

---

### BR-001: Razorpay Portal Throws

**Resolved**: 2025-01-15
**Phase**: Phase 1

**Original Problem**: `createPortalSession` threw an error because Razorpay doesn't have a customer billing portal.

**Solution**: Returns fallback URL (the provided return URL) instead of throwing, matching expected behavior.

---

### BR-002: Subscription Quantity Throws

**Resolved**: 2025-01-15
**Phase**: Phase 1

**Original Problem**: Razorpay adapter was missing `updateSubscriptionPlan` and `updateSubscriptionQuantity` methods.

**Solution**: Added both methods to match the Stripe adapter interface for billing provider compatibility.

---

### SG-002: SSO Gateway Throws on Tenant Miss

**Resolved**: 2025-01-15
**Phase**: Phase 1

**Original Problem**: SSO tenant lookup failures caused the gateway to throw, blocking authentication.

**Solution**: Returns gracefully with null tenant, allowing auth to continue for users without tenant context.

---

### C-001: Contract Date Mismatch

**Resolved**: 2025-01-15
**Phase**: Phase 1

**Original Problem**: Date handling was inconsistent between ISO strings and Date objects across contracts.

**Solution**: Added `ZISODateString` schema in contracts for consistent ISO date string validation.

---

### M-001: Direct Module Imports

**Resolved**: 2025-01-15
**Phase**: Phase 1

**Original Problem**: Modules were importing directly from other modules, violating hexagonal architecture.

**Solution**: Modules now import through kernel ports. Created `scripts/check-module-imports.mjs` to enforce this at build time.

---

### DT-001: Codegen Assumes Built Contracts

**Resolved**: 2025-01-15
**Phase**: Phase 1

**Original Problem**: Route generation failed if contracts weren't already built.

**Solution**: Added auto-build logic to detect stale contracts and build them before loading.

---

## Phase 2: Module Decoupling

### M-002: Event Ownership Not Enforced

**Resolved**: 2025-01-15
**Phase**: Phase 2

**Original Problem**: No clear ownership of events between modules.

**Solution**: Created event ownership documentation in `REFERENCE/EVENTS.md` with clear publisher/subscriber rules.

---

### M-003: Circular Dependencies

**Resolved**: 2025-01-15
**Phase**: Phase 2

**Original Problem**: Some modules had circular import dependencies.

**Solution**: Refactored dependencies to flow one-way through kernel ports.

---

## Phase 3: Code Quality

### G-001: Handler Code Duplication

**Resolved**: 2025-01-15
**Phase**: Phase 3
**Location**: `gateway/src/handler/httpHandler.ts`

**Original Problem**: `makeHandler` and `makeHandlerRaw` had duplicated setup logic.

**Solution**: Extracted `_setupHandler` helper function for shared route param extraction, guard invocation, and scope context setup.

---

### G-002: Dev Auth Headers Security

**Resolved**: 2025-01-15
**Phase**: Phase 3
**Location**: `gateway/src/auth/auth.ts`

**Original Problem**: Dev auth headers check used blocklist (`!== 'prod'`) which is less secure than allowlist.

**Solution**: Added `DEV_ENVIRONMENTS` allowlist (`dev`, `test`, `development`, `local`) with `isDevEnvironment()` type guard.

---

### C-002: Pagination Limits Inconsistent

**Resolved**: 2025-01-15
**Phase**: Phase 3
**Location**: Multiple contracts

**Original Problem**: Some contracts allowed `max(500)` pagination while others had different limits.

**Solution**: Added `PAGINATION_DEFAULTS` constant (max: 100, default: 20) and standardized all contracts.

---

### ER-001: Email Adapter Timeout

**Resolved**: 2025-01-15
**Phase**: Phase 3
**Location**: `email-resend/src/index.ts`

**Original Problem**: Email adapter had no timeout, could hang indefinitely.

**Solution**: Added `timeoutMs` config option (default: 10000ms) with `Promise.race` pattern.

---

### DM-001: MongoDB Connection Race

**Resolved**: 2025-01-15
**Phase**: Phase 3
**Location**: `database-mongodb/src/index.ts`

**Original Problem**: Race condition when multiple callers tried to connect simultaneously.

**Solution**: Fixed type of `connectingPromise` to `Promise<void>` and proper race condition handling in `connect()`.

---

### SL-001: Storage Local Resilience

**Resolved**: 2025-01-15
**Phase**: Phase 3
**Location**: `storage-local/src/index.ts`

**Original Problem**: Local storage had no retry logic for transient filesystem errors.

**Solution**: Added `withRetry` helper for transient errors (EAGAIN, EMFILE, ENFILE, EBUSY, ETIMEDOUT) with exponential backoff.

---

### DT-002: Auto-build Contracts

**Resolved**: 2025-01-15
**Phase**: Phase 3
**Location**: `devtools/src/commands/routes/gen.ts`

**Original Problem**: Route generation required manual contract build.

**Solution**: Added `isStale()` check and auto-build logic using `execSync('pnpm build')`.

---

### DT-003: Validate defineOpMeta

**Resolved**: 2025-01-15
**Phase**: Phase 3
**Location**: `saaskit/src/contracts/meta.ts`

**Original Problem**: Typos in `defineOpMeta` fields silently passed without validation.

**Solution**: Added `ZOpMeta` Zod schema with `.strict()` mode and dev-time validation in `defineOpMeta()`.

---

### BS-001: Silent Stripe Errors

**Resolved**: 2025-01-15
**Phase**: Phase 3
**Location**: `billing-stripe/src/index.ts`

**Original Problem**: `ensureCustomerId` and `getSubscription` swallowed errors silently.

**Solution**: Added `console.error` logging with error details before returning null.

---

### ES-001: Inconsistent Circuit Breaker Thresholds

**Resolved**: 2025-01-15
**Phase**: Phase 3
**Location**: Multiple adapters

**Original Problem**: Circuit breaker thresholds varied across adapters (e.g., email-ses had 10, others had 5).

**Solution**: Created `CIRCUIT_BREAKER_DEFAULTS` constant in kernel and updated 6 adapters to use consistent values.

---

## Statistics

| Phase | Issues Fixed |
|-------|--------------|
| Phase 0 | 13 ports created |
| Phase 1 | 7 P0 issues |
| Phase 2 | 2 M-series issues |
| Phase 3 | 10 quality issues |
| **Total** | **32 items resolved** |

---

> **Last Updated**: 2025-01-15
