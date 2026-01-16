# Architecture Audit Findings - January 2025

> **For LLMs**: Comprehensive audit of the entire Unisane monorepo. Use this document to understand all identified issues, their severity, and the phased remediation plan.

---

## Executive Summary

| Metric | Count |
|--------|-------|
| **Layers Analyzed** | 5 (Foundation, Adapters, Modules, Starters, Devtools) |
| **Total Issues Found** | 67 |
| **Critical (P0)** | 8 |
| **High Priority (P1)** | 19 |
| **Medium Priority (P2)** | 24 |
| **Low Priority (P3)** | 16 |
| **Lines of Code Analyzed** | ~80,000 |

### Overall Health by Layer

| Layer | Grade | Production Ready? | Key Concerns |
|-------|-------|-------------------|--------------|
| **Foundation (Kernel + Gateway)** | 7.5/10 | ⚠️ After P0 fixes | API key cache, request timeouts |
| **Adapters** | 6.5/10 | ❌ Critical gaps | Path traversal, incomplete Razorpay |
| **Modules** | 7.5/10 | ⚠️ After P0 fixes | Credits bug, permission cache |
| **SaaSKit Starter** | 6.5/10 | ❌ Security issues | Secrets committed, CSP, CSRF |
| **Devtools** | 7.5/10 | ⚠️ After P1 fixes | Build error handling |

---

## Issue Registry

### P0 - Critical (Must Fix Before Production)

| ID | Issue | Layer | Impact | Location |
|----|-------|-------|--------|----------|
| **P0-SEC-001** | Secrets committed in .env.local | SaaSKit | Credential exposure | `.env.local` |
| **P0-SEC-002** | API key revocation cache lag (5 min) | Foundation | Revoked keys remain valid | `gateway/src/auth/auth.ts` |
| **P0-SEC-003** | Path traversal in S3 CopySource | Adapters | File system access | `storage-s3/src/index.ts:232` |
| **P0-SEC-004** | Path traversal in local storage | Adapters | File system access | `storage-local/src/index.ts:106` |
| **P0-BUG-001** | Credits consume idempotency bug | Modules | Double charging | `credits/src/service/consume.ts:20` |
| **P0-BUG-002** | Razorpay payment mode broken | Adapters | Payments fail | `billing-razorpay/src/index.ts:117` |
| **P0-SEC-005** | CSRF not validated on signout | SaaSKit | Account takeover | `/api/auth/signout/route.ts` |
| **P0-SEC-006** | CSP allows unsafe-inline in prod | SaaSKit | XSS not mitigated | `proxy.ts:44` |

### P1 - High Priority (Fix Within Sprint 1)

| ID | Issue | Layer | Impact | Location |
|----|-------|-------|--------|----------|
| **P1-SEC-001** | Missing PII encryption | SaaSKit | Privacy violation | `.env.local` |
| **P1-SEC-002** | Permission cache silent failure | Modules | Wrong permissions | `identity/src/service/perms.ts:73` |
| **P1-REL-001** | No request timeout protection | Foundation | Hanging requests | Multiple |
| **P1-REL-002** | 49 console.log in production | Foundation | Bypasses logging | Multiple |
| **P1-REL-003** | Memory leaks in timers | Foundation | Resource exhaustion | HealthMonitor, CircuitBreaker |
| **P1-REL-004** | Missing rate limits on expensive ops | SaaSKit | DoS vulnerability | PDF, AI, Storage routes |
| **P1-REL-005** | Devtools build failures ignored | Devtools | Stale code generation | `gen.ts:96-98` |
| **P1-VAL-001** | No Zod validation in Razorpay | Adapters | Config errors missed | `billing-razorpay/src/index.ts:52` |
| **P1-VAL-002** | No Zod validation in GCS | Adapters | Config errors missed | `storage-gcs/src/index.ts` |
| **P1-VAL-003** | No Zod validation in local storage | Adapters | Config errors missed | `storage-local/src/index.ts` |
| **P1-VAL-004** | No env validation in bootstrap | SaaSKit | Silent provider failures | `bootstrap.ts:199` |
| **P1-BUG-001** | Stripe error swallowing | Adapters | Hidden failures | `billing-stripe/src/index.ts:166` |
| **P1-BUG-002** | Dynamic require in outbox | Adapters | CJS/ESM issues | `outbox-mongodb/src/index.ts:69` |
| **P1-BUG-003** | Usage increment allows negative | Modules | Counter manipulation | `usage/src/service/increment.ts:14` |
| **P1-BUG-004** | Leaky Promise.race in Resend | Adapters | Timer leaks | `email-resend/src/index.ts:84` |
| **P1-BUG-005** | Import regex too simplistic | Devtools | Parser failures | `router-parser.ts:14` |
| **P1-TYPE-001** | Type assertions (as unknown) | Foundation | Type safety gaps | 42 files |
| **P1-RACE-001** | Membership seat limit race | Modules | Exceed seat limits | `membership.ts:42-60` |
| **P1-MISS-001** | Missing storage quota check | Modules | Resource exhaustion | `storage/src/service/upload.ts` |

