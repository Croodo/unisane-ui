# @unisane/webhooks

Webhook delivery with retries and event logging.

## Layer

5 - Features

## Features

- Inbound webhook processing (Stripe, Razorpay, Resend, SES)
- Outbound webhook delivery with retry logic
- Event logging for audit and debugging
- Idempotent processing with deduplication
- Replay failed events

## Architecture Compliance

| Pattern | Status | Notes |
|---------|--------|-------|
| `selectRepo()` | ✅ | Used in repository facade |
| `getTenantId()` | ✅ | Used in listEvents, replay |
| `tenantFilter()` | 🔒 | N/A - explicit tenantId (inbound global, outbound from outbox) |
| Keys builder | ✅ | `webhooksKeys` in domain/keys.ts |

## Usage

```typescript
import {
  recordInboundEvent,
  recordOutbound,
  listEvents,
  replayEvent,
  getTenantFailureCounts,
} from "@unisane/webhooks";

// Record inbound webhook (provider webhooks are global)
await recordInboundEvent({
  provider: "stripe",
  payload: stripeEvent,
  headers: req.headers,
  verified: true,
});

// Record outbound webhook delivery
await recordOutbound({
  tenantId,
  target: "https://example.com/webhook",
  status: "delivered",
  httpStatus: 200,
  headers: {},
  payload: eventData,
});

// List webhook events (uses context tenantId)
const { items, nextCursor } = await listEvents({
  limit: 50,
  direction: "out",
  status: "failed",
});

// Replay a failed outbound event
await replayEvent({ id: eventId });

// Admin: get failure counts per tenant
const failureMap = await getTenantFailureCounts(tenantIds, since);
```

## Supported Providers

| Provider | Inbound | Notes |
|----------|---------|-------|
| Stripe | ✅ | Billing events |
| Razorpay | ✅ | Billing events |
| Resend | ✅ | Email bounces/complaints → suppression |
| SES | ✅ | Email bounces/complaints via SNS → suppression |

## Exports

- `recordInboundEvent` - Record and process inbound webhook
- `recordOutbound` - Record outbound webhook delivery
- `listEvents` - List webhook events with pagination
- `replayEvent` - Replay a failed outbound event
- `getTenantFailureCounts` - Admin: count failures per tenant
- `handleStripeEvent` - Internal Stripe event handler
- `handleRazorpayEvent` - Internal Razorpay event handler
- `webhooksKeys` - Cache key builder
- `WEBHOOKS_EVENTS` - Event constants
