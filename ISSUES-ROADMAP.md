# Unisane: Issues & Improvements Roadmap

> Generated from comprehensive codebase analysis
> Priority: P0 (Critical) → P1 (High) → P2 (Medium) → P3 (Low)

---

## ⚠️ Before Starting Any Phase

**IMPORTANT: Verify before implementing!**

Before starting work on any task or phase in this roadmap:

1. **Re-analyze the current state** — The codebase evolves. Re-read relevant files to understand what exists now.
2. **Validate the proposed approach** — Confirm the solution still makes sense given current architecture.
3. **Check for existing implementations** — Something may have been added since this roadmap was created.
4. **Identify dependencies** — Ensure prerequisite tasks are complete.
5. **Get confirmation** — Discuss the implementation plan before writing code.

> Do NOT blindly follow this document. Treat each task as a starting point for investigation, not a final specification.

---

## Summary

| Priority      | Count | Effort Estimate |
| ------------- | ----- | --------------- |
| P0 - Critical | 4     | ~2-3 weeks      |
| P1 - High     | 8     | ~3-4 weeks      |
| P2 - Medium   | 12    | ~4-6 weeks      |
| P3 - Low      | 10    | ~2-3 weeks      |

---

## P0 - Critical (Fix Before Production)

### 1. [P0-001] Add Test Infrastructure & Coverage

**Problem**: Test directories are empty. No automated testing visible.

**Location**: All packages under `packages/`

**Risk**: Bugs in production, regression issues, unsafe refactoring

**Tasks**:

- [ ] Set up Vitest configuration at monorepo root
- [ ] Add unit tests for kernel (context, database, cache, events)
- [ ] Add unit tests for gateway (handlers, middleware, auth)
- [ ] Add integration tests for each module
- [ ] Add E2E tests for critical flows (auth, billing, tenants)
- [ ] Set up CI pipeline for test runs
- [ ] Add coverage thresholds (suggest: 80% for kernel/gateway)

**Module Test Checklist** (unit + integration tests per module):

| # | Package | Test Focus Areas | Status |
|---|---------|------------------|--------|
| 1 | `kernel` | context, database, cache, events, logging, RBAC | [ ] |
| 2 | `gateway` | handlers, middleware, auth, rate limiting, errors | [ ] |
| 3 | `contracts` | schema validation, type exports | [ ] |
| 4 | `auth` | signin, signup, password reset, OTP, token refresh | [ ] |
| 5 | `identity` | user CRUD, memberships, API keys, invites | [ ] |
| 6 | `tenants` | tenant CRUD, slug validation, tenant switching | [ ] |
| 7 | `billing` | subscriptions, payments, invoices, Stripe integration | [ ] |
| 8 | `credits` | ledger operations, balance calculations, deduction | [ ] |
| 9 | `flags` | feature flag CRUD, flag evaluation, overrides | [ ] |
| 10 | `settings` | settings CRUD, key validation | [ ] |
| 11 | `storage` | file upload, download, deletion, presigned URLs | [ ] |
| 12 | `audit` | log creation, log retrieval, filtering | [ ] |
| 13 | `notify` | notification create, preferences, in-app delivery | [ ] |
| 14 | `usage` | usage recording, aggregation, limits | [ ] |
| 15 | `webhooks` | webhook CRUD, event dispatch, retry logic | [ ] |
| 16 | `ai` | AI service calls, prompt handling | [ ] |
| 17 | `media` | media processing, transformations | [ ] |
| 18 | `pdf` | PDF generation, templates | [ ] |

**E2E Test Flows** (critical user journeys):

| # | Flow | Modules Involved | Status |
|---|------|------------------|--------|
| 1 | Sign up → Verify email → Create tenant | auth, identity, tenants | [ ] |
| 2 | Sign in → Access dashboard → Switch tenant | auth, identity, tenants | [ ] |
| 3 | Subscribe to plan → Payment → Access features | billing, credits, flags | [ ] |
| 4 | Upload file → Process → Download | storage, media | [ ] |
| 5 | Invite member → Accept → Access tenant | identity, tenants, notify | [ ] |
| 6 | Create API key → Make API call → Verify audit | identity, gateway, audit | [ ] |

**Questions for you**:

1. What's your target test coverage percentage?
   Ans: right now we can target core system.
2. Do you have existing tests elsewhere not in the repo?
   Ans: Nowhere else.
3. Preferred E2E framework: Playwright, Cypress, or other?
   Ans: not sure.

---

### 2. [P0-002] ~~Fix Type Safety in Generated Code~~ → **MOVED TO P2**

> **INVESTIGATION RESULT**: The `as unknown` casts are **NECESSARY**, not a bug.

**Why casts exist (investigated)**:
1. Query/body parameters extracted as `unknown` from dynamic sources
2. Conditional spreads create type inference uncertainty for TypeScript
3. Generator can't statically infer field types from Zod schemas
4. Runtime safety IS maintained - Zod validates at runtime

**Verdict**: This is working as designed. The cast bridges codegen-time and runtime type systems.