### P2 - Medium Priority (Fix Within Sprint 2-3)

| ID | Issue | Layer | Impact | Location |
|----|-------|-------|--------|----------|
| **P2-SEC-001** | Email regex too permissive | Foundation | Invalid emails | `email.ts` |
| **P2-SEC-002** | Regex-based HTML sanitization | Foundation | XSS bypass possible | `sanitize.ts` |
| **P2-SEC-003** | Disposable email list hardcoded | Foundation | Bypass prevention | `email.ts` |
| **P2-REL-001** | Fixed window rate limiting | Gateway | Timing attacks | `rateLimit.ts` |
| **P2-REL-002** | No graceful degradation for KV | Foundation | Service outage | `cache/provider.ts` |
| **P2-REL-003** | Settings cache race window | Modules | Stale data | `settings/src/service/patch.ts` |
| **P2-REL-004** | Random signing secret (local) | Adapters | URL invalidation | `storage-local/src/index.ts:82` |
| **P2-REL-005** | No multipart upload in S3 | Adapters | Large file limits | `storage-s3/src/index.ts` |
| **P2-VAL-001** | Vercel KV silent error handling | Foundation | Debug difficulty | `cache/provider.ts` |
| **P2-VAL-002** | DATABASE_PROVIDER unchecked cast | Foundation | Invalid config | `database/port/index.ts:41` |
| **P2-VAL-003** | Admin filter no complexity limit | SaaSKit | DoS via filters | `admin/*/route.ts` |
| **P2-BUG-001** | MongoDB URI parsing fragile | Adapters | Connection issues | `database-mongodb/src/index.ts:57` |
| **P2-BUG-002** | GCS metadata nesting unclear | Adapters | API mismatch | `storage-gcs/src/index.ts:107` |
| **P2-BUG-003** | SSE no reconnection guidance | SaaSKit | Message loss | `inapp/stream/route.ts` |
| **P2-MISS-001** | No audit log for refunds | Modules | Compliance gap | `billing` module |
| **P2-MISS-002** | Email preferences not implemented | Modules | User opt-out missing | `notify/src/service/email.ts:29` |
| **P2-MISS-003** | Phone SMS integration TODO | Modules | Feature incomplete | `auth/src/service/phoneStart.ts` |
| **P2-MISS-004** | Tenant status field missing | Modules | Active/inactive state | `tenants` module |
| **P2-MISS-005** | No structured request logging | SaaSKit | Debug difficulty | Routes |
| **P2-MISS-006** | Content comparison TODO | Devtools | Unnecessary writes | `gen.ts:257` |
| **P2-DX-001** | No customization in devtools | Devtools | Fork required | Multiple |
| **P2-DX-002** | Missing CLI commands | Devtools | Feature incomplete | `init`, `crud` |
| **P2-PERF-001** | O(n) directory walk | Adapters | Slow listings | `storage-local/src/index.ts:309` |
| **P2-PERF-002** | N+1 query potential | SaaSKit | Slow admin pages | Admin endpoints |

### P3 - Low Priority (Nice to Have)

