# Module Structure: Before vs After Hexagonal Architecture

**Document Purpose:** Visual guide showing how module structure changes after hexagonal architecture migration.

---

## 📦 Current Module Structure (Before Migration)

```
packages/modules/
├── billing/
│   ├── src/
│   │   ├── service/              # Business logic
│   │   │   ├── subscribe.ts      # ❌ Calls getBillingProvider() directly
│   │   │   ├── refund.ts         # ❌ Calls getBillingProvider() directly
│   │   │   ├── changePlan.ts
│   │   │   ├── changeQuantity.ts
│   │   │   ├── cancel.ts
│   │   │   ├── topup.ts
│   │   │   ├── portal.ts
│   │   │   ├── subscriptions.ts
│   │   │   ├── listInvoices.ts
│   │   │   ├── listPayments.ts
│   │   │   └── admin/
│   │   │       └── stats.ts
│   │   │
│   │   ├── data/                 # Data access layer
│   │   │   ├── subscriptions.repository.ts
│   │   │   ├── subscriptions.repository.mongo.ts  # ❌ Direct MongoDB
│   │   │   ├── payments.repository.ts
│   │   │   ├── payments.repository.mongo.ts       # ❌ Direct MongoDB
│   │   │   ├── invoices.repository.ts
│   │   │   ├── invoices.repository.mongo.ts       # ❌ Direct MongoDB
│   │   │   ├── tenant-integrations.repository.ts
│   │   │   └── tenant-integrations.repository.mongo.ts
│   │   │
│   │   ├── domain/               # Domain logic
│   │   │   ├── types.ts
│   │   │   ├── schemas.ts
│   │   │   ├── errors.ts
│   │   │   ├── mappers.ts
│   │   │   ├── keys.ts
│   │   │   └── constants.ts
│   │   │
│   │   ├── __tests__/            # Tests
│   │   │   ├── schemas.test.ts
│   │   │   ├── errors.test.ts
│   │   │   └── constants.test.ts
│   │   │
│   │   ├── client.ts             # Client-side exports
│   │   ├── index.ts              # Server-side exports
│   │   └── README.md
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── webhooks/
│   ├── src/
│   │   ├── inbound/
│   │   │   ├── stripe/
│   │   │   │   ├── handlers.ts   # ❌ DIRECT COUPLING!
│   │   │   │   │                 # import { grant } from '@unisane/credits'
│   │   │   │   │                 # import { paymentsRepo } from '@unisane/billing'
│   │   │   │   │                 # await grant(tenantId, amount)
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── razorpay/
│   │   │   │   ├── handlers.ts   # ❌ Same coupling issues
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── utils.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── service/
│   │   │   ├── recordInbound.ts
│   │   │   ├── recordOutbound.ts
│   │   │   ├── listEvents.ts
│   │   │   ├── replay.ts
│   │   │   └── admin/
│   │   │       └── stats.ts
│   │   │
│   │   ├── data/
│   │   │   ├── webhooks.repository.ts
│   │   │   └── webhooks.repository.mongo.ts  # ❌ Direct MongoDB
│   │   │
│   │   ├── domain/
│   │   │   ├── types.ts
│   │   │   ├── schemas.ts
│   │   │   ├── errors.ts
│   │   │   ├── keys.ts
│   │   │   ├── constants.ts
│   │   │   └── ports.ts
│   │   │
│   │   ├── inbound.ts            # Inbound webhook handler
│   │   ├── client.ts
│   │   └── index.ts
│   │
│   └── package.json
│
├── credits/
│   ├── src/
│   │   ├── service/
│   │   │   ├── grant.ts          # ✅ Business logic (good)
│   │   │   ├── consume.ts
│   │   │   ├── balance.ts
│   │   │   ├── history.ts
│   │   │   └── admin/
│   │   │       └── stats.ts
│   │   │
│   │   ├── data/
│   │   │   ├── credits.repository.ts
│   │   │   └── credits.repository.mongo.ts  # ❌ Direct MongoDB
│   │   │
│   │   ├── domain/
│   │   │   ├── types.ts
│   │   │   ├── schemas.ts
│   │   │   ├── errors.ts
│   │   │   └── keys.ts
│   │   │
│   │   ├── client.ts
│   │   └── index.ts              # ❌ EXPORTS grant() - called directly by webhooks
│   │       # export { grant } from './service/grant';
│   │
│   └── package.json
│
├── storage/
│   ├── src/
│   │   ├── service/
│   │   │   ├── upload.ts         # ❌ DIRECT S3 IMPORT!
│   │   │   │                     # import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
│   │   │   │                     # const s3 = new S3Client({ ... })
│   │   │   ├── download.ts       # ❌ Direct S3 usage
│   │   │   ├── delete.ts         # ❌ Direct S3 usage
│   │   │   ├── list.ts
│   │   │   └── signedUrl.ts
│   │   │
│   │   ├── data/
│   │   │   ├── files.repository.ts
│   │   │   └── files.repository.mongo.ts  # ❌ Direct MongoDB
│   │   │
│   │   ├── domain/
│   │   │   ├── types.ts
│   │   │   ├── schemas.ts
│   │   │   ├── errors.ts
│   │   │   └── keys.ts
│   │   │
│   │   ├── client.ts
│   │   └── index.ts
│   │
│   └── package.json
│
├── notify/
│   ├── src/
│   │   ├── service/
│   │   │   ├── email.ts          # ✅ Uses getEmailProvider() (good!)
│   │   │   ├── inapp.ts
│   │   │   ├── prefs.ts
│   │   │   ├── suppression.ts
│   │   │   └── enqueue.ts
│   │   │
│   │   ├── data/
│   │   │   ├── notifications.repository.ts
│   │   │   ├── notifications.repository.mongo.ts  # ❌ Direct MongoDB
│   │   │   ├── suppression.repository.ts
│   │   │   └── suppression.repository.mongo.ts
│   │   │
│   │   ├── domain/
│   │   │   ├── types.ts
│   │   │   ├── schemas.ts
│   │   │   ├── errors.ts
│   │   │   ├── keys.ts
│   │   │   ├── constants.ts
│   │   │   └── ports.ts
│   │   │
│   │   ├── client.ts
│   │   └── index.ts
│   │
│   └── package.json
│
├── audit/
│   ├── src/
│   │   ├── service/
│   │   ├── data/
│   │   ├── domain/
│   │   └── index.ts
│
├── auth/
│   ├── src/
│   │   ├── service/
│   │   ├── data/
│   │   ├── domain/
│   │   └── index.ts
│
├── flags/
│   ├── src/
│   │   ├── service/
│   │   │   ├── get.ts
│   │   │   ├── evaluate.ts
│   │   │   └── evaluator.ts
│   │   ├── data/
│   │   ├── domain/
│   │   └── index.ts
│
├── identity/
├── media/
├── pdf/
├── settings/
├── tenants/
└── usage/
```

