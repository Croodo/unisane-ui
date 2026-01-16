# Phase 1: Critical Bug Fixes

> **For LLMs**: This phase addresses critical business logic bugs and data integrity issues. Complete after Phase 0.

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Status** | 🔴 Not Started |
| **Duration** | Week 2 |
| **Dependencies** | Phase 0 (Security) complete |
| **Issues Addressed** | P0-BUG-001, P0-BUG-002, P1-SEC-002, P1-BUG-001, P1-BUG-003, P1-REL-005, P1-VAL-* |

---

## Issues in Scope

| ID | Issue | Severity | Est. Hours |
|----|-------|----------|------------|
| P0-BUG-001 | Credits consume idempotency bug | 🔴 Critical | 4h |
| P0-BUG-002 | Razorpay payment mode broken | 🔴 Critical | 8h |
| P1-SEC-002 | Permission cache silent failure | 🟠 High | 4h |
| P1-BUG-001 | Stripe error swallowing | 🟠 High | 2h |
| P1-BUG-003 | Usage increment allows negative | 🟠 High | 1h |
| P1-REL-005 | Devtools build failures ignored | 🟠 High | 4h |
| P1-VAL-001 | No Zod validation in Razorpay | 🟠 High | 3h |
| P1-VAL-002 | No Zod validation in GCS | 🟠 High | 2h |
| P1-VAL-003 | No Zod validation in local storage | 🟠 High | 2h |

**Total Estimated**: 30 hours

---

## Task 1: Fix Credits Consume Idempotency (P0-BUG-001)

### Problem

**File**: `packages/modules/credits/src/service/consume.ts:20`

```typescript
// BUG: Uses only 'reason' as idempotency key
const idemKey = args.reason;
```

This causes duplicate operations with the same reason to be incorrectly deduplicated:
- User calls `consume({amount: 100, reason: "api_call"})` at T=0
- User calls `consume({amount: 100, reason: "api_call"})` at T=1
- Second call is deduped - user only charged once for two operations!

### Solution

Include a unique identifier in the idempotency key.

### Checklist

```markdown
### 1.1 Update Idempotency Key Generation
- [ ] Modify consume function:
      ```typescript
      // packages/modules/credits/src/service/consume.ts
      export async function consume(args: ConsumeCreditsArgs) {
        const scopeId = getScopeId();
        const requestId = getRequestId(); // From scope context

        // Generate proper idempotency key
        const idemKey = args.idempotencyKey ?? `${args.reason}:${requestId}`;

        const lock = await redis.set(creditsKeys.idemLock(scopeId, idemKey), "1", {
          NX: true,
          PX: 10_000,
        });

        if (!lock) {
          return { ok: true as const, deduped: true as const };
        }

        // ... rest of implementation
      }
      ```

### 1.2 Update Args Type
- [ ] Add optional idempotencyKey to args:
      ```typescript
      interface ConsumeCreditsArgs {
        amount: number;
        reason: string;
        idempotencyKey?: string; // NEW: explicit key for deduplication
      }
      ```

### 1.3 Update Callers
- [ ] AI module should pass explicit key:
      ```typescript
      await consume({
        amount: tokens,
        reason: 'ai_generation',
        idempotencyKey: `ai:${generationId}`,
      });
      ```

### 1.4 Add Database Index
- [ ] Ensure unique index on idempotency key exists:
      ```typescript
      await db.collection('credit_transactions').createIndex(
        { scopeId: 1, idempotencyKey: 1 },
        { unique: true, sparse: true }
      );
      ```

### 1.5 Add Tests
- [ ] Test: Same reason with different requestId = two transactions
- [ ] Test: Same idempotencyKey = deduped correctly
- [ ] Test: Concurrent calls with same key = only one succeeds
- [ ] Test: Explicit idempotencyKey works

### 1.6 Documentation
- [ ] Document idempotency behavior
- [ ] Document when to use explicit idempotencyKey
```

---

## Task 2: Fix Razorpay Payment Mode (P0-BUG-002)

### Problem

**File**: `packages/adapters/billing-razorpay/src/index.ts:117`

The `createPaymentLink` requires an amount, but `createCheckoutSession` passes 0 for payment mode, causing Razorpay to reject the request.

### Solution

Either implement payment links correctly OR remove the dead code and document limitations.

### Checklist

