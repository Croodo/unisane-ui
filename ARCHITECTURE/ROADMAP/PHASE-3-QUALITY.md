# Phase 3: Code Quality

> **For LLMs**: Fix P1 issues related to code quality, DX, and minor security concerns.

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Status** | Blocked |
| **Dependencies** | Phase 2 (decoupling) |
| **Blocks** | Phase 4 (observability) |
| **Issues Addressed** | G-001, G-002, C-002, ER-001, DM-001, SL-001, DT-002, DT-003, BS-001, ES-001 |

---

## Prerequisites Check

Before starting this phase:

1. Phase 0, 1, 2 complete
2. Zero direct module imports
3. All critical issues (P0) resolved

---

## Tasks

### 1. G-001: Fix Handler Code Duplication

**File**: `packages/foundation/gateway/src/handler/httpHandler.ts`

**Problem**: `makeHandler` and `makeHandlerRaw` have 150+ nearly identical lines.

**Fix**:
```typescript
// Extract shared logic
interface HandlerContext<Body, Params> {
  req: Request;
  routeParams: Params;
  scope: ScopeContext;
  logger: Logger;
}

async function _setupHandler<Body, Params>(
  req: Request,
  route: RouteParams<Params>,
  opts: GuardOpts<Body, Params>
): Promise<HandlerContext<Body, Params>> {
  // Route param extraction
  const routeParams = extractRouteParams(req, route);

  // Request ID sanitization
  const requestId = sanitizeRequestId(req.headers['x-request-id']);

  // Guard invocation
  await runGuards(req, opts.guards);

  // Scope context setup
  const scope = buildScopeContext(req, routeParams);

  // Logging setup
  const logger = createRequestLogger(requestId, scope);

  return { req, routeParams, scope, logger };
}

export async function makeHandler<Body, Params>(
  req: Request,
  route: RouteParams<Params>,
  opts: HandlerOpts<Body, Params>
) {
  const ctx = await _setupHandler(req, route, opts);
  // Handler-specific JSON response logic
  const result = await opts.handler(ctx);
  return Response.json(result);
}

export async function makeHandlerRaw<Body, Params>(
  req: Request,
  route: RouteParams<Params>,
  opts: RawHandlerOpts<Body, Params>
) {
  const ctx = await _setupHandler(req, route, opts);
  // Raw handler-specific logic (streaming, files, etc.)
  return opts.handler(ctx);
}
```

**Checklist**:
- [ ] Create `_setupHandler` function
- [ ] Refactor `makeHandler` to use it
- [ ] Refactor `makeHandlerRaw` to use it
- [ ] Verify all routes still work
- [ ] Add tests for both handlers

---

### 2. G-002: Fix Dev Auth Headers Security Risk

**File**: `packages/foundation/gateway/src/auth/auth.ts` lines 366-389

**Problem**: `APP_ENV !== 'prod'` allows dev headers if misconfigured as 'production'.

**Before**:
```typescript
if (APP_ENV !== 'prod') {
  // Dev headers work here - RISKY!
}
```

**After**:
```typescript
// Allowlist approach - safe
const DEV_ENVIRONMENTS = ['dev', 'test', 'development', 'local'] as const;
type DevEnv = typeof DEV_ENVIRONMENTS[number];

function isDevEnvironment(env: string): env is DevEnv {
  return DEV_ENVIRONMENTS.includes(env as DevEnv);
}

if (isDevEnvironment(APP_ENV)) {
  // Dev headers only work in explicitly allowed environments
  logger.debug('Dev auth headers enabled', { env: APP_ENV });
}
```

**Checklist**:
- [ ] Create `DEV_ENVIRONMENTS` allowlist
- [ ] Create `isDevEnvironment()` type guard
- [ ] Replace `!== 'prod'` check with allowlist
- [ ] Add warning log when dev auth is enabled
- [ ] Test: verify dev headers blocked when APP_ENV='production'

---

### 3. C-002: Standardize Pagination Limits

**Problem**: Different contracts use different max limits (50, 200, 500).

**Fix**:
```typescript
// packages/foundation/contracts/src/pagination.ts
export const PAGINATION_DEFAULTS = {
  defaultLimit: 20,
  maxLimit: 100,
  defaultOffset: 0,
} as const;

export const ZPaginationQuery = z.object({
  limit: z.coerce.number()
    .int()
    .positive()
    .max(PAGINATION_DEFAULTS.maxLimit)
    .default(PAGINATION_DEFAULTS.defaultLimit),
  offset: z.coerce.number()
    .int()
    .min(0)
    .default(PAGINATION_DEFAULTS.defaultOffset),
});

export type PaginationQuery = z.infer<typeof ZPaginationQuery>;
```