### 🔴 Problems with Current Structure

#### 1. Direct Module Coupling (Tight Coupling)
```typescript
// webhooks/src/inbound/stripe/handlers.ts (LINE 1)
import { grant } from '@unisane/credits';  // ❌ Direct import = tight coupling

// webhooks/src/inbound/stripe/handlers.ts (LINE 48)
await grant({ tenantId, amount: credits, reason: 'purchase', idem: paymentIntent });
```

**Problem:**
- Webhooks module DEPENDS on credits module
- Can't remove credits module without breaking webhooks
- Can't test webhooks without credits
- Changes to credits API break webhooks

#### 2. Hard-coded Multi-Tenancy (SaaS-Only)
```typescript
// Every module uses this pattern:
const tenantId = getTenantId();  // ❌ Only works for tenant-based (SaaS)
await col('files').insertOne(withTenantId({ ... }));

// Can't build:
// - E-commerce (user-scoped data)
// - Marketplace (merchant-scoped data)
// - Social platform (user-scoped data)
```

#### 3. Vendor Lock-in (Hard-coded Providers)
```typescript
// storage/src/service/upload.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';  // ❌ Can't swap
const s3 = new S3Client({ region: 'us-east-1' });
await s3.send(new PutObjectCommand({ ... }));

// To switch to GCS:
// - Rewrite all storage code
// - Replace S3 SDK with GCS SDK
// - Update all service methods
// - Test everything again
// = 1-2 weeks of work
```

#### 4. No Domain Entities (Anemic Domain Model)
```typescript
// Service does EVERYTHING (business logic + infrastructure)
// billing/src/service/refund.ts
export async function refund(args) {
  // Business logic mixed with:
  // - Database queries
  // - Provider calls
  // - Feature flag checks
  // - Redis locking
  // Hard to test, hard to reuse
}
```

---

## 🎯 Target Module Structure (After Hexagonal Architecture)

