# @unisane/credits

Credit balance management with ledger tracking.

## Layer

**Layer 4 - Business**

## Overview

The credits module provides credit-based billing:

- Credit balance tracking per tenant
- Grant credits (subscription, topup, promotional)
- Consume credits for feature usage
- Full ledger audit trail
- Credit expiration support
- Idempotent operations with deduplication

## Installation

```bash
pnpm add @unisane/credits
```

## Usage

### Get Balance

```typescript
import { balance } from '@unisane/credits';

// In a route handler (after tenant context is established)
const { amount } = await balance();
console.log('Available credits:', amount);
```

### Get Balance Breakdown

```typescript
import { breakdown } from '@unisane/credits';

const credits = await breakdown();
console.log('Total:', credits.total.available);
console.log('From subscription:', credits.subscription.available);
console.log('From topup:', credits.topup.available);
console.log('Other:', credits.other.available);
```

### Grant Credits

```typescript
import { grant } from '@unisane/credits';

// Grant credits with idempotency key
const result = await grant({
  amount: 1000,
  reason: 'subscription:pro:monthly',
  idem: 'sub_123_jan2026',
  expiresAt: new Date('2026-02-01'),
});

if (result.deduped) {
  console.log('Already granted (idempotent)');
} else {
  console.log('Granted:', result.id);
}
```

### Consume Credits

```typescript
import { consume } from '@unisane/credits';

// Consume credits for feature usage
const result = await consume({
  amount: 50,
  reason: 'api:gpt4:request_123',
  feature: 'ai',
});

if (result.skipped) {
  console.log('Zero amount, skipped');
} else if (result.deduped) {
  console.log('Already consumed (idempotent)');
} else {
  console.log('Credits consumed');
}
```

### List Ledger Entries

```typescript
import { listLedger } from '@unisane/credits';

const { items, nextCursor } = await listLedger({ limit: 20 });
for (const entry of items) {
  console.log(entry.kind, entry.amount, entry.reason);
}
```

### Cache Keys

```typescript
import { creditsKeys } from '@unisane/credits';
import { kv } from '@unisane/kernel';

// Use standardized cache keys
const balanceKey = creditsKeys.balance(tenantId);
const lockKey = creditsKeys.idemLock(tenantId, 'request_123');
```

### Events

```typescript
import { events } from '@unisane/kernel';
import { CREDITS_EVENTS } from '@unisane/credits';

events.on(CREDITS_EVENTS.GRANTED, async ({ payload }) => {
  console.log('Credits granted:', payload.amount, payload.reason);
});

events.on(CREDITS_EVENTS.CONSUMED, async ({ payload }) => {
  console.log('Credits consumed:', payload.amount, payload.feature);
});
```

## Exports

### Services

| Function | Description |
|----------|-------------|
| `balance` | Get current credit balance |
| `breakdown` | Get detailed balance breakdown |
| `grant` | Grant credits to tenant |
| `consume` | Consume credits for usage |
| `listLedger` | List ledger entries |

### Admin Services

| Function | Description |
|----------|-------------|
| `getTenantCreditBalances` | Get balances for multiple tenants |

### Types

| Type | Description |
|------|-------------|
| `LedgerEntry` | Single ledger record |
| `CreditsBucket` | Grants/burns/available for a category |
| `CreditsBreakdown` | Full breakdown by source |
| `Balance` | Simple balance number |

### Constants

| Constant | Description |
|----------|-------------|
| `CREDITS_EVENTS` | Event names |
| `CREDITS_DEFAULTS` | Default values |
| `CREDITS_COLLECTIONS` | Collection names |

### Error Classes

| Error | Description |
|-------|-------------|
| `InsufficientCreditsError` | Not enough credits available |
| `NegativeCreditsError` | Cannot grant/consume negative amount |
| `CreditLedgerError` | Ledger operation failed |

## Architecture

### Tenant Scoping Design

Credits uses **explicit tenantId parameters** in repositories. This is intentional:

- Admin stats aggregate across tenants
- Webhook handlers process without user context
- Scheduled jobs (expiration) run without request context

Services use `getTenantId()` to retrieve tenant context for user-facing operations.

### Idempotency

All credit operations are idempotent:

1. **Grant** - Uses `idem` key to prevent duplicate grants
2. **Consume** - Uses `reason` as idempotency key
3. **Lock** - Redis NX lock prevents concurrent operations

### Credit Sources

| Source | Reason Prefix | Description |
|--------|---------------|-------------|
| Subscription | `subscription:*` | Monthly/annual plan credits |
| Topup | `topup:*` or `purchase:*` | One-time credit purchases |
| Other | anything else | Promotional, referral, etc. |

### Data Model

```typescript
// Ledger Entry
{
  id: string,
  tenantId: string,
  kind: 'grant' | 'burn',
  amount: number,
  reason: string,        // e.g., "subscription:pro:jan2026"
  feature?: string,      // For burns: which feature consumed
  idemKey: string,       // Idempotency key
  expiresAt?: Date,      // For grants: when credits expire
  createdAt: Date,
}
```

### Balance Calculation

Balance is computed from ledger aggregation:
- **Available** = Sum(unexpired grants) - Sum(burns)
- No separate balance table - ledger is source of truth
- Cached for performance, invalidated on changes

## Dependencies

- `@unisane/kernel` - Core utilities, Redis, events
- `@unisane/gateway` - Error responses

## Related Modules

- `@unisane/billing` - Subscription management, topups
- `@unisane/usage` - Feature usage tracking