```markdown
### 2.1 Assess Options
- [ ] Option A: Implement payment links properly
- [ ] Option B: Remove payment mode support, document subscription-only

### 2.2 Option A: Implement Payment Links
- [ ] Fix createCheckoutSession for payment mode:
      ```typescript
      async createCheckoutSession(args: CreateCheckoutArgs): Promise<CheckoutResult> {
        if (args.mode === 'payment') {
          if (!args.amount || args.amount <= 0) {
            throw new Error('Amount required for payment mode');
          }

          const link = await this.createPaymentLink({
            amount: args.amount,
            currency: args.currency ?? 'INR',
            description: args.description ?? 'One-time payment',
            customerId: args.customerId,
            callbackUrl: args.successUrl,
            metadata: args.metadata,
          });

          return {
            url: link.short_url,
            id: link.id,
          };
        }

        // Subscription mode...
      }
      ```

### 2.3 Option B: Remove Dead Code
- [ ] Remove payment mode handling:
      ```typescript
      async createCheckoutSession(args: CreateCheckoutArgs): Promise<CheckoutResult> {
        if (args.mode === 'payment') {
          throw new Error(
            'Razorpay adapter only supports subscription mode. ' +
            'Use Stripe for one-time payments.'
          );
        }

        // Subscription mode only...
      }
      ```
- [ ] Update documentation with limitations

### 2.4 Add Tests
- [ ] Test: Subscription mode works
- [ ] Test: Payment mode either works OR throws clear error
- [ ] Test: Invalid amount rejected

### 2.5 Update Contracts
- [ ] If removing payment mode, update billing contract:
      ```typescript
      // Mark Razorpay limitations
      const billingProviderCapabilities = {
        razorpay: {
          subscriptions: true,
          oneTimePayments: false, // NOT SUPPORTED
          refunds: true,
        },
        stripe: {
          subscriptions: true,
          oneTimePayments: true,
          refunds: true,
        },
      };
      ```
```

---

## Task 3: Fix Permission Cache Failure (P1-SEC-002)

### Problem

**File**: `packages/modules/identity/src/service/perms.ts:73-75`

```typescript
try {
  return JSON.parse(cached) as Permission[];
} catch {}  // Silent catch - could return stale/wrong permissions
```

Cache corruption or invalid JSON silently fails, potentially returning wrong permissions.

### Solution

Handle parse errors explicitly with cache invalidation and logging.

### Checklist

```markdown
### 3.1 Fix Error Handling
- [ ] Update permission cache read:
      ```typescript
      // packages/modules/identity/src/service/perms.ts
      export async function getCachedPermissions(scopeId: string, userId: string): Promise<Permission[] | null> {
        const cacheKey = permCacheKeyForUser(scopeId, userId);
        const cached = await kv.get(cacheKey);

        if (!cached) return null;

        try {
          return JSON.parse(cached) as Permission[];
        } catch (error) {
          // Log the error with context
          logger.error('Permission cache parse error', {
            scopeId,
            userId,
            cacheKey,
            error: error instanceof Error ? error.message : 'Unknown error',
            cachedValue: cached.slice(0, 100), // First 100 chars for debugging
          });

          // Increment metric for monitoring
          metrics.increment('permissions.cache.parse_error', { scopeId });

          // Invalidate the corrupted cache entry
          await kv.del(cacheKey);

          // Return null to force fresh fetch
          return null;
        }
      }
      ```

### 3.2 Add Validation
- [ ] Validate parsed permissions structure:
      ```typescript
      const ZPermission = z.object({
        resource: z.string(),
        action: z.string(),
        scope: z.enum(['own', 'all']).optional(),
      });

      const ZPermissions = z.array(ZPermission);

      // In getCachedPermissions:
      const parsed = JSON.parse(cached);
      const validated = ZPermissions.safeParse(parsed);

      if (!validated.success) {
        logger.error('Invalid permission structure in cache', {
          errors: validated.error.errors,
        });
        await kv.del(cacheKey);
        return null;
      }

      return validated.data;
      ```

### 3.3 Add Alerting
- [ ] Set up alert for cache parse errors > threshold
- [ ] Alert on sudden spike in cache misses (could indicate corruption)

### 3.4 Add Tests
- [ ] Test: Valid cache returns permissions
- [ ] Test: Invalid JSON triggers invalidation and fresh fetch
- [ ] Test: Invalid structure triggers invalidation
- [ ] Test: Metric incremented on error
```

---

## Task 4: Fix Stripe Error Swallowing (P1-BUG-001)

### Problem

**File**: `packages/adapters/billing-stripe/src/index.ts:166-173`