```
packages/modules/
├── billing/
│   ├── src/
│   │   ├── service/                    # Business logic (PURE - minimal external deps)
│   │   │   ├── subscribe.ts            # ✅ Uses getScope() instead of getTenantId()
│   │   │   ├── refund.ts               # ✅ Uses getScope()
│   │   │   ├── changePlan.ts           # ✅ Uses getScope()
│   │   │   ├── changeQuantity.ts
│   │   │   ├── cancel.ts
│   │   │   ├── topup.ts
│   │   │   ├── portal.ts
│   │   │   ├── subscriptions.ts
│   │   │   ├── listInvoices.ts
│   │   │   ├── listPayments.ts
│   │   │   └── admin/
│   │   │       └── stats.ts
│   │   │
│   │   ├── event-handlers.ts           # ✨ NEW: Event-driven integration
│   │   │   # Pure event handlers - NO business logic here
│   │   │   #
│   │   │   # Listens to:
│   │   │   # - 'credits.depleted' → Send low balance notification
│   │   │   # - 'tenant.deleted' → Cancel all subscriptions
│   │   │   # - 'user.suspended' → Pause billing
│   │   │   #
│   │   │   # Emits:
│   │   │   # - 'billing.payment.succeeded'
│   │   │   # - 'billing.payment.failed'
│   │   │   # - 'billing.subscription.created'
│   │   │   # - 'billing.subscription.updated'
│   │   │   # - 'billing.subscription.canceled'
│   │   │   # - 'billing.refund.processed'
│   │   │
│   │   ├── data/                       # Data access (abstracted)
│   │   │   ├── subscriptions.repository.ts        # ✅ Interface
│   │   │   ├── subscriptions.repository.mongo.ts  # ✅ MongoDB implementation
│   │   │   ├── payments.repository.ts
│   │   │   ├── payments.repository.mongo.ts
│   │   │   ├── invoices.repository.ts
│   │   │   ├── invoices.repository.mongo.ts
│   │   │   ├── tenant-integrations.repository.ts
│   │   │   └── tenant-integrations.repository.mongo.ts
│   │   │
│   │   ├── domain/                     # Domain logic (PURE)
│   │   │   ├── entities/               # ✨ NEW: Domain entities (pure business logic)
│   │   │   │   ├── subscription.entity.ts
│   │   │   │   │   # Pure business logic with ZERO dependencies:
│   │   │   │   │   #
│   │   │   │   │   # class Subscription {
│   │   │   │   │   #   cancel(immediately: boolean): void
│   │   │   │   │   #   calculateProration(date: Date): number
│   │   │   │   │   #   isActive(): boolean
│   │   │   │   │   #   canUpgrade(newPlan: string): boolean
│   │   │   │   │   #   getDaysRemaining(): number
│   │   │   │   │   # }
│   │   │   │   │   #
│   │   │   │   │   # No imports! Just pure TypeScript!
│   │   │   │   │
│   │   │   │   ├── payment.entity.ts
│   │   │   │   │   # class Payment {
│   │   │   │   │   #   isRefundable(): boolean
│   │   │   │   │   #   calculateRefundAmount(partial?: number): number
│   │   │   │   │   #   canPartialRefund(): boolean
│   │   │   │   │   # }
│   │   │   │   │
│   │   │   │   └── invoice.entity.ts
│   │   │   │       # class Invoice {
│   │   │   │       #   isPaid(): boolean
│   │   │   │       #   isOverdue(): boolean
│   │   │   │       #   getDaysOverdue(): number
│   │   │   │       # }
│   │   │   │
│   │   │   ├── types.ts
│   │   │   ├── schemas.ts
│   │   │   ├── errors.ts
│   │   │   ├── mappers.ts
│   │   │   ├── keys.ts
│   │   │   └── constants.ts
│   │   │
│   │   ├── __tests__/
│   │   │   ├── entities/           # ✨ NEW: Test domain entities (no mocks!)
│   │   │   │   ├── subscription.test.ts
│   │   │   │   ├── payment.test.ts
│   │   │   │   └── invoice.test.ts
│   │   │   ├── schemas.test.ts
│   │   │   ├── errors.test.ts
│   │   │   └── constants.test.ts
│   │   │
│   │   ├── client.ts
│   │   ├── index.ts                    # ✨ CHANGED: Registers event handlers on init
│   │   │   # import { registerBillingEventHandlers } from './event-handlers';
│   │   │   #
│   │   │   # // Call this on module initialization
│   │   │   # registerBillingEventHandlers();
│   │   │   #
│   │   │   # // Export services (NOT for other modules, for routes only)
│   │   │   # export * from './service/subscribe';
│   │   │   # export * from './service/refund';
│   │   │
│   │   └── README.md
│   │
│   └── package.json
│
├── webhooks/
│   ├── src/
│   │   ├── inbound/
│   │   │   ├── stripe/
│   │   │   │   ├── handlers.ts         # ✅ NO MORE DIRECT IMPORTS!
│   │   │   │   │   #
│   │   │   │   │   # BEFORE:
│   │   │   │   │   # import { grant } from '@unisane/credits';
│   │   │   │   │   # await grant(tenantId, amount);
│   │   │   │   │   #
│   │   │   │   │   # AFTER:
│   │   │   │   │   # import { events, getScope } from '@unisane/kernel';
│   │   │   │   │   # const scope = getScope();
│   │   │   │   │   # await events.emit('billing.payment.succeeded', {
│   │   │   │   │   #   scopeId: scope.id,
│   │   │   │   │   #   scopeType: scope.type,
│   │   │   │   │   #   amount: 100,
│   │   │   │   │   #   currency: 'usd',
│   │   │   │   │   #   providerPaymentId: 'pi_123',
│   │   │   │   │   # });
│   │   │   │   │   #
│   │   │   │   │   # Zero coupling!
│   │   │   │   │
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── razorpay/
│   │   │   │   ├── handlers.ts         # ✅ Event-driven (no direct calls)
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── utils.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── event-handlers.ts           # ✨ NEW: Listen to other modules
│   │   │   # Listens to:
│   │   │   # - 'billing.webhook.failed' → Retry logic
│   │   │   # - 'storage.file.uploaded' → Send webhook to external systems
│   │   │   #
│   │   │   # Emits:
│   │   │   # - 'webhook.received'
│   │   │   # - 'webhook.processed'
│   │   │   # - 'webhook.failed'
│   │   │
│   │   ├── service/
│   │   │   ├── recordInbound.ts        # ✅ Uses getScope()
│   │   │   ├── recordOutbound.ts       # ✅ Uses getScope()
│   │   │   ├── listEvents.ts
│   │   │   ├── replay.ts
│   │   │   └── admin/
│   │   │       └── stats.ts
│   │   │
│   │   ├── data/
│   │   │   ├── webhooks.repository.ts
│   │   │   └── webhooks.repository.mongo.ts
│   │   │
│   │   ├── domain/
│   │   │   ├── entities/               # ✨ NEW
│   │   │   │   └── webhook-event.entity.ts
│   │   │   │       # class WebhookEvent {
│   │   │   │       #   shouldRetry(): boolean
│   │   │   │       #   getNextRetryDelay(): number
│   │   │   │       #   markAsProcessed(): void
│   │   │   │       # }
│   │   │   ├── types.ts
│   │   │   ├── schemas.ts
│   │   │   ├── errors.ts
│   │   │   └── ...
│   │   │
│   │   ├── inbound.ts
│   │   ├── client.ts
│   │   └── index.ts                    # ✨ Registers event handlers
│   │       # registerWebhookEventHandlers();
│   │
│   └── package.json
│
├── credits/
│   ├── src/
│   │   ├── service/
│   │   │   ├── grant.ts                # ✅ PURE business logic
│   │   │   ├── consume.ts              # ✅ Uses getScope()
│   │   │   ├── balance.ts              # ✅ Uses getScope()
│   │   │   ├── history.ts
│   │   │   └── admin/
│   │   │       └── stats.ts
│   │   │
│   │   ├── event-handlers.ts           # ✨ NEW: Event-driven integration
│   │   │   # This is where credits module "listens" to the outside world
│   │   │   #
│   │   │   # Listens to:
│   │   │   # - 'billing.payment.succeeded' → grant credits (1 USD = 10 credits)
│   │   │   # - 'billing.refund.processed' → deduct credits
│   │   │   # - 'billing.subscription.created' → grant monthly credits
│   │   │   # - 'usage.metered' → consume credits
│   │   │   #
│   │   │   # Emits:
│   │   │   # - 'credits.granted' → Notify user
│   │   │   # - 'credits.consumed' → Log usage
│   │   │   # - 'credits.depleted' → Alert user, pause services
│   │   │   # - 'credits.expired' → Log expiration
│   │   │   #
│   │   │   # Example:
│   │   │   # events.on('billing.payment.succeeded', async (event) => {
│   │   │   #   const creditsToGrant = event.payload.amount * 10;
│   │   │   #   await grant({
│   │   │   #     scopeId: event.payload.scopeId,
│   │   │   #     amount: creditsToGrant,
│   │   │   #     reason: 'payment_received',
│   │   │   #   });
│   │   │   # });
│   │   │
│   │   ├── data/
│   │   │   ├── credits.repository.ts
│   │   │   └── credits.repository.mongo.ts
│   │   │
│   │   ├── domain/
│   │   │   ├── entities/               # ✨ NEW
│   │   │   │   └── credit-balance.entity.ts
│   │   │   │       # class CreditBalance {
│   │   │   │       #   grant(amount: number): void
│   │   │   │       #   consume(amount: number): boolean
│   │   │   │       #   isExpired(): boolean
│   │   │   │       #   getDaysUntilExpiry(): number
│   │   │   │       #   canConsume(amount: number): boolean
│   │   │   │       # }
│   │   │   ├── types.ts
│   │   │   ├── schemas.ts
│   │   │   ├── errors.ts
│   │   │   └── keys.ts
│   │   │
│   │   ├── client.ts
│   │   └── index.ts                    # ✨ CHANGED: NO MORE export { grant }
│   │       #
│   │       # BEFORE:
│   │       # export { grant } from './service/grant';  // ❌ Other modules call this
│   │       #
│   │       # AFTER:
│   │       # import { registerCreditEventHandlers } from './event-handlers';
│   │       # registerCreditEventHandlers();  // ✅ Only event handlers
│   │       #
│   │       # grant() is now INTERNAL, called by event handlers only
│   │
│   └── package.json
│
├── storage/
│   ├── src/
│   │   ├── service/
│   │   │   ├── upload.ts               # ✅ NO MORE S3 IMPORTS!
│   │   │   │   #
│   │   │   │   # BEFORE:
│   │   │   │   # import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
│   │   │   │   # const s3 = new S3Client({ region: 'us-east-1' });
│   │   │   │   # await s3.send(new PutObjectCommand({ ... }));
│   │   │   │   #
│   │   │   │   # AFTER:
│   │   │   │   # import { getStorageProvider } from '@unisane/kernel';
│   │   │   │   # const storage = getStorageProvider();
│   │   │   │   # await storage.upload({ file, key });
│   │   │   │   #
│   │   │   │   # Swap providers via config (no code changes):
│   │   │   │   # .env: STORAGE_PROVIDER=s3     → S3StorageAdapter
│   │   │   │   # .env: STORAGE_PROVIDER=gcs    → GCSStorageAdapter
│   │   │   │   # .env: STORAGE_PROVIDER=azure  → AzureBlobStorageAdapter
│   │   │   │
│   │   │   ├── download.ts             # ✅ Uses getStorageProvider()
│   │   │   ├── delete.ts               # ✅ Uses getStorageProvider()
│   │   │   ├── list.ts                 # ✅ Uses getStorageProvider()
│   │   │   └── signedUrl.ts            # ✅ Uses getStorageProvider()
│   │   │
│   │   ├── event-handlers.ts           # ✨ NEW
│   │   │   # Emits:
│   │   │   # - 'storage.file.uploaded' → Notify user, trigger processing
│   │   │   # - 'storage.file.deleted' → Clean up references
│   │   │   # - 'storage.file.failed' → Alert admin
│   │   │   #
│   │   │   # Listens to:
│   │   │   # - 'tenant.deleted' → Delete all tenant files
│   │   │   # - 'user.deleted' → Delete all user files
│   │   │
│   │   ├── data/
│   │   │   ├── files.repository.ts     # ✅ Interface
│   │   │   └── files.repository.mongo.ts
│   │   │
│   │   ├── domain/
│   │   │   ├── entities/               # ✨ NEW
│   │   │   │   └── file.entity.ts
│   │   │   │       # class File {
│   │   │   │       #   validateSize(maxMb: number): boolean
│   │   │   │       #   validateMimeType(allowed: string[]): boolean
│   │   │   │       #   generateKey(): string
│   │   │   │       #   isImage(): boolean
│   │   │   │       #   isPDF(): boolean
│   │   │   │       # }
│   │   │   ├── types.ts
│   │   │   ├── schemas.ts
│   │   │   ├── errors.ts
│   │   │   └── keys.ts
│   │   │
│   │   ├── client.ts
│   │   └── index.ts                    # ✨ Registers event handlers
│   │
│   └── package.json
│
├── notify/
│   ├── src/
│   │   ├── service/
│   │   │   ├── email.ts                # ✅ Already uses getEmailProvider() (good!)
│   │   │   ├── inapp.ts                # ✅ Uses getScope()
│   │   │   ├── prefs.ts
│   │   │   ├── suppression.ts
│   │   │   └── enqueue.ts
│   │   │
│   │   ├── event-handlers.ts           # ✨ NEW: Listen to EVERYTHING
│   │   │   # This module reacts to ALL events across the system
│   │   │   #
│   │   │   # Listens to:
│   │   │   # - 'user.registered' → Send welcome email
│   │   │   # - 'billing.payment.succeeded' → Send receipt
│   │   │   # - 'billing.payment.failed' → Send payment failed notice
│   │   │   # - 'credits.depleted' → Send low balance warning
│   │   │   # - 'credits.granted' → Send credits received notification
│   │   │   # - 'storage.file.uploaded' → Send upload confirmation
│   │   │   # - 'tenant.member.invited' → Send invitation email
│   │   │   # - 'auth.password.reset' → Send password reset email
│   │   │   #
│   │   │   # Emits:
│   │   │   # - 'notify.email.sent'
│   │   │   # - 'notify.email.failed'
│   │   │   # - 'notify.email.bounced'
│   │   │   # - 'notify.inapp.created'
│   │   │
│   │   ├── data/
│   │   │   ├── notifications.repository.ts
│   │   │   ├── notifications.repository.mongo.ts
│   │   │   ├── suppression.repository.ts
│   │   │   └── suppression.repository.mongo.ts
│   │   │
│   │   ├── domain/
│   │   │   ├── entities/               # ✨ NEW
│   │   │   │   └── notification.entity.ts
│   │   │   │       # class Notification {
│   │   │   │       #   shouldSend(): boolean
│   │   │   │       #   isExpired(): boolean
│   │   │   │       #   markAsRead(): void
│   │   │   │       #   markAsSent(): void
│   │   │   │       # }
│   │   │   ├── types.ts
│   │   │   ├── schemas.ts
│   │   │   ├── errors.ts
│   │   │   └── ...
│   │   │
│   │   ├── client.ts
│   │   └── index.ts                    # ✨ Registers event handlers
│   │
│   └── package.json
│
├── audit/
│   ├── src/
│   │   ├── service/
│   │   │   ├── log.ts
│   │   │   └── query.ts
│   │   │
│   │   ├── event-handlers.ts           # ✨ NEW: Listen to EVERYTHING for audit
│   │   │   # Audit module records ALL events across the system
│   │   │   #
│   │   │   # Listens to (wildcard):
│   │   │   # - billing.*
│   │   │   # - credits.*
│   │   │   # - storage.*
│   │   │   # - notify.*
│   │   │   # - user.*
│   │   │   # - tenant.*
│   │   │   # - auth.*
│   │   │   # - webhooks.*
│   │   │   #
│   │   │   # Stores everything for compliance, debugging, analytics
│   │   │   #
│   │   │   # events.onAny(async (eventName, event) => {
│   │   │   #   await auditRepo.create({
│   │   │   #     eventName,
│   │   │   #     payload: event.payload,
│   │   │   #     timestamp: event.timestamp,
│   │   │   #     scopeId: event.payload.scopeId,
│   │   │   #   });
│   │   │   # });
│   │   │
│   │   ├── data/
│   │   │   ├── audit.repository.ts
│   │   │   └── audit.repository.mongo.ts
│   │   │
│   │   ├── domain/
│   │   │   └── ...
│   │   │
│   │   └── index.ts                    # ✨ Registers event handlers
│   │
│   └── package.json
│
├── auth/
├── flags/
├── identity/
├── media/
├── pdf/
├── settings/
├── tenants/
└── usage/
    # All other modules follow the same pattern:
    # - service/ (business logic with getScope())
    # - event-handlers.ts (NEW - listen & emit events)
    # - data/ (repositories with interfaces)
    # - domain/entities/ (NEW - pure business logic)
    # - index.ts (registers event handlers)
```