| ID | Issue | Layer | Impact | Location |
|----|-------|-------|--------|----------|
| **P3-001** | Inconsistent error factory naming | Gateway | API confusion | `errors.ts` |
| **P3-002** | Flag exposure reason incomplete | Modules | Analytics quality | `flags/evaluate.ts:42` |
| **P3-003** | Webhook payload no size limit | Modules | Storage growth | `webhooks/recordOutbound.ts` |
| **P3-004** | actorId can be forged in audit | Modules | Audit integrity | `audit/append.ts:21` |
| **P3-005** | No CORS middleware in gateway | Foundation | Relies on upstream | Gateway |
| **P3-006** | Session leak risk in MongoDB | Adapters | Connection pool | `database-mongodb/src/index.ts:202` |
| **P3-007** | No credentials rotation support | Adapters | Key management | SES, GCS adapters |
| **P3-008** | Jobs adapter no error handling | Adapters | Silent failures | `jobs-inngest/src/index.ts:60` |
| **P3-009** | Duplicate scope filter logic | Foundation | DRY violation | `scope/helpers.ts` |
| **P3-010** | Missing index documentation | Foundation | Query performance | Soft delete filters |
| **P3-011** | Global DI pattern | Modules | Thread safety | `providers.ts` files |
| **P3-012** | No API versioning strategy | SaaSKit | Breaking changes | Contracts |
| **P3-013** | Route params all typed string | Devtools | Type narrowing | Generated routes |
| **P3-014** | AI module demo only | Modules | Incomplete | `ai/src/service/generate.ts` |
| **P3-015** | Presigned URL 15min expiry | Modules | Slow upload fail | `storage` module |
| **P3-016** | Half-open circuit breaker | Foundation | Service overload | `resilience/` |

---

## Phased Remediation Plan

### Phase 0: Security Emergency (Week 1)

> **Goal**: Address all credential exposure and critical security vulnerabilities.

#### Tasks

| Task | Issue IDs | Owner | Est. Hours |
|------|-----------|-------|------------|
| Rotate all secrets and remove .env.local from git | P0-SEC-001 | DevOps | 4h |
| Fix API key revocation cache | P0-SEC-002 | Backend | 8h |
| Fix path traversal in S3 adapter | P0-SEC-003 | Backend | 2h |
| Fix path traversal in local storage | P0-SEC-004 | Backend | 4h |
| Add CSRF validation to signout | P0-SEC-005 | Backend | 2h |
| Harden CSP (remove unsafe-inline) | P0-SEC-006 | Frontend | 8h |
| Add PII encryption | P1-SEC-001 | Backend | 16h |

#### Checklist

```markdown
## Phase 0 Checklist

### Secrets Management
- [ ] Generate new JWT keypair
- [ ] Rotate OAuth secrets (Google, GitHub)
- [ ] Remove .env.local from repository
- [ ] Add .env.local to .gitignore
- [ ] Run `git filter-branch` to remove from history
- [ ] Set up secrets manager (AWS Secrets Manager / Vault)
- [ ] Update CI/CD to pull from secrets manager
- [ ] Verify no secrets in logs

### API Key Security
- [ ] Add cache invalidation endpoint for API keys
- [ ] Implement immediate revocation mechanism
- [ ] Add revocation event emission
- [ ] Test revocation within 60 seconds
- [ ] Document revocation API

### Path Traversal Fixes
- [ ] URL-encode sourceKey in S3 CopySource
- [ ] Use path.relative() + validation in local storage
- [ ] Add test cases for traversal attempts
- [ ] Security review of fix

### CSRF Protection
- [ ] Add CSRF token validation to /api/auth/signout
- [ ] Add CSRF token validation to /api/auth/csrf
- [ ] Test cookie-based auth flows
- [ ] Document CSRF requirements

### CSP Hardening
- [ ] Generate nonces for inline scripts
- [ ] Update Stripe script loading to use nonce
- [ ] Remove 'unsafe-inline' from script-src
- [ ] Test all pages for CSP violations
- [ ] Add CSP violation reporting endpoint

### PII Encryption
- [ ] Generate DATA_ENCRYPTION_KEY
- [ ] Implement field-level encryption for email
- [ ] Implement field-level encryption for phone
- [ ] Run data migration for existing records
- [ ] Document key rotation procedure
```

#### Success Criteria

- [ ] All secrets rotated and stored in secrets manager
- [ ] API keys revocable within 60 seconds
- [ ] No path traversal vulnerabilities
- [ ] CSRF protection on all cookie-auth endpoints
- [ ] CSP violation-free on all pages
- [ ] PII encrypted at rest

---

### Phase 1: Critical Bugs (Week 2)

> **Goal**: Fix all critical business logic bugs and data integrity issues.

#### Tasks

