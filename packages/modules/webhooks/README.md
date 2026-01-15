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
| `getScopeId()` | ✅ | Used in listEvents, replay |
| `scopeFilter()` | 🔒 | N/A - explicit scopeId (inbound global, outbound from outbox) |
| Keys builder | ✅ | `webhooksKeys` in domain/keys.ts |

## Usage

```typescript
import {
  recordInboundEvent,
  recordOutbound,
  listEvents,
  replayEvent,
  getScopeFailureCounts,
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
  scopeId,
  target: "https://example.com/webhook",
  status: "delivered",
  httpStatus: 200,
  headers: {},
  payload: eventData,
});

// List webhook events (uses context scopeId)
const { items, nextCursor } = await listEvents({
  limit: 50,
  direction: "out",
  status: "failed",
});

// Replay a failed outbound event
await replayEvent({ id: eventId });

// Admin: get failure counts per scope
const failureMap = await getScopeFailureCounts(scopeIds, since);
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
- `getScopeFailureCounts` - Admin: count failures per scope
- `handleStripeEvent` - Internal Stripe event handler
- `handleRazorpayEvent` - Internal Razorpay event handler
- `webhooksKeys` - Cache key builder
- `WEBHOOKS_EVENTS` - Event constants