---

## 🆕 New Packages Added

### 1. Kernel Enhancements

```
packages/foundation/kernel/
├── src/
│   ├── scope/                              # ✨ NEW: Universal scope system
│   │   ├── types.ts                        # ScopeType = 'tenant' | 'user' | 'merchant'
│   │   │   # export type ScopeType = 'tenant' | 'user' | 'merchant' | 'organization';
│   │   │   # export interface Scope {
│   │   │   #   type: ScopeType;
│   │   │   #   id: string;
│   │   │   #   metadata?: Record<string, unknown>;
│   │   │   # }
│   │   │
│   │   ├── context.ts                      # AsyncLocalStorage-based context
│   │   │   # export function getScope(): Scope
│   │   │   # export function runWithScope<T>(scope: Scope, fn: () => T): T
│   │   │   # export function getTenantId(): string  // Backward compatible
│   │   │
│   │   ├── helpers.ts                      # withScope(), scopeFilter()
│   │   │   # export function withScope<T>(data: T): T & { scopeType, scopeId }
│   │   │   # export function scopeFilter(): { scopeType, scopeId }
│   │   │
│   │   └── index.ts
│   │
│   ├── events/
│   │   ├── contracts/                      # ✨ NEW: Type-safe event contracts
│   │   │   ├── billing.events.ts           # Zod schemas for billing events
│   │   │   │   # export const BillingPaymentSucceededEvent = z.object({
│   │   │   │   #   type: z.literal('billing.payment.succeeded'),
│   │   │   │   #   payload: z.object({
│   │   │   │   #     scopeId: z.string(),
│   │   │   │   #     amount: z.number(),
│   │   │   │   #     currency: z.string(),
│   │   │   │   #   }),
│   │   │   │   # });
│   │   │   │
│   │   │   ├── credits.events.ts           # Zod schemas for credits events
│   │   │   ├── storage.events.ts           # Zod schemas for storage events
│   │   │   ├── notify.events.ts            # Zod schemas for notify events
│   │   │   ├── audit.events.ts
│   │   │   └── index.ts                    # EventMap type for type safety
│   │   │       # export type EventMap = {
│   │   │       #   'billing.payment.succeeded': z.infer<typeof BillingPaymentSucceededEvent>;
│   │   │       #   'credits.granted': z.infer<typeof CreditsGrantedEvent>;
│   │   │       #   // ... all events
│   │   │       # };
│   │   │
│   │   └── index.ts                        # (existing event emitter, enhanced)
│   │
│   ├── platform/
│   │   ├── billing/                        # ✅ Already exists (unchanged)
│   │   │   ├── ports.ts                    # BillingProviderAdapter interface
│   │   │   └── index.ts                    # getBillingProvider(), register()
│   │   │
│   │   ├── storage/                        # ✨ NEW: Storage abstraction
│   │   │   ├── ports.ts                    # Storage port interfaces
│   │   │   │   # export interface FileUploadPort {
│   │   │   │   #   upload(file: Buffer, key: string): Promise<UploadResult>;
│   │   │   │   # }
│   │   │   │   # export interface FileDownloadPort {
│   │   │   │   #   download(key: string): Promise<DownloadResult>;
│   │   │   │   # }
│   │   │   │   # export type StorageProviderAdapter =
│   │   │   │   #   FileUploadPort & FileDownloadPort & ...
│   │   │   │
│   │   │   └── index.ts                    # getStorageProvider(), register()
│   │   │       # let _provider: StorageProviderAdapter;
│   │   │       # export function getStorageProvider() { return _provider; }
│   │   │       # export function registerStorageProvider(adapter) { _provider = adapter; }
│   │   │
│   │   ├── database/                       # ✨ NEW: Database abstraction (Phase 4)
│   │   │   ├── ports.ts                    # DatabaseProviderAdapter interface
│   │   │   └── index.ts                    # getDatabaseProvider(), register()
│   │   │
│   │   ├── email/                          # ✅ Already exists
│   │   └── oauth/                          # ✅ Already exists
│   │
│   ├── resilience/                         # ✨ ENHANCED
│   │   ├── circuit-breaker.ts              # ✅ Already exists
│   │   ├── circuit-breaker-adapter.ts      # ✨ NEW: Wrap adapters with circuit breaker
│   │   │   # export class CircuitBreakerAdapter<T> {
│   │   │   #   constructor(adapter: T, config: { failureThreshold: 5 })
│   │   │   #   wrap<K extends keyof T>(method: K): T[K]
│   │   │   # }
│   │   │
│   │   ├── failover-adapter.ts             # ✨ NEW: Automatic failover
│   │   │   # export class FailoverAdapter<T> {
│   │   │   #   constructor(primary: T, fallbacks: T[])
│   │   │   #   async execute(method, ...args)
│   │   │   # }
│   │   │   # Stripe fails → try PayPal → try Razorpay
│   │   │
│   │   ├── graceful-degradation.ts         # ✨ NEW: Return partial results
│   │   │   # export async function withGracefulDegradation<T>(
│   │   │   #   fn: () => Promise<T>,
│   │   │   #   options: { fallback?, defaultValue?, timeout? }
│   │   │   # ): Promise<DegradedResult<T>>
│   │   │
│   │   ├── health-check.ts                 # ✨ NEW: Health monitoring
│   │   │   # export interface HealthStatus {
│   │   │   #   status: 'healthy' | 'degraded' | 'unhealthy';
│   │   │   #   latency: number;
│   │   │   # }
│   │   │   # export class HealthMonitor {
│   │   │   #   register(name: string, service: HealthCheckable, intervalMs: 30000)
│   │   │   #   getStatus(name: string): HealthStatus
│   │   │   # }
│   │   │
│   │   ├── retry.ts                        # ✨ NEW: Retry with exponential backoff
│   │   │   # export async function retryWithBackoff<T>(
│   │   │   #   fn: () => Promise<T>,
│   │   │   #   options: { maxRetries: 3, backoffMultiplier: 2 }
│   │   │   # )
│   │   │
│   │   └── index.ts
│   │
│   └── ...
```