| Task | Issue IDs | Owner | Est. Hours |
|------|-----------|-------|------------|
| Fix credits consume idempotency | P0-BUG-001 | Backend | 4h |
| Fix Razorpay payment mode | P0-BUG-002 | Backend | 8h |
| Fix permission cache failure | P1-SEC-002 | Backend | 4h |
| Fix Stripe error swallowing | P1-BUG-001 | Backend | 2h |
| Fix usage increment validation | P1-BUG-003 | Backend | 1h |
| Fix devtools build error handling | P1-REL-005 | Tooling | 4h |
| Add missing Zod validations | P1-VAL-001,002,003 | Backend | 8h |

#### Checklist

```markdown
## Phase 1 Checklist

### Credits Module Fix
- [ ] Change idempotency key from `reason` to `${reason}:${requestId}`
- [ ] Add migration for existing entries
- [ ] Add test for duplicate consumption
- [ ] Verify deduplication works correctly
- [ ] Document idempotency contract

### Razorpay Fix
- [ ] Implement createPaymentLink correctly OR remove dead code
- [ ] Add test for payment link creation
- [ ] Add test for subscription creation
- [ ] Document supported payment modes

### Permission Cache Fix
- [ ] Add try-catch with cache invalidation on parse error
- [ ] Log parsing errors with context
- [ ] Add test for corrupted cache handling
- [ ] Add metric for cache parse failures

### Stripe Error Handling
- [ ] Remove silent catch in ensureCustomerId
- [ ] Propagate errors with proper context
- [ ] Add customer creation retry logic
- [ ] Log customer creation failures

### Usage Validation
- [ ] Add validation: `if (n <= 0) throw ERR.validation()`
- [ ] Add test for negative values
- [ ] Document increment contract

### Devtools Fix
- [ ] Change build error from warn to throw
- [ ] Add --ignore-build-errors flag for override
- [ ] Update CI to fail on stale contracts
- [ ] Document build requirements

### Adapter Validation
- [ ] Add Zod schema to Razorpay adapter
- [ ] Add Zod schema to GCS adapter
- [ ] Add Zod schema to local storage adapter
- [ ] Add tests for invalid configs
```

#### Success Criteria

- [ ] Credits module deduplicates correctly with unique keys
- [ ] Razorpay payments work or are clearly unsupported
- [ ] Permission cache failures handled gracefully
- [ ] No silent error swallowing in adapters
- [ ] All adapters validate configuration

---

### Phase 2: Reliability (Week 3-4)

> **Goal**: Add request timeouts, fix memory leaks, improve rate limiting.

#### Tasks

| Task | Issue IDs | Owner | Est. Hours |
|------|-----------|-------|------------|
| Add request timeout protection | P1-REL-001 | Backend | 16h |
| Replace console.log with logger | P1-REL-002 | Backend | 8h |
| Fix timer memory leaks | P1-REL-003 | Backend | 4h |
| Add rate limits to expensive ops | P1-REL-004 | Backend | 8h |
| Add storage quota enforcement | P1-MISS-001 | Backend | 8h |
| Fix Promise.race leak in Resend | P1-BUG-004 | Backend | 2h |
| Add env validation to bootstrap | P1-VAL-004 | Backend | 4h |

#### Checklist

```markdown
## Phase 2 Checklist

### Request Timeouts
- [ ] Create `withTimeout()` utility using AbortController
- [ ] Add timeout to all database operations (30s default)
- [ ] Add timeout to all adapter calls (10s default)
- [ ] Add timeout configuration per operation
- [ ] Add metric for timeout occurrences
- [ ] Document timeout configuration

### Logging Consolidation
- [ ] Audit all console.log/error calls (49 instances)
- [ ] Replace with structured logger
- [ ] Add module context to all logs
- [ ] Add request ID to all logs
- [ ] Remove or guard debug logs in production
- [ ] Verify log format consistency

### Timer Memory Leaks
- [ ] Add clearInterval to HealthMonitor on error
- [ ] Add clearTimeout to circuit breaker on exception
- [ ] Add try/finally pattern for timer cleanup
- [ ] Add test for timer cleanup
- [ ] Review all setInterval/setTimeout usage

### Rate Limiting
- [ ] Add rate limit to PDF generation (10 req/min/user)
- [ ] Add rate limit to AI generation (5 req/min/user)
- [ ] Add rate limit to file upload (100MB/hour/user)
- [ ] Implement user-based rate limiting (not just IP)
- [ ] Add rate limit headers to responses
- [ ] Document rate limits in OpenAPI

### Storage Quota
- [ ] Add quota configuration per plan
- [ ] Check quota before accepting upload
- [ ] Return clear error when quota exceeded
- [ ] Add admin endpoint to view/adjust quotas
- [ ] Document quota limits

### Resend Timer Fix
- [ ] Replace Promise.race with AbortController
- [ ] Add proper cleanup on success
- [ ] Add test for timeout cleanup

### Bootstrap Validation
- [ ] Add validateEnvOrThrow() at start of bootstrap
- [ ] Fail fast if email provider not configured
- [ ] Fail fast if billing provider not configured
- [ ] Document required environment variables
```

