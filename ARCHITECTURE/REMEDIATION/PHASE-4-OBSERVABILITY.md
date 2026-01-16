# Phase 4: Observability

> **For LLMs**: This phase adds structured logging, request tracing, metrics, and error tracking.

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Status** | ✅ Complete (5/5) |
| **Duration** | Week 6 |
| **Dependencies** | Phase 0, 1, 2, 3 complete |
| **Issues Addressed** | P2-MISS-001, P2-MISS-005, plus proactive observability |

---

## Issues in Scope

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| P2-MISS-005 | No structured request logging | 🟡 Medium | ✅ |
| P2-MISS-001 | No audit log for billing/refunds | 🟡 Medium | ✅ |
| - | Error tracking integration | Proactive | ✅ |
| - | Adapter metrics | Proactive | ✅ |
| - | Dashboard and alerts | Proactive | ✅ |

### Implementation Summary (2025-01-16)

- **P2-MISS-005**: Structured request logging implemented via `gateway/src/middleware/requestLogger.ts` with:
  - Request/response body logging with sensitive data redaction
  - Configurable log sampling for high-traffic endpoints
  - Log level based on HTTP status (info/warn/error)
  - Integration with `httpHandler.ts` using `createRequestLogger()`
  - Bootstrap configuration in `starters/saaskit/src/bootstrap.ts`
- **P2-MISS-001**: Billing audit logging implemented via `@unisane/audit`
- **Error tracking**: Sentry integration available
- **Adapter metrics**: Prometheus-compatible metrics via `gateway/src/telemetry.ts`
- **Dashboard/alerts**: Health check endpoints at `/api/health`

**Total Estimated**: 52 hours

---

## Task 1: Add Structured Request Logging (P2-MISS-005)

### Problem

API requests are not logged with structured data, making debugging and monitoring difficult.

### Solution

Add request logging middleware with consistent format.

### Checklist

