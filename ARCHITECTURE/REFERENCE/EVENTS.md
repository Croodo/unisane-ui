# Events Reference

> **For LLMs**: Complete inventory of domain events. Load when working with event-driven features.

---

## Overview

Events enable loose coupling between modules. The owning module emits events; other modules listen.

**Pattern**:
```typescript
// Emitting (only owning module)
import { emitTyped } from '@unisane/kernel';
await emitTyped('billing.subscription.created', payload);

// Listening (any module)
import { onTyped } from '@unisane/kernel';
onTyped('billing.subscription.created', async (event) => {
  // React to event
});
```

---

## SSOT Type Pattern

Event schemas use **Zod with SSOT references** from kernel constants.

**SSOT Location**: `packages/foundation/kernel/src/constants/`

**Pattern**:
```typescript
// 1. SSOT in kernel/src/constants/billing.ts
export const SUBSCRIPTION_STATUS = ['active', 'trialing', 'canceled', ...] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[number];
export const ZSubscriptionStatus = z.enum(SUBSCRIPTION_STATUS);

// 2. Event schema references SSOT
// kernel/src/events/schemas.ts
import { ZSubscriptionStatus, ZBillingProvider } from '../constants';

export const BillingSubscriptionCreatedSchema = z.object({
  scopeId: z.string(),
  subscriptionId: z.string(),
  status: ZSubscriptionStatus,        // ← SSOT reference
  provider: ZBillingProvider,         // ← SSOT reference
});
```

**When to inline vs reference SSOT**:
| Use Case | Approach |
|----------|----------|
| Domain concept (statuses, providers) | Reference SSOT (`ZSubscriptionStatus`) |
| Event-specific transient value | Inline (`z.enum(['upsert', 'delete'])`) |

---

## Event Ownership Rules

| Event Prefix | Owner Module | Others Can |
|--------------|--------------|------------|
| `billing.*` | @unisane/billing | Listen only |
| `credits.*` | @unisane/credits | Listen only |
| `tenant.*` | @unisane/tenants | Listen only |
| `user.*` | @unisane/identity | Listen only |
| `auth.*` | @unisane/auth | Listen only |
| `storage.*` | @unisane/storage | Listen only |
| `flags.*` | @unisane/flags | Listen only |
| `ai.*` | @unisane/ai | Listen only |
| `webhooks.*` | @unisane/webhooks | Listen only |
| `notify.*` | @unisane/notify | Listen only |

**Rule**: A module can ONLY emit events with its own prefix.

---

## Kernel Constants Reference

These SSOT types are available from `@unisane/kernel`:

| Constant | Location | Values |
|----------|----------|--------|
| `SUBSCRIPTION_STATUS` | `constants/billing.ts` | `'active' \| 'trialing' \| 'canceled' \| ...` |
| `PAYMENT_STATUS` | `constants/billing.ts` | `'succeeded' \| 'failed' \| 'refunded' \| ...` |
| `INVOICE_STATUS` | `constants/billing.ts` | `'draft' \| 'open' \| 'paid' \| 'void' \| ...` |
| `BILLING_PROVIDERS` | `constants/providers.ts` | `'stripe' \| 'razorpay'` |
| `OAUTH_PROVIDERS` | `constants/providers.ts` | `'google' \| 'github'` |
| `MAIL_PROVIDERS` | `constants/providers.ts` | `'ses' \| 'resend' \| 'postmark'` |
| `PLANS` | `constants/plan.ts` | `'free' \| 'pro' \| 'business' \| ...` |
| `USER_STATUS` | `constants/index.ts` | `'active' \| 'suspended' \| 'deleted'` |
| `CREDIT_KIND` | `constants/credits.ts` | `'granted' \| 'consumed' \| 'expired'` |
| `NOTIFICATION_CATEGORIES` | `constants/notify.ts` | `'billing' \| 'security' \| 'system' \| ...` |

**Usage in events**:
```typescript
import { ZSubscriptionStatus, ZBillingProvider, type SubscriptionStatus } from '@unisane/kernel';
```

---

## Event Catalog

### billing.*

#### billing.subscription.created
**Emitted when**: New subscription is created

**Schema** (in `kernel/src/events/schemas.ts`):
```typescript
export const BillingSubscriptionCreatedSchema = z.object({
  scopeId: z.string(),
  subscriptionId: z.string(),
  planId: z.string(),
  status: ZSubscriptionStatus,      // SSOT: 'active' | 'trialing' | ...
  currentPeriodEnd: z.date(),
  customerId: z.string(),
  provider: ZBillingProvider,       // SSOT: 'stripe' | 'razorpay'
});

export type BillingSubscriptionCreatedEvent = z.infer<typeof BillingSubscriptionCreatedSchema>;
```