#### Success Criteria

- [ ] All external calls have timeout protection
- [ ] No console.log in production code
- [ ] No timer memory leaks
- [ ] Rate limits protect expensive operations
- [ ] Storage quota enforced per tenant
- [ ] Bootstrap fails fast on missing config

---

### Phase 3: Type Safety & Validation (Week 5)

> **Goal**: Improve type safety and input validation across the codebase.

#### Tasks

| Task | Issue IDs | Owner | Est. Hours |
|------|-----------|-------|------------|
| Audit and fix type assertions | P1-TYPE-001 | Backend | 16h |
| Fix import regex in devtools | P1-BUG-005 | Tooling | 8h |
| Fix dynamic require in outbox | P1-BUG-002 | Backend | 2h |
| Fix membership race condition | P1-RACE-001 | Backend | 8h |
| Improve email validation | P2-SEC-001 | Backend | 4h |

#### Checklist

```markdown
## Phase 3 Checklist

### Type Assertions Audit
- [ ] List all `as unknown` and `as any` usages (42 files)
- [ ] Categorize: necessary vs fixable
- [ ] Fix fixable type assertions
- [ ] Document necessary type assertions
- [ ] Enable noImplicitAny in tsconfig
- [ ] Add eslint rule for new type assertions

### Devtools Import Parsing
- [ ] Replace regex with ts-morph for imports
- [ ] Handle multi-line imports
- [ ] Handle default exports
- [ ] Handle namespace imports
- [ ] Add test cases for edge cases

### Outbox Dynamic Require
- [ ] Replace `require('mongodb')` with static import
- [ ] Update build configuration
- [ ] Test ESM compatibility
- [ ] Document import requirements

### Membership Race Condition
- [ ] Add distributed lock for seat limit check
- [ ] Or use atomic increment with rollback
- [ ] Add test for concurrent seat additions
- [ ] Document seat limit enforcement

### Email Validation
- [ ] Use RFC 5322 compliant validation library
- [ ] Or use email-validator package
- [ ] Add test cases for edge cases
- [ ] Document validation rules
```

#### Success Criteria

- [ ] Type assertions documented and minimized
- [ ] Devtools handles all import patterns
- [ ] No dynamic requires in production code
- [ ] Race conditions prevented with locks
- [ ] Email validation RFC compliant

---

### Phase 4: Observability (Week 6)

> **Goal**: Add structured logging, request tracing, and metrics.

#### Tasks

| Task | Issue IDs | Owner | Est. Hours |
|------|-----------|-------|------------|
| Add structured request logging | P2-MISS-005 | Backend | 16h |
| Add audit logging for billing | P2-MISS-001 | Backend | 8h |
| Add error tracking integration | - | Backend | 8h |
| Add adapter metrics | - | Backend | 16h |
| Document logging standards | - | Docs | 4h |

#### Checklist

```markdown
## Phase 4 Checklist

### Request Logging
- [ ] Create request logging middleware
- [ ] Log: method, path, status, duration
- [ ] Include auth context (userId, tenantId)
- [ ] Include request ID for correlation
- [ ] Redact sensitive fields
- [ ] Configure sampling for high-traffic routes

### Billing Audit
- [ ] Add audit entry for refund operations
- [ ] Add audit entry for subscription changes
- [ ] Add audit entry for plan changes
- [ ] Include before/after state
- [ ] Link to billing provider transaction ID

### Error Tracking
- [ ] Integrate Sentry (or similar)
- [ ] Configure source maps
- [ ] Add user context to errors
- [ ] Add scope context to errors
- [ ] Set up alerts for error spikes

### Adapter Metrics
- [ ] Create metrics collector
- [ ] Track: operation, duration, success/failure
- [ ] Track: circuit breaker state changes
- [ ] Track: retry counts
- [ ] Export to monitoring system
- [ ] Create dashboard

### Documentation
- [ ] Document log entry format
- [ ] Document log levels and when to use
- [ ] Document correlation ID propagation
- [ ] Create troubleshooting guide
```