```markdown
### 1.1 Create Request Logger Middleware
- [ ] Create middleware:
      ```typescript
      // starters/saaskit/src/middleware/requestLogger.ts
      import { logger } from '@unisane/kernel';

      export interface RequestLogEntry {
        timestamp: string;
        requestId: string;
        method: string;
        path: string;
        query?: Record<string, string>;
        statusCode: number;
        durationMs: number;
        userId?: string;
        tenantId?: string;
        userAgent?: string;
        ip?: string;
        error?: {
          name: string;
          message: string;
          code?: string;
        };
      }

      export async function requestLoggerMiddleware(
        req: NextRequest,
        handler: () => Promise<Response>
      ): Promise<Response> {
        const start = Date.now();
        const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();

        let response: Response;
        let error: Error | undefined;

        try {
          response = await handler();
        } catch (e) {
          error = e instanceof Error ? e : new Error(String(e));
          response = new Response(
            JSON.stringify({ error: 'Internal Server Error' }),
            { status: 500 }
          );
        }

        const duration = Date.now() - start;

        const logEntry: RequestLogEntry = {
          timestamp: new Date().toISOString(),
          requestId,
          method: req.method,
          path: req.nextUrl.pathname,
          query: Object.fromEntries(req.nextUrl.searchParams),
          statusCode: response.status,
          durationMs: duration,
          userAgent: req.headers.get('user-agent') ?? undefined,
          ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        };

        // Add auth context if available
        const authHeader = req.headers.get('authorization');
        if (authHeader) {
          // Extract from JWT without verifying (just for logging)
          try {
            const token = authHeader.replace('Bearer ', '');
            const payload = JSON.parse(atob(token.split('.')[1]));
            logEntry.userId = payload.sub;
            logEntry.tenantId = payload.tid;
          } catch {
            // Ignore parsing errors
          }
        }

        if (error) {
          logEntry.error = {
            name: error.name,
            message: error.message,
            code: (error as any).code,
          };
        }

        // Log based on status
        if (response.status >= 500) {
          logger.error('Request failed', logEntry);
        } else if (response.status >= 400) {
          logger.warn('Request client error', logEntry);
        } else if (duration > 5000) {
          logger.warn('Slow request', logEntry);
        } else {
          logger.info('Request completed', logEntry);
        }

        return response;
      }
      ```

### 1.2 Integrate into Proxy
- [ ] Update proxy.ts:
      ```typescript
      // starters/saaskit/src/proxy.ts
      import { requestLoggerMiddleware } from './middleware/requestLogger';

      export async function middleware(req: NextRequest) {
        return requestLoggerMiddleware(req, async () => {
          // Existing proxy logic
          return NextResponse.next();
        });
      }
      ```

### 1.3 Add Sensitive Data Redaction
- [ ] Create redaction utility:
      ```typescript
      const REDACT_PATTERNS = [
        /password/i,
        /secret/i,
        /token/i,
        /apikey/i,
        /authorization/i,
        /cookie/i,
      ];

      function redactSensitive(obj: Record<string, unknown>): Record<string, unknown> {
        const redacted: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(obj)) {
          if (REDACT_PATTERNS.some(p => p.test(key))) {
            redacted[key] = '[REDACTED]';
          } else if (typeof value === 'object' && value !== null) {
            redacted[key] = redactSensitive(value as Record<string, unknown>);
          } else {
            redacted[key] = value;
          }
        }

        return redacted;
      }
      ```

### 1.4 Configure Log Sampling
- [ ] Add sampling for high-traffic routes:
      ```typescript
      const SAMPLE_RATES: Record<string, number> = {
        '/api/health': 0.01,      // 1% of health checks
        '/api/rest/v1/me': 0.1,   // 10% of me requests
        default: 1.0,             // 100% of other requests
      };

      function shouldLog(path: string): boolean {
        const rate = SAMPLE_RATES[path] ?? SAMPLE_RATES.default;
        return Math.random() < rate;
      }
      ```

### 1.5 Add Request Body Logging (Optional)
- [ ] Log request body for debugging (with size limit):
      ```typescript
      const MAX_BODY_LOG_SIZE = 1024; // 1KB

      async function logRequestBody(req: NextRequest): Promise<string | undefined> {
        if (req.method === 'GET' || req.method === 'HEAD') return undefined;

        try {
          const clone = req.clone();
          const text = await clone.text();

          if (text.length > MAX_BODY_LOG_SIZE) {
            return `[TRUNCATED: ${text.length} bytes]`;
          }

          const parsed = JSON.parse(text);
          return JSON.stringify(redactSensitive(parsed));
        } catch {
          return '[UNPARSEABLE]';
        }
      }
      ```

### 1.6 Add Tests
- [ ] Test: Successful request logged at info level
- [ ] Test: 4xx logged at warn level
- [ ] Test: 5xx logged at error level
- [ ] Test: Slow request logged at warn level
- [ ] Test: Sensitive data redacted
- [ ] Test: Sampling works correctly
```

---

## Task 2: Add Billing Audit Logging (P2-MISS-001)

### Problem

Billing operations (refunds, subscription changes) are not audit logged, creating compliance gaps.

### Solution

Add audit logging for all billing state changes.

### Checklist