**Listeners**:
- credits: Grant initial credits
- tenants: Update tenant status
- notify: Send welcome email

---

#### billing.subscription.canceled
**Emitted when**: Subscription is canceled

```typescript
export const BillingSubscriptionCanceledSchema = z.object({
  scopeId: z.string(),
  subscriptionId: z.string(),
  canceledAt: z.date(),
  cancelAtPeriodEnd: z.boolean(),
  reason: z.string().optional(),
});
```

**Listeners**:
- tenants: Schedule downgrade
- notify: Send cancellation email
- audit: Log cancellation

---

#### billing.subscription.renewed
**Emitted when**: Subscription renews (payment successful)

```typescript
export const BillingSubscriptionRenewedSchema = z.object({
  scopeId: z.string(),
  subscriptionId: z.string(),
  invoiceId: z.string(),
  amount: z.number(),
  currency: z.string(),
  periodStart: z.date(),
  periodEnd: z.date(),
});
```

**Listeners**:
- credits: Refresh monthly credits
- usage: Reset usage counters
- notify: Send receipt

---

#### billing.payment.failed
**Emitted when**: Payment attempt fails

```typescript
export const BillingPaymentFailedSchema = z.object({
  scopeId: z.string(),
  subscriptionId: z.string(),
  invoiceId: z.string(),
  amount: z.number(),
  currency: z.string(),
  failureReason: z.string(),
  attemptCount: z.number(),
  nextAttempt: z.date().optional(),
});
```

**Listeners**:
- notify: Send payment failed email
- tenants: Mark as at-risk

---

### credits.*

#### credits.consumed
**Emitted when**: Credits are used

```typescript
export const CreditsConsumedSchema = z.object({
  scopeId: z.string(),
  amount: z.number(),
  remaining: z.number(),
  reason: z.string(),
  operation: z.string(),
  kind: ZCreditKind,                // SSOT: 'consumed'
  metadata: z.record(z.unknown()).optional(),
});
```

**Listeners**:
- audit: Log consumption
- notify: If low balance, alert

---

#### credits.granted
**Emitted when**: Credits are added

```typescript
export const CreditsGrantedSchema = z.object({
  scopeId: z.string(),
  amount: z.number(),
  newBalance: z.number(),
  reason: z.string(),
  kind: ZCreditKind,                // SSOT: 'granted'
  expiresAt: z.date().optional(),
});
```

**Listeners**:
- audit: Log grant

---

#### credits.expired
**Emitted when**: Credits expire

```typescript
export const CreditsExpiredSchema = z.object({
  scopeId: z.string(),
  amount: z.number(),
  remaining: z.number(),
  kind: ZCreditKind,                // SSOT: 'expired'
});
```

**Listeners**:
- notify: Alert user of expiration

---

### tenant.*

#### tenant.created
**Emitted when**: New tenant is created

```typescript
export const TenantCreatedSchema = z.object({
  tenantId: z.string(),
  name: z.string(),
  slug: z.string(),
  ownerId: z.string(),
  plan: ZPlan,                      // SSOT: 'free' | 'pro' | 'business' | ...
});
```

**Listeners**:
- billing: Create customer
- settings: Initialize defaults
- audit: Log creation

---

#### tenant.updated
**Emitted when**: Tenant settings updated

```typescript
export const TenantUpdatedSchema = z.object({
  tenantId: z.string(),
  changes: z.array(z.object({
    field: z.string(),
    from: z.unknown(),
    to: z.unknown(),
  })),
  updatedBy: z.string(),
});
```

**Listeners**:
- audit: Log changes

---

#### tenant.suspended
**Emitted when**: Tenant is suspended

```typescript
export const TenantSuspendedSchema = z.object({
  tenantId: z.string(),
  reason: z.string(),
  suspendedAt: z.date(),
  suspendedBy: z.string(),
});
```

**Listeners**:
- auth: Revoke sessions
- notify: Alert admin

---

### user.*

#### user.created
**Emitted when**: New user signs up

```typescript
export const UserCreatedSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  tenantId: z.string().optional(),
  source: z.enum(['signup', 'invite', 'import']),  // Event-specific (inline)
});
```

**Listeners**:
- notify: Send welcome email
- audit: Log creation

---

#### user.verified
**Emitted when**: Email is verified

```typescript
export const UserVerifiedSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  verifiedAt: z.date(),
});
```

**Listeners**:
- tenants: Enable full access
- notify: Send confirmation

---

#### user.deleted
**Emitted when**: User is deleted

```typescript
export const UserDeletedSchema = z.object({
  userId: z.string(),
  tenantId: z.string().optional(),
  deletedBy: z.string(),
  deletedAt: z.date(),
});
```