#### Success Criteria

- [ ] All requests logged with context
- [ ] Billing operations fully auditable
- [ ] Errors tracked with context
- [ ] Adapter performance visible
- [ ] Logging standards documented

---

### Phase 5: Completeness (Week 7-8)

> **Goal**: Complete missing features and improve DX.

#### Tasks

| Task | Issue IDs | Owner | Est. Hours |
|------|-----------|-------|------------|
| Implement email preferences | P2-MISS-002 | Backend | 16h |
| Implement SMS integration | P2-MISS-003 | Backend | 16h |
| Add tenant status field | P2-MISS-004 | Backend | 8h |
| Fix HTML sanitization | P2-SEC-002 | Backend | 8h |
| Add graceful degradation for KV | P2-REL-002 | Backend | 8h |
| Implement token bucket rate limiting | P2-REL-001 | Backend | 8h |

#### Checklist

```markdown
## Phase 5 Checklist

### Email Preferences
- [ ] Define preference categories (marketing, transactional, etc.)
- [ ] Add preferences schema to identity
- [ ] Add preferences management API
- [ ] Check preferences before sending
- [ ] Add unsubscribe links to emails
- [ ] Document preference system

### SMS Integration
- [ ] Choose SMS provider (Twilio, SNS, etc.)
- [ ] Create SMS adapter following port pattern
- [ ] Implement phone verification flow
- [ ] Add rate limiting for SMS
- [ ] Document SMS setup

### Tenant Status
- [ ] Add status field (active, suspended, deleted)
- [ ] Add status checks to API routes
- [ ] Add admin endpoint to change status
- [ ] Handle suspended tenant access
- [ ] Document tenant lifecycle

### HTML Sanitization
- [ ] Replace regex with DOMPurify
- [ ] Configure allowed tags/attributes
- [ ] Add test cases for XSS payloads
- [ ] Document sanitization rules

### KV Degradation
- [ ] Add in-memory fallback for KV failures
- [ ] Log degradation events
- [ ] Add metric for fallback usage
- [ ] Configure fail-open vs fail-closed

### Token Bucket Rate Limiting
- [ ] Implement token bucket algorithm
- [ ] Or use sliding window algorithm
- [ ] Add burst handling
- [ ] Configure per operation
- [ ] Add Retry-After header
```

#### Success Criteria

- [ ] Users can manage email preferences
- [ ] Phone verification works end-to-end
- [ ] Tenant status enforced
- [ ] XSS protection robust
- [ ] System degrades gracefully
- [ ] Rate limiting resistant to timing attacks

---

### Phase 6: Polish & Documentation (Week 9)

> **Goal**: Clean up low priority issues and document everything.

#### Tasks

| Task | Issue IDs | Owner | Est. Hours |
|------|-----------|-------|------------|
| Fix remaining P3 issues | P3-* | Various | 24h |
| Update architecture docs | - | Docs | 16h |
| Add API versioning strategy | P3-012 | Backend | 8h |
| Improve devtools customization | P2-DX-001 | Tooling | 16h |
| Create operations runbook | - | DevOps | 8h |

#### Checklist

```markdown
## Phase 6 Checklist

### P3 Cleanup
- [ ] Triage remaining P3 issues
- [ ] Fix high-value P3 issues
- [ ] Document deferred issues with rationale
- [ ] Create backlog items for future

### Documentation
- [ ] Update ARCHITECTURE/INDEX.md
- [ ] Update all REFERENCE docs
- [ ] Add troubleshooting guide
- [ ] Add performance tuning guide
- [ ] Update README with setup instructions

### API Versioning
- [ ] Define versioning strategy (URL vs header)
- [ ] Document breaking change policy
- [ ] Add deprecation warning system
- [ ] Plan v2 migration path

### Devtools Customization
- [ ] Identify top customization requests
- [ ] Add configuration options where possible
- [ ] Document extension points
- [ ] Consider plugin system

### Operations Runbook
- [ ] Document deployment process
- [ ] Document rollback procedure
- [ ] Document incident response
- [ ] Document monitoring alerts
- [ ] Document scaling procedures
```