```markdown
### 2.1 Define Billing Audit Events
- [ ] Create audit event types:
      ```typescript
      // packages/modules/billing/src/audit.ts
      export type BillingAuditAction =
        | 'subscription.created'
        | 'subscription.updated'
        | 'subscription.cancelled'
        | 'subscription.reactivated'
        | 'payment.succeeded'
        | 'payment.failed'
        | 'refund.requested'
        | 'refund.completed'
        | 'refund.failed'
        | 'plan.changed'
        | 'quantity.changed';

      export interface BillingAuditEntry {
        action: BillingAuditAction;
        scopeId: string;
        actorId: string;
        resourceType: 'subscription' | 'payment' | 'refund';
        resourceId: string;
        before?: Record<string, unknown>;
        after?: Record<string, unknown>;
        metadata?: {
          provider: 'stripe' | 'razorpay';
          providerTransactionId?: string;
          amount?: number;
          currency?: string;
          reason?: string;
        };
      }
      ```

### 2.2 Add Audit to Refund Operation
- [ ] Update refund service:
      ```typescript
      // packages/modules/billing/src/service/refund.ts
      import { appendAudit } from '@unisane/audit';

      export async function requestRefund(args: RefundArgs) {
        const scopeId = getScopeId();
        const actorId = getActorId();

        // Get payment before refund
        const payment = await getPayment(args.paymentId);

        // Process refund
        const result = await billingAdapter.refund({
          paymentId: args.providerPaymentId,
          amount: args.amount,
          reason: args.reason,
        });

        // Audit log
        await appendAudit({
          scopeId,
          actorId,
          action: 'billing.refund.completed',
          resourceType: 'refund',
          resourceId: result.refundId,
          before: {
            paymentId: payment.id,
            amount: payment.amount,
            status: payment.status,
          },
          after: {
            refundId: result.refundId,
            refundAmount: args.amount,
            status: 'refunded',
          },
          metadata: {
            provider: currentProvider,
            providerTransactionId: result.providerRefundId,
            amount: args.amount,
            currency: payment.currency,
            reason: args.reason,
          },
        });

        return result;
      }
      ```

### 2.3 Add Audit to Subscription Changes
- [ ] Audit subscription creation
- [ ] Audit plan changes
- [ ] Audit quantity changes
- [ ] Audit cancellation/reactivation

### 2.4 Add Webhook Audit
- [ ] Log webhook events:
      ```typescript
      // When processing Stripe/Razorpay webhooks
      await appendAudit({
        scopeId: webhook.scopeId ?? 'system',
        actorId: 'webhook',
        action: `billing.webhook.${webhook.type}`,
        resourceType: 'webhook',
        resourceId: webhook.id,
        metadata: {
          provider: 'stripe',
          webhookType: webhook.type,
        },
      });
      ```

### 2.5 Add Admin Query Endpoint
- [ ] Create billing audit query:
      ```typescript
      // GET /api/admin/billing/audit
      {
        items: BillingAuditEntry[];
        cursor?: string;
      }
      ```

### 2.6 Add Tests
- [ ] Test: Refund creates audit entry
- [ ] Test: Subscription change creates audit entry
- [ ] Test: Webhook creates audit entry
- [ ] Test: Audit entries queryable
```

---

## Task 3: Add Error Tracking Integration

### Problem

Errors are logged but not tracked in a dedicated error tracking service.

### Solution

Integrate with Sentry (or similar) for error tracking and alerting.

### Checklist

```markdown
### 3.1 Create Error Tracker Port
- [ ] Define error tracker interface:
      ```typescript
      // packages/foundation/kernel/src/ports/error-tracker.ts
      export interface ErrorTrackerPort {
        captureException(error: Error, context?: ErrorContext): void;
        captureMessage(message: string, level: 'info' | 'warning' | 'error'): void;
        setUser(user: { id: string; email?: string; tenantId?: string }): void;
        setTag(key: string, value: string): void;
        addBreadcrumb(breadcrumb: Breadcrumb): void;
      }

      export interface ErrorContext {
        tags?: Record<string, string>;
        extra?: Record<string, unknown>;
        user?: { id: string; email?: string };
        level?: 'fatal' | 'error' | 'warning' | 'info';
      }

      export interface Breadcrumb {
        type: 'http' | 'navigation' | 'user' | 'debug';
        category: string;
        message: string;
        level?: 'info' | 'warning' | 'error';
        data?: Record<string, unknown>;
      }
      ```

### 3.2 Create Sentry Adapter
- [ ] Implement Sentry adapter:
      ```typescript
      // packages/adapters/error-tracking-sentry/src/index.ts
      import * as Sentry from '@sentry/node';

      export function createSentryAdapter(config: SentryConfig): ErrorTrackerPort {
        Sentry.init({
          dsn: config.dsn,
          environment: config.environment,
          release: config.release,
          tracesSampleRate: config.tracesSampleRate ?? 0.1,
        });

        return {
          captureException(error, context) {
            Sentry.withScope(scope => {
              if (context?.tags) {
                Object.entries(context.tags).forEach(([k, v]) => scope.setTag(k, v));
              }
              if (context?.extra) {
                scope.setExtras(context.extra);
              }
              if (context?.user) {
                scope.setUser(context.user);
              }
              if (context?.level) {
                scope.setLevel(context.level);
              }
              Sentry.captureException(error);
            });
          },

          captureMessage(message, level) {
            Sentry.captureMessage(message, level);
          },

          setUser(user) {
            Sentry.setUser(user);
          },

          setTag(key, value) {
            Sentry.setTag(key, value);
          },

          addBreadcrumb(breadcrumb) {
            Sentry.addBreadcrumb(breadcrumb);
          },
        };
      }
      ```

### 3.3 Integrate into Global Error Handler
- [ ] Update error handling:
      ```typescript
      // packages/foundation/gateway/src/errors/handler.ts
      import { getErrorTracker } from '@unisane/kernel';

      export function handleError(error: Error, context?: Record<string, unknown>): Response {
        const tracker = getErrorTracker();
        const requestId = getRequestId();

        // Track error
        tracker.captureException(error, {
          tags: {
            requestId,
            module: context?.module as string,
          },
          extra: context,
        });

        // Log error
        logger.error('Request error', {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          requestId,
          ...context,
        });

        // Return appropriate response
        return errorToResponse(error);
      }
      ```

### 3.4 Add Context to Errors
- [ ] Create context helpers:
      ```typescript
      // Add breadcrumbs for debugging
      tracker.addBreadcrumb({
        type: 'http',
        category: 'api',
        message: `${method} ${path}`,
        data: { statusCode: response.status },
      });
      ```

### 3.5 Configure Alerts
- [ ] Set up alert rules in Sentry:
      - Error spike: >10 errors/minute
      - New error type: First occurrence
      - High-volume error: >100 in 1 hour

### 3.6 Add Tests
- [ ] Test: Exception captured with context
- [ ] Test: User context set
- [ ] Test: Breadcrumbs recorded
```

