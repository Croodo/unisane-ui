# Implementation Patterns

> **For LLMs**: Load this when implementing new features. Contains step-by-step patterns with code examples.

---

## Table of Contents

1. [Creating a New Port](#pattern-1-creating-a-new-port)
2. [Using a Port in a Module](#pattern-2-using-a-port-in-a-module)
3. [Creating a New Adapter](#pattern-3-creating-a-new-adapter)
4. [Event-Driven Communication](#pattern-4-event-driven-communication)
5. [Adding a New Module](#pattern-5-adding-a-new-module)
6. [Bootstrap Wiring](#pattern-6-bootstrap-wiring)
7. [Testing with Port Mocks](#pattern-7-testing-with-port-mocks)

---

## Pattern 1: Creating a New Port

**When**: You need cross-module functionality that doesn't have a port yet.

### Step 1: Define the Port Interface

```typescript
// packages/foundation/kernel/src/ports/credits.port.ts

export interface CreditsPort {
  /**
   * Consume credits from a scope's balance
   * @throws InsufficientCreditsError if balance too low
   */
  consume(args: {
    scopeId: string;
    amount: number;
    reason: string;
    feature?: string;
  }): Promise<{ consumed: number; remaining: number }>;

  /**
   * Grant credits to a scope
   */
  grant(args: {
    scopeId: string;
    amount: number;
    reason: string;
    expiresAt?: number;
  }): Promise<{ granted: number; newBalance: number }>;

  /**
   * Get current balance for a scope
   */
  getBalance(scopeId: string): Promise<{ available: number; pending: number }>;
}
```

### Step 2: Add Provider Storage and Accessors

```typescript
// Same file, after interface

let creditsPort: CreditsPort | null = null;

export function setCreditsPort(port: CreditsPort): void {
  creditsPort = port;
}

export function getCreditsPort(): CreditsPort {
  if (!creditsPort) {
    throw new Error(
      'CreditsPort not configured. Call setCreditsPort() in bootstrap.'
    );
  }
  return creditsPort;
}
```

### Step 3: Export from Ports Index

```typescript
// packages/foundation/kernel/src/ports/index.ts

export * from './flags.port';
export * from './billing.port';
export * from './settings.port';
export * from './credits.port';  // ← Add this
```

### Step 4: Export from Kernel Index

```typescript
// packages/foundation/kernel/src/index.ts

export {
  // ... existing exports
  type CreditsPort,
  setCreditsPort,
  getCreditsPort,
} from './ports';
```

### Step 5: Wire in Bootstrap

See [Pattern 6: Bootstrap Wiring](#pattern-6-bootstrap-wiring)

---

## Pattern 2: Using a Port in a Module

**When**: Your module needs to call another module's functionality.

### Before (WRONG - Direct Import)

```typescript
// packages/modules/ai/src/service/generate.ts

// ❌ WRONG: Direct import from another module
import { isEnabledForScope } from '@unisane/flags';
import { consumeTokens } from '@unisane/credits';

export async function generate(args: GenerateArgs) {
  const enabled = await isEnabledForScope({ key: 'ai.generate', scopeId: args.scopeId });
  if (!enabled) throw new FeatureDisabledError();

  await consumeTokens({ scopeId: args.scopeId, amount: 10, reason: 'ai.generate' });
  // ... rest of implementation
}
```

### After (CORRECT - Using Ports)

```typescript
// packages/modules/ai/src/service/generate.ts

// ✅ CORRECT: Import ports from kernel
import { getFlagsPort, getCreditsPort } from '@unisane/kernel';

export async function generate(args: GenerateArgs) {
  // Get ports
  const flags = getFlagsPort();
  const credits = getCreditsPort();

  // Use ports
  const enabled = await flags.isEnabled('ai.generate', args.scopeId);
  if (!enabled) throw new FeatureDisabledError();

  await credits.consume({
    scopeId: args.scopeId,
    amount: 10,
    reason: 'ai.generate',
    feature: 'ai',
  });

  // ... rest of implementation
}
```

---

## Pattern 3: Creating a New Adapter

**When**: Adding support for a new external service (e.g., new payment provider, new storage backend).

### Step 1: Create Adapter Package

```
packages/adapters/billing-newprovider/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts
```

### Step 2: Implement the Port Interface

```typescript
// packages/adapters/billing-newprovider/src/index.ts

import type { BillingProviderAdapter } from '@unisane/kernel';
import { createResilientAdapter, logger } from '@unisane/kernel';

export interface NewProviderConfig {
  apiKey: string;
  apiSecret: string;
  webhookSecret: string;
}

class NewProviderBillingAdapter implements BillingProviderAdapter {
  readonly name = 'billing-newprovider' as const;

  constructor(private readonly config: NewProviderConfig) {
    // Validate config
    if (!config.apiKey) throw new Error('apiKey is required');
    if (!config.apiSecret) throw new Error('apiSecret is required');
  }

  async createCheckoutSession(args: CreateCheckoutArgs): Promise<CheckoutSession> {
    logger.info('Creating checkout session', { provider: this.name, planId: args.planId });

    try {
      // Implementation
      const result = await this.client.createSession({...});
      return { id: result.id, url: result.url };
    } catch (error) {
      logger.error('Checkout session failed', { error, provider: this.name });
      throw error;
    }
  }

  async createPortalSession(args: CreatePortalArgs): Promise<PortalSession> {
    // If provider doesn't support this, return a fallback
    // DO NOT throw - that violates the interface contract
    return {
      id: 'fallback',
      url: `https://dashboard.newprovider.com/billing`,
    };
  }

  // ... implement all other interface methods
}
```

### Step 3: Export with Resilience Wrapper

```typescript
// Same file, at the end

export function createNewProviderBillingAdapter(
  config: NewProviderConfig
): BillingProviderAdapter {
  const adapter = new NewProviderBillingAdapter(config);

  // ALWAYS wrap with resilience
  return createResilientAdapter('billing-newprovider', adapter, {
    // Can override defaults if needed
    circuitBreaker: { failureThreshold: 5, resetTimeout: 30000 },
    retry: { maxRetries: 3, baseDelayMs: 200 },
    timeout: { requestTimeout: 15000 }, // Custom timeout for slow API
  });
}
```

### Step 4: Add to Bootstrap Selection

```typescript
// starters/saaskit/src/bootstrap.ts

async function setupBillingProviders() {
  const provider = getEnv('BILLING_PROVIDER');

  switch (provider) {
    case 'stripe':
      const { createStripeBillingAdapter } = await import('@unisane/billing-stripe');
      setBillingProvider(createStripeBillingAdapter({...}));
      break;
    case 'razorpay':
      const { createRazorpayBillingAdapter } = await import('@unisane/billing-razorpay');
      setBillingProvider(createRazorpayBillingAdapter({...}));
      break;
    case 'newprovider':  // ← Add new case
      const { createNewProviderBillingAdapter } = await import('@unisane/billing-newprovider');
      setBillingProvider(createNewProviderBillingAdapter({
        apiKey: getEnv('NEWPROVIDER_API_KEY'),
        apiSecret: getEnv('NEWPROVIDER_API_SECRET'),
        webhookSecret: getEnv('NEWPROVIDER_WEBHOOK_SECRET'),
      }));
      break;
  }
}
```

---

## Pattern 4: Event-Driven Communication

**When**: Module A needs to trigger behavior in Module B without coupling.

### Step 1: Define Event in Owning Module

```typescript
// packages/modules/billing/src/domain/events.ts

import { z } from 'zod';

export const BILLING_EVENTS = {
  SUBSCRIPTION_CREATED: 'billing.subscription.created',
  SUBSCRIPTION_UPDATED: 'billing.subscription.updated',
  SUBSCRIPTION_CANCELLED: 'billing.subscription.cancelled',
  TOPUP_COMPLETED: 'billing.topup.completed',
} as const;

// Import SSOT types from kernel constants
import { ZSubscriptionStatus } from '@unisane/kernel';

export const ZSubscriptionCreatedPayload = z.object({
  scopeId: z.string(),
  subscriptionId: z.string(),
  planId: z.string(),
  status: ZSubscriptionStatus,  // SSOT reference, not inline
  currentPeriodEnd: z.number(),
});

export type SubscriptionCreatedPayload = z.infer<typeof ZSubscriptionCreatedPayload>;

// Export all schemas for registration
export const BILLING_EVENT_SCHEMAS = {
  [BILLING_EVENTS.SUBSCRIPTION_CREATED]: ZSubscriptionCreatedPayload,
  [BILLING_EVENTS.SUBSCRIPTION_UPDATED]: ZSubscriptionUpdatedPayload,
  [BILLING_EVENTS.SUBSCRIPTION_CANCELLED]: ZSubscriptionCancelledPayload,
  [BILLING_EVENTS.TOPUP_COMPLETED]: ZTopupCompletedPayload,
};
```

### Step 2: Emit Event

```typescript
// packages/modules/billing/src/service/subscribe.ts

import { events } from '@unisane/kernel';
import { BILLING_EVENTS } from '../domain/events';

export async function createSubscription(args: SubscribeArgs) {
  // ... create subscription logic

  // Emit event
  await events.emit(BILLING_EVENTS.SUBSCRIPTION_CREATED, {
    scopeId: args.scopeId,
    subscriptionId: subscription.id,
    planId: args.planId,
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
  });

  return subscription;
}
```

### Step 3: Listen in Another Module

```typescript
// packages/modules/credits/src/event-handlers.ts

import { onTyped } from '@unisane/kernel';
import { grantInitialCredits } from './service/grant';

export function registerCreditEventHandlers(): () => void {
  const unsubscribers: Array<() => void> = [];

  // Listen to billing events
  unsubscribers.push(
    onTyped('billing.subscription.created', async (event) => {
      // Grant initial credits for new subscriptions
      await grantInitialCredits({
        scopeId: event.payload.scopeId,
        planId: event.payload.planId,
      });
    })
  );

  unsubscribers.push(
    onTyped('billing.topup.completed', async (event) => {
      // Grant purchased credits
      await grantPurchasedCredits({
        scopeId: event.payload.scopeId,
        amount: event.payload.creditAmount,
      });
    })
  );

  // Return cleanup function
  return () => {
    for (const unsub of unsubscribers) {
      unsub();
    }
  };
}
```

### Step 4: Register Handlers in Bootstrap

```typescript
// starters/saaskit/src/bootstrap.ts

async function registerEventHandlers() {
  const cleanups: Array<() => void> = [];

  const { registerCreditEventHandlers } = await import('@unisane/credits');
  const { registerAuditEventHandlers } = await import('@unisane/audit');

  cleanups.push(registerCreditEventHandlers());
  cleanups.push(registerAuditEventHandlers());

  // Store for graceful shutdown
  globalThis.__eventHandlerCleanup = cleanups;
}
```

---

## Pattern 5: Adding a New Module

**When**: Creating a completely new business domain module.

### Step 1: Create Module Structure

```
packages/modules/mymodule/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts              # Public API exports
    ├── domain/
    │   ├── constants.ts      # Event names, collection names
    │   ├── errors.ts         # Domain errors
    │   ├── events.ts         # Event schemas
    │   ├── keys.ts           # Cache key builders
    │   ├── ports.ts          # Repository interfaces
    │   ├── schemas.ts        # Zod validation schemas
    │   └── types.ts          # TypeScript types
    ├── service/
    │   ├── create.ts         # Use case: create
    │   ├── update.ts         # Use case: update
    │   ├── delete.ts         # Use case: delete
    │   └── admin/            # Admin-only operations
    │       └── list.ts
    ├── data/
    │   └── mymodule.repository.mongo.ts
    └── event-handlers.ts     # Event subscriptions
```

### Step 2: Define Domain Layer

```typescript
// src/domain/constants.ts
export const MYMODULE_COLLECTION = 'mymodules';

export const MYMODULE_EVENTS = {
  CREATED: 'mymodule.created',
  UPDATED: 'mymodule.updated',
  DELETED: 'mymodule.deleted',
} as const;
```

```typescript
// src/domain/errors.ts
import { DomainError, ErrorCode } from '@unisane/kernel';

export class MyModuleNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(id: string) {
    super(`MyModule not found: ${id}`);
  }
}
```

```typescript
// src/domain/ports.ts
import type { MyModule, CreateMyModuleInput } from './types';

export interface MyModuleRepository {
  findById(id: string): Promise<MyModule | null>;
  create(input: CreateMyModuleInput): Promise<MyModule>;
  update(id: string, input: Partial<CreateMyModuleInput>): Promise<MyModule>;
  delete(id: string): Promise<void>;
}
```

### Step 3: Implement Service Layer

```typescript
// src/service/create.ts
import { events, getScope } from '@unisane/kernel';
import { MYMODULE_EVENTS } from '../domain/constants';
import { getMyModuleRepository } from '../data/mymodule.repository.mongo';

export async function createMyModule(input: CreateMyModuleInput): Promise<MyModule> {
  const scope = getScope();
  const repo = getMyModuleRepository();

  const mymodule = await repo.create({
    ...input,
    scopeId: scope.scopeId,
  });

  await events.emit(MYMODULE_EVENTS.CREATED, {
    scopeId: scope.scopeId,
    mymoduleId: mymodule.id,
  });

  return mymodule;
}
```

### Step 4: Export Public API

```typescript
// src/index.ts
// Only export what other modules/starters need

// Service functions
export { createMyModule } from './service/create';
export { updateMyModule } from './service/update';
export { deleteMyModule } from './service/delete';
export { listMyModules } from './service/admin/list';

// Types (only if needed externally)
export type { MyModule, CreateMyModuleInput } from './domain/types';

// Schemas (for contract validation)
export { ZCreateMyModule, ZMyModule } from './domain/schemas';

// Events (for registration)
export { MYMODULE_EVENTS, MYMODULE_EVENT_SCHEMAS } from './domain/events';

// Event handlers
export { registerMyModuleEventHandlers } from './event-handlers';
```

---

## Pattern 6: Bootstrap Wiring

**When**: Connecting all the pieces at application startup.

### Complete Bootstrap Structure

```typescript
// starters/saaskit/src/bootstrap.ts

let bootstrapped = false;

export async function bootstrap() {
  if (bootstrapped) return;

  console.log('[bootstrap] Starting platform initialization...');

  // Phase 1: Infrastructure
  await connectDb();
  await ensureIndexes();

  // Phase 2: Foundation Ports (from adapters)
  await setupRepositories();

  // Phase 3: Module Ports (NEW - critical for decoupling)
  await setupModulePorts();

  // Phase 4: External Providers
  await setupEmailProviders();
  await setupBillingProviders();
  await setupStorageProviders();
  await setupJobsProvider();
  await setupOutbox();

  // Phase 5: Events
  await registerEventSchemas();
  await registerEventHandlers();

  // Phase 6: Health checks
  registerHealthChecks();

  bootstrapped = true;
  console.log('[bootstrap] Platform ready');
}

async function setupModulePorts() {
  const {
    setCreditsPort,
    setAuditPort,
    setUsagePort,
    setNotifyPort,
    setTenantsQueryPort,
  } = await import('@unisane/kernel');

  // Credits port
  const credits = await import('@unisane/credits');
  setCreditsPort({
    consume: credits.consumeTokens,
    grant: credits.grantTokens,
    getBalance: credits.getBalance,
  });

  // Audit port
  const audit = await import('@unisane/audit');
  setAuditPort({
    log: audit.log,
    query: audit.queryLogs,
  });

  // Usage port
  const usage = await import('@unisane/usage');
  setUsagePort({
    track: usage.trackUsage,
    getUsage: usage.getUsage,
    getRollup: usage.getRollup,
  });

  // Notify port
  const notify = await import('@unisane/notify');
  setNotifyPort({
    send: notify.sendNotification,
    sendBatch: notify.sendBatch,
  });

  // Tenants query port
  const tenants = await import('@unisane/tenants');
  setTenantsQueryPort({
    findById: tenants.findById,
    findBySlug: tenants.findBySlug,
  });

  console.log('[bootstrap]   - Module ports configured');
}
```

---

## Pattern 7: Testing with Port Mocks

**When**: Writing unit tests for modules that depend on ports.

### Step 1: Create Mock Factory

```typescript
// packages/foundation/kernel/src/testing/mocks.ts

import { vi } from 'vitest';
import type { CreditsPort, FlagsPort, BillingPort } from '../ports';

export function createMockCreditsPort(overrides?: Partial<CreditsPort>): CreditsPort {
  return {
    consume: vi.fn().mockResolvedValue({ consumed: 10, remaining: 90 }),
    grant: vi.fn().mockResolvedValue({ granted: 100, newBalance: 200 }),
    getBalance: vi.fn().mockResolvedValue({ available: 100, pending: 0 }),
    ...overrides,
  };
}

export function createMockFlagsPort(overrides?: Partial<FlagsPort>): FlagsPort {
  return {
    isEnabled: vi.fn().mockResolvedValue(true),
    getValue: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

export function createMockBillingPort(overrides?: Partial<BillingPort>): BillingPort {
  return {
    assertActiveSubscription: vi.fn().mockResolvedValue(undefined),
    getSubscription: vi.fn().mockResolvedValue({ status: 'active' }),
    ...overrides,
  };
}
```

### Step 2: Use in Tests

```typescript
// packages/modules/ai/src/service/__tests__/generate.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  setCreditsPort,
  setFlagsPort,
  createMockCreditsPort,
  createMockFlagsPort,
} from '@unisane/kernel';
import { generate } from '../generate';

describe('ai/generate', () => {
  let mockCredits: ReturnType<typeof createMockCreditsPort>;
  let mockFlags: ReturnType<typeof createMockFlagsPort>;

  beforeEach(() => {
    mockCredits = createMockCreditsPort();
    mockFlags = createMockFlagsPort();

    setCreditsPort(mockCredits);
    setFlagsPort(mockFlags);
  });

  it('should consume credits on successful generation', async () => {
    const result = await generate({ prompt: 'test', scopeId: 'scope-1' });

    expect(mockCredits.consume).toHaveBeenCalledWith({
      scopeId: 'scope-1',
      amount: expect.any(Number),
      reason: 'ai.generate',
      feature: 'ai',
    });
  });

  it('should throw when feature is disabled', async () => {
    mockFlags.isEnabled.mockResolvedValue(false);

    await expect(generate({ prompt: 'test', scopeId: 'scope-1' }))
      .rejects.toThrow('Feature disabled');
  });

  it('should throw when insufficient credits', async () => {
    mockCredits.consume.mockRejectedValue(new InsufficientCreditsError());

    await expect(generate({ prompt: 'test', scopeId: 'scope-1' }))
      .rejects.toThrow(InsufficientCreditsError);
  });
});
```

---

> **Last Updated**: 2025-01-15 | **Version**: 2.0
