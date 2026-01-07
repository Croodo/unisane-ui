# @unisane/billing

Stripe/LemonSqueezy/Razorpay subscriptions, payments, invoices, refunds.

## Layer

**Layer 4 - Business**

## Overview

The billing module provides subscription and payment management:

- Subscription lifecycle (create, upgrade, downgrade, cancel)
- Payment processing and refunds
- Invoice management
- Customer billing portal
- Multiple billing providers (Stripe, LemonSqueezy, Razorpay)
- Flexible billing modes (subscription, topup, credits)

## Installation

```bash
pnpm add @unisane/billing
```

## Usage

### Get Current Subscription

```typescript
import { getSubscription } from '@unisane/billing';

// In a route handler (after tenant context is established)
const sub = await getSubscription();
console.log(sub.planId, sub.status, sub.cancelAtPeriodEnd);
```

### Subscribe to a Plan

```typescript
import { subscribe } from '@unisane/billing';

const checkout = await subscribe({
  tenantId: 'tenant_123',
  planId: 'pro',
  quantity: 5,
  successUrl: 'https://app.example.com/success',
  cancelUrl: 'https://app.example.com/cancel',
});

// Redirect user to checkout.url
```

### Cancel Subscription

```typescript
import { cancelSubscription } from '@unisane/billing';

// Cancel at end of billing period
const result = await cancelSubscription({ atPeriodEnd: true });

// Cancel immediately
const result = await cancelSubscription({ atPeriodEnd: false });
```

### Change Plan

```typescript
import { changePlan } from '@unisane/billing';

await changePlan({
  planId: 'enterprise',
  quantity: 10,
});
```

### List Payments & Invoices

```typescript
import { listPayments, listInvoices } from '@unisane/billing';

const payments = await listPayments({ limit: 20 });
const invoices = await listInvoices({ limit: 20, cursor: payments.nextCursor });
```

### Issue Refund

```typescript
import { refund } from '@unisane/billing';

await refund({
  paymentId: 'payment_123',
  amount: 1000, // Amount in minor units (cents)
  reason: 'Customer requested',
});
```

### Open Billing Portal

```typescript
import { portal } from '@unisane/billing';

const { url } = await portal();
// Redirect user to Stripe customer portal
```

### Top-up Credits

```typescript
import { topup } from '@unisane/billing';

const checkout = await topup({
  amount: 5000,
  successUrl: 'https://app.example.com/success',
  cancelUrl: 'https://app.example.com/cancel',
});
```

### Cache Keys

```typescript
import { billingKeys } from '@unisane/billing';
import { kv } from '@unisane/kernel';

// Use standardized cache keys
const subKey = billingKeys.subscription(tenantId);
const customerKey = billingKeys.customer(tenantId, 'stripe');
```

### Events

```typescript
import { events } from '@unisane/kernel';
import { BILLING_EVENTS } from '@unisane/billing';

events.on(BILLING_EVENTS.SUBSCRIPTION_CREATED, async ({ payload }) => {
  console.log('New subscription:', payload.tenantId, payload.planId);
});

events.on(BILLING_EVENTS.PAYMENT_SUCCEEDED, async ({ payload }) => {
  console.log('Payment received:', payload.amount, payload.currency);
});

events.on(BILLING_EVENTS.SUBSCRIPTION_CANCELLED, async ({ payload }) => {
  console.log('Subscription cancelled:', payload.tenantId);
});
```

## Exports

### Services

| Function | Description |
|----------|-------------|
| `getSubscription` | Get current tenant's subscription |
| `subscribe` | Create checkout for new subscription |
| `cancelSubscription` | Cancel subscription |
| `changePlan` | Change subscription plan |
| `changeQuantity` | Update seat/quantity |
| `listPayments` | List tenant's payments |
| `listInvoices` | List tenant's invoices |
| `refund` | Issue payment refund |
| `topup` | Create checkout for credit topup |
| `portal` | Get billing portal URL |
| `getConfig` | Get billing configuration |
| `getBillingMode` | Get current billing mode |

### Types

| Type | Description |
|------|-------------|
| `SubscriptionView` | Subscription record |
| `PaymentView` | Payment record |
| `InvoiceView` | Invoice record |
| `BillingConfig` | Billing configuration |
| `PlanConfig` | Plan definition |

### Constants

| Constant | Description |
|----------|-------------|
| `BILLING_EVENTS` | Event names |
| `BILLING_DEFAULTS` | Default values |
| `BILLING_COLLECTIONS` | Collection names |

### Error Classes

| Error | Description |
|-------|-------------|
| `SubscriptionNotFoundError` | No subscription found |
| `SubscriptionAlreadyExistsError` | Tenant already subscribed |
| `SubscriptionCancelledError` | Subscription cancelled |
| `InvalidPlanError` | Invalid plan ID |
| `PlanDowngradeNotAllowedError` | Downgrade blocked |
| `PaymentNotFoundError` | Payment not found |
| `PaymentAlreadyRefundedError` | Already refunded |
| `RefundAmountExceededError` | Refund too large |
| `InvoiceNotFoundError` | Invoice not found |
| `BillingProviderError` | Provider API error |
| `CustomerNotFoundError` | No billing customer |
| `InsufficientCreditsError` | Not enough credits |

## Architecture

### Tenant Scoping Design

Billing uses **explicit tenantId parameters** in repositories. This is intentional:

- Webhook handlers process events without user context
- Admin/stats aggregations query across tenants
- Reconciliation jobs run without request context

Services use `getTenantId()` to retrieve tenant context for user-facing operations.

### Billing Modes

| Mode | Description |
|------|-------------|
| `subscription` | Traditional subscription billing |
| `subscription_with_credits` | Subscription + usage-based credits |
| `topup_only` | Pay-as-you-go credit topups |
| `disabled` | Billing disabled |

### Data Model

```typescript
// Subscription
{
  id: string,
  tenantId: string,
  provider: 'stripe' | 'lemonsqueezy' | 'razorpay',
  providerSubId: string,
  planId: string,
  quantity: number,
  status: 'active' | 'trialing' | 'past_due' | 'canceled',
  cancelAtPeriodEnd: boolean,
  currentPeriodEnd: Date,
}

// Payment
{
  id: string,
  tenantId: string,
  provider: BillingProvider,
  providerPaymentId: string,
  amount: number,       // Minor units (cents)
  currency: string,
  status: PaymentStatus,
  capturedAt: Date,
}

// Invoice
{
  id: string,
  tenantId: string,
  provider: BillingProvider,
  providerInvoiceId: string,
  amount: number,
  currency: string,
  status: InvoiceStatus,
  issuedAt: Date,
  url: string,          // Hosted invoice URL
}
```

## Dependencies

- `@unisane/kernel` - Core utilities, billing provider abstraction
- `@unisane/gateway` - Error responses
- `@unisane/tenants` - Tenant repository

## Related Modules

- `@unisane/credits` - Credit balance management
- `@unisane/usage` - Usage tracking and metering
- `@unisane/tenants` - Tenant plan management