#### Success Criteria

- [ ] P3 issues triaged and tracked
- [ ] Documentation complete and current
- [ ] API versioning strategy defined
- [ ] Devtools more configurable
- [ ] Operations fully documented

---

## Verification Commands

```bash
# Phase 0: Security
git log --oneline .env.local  # Should show removal
curl -X POST /api/keys/revoke  # Should invalidate immediately
npm run test:security  # Should pass

# Phase 1: Bugs
npm run test:credits  # Should test idempotency
npm run test:billing  # Should test all payment modes

# Phase 2: Reliability
npm run test:timeouts  # Should verify timeout behavior
grep -r "console.log" src/  # Should be empty

# Phase 3: Types
npm run typecheck --strict  # Should pass
npm run lint  # Should pass

# Phase 4: Observability
curl /api/health  # Should return structured health
tail -f logs/app.log | jq  # Should be valid JSON

# Phase 5: Completeness
npm run test:e2e  # Should pass all flows

# Phase 6: Documentation
npm run docs:validate  # Should pass
```

---

## Risk Assessment

### High Risk Areas

| Area | Risk | Mitigation |
|------|------|------------|
| **Secret rotation** | Service disruption | Coordinate with deployments, staged rollout |
| **PII encryption migration** | Data corruption | Backup before migration, test on staging |
| **Rate limiting changes** | Legitimate users blocked | Start with high limits, monitor and adjust |
| **CSP changes** | Page breakage | Test all pages, have rollback ready |

### Rollback Procedures

1. **Secret rotation**: Keep old secrets valid for 24h overlap
2. **Database migrations**: Always use reversible migrations
3. **Config changes**: Feature flag new behavior
4. **Rate limits**: Disable via feature flag if issues

---

## Timeline Summary

| Phase | Duration | Focus | Blocking Issues |
|-------|----------|-------|-----------------|
| **Phase 0** | Week 1 | Security Emergency | P0-SEC-* |
| **Phase 1** | Week 2 | Critical Bugs | P0-BUG-*, P1-SEC-002 |
| **Phase 2** | Week 3-4 | Reliability | P1-REL-*, P1-MISS-001 |
| **Phase 3** | Week 5 | Type Safety | P1-TYPE-*, P1-RACE-* |
| **Phase 4** | Week 6 | Observability | P2-MISS-005 |
| **Phase 5** | Week 7-8 | Completeness | P2-MISS-*, P2-SEC-* |
| **Phase 6** | Week 9 | Polish | P3-* |

**Total Estimated Duration**: 9 weeks with 2-3 engineers

---

## Appendix A: Issue Details by Layer

### Foundation Layer (Kernel + Gateway)

| ID | Title | Severity | File | Line |
|----|-------|----------|------|------|
| P0-SEC-002 | API key cache lag | Critical | `auth.ts` | - |
| P1-REL-001 | No request timeout | High | Multiple | - |
| P1-REL-002 | 49 console.log calls | High | Multiple | - |
| P1-REL-003 | Timer memory leaks | High | `HealthMonitor`, `CircuitBreaker` | - |
| P1-TYPE-001 | Type assertions | High | 42 files | - |
| P2-SEC-001 | Email regex permissive | Medium | `email.ts` | - |
| P2-SEC-002 | Regex HTML sanitization | Medium | `sanitize.ts` | - |
| P2-REL-001 | Fixed window rate limit | Medium | `rateLimit.ts` | - |
| P2-REL-002 | No KV degradation | Medium | `cache/provider.ts` | - |
| P2-VAL-001 | Vercel KV silent errors | Medium | `cache/provider.ts` | - |
| P2-VAL-002 | DATABASE_PROVIDER cast | Medium | `database/port/index.ts` | 41 |

### Adapters Layer

