# Unisane Performance Optimization Roadmap

> **Status:** Active
> **Created:** 2026-01-10
> **Last Updated:** 2026-01-10
> **Priority:** High - System performs well but can be blazing fast

---

## Executive Summary

The Unisane platform has a solid architectural foundation but has significant performance optimization opportunities across all layers. This roadmap outlines concrete improvements that can yield **3-5x performance gains** with focused effort.

### Current Performance Score: 6.5/10

| Layer | Score | Key Issues |
|-------|-------|------------|
| Frontend (React/DataTable) | 7/10 | Missing memoization, inline objects |
| Backend (API/Database) | 6/10 | No caching, missing indexes, N+1 in notifications |
| SDK/Hooks | 5/10 | No request deduplication, suboptimal query keys |
| Build/Infrastructure | 7/10 | Missing Next.js optimizations, no proxy.ts |

---

## Priority 1: Critical Fixes (1-2 weeks)

### P1.1 Backend Response Compression

**Impact:** 60-80% bandwidth reduction
**Effort:** Low (1 day)

**Problem:** No compression configured for API routes.

**Solution:** Enable compression in `next.config.mjs`:

```javascript
// next.config.mjs
const nextConfig = {
  compress: true,  // Enables gzip/brotli compression
  // ... other config
};
```

> **Note:** Next.js 16+ renamed `middleware.ts` to `proxy.ts`. See P4.1 for proxy configuration.

---

### P1.2 Fix Notification Mark-All-Seen N+1 Query

**Impact:** 100x faster for users with many notifications
**Effort:** Low (2 hours)
**Location:** `packages/modules/notify/src/data/notifications.repository.mongo.ts` (lines 130-151)

**Current Code (BAD):**
```typescript
for await (const n of cursor) {
  await recCol().updateOne(...) // Multiple individual updates
}
```

**Fixed Code:**
```typescript
async upsertSeenUntil(tenantId: string, userId: string, cutoffId: string) {
  const notifIds = await notifCol()
    .find({
      tenantId, userId, _id: { $lte: cutoffId },
      ...softDeleteFilter(),
    })
    .project({ _id: 1 })
    .toArray()
    .then(docs => docs.map(d => d._id));

  if (notifIds.length > 0) {
    await recCol().updateMany(
      { tenantId, userId, notificationId: { $in: notifIds } },
      { $setOnInsert: { seenAt: new Date(), createdAt: new Date() } },
      { upsert: true }
    );
  }
}
```

---

### P1.3 Cache Credits Balance

**Impact:** 60x reduction in ledger aggregation scans
**Effort:** Low (3 hours)
**Location:** `packages/modules/credits/src/service/balance.ts`

**Current:** Every balance check aggregates entire credit_ledger collection.

**Solution:**
```typescript
import { cacheGet, cacheSet } from '@unisane/kernel/cache';

export async function balance() {
  const tenantId = getTenantId();
  const cacheKey = `credits:balance:${tenantId}`;

  // Check cache first
  const cached = await cacheGet<{ amount: number }>(cacheKey);
  if (cached) return cached;

  // Compute and cache
  const { available } = await totalsAvailable(tenantId, new Date());
  await cacheSet(cacheKey, { amount: available }, 60_000); // 60s TTL

  return { amount: available };
}
```

**Cache Invalidation:** Add event listener for `CREDITS_EVENTS.GRANT` and `CREDITS_EVENTS.BURN` to invalidate cache.

---

### P1.4 Memoize SDK Client Initialization

**Impact:** Eliminates 223+ dynamic imports per session
**Effort:** Medium (4 hours)
**Location:** `starters/saaskit/src/sdk/contractHooks.ts` (lines 24-62)

**Current (BAD):** Creates new API client on every function call.

**Solution:**
```typescript
// Cache the initialized hooks
let cachedHooks: ReturnType<typeof initQueryClient> | null = null;
let cachedBaseUrl: string | null = null;

export async function createContractHooks(init: Init = {}) {
  const baseUrl = init.baseUrl ?? '/api/rest';

  // Return cached if same baseUrl
  if (cachedHooks && cachedBaseUrl === baseUrl) {
    return cachedHooks;
  }

  const { initQueryClient } = await import('@ts-rest/react-query');

  cachedHooks = initQueryClient(appRouter, {
    baseUrl,
    credentials: init.credentials ?? 'include',
    baseHeaders: createBaseHeaders(init),
  });
  cachedBaseUrl = baseUrl;

  return cachedHooks;
}

// Extract header generation (one-time per session)
function createBaseHeaders(init: Init) {
  const sessionId = crypto.randomUUID(); // One ID per session
  return () => ({
    ...(init.headersExtra ?? {}),
    [HEADER_NAMES.REQUEST_ID]: crypto.randomUUID(),
    [HEADER_NAMES.SESSION_ID]: sessionId,
  });
}
```