**Moved to P2-001** with reduced scope: Improve generated code readability, not remove casts.

---

### 3. [P0-003] Add Input Sanitization Layer

**Problem**: No visible XSS/injection sanitization before data storage.

**Location**: Gateway layer, before data reaches services

**Risk**: XSS attacks, stored injection vulnerabilities

**Tasks**:

- [ ] Audit all user input paths
- [ ] Add sanitization middleware/utility
- [ ] Sanitize HTML in string fields (or reject)
- [ ] Add CSP headers in responses
- [ ] Document which fields allow HTML (if any)

**Questions for you**:

1. Are there any fields that intentionally allow HTML/markdown?
   Ans: right now no.
2. Do you use a rich text editor anywhere that needs HTML?
   Ans: Not right now but will needed in future.

---

### 4. [P0-004] Secure Secrets Handling Audit

**Problem**: Need to verify no secrets leak in logs/errors.

**Location**: Throughout codebase

**Risk**: Credential exposure, security breach

**Tasks**:

- [ ] Audit logger calls for sensitive data
- [ ] Ensure passwords/tokens never logged
- [ ] Add redaction for sensitive fields in error responses
- [ ] Verify `.env` files are gitignored
- [ ] Add secret scanning to CI (e.g., gitleaks)

**Questions for you**:

1. Do you have a secrets management system (Vault, AWS Secrets Manager)?
   Ans: No
2. Are there any known places where sensitive data might be logged?
   Ans: no.

---

## P1 - High Priority (Fix Within First Sprint)

### 5. [P1-001] Add OpenTelemetry Tracing

**Problem**: No distributed tracing for debugging production issues.

**Location**: New addition to `packages/foundation/kernel/src/observability/`

**Impact**: Can't trace requests across services, hard to debug latency

**Tasks**:

- [ ] Add OpenTelemetry SDK dependencies
- [ ] Create tracing module in kernel
- [ ] Instrument HTTP handlers (gateway)
- [ ] Instrument database calls
- [ ] Instrument external service calls (Stripe, etc.)
- [ ] Add trace ID to logs
- [ ] Document tracing setup for different backends (Jaeger, Datadog, etc.)

**Suggested Implementation**:

```typescript
// kernel/src/observability/tracing.ts
import { trace, SpanKind } from "@opentelemetry/api";
export const tracer = trace.getTracer("@unisane/kernel");

export function withSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      return await fn();
    } finally {
      span.end();
    }
  });
}
```

**Questions for you**:

1. What observability backend do you plan to use? (Datadog, Grafana, Jaeger, etc.)
   Ans: Need flexible to switch.
2. Should tracing be opt-in or always-on?
   Ans: opt-in

---

### 6. [P1-002] Add Health Check Endpoints with Dependency Checks

**Problem**: Current health check only pings, doesn't verify dependencies.

**Location**: `starters/saaskit/src/app/api/health/route.ts`

**Impact**: K8s may route traffic to unhealthy instances

**Tasks**:

- [ ] Add MongoDB connectivity check
- [ ] Add Redis connectivity check
- [ ] Add Stripe API check (lightweight)
- [ ] Create `/health/live` (basic) and `/health/ready` (full) endpoints
- [ ] Add timeout handling for each check
- [ ] Return structured health response

**Suggested Response**:

```json
{
  "status": "healthy",
  "checks": {
    "mongodb": { "status": "up", "latencyMs": 12 },
    "redis": { "status": "up", "latencyMs": 3 },
    "stripe": { "status": "up", "latencyMs": 89 }
  },
  "version": "1.0.0",
  "uptime": 3600
}
```

---

### 7. [P1-003] Add Circuit Breaker Pattern

**Problem**: No resilience patterns for external service failures.

**Location**: Kernel layer, wrapping external calls

**Impact**: Cascading failures when Stripe/external services are down

**Tasks**:

- [ ] Add circuit breaker library (opossum or cockatiel)
- [ ] Wrap billing provider calls
- [ ] Wrap email provider calls
- [ ] Wrap storage provider calls
- [ ] Add metrics for circuit state
- [ ] Document failure modes and fallbacks

**External Service Integration Checklist** (wrap each with circuit breaker):

| # | Module | External Service | Fallback Strategy | Status |
|---|--------|------------------|-------------------|--------|
| 1 | `billing` | Stripe API (payments, subscriptions) | Queue & retry | [ ] |
| 2 | `billing` | Stripe Webhooks (signature verify) | Log & alert | [ ] |
| 3 | `notify` | Email provider (Resend/SendGrid) | Queue for retry | [ ] |
| 4 | `notify` | SMS provider (Twilio) | Queue for retry | [ ] |
| 5 | `notify` | Push provider (FCM/APNS) | Queue for retry | [ ] |
| 6 | `storage` | S3/Cloud Storage (upload/download) | Return error, no queue | [ ] |
| 7 | `ai` | OpenAI/Anthropic API | Return error with fallback msg | [ ] |
| 8 | `media` | Image processing service | Skip processing, serve original | [ ] |
| 9 | `pdf` | PDF generation service | Queue for retry | [ ] |
| 10 | `webhooks` | Outbound webhook delivery | Exponential backoff retry | [ ] |
| 11 | `auth` | OAuth providers (Google, GitHub) | Return error | [ ] |

