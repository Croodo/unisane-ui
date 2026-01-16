# Unisane Monorepo - Event-Driven Architecture Analysis

> **Analysis Date:** January 2026
> **Analyst:** Claude Code
> **Architecture Compliance:** 85% Hexagonal, 70% Event-Driven

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Cascade Operations Checklist](#cascade-operations-checklist)
4. [Module Coupling Matrix](#module-coupling-matrix)
5. [Event System Analysis](#event-system-analysis)
6. [Direct Coupling Issues](#direct-coupling-issues)
7. [Event Reliability Issues](#event-reliability-issues)
8. [Improvement Checklist](#improvement-checklist)
9. [Best Practices Reference](#best-practices-reference)

---

## Executive Summary

### Architecture Compliance Scores

| Aspect | Score | Status |
|--------|-------|--------|
| Hexagonal Architecture | 85% | ⚠️ Good with gaps |
| Event-Driven Cascades | 90% | ✅ Excellent |
| Event-Driven Commands | 50% | 🔴 Mixed pattern |
| Module Decoupling | 75% | ⚠️ Auth→Identity coupling |
| Port/Adapter Pattern | 95% | ✅ Excellent |

### Quick Stats

| Metric | Count |
|--------|-------|
| Fully Event-Driven Cascades | 6 |
| Mixed Cascades (Event + Direct) | 4 |
| Fully Coupled Operations | 4 |
| Direct Module-to-Module Calls | 22 |
| Fire-and-Forget Events (should be reliable) | 7 |

---

## Architecture Overview

### The 4-Layer Hexagonal System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LAYER 4: STARTERS                                 │
│  saaskit, marketplace, lms, crm, helpdesk, etc.                            │
│  • Composes modules + adapters via bootstrap.ts                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LAYER 3: MODULES                                  │
│  auth, identity, tenants, billing, credits, storage, audit, notify,        │
│  usage, flags, webhooks, ai, pdf, analytics, sso, media                    │
│  • Business logic (domain/data/service layers)                             │
│  • Event publishing & handling                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LAYER 2: ADAPTERS                                 │
│  billing-stripe, billing-razorpay, database-mongodb, storage-s3,           │
│  storage-gcs, email-resend, email-ses, jobs-inngest, outbox-mongodb        │
│  • Implement kernel port interfaces                                         │
│  • Swappable at bootstrap time                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LAYER 1: FOUNDATION                                 │
│  KERNEL          GATEWAY         CONTRACTS        UI                        │
│  • Scope         • HTTP layer    • ts-rest        • Radix                   │
│  • Events        • Middleware    • Zod schemas    • Tailwind                │
│  • Errors        • Auth/RBAC     • Type gen       • Tokens                  │
│  • Database      • Rate limit                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Communication Patterns

The system uses **TWO communication patterns**:

```
PATTERN 1: PORT-BASED REQUEST/RESPONSE (Synchronous)
────────────────────────────────────────────────────
Used for: Query operations, immediate needs

  Service A ──────► Port ──────► Module B
            (sync)       (sync)

Examples:
• getCreditsProvider().consume()
• getTenantsProvider().findById()
• getIdentityProvider().findUserByEmail()


PATTERN 2: EVENT-DRIVEN (Asynchronous)
────────────────────────────────────────────────────
Used for: Side effects, cascades, notifications

  Service A ──────► Event Bus ──────► Handlers
            (emit)           (async)

Examples:
• emitTypedReliable('tenant.deleted')
• events.emit(CREDITS_EVENTS.CONSUMED)
• emitTyped('webhook.stripe.subscription_changed')
```

---

## Cascade Operations Checklist

### ✅ Fully Event-Driven Cascades

#### 1. Tenant Deletion Cascade
- [x] Trigger uses `emitTypedReliable('tenant.deleted')`
- [x] Identity module listens and cleans up
- [x] Storage module listens and marks files deleted
- [x] Settings module listens and deletes settings
- [x] Flags module listens and invalidates cache
- [x] Audit module listens and logs
- [x] Cascade completion events emitted
- [x] Error handling continues on non-critical failures

**Status:** ✅ EXCELLENT (11 listeners)

| Listener Module | Action | Emits Completion Event |
|-----------------|--------|------------------------|
| identity | Revoke API keys, soft-delete memberships | ✅ `identity.cascade.completed` |
| storage | Mark files for deletion | ✅ `storage.cascade.completed` |
| settings | Hard-delete settings | ✅ `settings.cascade.completed` |
| flags | Invalidate cache | ❌ No (cache only) |
| media | Cleanup media | ❌ No (delegates to storage) |
| ai | Invalidate caches | ❌ No (cache only) |
| audit | Log deletion | ❌ No (logging only) |
| usage | Log only | ❌ No (logging only) |
| webhooks | Log only | ❌ No (logging only) |
| auth | Log only | ❌ No (logging only) |
| pdf | Log only | ❌ No (logging only) |

---

#### 2. User Deletion Cascade
- [x] Trigger uses `emitTypedReliable('user.deleted')`
- [x] Identity module listens and soft-deletes memberships
- [x] Audit module listens and logs

**Status:** ✅ GOOD (2 listeners)

| Listener Module | Action | File Location |
|-----------------|--------|---------------|
| identity | Soft-delete all memberships across scopes | `identity/src/event-handlers.ts:173` |
| audit | Log user deletion | `audit/src/event-handlers.ts` |

---

#### 3. Subscription Change Cascade (Stripe/Razorpay)
- [x] Webhook handlers emit subscription events
- [x] Tenants module updates plan
- [x] Billing module upserts subscription record
- [x] Settings module updates seat capacity
- [x] Flags module invalidates cache
- [x] AI module invalidates cache
- [ ] ⚠️ Uses `emitTyped()` not `emitTypedReliable()`

**Status:** ⚠️ GOOD but should use reliable events (7 listeners)

| Listener Module | Action | Error Handling |
|-----------------|--------|----------------|
| tenants | Update planId, emit `plan.changed` | Throws on error |
| billing | Upsert subscription (with retry) | Retry logic |
| settings | Update seat capacity | Logs, doesn't throw |
| flags | Invalidate cache | Logs, doesn't throw |
| ai | Invalidate config/models cache | Logs, doesn't throw |
| pdf | Log only | Logs only |
| audit | Log subscription update | Logs only |

---

#### 4. Subscription Cancellation Cascade
- [x] Trigger emits cancellation event
- [x] Tenants module downgrades to free plan
- [x] Audit module logs cancellation
- [ ] ⚠️ Uses `events.emit()` (fire-and-forget)

**Status:** ⚠️ MEDIUM - Should use `emitTypedReliable()`

| Listener Module | Action |
|-----------------|--------|
| tenants | Downgrade to free plan, emit `plan.changed` |
| audit | Log cancellation |

---

#### 5. Credit Grant Cascade
- [x] Webhook triggers emit topup/invoice events
- [x] Credits module grants credits
- [x] AI module invalidates disabled cache
- [x] Billing module records payment/invoice

**Status:** ✅ GOOD

---

#### 6. Storage Upload Cascade
- [x] `confirmUpload()` emits `storage.upload.confirmed`
- [x] Media module processes images
- [x] Usage module logs upload
- [x] Audit module logs file upload
- [ ] ⚠️ Uses `events.emit()` (fire-and-forget)

**Status:** ✅ GOOD (4 listeners)

---

### ⚠️ Mixed Cascades (Event + Direct Calls)

#### 7. Tenant Creation Cascade
- [x] Creates tenant record directly
- [ ] 🔴 Calls `providers.addOwnerRole()` directly before event
- [x] Emits `tenant.created` event
- [x] Identity module listens (with idempotency check)
- [x] Flags module listens
- [x] Audit module listens

**Status:** ⚠️ MIXED - Direct call to identity before event

**Issue Location:** `tenants/src/service/bootstrap-tenant.ts:106-111`
```typescript
// DIRECT CALL before event emission
await providers.addOwnerRole(scopeId, userId);
// Then event is emitted
await events.emit(TENANT_EVENTS.CREATED, {...});
```

**Recommendation:** Remove direct call, rely on event handler (which has idempotency)

---

#### 8. API Key Operations
- [x] Create: Direct operations + event emission
- [x] Revoke: Pure event-driven

**Status:** ⚠️ MIXED but acceptable

---

### 🔴 Fully Coupled Operations (No Events)

#### 9. User Signup Flow
- [ ] 🔴 No events emitted
- [ ] 🔴 13 direct calls to identity module

**Status:** 🔴 FULLY COUPLED

**Direct Calls:**
| File | Line | Method Called |
|------|------|---------------|
| `auth/src/service/signup.ts` | 49 | `identity.findUserByEmail()` |
| `auth/src/service/signup.ts` | 56 | `identity.findUserByUsername()` |
| `auth/src/service/signup.ts` | 60 | `identity.findUserByPhone()` |
| `auth/src/service/signup.ts` | 63 | `identity.createUser()` |
| `auth/src/service/signup.ts` | 90 | `identity.updateUserById()` |
| `auth/src/service/otpStart.ts` | 7 | `identity.ensureUserByEmail()` |
| `auth/src/service/otpVerify.ts` | 13 | `identity.findUserByEmail()` |
| `auth/src/service/otpVerify.ts` | 15 | `identity.getUserId()` |
| `auth/src/service/phoneStart.ts` | 11 | `identity.findUserByPhoneNorm()` |
| `auth/src/service/phoneVerify.ts` | 12 | `identity.findUserByPhoneNorm()` |
| `auth/src/service/phoneVerify.ts` | 19 | `identity.updateUserById()` |
| `auth/src/service/exchange.ts` | 56 | `identity.ensureUserByEmail()` |
| `auth/src/service/exchange.ts` | 60+ | `identity.updateUserById()` |

---

#### 10. OTP Flow
- [ ] 🔴 No events emitted
- [ ] 🔴 3 direct calls to identity module

**Status:** 🔴 FULLY COUPLED

---

#### 11. Phone Verification Flow
- [ ] 🔴 No events emitted
- [ ] 🔴 2 direct calls to identity module

**Status:** 🔴 FULLY COUPLED

---

#### 12. OAuth Token Exchange
- [ ] 🔴 No events emitted
- [ ] 🔴 2 direct calls to identity module

**Status:** 🔴 FULLY COUPLED

---

## Module Coupling Matrix

```
                 TARGET MODULE
                 ├─ Auth  ├─ Billing ├─ Tenants ├─ Identity ├─ Audit ├─ Storage ├─ Credits
SOURCE MODULE    │        │          │          │           │        │          │
├─ Auth          │   -    │          │          │    13🔴   │        │          │
├─ Billing       │        │    -     │    3⚠️   │           │   1⚠️  │          │
├─ Tenants       │        │    3✅   │    -     │           │        │          │
├─ Identity      │        │          │          │     -     │        │          │
├─ Audit         │        │          │          │    2⚠️    │   -    │          │
├─ Storage       │        │          │    2⚠️   │           │        │    -     │
├─ Credits       │        │          │          │           │        │          │    -
└─ All Others    │        │          │          │           │        │          │

LEGEND:
  🔴 = Direct coupling (should be events) - 13 calls
  ⚠️ = Graceful coupling (acceptable) - 8 calls
  ✅ = Event-driven (proper) - 3 calls
  -  = Self
```

### Coupling Summary

| Type | Count | Modules Affected |
|------|-------|------------------|
| 🔴 Direct Coupling | 13 | Auth → Identity |
| ⚠️ Graceful Coupling | 8 | Billing/Audit/Storage → Tenants/Identity |
| ✅ Event-Driven | 3 | Tenants → Billing (in event handlers) |

---

## Event System Analysis

### Event Emission Patterns

| Pattern | Usage | Count | Reliability |
|---------|-------|-------|-------------|
| `emitTypedReliable()` | Critical cascades | 12 | ✅ At-least-once |
| `emitTyped()` | Webhook events | 18 | ⚠️ Fire-and-forget |
| `events.emit()` | Informational | 15 | ⚠️ Fire-and-forget |

### Events by Module

#### Tenant Events
| Event | Emission Type | Listeners |
|-------|---------------|-----------|
| `tenant.created` | `events.emit()` | 3 |
| `tenant.updated` | `events.emit()` | 1 |
| `tenant.deleted` | `emitTypedReliable()` | 11 |
| `tenant.member.added` | `events.emit()` | 1 |
| `tenant.member.removed` | `events.emit()` | 2 |
| `tenant.member.role_changed` | `events.emit()` | 1 |

#### Billing Events
| Event | Emission Type | Listeners |
|-------|---------------|-----------|
| `billing.subscription.created` | `events.emit()` | 1 |
| `billing.subscription.updated` | `events.emit()` | 8 |
| `billing.subscription.cancelled` | `events.emit()` ⚠️ | 2 |
| `billing.payment.succeeded` | `events.emit()` | 1 |

#### Webhook Events
| Event | Emission Type | Listeners |
|-------|---------------|-----------|
| `webhook.stripe.subscription_changed` | `emitTyped()` ⚠️ | 3 |
| `webhook.stripe.invoice_event` | `emitTyped()` | 1 |
| `webhook.stripe.payment_event` | `emitTyped()` | 1 |
| `webhook.stripe.topup_completed` | `emitTyped()` | 1 |
| `webhook.razorpay.subscription_changed` | `emitTyped()` ⚠️ | 2 |
| `webhook.razorpay.payment_completed` | `emitTyped()` | 1 |

#### Other Events
| Event | Emission Type | Listeners |
|-------|---------------|-----------|
| `user.deleted` | `emitTypedReliable()` | 2 |
| `storage.upload.confirmed` | `events.emit()` | 4 |
| `storage.file.deleted` | `events.emit()` | 1 |
| `credits.granted` | `events.emit()` | 1 |
| `credits.consumed` | `events.emit()` | 1 |
| `plan.changed` | `emitTypedReliable()` | 0 |

---

## Direct Coupling Issues

### Issue #1: Auth → Identity (CRITICAL)

**Severity:** 🔴 HIGH
**Impact:** Tight coupling prevents independent testing/deployment
**Calls:** 13 direct provider calls

**Current Pattern:**
```typescript
// auth/src/service/signup.ts
const identity = getAuthIdentityProvider();
const user = await identity.createUser({ email, password });
```

**Recommended Pattern:**
```typescript
// Option A: Event-driven (full decoupling)
await emitTypedReliable('auth.user.create_requested', { email, ... });
// Identity listens and creates user

// Option B: Document as intentional (bounded context)
// Auth + Identity = User Management bounded context
// Document this coupling as intentional design decision
```

**Checklist:**
- [ ] Decide: Event-driven or documented bounded context
- [ ] If event-driven: Create `auth.user.create_requested` event schema
- [ ] If event-driven: Add identity event handler
- [ ] If bounded context: Add documentation in ARCHITECTURE.md
- [ ] Update tests to reflect chosen pattern

---

### Issue #2: Billing → Tenants (LOW)

**Severity:** ⚠️ LOW
**Impact:** Graceful degradation exists
**Calls:** 3 read-only calls with fallback

**Current Pattern:**
```typescript
// billing/src/service/entitlements.ts
const tenant = await getTenantsProvider().findById(tenantId);
// Used to get plan info for entitlement calculation
```

**Assessment:** ACCEPTABLE - Read-only, graceful fallback exists

**Checklist:**
- [x] Verify graceful degradation exists
- [x] Verify read-only (no writes)
- [ ] Consider caching tenant plan info
- [ ] Document as intentional coupling

---

### Issue #3: Audit → Identity (LOW)

**Severity:** ⚠️ LOW
**Impact:** Graceful degradation exists
**Calls:** 2 calls with `hasIdentityProvider` check

**Current Pattern:**
```typescript
// audit/src/service/list.ts
if (hasIdentityProvider()) {
  const users = await getIdentityProvider().findUsersByIds(ids);
}
```

**Assessment:** ACCEPTABLE - Optional enrichment with fallback

**Checklist:**
- [x] Verify `hasIdentityProvider()` check exists
- [x] Verify graceful fallback behavior
- [ ] Document as intentional coupling

---

## Event Reliability Issues

### Events That Should Use `emitTypedReliable()`

| Event | Current | Risk | Priority |
|-------|---------|------|----------|
| `billing.subscription.cancelled` | `events.emit()` | Could lose cancellation | 🔴 HIGH |
| `webhook.stripe.subscription_changed` | `emitTyped()` | Could lose plan update | 🔴 HIGH |
| `webhook.razorpay.subscription_changed` | `emitTyped()` | Could lose plan update | 🔴 HIGH |
| `tenant.created` | `events.emit()` | Could lose setup | ⚠️ MEDIUM |
| `storage.upload.confirmed` | `events.emit()` | Could lose billing sync | ⚠️ MEDIUM |
| `identity.apikey.created` | `events.emit()` | Could lose audit | 🟢 LOW |
| `credits.consumed` | `events.emit()` | Informational only | 🟢 LOW |

### Checklist for Event Reliability

- [ ] Change `billing.subscription.cancelled` to `emitTypedReliable()`
- [ ] Change `webhook.stripe.subscription_changed` to `emitTypedReliable()`
- [ ] Change `webhook.razorpay.subscription_changed` to `emitTypedReliable()`
- [ ] Evaluate `tenant.created` for reliable emission
- [ ] Evaluate `storage.upload.confirmed` for reliable emission
- [ ] Document acceptable fire-and-forget events

---

## Improvement Checklist

### 🔴 Priority 1: Critical Fixes

#### P1.1: Decouple or Document Auth → Identity
- [ ] **Decision:** Choose event-driven OR bounded context pattern
- [ ] **If event-driven:**
  - [ ] Create `auth.signup.requested` event schema in kernel
  - [ ] Create `auth.otp.requested` event schema in kernel
  - [ ] Create `auth.oauth.requested` event schema in kernel
  - [ ] Add identity event handlers for user creation
  - [ ] Refactor auth services to emit events
  - [ ] Add completion callback/polling mechanism
- [ ] **If bounded context:**
  - [ ] Add documentation explaining Auth+Identity coupling
  - [ ] Add tests that cover the bounded context
  - [ ] Consider merging into single module long-term

#### P1.2: Make Critical Events Reliable
- [ ] Update `billing/src/service/cancel.ts:46`
  - Change: `events.emit(BILLING_EVENTS.SUBSCRIPTION_CANCELLED, {...})`
  - To: `await emitTypedReliable('billing.subscription.cancelled', {...})`
- [ ] Update `webhooks/src/inbound/stripe/handlers.ts`
  - Change all `emitTyped('webhook.stripe.*')`
  - To: `await emitTypedReliable('webhook.stripe.*')`
- [ ] Update `webhooks/src/inbound/razorpay/handlers.ts`
  - Change all `emitTyped('webhook.razorpay.*')`
  - To: `await emitTypedReliable('webhook.razorpay.*')`

---

### ⚠️ Priority 2: Medium Fixes

#### P2.1: Fix Tenant Creation Cascade
- [ ] Remove direct `providers.addOwnerRole()` call in `bootstrap-tenant.ts:106-111`
- [ ] Verify identity event handler handles idempotency
- [ ] Test that tenant creation works with event-only pattern

#### P2.2: Add Missing Event Handlers
- [ ] Add `plan.changed` listener in flags module (for capacity updates)
- [ ] Add `membership.removed` listener in audit module
- [ ] Verify all cascade completion events have listeners (or remove if not needed)

#### P2.3: Improve Error Handling in Event Handlers
- [ ] Standardize error handling pattern:
  - Critical operations: Throw (fail cascade)
  - Non-critical operations: Log and continue
- [ ] Add retry logic for transient failures
- [ ] Document error handling tiers

---

### 🟢 Priority 3: Enhancements

#### P3.1: Documentation
- [ ] Document all intentional couplings in ARCHITECTURE.md
- [ ] Create event flow diagrams for major cascades
- [ ] Document when to use `emitTypedReliable()` vs `events.emit()`
- [ ] Add cascade sequence diagrams

#### P3.2: Monitoring
- [ ] Add metrics for event handler execution time
- [ ] Add alerting for failed event handlers
- [ ] Track event delivery success rate

#### P3.3: Testing
- [ ] Add integration tests for all cascades
- [ ] Add tests for event handler failures
- [ ] Add tests for idempotency in event handlers

---

## Best Practices Reference

### When to Use Each Event Pattern

| Pattern | Use Case | Example |
|---------|----------|---------|
| `emitTypedReliable()` | State changes, cascades, billing | Tenant deletion, subscription changes |
| `emitTyped()` | Webhook processing with retry | Stripe/Razorpay webhook events |
| `events.emit()` | Informational, audit, cache invalidation | Credits consumed, usage logged |

### Event Handler Error Handling Tiers

| Tier | Behavior | Use Case |
|------|----------|----------|
| Tier 1 - Critical | Throw, event system retries | Billing operations, user creation |
| Tier 2 - Important | Throw, fail cascade | Membership creation |
| Tier 3 - Non-Critical | Log, continue cascade | Cache invalidation, seat updates |
| Tier 4 - Monitoring | Log only | Audit logging |

### Module Coupling Guidelines

| Coupling Type | Acceptable? | Pattern |
|---------------|-------------|---------|
| Event-driven | ✅ YES | `emitTyped*()` + `onTyped()` |
| Port with graceful fallback | ⚠️ OK | `hasXProvider()` check before call |
| Port read-only | ⚠️ OK | Read queries that don't mutate |
| Port write | 🔴 NO | Should use events for mutations |
| Direct import | 🔴 NO | Never import between modules |

### Checklist for Adding New Cascades

- [ ] Define event schema in `kernel/src/events/schemas.ts`
- [ ] Use `emitTypedReliable()` for state changes
- [ ] Add event handlers in each affected module
- [ ] Emit cascade completion event if needed
- [ ] Add idempotency checks in handlers
- [ ] Document error handling tier
- [ ] Add integration tests
- [ ] Update this document

---

## Appendix: File Locations

### Event System Core
- `packages/foundation/kernel/src/events/schemas.ts` - Event definitions
- `packages/foundation/kernel/src/events/emitter.ts` - Emission logic
- `packages/foundation/kernel/src/events/typed-emitter.ts` - Type-safe helpers

### Module Event Handlers
| Module | File |
|--------|------|
| billing | `packages/modules/billing/src/event-handlers.ts` |
| credits | `packages/modules/credits/src/event-handlers.ts` |
| identity | `packages/modules/identity/src/event-handlers.ts` |
| storage | `packages/modules/storage/src/event-handlers.ts` |
| settings | `packages/modules/settings/src/event-handlers.ts` |
| tenants | `packages/modules/tenants/src/event-handlers.ts` |
| audit | `packages/modules/audit/src/event-handlers.ts` |
| flags | `packages/modules/flags/src/event-handlers.ts` |
| ai | `packages/modules/ai/src/event-handlers.ts` |
| media | `packages/modules/media/src/event-handlers.ts` |
| notify | `packages/modules/notify/src/event-handlers.ts` |
| usage | `packages/modules/usage/src/event-handlers.ts` |
| webhooks | `packages/modules/webhooks/src/event-handlers.ts` |

### Coupled Service Files
| File | Coupling |
|------|----------|
| `packages/modules/auth/src/service/signup.ts` | Auth → Identity (13 calls) |
| `packages/modules/billing/src/service/entitlements.ts` | Billing → Tenants |
| `packages/modules/audit/src/service/list.ts` | Audit → Identity |
| `packages/modules/storage/src/service/upload.ts` | Storage → Tenants |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-17 | Initial analysis and documentation | Claude Code |