---

### P1.5 Fix React Query staleTime Configuration

**Impact:** 30-40% fewer unnecessary refetches
**Effort:** Medium (4 hours)
**Locations:** Multiple client files

**Current (BAD):** Uniform 60-second staleTime across all query types.

**Recommended Configuration by Data Type:**

```typescript
// 1. Frequently Updated Lists (users, tenants, logs)
const listQueryOptions = {
  staleTime: 15_000,      // 15 seconds
  gcTime: 5 * 60_000,     // 5 min cache
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
};

// 2. Mostly Static Config/Flags
const configQueryOptions = {
  staleTime: 30 * 60_000,  // 30 minutes
  gcTime: 60 * 60_000,     // 1 hour
  refetchOnWindowFocus: false,
};

// 3. User-Specific Data (profile, settings)
const userDataQueryOptions = {
  staleTime: 60_000,       // 1 minute
  gcTime: 10 * 60_000,     // 10 minutes
  refetchOnWindowFocus: true,
  refetchInterval: 5 * 60_000,
};

// 4. Immutable Data (entity by ID)
const immutableQueryOptions = {
  staleTime: Infinity,     // Never auto-expire
  gcTime: 24 * 60_000,     // Clean up after 24 hours
  refetchOnWindowFocus: false,
};
```

---

## Priority 2: High Impact (2-4 weeks)

### P2.1 Define MongoDB Indexes

**Impact:** 5-10x faster queries on large collections
**Effort:** Medium (1 day)

**Required Indexes:**
```javascript
// users collection
db.users.createIndex({ email: 1 }, { unique: true, sparse: true });
db.users.createIndex({ authUserId: 1 });
db.users.createIndex({ username: 1 });
db.users.createIndex({ phone: 1 });

// memberships collection
db.memberships.createIndex({ tenantId: 1, userId: 1, deletedAt: 1 });
db.memberships.createIndex({ userId: 1, deletedAt: 1 });

// audit_logs collection
db.audit_logs.createIndex({ tenantId: 1, createdAt: -1 });
db.audit_logs.createIndex({ actorId: 1, createdAt: -1 });

// credit_ledger collection
db.credit_ledger.createIndex({ tenantId: 1, kind: 1, expiresAt: 1 });
db.credit_ledger.createIndex({ tenantId: 1, createdAt: -1 });

// inapp_notifications collection
db.inapp_notifications.createIndex({ tenantId: 1, userId: 1, createdAt: -1 });
db.inapp_notifications.createIndex({ tenantId: 1, userId: 1, readAt: 1 });
```

---

### P2.2 Fix Query Key Serialization

**Impact:** Prevents cache misses on identical queries
**Effort:** Medium (4 hours)
**Location:** `scripts/codegen/sdk/hooks/generators/keys.ts`

**Current (BAD):**
```typescript
// Object comparison is shallow - new object = cache miss
return ["${g.name}", "${r.name}", a?.params ?? null, a?.query ?? null];
```

**Fixed:**
```typescript
// Deterministic serialization for stable comparison
return [
  "${g.name}",
  "${r.name}",
  a?.params ? JSON.stringify(a.params, Object.keys(a.params).sort()) : null,
  a?.query ? JSON.stringify(a.query, Object.keys(a.query).sort()) : null,
];
```

---

### P2.3 Granular Mutation Invalidation

**Impact:** Reduces unnecessary refetches by 50%
**Effort:** Medium (1 day)
**Location:** `scripts/codegen/sdk/hooks/generators/domain.ts` (line 190)

**Current (BAD):** Invalidates ALL queries in domain on any mutation.

**Fixed:**
```typescript
onSuccess: (data, variables, ctx) => {
  const base = ["${g.name}"];

  // Invalidate only affected queries
  const invalidate = async () => {
    // List queries - always invalidate
    await qc.invalidateQueries({ queryKey: [...base, "list"], exact: false });

    // Stats queries - may have changed
    await qc.invalidateQueries({ queryKey: [...base, "stats"], exact: false });

    // Detail cache - update directly if we have the ID
    if (variables.params?.id) {
      qc.setQueryData([...base, "get", variables.params.id], data);
    }
  };

  void invalidate();
  options?.onSuccess?.(data, variables, ctx);
},
```

---