### 2. Adapter Packages

```
packages/adapters/                          # ✨ NEW: Separate adapter packages
├── billing-stripe/                         # ✅ Moved from kernel (enhanced)
│   ├── src/
│   │   ├── index.ts                        # StripeAdapter implements BillingProviderAdapter
│   │   │   # export class StripeAdapter implements BillingProviderAdapter {
│   │   │   #   async createCheckout(...) { ... }
│   │   │   #   async refundPayment(...) { ... }
│   │   │   #   async healthCheck(): Promise<HealthStatus> { ... }
│   │   │   # }
│   │   │
│   │   └── health.ts                       # ✨ NEW: Health check implementation
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── billing-paypal/                         # ✅ Moved from kernel
│   └── src/index.ts                        # PayPalAdapter implements BillingProviderAdapter
│
├── billing-razorpay/                       # ✅ Moved from kernel
│   └── src/index.ts                        # RazorpayAdapter implements BillingProviderAdapter
│
├── storage-s3/                             # ✨ NEW: S3 adapter
│   ├── src/
│   │   ├── index.ts                        # S3StorageAdapter
│   │   │   # import { S3Client } from '@aws-sdk/client-s3';
│   │   │   # export class S3StorageAdapter implements StorageProviderAdapter {
│   │   │   #   async upload(file: Buffer, key: string) {
│   │   │   #     await this.s3.send(new PutObjectCommand({ ... }));
│   │   │   #   }
│   │   │   # }
│   │   │
│   │   └── health.ts                       # Health check for S3
│   │
│   └── package.json
│
├── storage-gcs/                            # ✨ NEW: Google Cloud Storage adapter
│   ├── src/
│   │   ├── index.ts                        # GCSStorageAdapter
│   │   │   # import { Storage } from '@google-cloud/storage';
│   │   │   # export class GCSStorageAdapter implements StorageProviderAdapter
│   │   │
│   │   └── health.ts
│   │
│   └── package.json
│
├── storage-azure/                          # ✨ NEW: Azure Blob Storage adapter
│   └── src/index.ts                        # AzureBlobStorageAdapter
│
├── storage-local/                          # ✨ NEW: Local filesystem (for development)
│   └── src/index.ts                        # LocalStorageAdapter
│       # Uses fs.writeFile, fs.readFile (no cloud dependencies)
│
├── database-mongodb/                       # ✨ NEW: MongoDB adapter
│   └── src/index.ts                        # MongoDBAdapter (wraps existing col() usage)
│
└── database-postgres/                      # ✨ NEW: PostgreSQL adapter (future)
    └── src/index.ts                        # PostgreSQLAdapter
```

