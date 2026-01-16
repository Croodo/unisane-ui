# Phase 2: Reliability

> **For LLMs**: This phase addresses reliability issues including timeouts, logging, memory leaks, and rate limiting.

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Status** | 🔴 Not Started |
| **Duration** | Week 3-4 |
| **Dependencies** | Phase 0, Phase 1 complete |
| **Issues Addressed** | P1-REL-*, P1-VAL-004, P1-BUG-004, P1-MISS-001 |

---

## Issues in Scope

| ID | Issue | Severity | Est. Hours |
|----|-------|----------|------------|
| P1-REL-001 | No request timeout protection | 🟠 High | 16h |
| P1-REL-002 | 49 console.log in production | 🟠 High | 8h |
| P1-REL-003 | Memory leaks in timers | 🟠 High | 4h |
| P1-REL-004 | Missing rate limits on expensive ops | 🟠 High | 8h |
| P1-VAL-004 | No env validation in bootstrap | 🟠 High | 4h |
| P1-BUG-004 | Leaky Promise.race in Resend | 🟠 High | 2h |
| P1-MISS-001 | Missing storage quota check | 🟠 High | 8h |

**Total Estimated**: 50 hours

---

## Task 1: Add Request Timeout Protection (P1-REL-001)

### Problem

External calls (database, adapters, third-party APIs) have no timeout protection. A slow or unresponsive service can cause requests to hang indefinitely.

### Solution

Implement `withTimeout()` utility using AbortController and apply to all external calls.

### Checklist

```markdown
### 1.1 Create Timeout Utility
- [ ] Create withTimeout function:
      ```typescript
      // packages/foundation/kernel/src/utils/timeout.ts
      export interface TimeoutOptions {
        timeoutMs: number;
        operation?: string;
      }

      export class TimeoutError extends Error {
        constructor(operation: string, timeoutMs: number) {
          super(`Operation "${operation}" timed out after ${timeoutMs}ms`);
          this.name = 'TimeoutError';
        }
      }

      export async function withTimeout<T>(
        promise: Promise<T>,
        options: TimeoutOptions
      ): Promise<T> {
        const { timeoutMs, operation = 'unknown' } = options;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const result = await Promise.race([
            promise,
            new Promise<never>((_, reject) => {
              controller.signal.addEventListener('abort', () => {
                reject(new TimeoutError(operation, timeoutMs));
              });
            }),
          ]);
          return result;
        } finally {
          clearTimeout(timeoutId);
        }
      }
      ```

### 1.2 Create AbortController-aware Fetch Wrapper
- [ ] Create fetch wrapper:
      ```typescript
      // packages/foundation/kernel/src/utils/fetch.ts
      export async function fetchWithTimeout(
        url: string,
        options: RequestInit & { timeoutMs?: number } = {}
      ): Promise<Response> {
        const { timeoutMs = 30000, ...fetchOptions } = options;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
          return await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }
      }
      ```

### 1.3 Apply to Database Operations
- [ ] Update MongoDB connection:
      ```typescript
      // packages/adapters/database-mongodb/src/index.ts
      async healthCheck(): Promise<boolean> {
        return withTimeout(
          this.db.command({ ping: 1 }).then(() => true),
          { timeoutMs: 5000, operation: 'database.healthCheck' }
        );
      }
      ```
- [ ] Update repository base methods with timeout

### 1.4 Apply to All Adapters
- [ ] Stripe adapter: Add timeout to all API calls
- [ ] Razorpay adapter: Add timeout to all API calls
- [ ] Email adapters: Add timeout to send operations
- [ ] Storage adapters: Add timeout to upload/download
- [ ] Jobs adapter: Add timeout to job dispatch

### 1.5 Configure Default Timeouts
- [ ] Create timeout configuration:
      ```typescript
      // packages/foundation/kernel/src/config/timeouts.ts
      export const DEFAULT_TIMEOUTS = {
        database: {
          query: 30_000,      // 30s
          healthCheck: 5_000, // 5s
        },
        adapters: {
          billing: 10_000,    // 10s
          email: 10_000,      // 10s
          storage: 60_000,    // 60s (uploads can be slow)
          jobs: 5_000,        // 5s
        },
        external: {
          default: 30_000,    // 30s
        },
      } as const;
      ```
- [ ] Allow override via environment variables

### 1.6 Add Metrics
- [ ] Track timeout occurrences:
      ```typescript
      metrics.increment('timeout', {
        operation,
        adapter: adapterName,
      });
      ```

### 1.7 Add Tests
- [ ] Test: Operation completes before timeout
- [ ] Test: Operation times out and throws TimeoutError
- [ ] Test: Cleanup happens on timeout
- [ ] Test: Metrics recorded on timeout
```