**Questions for you**:

1. What should happen when Stripe is down? Queue requests? Return error?
   Ans: Do what best practice, top platforms do.
2. Same question for email - queue or fail?
   Ans: Same answer above.

---

### 8. [P1-004] Fix Memory Leak Risk in Event System

**Problem**: Event handlers may accumulate without proper cleanup.

**Location**: `packages/foundation/kernel/src/events/emitter.ts`

**Current Code** (from analysis):

```typescript
events.on("event", handler); // Returns unsubscribe function
// If caller doesn't store and call unsubscribe, handlers accumulate
```

**Tasks**:

- [ ] Verify handler limit warning is enforced
- [ ] Add handler count to health metrics
- [ ] Add automatic cleanup for module-scoped handlers
- [ ] Document proper subscription lifecycle
- [ ] Consider WeakRef for handler storage where appropriate

---

### 9. [P1-005] Create Repository Base Class to Reduce Duplication

**Problem**: Repetitive mapping code in every MongoDB repository.

**Location**: All files matching `packages/modules/*/src/data/*.repository.mongo.ts`

**Current Pattern** (repeated everywhere):

```typescript
const base: Record<string, unknown> = {
  id: String((row as { _id?: unknown })._id ?? ""),
  userId: String((row as { userId?: unknown }).userId ?? ""),
  // ... same defensive casting pattern
};
```

**Tasks**:

- [ ] Create `MongoRepository<TDoc, TView>` base class in kernel
- [ ] Implement common CRUD operations
- [ ] Create `DocumentMapper<TDoc, TView>` utility
- [ ] Add soft-delete helpers to base class
- [ ] Add tenant-scoped query helpers

**Module Migration Checklist** (12 modules with repositories):

| # | Module | Repository Files | Status |
|---|--------|------------------|--------|
| 1 | `auth` | `auth.repository.mongo.ts` | [ ] |
| 2 | `identity` | `users.repository.mongo.ts`, `memberships.repository.mongo.ts`, `apikeys.repository.mongo.ts` | [ ] |
| 3 | `tenants` | `tenants.repository.mongo.ts` | [ ] |
| 4 | `billing` | `payments.repository.mongo.ts`, `invoices.repository.mongo.ts`, `subscriptions.repository.mongo.ts` | [ ] |
| 5 | `credits` | `credits.repository.mongo.ts` | [ ] |
| 6 | `flags` | `flags.repository.mongo.ts` | [ ] |
| 7 | `settings` | `settings.repository.mongo.ts` | [ ] |
| 8 | `storage` | `storage.repository.mongo.ts` | [ ] |
| 9 | `audit` | `audit.repository.mongo.ts` | [ ] |
| 10 | `notify` | `notify.repository.mongo.ts` | [ ] |
| 11 | `usage` | `usage.repository.mongo.ts` | [ ] |
| 12 | `webhooks` | `webhooks.repository.mongo.ts` | [ ] |

**Suggested Implementation**:

```typescript
// kernel/src/database/base-repository.ts
export abstract class MongoRepository<TDoc, TView> {
  protected abstract collectionName: string;
  protected abstract toView(doc: TDoc): TView;
  protected abstract toDoc(view: Partial<TView>): Partial<TDoc>;

  protected col() {
    return col<TDoc>(this.collectionName);
  }

  async findById(id: string): Promise<TView | null> {
    const doc = await this.col().findOne({ _id: maybeObjectId(id) });
    return doc ? this.toView(doc) : null;
  }
  // ... common operations
}
```

---

### 10. [P1-006] Centralize Collection Names

**Problem**: Collection names as magic strings scattered across codebase.

**Location**: Various repository files

**Current**:

```typescript
col("authcredentials"); // auth module
col("users"); // identity module
col("tenants"); // tenants module
// etc.
```

**Tasks**:

- [ ] Create `COLLECTIONS` constant in kernel
- [ ] Add TypeScript type for collection names
- [ ] Document all collections

**Module Update Checklist** (update `col()` calls):

| # | Module | Collection(s) | Status |
|---|--------|---------------|--------|
| 1 | `auth` | `authcredentials` | [ ] |
| 2 | `identity` | `users`, `memberships`, `api_keys` | [ ] |
| 3 | `tenants` | `tenants` | [ ] |
| 4 | `billing` | `payments`, `invoices`, `subscriptions`, `tenant_integrations` | [ ] |
| 5 | `credits` | `credit_ledger` | [ ] |
| 6 | `flags` | `feature_flags`, `flag_overrides` | [ ] |
| 7 | `settings` | `settings_kv` | [ ] |
| 8 | `storage` | `files` | [ ] |
| 9 | `audit` | `audit_logs` | [ ] |
| 10 | `notify` | `inapp_notifications`, `notification_preferences` | [ ] |
| 11 | `usage` | `usage_records` | [ ] |
| 12 | `webhooks` | `webhooks`, `webhook_events` | [ ] |
| 13 | `kernel` | `_outbox`, `_dead_letter` | [ ] |