```typescript
try {
  // ... customer creation
} catch (err) {
  console.error('ensureCustomerId failed:', err);
  return null;  // Silently fails!
}
```

Customer creation failures are silently swallowed, causing subsequent operations to fail mysteriously.

### Solution

Propagate errors with proper context.

### Checklist

```markdown
### 4.1 Remove Silent Catch
- [ ] Update ensureCustomerId:
      ```typescript
      async ensureCustomerId(scopeId: string, email?: string): Promise<string | null> {
        try {
          // Check existing mapping
          const existing = await this.customerRepo.findByScopeId(scopeId);
          if (existing) return existing.stripeCustomerId;

          // Create new customer
          const customer = await this.stripe.customers.create({
            email,
            metadata: { scopeId },
          });

          await this.customerRepo.create({
            scopeId,
            stripeCustomerId: customer.id,
          });

          return customer.id;
        } catch (err) {
          // Log with context but DO NOT swallow
          logger.error('Failed to ensure Stripe customer', {
            scopeId,
            error: err instanceof Error ? err.message : 'Unknown error',
            stack: err instanceof Error ? err.stack : undefined,
          });

          // Re-throw with context
          throw new BillingError(
            'Failed to create or retrieve Stripe customer',
            { cause: err, scopeId }
          );
        }
      }
      ```

### 4.2 Update Callers
- [ ] Handle BillingError appropriately in callers
- [ ] Add retry logic where appropriate:
      ```typescript
      const customerId = await retry(
        () => adapter.ensureCustomerId(scopeId, email),
        { retries: 3, delay: 1000 }
      );
      ```

### 4.3 Add Tests
- [ ] Test: Customer creation success
- [ ] Test: API error propagates with context
- [ ] Test: Network error propagates
- [ ] Test: Retry works for transient errors
```

---

## Task 5: Fix Usage Increment Validation (P1-BUG-003)

### Problem

**File**: `packages/modules/usage/src/service/increment.ts:14`

```typescript
const n = args.n ?? 1;
await kv.incrBy(key, n, ttlMs);  // No validation n > 0
```

Negative values can decrement usage counters, allowing manipulation.

### Solution

Add input validation.

### Checklist

```markdown
### 5.1 Add Validation
- [ ] Update increment function:
      ```typescript
      export async function increment(args: IncrementUsageArgs) {
        const n = args.n ?? 1;

        // Validate increment value
        if (typeof n !== 'number' || !Number.isInteger(n)) {
          throw ERR.validation('Increment value must be an integer');
        }

        if (n <= 0) {
          throw ERR.validation('Increment value must be positive');
        }

        if (n > 1_000_000) {
          throw ERR.validation('Increment value too large');
        }

        // ... rest of implementation
      }
      ```

### 5.2 Add Decrement Function (if needed)
- [ ] If decrement is a valid use case, create explicit function:
      ```typescript
      export async function decrement(args: DecrementUsageArgs) {
        // Requires specific permission
        assertPermission(PERM.USAGE_ADMIN);

        const n = args.n ?? 1;
        if (n <= 0) throw ERR.validation('Decrement value must be positive');

        // ... implementation with audit logging
      }
      ```

### 5.3 Add Tests
- [ ] Test: Positive integer works
- [ ] Test: Zero throws validation error
- [ ] Test: Negative throws validation error
- [ ] Test: Non-integer throws validation error
- [ ] Test: Very large number throws validation error
```

---

## Task 6: Fix Devtools Build Error Handling (P1-REL-005)

### Problem

**File**: `packages/tooling/devtools/src/commands/routes/gen.ts:96-98`

```typescript
try {
  await buildContracts();
} catch (e) {
  logger.warn('Build failed, continuing with existing...');  // WRONG!
}
```

Build failures are ignored, causing code generation to use stale contracts.

### Solution

Fail hard on build errors, with optional override flag.

### Checklist

```markdown
### 6.1 Change Warn to Error
- [ ] Update error handling:
      ```typescript
      // packages/tooling/devtools/src/commands/routes/gen.ts
      try {
        await buildContracts();
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);

        if (options.ignoreBuildErrors) {
          logger.warn('Build failed but --ignore-build-errors set, continuing...', {
            error: errorMessage,
          });
        } else {
          logger.error('Contract build failed. Fix errors before generating routes.', {
            error: errorMessage,
          });
          logger.info('Run with --ignore-build-errors to override (not recommended)');
          process.exit(1);
        }
      }
      ```

### 6.2 Add CLI Flag
- [ ] Add --ignore-build-errors flag:
      ```typescript
      // In CLI command definition
      .option('--ignore-build-errors', 'Continue generation even if contract build fails')
      ```

### 6.3 Update CI/CD
- [ ] Ensure CI runs without --ignore-build-errors
- [ ] Add pre-commit hook to check contract build

### 6.4 Add Tests
- [ ] Test: Build failure exits with code 1
- [ ] Test: --ignore-build-errors continues with warning
- [ ] Test: Successful build continues normally
```