---

## Task 2: Replace console.log with Logger (P1-REL-002)

### Problem

49 instances of `console.log/error` in production code bypass structured logging, making debugging and monitoring difficult.

### Solution

Replace all console usage with the kernel logger.

### Checklist

```markdown
### 2.1 Audit Console Usage
- [ ] Find all instances:
      ```bash
      grep -rn "console\.\(log\|error\|warn\|info\|debug\)" packages/ --include="*.ts" > console-usage.txt
      ```
- [ ] Categorize by module:
      - Foundation/kernel: X instances
      - Foundation/gateway: X instances
      - Adapters: X instances
      - Modules: X instances
      - Devtools: X instances (may keep for CLI output)

### 2.2 Create Logger Import Helper
- [ ] Ensure logger is easily importable:
      ```typescript
      // packages/foundation/kernel/src/index.ts
      export { logger } from './observability/logger';
      export type { LogContext } from './observability/logger';
      ```

### 2.3 Replace in Foundation Layer
- [ ] Replace in kernel/src/**:
      ```typescript
      // Before
      console.error('Cache error:', err);

      // After
      logger.error('Cache error', {
        module: 'cache',
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      ```

### 2.4 Replace in Adapters
- [ ] billing-stripe: Replace X instances
- [ ] billing-razorpay: Replace X instances
- [ ] storage-*: Replace X instances
- [ ] email-*: Replace X instances
- [ ] database-*: Replace X instances

### 2.5 Replace in Modules
- [ ] For each module, replace console with logger
- [ ] Include module name in log context

### 2.6 Keep CLI Output in Devtools
- [ ] Devtools CLI can use console for user output
- [ ] Use logger for internal operations/errors

### 2.7 Add ESLint Rule
- [ ] Add rule to prevent new console usage:
      ```javascript
      // .eslintrc.js
      rules: {
        'no-console': ['error', {
          allow: [] // No exceptions in packages/
        }],
      }
      ```
- [ ] Exclude devtools CLI from rule

### 2.8 Verification
- [ ] Run grep again - should be 0 (or only devtools CLI):
      ```bash
      grep -rn "console\." packages/ --include="*.ts" \
        --exclude-dir="devtools" | wc -l
      # Should be 0
      ```
```

---

## Task 3: Fix Timer Memory Leaks (P1-REL-003)

### Problem

`setInterval` and `setTimeout` in HealthMonitor and CircuitBreaker are not properly cleaned up on errors, causing memory leaks in long-running processes.

### Solution

Add proper cleanup with try/finally patterns.

### Checklist

```markdown
### 3.1 Fix HealthMonitor
- [ ] Add cleanup on error:
      ```typescript
      // packages/foundation/kernel/src/health/monitoring.ts
      export class HealthMonitor {
        private intervalId: NodeJS.Timeout | null = null;

        start(intervalMs: number = 30000): void {
          this.stop(); // Clear any existing interval

          this.intervalId = setInterval(async () => {
            try {
              await this.runChecks();
            } catch (error) {
              logger.error('Health check failed', { error });
              // Don't stop monitoring on single failure
            }
          }, intervalMs);
        }

        stop(): void {
          if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
          }
        }

        // Add cleanup on process exit
        registerCleanup(): void {
          process.on('SIGTERM', () => this.stop());
          process.on('SIGINT', () => this.stop());
        }
      }
      ```

### 3.2 Fix CircuitBreaker
- [ ] Add timeout cleanup:
      ```typescript
      // packages/foundation/kernel/src/resilience/circuit-breaker.ts
      private scheduleReset(): void {
        // Clear any existing timeout
        if (this.resetTimeoutId) {
          clearTimeout(this.resetTimeoutId);
        }

        this.resetTimeoutId = setTimeout(() => {
          this.halfOpen();
          this.resetTimeoutId = null;
        }, this.config.resetTimeout);
      }

      close(): void {
        this.state = 'closed';
        if (this.resetTimeoutId) {
          clearTimeout(this.resetTimeoutId);
          this.resetTimeoutId = null;
        }
      }
      ```

### 3.3 Audit All Timer Usage
- [ ] Find all setInterval/setTimeout:
      ```bash
      grep -rn "setInterval\|setTimeout" packages/ --include="*.ts"
      ```
- [ ] Verify each has corresponding clear*
- [ ] Add cleanup where missing

### 3.4 Add Disposable Pattern
- [ ] Consider using Disposable for cleanup:
      ```typescript
      interface Disposable {
        dispose(): void;
      }

      class HealthMonitor implements Disposable {
        dispose(): void {
          this.stop();
        }
      }
      ```

### 3.5 Add Tests
- [ ] Test: HealthMonitor.stop() clears interval
- [ ] Test: CircuitBreaker.close() clears timeout
- [ ] Test: Multiple start/stop cycles don't leak
```

---

## Task 4: Add Rate Limits to Expensive Operations (P1-REL-004)

### Problem

Resource-intensive operations (PDF generation, AI, file uploads) have no rate limiting, allowing DoS attacks.

### Solution

Add per-operation rate limits with user-based tracking.

### Checklist

```markdown
### 4.1 Identify Expensive Operations
- [ ] PDF generation: `/api/rest/v1/tenants/[tenantId]/pdf/render`
- [ ] AI generation: `/api/rest/v1/tenants/[tenantId]/ai/generate`
- [ ] File upload: `/api/rest/v1/tenants/[tenantId]/storage/upload`
- [ ] Bulk operations: Any batch endpoints
- [ ] Export: Data export endpoints

### 4.2 Define Rate Limits
- [ ] Create rate limit configuration:
      ```typescript
      // starters/saaskit/src/contracts/rate-limits.ts
      export const RATE_LIMITS = {
        'pdf.render': {
          window: 60_000,    // 1 minute
          maxRequests: 10,   // 10 per minute
          keyBy: 'user',     // Per user, not per IP
        },
        'ai.generate': {
          window: 60_000,
          maxRequests: 5,
          keyBy: 'user',
        },
        'storage.upload': {
          window: 3600_000,  // 1 hour
          maxBytes: 100 * 1024 * 1024, // 100MB
          keyBy: 'tenant',
        },
        'export.data': {
          window: 3600_000,
          maxRequests: 5,
          keyBy: 'tenant',
        },
      } as const;
      ```

### 4.3 Update Contract Metadata
- [ ] Add rateLimit to OpMeta:
      ```typescript
      // pdf.contract.ts
      export const pdfContract = c.router({
        render: withMeta({
          method: 'POST',
          path: '/api/rest/v1/tenants/:tenantId/pdf/render',
          // ...
        }, defineOpMeta({
          op: 'pdf.render',
          rateLimit: {
            key: 'pdf.render',
            cost: 1,
          },
          // ...
        })),
      });
      ```

### 4.4 Implement User-Based Rate Limiting
- [ ] Update rate limit middleware:
      ```typescript
      // packages/foundation/gateway/src/middleware/rateLimit.ts
      export async function checkRateLimit(
        key: string,
        config: RateLimitConfig,
        ctx: AuthContext
      ): Promise<RateLimitResult> {
        // Build rate limit key based on keyBy
        let rateLimitKey: string;
        switch (config.keyBy) {
          case 'user':
            rateLimitKey = `${key}:user:${ctx.userId}`;
            break;
          case 'tenant':
            rateLimitKey = `${key}:tenant:${ctx.tenantId}`;
            break;
          case 'ip':
          default:
            rateLimitKey = `${key}:ip:${ctx.ip}`;
        }

        const current = await kv.incr(rateLimitKey);
        if (current === 1) {
          await kv.expire(rateLimitKey, config.window / 1000);
        }

        const remaining = Math.max(0, config.maxRequests - current);

        return {
          success: current <= config.maxRequests,
          limit: config.maxRequests,
          remaining,
          reset: await kv.ttl(rateLimitKey),
        };
      }
      ```

### 4.5 Add Bandwidth Rate Limiting
- [ ] For storage uploads, track bytes:
      ```typescript
      export async function checkBandwidthLimit(
        key: string,
        bytes: number,
        config: BandwidthLimitConfig,
        ctx: AuthContext
      ): Promise<RateLimitResult> {
        const rateLimitKey = `${key}:bandwidth:${ctx.tenantId}`;

        const current = await kv.incrBy(rateLimitKey, bytes);
        if (current === bytes) {
          await kv.expire(rateLimitKey, config.window / 1000);
        }

        return {
          success: current <= config.maxBytes,
          limit: config.maxBytes,
          remaining: Math.max(0, config.maxBytes - current),
          reset: await kv.ttl(rateLimitKey),
        };
      }
      ```

### 4.6 Add Response Headers
- [ ] Include rate limit info in responses:
      ```typescript
      res.headers.set('X-RateLimit-Limit', result.limit.toString());
      res.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      res.headers.set('X-RateLimit-Reset', result.reset.toString());

      if (!result.success) {
        res.headers.set('Retry-After', result.reset.toString());
      }
      ```

### 4.7 Document Rate Limits
- [ ] Add to OpenAPI spec
- [ ] Create user-facing documentation
- [ ] Add to API reference

### 4.8 Add Tests
- [ ] Test: Under limit succeeds
- [ ] Test: At limit succeeds (edge case)
- [ ] Test: Over limit returns 429
- [ ] Test: Limit resets after window
- [ ] Test: Different users have separate limits
```

---

## Task 5: Add Environment Validation to Bootstrap (P1-VAL-004)

### Problem

**File**: `starters/saaskit/src/bootstrap.ts:199`

Bootstrap proceeds without validating environment variables, causing silent failures when providers aren't configured.

### Solution

Add explicit environment validation at bootstrap start.

### Checklist

```markdown
### 5.1 Create Validation Function
- [ ] Update env validation:
      ```typescript
      // starters/saaskit/src/platform/env.ts
      export function validateEnvOrThrow(): void {
        const result = validateEnv();

        if (!result.valid) {
          console.error('Environment validation failed:');
          result.errors.forEach(err => console.error(`  - ${err}`));
          process.exit(1);
        }

        if (result.warnings.length > 0) {
          console.warn('Environment warnings:');
          result.warnings.forEach(warn => console.warn(`  - ${warn}`));
        }
      }
      ```

### 5.2 Add Required Provider Checks
- [ ] Check email provider:
      ```typescript
      function validateEmailProvider(): string[] {
        const errors: string[] = [];
        const { MAIL_PROVIDER, RESEND_API_KEY, AWS_ACCESS_KEY_ID } = process.env;

        if (!MAIL_PROVIDER && !RESEND_API_KEY && !AWS_ACCESS_KEY_ID) {
          errors.push(
            'No email provider configured. Set MAIL_PROVIDER, RESEND_API_KEY, or AWS credentials.'
          );
        }

        return errors;
      }
      ```

### 5.3 Add Provider-Specific Validation
- [ ] Validate Stripe config if enabled:
      ```typescript
      function validateStripeConfig(): string[] {
        const errors: string[] = [];
        const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } = process.env;

        if (STRIPE_SECRET_KEY) {
          if (!STRIPE_SECRET_KEY.startsWith('sk_')) {
            errors.push('STRIPE_SECRET_KEY must start with sk_');
          }
          if (!STRIPE_WEBHOOK_SECRET) {
            errors.push('STRIPE_WEBHOOK_SECRET required when using Stripe');
          }
        }

        return errors;
      }
      ```

### 5.4 Call Validation in Bootstrap
- [ ] Update bootstrap.ts:
      ```typescript
      // starters/saaskit/src/bootstrap.ts
      export async function bootstrap(): Promise<void> {
        // Validate environment FIRST
        validateEnvOrThrow();

        // Then proceed with initialization
        await connectDb();
        // ...
      }
      ```

### 5.5 Add Development Defaults Warning
- [ ] Warn about development defaults in production:
      ```typescript
      if (process.env.NODE_ENV === 'production') {
        if (process.env.USE_MEMORY_STORE === 'true') {
          warnings.push('USE_MEMORY_STORE=true in production is not recommended');
        }
        if (!process.env.DATA_ENCRYPTION_KEY) {
          warnings.push('DATA_ENCRYPTION_KEY not set - PII will not be encrypted');
        }
      }
      ```

### 5.6 Add Tests
- [ ] Test: Valid env passes
- [ ] Test: Missing required var fails
- [ ] Test: Invalid format fails
- [ ] Test: Warnings logged but don't fail
```