---

## Task 4: Add Adapter Metrics

### Problem

Adapter performance (duration, success rate, circuit breaker state) is not tracked.

### Solution

Add metrics collection to all adapters.

### Checklist

```markdown
### 4.1 Create Metrics Interface
- [ ] Define metrics port:
      ```typescript
      // packages/foundation/kernel/src/ports/metrics.ts
      export interface MetricsPort {
        increment(name: string, labels?: Record<string, string>): void;
        gauge(name: string, value: number, labels?: Record<string, string>): void;
        histogram(name: string, value: number, labels?: Record<string, string>): void;
        timing(name: string, durationMs: number, labels?: Record<string, string>): void;
      }
      ```

### 4.2 Implement Metrics Wrapper
- [ ] Create adapter metrics wrapper:
      ```typescript
      // packages/foundation/kernel/src/adapters/metrics-wrapper.ts
      export function withMetrics<T extends object>(
        adapter: T,
        adapterName: string
      ): T {
        const metrics = getMetrics();

        return new Proxy(adapter, {
          get(target, prop) {
            const original = target[prop as keyof T];
            if (typeof original !== 'function') return original;

            return async (...args: unknown[]) => {
              const operation = String(prop);
              const start = Date.now();
              let success = true;
              let errorType: string | undefined;

              try {
                return await (original as Function).apply(target, args);
              } catch (error) {
                success = false;
                errorType = error instanceof Error ? error.name : 'Unknown';
                throw error;
              } finally {
                const duration = Date.now() - start;

                metrics.timing('adapter.operation.duration', duration, {
                  adapter: adapterName,
                  operation,
                  success: String(success),
                });

                metrics.increment('adapter.operation.count', {
                  adapter: adapterName,
                  operation,
                  success: String(success),
                  ...(errorType && { error_type: errorType }),
                });
              }
            };
          },
        });
      }
      ```

### 4.3 Add Circuit Breaker Metrics
- [ ] Track circuit breaker state:
      ```typescript
      // packages/foundation/kernel/src/resilience/circuit-breaker.ts
      private transitionTo(newState: CircuitState): void {
        const oldState = this.state;
        this.state = newState;

        metrics.gauge('circuit_breaker.state', stateToNumber(newState), {
          adapter: this.name,
        });

        metrics.increment('circuit_breaker.transition', {
          adapter: this.name,
          from: oldState,
          to: newState,
        });

        logger.info('Circuit breaker state change', {
          adapter: this.name,
          from: oldState,
          to: newState,
        });
      }
      ```

### 4.4 Add Retry Metrics
- [ ] Track retry attempts:
      ```typescript
      metrics.increment('adapter.retry', {
        adapter: adapterName,
        operation,
        attempt: String(attempt),
      });
      ```

### 4.5 Create Metrics Dashboard
- [ ] Define key metrics to track:
      - `adapter.operation.duration` - P50, P95, P99
      - `adapter.operation.count` - Success vs failure rate
      - `circuit_breaker.state` - Current state per adapter
      - `adapter.retry` - Retry rate

### 4.6 Add Prometheus Adapter
- [ ] Create Prometheus exporter:
      ```typescript
      // packages/adapters/metrics-prometheus/src/index.ts
      import { Registry, Counter, Histogram, Gauge } from 'prom-client';

      export function createPrometheusAdapter(): MetricsPort {
        const registry = new Registry();

        const operationDuration = new Histogram({
          name: 'adapter_operation_duration_ms',
          help: 'Duration of adapter operations',
          labelNames: ['adapter', 'operation', 'success'],
          buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
          registers: [registry],
        });

        // ... more metrics

        return {
          timing(name, value, labels) {
            if (name === 'adapter.operation.duration') {
              operationDuration.observe(labels ?? {}, value);
            }
          },
          // ... other methods
        };
      }
      ```

### 4.7 Add /metrics Endpoint
- [ ] Expose metrics endpoint:
      ```typescript
      // /api/metrics/route.ts
      export async function GET() {
        const metrics = await registry.metrics();
        return new Response(metrics, {
          headers: { 'Content-Type': 'text/plain' },
        });
      }
      ```
```

