# Unisane Production Readiness Roadmap

> **Created**: 2026-01-12
> **Based On**: Comprehensive codebase verification and gap analysis
> **Current System Rating**: 9.2/10 (Excellent architecture, needs critical gaps filled)
> **Estimated Time to Production**: 3-5 weeks focused work

---

## ⚠️ Implementation Guidelines

**CRITICAL: Read these guidelines before implementing ANY task:**

### 🚫 DON'Ts (What NOT to Do)

1. **Don't edit generated files** — Files with `/* AUTO-GENERATED */` header will be overwritten
2. **Don't add backward compatibility** — Pre-launch, just change the code directly
3. **Don't over-engineer** — Keep solutions simple, solve the immediate problem
4. **Don't create docs/README files** — Unless explicitly requested in the task
5. **Don't guess file paths** — Always read/search to find the correct location first
6. **Don't skip verification** — Always read existing code before editing
7. **Don't skip testing** — Every code change must have corresponding tests
8. **Don't commit without linting** — Run `pnpm lint` before committing
9. **Don't bypass type safety** — Fix type errors, don't use `@ts-ignore` or `any`
10. **Don't copy-paste without understanding** — Understand the code you're modifying

### ✅ DOs (What TO Do)

1. **DO verify side effects** — Check what else depends on the code you're changing
2. **DO search for usages** — Use grep/search to find all places that use a function/type
3. **DO read surrounding code** — Understand the context and patterns used
4. **DO follow existing patterns** — Match the style and structure of nearby code
5. **DO test edge cases** — Think about null/undefined, empty arrays, error cases
6. **DO update imports** — If you move/rename something, update all imports
7. **DO check for circular dependencies** — Avoid creating import cycles
8. **DO verify tenant isolation** — Ensure `tenantFilter()` is used for multi-tenant data
9. **DO use kernel utilities** — Don't recreate existing utilities (check kernel first)
10. **DO ask for clarification** — If requirements are unclear, ask before implementing

### 🔍 Verification Checklist (Before Marking Task Complete)

Before marking any task as complete, verify:

- [ ] All files compile without errors (`pnpm check-types`)
- [ ] All tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] No new `@ts-ignore` or `any` types added
- [ ] All imports updated if files were moved/renamed
- [ ] Side effects checked (search for usages of modified code)
- [ ] Tests added for new functionality
- [ ] Tests updated for modified functionality
- [ ] Security implications considered (PII, authentication, authorization)
- [ ] Performance implications considered (N+1 queries, memory leaks)
- [ ] Documentation updated if public API changed

### 🛡️ Security Checklist (For Security-Related Tasks)

When implementing security-related changes:

- [ ] No secrets logged or exposed in error messages
- [ ] Input validation using Zod schemas
- [ ] SQL/NoSQL injection prevented (use parameterized queries)
- [ ] XSS prevention (use sanitization utilities from kernel)
- [ ] Authorization checks present (`assertPerm`, `requireAuth`)
- [ ] Tenant isolation enforced (`tenantFilter`, `withTenantId`)
- [ ] Rate limiting configured in OpMeta
- [ ] Audit logging added for sensitive operations
- [ ] Error messages don't leak internal details
- [ ] HTTPS enforced (HSTS headers configured)

### 📝 Code Quality Standards

**Naming Conventions**:
- Use `camelCase` for variables and functions
- Use `PascalCase` for types, interfaces, and classes
- Use `SCREAMING_SNAKE_CASE` for constants
- Prefix boolean variables with `is`, `has`, `should`
- Use descriptive names (avoid `data`, `temp`, `result` without context)

**File Organization**:
- One exported function/class per file (except types)
- Barrel exports in `index.ts` files
- Group related functionality in folders
- Keep files under 500 lines (split if larger)

**Error Handling**:
- Use `DomainError` with specific error codes from catalog
- Never use empty catch blocks (log at minimum)
- Return typed errors, don't throw generic `Error`
- Add `retryable` flag for transient errors
- Wrap vendor errors with `ProviderError`

**Testing Standards**:
- Test file naming: `*.test.ts` (not `*.spec.ts` for unit tests)
- E2E test naming: `*.spec.ts` (in `/e2e/` folder)
- Minimum 80% coverage for new code
- Test happy path + error cases + edge cases
- Mock external dependencies (Stripe, S3, email, etc.)
- Use descriptive test names: `it('should create user when valid input provided')`

---

## 🎯 Goal

Transform Unisane from 90% production-ready to **100% production-ready** by addressing critical security, reliability, and quality gaps in a logical, dependency-aware sequence.

---

## 📊 Current State Summary

### ✅ What's Working Excellently
- **Architecture**: Contract-first with 95% code generation (exceptional)
- **Type Safety**: Perfect TypeScript + Zod + ts-rest integration
- **Code Quality**: Clean codebase (12 TODOs, 1 @ts-ignore, minimal console.logs)
- **Foundation**: Production-ready kernel, gateway, and 8/15 tested modules
- **Infrastructure**: MongoDB, Redis, Stripe, Auth, Multi-tenancy all working

### ⚠️ Critical Gaps (Blocking Production)
- **Security**: PII stored in plaintext (encryption utilities exist but unused)
- **Security**: Missing critical security headers (CSP, Helmet, etc.)
- **Quality**: 7/15 modules have ZERO tests
- **Quality**: NO service layer tests exist anywhere
- **Reliability**: CI allows test failures without blocking merges
- **Architecture**: Rate limiting policies duplicated (SSOT break)

---

## 📅 Implementation Phases

### Phase 1: Critical Security Fixes (Week 1) 🔒
**Goal**: Eliminate critical security vulnerabilities
**Estimated Time**: 5-7 days
**Blockers**: None - can start immediately

### Phase 2: Quality Foundation (Week 2-3) ✅
**Goal**: Complete test coverage and fix CI configuration
**Estimated Time**: 7-10 days
**Blockers**: Depends on Phase 1 completion