---

## Task 6: Fix Promise.race Leak in Resend (P1-BUG-004)

### Problem

**File**: `packages/adapters/email-resend/src/index.ts:84-88`

```typescript
const result = await Promise.race([
  resend.emails.send(payload),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 10000)
  )  // Timer never cleared if send succeeds first!
]);
```

### Solution

Use AbortController for proper cleanup.

### Checklist

```markdown
### 6.1 Replace Promise.race with AbortController
- [ ] Update send function:
      ```typescript
      // packages/adapters/email-resend/src/index.ts
      async send(email: EmailMessage): Promise<EmailResult> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 10000);

        try {
          const result = await this.resend.emails.send({
            ...email,
            // Note: Resend SDK may not support AbortSignal directly
            // In that case, use Promise.race but with proper cleanup
          });

          return {
            success: true,
            messageId: result.id,
          };
        } catch (error) {
          if (controller.signal.aborted) {
            return {
              success: false,
              error: 'Email send timed out',
            };
          }
          throw error;
        } finally {
          clearTimeout(timeoutId);
        }
      }
      ```

### 6.2 Alternative: Proper Promise.race Cleanup
- [ ] If SDK doesn't support AbortController:
      ```typescript
      async send(email: EmailMessage): Promise<EmailResult> {
        let timeoutId: NodeJS.Timeout | null = null;

        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Email send timed out'));
          }, this.config.timeoutMs ?? 10000);
        });

        try {
          const result = await Promise.race([
            this.resend.emails.send(email),
            timeoutPromise,
          ]);

          return { success: true, messageId: result.id };
        } finally {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        }
      }
      ```

### 6.3 Add Tests
- [ ] Test: Successful send clears timeout
- [ ] Test: Timeout triggers and cleans up
- [ ] Test: Multiple rapid sends don't leak timers
```

