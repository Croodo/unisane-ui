# @unisane/usage

Usage metering with time-windowed aggregation.

## Layer

5 - Features

## Features

- Minute-level real-time counters (Redis)
- Hourly and daily rollups (MongoDB)
- Idempotent increments with deduplication
- Multi-tenant usage tracking per feature

## Architecture Compliance

| Pattern | Status | Notes |
|---------|--------|-------|
| `selectRepo()` | ✅ | Used in repository facade |
| `getTenantId()` | ✅ | Used in services |
| `tenantFilter()` | 🔒 | N/A - explicit tenantId for rollup jobs |
| Keys builder | ✅ | `usageKeys` in domain/keys.ts |

## Usage

```typescript
import { increment, getWindow, rollupHour, rollupDay } from "@unisane/usage";

// Increment usage counter (uses context tenantId)
await increment({
  feature: "api_calls",
  n: 1,
  idempotencyKey: requestId, // Optional deduplication
});

// Get usage for current window
const minuteCount = await getWindow({ feature: "api_calls", window: "minute" });
const hourCount = await getWindow({ feature: "api_calls", window: "hour" });
const dayCount = await getWindow({ feature: "api_calls", window: "day" });

// Rollup jobs (run via cron/scheduler)
await rollupHour(); // Aggregate minute counters to hourly
await rollupDay();  // Aggregate hourly counters to daily
```

## Time Windows

| Window | Storage | TTL | Notes |
|--------|---------|-----|-------|
| Minute | Redis | Auto-expiring | Real-time counters |
| Hour | MongoDB | Permanent | Rolled up from minutes |
| Day | MongoDB | Permanent | Rolled up from hours |

## Exports

- `increment` - Increment usage counter
- `getWindow` - Get usage for time window
- `rollupHour` - Aggregate minutes to hours
- `rollupDay` - Aggregate hours to days
- `usageKeys` - Cache key builder
- `USAGE_EVENTS` - Event constants
- `USAGE_WINDOWS` - Window type constants
