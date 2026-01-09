# @unisane/analytics

Platform analytics and metrics dashboard.

## Layer

PRO - Extended

## Features

- Admin dashboard metrics
- Revenue analytics
- User activity metrics
- Churn rate tracking
- Plan distribution analytics
- Cached aggregations

## Architecture Compliance

| Pattern | Status | Notes |
|---------|--------|-------|
| `selectRepo()` | ✅ | Used in repository facade |
| `getTenantId()` | 🔒 | N/A - admin-only, cross-tenant |
| `tenantFilter()` | 🔒 | N/A - admin-only, cross-tenant |
| Keys builder | ✅ | `analyticsKeys` in domain/keys.ts |

## Usage

```typescript
import { getAdminAnalyticsDashboard } from "@unisane/analytics";

// Get admin dashboard (cross-tenant aggregation)
const dashboard = await getAdminAnalyticsDashboard();
// {
//   revenue: { value: 12500, change: 15.2, sparkline: [...] },
//   activeUsers: { value: 1234, change: 8.5, sparkline: [...] },
//   churnRate: { value: 2.1, change: -0.3, sparkline: [...] },
//   planDistribution: { free: 45, pro: 35, enterprise: 20 },
//   recentSignups: [{ name: "...", email: "...", createdAt: ... }, ...]
// }
```

## Caching

- Dashboard cached for 5 minutes
- Uses Redis KV cache
- Automatic invalidation on TTL expiry

## Exports

- `getAdminAnalyticsDashboard` - Get admin dashboard metrics
- `analyticsKeys` - Cache key builder
- `ANALYTICS_EVENTS` - Event constants
- `ZAnalyticsDashboard` - Zod schema
- `AnalyticsQueryError` - Error class
- `MetricNotFoundError` - Error class