---

## Task 7: Add Storage Quota Enforcement (P1-MISS-001)

### Problem

**File**: `packages/modules/storage/src/service/upload.ts`

File uploads don't check tenant storage quota, allowing unlimited storage consumption.

### Solution

Add quota check before accepting uploads.

### Checklist

```markdown
### 7.1 Define Quota Configuration
- [ ] Add quota to entitlements:
      ```typescript
      // packages/modules/billing/src/entitlements.ts
      export interface Entitlements {
        // ...existing
        storage: {
          maxBytes: number;      // Total storage limit
          maxFileSize: number;   // Per-file limit
          maxFiles: number;      // Total file count limit
        };
      }

      export const PLAN_STORAGE_LIMITS = {
        free: {
          maxBytes: 100 * 1024 * 1024,      // 100MB
          maxFileSize: 10 * 1024 * 1024,    // 10MB
          maxFiles: 100,
        },
        pro: {
          maxBytes: 10 * 1024 * 1024 * 1024, // 10GB
          maxFileSize: 100 * 1024 * 1024,    // 100MB
          maxFiles: 10000,
        },
        enterprise: {
          maxBytes: 100 * 1024 * 1024 * 1024, // 100GB
          maxFileSize: 1024 * 1024 * 1024,    // 1GB
          maxFiles: 100000,
        },
      };
      ```

### 7.2 Add Usage Tracking
- [ ] Create storage usage query:
      ```typescript
      // packages/modules/storage/src/service/usage.ts
      export async function getStorageUsage(scopeId: string): Promise<StorageUsage> {
        const result = await StorageRepo.aggregate([
          { $match: { scopeId, deletedAt: null, status: 'confirmed' } },
          {
            $group: {
              _id: null,
              totalBytes: { $sum: '$sizeBytes' },
              fileCount: { $sum: 1 },
            },
          },
        ]);

        return {
          totalBytes: result[0]?.totalBytes ?? 0,
          fileCount: result[0]?.fileCount ?? 0,
        };
      }
      ```

### 7.3 Add Quota Check to Upload
- [ ] Update requestUpload:
      ```typescript
      // packages/modules/storage/src/service/upload.ts
      export async function requestUpload(args: RequestUploadArgs) {
        const scopeId = getScopeId();

        // Get current usage and limits
        const [usage, entitlements] = await Promise.all([
          getStorageUsage(scopeId),
          resolveEntitlements(scopeId),
        ]);

        const limits = entitlements.storage;

        // Check per-file size limit
        if (args.input.sizeBytes > limits.maxFileSize) {
          throw ERR.validation(
            `File size ${formatBytes(args.input.sizeBytes)} exceeds limit of ${formatBytes(limits.maxFileSize)}`
          );
        }

        // Check total storage limit
        if (usage.totalBytes + args.input.sizeBytes > limits.maxBytes) {
          throw ERR.validation(
            `Storage quota exceeded. Used: ${formatBytes(usage.totalBytes)}, Limit: ${formatBytes(limits.maxBytes)}`
          );
        }

        // Check file count limit
        if (usage.fileCount >= limits.maxFiles) {
          throw ERR.validation(
            `File count limit exceeded. Current: ${usage.fileCount}, Limit: ${limits.maxFiles}`
          );
        }

        // Proceed with upload...
      }
      ```

### 7.4 Add Admin Override
- [ ] Allow admins to bypass quota:
      ```typescript
      if (args.bypassQuota && ctx.isSuperAdmin) {
        logger.warn('Storage quota bypassed by admin', {
          scopeId,
          adminId: ctx.userId,
          fileSize: args.input.sizeBytes,
        });
      } else {
        // Check quota
      }
      ```

### 7.5 Add Usage Endpoint
- [ ] Create endpoint to check usage:
      ```typescript
      // GET /api/rest/v1/tenants/:tenantId/storage/usage
      {
        totalBytes: number;
        fileCount: number;
        limits: {
          maxBytes: number;
          maxFileSize: number;
          maxFiles: number;
        };
        percentUsed: number;
      }
      ```

### 7.6 Add Tests
- [ ] Test: Upload under quota succeeds
- [ ] Test: Upload exceeding file size limit fails
- [ ] Test: Upload exceeding total quota fails
- [ ] Test: Upload exceeding file count fails
- [ ] Test: Admin bypass works
```