Update all contracts:
```typescript
// tenants.contract.ts
import { ZPaginationQuery } from '@unisane/contracts';
import { ZUserStatus } from '@unisane/kernel';  // SSOT reference

export const ZListTenantsQuery = ZPaginationQuery.extend({
  status: ZUserStatus.optional(),  // SSOT: 'active' | 'suspended' | 'deleted'
});
```

**Checklist**:
- [ ] Create `PAGINATION_DEFAULTS` constant
- [ ] Create reusable `ZPaginationQuery`
- [ ] Update `tenants.contract.ts` to use it
- [ ] Update `users.contract.ts` to use it
- [ ] Update any other contracts with pagination
- [ ] Remove custom max limits

---

### 4. ER-001: Add Timeout to email-resend

**File**: `packages/adapters/email-resend/src/index.ts`

**Before**:
```typescript
async send(message: EmailMessage): Promise<SendResult> {
  const result = await this.resend.emails.send({...});  // Can hang forever
  return result;
}
```

**After**:
```typescript
async send(message: EmailMessage): Promise<SendResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), this.config.timeoutMs ?? 10000);

  try {
    const result = await this.resend.emails.send(
      { ...this.buildEmailPayload(message) },
      { signal: ctrl.signal }
    );
    return { messageId: result.id, success: true };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new TimeoutError('email-resend', 'send', this.config.timeoutMs ?? 10000);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
```

**Checklist**:
- [ ] Add `timeoutMs` to config (default 10000)
- [ ] Implement AbortController timeout
- [ ] Handle AbortError with custom TimeoutError
- [ ] Match SES adapter pattern
- [ ] Test timeout behavior

---

### 5. DM-001: Fix MongoDB Connection Race Condition

**File**: `packages/adapters/database-mongodb/src/index.ts` lines 89-143

**Before**:
```typescript
finally {
  this.connectingPromise = null;  // Race condition!
}
```

**After**:
```typescript
async connect(): Promise<MongoClient> {
  if (this.client) return this.client;

  // Capture current promise reference
  const currentPromise = this.connectingPromise;

  if (currentPromise) {
    return currentPromise;
  }

  this.connectingPromise = this._doConnect();

  try {
    this.client = await this.connectingPromise;
    return this.client;
  } catch (error) {
    // Only clear if this is still the current promise
    if (this.connectingPromise === currentPromise) {
      this.connectingPromise = null;
    }
    throw error;
  }
}

private async _doConnect(): Promise<MongoClient> {
  const client = new MongoClient(this.uri, this.options);
  await client.connect();
  return client;
}
```

**Checklist**:
- [ ] Capture promise reference before clearing
- [ ] Only clear if still current promise
- [ ] Extract connection logic to private method
- [ ] Add connection state logging
- [ ] Test concurrent connection attempts

---

### 6. SL-001: Add Resilience to storage-local

**File**: `packages/adapters/storage-local/src/index.ts` lines 312-314

**Before**:
```typescript
export function createLocalStorageAdapter(config: LocalAdapterConfig): StorageProvider {
  return new LocalStorageAdapter(config);
}
```

**After**:
```typescript
import { createResilientAdapter } from '@unisane/kernel';

export function createLocalStorageAdapter(config: LocalAdapterConfig): StorageProvider {
  const adapter = new LocalStorageAdapter(config);
  // Lighter config for local - fewer retries, shorter delays
  return createResilientAdapter('storage-local', adapter, {
    retry: { maxRetries: 2, baseDelayMs: 100 },
    timeout: { requestTimeout: 5000 },
    // No circuit breaker for local storage
  });
}
```

**Checklist**:
- [ ] Add resilience wrapper
- [ ] Use lighter config than cloud adapters
- [ ] Skip circuit breaker (local rarely fails repeatedly)
- [ ] Test retry behavior

---

### 7. DT-002: Auto-build Contracts Before Generation

**File**: `packages/tooling/devtools/src/commands/routes/gen.ts` lines 71-84

**Fix**:
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import { stat } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function getNewestMtime(dir: string): Promise<number> {
  // Recursively find newest file modification time
  const files = await glob(`${dir}/**/*.ts`);
  let newest = 0;
  for (const file of files) {
    const stats = await stat(file);
    if (stats.mtimeMs > newest) newest = stats.mtimeMs;
  }
  return newest;
}