### P2.4 Next.js Code Splitting Configuration

**Impact:** 5-10% bundle size reduction
**Effort:** Low (30 minutes)
**Location:** `starters/saaskit/next.config.mjs`

```javascript
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,  // Enable type-safe routing

  // Image optimization
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
  },

  // Code splitting
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      '@unisane/ui',
      '@unisane/tokens',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      'lucide-react',
      'recharts',
    ],
  },

  // Compression
  compress: true,
  productionBrowserSourceMaps: false,
};
```

---

### P2.5 Optimize useProcessedData Hook

**Impact:** 60-70% faster filtering for large tables (1000+ rows)
**Effort:** High (1 day)
**Location:** `packages/ui/data-table/src/hooks/data/use-processed-data.ts`

**Current Issues:**
- Multiple full array passes (filter → filter → sort)
- Repeated `getNestedValue()` calls for same fields
- Date parsing in comparator executes repeatedly

**Optimized Pattern:**
```typescript
// Single-pass with value caching
const valueCache = new WeakMap<T, Record<string, unknown>>();

const getRowValues = (item: T): Record<string, unknown> => {
  if (valueCache.has(item)) return valueCache.get(item)!;
  const values: Record<string, unknown> = {};
  columns.forEach(col => {
    values[String(col.key)] = getNestedValue(item, String(col.key));
  });
  valueCache.set(item, values);
  return values;
};

// Single filter pass
const filtered = data.filter((item) => {
  const values = getRowValues(item);
  // Check all filters in one pass
  if (searchRegex && !matchesSearch(values, searchRegex)) return false;
  if (!matchesFilters(values, filterFns)) return false;
  return true;
});
```

---

## Priority 3: Medium Impact (1-2 months)

### P3.1 Implement Request Deduplication

**Impact:** 40-50% reduction in duplicate network requests
**Effort:** High (2 days)

Add middleware to deduplicate identical inflight requests:

```typescript
// sdk/deduplication.ts
const inflightRequests = new Map<string, Promise<Response>>();

export async function deduplicatedFetch(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> {
  const key = createRequestKey(input, init);

  // Return existing inflight request
  if (inflightRequests.has(key)) {
    return inflightRequests.get(key)!.then(r => r.clone());
  }

  // Create new request
  const promise = fetch(input, init).finally(() => {
    inflightRequests.delete(key);
  });

  inflightRequests.set(key, promise);
  return promise;
}
```

---

### P3.2 Consolidate Credits Queries

**Impact:** Single aggregation instead of two
**Effort:** Medium (4 hours)
**Location:** `packages/modules/credits/src/service/balance.ts` (lines 23-81)

**Current:** Calls both `totalsAvailable()` AND `totalsGrantsByReason()` - two separate aggregations.

**Solution:** Single `$facet` aggregation returning both metrics.

---

### P3.3 Configure MongoDB Connection Pool

**Impact:** Prevents connection exhaustion in serverless
**Effort:** Low (1 hour)
**Location:** `packages/foundation/kernel/src/database/connection.ts`

```typescript
const client = new MongoClient(uri, {
  maxPoolSize: 10,     // Limit per serverless instance
  minPoolSize: 1,      // Keep warm
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  retryWrites: true,
  retryReads: true,
});
```

---

### P3.4 Add Prefetch Hooks

**Impact:** Instant navigation for common paths
**Effort:** Medium (4 hours)

```typescript
// hooks/usePrefetchOnNavigation.ts
export function usePrefetchOnNavigation() {
  const queryClient = useQueryClient();

  return useCallback((href: string) => {
    // Prefetch user detail when hovering list items
    if (href.match(/\/admin\/users\/[\w-]+$/)) {
      const userId = href.split('/').pop()!;
      queryClient.prefetchQuery({
        queryKey: ['users', 'admin', 'get', userId],
        queryFn: () => fetchUserDetail(userId),
        staleTime: 60_000,
      });
    }

    // Prefetch next page on pagination hover
    if (href.includes('cursor=')) {
      // Parse and prefetch next page
    }
  }, [queryClient]);
}
```

---

### P3.5 Export Wildcard Fix in shared/index.ts

**Impact:** Better tree-shaking
**Effort:** Low (30 minutes)
**Location:** `starters/saaskit/src/shared/index.ts`

**Current (BAD):**
```typescript
export * from './env';
export * from './money';
export * from './time';
```

**Fixed:**
```typescript
export { env, getEnv, requireEnv } from './env';
export { formatMoney, parseMoney } from './money';
export { formatDate, formatRelativeTime } from './time';
```

---