---

## Verification

Run these checks after completing all tasks:

```bash
# 1. Timeouts
npm run test:timeouts
# All external calls should have timeout protection

# 2. Console usage
grep -rn "console\." packages/ --include="*.ts" --exclude-dir="devtools" | wc -l
# Should be 0

# 3. Timer cleanup
npm run test:timers
# No memory leaks

# 4. Rate limits
curl -X POST /api/rest/v1/tenants/test/pdf/render
# Check X-RateLimit-* headers present

# 5. Environment validation
NODE_ENV=production npm run build
# Should validate required vars

# 6. Storage quota
npm run test:storage:quota
# Quota enforcement working
```

---

## Success Criteria

Phase 2 is complete when:

- [ ] All external calls have timeout protection
- [ ] No console.log in production code (except devtools CLI)
- [ ] No timer memory leaks
- [ ] Rate limits on PDF, AI, storage, export endpoints
- [ ] Rate limit headers in responses
- [ ] Bootstrap validates environment before starting
- [ ] Storage quota enforced per tenant
- [ ] All tests passing

---

## Next Phase

After Phase 2 is complete, proceed to **[PHASE-3-TYPESAFETY.md](./PHASE-3-TYPESAFETY.md)** for type safety improvements.

---

> **Last Updated**: 2025-01-16