---

## Task 7: Add Zod Validation to Adapters (P1-VAL-001, P1-VAL-002, P1-VAL-003)

### Problem

Multiple adapters accept configuration without validation, allowing invalid configs to cause runtime errors.

### Solution

Add Zod schemas to all adapter configurations.

### Checklist

```markdown
### 7.1 Razorpay Adapter
- [ ] Create config schema:
      ```typescript
      // packages/adapters/billing-razorpay/src/index.ts
      const ZRazorpayConfig = z.object({
        keyId: z.string().startsWith('rzp_'),
        keySecret: z.string().min(1),
        webhookSecret: z.string().optional(),
        testMode: z.boolean().default(false),
      });

      export type RazorpayConfig = z.infer<typeof ZRazorpayConfig>;

      export function createRazorpayAdapter(config: unknown): BillingAdapter {
        const parsed = ZRazorpayConfig.parse(config);
        // ... implementation
      }
      ```

### 7.2 GCS Adapter
- [ ] Create config schema:
      ```typescript
      // packages/adapters/storage-gcs/src/index.ts
      const ZGcsConfig = z.object({
        projectId: z.string().min(1),
        bucket: z.string().min(1),
        credentials: z.object({
          client_email: z.string().email(),
          private_key: z.string().startsWith('-----BEGIN'),
        }).optional(),
        keyFilePath: z.string().optional(),
      }).refine(
        data => data.credentials || data.keyFilePath,
        'Either credentials or keyFilePath required'
      );
      ```

### 7.3 Local Storage Adapter
- [ ] Create config schema:
      ```typescript
      // packages/adapters/storage-local/src/index.ts
      const ZLocalStorageConfig = z.object({
        basePath: z.string().min(1),
        signingSecret: z.string().min(32).optional(),
        maxFileSizeBytes: z.number().positive().default(100 * 1024 * 1024),
        allowedExtensions: z.array(z.string()).optional(),
      });
      ```

### 7.4 Consistent Error Messages
- [ ] Wrap Zod errors for clarity:
      ```typescript
      export function createAdapter(config: unknown): Adapter {
        try {
          const parsed = ZConfig.parse(config);
          return new AdapterImpl(parsed);
        } catch (e) {
          if (e instanceof ZodError) {
            throw new ConfigurationError(
              `Invalid adapter configuration: ${e.errors.map(e => e.message).join(', ')}`
            );
          }
          throw e;
        }
      }
      ```

### 7.5 Add Tests
- [ ] Test each adapter with valid config
- [ ] Test each adapter with missing required fields
- [ ] Test each adapter with invalid field formats
```

---

## Verification

Run these checks after completing all tasks:

```bash
# 1. Credits idempotency
npm run test:credits
# Should show different request IDs create different transactions

# 2. Razorpay
npm run test:billing:razorpay
# Should pass or show clear "not supported" error

# 3. Permission cache
npm run test:permissions
# Should handle corrupted cache gracefully

# 4. Stripe
npm run test:billing:stripe
# Should propagate errors properly

# 5. Usage validation
npm run test:usage
# Should reject negative values

# 6. Devtools
cd packages/tooling/devtools
npm run test
# Should fail on build errors

# 7. Adapter validation
npm run test:adapters
# Should validate all configurations
```

---

## Success Criteria

Phase 1 is complete when:

- [ ] Credits consume creates unique transactions
- [ ] Razorpay either works or fails clearly
- [ ] Permission cache handles corruption
- [ ] Stripe errors propagate with context
- [ ] Usage rejects invalid increments
- [ ] Devtools fails on build errors
- [ ] All adapters validate configuration
- [ ] All tests passing
- [ ] No silent failures in logs

---

## Next Phase

After Phase 1 is complete, proceed to **[PHASE-2-RELIABILITY.md](./PHASE-2-RELIABILITY.md)** for reliability improvements.

---

> **Last Updated**: 2025-01-16