**Implementation**:

```typescript
// kernel/src/database/collections.ts
export const COLLECTIONS = {
  // Auth
  AUTH_CREDENTIALS: "authcredentials",

  // Identity
  USERS: "users",
  MEMBERSHIPS: "memberships",
  API_KEYS: "api_keys",

  // Tenants
  TENANTS: "tenants",

  // Billing
  PAYMENTS: "payments",
  INVOICES: "invoices",
  SUBSCRIPTIONS: "subscriptions",
  TENANT_INTEGRATIONS: "tenant_integrations",

  // Credits
  CREDIT_LEDGER: "credit_ledger",

  // Flags
  FEATURE_FLAGS: "feature_flags",
  FLAG_OVERRIDES: "flag_overrides",

  // Settings
  SETTINGS_KV: "settings_kv",

  // Storage
  FILES: "files",

  // Audit
  AUDIT_LOGS: "audit_logs",

  // Notify
  INAPP_NOTIFICATIONS: "inapp_notifications",
  NOTIFICATION_PREFERENCES: "notification_preferences",

  // Usage
  USAGE_RECORDS: "usage_records",

  // Webhooks
  WEBHOOKS: "webhooks",
  WEBHOOK_EVENTS: "webhook_events",

  // Kernel/System
  OUTBOX: "_outbox",
  DEAD_LETTER: "_dead_letter",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
```

---

### 11. [P1-007] Fix Rate Limit Key Collision Risk

**Problem**: Rate limit keys may collide if userId/tenantId is undefined.

**Location**: `packages/foundation/gateway/src/middleware/rateLimit.ts`

**Current Key Pattern**:

```typescript
// Key: rl:{tenantId}:{userId}:{opName}:{windowStart}
// If userId is undefined: rl:tenant123:undefined:auth.signin:1234567890
```

**Tasks**:

- [ ] Add validation for key components
- [ ] Use sentinel values for anonymous users (e.g., `anon` or IP hash)
- [ ] Add key format documentation
- [ ] Add tests for edge cases

---

### 12. [P1-008] Add Request Validation Middleware for Path Params

**Problem**: Path parameters validated in Zod but not consistently enforced.

**Location**: Gateway layer

**Tasks**:

- [ ] Ensure all path params validated before handler
- [ ] Add consistent error responses for invalid params
- [ ] Document param validation patterns

---

## P2 - Medium Priority (Fix Within Month)

### 13. [P2-001] Improve Generated Code Formatting

**Problem**: Generated code has awkward formatting.

**Location**: `packages/tooling/devtools/src/generators/routes/render.ts`

**Current Output**:

```typescript
async ({ req, params, body, ctx, requestId }) => {const __body: z.output<typeof __BodySchema_POST> = body!;
```

**Tasks**:

- [ ] Add proper newlines after arrow function
- [ ] Indent body code properly
- [ ] Consider using Prettier API for formatting
- [ ] Add formatting tests

---

### 14. [P2-002] Add Schema Registry for Events

**Problem**: Event schemas registered at runtime, no central registry.

**Location**: `packages/foundation/kernel/src/events/`

**Tasks**:

- [ ] Create event schema registry file
- [ ] Document all event types and payloads
- [ ] Add compile-time event type checking
- [ ] Generate event documentation

---

### 15. [P2-003] Standardize Null Handling Conventions

**Problem**: Inconsistent null vs throw patterns across codebase.

**Examples**:

```typescript
// Pattern 1: Return null
if (!row) return null;

// Pattern 2: Throw error
if (!row) throw new NotFoundError();
```

**Tasks**:

- [ ] Document when to return null vs throw
- [ ] Convention: `findX` returns null, `getX` throws
- [ ] Add linting rule if possible

**Module Audit Checklist**:

| # | Module | Services to Audit | Status |
|---|--------|-------------------|--------|
| 1 | `auth` | `signin`, `signup`, `resetVerify`, `otpVerify` | [ ] |
| 2 | `identity` | `getUser`, `findUserByEmail`, `getMembership` | [ ] |
| 3 | `tenants` | `getCurrentTenant`, `readTenant`, `findBySlug` | [ ] |
| 4 | `billing` | `getSubscription`, `getPayment`, `getInvoice` | [ ] |
| 5 | `credits` | `getBalance`, `getLedgerEntry` | [ ] |
| 6 | `flags` | `getFlag`, `getFlagValue` | [ ] |
| 7 | `settings` | `getSetting`, `getSettings` | [ ] |
| 8 | `storage` | `getFile`, `getFileMetadata` | [ ] |
| 9 | `audit` | `getAuditEntry` | [ ] |
| 10 | `notify` | `getNotification`, `getPreferences` | [ ] |
| 11 | `usage` | `getUsageRecord` | [ ] |
| 12 | `webhooks` | `getWebhook`, `getWebhookEvent` | [ ] |
| 13 | `gateway` | `getAuthCtx`, error handlers | [ ] |
| 14 | `kernel` | `ctx.get()`, `getTenantId()`, `getUserId()` | [ ] |