### 3. App Initialization

```
apps/saaskit/
├── src/
│   ├── initialization/                     # ✨ NEW: Centralized initialization
│   │   ├── adapters.ts                     # Register all adapters on startup
│   │   │   # import { registerStorageProvider } from '@unisane/kernel';
│   │   │   # import { S3StorageAdapter } from '@unisane/adapter-storage-s3';
│   │   │   # import { GCSStorageAdapter } from '@unisane/adapter-storage-gcs';
│   │   │   #
│   │   │   # export function initializeStorageAdapter() {
│   │   │   #   const provider = getEnv().STORAGE_PROVIDER ?? 's3';
│   │   │   #
│   │   │   #   switch (provider) {
│   │   │   #     case 's3':
│   │   │   #       registerStorageProvider(new S3StorageAdapter({
│   │   │   #         region: getEnv().AWS_REGION!,
│   │   │   #         bucket: getEnv().AWS_S3_BUCKET!,
│   │   │   #       }));
│   │   │   #       break;
│   │   │   #
│   │   │   #     case 'gcs':
│   │   │   #       registerStorageProvider(new GCSStorageAdapter({
│   │   │   #         projectId: getEnv().GCP_PROJECT_ID!,
│   │   │   #         bucket: getEnv().GCS_BUCKET!,
│   │   │   #       }));
│   │   │   #       break;
│   │   │   #   }
│   │   │   # }
│   │   │   #
│   │   │   # export function initializeBillingAdapter() {
│   │   │   #   const stripe = new StripeAdapter({ ... });
│   │   │   #   const paypal = new PayPalAdapter({ ... });
│   │   │   #
│   │   │   #   // Add resilience
│   │   │   #   const resilientBilling = createFailoverAdapter(stripe, [paypal]);
│   │   │   #   registerBillingProvider('stripe', resilientBilling);
│   │   │   # }
│   │   │
│   │   ├── events.ts                       # ✨ NEW: Register all event handlers
│   │   │   # import { registerBillingEventHandlers } from '@unisane/billing';
│   │   │   # import { registerCreditEventHandlers } from '@unisane/credits';
│   │   │   # import { registerWebhookEventHandlers } from '@unisane/webhooks';
│   │   │   # import { registerStorageEventHandlers } from '@unisane/storage';
│   │   │   # import { registerNotifyEventHandlers } from '@unisane/notify';
│   │   │   # import { registerAuditEventHandlers } from '@unisane/audit';
│   │   │   #
│   │   │   # export function initializeEventHandlers() {
│   │   │   #   // Register all event handlers
│   │   │   #   registerBillingEventHandlers();
│   │   │   #   registerCreditEventHandlers();
│   │   │   #   registerWebhookEventHandlers();
│   │   │   #   registerStorageEventHandlers();
│   │   │   #   registerNotifyEventHandlers();
│   │   │   #   registerAuditEventHandlers();
│   │   │   # }
│   │   │
│   │   ├── health.ts                       # ✨ NEW: Health monitoring
│   │   │   # import { HealthMonitor } from '@unisane/kernel';
│   │   │   # import { getBillingProvider, getStorageProvider } from '@unisane/kernel';
│   │   │   #
│   │   │   # export function initializeHealthMonitoring(app: Express) {
│   │   │   #   const monitor = new HealthMonitor();
│   │   │   #
│   │   │   #   // Monitor billing provider
│   │   │   #   monitor.register('billing', getBillingProvider(), 30000);
│   │   │   #
│   │   │   #   // Monitor storage provider
│   │   │   #   monitor.register('storage', getStorageProvider(), 30000);
│   │   │   #
│   │   │   #   // Health endpoint
│   │   │   #   app.get('/health', (req, res) => {
│   │   │   #     const statuses = monitor.getAllStatuses();
│   │   │   #     res.json({ services: statuses });
│   │   │   #   });
│   │   │   # }
│   │   │
│   │   └── index.ts                        # ✨ NEW: Main initialization
│   │       # export async function initializeApp() {
│   │       #   await initializeAdapters();
│   │       #   await initializeEventHandlers();
│   │       #   await initializeHealthMonitoring(app);
│   │       # }
│   │
│   └── index.ts                            # ✨ CHANGED: Call initialization
│       # import { initializeApp } from './initialization';
│       #
│       # async function main() {
│       #   await initializeApp();  // Initialize everything
│       #   await startServer();    // Start server
│       # }
│
└── package.json
```

