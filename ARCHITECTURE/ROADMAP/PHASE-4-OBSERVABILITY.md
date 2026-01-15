# Phase 4: Observability

> **For LLMs**: Add consistent logging, metrics, and monitoring across the codebase.

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Status** | Blocked |
| **Dependencies** | Phase 3 (quality) |
| **Blocks** | Phase 5 (testing) |
| **Focus** | Logging, metrics, error tracking |

---

## Prerequisites Check

Before starting this phase:
- Phase 0, 1, 2, 3 complete
- All P0 and P1 issues resolved
- Code quality improvements in place

---

## Tasks

### 1. Centralize Logger Configuration

**Current State**: Logger config scattered across modules.

**Target State**: Single source of truth in kernel.

```typescript
// packages/foundation/kernel/src/logger/config.ts

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogFormat = 'json' | 'pretty' | 'silent';

export interface LoggerConfig {
  level: LogLevel;
  format: LogFormat;
  includeTimestamp: boolean;
  includeRequestId: boolean;
}

const configs: Record<string, LoggerConfig> = {
  development: {
    level: 'debug',
    format: 'pretty',
    includeTimestamp: true,
    includeRequestId: true,
  },
  test: {
    level: 'error',
    format: 'silent',
    includeTimestamp: false,
    includeRequestId: false,
  },
  production: {
    level: 'info',
    format: 'json',
    includeTimestamp: true,
    includeRequestId: true,
  },
};

export function getLoggerConfig(): LoggerConfig {
  const env = getEnv('APP_ENV', 'development');
  return configs[env] ?? configs.development;
}
```

**Checklist**:
- [ ] Create `logger/config.ts` in kernel
- [ ] Export `getLoggerConfig()`
- [ ] Update all loggers to use centralized config
- [ ] Remove duplicate configs from modules

---

### 2. Standardize Log Formats

**Standard Log Entry**:
```typescript
interface LogEntry {
  timestamp: string;      // ISO 8601
  level: LogLevel;
  message: string;
  module: string;         // e.g., 'billing', 'auth'
  operation?: string;     // e.g., 'createSubscription'
  requestId?: string;     // Correlation ID
  scopeId?: string;       // Tenant/user scope
  duration?: number;      // ms
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, unknown>;
}
```

**Example Usage**:
```typescript
// Good
logger.info('Subscription created', {
  module: 'billing',
  operation: 'createSubscription',
  scopeId: tenant.id,
  duration: 150,
  metadata: { planId: 'pro', amount: 99 }
});

// Bad - missing context
logger.info('Subscription created');
```

**Checklist**:
- [ ] Define `LogEntry` interface
- [ ] Create helper for consistent log entries
- [ ] Update high-traffic logs to use standard format
- [ ] Document log format standards

---

### 3. Add Request Tracing

**Implement request ID propagation**:

```typescript
// packages/foundation/gateway/src/middleware/tracing.ts

import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
  requestId: string;
  startTime: number;
  scopeId?: string;
}

const requestStorage = new AsyncLocalStorage<RequestContext>();

export function tracingMiddleware(req: Request, next: NextFunction) {
  const requestId = req.headers['x-request-id'] ?? generateRequestId();
  const context: RequestContext = {
    requestId,
    startTime: Date.now(),
    scopeId: extractScopeId(req),
  };

  return requestStorage.run(context, () => {
    // Add to response headers
    const response = next();
    response.headers.set('x-request-id', requestId);
    return response;
  });
}

export function getRequestContext(): RequestContext | undefined {
  return requestStorage.getStore();
}

export function getRequestId(): string {
  return getRequestContext()?.requestId ?? 'no-request';
}
```

**Checklist**:
- [ ] Create `tracingMiddleware`
- [ ] Add to gateway middleware chain
- [ ] Export `getRequestId()` from kernel
- [ ] Update loggers to include request ID

---

### 4. Add Adapter Metrics

**Track adapter performance**:

```typescript
// packages/foundation/kernel/src/metrics/adapter-metrics.ts

interface AdapterMetrics {
  name: string;
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
  retryCount?: number;
  circuitBreakerState?: 'closed' | 'open' | 'half-open';
}

const metricsCollector = new MetricsCollector();

export function recordAdapterMetric(metric: AdapterMetrics): void {
  metricsCollector.record({
    type: 'adapter',
    ...metric,
    timestamp: Date.now(),
  });

  // Also log for debugging
  if (!metric.success) {
    logger.warn('Adapter operation failed', {
      adapter: metric.name,
      operation: metric.operation,
      duration: metric.duration,
      error: metric.error,
    });
  }
}

// Update createResilientAdapter to record metrics
export function createResilientAdapter<T>(name: string, adapter: T, config?: ResilienceConfig): T {
  return new Proxy(adapter, {
    get(target, prop) {
      const original = target[prop];
      if (typeof original !== 'function') return original;

      return async (...args: unknown[]) => {
        const start = Date.now();
        try {
          const result = await original.apply(target, args);
          recordAdapterMetric({
            name,
            operation: String(prop),
            duration: Date.now() - start,
            success: true,
          });
          return result;
        } catch (error) {
          recordAdapterMetric({
            name,
            operation: String(prop),
            duration: Date.now() - start,
            success: false,
            error: error.message,
          });
          throw error;
        }
      };
    },
  });
}
```

**Checklist**:
- [ ] Create metrics collector
- [ ] Update `createResilientAdapter` to record metrics
- [ ] Add dashboard/export for metrics
- [ ] Set up alerts for high error rates

---

### 5. Add Health Check Endpoint

```typescript
// packages/foundation/gateway/src/routes/health.ts

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    duration: number;
    message?: string;
  }[];
}

export async function healthCheck(): Promise<HealthStatus> {
  const checks = await Promise.all([
    checkDatabase(),
    checkCache(),
    checkExternalServices(),
  ]);

  const hasFailure = checks.some(c => c.status === 'fail');
  const hasWarning = checks.some(c => c.status === 'warn');

  return {
    status: hasFailure ? 'unhealthy' : hasWarning ? 'degraded' : 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? 'unknown',
    checks,
  };
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await db.command({ ping: 1 });
    return { name: 'database', status: 'pass', duration: Date.now() - start };
  } catch (error) {
    return {
      name: 'database',
      status: 'fail',
      duration: Date.now() - start,
      message: error.message,
    };
  }
}
```

**Checklist**:
- [ ] Create `/health` endpoint
- [ ] Add checks for: database, cache, critical adapters
- [ ] Return structured health status
- [ ] Set up monitoring to poll health endpoint

---

### 6. Error Tracking Integration

```typescript
// packages/foundation/kernel/src/errors/tracker.ts

export interface ErrorTracker {
  captureException(error: Error, context?: Record<string, unknown>): void;
  captureMessage(message: string, level: 'info' | 'warning' | 'error'): void;
  setUser(user: { id: string; email?: string }): void;
  setTag(key: string, value: string): void;
}

let errorTracker: ErrorTracker | null = null;

export function setErrorTracker(tracker: ErrorTracker): void {
  errorTracker = tracker;
}

export function getErrorTracker(): ErrorTracker {
  if (!errorTracker) {
    // Return no-op tracker if not configured
    return {
      captureException: () => {},
      captureMessage: () => {},
      setUser: () => {},
      setTag: () => {},
    };
  }
  return errorTracker;
}

// Usage in error handling
export function handleError(error: Error, context?: Record<string, unknown>): void {
  const tracker = getErrorTracker();
  const requestId = getRequestId();

  tracker.captureException(error, {
    requestId,
    ...context,
  });

  logger.error('Unhandled error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    requestId,
    ...context,
  });
}
```

**Checklist**:
- [ ] Create `ErrorTracker` interface
- [ ] Create adapters for Sentry/other services
- [ ] Wire into global error handler
- [ ] Add context (request ID, user, scope)

---

## Verification

```bash
# Start app
pnpm dev

# Check health endpoint
curl http://localhost:3000/health

# Make some requests, verify logs have:
# - Consistent format
# - Request IDs
# - Timing information

# Check metrics are being recorded
# (depends on your metrics backend)
```

---

## Success Criteria

Phase 4 is complete when:

1. Logger config centralized
2. All logs follow standard format
3. Request IDs propagate through stack
4. Adapter metrics recorded
5. Health endpoint returns status
6. Error tracking integrated
7. Can trace a request end-to-end

---

## Next Phase

After Phase 4 is complete, proceed to **[PHASE-5-TESTING.md](./PHASE-5-TESTING.md)** for test coverage.

---

> **Last Updated**: 2025-01-15