async function ensureContractsBuilt(projectRoot: string): Promise<void> {
  const contractsSrcPath = path.join(projectRoot, 'packages/foundation/contracts/src');
  const contractsDistPath = path.join(projectRoot, 'packages/foundation/contracts/dist');

  const srcMtime = await getNewestMtime(contractsSrcPath);
  const distMtime = await getNewestMtime(contractsDistPath).catch(() => 0);

  if (srcMtime > distMtime) {
    console.log('📦 Building contracts...');
    await execAsync('pnpm --filter @unisane/contracts build');
    console.log('✅ Contracts built');
  }
}

// In generate command
export async function generateRoutes(options: GenOptions) {
  await ensureContractsBuilt(options.projectRoot);
  // ... rest of generation
}
```

**Checklist**:
- [ ] Create `getNewestMtime` helper
- [ ] Create `ensureContractsBuilt` function
- [ ] Call before route generation
- [ ] Test: modify contract, run gen, verify auto-builds

---

### 8. DT-003: Validate defineOpMeta

**File**: `packages/tooling/devtools/src/extraction/meta-extract.ts`

**Fix**:
```typescript
import { z } from 'zod';

const ZServiceMeta = z.object({
  importPath: z.string().optional(),
  fn: z.string(),
  args: z.record(z.string()).optional(),
}).strict();

const ZOpMeta = z.object({
  op: z.string().min(1),
  perms: z.array(z.string()).optional(),
  requireUser: z.boolean().optional(),
  allowUnauthed: z.boolean().optional(),
  service: ZServiceMeta.optional(),
  rateLimit: z.object({
    requests: z.number(),
    windowMs: z.number(),
  }).optional(),
}).strict();  // Fail on unknown keys!

// In extraction loop
const metaObject = parseObjectLiteral(arg);
const parsed = ZOpMeta.safeParse(metaObject);

if (!parsed.success) {
  console.error(`❌ Invalid defineOpMeta at ${sf.getFilePath()}:${call.getStartLineNumber()}`);
  console.error(`   ${parsed.error.message}`);
  continue;
}

// Use parsed.data which is validated
```

**Checklist**:
- [ ] Create `ZOpMeta` schema with `.strict()`
- [ ] Validate during extraction
- [ ] Print clear error with file:line
- [ ] Test: add typo to metadata, verify caught

---

### 9. BS-001: Log Stripe ensureCustomerId Errors

**File**: `packages/adapters/billing-stripe/src/index.ts` lines 147-149

**Before**:
```typescript
catch {
  return null;  // Silent!
}
```

**After**:
```typescript
catch (error) {
  this.logger.warn('Failed to ensure customer ID', {
    error: error instanceof Error ? error.message : String(error),
    scopeId,
    provider: 'stripe',
    operation: 'ensureCustomerId'
  });
  return null;
}
```

**Checklist**:
- [ ] Add logger to adapter
- [ ] Log error with context
- [ ] Keep returning null (graceful degradation)
- [ ] Add monitoring for these warnings

---

### 10. ES-001: Standardize Circuit Breaker Thresholds

**Problem**: email-resend uses 5, email-ses uses 10.

**Fix**: Use `ADAPTER_RESILIENCE_STANDARD` everywhere:

```typescript
// In kernel
export const ADAPTER_RESILIENCE_STANDARD = {
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 30000,
  },
  retry: {
    maxRetries: 3,
    baseDelayMs: 200,
  },
  timeout: {
    requestTimeout: 10000,
  },
};
```

Update SES adapter:
```typescript
// email-ses/src/index.ts
export function createSESAdapter(config: SESConfig): EmailPort {
  const adapter = new SESEmailAdapter(config);
  return createResilientAdapter('email-ses', adapter); // Uses standard config
}
```

**Checklist**:
- [ ] Verify `ADAPTER_RESILIENCE_STANDARD` exists in kernel
- [ ] Update email-ses to use standard config
- [ ] Update email-resend to use standard config
- [ ] Verify both use failureThreshold: 5

---

## Verification

```bash
# All builds pass
pnpm build

# Type check passes
pnpm typecheck

# Tests pass
pnpm test

# Generate routes works without pre-build
cd starters/saaskit && pnpm gen:routes
```

---

## Success Criteria

Phase 3 is complete when:

1. Handler duplication eliminated
2. Dev auth uses allowlist
3. Pagination standardized
4. All email adapters have timeout
5. MongoDB connection race fixed
6. Local storage has resilience
7. Contracts auto-build
8. defineOpMeta validated
9. Stripe errors logged
10. Circuit breaker thresholds consistent

---

## Next Phase

After Phase 3 is complete, proceed to **[PHASE-4-OBSERVABILITY.md](./PHASE-4-OBSERVABILITY.md)** for logging and metrics.

---

> **Last Updated**: 2025-01-15