---

## 🔄 Key Changes Summary

### 1. Every Module Gets `event-handlers.ts`

**Purpose:** Decouple modules via events instead of direct imports.

**Before:**
```typescript
// webhooks/src/inbound/stripe/handlers.ts
import { grant } from '@unisane/credits';  // ❌ Direct import = tight coupling
await grant(tenantId, amount);             // ❌ Direct call
```

**After:**
```typescript
// webhooks/src/inbound/stripe/handlers.ts
import { events } from '@unisane/kernel';
await events.emit('billing.payment.succeeded', {
  scopeId: scope.id,
  amount: 100,
});

// credits/src/event-handlers.ts (NEW FILE)
import { events } from '@unisane/kernel';
import { grant } from './service/grant';  // Internal import

events.on('billing.payment.succeeded', async (event) => {
  await grant({
    scopeId: event.payload.scopeId,
    amount: event.payload.amount * 10,
  });
});
```

**Benefits:**
- ✅ Zero coupling between modules
- ✅ Can remove any module without breaking others
- ✅ Can add new modules without changing existing ones
- ✅ Easy to test (mock events, not modules)

---

### 2. `getTenantId()` → `getScope()` Everywhere

**Purpose:** Support ANY platform type (SaaS, e-commerce, marketplace, social).

**Before:**
```typescript
const tenantId = getTenantId();  // ❌ Only works for tenant-based (SaaS)
await col('files').insertOne(withTenantId({
  key: 'file.pdf',
  size: 1024,
}));
```

**After:**
```typescript
const scope = getScope();  // ✅ Universal (works for any platform)
await col('files').insertOne(withScope({
  key: 'file.pdf',
  size: 1024,
}));

// Automatically adds:
// { scopeType: 'tenant', scopeId: 'team_123', key: 'file.pdf', size: 1024 }  // SaaS
// { scopeType: 'user', scopeId: 'user_456', key: 'file.pdf', size: 1024 }    // E-commerce
// { scopeType: 'merchant', scopeId: 'shop_789', key: 'file.pdf', size: 1024 } // Marketplace
```

**Benefits:**
- ✅ Same code works for SaaS, e-commerce, marketplace, social, etc.
- ✅ Build new platform types in 1-2 weeks (vs 4-6 weeks)
- ✅ No refactoring needed when adding new platform types

---

### 3. Direct Imports → Provider Interfaces

**Purpose:** Swap ANY provider (S3, GCS, Azure, MongoDB, Postgres) via config.

**Before:**
```typescript
// storage/src/service/upload.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';  // ❌ Hard-coded S3
const s3 = new S3Client({ region: 'us-east-1' });
await s3.send(new PutObjectCommand({ ... }));

// To switch to GCS:
// - Rewrite storage module
// - Replace S3 SDK with GCS SDK
// - Update all methods
// - Test everything
// = 1-2 weeks of work
```

**After:**
```typescript
// storage/src/service/upload.ts
import { getStorageProvider } from '@unisane/kernel';  // ✅ Interface (not implementation)
const storage = getStorageProvider();
await storage.upload({ file, key });

// To switch to GCS:
// 1. Change .env: STORAGE_PROVIDER=gcs
// 2. Done!
// = 5 minutes
```

**Benefits:**
- ✅ Swap S3 ↔ GCS ↔ Azure via config (no code changes)
- ✅ Swap Stripe ↔ PayPal ↔ Razorpay via config
- ✅ Swap MongoDB ↔ PostgreSQL via config (future)
- ✅ Use local adapters for development (no cloud dependencies)

---

### 4. Domain Entities Added

**Purpose:** Pure business logic with zero dependencies (easy to test, easy to reuse).

**Before:**
```typescript
// billing/src/service/refund.ts
export async function refund(args) {
  // Business logic mixed with infrastructure:
  const p = await PaymentsRepository.findByProviderPaymentId({ ... });  // DB query
  const locked = await redis.set(lockKey, '1', { NX: true });           // Redis
  const provider = getBillingProvider();                                 // External service
  await provider.refundPayment({ ... });                                 // API call
  await PaymentsRepository.markRefunded(p.id);                           // DB update

  // Hard to test (need mocks for DB, Redis, provider)
  // Hard to reuse (logic tied to infrastructure)
}
```