---

### 16. [P2-004] Add Database Transaction Support

**Problem**: Multi-document operations not atomic.

**Location**: Services that update multiple collections

**Example**: Tenant deletion updates multiple collections without transaction.

**Tasks**:

- [ ] Add transaction helper to kernel
- [ ] Identify operations needing transactions
- [ ] Wrap critical operations in transactions
- [ ] Document transaction patterns

**Implementation**:

```typescript
// kernel/src/database/transactions.ts
export async function withTransaction<T>(
  fn: (session: ClientSession) => Promise<T>
): Promise<T> {
  const client = getClient();
  const session = client.startSession();
  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

---

### 17. [P2-005] Add API Versioning Strategy

**Problem**: API versioned in path (`/api/rest/v1/`) but no migration strategy.

**Tasks**:

- [ ] Document versioning policy
- [ ] Plan v1 → v2 migration path
- [ ] Add version negotiation (Accept header?)
- [ ] Add deprecation warning headers

**Questions for you**:

1. What's your API versioning philosophy? (URL path, header, query param?)
   Ans: we need what scale better and version proof and future proof less chances of braks, but will work smooth with our system. need deep investigation.
2. How long should old versions be supported?
   Ans: as max we can.

---

### 18. [P2-006] Add Request/Response Logging Middleware

**Problem**: No structured request/response logging for debugging.

**Tasks**:

- [ ] Log request method, path, duration
- [ ] Log response status code
- [ ] Add correlation ID throughout
- [ ] Make body logging configurable (security)
- [ ] Add log sampling for high-traffic endpoints

---

### 19. [P2-007] Improve Error Messages for Developers

**Problem**: Some errors are generic, hard to debug.

**Example**:

```typescript
throw new Error("filters must be valid JSON or base64url JSON");
// Doesn't say which field failed or what was received
```

**Tasks**:

- [ ] Audit error messages for debugging clarity
- [ ] Include relevant context in errors
- [ ] Add error codes for programmatic handling
- [ ] Create error message style guide

---

### 20. [P2-008] Add Soft Delete Consistency

**Problem**: Soft delete pattern used but not consistently.

**Current**:

```typescript
// Some queries filter deletedAt
$or: [{ deletedAt: null }, { deletedAt: { $exists: false } }];