**Listeners**:
- auth: Revoke all sessions
- storage: Schedule data deletion
- audit: Log deletion

---

### auth.*

#### auth.login.success
**Emitted when**: Successful login

```typescript
// NOTE: AUTH_METHODS should be added to kernel/src/constants/auth.ts
// For now, inline as event-specific
export const AuthLoginSuccessSchema = z.object({
  userId: z.string(),
  tenantId: z.string().optional(),
  method: z.enum(['password', 'oauth', 'magic-link']),  // TODO: Move to SSOT
  provider: ZOAuthProvider.optional(),  // SSOT: 'google' | 'github'
  ip: z.string(),
  userAgent: z.string(),
});
```

**Listeners**:
- audit: Log login

---

#### auth.login.failed
**Emitted when**: Failed login attempt

```typescript
export const AuthLoginFailedSchema = z.object({
  email: z.string().email(),
  reason: z.enum(['invalid_password', 'account_locked', 'not_found']),  // Event-specific
  ip: z.string(),
  attemptCount: z.number(),
});
```

**Listeners**:
- security: Check for brute force
- audit: Log attempt

---

#### auth.password.reset
**Emitted when**: Password is reset

```typescript
export const AuthPasswordResetSchema = z.object({
  userId: z.string(),
  resetAt: z.date(),
  method: z.enum(['email', 'admin']),  // Event-specific
});
```

**Listeners**:
- notify: Send confirmation
- auth: Revoke other sessions
- audit: Log reset

---

### notify.*

#### notify.sent
**Emitted when**: Notification is delivered

```typescript
export const NotifySentSchema = z.object({
  scopeId: z.string(),
  userId: z.string(),
  notificationId: z.string(),
  type: z.string(),
  channel: z.enum(['inapp', 'email', 'push', 'sms']),  // TODO: Move to SSOT
  category: ZNotificationCategory.optional(),  // SSOT if exists
});
```

---

## Event Best Practices

### SSOT Rule
- **Domain concepts** → Reference kernel constants (`ZSubscriptionStatus`)
- **Event-specific values** → Inline enum (`z.enum(['upsert', 'delete'])`)
- **Missing SSOT?** → Add to `kernel/src/constants/` first, then reference

### Event Naming
- Use `module.entity.action` format
- Actions: `created`, `updated`, `deleted`, `canceled`, etc.
- Be specific: `subscription.created` not `created`

### Event Payload
- Include all data listeners might need
- Don't include sensitive data (passwords, tokens)
- Use Zod schemas for validation
- Reference SSOT types for domain values

### Error Handling
```typescript
onTyped('billing.subscription.created', async (event) => {
  try {
    await grantCredits(event.payload);
  } catch (error) {
    // Log but don't fail - events are fire-and-forget
    logger.error('Failed to grant credits on subscription', {
      error,
      subscriptionId: event.payload.subscriptionId,
    });
    // Optionally: emit failure event or queue for retry
  }
});
```

### Ordering
- Events are NOT guaranteed to arrive in order
- Design handlers to be idempotent
- Use event timestamps for ordering if needed

---

## Adding a New Event

### 1. Check/Add SSOT Types

If your event uses domain values (statuses, providers, etc.):
```typescript
// kernel/src/constants/{domain}.ts
export const MY_STATUS = ['pending', 'active', 'done'] as const;
export type MyStatus = (typeof MY_STATUS)[number];
export const ZMyStatus = z.enum(MY_STATUS);
```

### 2. Define Schema in Kernel

```typescript
// kernel/src/events/schemas.ts
import { ZMyStatus } from '../constants';

export const MyModuleEventSchema = z.object({
  scopeId: z.string(),
  entityId: z.string(),
  status: ZMyStatus,                    // SSOT reference
  action: z.enum(['start', 'stop']),    // Event-specific (inline)
});

// Register in EventSchemas
export const EventSchemas = {
  // ...existing
  'mymodule.entity.action': MyModuleEventSchema,
} as const;
```

### 3. Emit from Module

```typescript
await emitTyped('mymodule.entity.action', payload);
```

### 4. Document Here

Add to catalog with schema and listeners.

---

## Missing SSOT Types (To Add)

| Type | Current State | Should Be |
|------|---------------|-----------|
| `AUTH_METHODS` | Inline in events | `kernel/src/constants/auth.ts` |
| `NOTIFICATION_CHANNELS` | Inline in events | `kernel/src/constants/notify.ts` |
| `USER_SOURCE` | Inline (`signup \| invite \| import`) | Consider SSOT |

---

> **Last Updated**: 2025-01-15