**After:**
```typescript
// billing/src/domain/entities/payment.entity.ts
export class Payment {
  constructor(
    public readonly id: string,
    private _amount: number,
    private _status: PaymentStatus
  ) {}

  isRefundable(): boolean {
    return this._status === 'succeeded' && this._amount > 0;
  }

  calculateRefundAmount(partial?: number): number {
    if (!this.isRefundable()) {
      throw new DomainError('Payment not refundable');
    }
    return partial ?? this._amount;
  }

  canPartialRefund(): boolean {
    return this._amount > 0 && this._status === 'succeeded';
  }
}

// NO IMPORTS! Pure TypeScript!
// Easy to test (no mocks needed)
// Easy to reuse (works anywhere)

// billing/src/service/refund.ts
export async function refund(args) {
  const p = await PaymentsRepository.findByProviderPaymentId({ ... });
  const payment = new Payment(p.id, p.amount, p.status);  // Domain entity

  if (!payment.isRefundable()) {
    throw ERR.forbidden('Payment not refundable');
  }

  const refundAmount = payment.calculateRefundAmount(args.amount);

  // ... rest of infrastructure code
}
```

**Benefits:**
- ✅ Pure business logic (no dependencies)
- ✅ Easy to test (no mocks needed)
- ✅ Easy to reuse (works in any context)
- ✅ Type-safe (TypeScript classes)

---

## 📊 Comparison Table

| Aspect | Before | After |
|--------|--------|-------|
| **Module exports** | Export functions for other modules to call | Export NOTHING (except types) |
| **Module communication** | Direct imports: `import { grant } from '@unisane/credits'` | Events only: `events.emit('credits.granted')` |
| **Scope system** | `getTenantId()` - SaaS only | `getScope()` - Any platform type |
| **Storage** | Direct S3 imports: `import { S3Client }` | Interface: `getStorageProvider()` |
| **Database** | Direct MongoDB imports: `col('users')` | Interface: `getDatabaseProvider()` (future) |
| **Billing** | Direct provider calls: `getBillingProvider()` | ✅ Already abstracted (good!) |
| **Email** | Already abstracted: `getEmailProvider()` | ✅ No change (already good!) |
| **Resilience** | Basic error handling | Circuit breaker, failover, graceful degradation |
| **Event handlers** | None | Every module has `event-handlers.ts` |
| **Domain entities** | None (anemic domain) | Pure business logic classes |
| **Health checks** | None | Every adapter has `healthCheck()` |
| **Testing** | Need mocks for everything | Local adapters, minimal mocks |
| **Provider swap** | 1-2 weeks refactor | 5 minutes config change |
| **New platform** | 4-6 weeks (rebuild multi-tenancy, billing, storage) | 1-2 weeks (reuse everything) |
| **Module coupling** | ~50 direct imports | 0 direct imports (zero coupling) |

---

## 🎯 Module Independence Verification

After migration, you can verify **zero coupling** between modules:

```bash
# Check for direct module imports (should return ZERO)
grep -r "from '@unisane/" packages/modules/*/src/*.ts | grep -v "@unisane/kernel"

# Before migration: ~50 results (lots of coupling)
# ❌ packages/modules/webhooks/src/inbound/stripe/handlers.ts:import { grant } from '@unisane/credits';
# ❌ packages/modules/webhooks/src/inbound/stripe/handlers.ts:import { paymentsRepo } from '@unisane/billing';
# ❌ ... 48 more

# After migration: 0 results (zero coupling)
# ✅ (no output)
```

**All modules can ONLY import from `@unisane/kernel`**

---

## 🚀 Example: Adding a New Module

### Before (With Coupling)

```typescript
// Create new module: packages/modules/invoices/

// invoices/src/service/generate.ts
import { getSubscription } from '@unisane/billing';  // ❌ Direct import
import { sendEmail } from '@unisane/notify';          // ❌ Direct import

export async function generateInvoice(tenantId: string) {
  const sub = await getSubscription(tenantId);  // ❌ Tight coupling

  // ... generate PDF

  await sendEmail({  // ❌ Tight coupling
    to: 'user@example.com',
    subject: 'Invoice',
    body: '...',
  });
}
```

**Problem:**
- If you remove `billing` module, `invoices` breaks
- If you remove `notify` module, `invoices` breaks
- Can't test `invoices` without mocking `billing` and `notify`

### After (Event-Driven)

```typescript
// Create new module: packages/modules/invoices/

// invoices/src/service/generate.ts
import { getScope, events } from '@unisane/kernel';  // ✅ Only kernel

export async function generateInvoice() {
  const scope = getScope();

  // ... generate PDF

  await events.emit('invoice.generated', {
    scopeId: scope.id,
    invoiceId: 'inv_123',
    url: 'https://...',
  });
}

// invoices/src/event-handlers.ts
import { events } from '@unisane/kernel';
import { generateInvoice } from './service/generate';

export function registerInvoiceEventHandlers() {
  // React to subscription creation
  events.on('billing.subscription.created', async (event) => {
    await generateInvoice();
  });

  // Notify sends email automatically (listens to invoice.generated)
}
```

**Benefits:**
- ✅ Can remove ANY module without breaking `invoices`
- ✅ Can add `invoices` without changing existing modules
- ✅ Zero coupling
- ✅ Easy to test (mock events, not modules)

---

## 🎉 Summary

### What Changes?

1. **Every module gets `event-handlers.ts`** - Zero coupling via events
2. **`getTenantId()` → `getScope()`** - Universal scope for any platform
3. **Direct imports → Provider interfaces** - Swap providers via config
4. **Add domain entities** - Pure business logic with zero dependencies
5. **Add adapter packages** - Separate, swappable implementations
6. **Add initialization** - Centralized setup in `apps/saaskit/src/initialization/`

### What Stays the Same?

- Module structure: `service/`, `data/`, `domain/`, `client.ts`, `index.ts`
- Repository pattern: Already well-structured
- Type safety: Zod schemas, TypeScript types
- Testing structure: `__tests__/` folder

### The Big Win

**Before:** Tightly coupled modules, hard-coded multi-tenancy, vendor lock-in

**After:** Zero coupling, universal scope, swappable providers, pure business logic

**Result:** Build ANY platform in 1-2 weeks (vs 4-6 weeks), swap providers in 5 minutes (vs 1-2 weeks), 99.99% uptime (vs 99.9%)

---

This is how the module structure evolves to support the hexagonal architecture vision! 🎯