// Some don't
```

**Tasks**:

- [ ] Audit all queries for soft delete handling
- [ ] Create `withSoftDelete()` query helper
- [ ] Document soft delete conventions
- [ ] Add hard delete capability for GDPR

**Module Soft Delete Audit Checklist**:

| # | Module | Collections | Needs Soft Delete? | Audit Status |
|---|--------|-------------|-------------------|--------------|
| 1 | `auth` | `authcredentials` | Yes (preserve audit trail) | [ ] |
| 2 | `identity` | `users` | Yes (GDPR, but preserve ID) | [ ] |
| 3 | `identity` | `memberships` | Yes (audit trail) | [ ] |
| 4 | `identity` | `api_keys` | Yes (revocation tracking) | [ ] |
| 5 | `tenants` | `tenants` | Yes (data preservation) | [ ] |
| 6 | `billing` | `subscriptions` | Yes (billing history) | [ ] |
| 7 | `billing` | `payments` | No (immutable records) | [ ] |
| 8 | `billing` | `invoices` | No (immutable records) | [ ] |
| 9 | `credits` | `credit_ledger` | No (immutable ledger) | [ ] |
| 10 | `flags` | `feature_flags` | Yes (restore capability) | [ ] |
| 11 | `flags` | `flag_overrides` | Yes (restore capability) | [ ] |
| 12 | `settings` | `settings_kv` | Yes (restore capability) | [ ] |
| 13 | `storage` | `files` | Yes (undelete period) | [ ] |
| 14 | `audit` | `audit_logs` | No (immutable by design) | [ ] |
| 15 | `notify` | `inapp_notifications` | Yes (restore capability) | [ ] |
| 16 | `notify` | `notification_preferences` | Yes | [ ] |
| 17 | `usage` | `usage_records` | No (immutable metrics) | [ ] |
| 18 | `webhooks` | `webhooks` | Yes (restore capability) | [ ] |
| 19 | `webhooks` | `webhook_events` | No (immutable log) | [ ] |

**Query Patterns to Update**:
- [ ] All `findOne()` calls must filter `deletedAt: null`
- [ ] All `find()` calls must filter `deletedAt: null`
- [ ] All `count()` calls must filter `deletedAt: null`
- [ ] Add `findIncludingDeleted()` for admin purposes
- [ ] Add `hardDelete()` for GDPR right-to-erasure

---

### 21. [P2-009] Add Pagination Consistency

**Problem**: Mixed pagination patterns (offset vs cursor).

**Tasks**:

- [ ] Standardize on cursor-based pagination
- [ ] Remove offset pagination from admin lists
- [ ] Document pagination patterns
- [ ] Add pagination helpers to SDK

---

### 22. [P2-010] Add Bulk Operation Support

**Problem**: No bulk insert/update/delete operations.

**Tasks**:

- [ ] Add bulk operations to repository base
- [ ] Add bulk endpoints where needed (admin operations)
- [ ] Handle partial failures gracefully

---

### 23. [P2-011] Add Field-Level Encryption for Sensitive Data

> **INVESTIGATION RESULT**: Audit completed. Core auth is secure, PII needs encryption.

**Already Secure** ✅:
- Passwords: Scrypt hash (N=16384, proper parameters)
- API Keys: SHA-256 hash (plaintext never stored)
- JWTs: RS256 signing with key rotation
- OAuth Tokens: Not persisted (good design)

**Needs Encryption** ⚠️:
| Field | Collection | Risk | Priority |
|-------|------------|------|----------|
| `email` | users | PII, GDPR | High |
| `phone` | users | PII, GDPR | High |
| `firstName`, `lastName` | users | PII | Medium |
| `settings.value` | settings_kv | May contain secrets | Medium |
| webhook payloads | webhook_events | May contain sensitive data | Low |

**Tasks**:

- [ ] Add AES-256-GCM encryption utility to kernel
- [ ] Add `DATA_ENCRYPTION_KEY` env variable
- [ ] Encrypt email/phone with deterministic token for search
- [ ] Add encryption layer to settings repository
- [ ] Implement key rotation support
- [ ] Create migration to encrypt existing PII
- [ ] Document encryption approach

**PII Field Encryption Checklist** (fields requiring encryption):

| # | Module | Collection | Field | Type | Searchable? | Status |
|---|--------|------------|-------|------|-------------|--------|
| 1 | `identity` | `users` | `email` | PII | Yes (lookup) | [ ] |
| 2 | `identity` | `users` | `phone` | PII | Yes (lookup) | [ ] |
| 3 | `identity` | `users` | `firstName` | PII | No | [ ] |
| 4 | `identity` | `users` | `lastName` | PII | No | [ ] |
| 5 | `identity` | `users` | `avatarUrl` | Low risk | No | [ ] |
| 6 | `identity` | `api_keys` | N/A (already hashed) | Secure | N/A | ✅ |
| 7 | `auth` | `authcredentials` | N/A (password hashed) | Secure | N/A | ✅ |
| 8 | `tenants` | `tenants` | `billingEmail` | PII | Yes (lookup) | [ ] |
| 9 | `tenants` | `tenants` | `billingAddress` | PII | No | [ ] |
| 10 | `billing` | `payments` | `cardLast4` | Low risk | No | [ ] |
| 11 | `billing` | `invoices` | `customerEmail` | PII | No | [ ] |
| 12 | `settings` | `settings_kv` | `value` (when sensitive) | Variable | No | [ ] |
| 13 | `notify` | `notification_preferences` | `email` | PII | Yes | [ ] |
| 14 | `notify` | `notification_preferences` | `phone` | PII | Yes | [ ] |
| 15 | `webhooks` | `webhook_events` | `payload` (may contain PII) | Variable | No | [ ] |
| 16 | `audit` | `audit_logs` | `metadata` (may contain PII) | Variable | No | [ ] |

**Encryption Strategy by Field Type**:

| Field Type | Encryption Method | Search Token |
|------------|-------------------|--------------|
| Email (searchable) | AES-256-GCM | SHA-256(normalize(email)) |
| Phone (searchable) | AES-256-GCM | SHA-256(normalize(phone)) |
| Names (display only) | AES-256-GCM | None |
| Settings (variable) | AES-256-GCM (flagged keys only) | None |
| Payloads (audit) | AES-256-GCM | None |

**Recommended Implementation**:
```typescript
// Searchable encryption pattern for email/phone
{
  email_encrypted: "base64(iv+tag+ciphertext)",  // AES-256-GCM
  email_search_token: "sha256(normalize(email))", // For lookups
}
```

---

### 24. [P2-012] Add Webhook Signature Verification

**Problem**: Need to verify incoming webhooks are authentic.

**Location**: Webhook handlers for Stripe, etc.

**Tasks**:

- [ ] Verify Stripe webhook signatures
- [ ] Add signature verification middleware
- [ ] Handle signature failures gracefully
- [ ] Log verification failures for monitoring

---

## P3 - Low Priority (Backlog)

### 25. [P3-001] Add GraphQL Support

**Problem**: REST only, some use cases better with GraphQL.

**Tasks**:

- [ ] Evaluate if GraphQL needed
- [ ] Add GraphQL layer using contracts as source
- [ ] Generate GraphQL schema from Zod

**Questions for you**:

1. Do you have use cases requiring GraphQL?
   Ans: Not right now.
2. Is this a priority?
   Ans: We might in future add support for graphql.

---

### 26. [P3-002] Add WebSocket Support for Real-time

**Problem**: No real-time capabilities.

**Tasks**:

- [ ] Add WebSocket server
- [ ] Integrate with Redis pub/sub
- [ ] Add client SDK for subscriptions
- [ ] Document real-time patterns

---

### 27. [P3-003] Add Multi-Region Deployment Guide

**Problem**: No documentation for multi-region setup.

**Tasks**:

- [ ] Document database replication
- [ ] Document CDN setup
- [ ] Add region-aware routing
- [ ] Document data residency compliance

---

### 28. [P3-004] Reduce Bundle Size of Generated SDK

**Problem**: Generated types file is 27KB+.

**Tasks**:

- [ ] Evaluate tree-shaking effectiveness
- [ ] Split types by domain
- [ ] Lazy load SDK modules

---

### 29. [P3-005] ~~Add Admin UI for Module Management~~ → **REMOVED**

> **Your note**: Already exists under `starters/saaskit`

This item has been removed from the roadmap.

---

### 30. [P3-006] Add Plugin System

**Problem**: Extensions require modifying core code.

**Tasks**:

- [ ] Design plugin architecture
- [ ] Add plugin hooks
- [ ] Document plugin development

---

### 31. [P3-007] Add Database Migration System → **UPGRADE TO P1**

> **INVESTIGATION RESULT**: CLI stubs exist but NOTHING is implemented.

**What exists**:
- ✅ Solid MongoDB connection management
- ✅ Index management (`ensureIndexes()`) - well designed but not called at startup
- ✅ CLI stubs: `db push`, `db pull`, `db seed`, `db migrate`, `db indexes`
- ❌ All commands show "not yet implemented"
- ❌ No migration versioning or history

**Tasks**:

- [ ] Implement `db indexes` command (use existing `ensureIndexes()`)
- [ ] Call `ensureIndexes()` during app startup
- [ ] Implement migration runner with versioning
- [ ] Add migration history collection
- [ ] Create migration templates
- [ ] Implement `db seed` with sample data
- [ ] Add rollback support

**Module Index Registration Checklist**:

| # | Module | Collections | Indexes to Define | Status |
|---|--------|-------------|-------------------|--------|
| 1 | `auth` | `authcredentials` | `userId`, `email`, `tenantId` | [ ] |
| 2 | `identity` | `users` | `email` (unique), `tenantId`, `deletedAt` | [ ] |
| 3 | `identity` | `memberships` | `userId+tenantId` (compound), `tenantId` | [ ] |
| 4 | `identity` | `api_keys` | `keyHash` (unique), `userId`, `tenantId` | [ ] |
| 5 | `tenants` | `tenants` | `slug` (unique), `ownerId`, `deletedAt` | [ ] |
| 6 | `billing` | `subscriptions` | `tenantId`, `stripeId`, `status` | [ ] |
| 7 | `billing` | `payments` | `tenantId`, `stripeId`, `createdAt` | [ ] |
| 8 | `billing` | `invoices` | `tenantId`, `stripeId`, `createdAt` | [ ] |
| 9 | `credits` | `credit_ledger` | `tenantId`, `userId`, `createdAt` | [ ] |
| 10 | `flags` | `feature_flags` | `tenantId`, `key` (unique per tenant) | [ ] |
| 11 | `flags` | `flag_overrides` | `flagId+userId` (compound) | [ ] |
| 12 | `settings` | `settings_kv` | `tenantId+key` (compound unique) | [ ] |
| 13 | `storage` | `files` | `tenantId`, `userId`, `path`, `deletedAt` | [ ] |
| 14 | `audit` | `audit_logs` | `tenantId`, `userId`, `action`, `createdAt` | [ ] |
| 15 | `notify` | `inapp_notifications` | `userId`, `tenantId`, `read`, `createdAt` | [ ] |
| 16 | `notify` | `notification_preferences` | `userId+tenantId` (compound unique) | [ ] |
| 17 | `usage` | `usage_records` | `tenantId`, `metric`, `timestamp` | [ ] |
| 18 | `webhooks` | `webhooks` | `tenantId`, `url`, `deletedAt` | [ ] |
| 19 | `webhooks` | `webhook_events` | `webhookId`, `status`, `createdAt` | [ ] |
| 20 | `kernel` | `_outbox` | `status`, `createdAt`, `processAfter` | [ ] |
| 21 | `kernel` | `_dead_letter` | `originalQueue`, `createdAt` | [ ] |

**Seed Data Modules** (for development/testing):

| # | Module | Seed Data Description | Status |
|---|--------|----------------------|--------|
| 1 | `identity` | Demo users (admin, member, viewer) | [ ] |
| 2 | `tenants` | Demo tenant with sample config | [ ] |
| 3 | `billing` | Sample subscription and payment history | [ ] |
| 4 | `flags` | Sample feature flags | [ ] |
| 5 | `settings` | Default settings values | [ ] |

**Recommended Approach**: Custom lightweight system (not migrate-mongo) since:
- Index system already exists
- MongoDB schema-less means fewer structural migrations
- Most "migrations" are data transformations or index changes

---

### 32. [P3-008] Add Performance Benchmarks

**Problem**: No baseline performance metrics.

**Tasks**:

- [ ] Add benchmark suite
- [ ] Measure handler latency
- [ ] Measure database query performance
- [ ] Track performance over time

---

### 33. [P3-009] Add Internationalization (i18n) Support

**Problem**: No i18n for error messages or UI.

**Tasks**:

- [ ] Add i18n library
- [ ] Extract error messages
- [ ] Add locale detection
- [ ] Document translation workflow

**Questions for you**:

1. Is i18n a priority for your target market?
   Ans: not right now.
2. Which languages do you need to support?
   Ans: we will plan it later.

---

### 34. [P3-010] Document Global State Patterns

**Problem**: Global state pattern non-standard, can confuse developers.

**Location**: `global.__kernelContextStorage` and similar

**Tasks**:

- [ ] Document why global state is used
- [ ] Document Next.js/Turbopack considerations
- [ ] Add debugging guide for context issues

---

## Implementation Order Recommendation (UPDATED)

> Updated based on investigation findings

### Phase 1: Foundation & Security (Weeks 1-2)

| # | ID | Task | Effort |
|---|-----|------|--------|
| 1 | P0-001 | Test Infrastructure (Vitest + Playwright) | 3-4 days |
| 2 | P0-003 | Input Sanitization Layer | 2 days |
| 3 | P0-004 | Secrets Audit & Redaction | 1 day |
| 4 | P1-006 | Centralize Collection Names | 0.5 day |
| 5 | NEW | Call `ensureIndexes()` at startup | 0.5 day |

### Phase 2: Reliability & Observability (Weeks 3-4)

| # | ID | Task | Effort |
|---|-----|------|--------|
| 6 | P1-001 | OpenTelemetry Tracing (opt-in) | 2-3 days |
| 7 | P1-002 | Health Checks with Dependencies | 1 day |
| 8 | P1-003 | Circuit Breakers (billing, email, storage) | 2 days |
| 9 | P1-004 | Event Memory Leak Fix | 1 day |
| 10 | P1-007 | Rate Limit Key Safety | 0.5 day |

### Phase 3: Code Quality & DX (Weeks 5-6)

| # | ID | Task | Effort |
|---|-----|------|--------|
| 11 | P1-005 | Repository Base Class | 3-4 days |
| 12 | P2-001 | Generated Code Formatting (Prettier) | 1 day |
| 13 | P2-003 | Standardize Null Handling | 1 day |
| 14 | P2-007 | Improve Error Messages | 1-2 days |

### Phase 4: Data & Compliance (Weeks 7-8)

| # | ID | Task | Effort |
|---|-----|------|--------|
| 15 | P2-004 | Database Transaction Support | 2 days |
| 16 | P2-011 | PII Encryption (email, phone) | 3-4 days |
| 17 | P1-009 | Migration System Implementation | 3 days |
| 18 | P2-008 | Soft Delete Consistency | 1 day |

### Phase 5: Polish & Features (Ongoing)

| # | ID | Task | Priority |
|---|-----|------|----------|
| 19 | P2-006 | Request/Response Logging | When needed |
| 20 | P2-009 | Pagination Consistency | When needed |
| 21 | P3-002 | WebSocket Support | Future |
| 22 | P3-001 | GraphQL Support | Future |
| 23 | P3-009 | i18n Support | Future |

---

## Revised Priority Summary

| Priority | Original Count | After Investigation |
|----------|---------------|---------------------|
| **P0 - Critical** | 4 | **3** (type casts moved to P2) |
| **P1 - High** | 8 | **9** (migrations upgraded) |
| **P2 - Medium** | 12 | **11** (P2-011 has more detail) |
| **P3 - Low** | 10 | **8** (admin UI removed, migrations upgraded) |

---

## Questions Summary

Please answer these to help prioritize and plan:

### Critical Questions

1. **Testing**: What's your target coverage? Any existing tests? Preferred E2E framework?

2. **Type Casts**: Why were `as unknown` casts needed in generated code?

3. **HTML Fields**: Any fields that intentionally allow HTML/rich text?

4. **Secrets**: Do you have secrets management? Any known logging of sensitive data?

### High Priority Questions

5. **Observability**: What backend? (Datadog, Grafana, Jaeger)

6. **Resilience**: What should happen when Stripe/email is down?

7. **API Versioning**: Philosophy on versioning and deprecation?

### Lower Priority Questions

8. **Encryption**: Which fields are sensitive? Need searchable encryption?

9. **GraphQL**: Is this needed?

10. **Migrations**: Current approach? Preferred tool?

11. **i18n**: Priority? Target languages?

---

## Notes

- Estimates are rough, actual time depends on team size and familiarity
- Some items can be parallelized across team members
- P0 items should block production deployment
- P1 items should be in first production release
- P2/P3 can be prioritized based on user feedback

### Pre-Launch Policy

> **⚠️ No Backward Compatibility Required**
>
> This system is **pre-launch** and not yet in production. Therefore:
> - No deprecated APIs or code paths will be maintained
> - Breaking changes can be made freely without migration paths
> - No backward compatibility shims, re-exports, or `_deprecated` suffixes needed
> - Unused code should be deleted completely, not commented out
> - When refactoring, simply replace the old implementation—no "old" vs "new" coexistence
>
> This policy will change once the system is launched and has external users.