| ID | Title | Severity | File | Line |
|----|-------|----------|------|------|
| P0-SEC-003 | S3 path traversal | Critical | `storage-s3/src/index.ts` | 232 |
| P0-SEC-004 | Local path traversal | Critical | `storage-local/src/index.ts` | 106 |
| P0-BUG-002 | Razorpay payment broken | Critical | `billing-razorpay/src/index.ts` | 117 |
| P1-VAL-001 | No Razorpay Zod | High | `billing-razorpay/src/index.ts` | 52 |
| P1-VAL-002 | No GCS Zod | High | `storage-gcs/src/index.ts` | - |
| P1-VAL-003 | No local storage Zod | High | `storage-local/src/index.ts` | - |
| P1-BUG-001 | Stripe error swallow | High | `billing-stripe/src/index.ts` | 166 |
| P1-BUG-002 | Dynamic require | High | `outbox-mongodb/src/index.ts` | 69 |
| P1-BUG-004 | Promise.race leak | High | `email-resend/src/index.ts` | 84 |
| P2-REL-004 | Random signing secret | Medium | `storage-local/src/index.ts` | 82 |
| P2-REL-005 | No multipart upload | Medium | `storage-s3/src/index.ts` | - |
| P2-BUG-001 | MongoDB URI parsing | Medium | `database-mongodb/src/index.ts` | 57 |
| P2-BUG-002 | GCS metadata nesting | Medium | `storage-gcs/src/index.ts` | 107 |
| P2-PERF-001 | O(n) directory walk | Medium | `storage-local/src/index.ts` | 309 |

### Modules Layer

| ID | Title | Severity | File | Line |
|----|-------|----------|------|------|
| P0-BUG-001 | Credits idempotency | Critical | `credits/src/service/consume.ts` | 20 |
| P1-SEC-002 | Permission cache fail | High | `identity/src/service/perms.ts` | 73 |
| P1-BUG-003 | Usage negative allow | High | `usage/src/service/increment.ts` | 14 |
| P1-RACE-001 | Seat limit race | High | `identity/src/service/membership.ts` | 42 |
| P1-MISS-001 | No storage quota | High | `storage/src/service/upload.ts` | - |
| P2-REL-003 | Settings cache race | Medium | `settings/src/service/patch.ts` | - |
| P2-MISS-001 | No refund audit | Medium | `billing` module | - |
| P2-MISS-002 | Email prefs TODO | Medium | `notify/src/service/email.ts` | 29 |
| P2-MISS-003 | Phone SMS TODO | Medium | `auth/src/service/phoneStart.ts` | - |
| P2-MISS-004 | Tenant status missing | Medium | `tenants` module | - |

### SaaSKit Starter

| ID | Title | Severity | File | Line |
|----|-------|----------|------|------|
| P0-SEC-001 | Secrets committed | Critical | `.env.local` | - |
| P0-SEC-005 | CSRF on signout | Critical | `/api/auth/signout/route.ts` | - |
| P0-SEC-006 | CSP unsafe-inline | Critical | `proxy.ts` | 44 |
| P1-SEC-001 | No PII encryption | High | `.env.local` | - |
| P1-REL-004 | Missing rate limits | High | PDF, AI, Storage routes | - |
| P1-VAL-004 | No bootstrap env val | High | `bootstrap.ts` | 199 |
| P2-VAL-003 | Admin filter DoS | Medium | `admin/*/route.ts` | - |
| P2-BUG-003 | SSE no reconnect | Medium | `inapp/stream/route.ts` | - |
| P2-MISS-005 | No request logging | Medium | Routes | - |
| P2-PERF-002 | N+1 query potential | Medium | Admin endpoints | - |

### Devtools

| ID | Title | Severity | File | Line |
|----|-------|----------|------|------|
| P1-REL-005 | Build errors ignored | High | `gen.ts` | 96 |
| P1-BUG-005 | Import regex simple | High | `router-parser.ts` | 14 |
| P2-MISS-006 | Content compare TODO | Medium | `gen.ts` | 257 |
| P2-DX-001 | No customization | Medium | Multiple | - |
| P2-DX-002 | Missing CLI commands | Medium | `init`, `crud` | - |
| P3-013 | Params all string | Low | Generated routes | - |

---

## Appendix B: Cross-Reference to Existing Docs

| New Issue ID | Existing Doc Reference |
|--------------|----------------------|
| P0-SEC-002 | Similar to K-001 (resolved differently) |
| P0-BUG-002 | Related to BR-001, BR-002 |
| P1-REL-005 | Related to DT-001 |

---

> **Last Updated**: 2025-01-16 | **Audit Version**: 2.0 | **Auditor**: Claude Code Deep Analysis