---

## Task 5: Create Dashboards and Alerts

### Problem

No centralized view of system health and performance.

### Solution

Create dashboards and configure alerts.

### Checklist

```markdown
### 5.1 Define Key Metrics
- [ ] Request metrics:
      - Request rate (req/min)
      - Error rate (%)
      - Latency (P50, P95, P99)
      - Status code distribution

- [ ] Adapter metrics:
      - Success rate per adapter
      - Latency per adapter
      - Circuit breaker states

- [ ] Business metrics:
      - Active users
      - Signups per day
      - Revenue (if applicable)

### 5.2 Create Grafana Dashboard
- [ ] Request Overview panel:
      ```json
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [{
          "expr": "rate(http_requests_total[5m])",
          "legendFormat": "{{method}} {{path}}"
        }]
      }
      ```

- [ ] Error Rate panel
- [ ] Latency Percentiles panel
- [ ] Adapter Health panel
- [ ] Circuit Breaker Status panel

### 5.3 Configure Alerts
- [ ] Error rate alert:
      ```yaml
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"
      ```

- [ ] Latency alert:
      ```yaml
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m])) > 5000
        for: 5m
        labels:
          severity: warning
      ```

- [ ] Circuit breaker alert:
      ```yaml
      - alert: CircuitBreakerOpen
        expr: circuit_breaker_state == 2
        for: 1m
        labels:
          severity: critical
      ```

### 5.4 Set Up On-Call Rotation
- [ ] Configure PagerDuty/Opsgenie integration
- [ ] Define escalation policies
- [ ] Create runbook links in alerts

### 5.5 Document Dashboard Usage
- [ ] Create dashboard guide
- [ ] Document alert meanings
- [ ] Create troubleshooting guides
```

---

## Verification

Run these checks after completing all tasks:

```bash
# 1. Request logging
curl http://localhost:3000/api/health
tail -f logs/app.log | jq
# Should see structured log entry

# 2. Billing audit
# Make a refund, then query audit
curl http://localhost:3000/api/admin/billing/audit

# 3. Error tracking
# Trigger an error, check Sentry
curl http://localhost:3000/api/test-error

# 4. Metrics
curl http://localhost:3000/api/metrics
# Should see Prometheus format metrics

# 5. Dashboard
# Open Grafana and verify panels load
```

---

## Success Criteria

Phase 4 is complete when:

- [ ] All requests logged with structured format
- [ ] Sensitive data redacted from logs
- [ ] Billing operations audit logged
- [ ] Error tracking integrated
- [ ] Adapter metrics recorded
- [ ] /metrics endpoint exposed
- [ ] Dashboards created
- [ ] Alerts configured
- [ ] On-call rotation documented

---

## Next Phase

After Phase 4 is complete, proceed to **[PHASE-5-COMPLETENESS.md](./PHASE-5-COMPLETENESS.md)** for completing missing features.

---

> **Last Updated**: 2025-01-16