### Phase 3: Production Hardening (Week 3-4) 🛡️
**Goal**: Add reliability patterns and fix architectural issues
**Estimated Time**: 5-7 days
**Blockers**: Depends on Phase 2 completion

### Phase 4: Production Launch Prep (Week 4-5) 🚀
**Goal**: Final verification, documentation, and deployment
**Estimated Time**: 3-5 days
**Blockers**: Depends on Phase 3 completion

---

## Phase 1: Critical Security Fixes (Week 1) 🔒

**Why First**: Security vulnerabilities must be fixed before any production data is handled.

---

### 1.1 Integrate PII Encryption in Database Layer

**Priority**: 🔴 CRITICAL
**Status**: ❌ Not Started (0%)
**Estimated Time**: 2-3 days
**Assignee**: ___________

**Problem**:
Encryption utilities (`encryptField`, `decryptField`, `createSearchToken`) exist in `packages/foundation/kernel/src/utils/crypto.ts` but are **never used**. User emails and phone numbers are stored in plaintext in MongoDB.

**Impact**: Critical security vulnerability - PII exposure if database is compromised.

**Tasks**:

- [ ] **1.1.1** Add `DATA_ENCRYPTION_KEY` to `.env.example` with generation instructions
  - Location: `starters/saaskit/.env.example`
  - Add documentation on key rotation strategy

- [ ] **1.1.2** Update Users Repository to encrypt PII fields
  - Location: `packages/modules/identity/src/data/users.repository.mongo.ts`
  - Add fields: `emailEncrypted`, `emailSearchToken`, `phoneEncrypted`, `phoneSearchToken`
  - Keep plaintext fields temporarily for migration safety

- [ ] **1.1.3** Update MongoDB schema with new encrypted fields
  - Add indexes on `emailSearchToken` and `phoneSearchToken`
  - Ensure `deletedAt` filter still works correctly

- [ ] **1.1.4** Update queries to use searchToken for lookups
  - Find by email: `findOne({ emailSearchToken: createSearchToken(normalizeEmail(email), key) })`
  - Find by phone: `findOne({ phoneSearchToken: createSearchToken(normalizePhone(phone), key) })`

- [ ] **1.1.5** Create data migration script
  - Script location: `scripts/migrations/001-encrypt-pii.ts`
  - Migrate existing plaintext emails/phones to encrypted fields
  - Add rollback capability

- [ ] **1.1.6** Update tests to use encryption
  - Update identity module tests to verify encryption
  - Add tests for searchToken lookups

- [ ] **1.1.7** Run migration on dev/staging databases
  - Verify all queries still work
  - Test performance impact of searchToken lookups

**Verification**:
```bash
# Should find encrypted field usage
grep -r "encryptField\|decryptField" packages/modules/identity/src/data/

# Should find searchToken in queries
grep -r "emailSearchToken\|phoneSearchToken" packages/modules/identity/src/data/

# Tests should pass
pnpm --filter @unisane/identity test
```

**Definition of Done**:
- ✅ All user emails encrypted in database
- ✅ All user phones encrypted in database
- ✅ Lookups work correctly with searchToken
- ✅ Migration script tested on staging
- ✅ Tests passing with encryption enabled
- ✅ Performance verified (no significant degradation)

---

### 1.2 Add Comprehensive Security Headers

**Priority**: 🔴 CRITICAL
**Status**: ❌ Not Started (50% - only poweredByHeader disabled)
**Estimated Time**: 1 day
**Assignee**: ___________

**Problem**:
Only `poweredByHeader: false` is configured. Missing critical security headers:
- No Content-Security-Policy (CSP) - vulnerable to XSS
- No X-Frame-Options - vulnerable to clickjacking
- No X-Content-Type-Options - vulnerable to MIME sniffing
- No HSTS - no HTTPS enforcement

**Impact**: Application vulnerable to XSS, clickjacking, and MITM attacks.

**Tasks**:

- [ ] **1.2.1** Add security headers middleware
  - Location: `starters/saaskit/src/middleware.ts` (create if doesn't exist)
  - Add all critical security headers

- [ ] **1.2.2** Configure Content-Security-Policy
  - Start with restrictive policy
  - Allow only necessary domains
  - Document CSP directives

- [ ] **1.2.3** Add HSTS with long max-age
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`

- [ ] **1.2.4** Add remaining security headers
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: no-referrer-when-downgrade`

- [ ] **1.2.5** Test headers in all environments
  - Verify headers present in dev
  - Verify headers present in staging
  - Use https://securityheaders.com to scan

- [ ] **1.2.6** Document CSP exceptions
  - Document why any `unsafe-inline` or `unsafe-eval` is needed
  - Plan to remove unsafe directives

**Implementation Example**:
```typescript
// starters/saaskit/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com",
    "frame-src https://js.stripe.com",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // HSTS
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // Other security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'no-referrer-when-downgrade');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

**Verification**:
```bash
# Test locally
curl -I http://localhost:3000 | grep -i "content-security-policy\|x-frame-options\|strict-transport"

# Test on securityheaders.com
# Should get A+ rating
```

**Definition of Done**:
- ✅ All security headers present in responses
- ✅ CSP configured and tested
- ✅ HSTS enabled with long max-age
- ✅ Security headers scan shows A+ rating
- ✅ Application still functions correctly (no CSP violations)

---

### 1.3 Audit and Fix Secrets Management

**Priority**: 🟡 HIGH (Part of security hardening)
**Status**: ⚠️ Partial (70% - most secrets handled correctly)
**Estimated Time**: 1 day
**Assignee**: ___________

**Problem**:
Need final verification that no secrets are logged or exposed.

**Tasks**:

- [ ] **1.3.1** Audit all logger calls for sensitive data
  - Search for: `log.`, `console.`, `logger.`
  - Verify no passwords, tokens, or API keys logged

- [ ] **1.3.2** Verify error responses don't leak secrets
  - Check gateway error handlers
  - Ensure stack traces hidden in production

- [ ] **1.3.3** Add secret redaction helper
  - Location: `packages/foundation/kernel/src/utils/redact.ts`
  - Redact common secret patterns in logs

- [ ] **1.3.4** Add secret scanning to CI
  - Add gitleaks or similar to `.github/workflows/ci.yml`
  - Scan for committed secrets

- [ ] **1.3.5** Document secret rotation procedures
  - Location: `docs/operations/secret-rotation.md`
  - How to rotate JWT keys, encryption keys, API keys

**Definition of Done**:
- ✅ No secrets found in logs
- ✅ Error responses don't expose secrets
- ✅ Secret scanning running in CI
- ✅ Secret rotation documented

---

## Phase 2: Quality Foundation (Week 2-3) ✅

**Why Second**: Can't confidently deploy without comprehensive test coverage.

---

### 2.1 Complete Test Coverage for Untested Modules

**Priority**: 🔴 CRITICAL
**Status**: ❌ 7 modules with ZERO tests
**Estimated Time**: 7-10 days
**Assignee**: ___________

**Problem**:
7 out of 15 modules have ZERO tests: `ai`, `audit`, `media`, `notify`, `pdf`, `settings`, `storage`

**Impact**: Cannot safely refactor or deploy these modules without test coverage.

**Module Testing Checklist**:

#### 2.1.1 Settings Module Tests (Day 1)
- [ ] **Location**: `packages/modules/settings/src/__tests__/`
- [ ] Create `schemas.test.ts` - Zod schema validation tests
- [ ] Create `errors.test.ts` - Error catalog tests
- [ ] Create `constants.test.ts` - Constants validation
- [ ] Create `service/settings.test.ts` - getSetting, updateSetting, listSettings
- [ ] Create `data/settings.repository.test.ts` - CRUD operations
- [ ] **Target**: 50+ tests minimum

#### 2.1.2 Storage Module Tests (Day 2)
- [ ] **Location**: `packages/modules/storage/src/__tests__/`
- [ ] Create `schemas.test.ts` - Upload request validation
- [ ] Create `errors.test.ts` - Storage error codes
- [ ] Create `service/upload.test.ts` - Upload flow with mocked S3
- [ ] Create `service/download.test.ts` - Download and presigned URL generation
- [ ] Create `data/files.repository.test.ts` - File metadata CRUD
- [ ] **Target**: 60+ tests minimum

#### 2.1.3 Audit Module Tests (Day 3)
- [ ] **Location**: `packages/modules/audit/src/__tests__/`
- [ ] Create `schemas.test.ts` - Audit log schemas
- [ ] Create `service/log.test.ts` - createAuditLog with context
- [ ] Create `service/query.test.ts` - listAuditLogs with filtering
- [ ] Create `data/audit-logs.repository.test.ts` - Append-only operations
- [ ] Test tenant isolation in audit logs
- [ ] **Target**: 50+ tests minimum

#### 2.1.4 Notify Module Tests (Day 4-5)
- [ ] **Location**: `packages/modules/notify/src/__tests__/`
- [ ] Create `schemas.test.ts` - Notification schemas
- [ ] Create `service/notify.test.ts` - sendNotification with providers
- [ ] Create `service/preferences.test.ts` - User notification preferences
- [ ] Create `data/notifications.repository.test.ts` - Notification CRUD
- [ ] Test email provider integration (mocked)
- [ ] Test SMS provider integration (mocked)
- [ ] **Target**: 70+ tests minimum

#### 2.1.5 AI Module Tests (Day 6)
- [ ] **Location**: `packages/modules/ai/src/__tests__/`
- [ ] Create `schemas.test.ts` - AI request/response schemas
- [ ] Create `service/ai.test.ts` - AI service calls (mocked)
- [ ] Create `service/prompts.test.ts` - Prompt template rendering
- [ ] Test OpenAI integration (mocked)
- [ ] Test error handling for API failures
- [ ] **Target**: 50+ tests minimum

#### 2.1.6 Media Module Tests (Day 7)
- [ ] **Location**: `packages/modules/media/src/__tests__/`
- [ ] Create `schemas.test.ts` - Media processing schemas
- [ ] Create `service/process.test.ts` - Image transformations
- [ ] Create `data/media.repository.test.ts` - Media metadata CRUD
- [ ] Test image resize/crop operations
- [ ] Test video processing (if applicable)
- [ ] **Target**: 60+ tests minimum

#### 2.1.7 PDF Module Tests (Day 8)
- [ ] **Location**: `packages/modules/pdf/src/__tests__/`
- [ ] Create `schemas.test.ts` - PDF generation schemas
- [ ] Create `service/generate.test.ts` - PDF generation from templates
- [ ] Create `service/templates.test.ts` - Template rendering
- [ ] Test PDF generation with mocked library
- [ ] Test error handling for template errors
- [ ] **Target**: 50+ tests minimum

**Testing Standards** (Apply to All Modules):
1. Test happy paths and error cases
2. Test tenant isolation (verify `tenantFilter()` usage)
3. Test validation (Zod schemas)
4. Test repository operations (CRUD)
5. Test service layer business logic
6. Mock external dependencies (S3, Stripe, OpenAI, etc.)
7. Minimum 80% code coverage per module

**Verification**:
```bash
# Run all tests
pnpm test

# Run specific module tests
pnpm --filter @unisane/settings test
pnpm --filter @unisane/storage test
# ... etc

# Check coverage
pnpm test:coverage
```

**Definition of Done**:
- ✅ All 7 modules have comprehensive test suites
- ✅ Minimum 50 tests per module
- ✅ Service layer fully tested
- ✅ Repository layer fully tested
- ✅ All tests passing
- ✅ Code coverage ≥80% for each module

---

### 2.2 Add Service Layer Tests for Tested Modules

**Priority**: 🟡 HIGH
**Status**: ❌ Not Started (0%)
**Estimated Time**: 3-4 days
**Assignee**: ___________

**Problem**:
8 modules have basic tests (schemas, errors, constants) but **NO service layer tests**.

**Modules Needing Service Tests**:
- `auth` (3 test files, need service tests)
- `billing` (3 test files, need service tests)
- `credits` (3 test files, need service tests)
- `flags` (3 test files, need service tests)
- `identity` (3 test files, need service tests)
- `tenants` (3 test files, need service tests)
- `usage` (3 test files, need service tests)
- `webhooks` (3 test files, need service tests)

**Tasks**:

- [ ] **2.2.1** Auth Module Service Tests
  - Test `signup()`, `signin()`, `signout()`, `resetPassword()`
  - Test OTP flow, phone verification
  - Test token generation and validation
  - Target: 80+ new tests

- [ ] **2.2.2** Billing Module Service Tests
  - Test `subscribe()`, `cancelSubscription()`, `updatePaymentMethod()`
  - Test webhook handlers (mocked Stripe)
  - Test invoice generation
  - Target: 80+ new tests

- [ ] **2.2.3** Credits Module Service Tests
  - Test `deductCredits()`, `addCredits()`, `getBalance()`
  - Test ledger operations and balance calculations
  - Test credit expiration logic
  - Target: 60+ new tests

- [ ] **2.2.4** Flags Module Service Tests
  - Test `getFlag()`, `evaluateFlag()`, `createFlag()`
  - Test flag overrides and rollout percentages
  - Test tenant-specific flag values
  - Target: 60+ new tests

- [ ] **2.2.5** Identity Module Service Tests
  - Test `createUser()`, `updateUser()`, `deleteUser()`
  - Test membership management
  - Test API key generation and validation
  - Target: 100+ new tests

- [ ] **2.2.6** Tenants Module Service Tests
  - Test `createTenant()`, `switchTenant()`, `deleteTenant()`
  - Test slug validation and uniqueness
  - Test tenant isolation
  - Target: 70+ new tests

- [ ] **2.2.7** Usage Module Service Tests
  - Test `recordUsage()`, `getUsageStats()`, `checkLimit()`
  - Test usage aggregation
  - Test limit enforcement
  - Target: 60+ new tests

- [ ] **2.2.8** Webhooks Module Service Tests
  - Test `createWebhook()`, `deliverWebhook()`, `retryWebhook()`
  - Test signature generation
  - Test retry logic and exponential backoff
  - Target: 70+ new tests

**Definition of Done**:
- ✅ All 8 modules have service layer tests
- ✅ 60-100 new tests per module
- ✅ All business logic covered
- ✅ All tests passing

---

### 2.3 Fix CI Configuration to Block on Test Failures

**Priority**: 🔴 CRITICAL
**Status**: ❌ Bug exists (tests run with continue-on-error: true)
**Estimated Time**: 1 hour
**Assignee**: ___________

**Problem**:
Tests run with `continue-on-error: true` in `.github/workflows/ci.yml` line 137. This means test failures don't block CI, allowing broken code to be merged.

**Impact**: Broken code can be merged to main branch without anyone noticing.

**Tasks**:

- [ ] **2.3.1** Remove continue-on-error from test job
  - Location: `.github/workflows/ci.yml` line 138
  - Remove: `continue-on-error: true`

- [ ] **2.3.2** Ensure all tests are passing before making this change
  - Run: `pnpm test` locally
  - Fix any failing tests first

- [ ] **2.3.3** Update CI to fail on test failures
  - Verify CI fails when tests fail
  - Test by intentionally breaking a test

- [ ] **2.3.4** Add test failure notifications
  - Notify on Slack/Discord when CI fails
  - Add GitHub status check to block merges

**Before**:
```yaml
- name: Run tests
  run: pnpm test
  continue-on-error: true  # ❌ This is wrong!
```

**After**:
```yaml
- name: Run tests
  run: pnpm test
  # No continue-on-error - CI will fail if tests fail ✅
```

**Verification**:
```bash
# Create a failing test
# Push to a branch
# Verify CI fails and blocks merge
```

**Definition of Done**:
- ✅ `continue-on-error: true` removed
- ✅ All tests passing before removal
- ✅ CI fails when tests fail
- ✅ GitHub merge blocked when CI fails

---

### 2.4 Add Coverage Thresholds to CI

**Priority**: 🟢 MEDIUM
**Status**: ❌ Not Started
**Estimated Time**: 2 hours
**Assignee**: ___________

**Problem**:
No coverage enforcement. Code coverage could decrease over time.

**Tasks**:

- [ ] **2.4.1** Configure coverage thresholds
  - Add to `vitest.config.ts` or `jest.config.js`
  - Set thresholds: 80% statements, 80% branches, 80% functions, 80% lines

- [ ] **2.4.2** Add coverage job to CI
  - Generate coverage reports in CI
  - Fail if coverage below thresholds

- [ ] **2.4.3** Add coverage badge to README
  - Use Codecov or similar
  - Display coverage percentage

- [ ] **2.4.4** Set per-package thresholds
  - Higher thresholds for kernel/gateway (90%)
  - Standard thresholds for modules (80%)

**Definition of Done**:
- ✅ Coverage thresholds configured
- ✅ CI fails when coverage below threshold
- ✅ Coverage badge in README
- ✅ Per-package thresholds enforced

---

## Phase 3: Production Hardening (Week 3-4) 🛡️

**Why Third**: With security fixed and tests in place, we can safely refactor and harden.

---

### 3.1 Fix Rate Limiting Policy Duplication (SSOT Break)

**Priority**: 🟡 HIGH
**Status**: ⚠️ Partial (80% - works but has duplication)
**Estimated Time**: 1-2 days
**Assignee**: ___________

**Problem**:
Rate limit policies are duplicated between:
1. `OpMeta.rateLimitPolicy` (contract metadata)
2. Gateway middleware configuration

This breaks Single Source of Truth principle.

**Impact**: Inconsistent rate limiting, harder to maintain, risk of config drift.

**Tasks**:

- [ ] **3.1.1** Audit rate limit configuration locations
  - Find all places rate limits are defined
  - Document current duplication

- [ ] **3.1.2** Choose single source of truth
  - **Recommendation**: Use OpMeta as SSOT (already defined in contracts)
  - Remove from middleware config

- [ ] **3.1.3** Update middleware to read from OpMeta
  - Middleware should read rate limit policy from OpMeta
  - No hardcoded rate limits in middleware

- [ ] **3.1.4** Add validation for rate limit policies
  - Ensure all endpoints have rate limit defined
  - Warn if missing rate limit policy

- [ ] **3.1.5** Update documentation
  - Document how to configure rate limits (in OpMeta only)
  - Document default rate limit policy

**Definition of Done**:
- ✅ Rate limits only defined in one place (OpMeta)
- ✅ Middleware reads from OpMeta
- ✅ No duplication anywhere
- ✅ Documentation updated

---

### 3.2 Verify Pagination Consistency Across Modules

**Priority**: 🟢 MEDIUM
**Status**: ⚠️ Partial (70% - cursor exists, not verified everywhere)
**Estimated Time**: 1-2 days
**Assignee**: ___________

**Problem**:
Cursor-based pagination exists but not verified across all modules. Need to ensure no `.skip()` usage anywhere.

**Tasks**:

- [ ] **3.2.1** Audit all list operations in all 15 modules
  - Find all `list*`, `find*`, `query*` methods
  - Verify cursor-based pagination used

- [ ] **3.2.2** Search for .skip() usage
  - Run: `grep -r "\.skip(" packages/modules/`
  - Remove any `.skip()` calls found

- [ ] **3.2.3** Standardize pagination response format
  - Ensure all paginated responses have: `{ items, nextCursor, hasMore }`
  - Document pagination format

- [ ] **3.2.4** Add pagination helper utilities
  - Location: `packages/foundation/kernel/src/database/pagination.ts`
  - Reusable cursor encoding/decoding

- [ ] **3.2.5** Update SDK to support cursor pagination
  - Generated hooks should handle pagination
  - Add `useInfinite*` hooks for infinite scroll

**Definition of Done**:
- ✅ All list operations use cursor-based pagination
- ✅ No `.skip()` usage found anywhere
- ✅ Consistent pagination response format
- ✅ Pagination utilities available
- ✅ SDK supports cursor pagination

---

### 3.3 Complete Circuit Breaker Integration for External Services

**Priority**: 🟡 HIGH
**Status**: ⚠️ Partial (utilities exist, not fully integrated)
**Estimated Time**: 2-3 days
**Assignee**: ___________

**Problem**:
Circuit breaker utilities exist but external service calls aren't wrapped yet.

**Tasks**:

- [ ] **3.3.1** Wrap Stripe API calls with circuit breaker
  - Location: `packages/modules/billing/src/service/`
  - Wrap all Stripe SDK calls
  - Configure fallback: queue & retry

- [ ] **3.3.2** Wrap email provider calls
  - Location: `packages/modules/notify/src/service/`
  - Wrap Resend/SendGrid API calls
  - Configure fallback: queue for retry

- [ ] **3.3.3** Wrap storage provider calls
  - Location: `packages/modules/storage/src/service/`
  - Wrap S3/Cloud Storage operations
  - Configure fallback: return error (no retry)

- [ ] **3.3.4** Wrap AI provider calls
  - Location: `packages/modules/ai/src/service/`
  - Wrap OpenAI/Anthropic API calls
  - Configure fallback: return error with fallback message

- [ ] **3.3.5** Add circuit breaker metrics
  - Expose circuit state in health endpoint
  - Log circuit state changes
  - Alert when circuit opens

- [ ] **3.3.6** Document circuit breaker behavior
  - Document failure modes for each service
  - Document fallback strategies
  - Document how to manually reset circuits

**Definition of Done**:
- ✅ All external service calls wrapped with circuit breaker
- ✅ Appropriate fallback strategies configured
- ✅ Circuit state exposed in metrics
- ✅ Documented behavior and fallbacks

---

### 3.4 Add Missing Integration Tests

**Priority**: 🟢 MEDIUM
**Status**: ❌ Not Started
**Estimated Time**: 2-3 days
**Assignee**: ___________

**Problem**:
Unit tests exist but integration tests are missing. Need tests that verify cross-module workflows.

**Integration Test Scenarios**:

- [ ] **3.4.1** Sign up → Verify email → Create tenant flow
  - Test auth + identity + tenants integration
  - Verify all database records created correctly

- [ ] **3.4.2** Subscribe to plan → Payment → Credits added flow
  - Test billing + credits integration
  - Verify Stripe webhook handling

- [ ] **3.4.3** File upload → Process → Serve flow
  - Test storage + media integration
  - Verify file processing and serving

- [ ] **3.4.4** Invite member → Accept → Permissions granted flow
  - Test identity + tenants + notify integration
  - Verify invitation email sent

- [ ] **3.4.5** API key creation → API call → Audit log flow
  - Test identity + gateway + audit integration
  - Verify authentication and logging

- [ ] **3.4.6** Usage recording → Limit check → Billing flow
  - Test usage + credits + billing integration
  - Verify limit enforcement

**Testing Approach**:
- Use real database (MongoMemoryServer or test instance)
- Mock external services (Stripe, email, etc.)
- Test end-to-end flow including database operations
- Verify data consistency across modules

**Definition of Done**:
- ✅ 6+ integration test scenarios implemented
- ✅ All tests passing
- ✅ Database operations verified
- ✅ Cross-module interactions tested

---

### 3.5 Add Enhanced Health Checks with Dependencies

**Priority**: 🟢 MEDIUM
**Status**: ⚠️ Partial (basic health check exists)
**Estimated Time**: 1 day
**Assignee**: ___________

**Problem**:
Current health check only pings. Need dependency checks for MongoDB, Redis, etc.

**Tasks**:

- [ ] **3.5.1** Add MongoDB connectivity check
  - Ping database with timeout
  - Return latency in milliseconds

- [ ] **3.5.2** Add Redis connectivity check
  - Ping Redis with timeout
  - Return latency in milliseconds

- [ ] **3.5.3** Create separate endpoints
  - `/health/live` - Basic liveness (always returns 200)
  - `/health/ready` - Full readiness (checks all dependencies)

- [ ] **3.5.4** Add structured health response
  ```json
  {
    "status": "healthy",
    "checks": {
      "mongodb": { "status": "up", "latencyMs": 12 },
      "redis": { "status": "up", "latencyMs": 3 }
    },
    "version": "1.0.0",
    "uptime": 3600
  }
  ```

- [ ] **3.5.5** Add timeout handling
  - Each check should timeout after 5s
  - Return degraded status if checks timeout

**Definition of Done**:
- ✅ MongoDB and Redis checks implemented
- ✅ Separate live/ready endpoints
- ✅ Structured JSON response
- ✅ Timeout handling working

---

### 3.6 Add Module Boundary Safety Nets

**Priority**: 🟢 MEDIUM
**Status**: ❌ Not Started
**Estimated Time**: 1-2 days
**Assignee**: ___________

**Problem**:
Modules can currently import from each other's internals, and dependencies between modules are implicit. This makes refactoring risky and module boundaries unclear.

**Impact**:
- Hard to understand what's "public API" vs internal implementation
- Risk of breaking changes when refactoring internals
- Unclear module dependencies make testing harder
- Future multi-platform refactoring will be more difficult

**Tasks**:

- [ ] **3.6.1** Add explicit module boundaries via index.ts exports
  - Only export public API from each module's `src/index.ts`
  - Hide internal implementation (repositories, mappers, infra adapters)
  - Verify no modules import from other modules' internals (`/domain/`, `/data/`, `/infra/`)
  - Add TypeScript path mapping to enforce boundaries

- [ ] **3.6.2** Add dependency documentation to each module
  - Create `README.md` in each module package root
  - Document required dependencies (which modules it imports)
  - Document context requirements (AsyncLocalStorage, tenant context, etc.)
  - Document optional features (credits, webhooks, etc.)
  - Document exported public API

- [ ] **3.6.3** Make optional dependencies truly optional
  - Use dynamic imports for optional features (credits, webhooks)
  - Add feature flags in config (`BILLING_ENABLE_CREDITS`, etc.)
  - Allow modules to work gracefully without all dependencies
  - Add runtime checks for optional dependencies

**Implementation Guide**:

**Step 1: Explicit Module Boundaries**

```typescript
// ✅ Good: packages/modules/billing/src/index.ts
// ONLY export public API
export { BillingService } from './domain/billing.service';
export type { Subscription, Invoice, PaymentMethod } from './domain/types';
export type { BillingConfig } from './config';

// ❌ Don't export internals
// export { BillingRepository } from './data/repository';  // NO!
// export { StripeAdapter } from './infra/stripe-adapter';  // NO!
// export { mapSubscriptionToDTO } from './mappers';  // NO!
```

**Step 2: Module README Template**

```markdown
# @unisane/billing

Business module for managing subscriptions and payments.

## Public API

### Services
- `BillingService` - Main service for billing operations

### Types
- `Subscription` - Subscription entity
- `Invoice` - Invoice entity
- `PaymentMethod` - Payment method details

## Dependencies

### Required
- `@unisane/kernel` - Logger, errors, config utilities
- `@unisane/tenants` - Tenant context and repository
- `@unisane/settings` - Billing configuration storage

### Optional
- `@unisane/credits` - For credit grants after payment (enable with `BILLING_ENABLE_CREDITS=true`)
- `@unisane/webhooks` - For payment event webhooks (enable with `BILLING_ENABLE_WEBHOOKS=true`)

## Context Requirements

- Requires multi-tenant context via AsyncLocalStorage (`getTenantId()`)
- Requires Stripe API credentials in environment (`STRIPE_SECRET_KEY`)

## Configuration

```env
STRIPE_SECRET_KEY=sk_test_...
BILLING_ENABLE_CREDITS=true    # Optional: Enable credit grants
BILLING_ENABLE_WEBHOOKS=true   # Optional: Enable webhook events
```

## Usage

```typescript
import { BillingService } from '@unisane/billing';

const billingService = new BillingService();
await billingService.createSubscription({ planId: 'pro', tenantId: 'tenant_123' });
```
```

**Step 3: Optional Dependencies**

```typescript
// packages/modules/billing/src/domain/billing.service.ts
import { getConfig } from '@unisane/kernel';

export class BillingService {
  private config = getConfig();

  async processPayment(data: PaymentData) {
    const payment = await this.stripe.charge(data);

    // Credits are optional - use dynamic import
    if (this.config.features.billing?.enableCredits) {
      try {
        const { grant } = await import('@unisane/credits');
        await grant(payment.amount * 10);
      } catch (err) {
        this.logger.warn('Credits module not available', { err });
      }
    }

    // Webhooks are optional
    if (this.config.features.billing?.enableWebhooks) {
      try {
        const { notify } = await import('@unisane/webhooks');
        await notify('payment.success', { paymentId: payment.id });
      } catch (err) {
        this.logger.warn('Webhooks module not available', { err });
      }
    }

    return payment;
  }
}
```

**Verification**:

```bash
# Check no modules import internals (should only find index imports)
grep -r "from '@unisane/[^']*/" packages/modules/ | grep -v "from '@unisane/[^/]*'"

# Expected: No results (all imports should be from package root, not subpaths)

# Check all modules have README
find packages/modules -name "README.md" -type f | wc -l
# Expected: 15 (one per module)

# Verify exports only from index.ts
for module in packages/modules/*/; do
  echo "Checking $module"
  grep -l "export.*from.*/" "$module/src/index.ts" && echo "  ⚠️  Re-exports internals"
done
```

**Definition of Done**:
- ✅ All modules only export public API from `src/index.ts`
- ✅ All modules have `README.md` with dependencies documented
- ✅ Optional dependencies use dynamic imports
- ✅ No modules import from other modules' internals
- ✅ TypeScript compiles without errors
- ✅ All tests still pass after refactoring
- ✅ No breaking changes to existing functionality

---

## Phase 4: Production Launch Prep (Week 4-5) 🚀

**Why Last**: Final polish and verification before production launch.

---

### 4.1 Complete Documentation for Production

**Priority**: 🟡 HIGH
**Status**: ⚠️ Partial
**Estimated Time**: 2-3 days
**Assignee**: ___________

**Documentation Needed**:

- [ ] **4.1.1** Deployment Guide
  - Location: `docs/deployment/`
  - Environment setup (production vs staging)
  - Database migration procedures
  - Rollback procedures

- [ ] **4.1.2** Operations Runbooks
  - Location: `docs/operations/`
  - How to handle common incidents
  - Secret rotation procedures
  - Database backup/restore procedures

- [ ] **4.1.3** Architecture Decision Records (ADRs)
  - Location: `docs/adr/`
  - Document why contract-first architecture
  - Document why AsyncLocalStorage for context
  - Document why cursor-based pagination

- [ ] **4.1.4** API Documentation
  - Generate OpenAPI spec
  - Host API docs (Swagger UI or similar)
  - Add examples for all endpoints

- [ ] **4.1.5** Security Documentation
  - Document PII encryption approach
  - Document authentication flows
  - Document rate limiting policies

- [ ] **4.1.6** Developer Onboarding Guide
  - How to set up local environment
  - How to run tests
  - How to generate routes/SDK
  - How to add new modules

**Definition of Done**:
- ✅ All documentation written and reviewed
- ✅ Documentation hosted and accessible
- ✅ New team members can onboard from docs alone

---

### 4.2 Production Environment Setup

**Priority**: 🔴 CRITICAL
**Status**: ❌ Not Started
**Estimated Time**: 2 days
**Assignee**: ___________

**Tasks**:

- [ ] **4.2.1** Set up production MongoDB cluster
  - Configure replica set for high availability
  - Set up automated backups
  - Configure monitoring and alerts

- [ ] **4.2.2** Set up production Redis/Upstash
  - Configure persistence (if needed)
  - Set up monitoring
  - Configure alerts for connection issues

- [ ] **4.2.3** Configure production secrets
  - Generate production encryption keys
  - Generate JWT keys
  - Store in secrets manager (AWS Secrets Manager, Vault, etc.)

- [ ] **4.2.4** Set up production deployment
  - Choose deployment platform (Vercel, AWS, GCP, etc.)
  - Configure CI/CD for automatic deployments
  - Set up staging environment

- [ ] **4.2.5** Configure monitoring and observability
  - Set up application monitoring (Datadog, New Relic, etc.)
  - Set up error tracking (Sentry, Rollbar, etc.)
  - Set up log aggregation
  - Configure alerts for critical errors

- [ ] **4.2.6** Set up CDN and caching
  - Configure CDN for static assets
  - Configure API response caching where appropriate

- [ ] **4.2.7** Performance testing
  - Load test critical endpoints
  - Verify database query performance
  - Set performance budgets

**Definition of Done**:
- ✅ Production infrastructure provisioned
- ✅ Secrets stored securely
- ✅ Monitoring and alerts configured
- ✅ Performance validated

---

### 4.3 Security Audit and Penetration Testing

**Priority**: 🔴 CRITICAL
**Status**: ❌ Not Started
**Estimated Time**: 2-3 days
**Assignee**: ___________

**Tasks**:

- [ ] **4.3.1** Run automated security scans
  - npm audit / pnpm audit
  - OWASP dependency check
  - Snyk or similar

- [ ] **4.3.2** Manual security review
  - Review authentication flows
  - Review authorization checks
  - Review SQL/NoSQL injection risks
  - Review XSS risks

- [ ] **4.3.3** Test tenant isolation
  - Attempt to access other tenant's data
  - Verify tenantFilter() used everywhere
  - Test tenant switching edge cases

- [ ] **4.3.4** Test rate limiting
  - Verify rate limits enforced
  - Test rate limit bypass attempts

- [ ] **4.3.5** Test session management
  - Verify session expiration
  - Test session fixation attacks
  - Test CSRF protection

- [ ] **4.3.6** Run penetration testing
  - Hire external security firm (recommended)
  - Or use automated pen testing tools
  - Fix all critical/high findings

**Definition of Done**:
- ✅ All security scans passing
- ✅ No critical or high vulnerabilities
- ✅ Tenant isolation verified
- ✅ Penetration test completed and findings fixed

---

### 4.4 Performance Optimization

**Priority**: 🟢 MEDIUM
**Status**: ❌ Not Started
**Estimated Time**: 2-3 days
**Assignee**: ___________

**Tasks**:

- [ ] **4.4.1** Database query optimization
  - Add indexes for common queries
  - Verify no N+1 query problems
  - Use explain plans to optimize slow queries

- [ ] **4.4.2** Add database query instrumentation
  - Log slow queries (>100ms)
  - Add database metrics to monitoring

- [ ] **4.4.3** API response caching
  - Cache frequently accessed data
  - Implement cache invalidation strategy
  - Add cache hit/miss metrics

- [ ] **4.4.4** Bundle size optimization
  - Analyze client bundle size
  - Add code splitting where appropriate
  - Lazy load non-critical modules

- [ ] **4.4.5** Image optimization
  - Verify Next.js Image component used
  - Configure image CDN
  - Add appropriate image formats (WebP, AVIF)

**Definition of Done**:
- ✅ All critical endpoints respond in <500ms (p95)
- ✅ No slow queries (all queries <100ms)
- ✅ Client bundle size <500kb gzipped
- ✅ Images optimized and lazy loaded

---

### 4.5 Final Production Readiness Checklist

**Priority**: 🔴 CRITICAL
**Status**: ❌ Not Started
**Estimated Time**: 1 day
**Assignee**: ___________

**Go/No-Go Checklist**:

#### Security ✅
- [ ] PII encryption implemented and verified
- [ ] All security headers present (A+ rating on securityheaders.com)
- [ ] Secrets audit complete, no secrets in logs
- [ ] Security scan passing (no critical/high vulnerabilities)
- [ ] Penetration test complete and findings fixed

#### Quality ✅
- [ ] All 15 modules have test coverage ≥80%
- [ ] 1000+ tests passing
- [ ] CI blocking on test failures
- [ ] Integration tests passing
- [ ] E2E tests passing

#### Reliability ✅
- [ ] Rate limiting working and consistent (no duplication)
- [ ] Pagination standardized (cursor-based everywhere)
- [ ] Circuit breakers integrated for external services
- [ ] Health checks with dependency monitoring
- [ ] Error handling comprehensive

#### Operations ✅
- [ ] Production infrastructure provisioned
- [ ] Monitoring and alerts configured
- [ ] Database backups configured
- [ ] Documentation complete (deployment, operations, runbooks)
- [ ] Rollback procedures documented and tested

#### Performance ✅
- [ ] Load testing complete (meets SLAs)
- [ ] Database queries optimized (all <100ms)
- [ ] API endpoints fast (p95 <500ms)
- [ ] Client bundle optimized (<500kb)

#### Compliance ✅
- [ ] GDPR compliance reviewed (if applicable)
- [ ] Data retention policies documented
- [ ] Privacy policy updated
- [ ] Terms of service updated

**Final Sign-off**:
- [ ] Engineering lead approval
- [ ] Security team approval
- [ ] Product lead approval
- [ ] **READY FOR PRODUCTION LAUNCH** 🚀

---

## 📈 Progress Tracking

### Overall Progress

| Phase | Status | Progress | Est. Time | Actual Time |
|-------|--------|----------|-----------|-------------|
| Phase 1: Security | ⏳ Not Started | 0% | 5-7 days | ___ |
| Phase 2: Quality | ⏳ Not Started | 0% | 7-10 days | ___ |
| Phase 3: Hardening | ⏳ Not Started | 0% | 5-7 days | ___ |
| Phase 4: Launch Prep | ⏳ Not Started | 0% | 3-5 days | ___ |
| **TOTAL** | **⏳** | **0%** | **3-5 weeks** | **___** |

### Phase Completion

**Phase 1: Critical Security Fixes** (0/3 complete)
- [ ] 1.1 PII Encryption Integration
- [ ] 1.2 Security Headers
- [ ] 1.3 Secrets Audit

**Phase 2: Quality Foundation** (0/4 complete)
- [ ] 2.1 Complete Test Coverage (7 modules)
- [ ] 2.2 Service Layer Tests (8 modules)
- [ ] 2.3 Fix CI Configuration
- [ ] 2.4 Coverage Thresholds

**Phase 3: Production Hardening** (0/6 complete)
- [ ] 3.1 Fix Rate Limiting Duplication
- [ ] 3.2 Verify Pagination Consistency
- [ ] 3.3 Circuit Breaker Integration
- [ ] 3.4 Integration Tests
- [ ] 3.5 Enhanced Health Checks
- [ ] 3.6 Module Boundary Safety Nets

**Phase 4: Launch Prep** (0/5 complete)
- [ ] 4.1 Documentation
- [ ] 4.2 Production Environment
- [ ] 4.3 Security Audit
- [ ] 4.4 Performance Optimization
- [ ] 4.5 Final Readiness Checklist

---

## 🎯 Success Metrics

### Quality Metrics
- **Test Coverage**: ≥80% across all modules (currently ~50%)
- **Test Count**: ≥1500 tests (currently ~900)
- **CI Reliability**: 100% of test failures block merges (currently 0%)

### Security Metrics
- **PII Encryption**: 100% of sensitive fields encrypted (currently 0%)
- **Security Headers**: A+ rating on securityheaders.com (currently C)
- **Vulnerabilities**: 0 critical/high vulnerabilities

### Reliability Metrics
- **API Latency**: p95 <500ms for all endpoints
- **Database Queries**: p95 <100ms for all queries
- **Circuit Breaker**: 100% of external calls wrapped

### System Rating
- **Current**: 9.2/10 (excellent architecture, critical gaps)
- **Target**: 9.7/10 (production-ready with all gaps filled)

---

## 📚 References

- **Verification Report**: `ROADMAP-VERIFICATION-FINDINGS.md` - Detailed analysis of current state
- **Previous Roadmap**: `ISSUES-ROADMAP-CLEANED.md` - What was claimed vs reality
- **Architecture Context**: `CLAUDE.md` - AI-friendly architecture documentation

---

## 🔄 Roadmap Maintenance

**Update Frequency**: Weekly
**Owner**: Engineering Lead
**Review Process**:
1. Update task completion status
2. Update progress percentages
3. Update actual time spent
4. Adjust estimates based on velocity
5. Add/remove tasks as needed

**Last Updated**: 2026-01-12
**Next Review**: 2026-01-19
