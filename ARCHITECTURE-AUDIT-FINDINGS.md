# Unisane Architecture Audit Findings

> **Audit Date**: January 2025
> **Scope**: Layer-by-layer deep dive analysis for hexagonal architecture compliance, scalability, maintainability, and best practices.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Layer 1: Foundation](#layer-1-foundation)
   - [Kernel Package](#11-kernel-package)
   - [Gateway Package](#12-gateway-package)
   - [Contracts Package](#13-contracts-package)
3. [Layer 2: Adapters](#layer-2-adapters)
   - [Billing Adapters](#21-billing-adapters)
   - [Email Adapters](#22-email-adapters)
   - [Storage Adapters](#23-storage-adapters)
   - [Database Adapters](#24-database-adapters)
   - [Queue/Outbox Adapters](#25-queueoutbox-adapters)
4. [Layer 3: Business Modules](#layer-3-business-modules)
5. [Layer 4: DevTools & Code Generation](#layer-4-devtools--code-generation)
6. [Layer 5: Starters & Application Contracts](#layer-5-starters--application-contracts)
7. [Layer 6: Foundation Extraction Candidates](#layer-6-foundation-extraction-candidates)
8. [Cross-Cutting Concerns](#cross-cutting-concerns)
9. [Priority Action Items](#priority-action-items)
10. [Final Summary](#final-summary)
11. [Appendix: File References](#appendix-file-references)

---

## Executive Summary

### Overall Scores

| Layer | Score | Status |
|-------|-------|--------|
| **Foundation (Kernel)** | 8.5/10 | Production Ready |
| **Foundation (Gateway)** | 7.4/10 | Needs Improvement |
| **Foundation (Contracts)** | 7.0/10 | Needs Improvement |
| **Adapters** | 7.2/10 | Needs Improvement |
| **Modules** | 7.5/10 | Needs Improvement |
| **DevTools** | 7.8/10 | Good |
| **Starters** | 7.8/10 | Good |
| **OVERALL** | **7.6/10** | **Solid Foundation, Consistency Gaps** |

### Key Strengths

- Excellent hexagonal architecture with 8 well-defined ports
- Universal scope system (tenant/user/merchant/organization)
- Strong type safety with Zod validation throughout
- Good resilience patterns (circuit breaker, retry, outbox)
- Clean separation of concerns
- Contract-first development with `defineOpMeta` pattern
- AST-based code generation (routes, SDK, hooks)
- Event-driven cross-module communication

### Critical Issues Requiring Immediate Attention (P0)

1. Silent cache fallback masks production failures (K-001)
2. 150+ lines of code duplication in handlers (G-001)
3. Schema defined 3x with different meanings (C-001)
4. Billing adapter contract violations (BR-001, BR-002)
5. Missing resilience wrappers on storage adapters (SG-002)
6. Direct inter-module imports violate hexagonal architecture (M-001)
7. Silent metadata extraction failures in code generation (DT-001)

---

## Layer 1: Foundation

### 1.1 Kernel Package

**Location**: `/packages/foundation/kernel`
**Score**: 8.5/10

#### Architecture Compliance

| Principle | Status | Notes |
|-----------|--------|-------|
| Hexagonal (Ports & Adapters) | :white_check_mark: Excellent | 8 ports defined |
| No Infrastructure in Core | :white_check_mark: Strong | No MongoDB imports in domain |
| Dependency Inversion | :white_check_mark: Strong | `setDatabaseProvider()`, `setStorageProvider()` |
| Single Responsibility | :white_check_mark: Good | Clear folder separation |
| Interface Segregation | :white_check_mark: Good | Small, focused ports |

#### Ports Defined

```
/src/ports/
├── auth-identity.port.ts    # Auth ↔ Identity decoupling
├── billing.port.ts          # Core ↔ Billing service
├── flags.port.ts            # Feature flags abstraction
├── identity.port.ts         # User identity operations
├── jobs.port.ts             # Job queue abstraction
├── outbox.port.ts           # Event reliability pattern
├── settings.port.ts         # Configuration abstraction
└── tenants.port.ts          # Tenant operations
```

#### Strengths

- [x] Universal scope system with AsyncLocalStorage
- [x] Event system with memory leak protection
- [x] Dual emit modes (fire-and-forget + outbox)
- [x] Database abstraction with provider pattern
- [x] Value objects (Money, Email, Phone, Slug)
- [x] Comprehensive error catalog (E1xxx-E8xxx)
- [x] Client/server separation for browser-safe exports

#### Issues Found

##### Critical

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| K-001 | Silent cache fallback masks failures | `/src/cache/provider.ts` | ~80 | :red_circle: Open |

**Details**: Vercel KV HTTP client falls back to memory on ANY HTTP error without logging.

```typescript
// CURRENT (Bad)
async incrBy(...): Promise<number> {
  try {
    return await http<{ result: unknown }>(...);
  } catch {
    return memoryStore.incrBy(key, by, ttlMs);  // Silent fallback!
  }
}

// RECOMMENDED
async incrBy(...): Promise<number> {
  try {
    return await http<{ result: unknown }>(...);
  } catch (error) {
    logger.error('KV HTTP error', { error, key });
    throw error;  // Don't silently degrade
  }
}
```

**Risk**: Production data corruption, cache coherence violations, no observability.

---

##### High

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| K-002 | Missing database provider implementations | `/src/database/port/index.ts` | ~45 | :orange_circle: Open |

**Details**: PostgreSQL and MySQL throw runtime errors if configured.

```typescript
case 'postgres':
  throw new Error('PostgreSQL database provider not yet implemented');
case 'mysql':
  throw new Error('MySQL database provider not yet implemented');
```

**Recommendation**: Add build-time check or environment validation.

---

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| K-003 | Global state pattern (83 instances) | Multiple files | - | :yellow_circle: Documented |

**Details**: Widespread use of `global as unknown as { __kernel... }` for Next.js compatibility.

```typescript
const globalForScope = global as unknown as { __kernelScopeStorage?: AsyncLocalStorage };
const globalForMongo = global as unknown as { __mongoState?: MongoGlobalState };
const globalForEvents = global as unknown as { __eventEmitterState?: EventEmitterState };
```

**Impact**: Hard to test, hidden dependencies, type safety issues.
**Mitigation**: Necessary for Next.js/Turbopack - well documented in code.

---

##### Medium

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| K-004 | 27 constant files could be consolidated | `/src/constants/` | - | :yellow_circle: Open |
| K-005 | Event schemas all in one 220+ line file | `/src/events/schemas.ts` | - | :yellow_circle: Open |
| K-006 | RBAC utilities incomplete | `/src/rbac/` | - | :yellow_circle: Open |
| K-007 | No architecture guide documentation | `/src/` | - | :yellow_circle: Open |

#### Kernel Checklist

##### Critical Fixes
- [ ] K-001: Remove silent fallback in Vercel KV cache - log and throw instead
- [ ] K-002: Add static validation for database provider at boot time

##### High Priority
- [ ] K-003: Document global state pattern better (add README section)
- [ ] Add architecture guide to kernel README

##### Medium Priority
- [ ] K-004: Consolidate 27 constant files into 3-4 logical groups
- [ ] K-005: Extract event schemas to per-module files with auto-registration
- [ ] K-006: Add RBAC utilities and permission checking helpers
- [ ] K-007: Create top-level architecture documentation

##### Low Priority
- [ ] Add lint rules to prevent cross-module event definition
- [ ] Create type-safe error code registry
- [ ] Auto-register health checks from modules

---

### 1.2 Gateway Package

**Location**: `/packages/foundation/gateway`
**Score**: 7.4/10

#### Architecture Compliance

| Principle | Status | Notes |
|-----------|--------|-------|
| Kernel Integration | :white_check_mark: Strong | Uses `runWithScopeContext()` properly |
| HTTP Abstraction | :white_check_mark: Good | Clean Web API Request/Response |
| Auth Management | :white_check_mark: Strong | Multi-strategy (API key, JWT, cookie) |
| DRY Principle | :x: Violation | 150+ lines duplicated |

#### Strengths

- [x] Multi-strategy auth (API keys with cache, JWT RS256, cookies)
- [x] Session revocation check via `sessionsRevokedAt`
- [x] JWKS rotation support with 10-min auto-refresh
- [x] Smart rate limiting with djb2 hash for IP
- [x] Query DSL with size limits and type validation
- [x] Comprehensive error catalog (48+ codes)
- [x] CSRF protection for cookie auth
- [x] Idempotency middleware with 10s polling timeout

#### Issues Found

##### Critical

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| G-001 | Handler code duplication (150+ lines) | `/src/handler/httpHandler.ts` | 74-156, 224-302 | :red_circle: Open |

**Details**: `makeHandler` and `makeHandlerRaw` have nearly identical setup code.

```typescript
// Both functions duplicate:
// - Route param extraction (async Next.js 16 handling)
// - Request ID sanitization
// - Guard invocation
// - Scope context setup
// - Logging setup
// - Response building

// RECOMMENDED: Extract to shared function
async function _setupHandler<Body, Params>(
  req: Request,
  route: RouteParams<Params>,
  opts: GuardOpts<Body, Params>
): Promise<HandlerContext<Body, Params>> {
  // ... shared setup logic
}
```

---

##### High

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| G-002 | Dev auth headers work if APP_ENV misconfigured | `/src/auth/auth.ts` | 366-389 | :orange_circle: Open |

**Details**: Dev headers checked only if `APP_ENV !== 'prod'`. If APP_ENV is `'production'` instead of `'prod'`, dev auth is active.

```typescript
// CURRENT (Risky)
if (APP_ENV !== 'prod') {
  // Dev headers work here
}

// RECOMMENDED (Allowlist)
const isDevEnv = ['dev', 'test', 'development'].includes(APP_ENV);
if (isDevEnv) {
  // Dev headers work here
}
```

---

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| G-003 | Next.js coupling in route params | `/src/handler/httpHandler.ts` | 75-80 | :orange_circle: Open |

**Details**: Handler directly handles Next.js 16 async params, coupling to framework.

```typescript
const routeParams: Params =
  route?.params &&
  typeof (route.params as unknown as Promise<unknown>).then === "function"
    ? await (route.params as unknown as Promise<Params>)
    : route.params;
```

**Recommendation**: Abstract into `RouterAdapter` interface for framework flexibility.

---

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| G-004 | guard.ts vs tsrest.ts duplication | `/src/middleware/` | - | :orange_circle: Open |

**Details**: Nearly identical guard logic in two files.

---

##### Medium

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| G-005 | Silent logging failures | `/src/handler/httpHandler.ts` | 136-140 | :yellow_circle: Open |
| G-006 | No middleware chain pattern | `/src/middleware/` | - | :yellow_circle: Open |
| G-007 | Telemetry stubs not connected to config | `/src/telemetry.ts` | - | :yellow_circle: Open |
| G-008 | Global state for auth repos | `/src/auth/auth.ts` | 56-73 | :yellow_circle: Open |

#### Gateway Checklist

##### Critical Fixes
- [ ] G-001: Extract shared handler logic to `_setupHandler()` function
- [ ] G-002: Use allowlist for dev environment detection

##### High Priority
- [ ] G-003: Create `RouterAdapter` interface to abstract Next.js specifics
- [ ] G-004: Consolidate guard.ts and tsrest.ts withGuards()

##### Medium Priority
- [ ] G-005: Remove `try { logger.xxx() } catch {}` - let logging errors surface
- [ ] G-006: Add middleware chain pattern `compose(...guards)`
- [ ] G-007: Connect telemetry functions to `configureTelemetry()` config
- [ ] G-008: Replace global state with module-scoped variable + init check

##### Low Priority
- [ ] Add response interceptor pattern for cross-cutting concerns
- [ ] Make Query DSL registry type-safe with factory pattern
- [ ] Document why rate limit policies differ per operation

---

### 1.3 Contracts Package

**Location**: `/packages/foundation/contracts`
**Score**: 7.0/10

#### Schema Design

| Aspect | Status | Notes |
|--------|--------|-------|
| Zod Usage | :white_check_mark: Good | Proper `z.infer<>` throughout |
| Type Inference | :white_check_mark: Excellent | Full compile + runtime sync |
| Validation Rules | :warning: Partial | Some fields missing validation |
| Organization | :warning: Issues | Schema duplication found |

#### Schemas Defined

```typescript
// Foundation Contracts (/src/index.ts)
ZAdminStatsQuery        // Date range + granularity
ZPaginationQuery        // Offset-based pagination (UNUSED)
ZIdParam                // Generic ID parameter
ZTenantContext          // Tenant isolation context
ZFieldError             // Field-level validation errors
ZErrorResponse          // Standard error envelope
ZClientErrorResponse    // 4xx errors
ZServerErrorResponse    // 5xx errors
ZRateLimitErrorResponse // Extended with retry details
ZValidationErrorResponse// With literal code
```

#### Issues Found

##### Critical

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| C-001 | ZAdminStatsQuery defined 3x with different meanings | Multiple | - | :red_circle: Open |

**Details**: Same schema name, completely different structures:

```typescript
// Foundation Contracts (time range)
export const ZAdminStatsQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  granularity: z.enum(['day', 'week', 'month']).optional(),
});

// Kernel Contracts (DUPLICATE of above)
export const ZAdminStatsQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  granularity: z.enum(['day', 'week', 'month']).optional(),
});

// Starter Contracts - tenants (filters!)
export const ZAdminStatsQuery = z.object({
  filters: ZAdminTenantFilters.optional(),
});

// Starter Contracts - users (different filters!)
export const ZAdminStatsQuery = z.object({
  filters: ZAdminUserFilters.optional(),
});
```

**Impact**: Semantic confusion, import ambiguity, maintenance nightmare.

---

##### High

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| C-002 | Inconsistent pagination limits | Multiple contracts | - | :orange_circle: Open |

**Details**: Different modules use different max limits:

```typescript
// tenants.contract.ts
limit: z.coerce.number().int().positive().max(50).default(50)   // max 50

// users.contract.ts
limit: z.coerce.number().int().positive().max(500).default(50)  // max 500 (!!)

// Kernel definition
ZLimit = z.number().int().min(1).max(200).default(20)           // max 200
```

**Risk**: Inconsistent API behavior, potential security issue (500 items/page).

---

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| C-003 | Error code is plain string, not enum | `/src/index.ts` | ~35 | :orange_circle: Open |

**Details**: Schema allows any string, but Gateway has explicit `ErrorCode` union.

```typescript
// Current
code: z.string()  // Any string allowed

// Should reference Gateway's ErrorCode
import { ERROR_CATALOG } from "@unisane/gateway/errors";
code: z.enum([...Object.keys(ERROR_CATALOG) as [string, ...string[]]])
```

---

##### Medium

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| C-004 | ZPaginationQuery is unused | `/src/index.ts` | ~18 | :yellow_circle: Open |
| C-005 | `z.record(z.unknown())` for error details | `/src/index.ts` | ~40 | :yellow_circle: Open |
| C-006 | Missing validation on ID fields | `/src/index.ts` | - | :yellow_circle: Open |
| C-007 | No format validation on field paths | `/src/index.ts` | - | :yellow_circle: Open |

#### Contracts Checklist

##### Critical Fixes
- [ ] C-001: Resolve ZAdminStatsQuery conflict - single source of truth
  - [ ] Rename starter versions to `ZAdminTenantStatsQuery`, `ZAdminUserStatsQuery`
  - [ ] Remove duplicate from kernel contracts
  - [ ] Document the canonical version in foundation

##### High Priority
- [ ] C-002: Standardize pagination limits across all modules
  - [ ] Define base `ZAdminListQuery` in foundation with consistent bounds
  - [ ] Document if different limits are intentional
- [ ] C-003: Add ErrorCode enum validation to contracts

##### Medium Priority
- [ ] C-004: Remove unused `ZPaginationQuery` or document its purpose
- [ ] C-005: Create specific detail schemas per error type
- [ ] C-006: Add format validation to ID fields (UUID pattern or prefix pattern)
- [ ] C-007: Add field path regex validation to `ZFieldError`

##### Low Priority
- [ ] Add `.trim()` to string validators
- [ ] Export `ErrorCode` type from contracts package
- [ ] Create contract composition guide

---

## Layer 2: Adapters

**Location**: `/packages/adapters/`
**Overall Score**: 7.2/10

### Adapter Inventory

| Category | Adapter | Port Compliance | Resilience | Score |
|----------|---------|-----------------|------------|-------|
| **Billing** | billing-stripe | :white_check_mark: Full | :white_check_mark: Yes | 7.5/10 |
| **Billing** | billing-razorpay | :x: Partial (2 methods throw) | :white_check_mark: Yes | 6.0/10 |
| **Email** | email-resend | :white_check_mark: Full | :white_check_mark: Yes | 7.0/10 |
| **Email** | email-ses | :white_check_mark: Full | :white_check_mark: Yes | 8.0/10 |
| **Storage** | storage-s3 | :white_check_mark: Full | :white_check_mark: Yes | 8.5/10 |
| **Storage** | storage-gcs | :white_check_mark: Full | :x: No | 6.5/10 |
| **Storage** | storage-local | :white_check_mark: Full | :x: No | 7.0/10 |
| **Database** | database-mongodb | N/A (Direct API) | N/A | 7.5/10 |
| **Bridge** | identity-mongodb | :white_check_mark: Full | N/A | 8.0/10 |
| **Bridge** | tenants-mongodb | :white_check_mark: Full | N/A | 8.0/10 |
| **Queue** | jobs-inngest | :white_check_mark: Full | :x: No | 7.5/10 |
| **Outbox** | outbox-mongodb | :white_check_mark: Full | N/A | 7.0/10 |

### 2.1 Billing Adapters

#### billing-stripe

**Location**: `/packages/adapters/billing-stripe`
**Score**: 7.5/10

##### Strengths
- [x] Full port implementation
- [x] Resilience wrapper with circuit breaker
- [x] Idempotency key handling
- [x] Configuration validation in constructor

##### Issues

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| BS-001 | Silent error in `ensureCustomerId()` | `/src/index.ts` | 147-149 | :orange_circle: Open |

```typescript
// CURRENT (Bad)
catch {
  return null;  // No logging, swallows all errors
}

// RECOMMENDED
catch (error) {
  logger.warn('Failed to ensure customer ID', { error, scopeId });
  return null;
}
```

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| BS-002 | Hardcoded API version | `/src/index.ts` | 28 | :yellow_circle: Open |
| BS-003 | HTTP request code duplicated with Razorpay | `/src/index.ts` | 82-124 | :yellow_circle: Open |

---

#### billing-razorpay

**Location**: `/packages/adapters/billing-razorpay`
**Score**: 6.0/10

##### Strengths
- [x] Resilience wrapper
- [x] Configuration validation

##### Issues

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| BR-001 | `createPortalSession()` throws - CONTRACT VIOLATION | `/src/index.ts` | 226-232 | :red_circle: Open |

```typescript
// CURRENT (Contract Violation)
async createPortalSession(_args: {...}): Promise<PortalSession> {
  throw new Error('Razorpay customer portal is not supported...');
}

// RECOMMENDED Options:
// 1. Return fallback URL
async createPortalSession(args: {...}): Promise<PortalSession> {
  return {
    url: `https://dashboard.razorpay.com/app/subscriptions`,
    id: 'fallback',
  };
}

// 2. Make method optional in interface
interface BillingProviderAdapter {
  createPortalSession?(...): Promise<PortalSession>;
}
```

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| BR-002 | `updateSubscriptionPlan()` throws - CONTRACT VIOLATION | `/src/index.ts` | 287-298 | :red_circle: Open |
| BR-003 | Lost error context in catch | `/src/index.ts` | 97-100 | :orange_circle: Open |

```typescript
// CURRENT (Loses context)
catch (e) {
  throw e instanceof Error ? e : new Error('Razorpay request failed');
}

// RECOMMENDED
catch (e) {
  if (e instanceof Error) throw e;
  throw new Error(`Razorpay request failed: ${String(e)}`);
}
```

---

### 2.2 Email Adapters

#### email-resend

**Location**: `/packages/adapters/email-resend`
**Score**: 7.0/10

##### Issues

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| ER-001 | Missing timeout management | `/src/index.ts` | - | :orange_circle: Open |

```typescript
// CURRENT (No timeout)
async send(message: EmailMessage): Promise<SendResult> {
  const result = await this.resend.emails.send({...});  // Can hang forever
}

// RECOMMENDED (Match SES pattern)
async send(message: EmailMessage): Promise<SendResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
  try {
    const result = await this.resend.emails.send({...}, { signal: ctrl.signal });
    return result;
  } finally {
    clearTimeout(timer);
  }
}
```

---

#### email-ses

**Location**: `/packages/adapters/email-ses`
**Score**: 8.0/10

##### Strengths
- [x] Proper timeout with AbortController
- [x] Configuration validation
- [x] Resilience wrapper

##### Issues

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| ES-001 | Circuit breaker threshold differs from Resend (10 vs 5) | `/src/index.ts` | 127 | :yellow_circle: Open |

---

### 2.3 Storage Adapters

#### storage-s3

**Location**: `/packages/adapters/storage-s3`
**Score**: 8.5/10

##### Strengths
- [x] Full port implementation
- [x] Resilience wrapper
- [x] Excellent error handling (404 detection)
- [x] Stream-to-buffer conversion for different runtimes

##### Issues

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| SS-001 | None critical | - | - | :white_check_mark: Good |

---

#### storage-gcs

**Location**: `/packages/adapters/storage-gcs`
**Score**: 6.5/10

##### Issues

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| SG-001 | Missing `name` property | `/src/index.ts` | 46-57 | :orange_circle: Open |

```typescript
// CURRENT
export class GCSStorageAdapter implements StorageProvider {
  private readonly storage: Storage;
  // Missing: readonly name = 'storage-gcs' as const;
}

// RECOMMENDED
export class GCSStorageAdapter implements StorageProvider {
  readonly name = 'storage-gcs' as const;
  private readonly storage: Storage;
}
```

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| SG-002 | NO resilience wrapper | `/src/index.ts` | 190-192 | :red_circle: Open |

```typescript
// CURRENT (No resilience)
export function createGCSStorageAdapter(config: GCSAdapterConfig): StorageProvider {
  return new GCSStorageAdapter(config);
}

// RECOMMENDED
export function createGCSStorageAdapter(config: GCSAdapterConfig): StorageProvider {
  return createResilientProxy({
    name: 'storage-gcs',
    primary: new GCSStorageAdapter(config),
    circuitBreaker: { failureThreshold: 5, resetTimeout: 30000 },
    retry: { maxRetries: 3, baseDelayMs: 200 },
  });
}
```

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| SG-003 | Different 404 detection pattern than S3 | `/src/index.ts` | 150 | :yellow_circle: Open |

---

#### storage-local

**Location**: `/packages/adapters/storage-local`
**Score**: 7.0/10

##### Strengths
- [x] Directory traversal protection
- [x] HMAC-based URL signing
- [x] Timing-safe comparison

##### Issues

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| SL-001 | NO resilience wrapper | `/src/index.ts` | 312-314 | :orange_circle: Open |

---

### 2.4 Database Adapters

#### database-mongodb

**Location**: `/packages/adapters/database-mongodb`
**Score**: 7.5/10

##### Issues

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| DM-001 | Race condition in double-check lock | `/src/index.ts` | 89-143 | :orange_circle: Open |

```typescript
// ISSUE: If connection fails, promise cleared, next caller may spawn duplicate

// In finally block:
this.connectingPromise = null;  // Race condition here

// RECOMMENDED: Check if this is still the current promise
finally {
  if (this.connectingPromise === currentPromise) {
    this.connectingPromise = null;
  }
}
```

---

### 2.5 Queue/Outbox Adapters

#### outbox-mongodb

**Location**: `/packages/adapters/outbox-mongodb`
**Score**: 7.0/10

##### Strengths
- [x] Exponential backoff implementation
- [x] Dead letter queue management
- [x] Cursor-based pagination

##### Issues

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| OM-001 | Uses `any` type | `/src/index.ts` | 203 | :orange_circle: Open |

```typescript
// CURRENT
let filter: any = { status: 'dead' };

// RECOMMENDED
interface DeadLetterFilter {
  status: 'dead';
  $or?: Array<{...}>;
}
let filter: DeadLetterFilter = { status: 'dead' };
```

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| OM-002 | Dynamic require for ObjectId | `/src/index.ts` | 67-78 | :yellow_circle: Open |

---

### Adapters Checklist

#### Critical Fixes (P0)
- [ ] BR-001: Fix billing-razorpay `createPortalSession()` contract violation
- [ ] BR-002: Fix billing-razorpay `updateSubscriptionPlan()` contract violation
- [ ] SG-002: Add resilience wrapper to storage-gcs
- [ ] SL-001: Add resilience wrapper to storage-local

#### High Priority (P1)
- [ ] BS-001: Add logging to silent error in billing-stripe
- [ ] ER-001: Add timeout management to email-resend
- [ ] DM-001: Fix race condition in database-mongodb connection
- [ ] SG-001: Add `name` property to storage-gcs
- [ ] ALL: Add structured logging to all adapters (currently 0/12 have logging)

#### Medium Priority (P2)
- [ ] BS-003: Extract shared HTTP client utility (reduce Stripe/Razorpay duplication)
- [ ] BR-003: Preserve error context in Razorpay catch blocks
- [ ] ES-001: Document or standardize circuit breaker thresholds (5 vs 10)
- [ ] OM-001: Replace `any` type with concrete interface
- [ ] Standardize 404 detection across storage adapters

#### Low Priority (P3)
- [ ] BS-002: Make Stripe API version configurable
- [ ] OM-002: Replace dynamic require with static import
- [ ] Add comprehensive test suites (0/12 adapters have tests)
- [ ] Add input validation before external API calls

---

## Cross-Cutting Concerns

### Logging Status

| Layer | Logging Present | Status |
|-------|-----------------|--------|
| Kernel | :warning: Partial | Pino configured, used inconsistently |
| Gateway | :white_check_mark: Good | Structured logging with context |
| Contracts | N/A | No runtime code |
| Adapters | :x: None | 0/12 adapters have logging |

**Action Required**: Add structured logging to all adapters.

---

### Testing Status

| Layer | Test Coverage | Status |
|-------|---------------|--------|
| Kernel | :warning: Unknown | Tests exist but coverage unknown |
| Gateway | :warning: Partial | Some unit tests |
| Contracts | :x: None | No tests |
| Adapters | :x: None | 0/12 adapters have visible tests |

**Action Required**: Add comprehensive test suites.

---

### Resilience Consistency

| Component | Circuit Breaker | Retry | Timeout |
|-----------|-----------------|-------|---------|
| billing-stripe | :white_check_mark: 5 failures | :white_check_mark: 3x, 200ms | :white_check_mark: 10s |
| billing-razorpay | :white_check_mark: 5 failures | :white_check_mark: 3x, 500ms | :white_check_mark: 10s |
| email-resend | :white_check_mark: 5 failures | :white_check_mark: 3x | :x: None |
| email-ses | :white_check_mark: 10 failures | :white_check_mark: 3x | :white_check_mark: 10s |
| storage-s3 | :white_check_mark: 5 failures | :white_check_mark: 3x, 200ms | :white_check_mark: |
| storage-gcs | :x: None | :x: None | :x: None |
| storage-local | :x: None | :x: None | N/A |

**Action Required**: Standardize resilience configuration across all adapters.

---

### Security Checklist

- [x] Directory traversal protection (storage-local)
- [x] Timing-safe comparison for signatures (storage-local)
- [x] Idempotency keys with randomUUID (billing-stripe)
- [x] Request ID validation prevents log injection (gateway)
- [x] CSRF protection for cookie auth (gateway)
- [ ] Input validation before external API calls
- [ ] Credential sanitization in logs

---

## Priority Action Items

### P0 - Critical (Fix Immediately)

| # | Issue ID | Description | Owner | ETA |
|---|----------|-------------|-------|-----|
| 1 | K-001 | Remove silent cache fallback in Kernel | | |
| 2 | BR-001 | Fix Razorpay portal contract violation | | |
| 3 | BR-002 | Fix Razorpay updatePlan contract violation | | |
| 4 | SG-002 | Add resilience to storage-gcs | | |
| 5 | C-001 | Resolve ZAdminStatsQuery 3x definition | | |

### P1 - High Priority (This Sprint)

| # | Issue ID | Description | Owner | ETA |
|---|----------|-------------|-------|-----|
| 6 | G-001 | Extract shared handler logic (150+ lines) | | |
| 7 | G-002 | Fix dev auth environment detection | | |
| 8 | C-002 | Standardize pagination limits | | |
| 9 | ER-001 | Add timeout to email-resend | | |
| 10 | DM-001 | Fix MongoDB connection race condition | | |
| 11 | SL-001 | Add resilience to storage-local | | |
| 12 | ALL | Add logging to all adapters | | |

### P2 - Medium Priority (Next Sprint)

| # | Issue ID | Description | Owner | ETA |
|---|----------|-------------|-------|-----|
| 13 | G-003 | Abstract Next.js route params | | |
| 14 | G-004 | Consolidate guard.ts and tsrest.ts | | |
| 15 | C-003 | Add ErrorCode enum to contracts | | |
| 16 | BS-003 | Extract shared HTTP client | | |
| 17 | K-004 | Consolidate constant files | | |

### P3 - Low Priority (Backlog)

| # | Issue ID | Description | Owner | ETA |
|---|----------|-------------|-------|-----|
| 18 | K-005 | Extract event schemas to per-module | | |
| 19 | G-006 | Add middleware chain pattern | | |
| 20 | ALL | Add comprehensive test suites | | |

---

## Appendix: File References

### Foundation Layer

| Package | Path | Key Files |
|---------|------|-----------|
| Kernel | `/packages/foundation/kernel` | `src/index.ts`, `src/scope/context.ts`, `src/events/emitter.ts`, `src/cache/provider.ts` |
| Gateway | `/packages/foundation/gateway` | `src/handler/httpHandler.ts`, `src/auth/auth.ts`, `src/middleware/guard.ts` |
| Contracts | `/packages/foundation/contracts` | `src/index.ts` |

### Adapters Layer

| Adapter | Path | Key Files |
|---------|------|-----------|
| billing-stripe | `/packages/adapters/billing-stripe` | `src/index.ts` |
| billing-razorpay | `/packages/adapters/billing-razorpay` | `src/index.ts` |
| email-resend | `/packages/adapters/email-resend` | `src/index.ts` |
| email-ses | `/packages/adapters/email-ses` | `src/index.ts` |
| storage-s3 | `/packages/adapters/storage-s3` | `src/index.ts` |
| storage-gcs | `/packages/adapters/storage-gcs` | `src/index.ts` |
| storage-local | `/packages/adapters/storage-local` | `src/index.ts` |
| database-mongodb | `/packages/adapters/database-mongodb` | `src/index.ts` |
| identity-mongodb | `/packages/adapters/identity-mongodb` | `src/index.ts` |
| tenants-mongodb | `/packages/adapters/tenants-mongodb` | `src/index.ts` |
| jobs-inngest | `/packages/adapters/jobs-inngest` | `src/index.ts` |
| outbox-mongodb | `/packages/adapters/outbox-mongodb` | `src/index.ts` |

---

---

## Layer 3: Business Modules

**Location**: `/packages/modules/`
**Overall Score**: 7.5/10

### Module Inventory

| Module | Layer | Purpose | Clean Arch | Event-Driven | Score |
|--------|-------|---------|------------|--------------|-------|
| **auth** | 3 | Authentication flows | :white_check_mark: | :white_check_mark: | 8.0/10 |
| **identity** | 2 | User & membership management | :white_check_mark: | :white_check_mark: | 8.0/10 |
| **tenants** | 3 | Tenant workspace management | :white_check_mark: | :white_check_mark: | 8.0/10 |
| **billing** | 3 | Subscriptions & payments | :warning: Coupling | :white_check_mark: | 7.0/10 |
| **credits** | 3 | Credit balance management | :white_check_mark: | :white_check_mark: | 8.5/10 |
| **usage** | 3 | Usage metering | :white_check_mark: | :white_check_mark: | 7.5/10 |
| **flags** | 3 | Feature flags | :white_check_mark: | :white_check_mark: | 8.0/10 |
| **audit** | 3 | Immutable audit logging | :white_check_mark: | :white_check_mark: | 8.5/10 |
| **settings** | 2 | Typed key-value settings | :white_check_mark: | :white_check_mark: | 8.0/10 |
| **storage** | 2 | File storage with lifecycle | :white_check_mark: | :white_check_mark: | 7.5/10 |
| **notify** | 4 | Multi-channel notifications | :white_check_mark: | :white_check_mark: | 7.5/10 |
| **webhooks** | 4 | Webhook delivery | :warning: Coupling | :white_check_mark: | 6.5/10 |
| **media** | 4 | Image processing | :white_check_mark: | N/A | 7.0/10 |
| **pdf** | 4 | PDF generation | :white_check_mark: | N/A | 7.0/10 |
| **ai** | 4 | LLM integrations | :x: Coupling | :white_check_mark: | 6.0/10 |

### 3.1 Architecture Compliance

#### Clean Architecture Pattern

All modules follow consistent structure:

```
module/
├── src/
│   ├── domain/
│   │   ├── constants.ts      # Event names, defaults, collections
│   │   ├── errors.ts         # Custom domain errors
│   │   ├── keys.ts           # Cache key builders
│   │   ├── ports.ts          # Repository/service interfaces
│   │   ├── schemas.ts        # Zod validation schemas
│   │   ├── types.ts          # TypeScript types
│   │   └── mappers.ts        # DTO transformations (optional)
│   ├── service/
│   │   ├── *.ts              # Use case functions
│   │   └── admin/            # Admin-only operations
│   ├── data/
│   │   ├── *.repository.ts   # Port adapters
│   │   └── *.repository.mongo.ts  # MongoDB implementations
│   ├── adapters/             # Hexagonal adapters (optional)
│   ├── event-handlers.ts     # Event subscriptions
│   └── index.ts              # Public API exports
└── package.json
```

#### Strengths

- [x] Consistent folder structure across all 15 modules
- [x] Clear domain/service/data separation
- [x] Well-defined ports (interfaces) in domain layer
- [x] Comprehensive Zod schemas for validation
- [x] Strong error definitions with proper codes
- [x] Event-driven cross-module communication
- [x] Typed event handlers using `onTyped()`

---

### 3.2 Critical Issues Found

#### M-001: Direct Inter-Module Imports (HEXAGONAL VIOLATION)

**Severity**: :red_circle: Critical
**Impact**: Tight coupling, circular dependency risk, untestable

**Violations Found:**

| Source Module | Imports From | File | Line |
|---------------|--------------|------|------|
| ai | flags | `service/generate.ts` | 3 |
| ai | billing | `service/generate.ts` | 4 |
| billing | flags | `service/refund.ts` | 8 |
| webhooks | settings | `data/webhooks.repository.mongo.ts` | 18 |
| billing (domain) | tenants (types) | `domain/ports/subscriptions.ts` | 3 |

**Example - AI Module Coupling:**

```typescript
// ai/service/generate.ts (Lines 3-5) - BAD
import { isEnabledForScope } from "@unisane/flags";
import { assertActiveSubscriptionForCredits } from "@unisane/billing";

export async function generate(args: GenerateArgs) {
  // Direct calls to other modules
  const enabled = await isEnabledForScope({ key: FLAG.AI_GENERATE, ... });
  await assertActiveSubscriptionForCredits();
  // ...
}

// RECOMMENDED: Use dependency injection
export async function generate(
  args: GenerateArgs,
  deps: { flags: FlagsPort; billing: BillingPort }
) {
  const enabled = await deps.flags.isEnabled(FLAG.AI_GENERATE, ...);
  await deps.billing.assertActiveSubscription();
  // ...
}
```

**Example - Webhooks Repository Coupling:**

```typescript
// webhooks/data/webhooks.repository.mongo.ts (Line 18) - BAD
import { getTypedSetting } from "@unisane/settings";

// Repository layer calling service layer of another module!
const { value: retentionDays } = await getTypedSetting<number>({
  scopeId: null,
  ns: "webhooks",
  key: "retentionDays",
});

// RECOMMENDED: Inject settings at initialization
class WebhooksRepository {
  constructor(private readonly settings: SettingsPort) {}

  async cleanup() {
    const retentionDays = await this.settings.get("webhooks", "retentionDays");
  }
}
```

---

#### M-002: Cross-Module Type Dependencies

**Severity**: :orange_circle: High
**Impact**: Domain layer coupling, breaking changes cascade

```typescript
// billing/domain/ports/subscriptions.ts (Line 3) - BAD
import type { LatestSub } from '@unisane/tenants';

export interface SubscriptionsRepo {
  getLatestByScopeIds(scopeIds: string[]): Promise<Map<string, LatestSub>>;
}

// RECOMMENDED: Define standalone type or use generic
export interface SubscriptionsRepo {
  getLatestByScopeIds(scopeIds: string[]): Promise<Map<string, SubscriptionView>>;
}
```

---

#### M-003: Missing Adapters for Key Modules

**Severity**: :orange_circle: High
**Impact**: Forces direct imports, prevents proper DI

| Module | Has Adapter | Used By | Priority |
|--------|-------------|---------|----------|
| settings | :white_check_mark: Yes | Multiple | - |
| flags | :white_check_mark: Yes | Multiple | - |
| billing | :white_check_mark: Yes | Multiple | - |
| identity | :white_check_mark: Partial | auth | - |
| **audit** | :x: No | Should be used by all | HIGH |
| **credits** | :x: No | billing, ai | HIGH |
| **storage** | :x: No | identity, media | MEDIUM |
| **usage** | :x: No | billing | MEDIUM |
| **tenants** | :x: No | Many modules | HIGH |
| **notify** | :x: No | auth, billing | MEDIUM |
| **webhooks** | :x: No | billing | LOW |
| **media** | :x: No | identity | LOW |
| **pdf** | :x: No | billing | LOW |

---

#### M-004: No Dependency Injection Framework

**Severity**: :orange_circle: High
**Impact**: Implicit coupling, hard to test, no clear initialization

```typescript
// Current: Adapters registered manually at bootstrap
// No visible DI container or service locator

// Settings adapter defined
export const settingsAdapter: SettingsPort = {...};

// How is it registered? Where is the container?
// Services import directly instead of receiving via DI
```

---

### 3.3 Event-Driven Architecture Analysis

#### Event Emission (Excellent)

All modules emit typed events consistently:

```typescript
// credits/service/consume.ts (Lines 38-43)
await events.emit(CREDITS_EVENTS.CONSUMED, {
  scopeId,
  amount: args.amount,
  reason: args.reason,
  feature: args.feature ?? "usage",
});

// billing/domain/constants.ts
export const BILLING_EVENTS = {
  SUBSCRIPTION_CREATED: 'billing.subscription.created',
  SUBSCRIPTION_UPDATED: 'billing.subscription.updated',
  SUBSCRIPTION_CANCELLED: 'billing.subscription.cancelled',
} as const;
```

#### Event Handler Registration (Good)

```typescript
// audit/event-handlers.ts (Lines 244-348)
export function registerAuditEventHandlers(): () => void {
  const unsubscribers: Array<() => void> = [];

  unsubscribers.push(
    onTyped('tenant.created', async (event) => {
      await handleTenantCreated(event.payload);
    })
  );
  // ... more handlers

  // Returns cleanup function
  return () => {
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
```

#### Cross-Module Event Flow

```
┌─────────────┐    tenant.created    ┌─────────────┐
│   tenants   │ ──────────────────▶  │    audit    │
└─────────────┘                      └─────────────┘
       │
       │ tenant.created
       ▼
┌─────────────┐
│   credits   │  (grant initial credits)
└─────────────┘

┌─────────────┐   subscription.created   ┌─────────────┐
│   billing   │ ────────────────────────▶│    audit    │
└─────────────┘                          └─────────────┘
       │
       │ webhook.stripe.topup_completed
       ▼
┌─────────────┐
│   credits   │  (grant purchased credits)
└─────────────┘
```

---

### 3.4 Error Handling Analysis

#### Error Definitions (Excellent)

| Module | Error Classes | Consistency |
|--------|---------------|-------------|
| auth | 10 errors | :white_check_mark: Excellent |
| credits | 3 errors | :white_check_mark: Good |
| audit | 2 errors | :white_check_mark: Good |
| billing | ~5 errors | :white_check_mark: Good |
| identity | ~4 errors | :white_check_mark: Good |

**Example - Auth Module Errors:**

```typescript
// auth/domain/errors.ts
class InvalidCredentialsError extends DomainError {
  readonly code = ErrorCode.INVALID_CREDENTIALS;
  readonly status = 401;
}

class AccountLockedError extends DomainError {
  readonly code = ErrorCode.ACCOUNT_LOCKED;
  readonly status = 403;

  constructor(lockedUntil: Date) {
    super(`Account locked until ${lockedUntil.toISOString()}`);
  }
}

class OtpRateLimitError extends DomainError {
  readonly code = ErrorCode.RATE_LIMITED;
  readonly status = 429;
  readonly retryable = true;

  constructor(retryAfterSec: number) {
    super(`Too many OTP requests. Retry after ${retryAfterSec} seconds`, {
      details: { retryAfterSec },
      retryable: true,
    });
  }
}
```

---

### 3.5 Type Safety Analysis

#### Zod Schema Usage (Excellent)

Every module uses comprehensive Zod validation:

```typescript
// credits/domain/schemas.ts
export const ZGrantTokens = z.object({
  amount: z.number().int().positive(),
  reason: z.string().min(2),
  expiresAt: ZUnixMs.optional(),
  idem: ZIdem,
});

// billing/domain/schemas.ts
export const ZSubscribe = z.object({
  planId: z.string().min(2),
  quantity: z.number().int().positive().optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});
```

#### TypeScript Strictness (Excellent)

- All modules have proper tsconfig.json
- Explicit return types on all functions
- No `any` types observed in module code
- Discriminated unions for result types

---

### 3.6 Module-Specific Issues

#### auth Module

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| AUTH-001 | None critical | - | :white_check_mark: Good |

---

#### billing Module

| ID | Issue | File | Severity | Status |
|----|-------|------|----------|--------|
| BILL-001 | Direct flags import | `service/refund.ts:8` | :orange_circle: High | Open |
| BILL-002 | Cross-module type import | `domain/ports/subscriptions.ts:3` | :orange_circle: High | Open |

---

#### ai Module

| ID | Issue | File | Severity | Status |
|----|-------|------|----------|--------|
| AI-001 | Direct flags import | `service/generate.ts:3` | :red_circle: Critical | Open |
| AI-002 | Direct billing import | `service/generate.ts:4` | :red_circle: Critical | Open |

---

#### webhooks Module

| ID | Issue | File | Severity | Status |
|----|-------|------|----------|--------|
| WH-001 | Repository imports settings service | `data/webhooks.repository.mongo.ts:18` | :red_circle: Critical | Open |

---

#### credits Module

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| CRED-001 | Missing adapter (used by billing) | :orange_circle: High | Open |

---

#### audit Module

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| AUD-001 | Missing adapter (should be used by all) | :orange_circle: High | Open |

---

### 3.7 Modules Checklist

#### Critical Fixes (P0)
- [ ] M-001: Eliminate direct inter-module imports
  - [ ] AI-001: Remove `@unisane/flags` import from ai module
  - [ ] AI-002: Remove `@unisane/billing` import from ai module
  - [ ] BILL-001: Remove `@unisane/flags` import from billing module
  - [ ] WH-001: Remove `@unisane/settings` import from webhooks repository
- [ ] M-002: Remove cross-module type dependencies
  - [ ] BILL-002: Define standalone type instead of importing from tenants

#### High Priority (P1)
- [ ] M-003: Create missing adapters
  - [ ] Create AuditPort and adapter
  - [ ] Create CreditsPort and adapter
  - [ ] Create TenantsPort and adapter (for external use)
  - [ ] Create StoragePort module adapter
  - [ ] Create UsagePort and adapter
- [ ] M-004: Implement dependency injection framework
  - [ ] Evaluate Tsyringe or native Node.js DI
  - [ ] Create service container
  - [ ] Auto-register adapters at bootstrap

#### Medium Priority (P2)
- [ ] Create NotifyPort and adapter
- [ ] Standardize admin service organization across all modules
- [ ] Add event payload versioning
- [ ] Document module dependencies and event flows
- [ ] Enforce repository port implementation with `implements` keyword

#### Low Priority (P3)
- [ ] Create MediaPort and adapter
- [ ] Create PdfPort and adapter
- [ ] Create WebhooksPort and adapter
- [ ] Add observability (metrics) to all modules
- [ ] Standardize logging across event handlers

---

### 3.8 Module Dependencies Matrix

**Current State (with violations highlighted):**

```
Module Dependencies (→ = direct import, ⟹ = via event/adapter)

auth        → kernel
identity    → kernel
tenants     → kernel
billing     → kernel, flags (!), tenants-types (!)
credits     → kernel
usage       → kernel
flags       → kernel
audit       → kernel
settings    → kernel
storage     → kernel
notify      → kernel
webhooks    → kernel, settings (!)
media       → kernel
pdf         → kernel
ai          → kernel, flags (!), billing (!)
```

**Target State (all via adapters/events):**

```
auth        → kernel, ⟹ identity-adapter
identity    → kernel
tenants     → kernel
billing     → kernel, ⟹ flags-adapter
credits     → kernel
usage       → kernel
flags       → kernel
audit       → kernel (listens to all events)
settings    → kernel
storage     → kernel
notify      → kernel
webhooks    → kernel, ⟹ settings-adapter
media       → kernel
pdf         → kernel
ai          → kernel, ⟹ flags-adapter, ⟹ billing-adapter
```

---

### 3.9 NEW KERNEL PORTS REQUIRED

**CRITICAL**: Before fixing M-001 (inter-module imports), these ports MUST be created in `packages/foundation/kernel/src/ports/`:

| Port | File to Create | Used By | Provides |
|------|----------------|---------|----------|
| **CreditsPort** | `credits.port.ts` | ai, billing | `consume()`, `grant()`, `getBalance()` |
| **AuditPort** | `audit.port.ts` | all modules | `log()`, `query()` |
| **UsagePort** | `usage.port.ts` | billing, ai | `track()`, `getUsage()`, `getRollup()` |
| **NotifyPort** | `notify.port.ts` | auth, billing | `send()`, `sendBatch()` |
| **TenantsQueryPort** | `tenants-query.port.ts` | billing, identity | `findById()`, `findBySlug()` |

**Note**: `FlagsPort`, `SettingsPort`, `BillingPort` already exist in kernel.

#### Port Definition Pattern

```typescript
// packages/foundation/kernel/src/ports/credits.port.ts
export interface CreditsPort {
  /**
   * Consume credits from a scope's balance
   * @throws InsufficientCreditsError if balance too low
   */
  consume(args: {
    scopeId: string;
    amount: number;
    reason: string;
    feature?: string;
  }): Promise<{ consumed: number; remaining: number }>;

  /**
   * Grant credits to a scope
   */
  grant(args: {
    scopeId: string;
    amount: number;
    reason: string;
    expiresAt?: number;
  }): Promise<{ granted: number; newBalance: number }>;

  /**
   * Get current balance for a scope
   */
  getBalance(scopeId: string): Promise<{ available: number; pending: number }>;
}

// Provider setter
let creditsPort: CreditsPort | null = null;

export function setCreditsPort(port: CreditsPort): void {
  creditsPort = port;
}

export function getCreditsPort(): CreditsPort {
  if (!creditsPort) {
    throw new Error('CreditsPort not configured. Call setCreditsPort() in bootstrap.');
  }
  return creditsPort;
}
```

#### Bootstrap Wiring Pattern

```typescript
// starters/saaskit/src/bootstrap.ts - ADD THIS SECTION

async function setupModulePorts() {
  const {
    setCreditsPort,
    setAuditPort,
    setUsagePort,
    setNotifyPort,
    setTenantsQueryPort,
  } = await import('@unisane/kernel');

  // Credits port - wrap the credits module
  const credits = await import('@unisane/credits');
  setCreditsPort({
    consume: credits.consumeTokens,
    grant: credits.grantTokens,
    getBalance: credits.getBalance,
  });

  // Audit port - wrap the audit module
  const audit = await import('@unisane/audit');
  setAuditPort({
    log: audit.log,
    query: audit.queryLogs,
  });

  // Usage port
  const usage = await import('@unisane/usage');
  setUsagePort({
    track: usage.trackUsage,
    getUsage: usage.getUsage,
    getRollup: usage.getRollup,
  });

  // Notify port
  const notify = await import('@unisane/notify');
  setNotifyPort({
    send: notify.sendNotification,
    sendBatch: notify.sendBatch,
  });

  // Tenants query port (read-only queries)
  const tenants = await import('@unisane/tenants');
  setTenantsQueryPort({
    findById: tenants.findById,
    findBySlug: tenants.findBySlug,
  });

  console.log('[bootstrap]   - Module ports configured');
}
```

---

### 3.10 Allowed vs Prohibited Dependencies

**RULE**: Modules may ONLY depend on:
1. `@unisane/kernel` (foundation)
2. Kernel-provided ports (via `get*Port()`)
3. Events (via `onTyped()`, `emitTyped()`)

**PROHIBITED**:
- Direct imports from other `@unisane/*` modules
- Type imports from other modules (define locally or in kernel)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ALLOWED DEPENDENCIES                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐     getCreditsPort()      ┌──────────────────────┐   │
│  │    ai    │ ─────────────────────────▶│                      │   │
│  └──────────┘     getFlagsPort()        │                      │   │
│       │       ─────────────────────────▶│                      │   │
│       │           getBillingPort()      │                      │   │
│       │       ─────────────────────────▶│      KERNEL          │   │
│  ┌──────────┐     getFlagsPort()        │      (ports)         │   │
│  │ billing  │ ─────────────────────────▶│                      │   │
│  └──────────┘                           │                      │   │
│                                         │                      │   │
│  ┌──────────┐     getSettingsPort()     │                      │   │
│  │ webhooks │ ─────────────────────────▶│                      │   │
│  └──────────┘                           └──────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      PROHIBITED DEPENDENCIES                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐                           ┌──────────────────────┐   │
│  │    ai    │ ────── ✗ ────────────────▶│   @unisane/flags     │   │
│  └──────────┘                           └──────────────────────┘   │
│       │                                                              │
│       │                                 ┌──────────────────────┐   │
│       └──────────── ✗ ─────────────────▶│   @unisane/billing   │   │
│                                         └──────────────────────┘   │
│                                                                      │
│  ┌──────────┐                           ┌──────────────────────┐   │
│  │ webhooks │ ────── ✗ ────────────────▶│   @unisane/settings  │   │
│  └──────────┘                           └──────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Cross-Cutting Concerns (Updated)

### Adapter Resilience Standard

**ALL external-facing adapters MUST implement this standard configuration:**

```typescript
// packages/foundation/kernel/src/resilience/standard.ts

export const ADAPTER_RESILIENCE_STANDARD = {
  circuitBreaker: {
    failureThreshold: 5,      // Open after 5 consecutive failures
    resetTimeout: 30000,      // Try again after 30 seconds
    halfOpenRequests: 1,      // Allow 1 request in half-open state
  },
  retry: {
    maxRetries: 3,
    baseDelayMs: 200,
    maxDelayMs: 5000,
    exponentialBase: 2,
    retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'],
  },
  timeout: {
    requestTimeout: 10000,    // 10 second default
    connectTimeout: 5000,     // 5 second connection timeout
  },
} as const;

// Factory for creating resilient adapters
export function createResilientAdapter<T>(
  name: string,
  adapter: T,
  overrides?: Partial<typeof ADAPTER_RESILIENCE_STANDARD>
): T {
  const config = { ...ADAPTER_RESILIENCE_STANDARD, ...overrides };
  return createResilientProxy({ name, primary: adapter, ...config });
}
```

**Adapter Compliance Checklist:**

| Adapter | Circuit Breaker | Retry | Timeout | Compliant? |
|---------|-----------------|-------|---------|------------|
| billing-stripe | ✅ 5 | ✅ 3x | ✅ 10s | ✅ Yes |
| billing-razorpay | ✅ 5 | ✅ 3x | ✅ 10s | ✅ Yes |
| email-resend | ✅ 5 | ✅ 3x | ❌ None | ⚠️ No |
| email-ses | ✅ 10 | ✅ 3x | ✅ 10s | ⚠️ Threshold differs |
| storage-s3 | ✅ 5 | ✅ 3x | ✅ Yes | ✅ Yes |
| storage-gcs | ❌ None | ❌ None | ❌ None | ❌ No |
| storage-local | ❌ None | ❌ None | N/A | ⚠️ Dev only |
| jobs-inngest | ❌ None | ❌ None | ❌ None | ⚠️ Inngest handles |

---

### Event Schema Ownership Model

**Problem**: Event schemas are defined in multiple places causing confusion.

**Solution**: Clear ownership model:

```
EVENT OWNERSHIP MODEL
=====================

1. MODULE-OWNED EVENTS (domain events)
   Location: packages/modules/{module}/src/domain/events.ts
   Owner: The module that emits the event
   Examples:
   - billing.subscription.created → @unisane/billing
   - credits.consumed → @unisane/credits
   - tenant.created → @unisane/tenants

2. KERNEL EVENT REGISTRY (type registration)
   Location: packages/foundation/kernel/src/events/registry.ts
   Purpose: Type-safe event name constants
   Content: Event name enums, NOT schemas

3. STARTER EVENT WIRING (app-specific)
   Location: starters/{kit}/src/platform/events.ts
   Purpose: Register schemas at boot, wire handlers
   Content: Import schemas from modules, call registerSchema()
```

**Event Definition Pattern:**

```typescript
// packages/modules/credits/src/domain/events.ts
import { z } from 'zod';

export const CREDITS_EVENTS = {
  CONSUMED: 'credits.consumed',
  GRANTED: 'credits.granted',
  EXPIRED: 'credits.expired',
} as const;

export const ZCreditsConsumedPayload = z.object({
  scopeId: z.string(),
  amount: z.number().int().positive(),
  reason: z.string(),
  feature: z.string().optional(),
  remainingBalance: z.number().int().min(0),
});

export type CreditsConsumedPayload = z.infer<typeof ZCreditsConsumedPayload>;

// Export for schema registration
export const CREDITS_EVENT_SCHEMAS = {
  [CREDITS_EVENTS.CONSUMED]: ZCreditsConsumedPayload,
  [CREDITS_EVENTS.GRANTED]: ZCreditsGrantedPayload,
  [CREDITS_EVENTS.EXPIRED]: ZCreditsExpiredPayload,
};
```

**Starter Registration:**

```typescript
// starters/saaskit/src/platform/events.ts
import { registerSchema } from '@unisane/kernel';
import { CREDITS_EVENT_SCHEMAS } from '@unisane/credits';
import { BILLING_EVENT_SCHEMAS } from '@unisane/billing';
// ... other imports

export async function registerEventSchemas() {
  // Register all module schemas
  for (const [event, schema] of Object.entries(CREDITS_EVENT_SCHEMAS)) {
    registerSchema(event, schema);
  }
  for (const [event, schema] of Object.entries(BILLING_EVENT_SCHEMAS)) {
    registerSchema(event, schema);
  }
  // ... other modules
}
```

---

### Test Strategy

**REQUIRED**: Each layer must have tests before 100% compliance.

#### Layer Test Requirements

| Layer | Unit Tests | Integration Tests | E2E Tests |
|-------|------------|-------------------|-----------|
| **Kernel** | ✅ Required | ✅ Required | ❌ N/A |
| **Gateway** | ✅ Required | ✅ Required | ❌ N/A |
| **Adapters** | ✅ Required | ✅ Required | ❌ N/A |
| **Modules** | ✅ Required | ✅ Required | ❌ N/A |
| **DevTools** | ✅ Required | ❌ Optional | ❌ N/A |
| **Starters** | ❌ Optional | ✅ Required | ✅ Required |

#### Port/Adapter Mock Pattern

```typescript
// packages/foundation/kernel/src/testing/mocks.ts

export function createMockCreditsPort(): CreditsPort {
  return {
    consume: vi.fn().mockResolvedValue({ consumed: 10, remaining: 90 }),
    grant: vi.fn().mockResolvedValue({ granted: 100, newBalance: 200 }),
    getBalance: vi.fn().mockResolvedValue({ available: 100, pending: 0 }),
  };
}

export function createMockFlagsPort(): FlagsPort {
  return {
    isEnabled: vi.fn().mockResolvedValue(true),
    getValue: vi.fn().mockResolvedValue(null),
  };
}

// Usage in tests
describe('ai/generate', () => {
  beforeEach(() => {
    setCreditsPort(createMockCreditsPort());
    setFlagsPort(createMockFlagsPort());
  });

  it('should consume credits on successful generation', async () => {
    const result = await generate({ prompt: 'test' });
    expect(getCreditsPort().consume).toHaveBeenCalledWith({
      scopeId: expect.any(String),
      amount: expect.any(Number),
      reason: 'ai.generate',
    });
  });
});
```

#### Test Coverage Targets

| Layer | Target | Current | Gap |
|-------|--------|---------|-----|
| Kernel | 80% | ~50% | 30% |
| Gateway | 70% | ~30% | 40% |
| Adapters | 60% | 0% | 60% |
| Modules | 70% | ~20% | 50% |

---

### Logging Status

| Layer | Logging Present | Status |
|-------|-----------------|--------|
| Kernel | :warning: Partial | Pino configured, used inconsistently |
| Gateway | :white_check_mark: Good | Structured logging with context |
| Contracts | N/A | No runtime code |
| Adapters | :x: None | 0/12 adapters have logging |
| **Modules** | :warning: Partial | Event handlers log, services inconsistent |

---

### Hexagonal Compliance Summary

| Layer | Compliance | Issues |
|-------|------------|--------|
| Kernel | :white_check_mark: 95% | Global state pattern (documented) |
| Gateway | :white_check_mark: 85% | Next.js coupling |
| Adapters | :white_check_mark: 90% | Missing resilience on some |
| **Modules** | :warning: 70% | Direct imports, missing adapters |

---

## Priority Action Items (Updated)

### P0 - Critical (Fix Immediately)

| # | Issue ID | Description | Owner | ETA |
|---|----------|-------------|-------|-----|
| 1 | K-001 | Remove silent cache fallback in Kernel | | |
| 2 | BR-001 | Fix Razorpay portal contract violation | | |
| 3 | BR-002 | Fix Razorpay updatePlan contract violation | | |
| 4 | SG-002 | Add resilience to storage-gcs | | |
| 5 | C-001 | Resolve ZAdminStatsQuery 3x definition | | |
| **6** | **M-001** | **Eliminate direct inter-module imports (ai, billing, webhooks)** | | |

### P1 - High Priority (This Sprint)

| # | Issue ID | Description | Owner | ETA |
|---|----------|-------------|-------|-----|
| 7 | G-001 | Extract shared handler logic (150+ lines) | | |
| 8 | G-002 | Fix dev auth environment detection | | |
| 9 | C-002 | Standardize pagination limits | | |
| 10 | ER-001 | Add timeout to email-resend | | |
| 11 | DM-001 | Fix MongoDB connection race condition | | |
| 12 | SL-001 | Add resilience to storage-local | | |
| 13 | ALL | Add logging to all adapters | | |
| **14** | **M-002** | **Remove cross-module type dependencies** | | |
| **15** | **M-003** | **Create missing adapters (audit, credits, tenants)** | | |
| **16** | **M-004** | **Implement dependency injection framework** | | |

### P2 - Medium Priority (Next Sprint)

| # | Issue ID | Description | Owner | ETA |
|---|----------|-------------|-------|-----|
| 17 | G-003 | Abstract Next.js route params | | |
| 18 | G-004 | Consolidate guard.ts and tsrest.ts | | |
| 19 | C-003 | Add ErrorCode enum to contracts | | |
| 20 | BS-003 | Extract shared HTTP client | | |
| 21 | K-004 | Consolidate constant files | | |
| **22** | **M-003b** | **Create remaining adapters (storage, usage, notify)** | | |

### P3 - Low Priority (Backlog)

| # | Issue ID | Description | Owner | ETA |
|---|----------|-------------|-------|-----|
| 23 | K-005 | Extract event schemas to per-module | | |
| 24 | G-006 | Add middleware chain pattern | | |
| 25 | ALL | Add comprehensive test suites | | |
| **26** | **M-003c** | **Create utility adapters (media, pdf, webhooks)** | | |

---

## Appendix: File References (Updated)

### Foundation Layer

| Package | Path | Key Files |
|---------|------|-----------|
| Kernel | `/packages/foundation/kernel` | `src/index.ts`, `src/scope/context.ts`, `src/events/emitter.ts`, `src/cache/provider.ts` |
| Gateway | `/packages/foundation/gateway` | `src/handler/httpHandler.ts`, `src/auth/auth.ts`, `src/middleware/guard.ts` |
| Contracts | `/packages/foundation/contracts` | `src/index.ts` |

### Adapters Layer

| Adapter | Path | Key Files |
|---------|------|-----------|
| billing-stripe | `/packages/adapters/billing-stripe` | `src/index.ts` |
| billing-razorpay | `/packages/adapters/billing-razorpay` | `src/index.ts` |
| email-resend | `/packages/adapters/email-resend` | `src/index.ts` |
| email-ses | `/packages/adapters/email-ses` | `src/index.ts` |
| storage-s3 | `/packages/adapters/storage-s3` | `src/index.ts` |
| storage-gcs | `/packages/adapters/storage-gcs` | `src/index.ts` |
| storage-local | `/packages/adapters/storage-local` | `src/index.ts` |
| database-mongodb | `/packages/adapters/database-mongodb` | `src/index.ts` |
| identity-mongodb | `/packages/adapters/identity-mongodb` | `src/index.ts` |
| tenants-mongodb | `/packages/adapters/tenants-mongodb` | `src/index.ts` |
| jobs-inngest | `/packages/adapters/jobs-inngest` | `src/index.ts` |
| outbox-mongodb | `/packages/adapters/outbox-mongodb` | `src/index.ts` |

### Modules Layer

| Module | Path | Key Files |
|--------|------|-----------|
| auth | `/packages/modules/auth` | `src/domain/errors.ts`, `src/service/*.ts`, `src/event-handlers.ts` |
| identity | `/packages/modules/identity` | `src/domain/ports.ts`, `src/service/*.ts`, `src/adapters/auth-identity.adapter.ts` |
| tenants | `/packages/modules/tenants` | `src/domain/types.ts`, `src/service/*.ts`, `src/event-handlers.ts` |
| billing | `/packages/modules/billing` | `src/domain/ports/*.ts`, `src/service/refund.ts`, `src/adapters/billing-service.adapter.ts` |
| credits | `/packages/modules/credits` | `src/domain/schemas.ts`, `src/service/consume.ts`, `src/event-handlers.ts` |
| usage | `/packages/modules/usage` | `src/domain/*.ts`, `src/service/*.ts` |
| flags | `/packages/modules/flags` | `src/domain/ports.ts`, `src/adapters/flags.adapter.ts` |
| audit | `/packages/modules/audit` | `src/domain/errors.ts`, `src/event-handlers.ts` |
| settings | `/packages/modules/settings` | `src/domain/ports.ts`, `src/adapters/settings.adapter.ts` |
| storage | `/packages/modules/storage` | `src/domain/ports.ts`, `src/service/*.ts` |
| notify | `/packages/modules/notify` | `src/service/*.ts` |
| webhooks | `/packages/modules/webhooks` | `src/data/webhooks.repository.mongo.ts`, `src/service/*.ts` |
| media | `/packages/modules/media` | `src/service/*.ts` |
| pdf | `/packages/modules/pdf` | `src/service/*.ts` |
| ai | `/packages/modules/ai` | `src/service/generate.ts` |

---

## Layer 4: DevTools & Code Generation

**Location**: `/packages/tooling/`
**Overall Score**: 7.8/10

### Package Inventory

| Package | Purpose | Type | Score |
|---------|---------|------|-------|
| **@unisane/devtools** | Main CLI + code generators | Private | 7.5/10 |
| **@unisane/cli-core** | Shared CLI infrastructure | Private | 8.0/10 |
| **unisane** | Public-facing CLI | Public | 8.0/10 |
| **create-unisane** | Project scaffolding | Public | 7.5/10 |
| **@unisane/test-utils** | Testing utilities | Private | 8.0/10 |
| **@unisane/typescript-config** | Shared TS config | Config | 8.5/10 |
| **@unisane/eslint-config** | Shared ESLint rules | Config | 8.5/10 |
| **@unisane/tailwind-config** | Shared Tailwind setup | Config | 8.5/10 |

### 4.1 Code Generation Architecture

#### Generation Flow

```
Contracts (defineOpMeta)
        ↓
Meta Extraction (ts-morph AST parsing)
        ↓
    ┌───┴───┐
    ↓       ↓
Routes    SDK/Hooks/Types
    ↓       ↓
Generated Next.js Handlers | Generated Clients
```

#### Contract Definition Pattern

```typescript
// contracts/*.contract.ts
const c = initContract();

export const authContract = c.router({
  passwordSignUp: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/auth/password/signup",
      body: ZPasswordSignup,
      responses: { 200: z.object({...}) }
    },
    defineOpMeta({
      op: "auth.password.signup",
      allowUnauthed: true,
      service: {
        importPath: "@unisane/auth",
        fn: "signup",
        zodBody: { importPath: "@unisane/auth", name: "ZPasswordSignup" }
      }
    })
  )
});
```

#### Generated Output Targets

| Target | Output | Purpose |
|--------|--------|---------|
| **routes** | `/src/app/api/**/*.ts` | Next.js API handlers |
| **types** | `/src/sdk/generated/*.types.ts` | TypeScript types |
| **browser** | `/src/sdk/generated/api.ts` | Fetch-based client |
| **server** | `/src/sdk/generated/api.server.ts` | Server-side client |
| **hooks** | `/src/hooks/generated/**/*.ts` | React Query hooks |
| **vue** | `/src/hooks/generated/**/*.ts` | Vue composables |
| **zod** | `/src/sdk/generated/zod.ts` | Zod schema exports |
| **admin-hooks** | `/src/hooks/generated/admin/**/*.ts` | Admin grid hooks |

### 4.2 Strengths

- [x] AST-based extraction using ts-morph (robust vs regex)
- [x] Embedded metadata pattern (defineOpMeta)
- [x] Type-safe configuration with Zod
- [x] Multiple SDK targets (browser, server, hooks, vue)
- [x] Factory support for complex handlers
- [x] Extracted types prevent browser bundle pollution
- [x] Clear CLI UX with spinners and messaging
- [x] Declarative guard configuration (perms, auth)

### 4.3 Critical Issues Found

#### DT-001: Silent Metadata Extraction Failures

**Severity**: :red_circle: Critical
**Location**: `extraction/meta-extract.ts:71-80`

```typescript
// CURRENT (Bad) - Silently skips malformed entries
const arg = call.getArguments()[0]?.asKind(SyntaxKind.ObjectLiteralExpression);
if (!arg) continue;  // Silent skip!

const opKey = getStringProp(arg, 'op') ?? '';
if (!opKey) continue;  // Silent skip!

// RECOMMENDED - Track and report skipped entries
const skipped: SkippedEntry[] = [];
if (!arg) {
  skipped.push({ file: sf.getFilePath(), line: call.getStartLineNumber(), reason: 'Invalid argument' });
  continue;
}
// ... later report skipped entries with warnings
```

**Impact**: Operations may be silently missing from generated routes.

---

#### DT-002: Dynamic Contract Imports Require Build

**Severity**: :orange_circle: High
**Location**: `commands/routes/gen.ts:71-84`

```typescript
// Requires contracts to be pre-built
const routerModule = await import(routerUrl);
appRouter = routerModule.appRouter || routerModule.default;
```

**Problem**: Must run `pnpm build` before `unisane generate routes`
**Impact**: Fragile workflow, easy to forget build step

**Recommendation**: Auto-check/build contracts before generation.

---

#### DT-003: No Validation of defineOpMeta Structure

**Severity**: :orange_circle: High
**Impact**: Typos in metadata field names silently ignored

```typescript
// This typo is silently ignored!
defineOpMeta({
  op: "auth.signup",
  servic: { fn: "signup" }  // Should be "service"
})
```

**Recommendation**: Generate Zod validator for defineOpMeta structure.

---

#### DT-004: Type Erasure in Generated Code

**Severity**: :yellow_circle: Medium
**Location**: `gen-browser.ts:98`, `gen-hooks.ts` multiple lines

```typescript
// CURRENT - Breaks type safety
await (api as any)["auth"]["passwordSignUp"](variables)

// RECOMMENDED - Use proper types
const result = await api.auth.passwordSignUp(variables);
```

---

#### DT-005: No Content Comparison for File Writes

**Severity**: :yellow_circle: Medium
**Location**: `commands/routes/gen.ts:227`

```typescript
// TODO: Compare content to avoid unnecessary writes
if (!rewrite && existsSync(routePath)) {
  // Not implemented - always rewrites
}
```

**Impact**: Unnecessary file rewrites trigger watchers.

---

#### DT-006: Convention-Based Admin Route Detection

**Severity**: :yellow_circle: Medium
**Location**: `gen-browser.ts:38-40`

```typescript
// Convention-based - could misidentify
function isAdminRoute(route: AppRouteEntry): boolean {
  return route.name.startsWith('admin') || route.path.includes('/admin/');
}
```

**Recommendation**: Add explicit `admin: true` flag in defineOpMeta.

---

### 4.4 Missing Features

| Feature | Status | Impact |
|---------|--------|--------|
| Content-based file write skipping | :x: TODO | Unnecessary rewrites |
| CRUD scaffold generation | :x: Not started | Manual CRUD creation |
| OpenAPI spec generation | :x: Not started | No API documentation |
| Plugin system | :x: Not started | Limited extensibility |
| Watch mode regeneration | :x: Not started | No auto-regen |
| Codemods for upgrades | :x: Not started | Manual migrations |
| Route health checking | :warning: Partial | Only checks exports |

### 4.5 Generated Code Quality

#### Strengths

- [x] Clear AUTO-GENERATED headers
- [x] Organized module structure (domains/, shared/)
- [x] Proper imports and barrel exports
- [x] Browser-safe type extraction
- [x] Query key factories for cache invalidation

#### Generated Structure (Hooks)

```
hooks/generated/
├─ shared/
│  ├─ types.ts         # Common React Query types
│  ├─ unwrap.ts        # Response helpers
│  └─ index.ts
├─ domains/
│  ├─ auth.hooks.ts    # Per-domain hooks
│  ├─ users.hooks.ts
│  └─ ...
├─ keys.ts             # Query key factories
├─ hooks.ts            # Namespace barrel
└─ index.ts
```

### 4.6 DevTools Checklist

#### Critical Fixes (P0)
- [ ] DT-001: Track and report skipped metadata entries
- [ ] DT-002: Auto-check/build contracts before generation
- [ ] DT-003: Add Zod validator for defineOpMeta structure

#### High Priority (P1)
- [ ] DT-004: Replace `as any` with proper mapped types
- [ ] DT-005: Implement content comparison before writing
- [ ] DT-006: Add explicit `admin` flag to defineOpMeta
- [ ] Add test suite for generators

#### Medium Priority (P2)
- [ ] Extract common generator scaffolding to base utilities
- [ ] Implement watch mode for auto-regeneration
- [ ] Add OpenAPI spec generation
- [ ] Improve doctor command with more checks

#### Low Priority (P3)
- [ ] Implement plugin system for custom generators
- [ ] Add CRUD scaffold generation
- [ ] Add codemods for version upgrades
- [ ] Performance optimization with caching

---

### 4.7 CLI Command Reference

```
unisane
├─ create [name]                    # Project scaffolding
├─ init                             # Initialize in existing project
├─ ui [init|add|diff|doctor]        # Component management
├─ add [module|integration]         # Add features
├─ generate [routes|sdk|types|crud] # Code generation (PRIMARY)
│  ├─ routes                        # Generate Next.js handlers
│  ├─ sdk                           # Generate all SDK artifacts
│  ├─ types                         # TypeScript types only
│  └─ hooks                         # React Query hooks only
├─ db [query|migrate|seed|...]      # Database management
├─ env [check|init|pull|push]       # Environment setup
├─ dev|build|doctor|upgrade|sync    # Development utilities
├─ tenant [info|list|create|delete] # Tenant management
├─ billing [plans|sync-stripe]      # Billing commands
├─ cache [clear|clear-rbac]         # Cache management
└─ release [build|verify]           # Distribution building
```

---

## Cross-Cutting Concerns (Updated)

### Logging Status

| Layer | Logging Present | Status |
|-------|-----------------|--------|
| Kernel | :warning: Partial | Pino configured, used inconsistently |
| Gateway | :white_check_mark: Good | Structured logging with context |
| Contracts | N/A | No runtime code |
| Adapters | :x: None | 0/12 adapters have logging |
| Modules | :warning: Partial | Event handlers log, services inconsistent |
| **DevTools** | :white_check_mark: Good | CLI spinners and status messages |

---

### Testing Status

| Layer | Test Coverage | Status |
|-------|---------------|--------|
| Kernel | :warning: Unknown | Tests exist but coverage unknown |
| Gateway | :warning: Partial | Some unit tests |
| Contracts | :x: None | No tests |
| Adapters | :x: None | 0/12 adapters have visible tests |
| Modules | :warning: Partial | Some `__tests__` folders |
| **DevTools** | :x: None | No generator tests visible |

---

### Hexagonal Compliance Summary

| Layer | Compliance | Issues |
|-------|------------|--------|
| Kernel | :white_check_mark: 95% | Global state pattern (documented) |
| Gateway | :white_check_mark: 85% | Next.js coupling |
| Adapters | :white_check_mark: 90% | Missing resilience on some |
| Modules | :warning: 70% | Direct imports, missing adapters |
| **DevTools** | :white_check_mark: 85% | Good separation, some silent failures |

---

## Priority Action Items (Updated)

### P0 - Critical (Fix Immediately)

| # | Issue ID | Description | Owner | ETA |
|---|----------|-------------|-------|-----|
| 1 | K-001 | Remove silent cache fallback in Kernel | | |
| 2 | BR-001 | Fix Razorpay portal contract violation | | |
| 3 | BR-002 | Fix Razorpay updatePlan contract violation | | |
| 4 | SG-002 | Add resilience to storage-gcs | | |
| 5 | C-001 | Resolve ZAdminStatsQuery 3x definition | | |
| 6 | M-001 | Eliminate direct inter-module imports | | |
| **7** | **DT-001** | **Track and report skipped metadata entries** | | |

### P1 - High Priority (This Sprint)

| # | Issue ID | Description | Owner | ETA |
|---|----------|-------------|-------|-----|
| 8 | G-001 | Extract shared handler logic (150+ lines) | | |
| 9 | G-002 | Fix dev auth environment detection | | |
| 10 | C-002 | Standardize pagination limits | | |
| 11 | ER-001 | Add timeout to email-resend | | |
| 12 | DM-001 | Fix MongoDB connection race condition | | |
| 13 | SL-001 | Add resilience to storage-local | | |
| 14 | ALL | Add logging to all adapters | | |
| 15 | M-002 | Remove cross-module type dependencies | | |
| 16 | M-003 | Create missing adapters (audit, credits, tenants) | | |
| 17 | M-004 | Implement dependency injection framework | | |
| **18** | **DT-002** | **Auto-check/build contracts before generation** | | |
| **19** | **DT-003** | **Add Zod validator for defineOpMeta** | | |

### P2 - Medium Priority (Next Sprint)

| # | Issue ID | Description | Owner | ETA |
|---|----------|-------------|-------|-----|
| 20 | G-003 | Abstract Next.js route params | | |
| 21 | G-004 | Consolidate guard.ts and tsrest.ts | | |
| 22 | C-003 | Add ErrorCode enum to contracts | | |
| 23 | BS-003 | Extract shared HTTP client | | |
| 24 | K-004 | Consolidate constant files | | |
| 25 | M-003b | Create remaining adapters (storage, usage, notify) | | |
| **26** | **DT-004** | **Replace `as any` with proper mapped types** | | |
| **27** | **DT-005** | **Implement content comparison before writing** | | |
| **28** | **DT-006** | **Add explicit `admin` flag to defineOpMeta** | | |

### P3 - Low Priority (Backlog)

| # | Issue ID | Description | Owner | ETA |
|---|----------|-------------|-------|-----|
| 29 | K-005 | Extract event schemas to per-module | | |
| 30 | G-006 | Add middleware chain pattern | | |
| 31 | ALL | Add comprehensive test suites | | |
| 32 | M-003c | Create utility adapters (media, pdf, webhooks) | | |
| **33** | **DT-007** | **Implement plugin system for custom generators** | | |
| **34** | **DT-008** | **Add watch mode for auto-regeneration** | | |
| **35** | **DT-009** | **Add OpenAPI spec generation** | | |

---

## Appendix: File References (Updated)

### Foundation Layer

| Package | Path | Key Files |
|---------|------|-----------|
| Kernel | `/packages/foundation/kernel` | `src/index.ts`, `src/scope/context.ts`, `src/events/emitter.ts`, `src/cache/provider.ts` |
| Gateway | `/packages/foundation/gateway` | `src/handler/httpHandler.ts`, `src/auth/auth.ts`, `src/middleware/guard.ts` |
| Contracts | `/packages/foundation/contracts` | `src/index.ts` |

### Adapters Layer

| Adapter | Path | Key Files |
|---------|------|-----------|
| billing-stripe | `/packages/adapters/billing-stripe` | `src/index.ts` |
| billing-razorpay | `/packages/adapters/billing-razorpay` | `src/index.ts` |
| email-resend | `/packages/adapters/email-resend` | `src/index.ts` |
| email-ses | `/packages/adapters/email-ses` | `src/index.ts` |
| storage-s3 | `/packages/adapters/storage-s3` | `src/index.ts` |
| storage-gcs | `/packages/adapters/storage-gcs` | `src/index.ts` |
| storage-local | `/packages/adapters/storage-local` | `src/index.ts` |
| database-mongodb | `/packages/adapters/database-mongodb` | `src/index.ts` |
| identity-mongodb | `/packages/adapters/identity-mongodb` | `src/index.ts` |
| tenants-mongodb | `/packages/adapters/tenants-mongodb` | `src/index.ts` |
| jobs-inngest | `/packages/adapters/jobs-inngest` | `src/index.ts` |
| outbox-mongodb | `/packages/adapters/outbox-mongodb` | `src/index.ts` |

### Modules Layer

| Module | Path | Key Files |
|--------|------|-----------|
| auth | `/packages/modules/auth` | `src/domain/errors.ts`, `src/service/*.ts`, `src/event-handlers.ts` |
| identity | `/packages/modules/identity` | `src/domain/ports.ts`, `src/service/*.ts`, `src/adapters/auth-identity.adapter.ts` |
| tenants | `/packages/modules/tenants` | `src/domain/types.ts`, `src/service/*.ts`, `src/event-handlers.ts` |
| billing | `/packages/modules/billing` | `src/domain/ports/*.ts`, `src/service/refund.ts`, `src/adapters/billing-service.adapter.ts` |
| credits | `/packages/modules/credits` | `src/domain/schemas.ts`, `src/service/consume.ts`, `src/event-handlers.ts` |
| usage | `/packages/modules/usage` | `src/domain/*.ts`, `src/service/*.ts` |
| flags | `/packages/modules/flags` | `src/domain/ports.ts`, `src/adapters/flags.adapter.ts` |
| audit | `/packages/modules/audit` | `src/domain/errors.ts`, `src/event-handlers.ts` |
| settings | `/packages/modules/settings` | `src/domain/ports.ts`, `src/adapters/settings.adapter.ts` |
| storage | `/packages/modules/storage` | `src/domain/ports.ts`, `src/service/*.ts` |
| notify | `/packages/modules/notify` | `src/service/*.ts` |
| webhooks | `/packages/modules/webhooks` | `src/data/webhooks.repository.mongo.ts`, `src/service/*.ts` |
| media | `/packages/modules/media` | `src/service/*.ts` |
| pdf | `/packages/modules/pdf` | `src/service/*.ts` |
| ai | `/packages/modules/ai` | `src/service/generate.ts` |

### DevTools Layer

| Package | Path | Key Files |
|---------|------|-----------|
| devtools | `/packages/tooling/devtools` | `src/cli.ts`, `src/commands/routes/gen.ts`, `src/extraction/meta-extract.ts` |
| cli-core | `/packages/tooling/cli-core` | `src/errors.ts`, `src/spinner.ts` |
| unisane | `/packages/tooling/unisane` | `src/index.ts` |
| create-unisane | `/packages/tooling/create-unisane` | `src/index.ts` |
| test-utils | `/packages/tooling/test-utils` | `src/index.ts` |

### Starters Layer

| Starter | Path | Key Files |
|---------|------|-----------|
| saaskit | `/starters/saaskit` | `src/contracts/*.contract.ts`, `src/app/api/**/*.ts`, `src/sdk/generated/*.ts`, `src/hooks/generated/*.ts` |

---

## Layer 5: Starters & Application Contracts

**Location**: `/starters/saaskit/`
**Overall Score**: 7.8/10

### 5.1 Overview

The SaasKit starter is a production-ready Next.js application that demonstrates proper integration of all Unisane modules. It serves as both a template and reference implementation.

### 5.2 Contract Files Inventory

22 contract files following consistent patterns:

| Contract | Purpose | Operations | Score |
|----------|---------|------------|-------|
| auth.contract.ts | Authentication flows | 12 | 8.5/10 |
| billing.contract.ts | Subscriptions/payments | 15+ | 8.0/10 |
| tenants.contract.ts | Workspace management | 10+ | 8.0/10 |
| users.contract.ts | User admin operations | 10+ | 8.0/10 |
| memberships.contract.ts | Team management | 8 | 8.0/10 |
| settings.contract.ts | Configuration | 6 | 8.0/10 |
| flags.contract.ts | Feature toggles | 8 | 8.0/10 |
| credits.contract.ts | Credit management | 6 | 8.0/10 |
| usage.contract.ts | Usage tracking | 4 | 7.5/10 |
| audit.contract.ts | Audit logs | 4 | 8.0/10 |
| webhooks.contract.ts | Webhook delivery | 8 | 7.5/10 |
| apikeys.contract.ts | API key management | 6 | 8.0/10 |
| storage.contract.ts | File operations | 6 | 7.5/10 |
| notify.contract.ts | Notifications | 4 | 7.5/10 |
| ai.contract.ts | LLM integrations | 4 | 7.0/10 |
| pdf.contract.ts | Document generation | 2 | 7.0/10 |
| me.contract.ts | Current user profile | 8 | 8.0/10 |
| jobs.contract.ts | Background jobs | 4 | 7.5/10 |
| outbox.contract.ts | Message queue | 4 | 7.5/10 |
| analytics.contract.ts | Dashboard stats | 6 | 7.5/10 |
| entitlements.contract.ts | Plan limits | 4 | 8.0/10 |
| import-export.contract.ts | Data transfer | 4 | 7.0/10 |

### 5.3 Bootstrap Architecture

**Location**: `src/bootstrap.ts` (431 lines)

#### Bootstrap Sequence (8 Phases)

```
Phase 1: Database Connection
    ↓
Phase 2: Index Initialization
    ↓
Phase 3: Health Checks Registration
    ↓
Phase 4: Repository Setup (DI)
    ↓
Phase 5: Provider Setup (Billing, Email, Storage)
    ↓
Phase 6: Event Schema Registration
    ↓
Phase 7: Event Handler Registration
    ↓
Phase 8: ✓ Platform Ready
```

#### Strengths

- [x] Clear phase separation with logging
- [x] Proper cleanup on shutdown (event handlers unregistered)
- [x] Dependency injection via `set*Provider()` pattern
- [x] Breaking circular dependencies explicitly documented
- [x] Health checks registered for MongoDB and Redis
- [x] Environment-based provider selection
- [x] Graceful shutdown support

---

### 5.4 Critical Issues Found

#### SK-001: Type Casting in Bootstrap (Type Safety Gap)

**Severity**: :orange_circle: High
**Location**: `src/bootstrap.ts:72`

```typescript
// CURRENT (Bad) - Loses type safety
configureIdentityProviders({ tenantsRepo: TenantsRepo as any });

// RECOMMENDED - Create proper type adapter
const tenantsRepoAdapter: TenantsRepoPort = {
  findById: TenantsRepo.findById,
  // ... map other methods
};
configureIdentityProviders({ tenantsRepo: tenantsRepoAdapter });
```

**Impact**: Runtime errors may go undetected at compile time.

---

#### SK-002: No Error Recovery in Bootstrap Phases

**Severity**: :orange_circle: High
**Location**: `src/bootstrap.ts:24-62`

```typescript
// CURRENT (Bad) - No error handling, no rollback
export async function bootstrap() {
  if (bootstrapped) return;

  await connectDb();           // If this fails, nothing cleaned up
  await ensureIndexes();       // If this fails, DB connection leaked
  // ...
}

// RECOMMENDED - Add phase error handling
export async function bootstrap() {
  if (bootstrapped) return;

  const phases: BootstrapPhase[] = [];

  try {
    await connectDb();
    phases.push({ name: 'db', cleanup: closeDb });

    await ensureIndexes();
    // ...
  } catch (error) {
    // Rollback completed phases in reverse
    for (const phase of phases.reverse()) {
      try { await phase.cleanup?.(); } catch {}
    }
    throw error;
  }
}
```

**Impact**: Partial bootstrap leaves system in inconsistent state.

---

#### SK-003: Duplicate Documentation Comments

**Severity**: :yellow_circle: Medium
**Location**: `src/bootstrap.ts:259-265`

```typescript
// Three identical JSDoc comments for setupEmailProviders
/**
 * Set up email providers using adapter packages
 */
/**
 * Set up email providers using adapter packages
 */
/**
 * Set up email providers using adapter packages
 */
async function setupEmailProviders() {
```

**Impact**: Code maintainability, copy-paste error indicator.

---

#### SK-004: GlobalThis Type Casting

**Severity**: :yellow_circle: Medium
**Location**: `src/bootstrap.ts:398`

```typescript
// CURRENT (Weak typing)
(globalThis as { __eventHandlerCleanup?: Array<() => void> }).__eventHandlerCleanup = cleanupFns;

// RECOMMENDED - Use typed global
declare global {
  var __eventHandlerCleanup: Array<() => void> | undefined;
}
globalThis.__eventHandlerCleanup = cleanupFns;
```

---

#### SK-005: Hardcoded Provider Selection Logic

**Severity**: :yellow_circle: Medium
**Location**: `src/bootstrap.ts:285-308`

```typescript
// Complex conditional logic for provider selection
if (MAIL_PROVIDER === 'resend' || (!MAIL_PROVIDER && RESEND_API_KEY)) {
  // ...
} else if (MAIL_PROVIDER === 'ses' || (!MAIL_PROVIDER && AWS_REGION)) {
  // ...
}

// RECOMMENDED - Use provider registry pattern
const emailProviders = {
  resend: () => RESEND_API_KEY ? createResendAdapter(...) : null,
  ses: () => AWS_REGION ? createSESAdapter(...) : null,
};

const provider = MAIL_PROVIDER
  ? emailProviders[MAIL_PROVIDER]?.()
  : Object.values(emailProviders).find(p => p());
```

---

### 5.5 Contract Pattern Analysis

#### Strengths

- [x] Consistent `defineOpMeta` pattern across all contracts
- [x] Proper `withMeta` wrapper for ts-rest integration
- [x] Complete service mapping (importPath, fn, zodBody)
- [x] Rate limiting expressions per endpoint
- [x] Factory pattern for complex handlers
- [x] Clean separation of admin vs user operations

#### Example Contract Pattern (Excellent)

```typescript
// auth.contract.ts - Demonstrates proper patterns
export const authContract = c.router({
  passwordSignUp: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/auth/password/signup",
      body: ZPasswordSignup,
      responses: { 200: z.object({...}) },
      summary: "Password signup",
    },
    defineOpMeta({
      op: "auth.password.signup",
      allowUnauthed: true,
      service: {
        importPath: "@unisane/auth",
        fn: "signup",
        zodBody: { importPath: "@unisane/auth", name: "ZPasswordSignup" },
        raw: true,
        rateKeyExpr: "['-', sha256Hex(body.email), 'auth.password.signup'].join(':')",
        extraImports: [{ importPath: "@unisane/kernel", names: ["sha256Hex"] }],
        factory: { importPath: "@unisane/auth", name: "signupFactory" },
      },
    })
  ),
});
```

---

### 5.6 Platform Configuration Analysis

#### Environment Handling (Good)

```typescript
// src/platform/init.ts - Validates required env vars
const required = ['DATABASE_URL', 'JWT_SECRET', ...];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
}
```

#### Event Registration (Excellent)

```typescript
// src/platform/events.ts - Typed event registration
export async function registerEventSchemas() {
  const { registerSchema } = await import('@unisane/kernel');

  // Each module contributes its event schemas
  registerSchema('tenant.created', ZTenantCreatedPayload);
  registerSchema('billing.subscription.created', ZSubscriptionPayload);
  // ...
}
```

---

### 5.7 Starters Checklist

#### Critical Fixes (P0)
- [ ] SK-001: Replace `as any` with proper type adapters in bootstrap
- [ ] SK-002: Add error recovery/rollback to bootstrap phases

#### High Priority (P1)
- [ ] SK-003: Remove duplicate JSDoc comments
- [ ] SK-004: Use proper global type declarations
- [ ] Add bootstrap phase telemetry (timing, failures)

#### Medium Priority (P2)
- [ ] SK-005: Extract provider selection to registry pattern
- [ ] Add contract validation tests
- [ ] Document bootstrap dependency graph
- [ ] Add retry logic for transient failures in bootstrap

#### Low Priority (P3)
- [ ] Create bootstrap diagnostic command
- [ ] Add contract coverage report
- [ ] Implement bootstrap dry-run mode
- [ ] Add startup health validation

---

## Layer 6: Foundation Extraction Analysis (Multi-Starter Perspective)

**Context**: Unisane supports multiple starter types with different business domains:
- **SaasKit** - Multi-tenant SaaS platforms (subscriptions, credits, usage)
- **CommerceKit** - E-commerce (orders, inventory, shipping)
- **CRMKit** - Customer relationship management (contacts, deals, pipelines)
- **HelpdeskKit** - Support systems (tickets, agents, SLAs)
- **MarketplaceKit** - Multi-vendor platforms (vendors, commissions, payouts)

Each kit has fundamentally different business logic. The analysis below identifies what's **truly universal** vs **SaaS-specific**.

---

### 6.1 DEFINITELY UNIVERSAL - Move to Foundation

These are platform-agnostic infrastructure needed by ALL starters:

#### FE-001: Webhook Security Utilities → @unisane/webhook-utils (NEW)
**Location**: `starters/saaskit/src/platform/webhooks/`

| File | What it does | Universal? |
|------|--------------|------------|
| `signing.ts` | HMAC-SHA256, timing-safe comparison | ✅ 100% |
| `verify.ts` | Provider signature verification | ✅ 100% |
| `outbound.ts` | SSRF guards, delivery retry | ✅ 90% (refactor settings) |

**Why universal**: Every web app needs webhook signing/verification regardless of business domain.

```typescript
// @unisane/webhook-utils
export { hmacSHA256Hex, timingSafeEqual } from './crypto';
export { verifyStripeSignature, verifyResendSignature, verifySNSSignature } from './providers';
export { createOutboundDelivery, ssrfGuard } from './outbound';
```

---

#### FE-002: useApiError Hook → @unisane/ui
**Location**: `starters/saaskit/src/hooks/use-api-error.ts` (287 lines)

**Why universal**: Error normalization, display strategies (toast/banner/redirect), field error mapping - these are pure React patterns with zero business logic.

| Feature | CommerceKit needs? | CRMKit needs? | HelpdeskKit needs? |
|---------|-------------------|---------------|-------------------|
| Error normalization | ✅ Yes | ✅ Yes | ✅ Yes |
| Toast/banner display | ✅ Yes | ✅ Yes | ✅ Yes |
| Auth redirect | ✅ Yes | ✅ Yes | ✅ Yes |
| Field error mapping | ✅ Yes | ✅ Yes | ✅ Yes |

---

#### FE-003: useIsMobile Hook → @unisane/ui
**Location**: `starters/saaskit/src/hooks/use-mobile.ts` (20 lines)

**Why universal**: Simple responsive breakpoint detection (768px). Zero business logic.

---

#### FE-004: useServerTable Hook → @unisane/ui
**Location**: `starters/saaskit/src/hooks/use-server-table.ts` (130 lines)

**Why universal**: Server-side pagination, sorting, search debouncing, URL sync. Every CRUD interface needs this.

| Starter | Use Case |
|---------|----------|
| SaasKit | User list, tenant list, audit logs |
| CommerceKit | Product list, order list, customer list |
| CRMKit | Contact list, deal list, activity log |
| HelpdeskKit | Ticket list, agent list, SLA rules |

---

#### FE-005: Tailwind Utilities → @unisane/ui
**Location**: `starters/saaskit/src/lib/utils.ts` (184 lines)

**Why universal**: `cn()` function, focus ring utilities, Material Design 3 tokens. Pure styling infrastructure.

---

#### FE-006: Permission/Feature Gates → @unisane/ui
**Location**: `starters/saaskit/src/components/guards/`

| Component | What it does | Universal? |
|-----------|--------------|------------|
| `PermissionGate.tsx` | Conditional render based on `me.perms` | ✅ 100% |
| `FeatureGate.tsx` | Conditional render based on feature flags | ✅ 100% |

**Why universal**: Access control UI patterns work identically across all starters.

---

#### FE-007: OpMeta Contract Types → @unisane/contracts
**Location**: `starters/saaskit/src/contracts/meta.ts` (97 lines)

**Why universal**: The `defineOpMeta()` and `withMeta()` pattern for route metadata is the foundation of code generation. Every starter needs this exact infrastructure.

```typescript
// @unisane/contracts
export type OpMeta = {
  op: string;
  perms?: string[];
  requireUser?: boolean;
  allowUnauthed?: boolean;
  service?: ServiceConfig;
  // ...
};
export function defineOpMeta(meta: OpMeta): OpMeta;
export function withMeta<T>(route: T, meta: OpMeta): T & { metadata: OpMeta };
```

---

#### FE-008: Telemetry Metrics Facade → @unisane/kernel
**Location**: `starters/saaskit/src/platform/telemetry/index.ts` (146 lines)

**Why universal**: Generic metrics (HTTP duration, rate limiting, errors) apply to all web apps.

| Metric | SaasKit | CommerceKit | CRMKit |
|--------|---------|-------------|--------|
| `http.server.duration_ms` | ✅ | ✅ | ✅ |
| `rate_limited_total` | ✅ | ✅ | ✅ |
| `idem_replay_total` | ✅ | ✅ | ✅ |

---

### 6.2 PATTERN IS UNIVERSAL, IMPLEMENTATION IS STARTER-SPECIFIC

These patterns should be **documented**, but code stays in each starter:

#### Bootstrap System (PATTERN ONLY)
**Location**: `starters/saaskit/src/bootstrap.ts`

| Component | SaasKit | CommerceKit | CRMKit |
|-----------|---------|-------------|--------|
| DB connection | ✅ Same | ✅ Same | ✅ Same |
| Health checks | ✅ Same | ✅ Same | ✅ Same |
| Event handlers | Billing, Credits | Orders, Inventory | Contacts, Deals |
| Providers | Stripe subscriptions | Stripe payments, Shipping | Email campaigns |

**Action**: Document bootstrap pattern, keep implementation per-starter.

---

#### Settings Definitions (PATTERN ONLY)
**Location**: `starters/saaskit/src/shared/settings/definitions.ts`

| SaasKit Settings | CommerceKit Settings | CRMKit Settings |
|------------------|----------------------|-----------------|
| `billing.mode` | `shipping.defaultCarrier` | `pipeline.defaultStages` |
| `billing.defaultCurrency` | `returns.maxDays` | `deals.defaultProbability` |
| `auth.otpTtlSeconds` | `inventory.lowStockThreshold` | `activities.autoLog` |

**Action**: Document dual-schema pattern (per-setting + transport), keep definitions per-starter.

---

#### Event Schema Registration (PATTERN ONLY)
**Location**: `starters/saaskit/src/platform/events.ts`

| SaasKit Events | CommerceKit Events | CRMKit Events |
|----------------|-------------------|---------------|
| `billing.subscription.created` | `order.created` | `deal.created` |
| `tenant.updated` | `inventory.updated` | `contact.merged` |
| `credits.consumed` | `shipment.shipped` | `activity.logged` |

**Action**: Document Zod schema registration pattern, keep events per-starter.

---

#### Cache Invalidation (PATTERN ONLY)
**Location**: `starters/saaskit/src/platform/cache-invalidation.ts`

**Pattern**: Listen to domain events → invalidate related caches

| SaasKit | CommerceKit | CRMKit |
|---------|-------------|--------|
| On `user.updated` → clear perms cache | On `product.updated` → clear catalog cache | On `contact.updated` → clear search cache |

**Action**: Document event-driven invalidation pattern, keep handlers per-starter.

---

#### Job Registry (PATTERN ONLY)
**Location**: `starters/saaskit/src/platform/jobs/registry.ts`

| SaasKit Jobs | CommerceKit Jobs | CRMKit Jobs |
|--------------|------------------|-------------|
| `usage-rollup-daily` | `inventory-sync-hourly` | `email-campaign-send` |
| `reconcile-billing` | `abandoned-cart-reminder` | `deal-stage-reminder` |
| `flags-cleanup` | `price-update-from-supplier` | `contact-dedup-weekly` |

**Action**: Document Inngest job registration pattern, keep jobs per-starter.

---

#### Session Context (PATTERN ONLY)
**Location**: `starters/saaskit/src/context/SessionContext.tsx`

**Pattern**: `SessionProvider` + `useSession()` hook is universal.

**Implementation differs**: User shape varies per starter:
- SaasKit: `{ displayName, isSuperAdmin, perms, activeTenant }`
- CommerceKit: `{ name, cart, wishlist, recentlyViewed }`
- CRMKit: `{ name, assignedDeals, pipeline, quotaUsed }`

**Action**: Document pattern, keep implementation per-starter.

---

### 6.3 DEFINITELY STARTER-SPECIFIC - Keep in SaasKit

These embed SaaS business logic and **must NOT** move to foundation:

| Component | Location | Why SaaS-Specific |
|-----------|----------|-------------------|
| **Metering Guard** | `platform/metering/guard.ts` | Token/credit/quota logic (SaaS concept) |
| **Plan Mapping** | `platform/billing/planMap.ts` | Subscription plan IDs |
| **Topup Mapping** | `platform/billing/topupMap.ts` | Credit purchase pricing |
| **Auth Config** | `platform/auth/config.ts` | SaaS-specific OAuth/JWT settings |
| **Env Validation** | `platform/env.ts` | SaaS-specific env vars |
| **Module Init** | `platform/init.ts` | SaaS module wiring |
| **All Contracts** | `contracts/*.contract.ts` | SaaS API endpoints |
| **Email Templates** | `platform/email/templates/` | SaaS branding |
| **Layout Components** | `components/layout/` | SaaS dashboard UI |
| **Tenant Hooks** | `hooks/use-tenant-*.ts` | Multi-tenant SaaS concept |

**Why keep**: CommerceKit has orders/inventory, CRMKit has contacts/deals - completely different domains.

---

### 6.4 Distribution Model Context

**IMPORTANT**: Understanding the distribution model is critical for correct extraction decisions.

```
┌─────────────────────────────────────────────────────────────────┐
│                     MONOREPO (Development)                       │
│  packages/foundation/   → Foundation layer (kernel, gateway)     │
│  packages/modules/      → Business modules (auth, billing, etc)  │
│  packages/adapters/     → Provider adapters (stripe, s3, etc)    │
│  packages/ui/core/      → UI components (SEPARATE from found.)   │
│  packages/ui/data-table/→ Data table (stays as npm package!)     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ build-starter.ts transforms
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  USER'S PROJECT (Distribution)                   │
│  src/modules/           ← Flattened from packages/foundation+mod │
│  src/adapters/          ← Flattened from packages/adapters/      │
│  src/components/ui/     ← Flattened from packages/ui/core/       │
│  @unisane/data-table    ← STAYS AS NPM PACKAGE (not flattened)   │
└─────────────────────────────────────────────────────────────────┘
```

**Key Insight**: `@unisane/ui` and `@unisane/data-table` are **independent UI packages** - they are NOT part of the foundation layer. They have their own distribution rules:
- `@unisane/ui/core` → Flattened to `src/components/ui/`
- `@unisane/data-table` → Stays as npm dependency (complex, frequently updated)

---

### 6.5 Corrected Package Plan

#### FOUNDATION LAYER (packages/foundation/)

| Package | What to Add | From SaasKit |
|---------|-------------|--------------|
| **@unisane/kernel** | Telemetry facade | `platform/telemetry/index.ts` (generic metrics only) |
| **@unisane/kernel** | Webhook crypto utils | `platform/webhooks/signing.ts` |
| **@unisane/contracts** | OpMeta types | `contracts/meta.ts` |

#### UI LAYER (packages/ui/) - INDEPENDENT, NOT FOUNDATION

| Package | What to Add | From SaasKit |
|---------|-------------|--------------|
| **@unisane/ui/core** | useApiError hook | `hooks/use-api-error.ts` |
| **@unisane/ui/core** | useIsMobile hook | `hooks/use-mobile.ts` |
| **@unisane/ui/core** | useServerTable hook | `hooks/use-server-table.ts` |
| **@unisane/ui/core** | PermissionGate | `components/guards/PermissionGate.tsx` |
| **@unisane/ui/core** | FeatureGate | `components/guards/FeatureGate.tsx` |
| **@unisane/ui/core** | cn() utilities | `lib/utils.ts` |

**Note**: UI items go to `packages/ui/core/` NOT foundation. They get flattened to `src/components/ui/` during distribution.

#### ADAPTERS LAYER (packages/adapters/) - Consider creating

| Package | What it would contain | From SaasKit |
|---------|----------------------|--------------|
| **@unisane/webhooks-verify** (optional) | Provider verification | `platform/webhooks/verify.ts` |

---

### 6.6 Corrected Extraction Checklist

#### Phase 1: Foundation Enhancements (High Priority)
- [ ] FE-001: Add to @unisane/kernel
  - [ ] Move generic telemetry helpers (`observeHttp`, `incRateLimited`)
  - [ ] Move webhook crypto utilities (`hmacSHA256Hex`, `timingSafeEqual`)
- [ ] FE-002: Add to @unisane/contracts
  - [ ] Move `defineOpMeta`, `withMeta`, `OpMeta` type

#### Phase 2: UI Package Enhancements (Separate from Foundation)
- [ ] FE-003: Add to @unisane/ui/core (NOT foundation)
  - [ ] Move `use-api-error.ts`
  - [ ] Move `use-mobile.ts`
  - [ ] Move `use-server-table.ts`
  - [ ] Move `PermissionGate.tsx`
  - [ ] Move `FeatureGate.tsx`
  - [ ] Move `lib/utils.ts` (cn function)

#### Phase 3: Pattern Documentation
- [ ] Document bootstrap pattern (for new kit creators)
- [ ] Document settings registry pattern
- [ ] Document event schema registration pattern
- [ ] Document cache invalidation pattern
- [ ] Document job registry pattern

#### Phase 4: Keep in SaasKit (No Action)
- Metering guard - SaaS-specific business logic
- Plan/topup mapping - SaaS pricing configuration
- All contracts - SaaS API endpoints
- Bootstrap implementation - SaaS module wiring
- Settings definitions - SaaS-specific settings
- Event schemas - SaaS domain events
- Job definitions - SaaS background tasks
- Email templates - SaaS branding
- Auth config - SaaS OAuth/JWT config

---

### 6.7 Impact Summary

| Previous Recommendation | Corrected Recommendation | Reason |
|------------------------|-------------------------|--------|
| Add hooks to @unisane/ui (foundation) | **Add to packages/ui/core/** | UI is separate from foundation, has own distribution |
| Create @unisane/webhook-utils | **Add crypto to @unisane/kernel** | Crypto utils are foundational, verification is adapter |
| Create @unisane/react-errors | **Add to packages/ui/core/** | React hooks belong in UI package |
| Create @unisane/bootstrap | **Not needed** | Pattern docs sufficient, each kit has different wiring |
| Create @unisane/data-table (new) | **Already exists** | Stays as npm, not flattened |

### 6.8 Final Extraction Count

**Actual items to move to FOUNDATION (packages/foundation/)**: **3 items**
1. Telemetry helpers → @unisane/kernel
2. Webhook crypto → @unisane/kernel
3. OpMeta types → @unisane/contracts

**Items to move to UI (packages/ui/core/)**: **6 items** (separate from foundation)
1. useApiError hook
2. useIsMobile hook
3. useServerTable hook
4. PermissionGate component
5. FeatureGate component
6. cn() utilities

**Pattern documentation needed**: **5 patterns**
- Bootstrap, Settings, Events, Cache Invalidation, Jobs

---

## Final Summary

### Overall Architecture Score: 7.6/10

| Layer | Score | Status | Key Issue |
|-------|-------|--------|-----------|
| Foundation (Kernel) | 8.5/10 | :white_check_mark: Production Ready | Silent cache fallback |
| Foundation (Gateway) | 7.4/10 | :warning: Needs Improvement | 150+ lines duplicated |
| Foundation (Contracts) | 7.0/10 | :warning: Needs Improvement | Schema duplication |
| Adapters | 7.2/10 | :warning: Needs Improvement | Missing resilience |
| Modules | 7.5/10 | :warning: Needs Improvement | Direct inter-module imports |
| DevTools | 7.8/10 | :white_check_mark: Good | Silent metadata failures |
| Starters | 7.8/10 | :white_check_mark: Good | Type safety gaps |

### Hexagonal Architecture Compliance

```
                     ┌───────────────────────────────────────┐
                     │          EXTERNAL WORLD               │
                     │   (HTTP, WebSockets, CLI, Jobs)       │
                     └───────────────┬───────────────────────┘
                                     │
                     ┌───────────────▼───────────────────────┐
                     │           GATEWAY (85%)               │
                     │   Handler, Auth, Guards, Middleware   │
                     └───────────────┬───────────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
┌─────────▼─────────┐    ┌───────────▼───────────┐    ┌─────────▼─────────┐
│  ADAPTERS (90%)   │    │   MODULES (70%) ⚠️   │    │  ADAPTERS (90%)   │
│ billing-stripe    │    │ auth, identity       │    │ storage-s3        │
│ billing-razorpay  │    │ tenants, billing     │    │ storage-gcs       │
│ email-resend      │    │ credits, usage       │    │ storage-local     │
│ email-ses         │    │ flags, audit         │    │ database-mongodb  │
└─────────┬─────────┘    │ settings, storage    │    └─────────┬─────────┘
          │              │ notify, webhooks     │              │
          │              │ media, pdf, ai       │              │
          │              └───────────┬───────────┘              │
          │                          │                          │
          └──────────────────────────┼──────────────────────────┘
                                     │
                     ┌───────────────▼───────────────────────┐
                     │          KERNEL (95%)                 │
                     │  Ports, Events, Scope, Cache, DB      │
                     └───────────────────────────────────────┘

Legend: (%) = Hexagonal Compliance Score
        ⚠️  = Needs Attention
```

### Critical Issues Summary (P0)

| # | Issue ID | Description | Impact |
|---|----------|-------------|--------|
| 1 | K-001 | Silent cache fallback | Data corruption risk |
| 2 | BR-001 | Razorpay portal throws | Contract violation |
| 3 | BR-002 | Razorpay updatePlan throws | Contract violation |
| 4 | SG-002 | GCS no resilience | Inconsistent behavior |
| 5 | C-001 | ZAdminStatsQuery 3x | Semantic confusion |
| 6 | M-001 | Direct inter-module imports | Hexagonal violation |
| 7 | DT-001 | Silent metadata skipping | Missing routes |

### What's Working Well

1. **Universal Scope System**: AsyncLocalStorage-based context works excellently for multi-tenant isolation
2. **Event-Driven Architecture**: Typed events with proper handler registration/cleanup
3. **Contract-First Development**: `defineOpMeta` pattern enables powerful code generation
4. **Port/Adapter Pattern**: 8 well-defined ports in kernel with clean implementations
5. **Type Safety**: Comprehensive Zod validation throughout the stack
6. **Error Handling**: Proper domain errors with codes and HTTP status mapping

### What Needs Improvement

1. **Module Layer Coupling**: 5 direct inter-module imports violate hexagonal architecture
2. **Missing Adapters**: 9 modules lack proper port/adapter abstraction
3. **Resilience Inconsistency**: Only 50% of adapters have circuit breaker + retry
4. **Silent Failures**: Multiple layers swallow errors without logging
5. **No DI Framework**: Manual wiring in bootstrap is error-prone
6. **Test Coverage**: Unknown coverage across most layers

### Recommended Roadmap (Properly Sequenced)

**CRITICAL**: Phases must be done IN ORDER. Later phases depend on earlier phases.

#### Phase 0: Prerequisites (Before Any Fixes)
> **Why first**: Cannot fix module coupling without these ports existing

- [ ] **P0-1**: Create new kernel ports (Section 3.9)
  - [ ] Create `CreditsPort` in `kernel/src/ports/credits.port.ts`
  - [ ] Create `AuditPort` in `kernel/src/ports/audit.port.ts`
  - [ ] Create `UsagePort` in `kernel/src/ports/usage.port.ts`
  - [ ] Create `NotifyPort` in `kernel/src/ports/notify.port.ts`
  - [ ] Create `TenantsQueryPort` in `kernel/src/ports/tenants-query.port.ts`
  - [ ] Export all ports from `kernel/src/ports/index.ts`
  - [ ] Export port setters/getters from `kernel/src/index.ts`
- [ ] **P0-2**: Define standard resilience config in kernel
  - [ ] Create `kernel/src/resilience/standard.ts`
  - [ ] Export `ADAPTER_RESILIENCE_STANDARD`
  - [ ] Export `createResilientAdapter()` factory
- [ ] **P0-3**: Create test mocks for all ports
  - [ ] Create `kernel/src/testing/mocks.ts`
  - [ ] Export `createMock*Port()` for each port

#### Phase 1: Critical Fixes (Foundation Layer)
> **Why second**: Foundation must be solid before modules can use it

- [ ] **P1-1**: Fix silent failures
  - [ ] K-001: Remove silent cache fallback - log and throw
  - [ ] DT-001: Track and report skipped metadata entries
- [ ] **P1-2**: Fix contract violations
  - [ ] BR-001: Fix Razorpay `createPortalSession()` - return fallback URL
  - [ ] BR-002: Fix Razorpay `updateSubscriptionPlan()` - implement or throw typed error
  - [ ] C-001: Rename duplicate `ZAdminStatsQuery` schemas
- [ ] **P1-3**: Add resilience to adapters
  - [ ] SG-002: Add resilience wrapper to storage-gcs
  - [ ] SL-001: Add resilience wrapper to storage-local
  - [ ] ER-001: Add timeout to email-resend
  - [ ] ES-001: Standardize circuit breaker threshold to 5

#### Phase 2: Module Decoupling (Hexagonal Compliance)
> **Why third**: Requires ports from Phase 0, foundation fixes from Phase 1

- [ ] **P2-1**: Wire new ports in bootstrap
  - [ ] Add `setupModulePorts()` to `bootstrap.ts` (see Section 3.9)
  - [ ] Wire CreditsPort, AuditPort, UsagePort, NotifyPort, TenantsQueryPort
- [ ] **P2-2**: Fix inter-module imports (M-001)
  - [ ] AI-001: Replace `@unisane/flags` with `getFlagsPort()`
  - [ ] AI-002: Replace `@unisane/billing` with `getBillingPort()`
  - [ ] BILL-001: Replace `@unisane/flags` with `getFlagsPort()`
  - [ ] WH-001: Replace `@unisane/settings` with `getSettingsPort()`
- [ ] **P2-3**: Fix cross-module type dependencies (M-002)
  - [ ] BILL-002: Define `SubscriptionView` locally instead of importing `LatestSub`
  - [ ] Move shared types to kernel if truly shared

#### Phase 3: Code Quality & DX
> **Why fourth**: Architecture is stable, now improve quality

- [ ] **P3-1**: Reduce code duplication
  - [ ] G-001: Extract shared handler logic to `_setupHandler()`
  - [ ] G-004: Consolidate `guard.ts` and `tsrest.ts`
  - [ ] BS-003: Extract shared HTTP client for billing adapters
- [ ] **P3-2**: Fix security issues
  - [ ] G-002: Use allowlist for dev environment detection
  - [ ] DM-001: Fix MongoDB connection race condition
- [ ] **P3-3**: Standardize patterns
  - [ ] C-002: Standardize pagination limits (max 100 default)
  - [ ] C-003: Add ErrorCode enum validation
  - [ ] K-004: Consolidate 27 constant files into 4 groups

#### Phase 4: Logging & Observability
> **Why fifth**: Need stable architecture to add meaningful observability

- [ ] **P4-1**: Add structured logging to all adapters
  - [ ] Add logger to billing-stripe, billing-razorpay
  - [ ] Add logger to email-resend, email-ses
  - [ ] Add logger to storage-s3, storage-gcs, storage-local
  - [ ] Add logger to database-mongodb, outbox-mongodb
  - [ ] Add logger to jobs-inngest
- [ ] **P4-2**: Add logging to module services
  - [ ] Standardize logging format across modules
  - [ ] Add request context to all logs

#### Phase 5: Testing
> **Why sixth**: Need stable, logged code to write meaningful tests

- [ ] **P5-1**: Unit tests for kernel
  - [ ] Test all ports with mocks
  - [ ] Test event emitter
  - [ ] Test cache providers
  - [ ] Target: 80% coverage
- [ ] **P5-2**: Unit tests for adapters
  - [ ] Test each adapter against port interface
  - [ ] Test resilience behavior
  - [ ] Target: 60% coverage
- [ ] **P5-3**: Integration tests for modules
  - [ ] Test module services with real ports
  - [ ] Test event handler flows
  - [ ] Target: 70% coverage

#### Phase 6: Documentation & DevTools
> **Why last**: Document the final, stable architecture

- [ ] **P6-1**: DevTools improvements
  - [ ] DT-002: Auto-check/build contracts before generation
  - [ ] DT-003: Add Zod validator for defineOpMeta
  - [ ] DT-005: Implement content comparison before file writes
- [ ] **P6-2**: Pattern documentation
  - [ ] Document bootstrap pattern for new kit creators
  - [ ] Document event schema ownership model
  - [ ] Document port/adapter pattern with examples
- [ ] **P6-3**: Foundation extraction (Layer 6)
  - [ ] Move telemetry helpers to @unisane/kernel
  - [ ] Move webhook crypto to @unisane/kernel
  - [ ] Move OpMeta types to @unisane/contracts
  - [ ] Move UI hooks to @unisane/ui/core

---

### Phase Dependencies Diagram

```
Phase 0 (Prerequisites)
    │
    │ creates ports
    ▼
Phase 1 (Critical Fixes)
    │
    │ foundation stable
    ▼
Phase 2 (Module Decoupling)
    │
    │ hexagonal achieved
    ▼
Phase 3 (Code Quality)
    │
    │ clean code
    ▼
Phase 4 (Observability)
    │
    │ debuggable
    ▼
Phase 5 (Testing)
    │
    │ verified
    ▼
Phase 6 (Documentation)
    │
    ▼
100% HEXAGONAL ✓
```

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2025-01-15 | 1.0 | Initial audit - Foundation + Adapters layers |
| 2025-01-15 | 1.1 | Added Layer 3 (Modules) analysis |
| 2025-01-15 | 1.2 | Added Layer 4 (DevTools/Codegen) analysis |
| 2025-01-15 | 1.3 | Added Layer 5 (Starters/Contracts) + Final Summary |
| 2025-01-15 | 1.4 | Added Layer 6 (Foundation Extraction Candidates) |
| 2025-01-15 | 1.5 | **CORRECTED** Layer 6 with multi-starter analysis (SaasKit/CommerceKit/CRMKit perspective) |
| 2025-01-15 | 1.6 | **RE-CORRECTED** Layer 6 with distribution model context - UI is separate from foundation |
| 2025-01-15 | 2.0 | **MAJOR UPDATE**: Added missing sections for 100% hexagonal compliance |

---

> **Audit Complete**: This document contains a comprehensive, actionable plan for achieving 100% hexagonal architecture.
>
> **Version 2.0 Additions**:
> - Section 3.9: NEW KERNEL PORTS REQUIRED (5 new ports)
> - Section 3.10: Allowed vs Prohibited Dependencies (visual guide)
> - Cross-Cutting: Adapter Resilience Standard
> - Cross-Cutting: Event Schema Ownership Model
> - Cross-Cutting: Test Strategy with mock patterns
> - Roadmap: Properly sequenced 7-phase plan (Phase 0-6)
>
> **Key Insights**:
> - **Phase 0 MUST come first** - create 5 new kernel ports before fixing module coupling
> - Only **3 items** should move to FOUNDATION (kernel, contracts)
> - **6 items** should move to UI package (packages/ui/core/) - separate from foundation
> - **5 patterns** should be documented for new kit creators
> - `@unisane/data-table` stays as npm package (not flattened)
>
> **After completing all phases**: 100% hexagonal, zero coupling, fully testable, well-documented