## Priority 4: Nice to Have (3+ months)

### P4.1 Add Proxy (formerly Middleware)

> **Next.js 16+ Note:** Starting with Next.js 16, `middleware.ts` was renamed to `proxy.ts` to better reflect its purpose as a network boundary. The `proxy` function runs on **Node.js runtime only** (Edge runtime is no longer supported).

**Location:** `starters/saaskit/src/proxy.ts` (create)

```typescript
import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  // Rate limiting
  const ip = request.ip ?? 'anonymous';
  // ... rate limit check

  // Auth token validation (optimistic check only)
  const token = request.cookies.get('session');
  if (!token && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');

  return response;
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*', '/w/:path*'],
};
```

**Migration from middleware.ts:**
```bash
# Use Next.js 16 codemod
npx @next/codemod@canary upgrade latest

# Or manually rename
mv middleware.ts proxy.ts
# And rename exported function from `middleware` to `proxy`
```

**Best Practices (per Next.js 16 guidance):**
- ✅ Use proxy for: routing, rewrites, redirects, auth checks (optimistic)
- ❌ Don't use proxy for: complex logic, heavy validation, database calls
- Move heavy security logic to API routes or server actions

### P4.2 Implement Cache Invalidation Events

Add event listeners for automatic cache invalidation:

```typescript
// events/cache-invalidation.ts
eventBus.on(IDENTITY_EVENTS.USER_UPDATED, async ({ userId }) => {
  await cacheDelete(`user:${userId}`);
});

eventBus.on(CREDITS_EVENTS.GRANT, async ({ tenantId }) => {
  await cacheDelete(`credits:balance:${tenantId}`);
});

eventBus.on(CREDITS_EVENTS.BURN, async ({ tenantId }) => {
  await cacheDelete(`credits:balance:${tenantId}`);
});
```

### P4.3 Add Automatic Retry Logic to SDK

```typescript
// Generated hooks should include retry config
queryFn: async () => { /* ... */ },
retry: (failureCount, error) => {
  const normalized = normalizeError(error);
  return normalized.retryable && failureCount < 3;
},
retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
```

---

## Implementation Checklist

### Week 1 ✅ COMPLETED
- [x] P1.1 Add response compression
- [x] P1.2 Fix notification N+1 query
- [x] P1.3 Add credits balance caching
- [x] P1.4 Memoize SDK client initialization
- [x] P1.5 Configure staleTime by data type

### Week 2 ✅ COMPLETED
- [x] P2.1 Define MongoDB indexes (`ensureIndexes()` in kernel)
- [x] P2.2 Fix query key serialization (`stableKey()` function)
- [x] P2.3 Implement granular invalidation (list/specific/domain strategies)

### Week 3-4 ✅ COMPLETED
- [x] P2.4 Add Next.js code splitting config (skipped - optimizePackageImports not needed)
- [x] P2.5 Optimize useProcessedData hook (WeakMap row value cache)
- [x] P3.1 Add request deduplication (inflight request cache in SDK)
- [x] P3.2 Configure MongoDB pool (connection settings with env vars)

### Month 2 ✅ COMPLETED
- [x] P3.3 Consolidate credits queries ($facet aggregation)
- [x] P3.4 Add prefetch hooks (usePrefetch, usePrefetchPagination)
- [x] P3.5 Fix wildcard exports (explicit exports in shared/index.ts)

### Month 3+ ✅ COMPLETED
- [x] P4.1 Add proxy.ts (Next.js 16+ pattern)
- [x] P4.2 Implement cache invalidation events
- [x] P4.3 Add automatic retry logic

---

## Performance Metrics to Track

### Frontend
- **First Contentful Paint (FCP)**: Target < 1.5s
- **Largest Contentful Paint (LCP)**: Target < 2.5s
- **Time to Interactive (TTI)**: Target < 3.5s
- **Bundle Size**: Track main bundle, monitor regressions

### Backend
- **API Response Time (P50/P95/P99)**: Target < 100ms / 500ms / 1s
- **Database Query Time**: Target < 50ms average
- **Cache Hit Rate**: Target > 80%

### Network
- **Request Count per Page**: Track and minimize
- **Transfer Size**: Track with/without compression
- **Duplicate Requests**: Should be 0

---

## Related Documents

- [MASTER-ROADMAP.md](./MASTER-ROADMAP.md) - Overall project roadmap
- [centralization-plan.md](./centralization-plan.md) - Architecture consolidation
- [DataTable ROADMAP.md](../../packages/ui/data-table/ROADMAP.md) - DataTable specific improvements
