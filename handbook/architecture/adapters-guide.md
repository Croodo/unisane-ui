# Adapter Development Guide

> **Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)

This guide documents the adapter pattern used in `packages/adapters/`, explaining how to create, use, and test adapters for the hexagonal architecture.

**Last Updated:** January 2026

---

## Overview

Adapters are the **implementation layer** of the hexagonal architecture. They implement **port interfaces** defined in the kernel, allowing applications to swap implementations without changing business logic.

```
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION (bootstrap.ts)                  │
│                           wires adapters                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                    setProvider(adapter)
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         KERNEL PORTS                             │
│  JobsPort │ OutboxPort │ BillingPort │ EmailPort │ IdentityPort │
└─────────────────────────────────────────────────────────────────┘
                                │
                        implements
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          ADAPTERS                                │
│  ┌─────────────┐ ┌───────────────┐ ┌──────────────┐            │
│  │jobs-inngest │ │outbox-mongodb │ │billing-stripe│            │
│  └─────────────┘ └───────────────┘ └──────────────┘            │
│  ┌─────────────┐ ┌───────────────┐ ┌──────────────┐            │
│  │email-resend │ │  email-ses    │ │billing-razrpy│            │
│  └─────────────┘ └───────────────┘ └──────────────┘            │
│  ┌────────────────┐ ┌─────────────────┐                        │
│  │identity-mongodb│ │ tenants-mongodb │                        │
│  └────────────────┘ └─────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Current Adapters

| Package | Port | Description |
|---------|------|-------------|
| `@unisane/jobs-inngest` | `JobsPort` | Background job scheduling via Inngest |
| `@unisane/outbox-mongodb` | `OutboxPort` | Transactional outbox via MongoDB |
| `@unisane/billing-stripe` | `BillingProviderAdapter` | Payment processing via Stripe |
| `@unisane/billing-razorpay` | `BillingProviderAdapter` | Payment processing via Razorpay |
| `@unisane/email-resend` | `EmailProvider` | Email delivery via Resend |
| `@unisane/email-ses` | `EmailProvider` | Email delivery via AWS SES |
| `@unisane/identity-mongodb` | `IdentityPort` | User/membership storage via MongoDB |
| `@unisane/tenants-mongodb` | `TenantsPort` | Tenant storage via MongoDB |
| `@unisane/storage-s3` | `StorageProvider` | File storage via AWS S3 |
| `@unisane/storage-gcs` | `StorageProvider` | File storage via Google Cloud |
| `@unisane/storage-local` | `StorageProvider` | File storage via local filesystem |

---

## Creating an Adapter

### Step 1: Understand the Port Interface

First, check the port interface in the kernel:

```typescript
// kernel/src/ports/jobs.port.ts
export interface JobsPort {
  send<T = Record<string, unknown>>(event: JobEvent<T>): Promise<{ id?: string }>;
  sendBatch<T = Record<string, unknown>>(events: JobEvent<T>[]): Promise<{ ids?: string[] }>;
}

export interface JobEvent<T = Record<string, unknown>> {
  name: string;
  data: T;
}
```

### Step 2: Create the Adapter Package

```bash
mkdir -p packages/adapters/jobs-bullmq/src
```

**package.json:**

```json
{
  "name": "@unisane/jobs-bullmq",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --clean",
    "dev": "tsup src/index.ts --format esm --dts --watch",
    "lint": "eslint src --max-warnings 0",
    "test": "vitest run",
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "@unisane/kernel": "workspace:*",
    "bullmq": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@unisane/typescript-config": "workspace:*",
    "tsup": "^8.0.0",
    "typescript": "^5.9.2",
    "vitest": "^4.0.16"
  }
}
```

**tsconfig.json:**

```json
{
  "extends": "@unisane/typescript-config/library.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 3: Implement the Adapter

```typescript
// packages/adapters/jobs-bullmq/src/index.ts

/**
 * BullMQ Jobs Adapter
 *
 * Implements the JobsPort interface using BullMQ.
 *
 * @example
 * ```typescript
 * import { createBullMQJobsAdapter } from '@unisane/jobs-bullmq';
 * import { setJobsProvider } from '@unisane/kernel';
 * import { Queue } from 'bullmq';
 *
 * const queue = new Queue('jobs', { connection: redis });
 * setJobsProvider(createBullMQJobsAdapter(queue));
 * ```
 */

import type { Queue } from 'bullmq';
import type { JobsPort, JobEvent } from '@unisane/kernel';

/**
 * Configuration for the BullMQ adapter.
 */
export interface BullMQJobsAdapterConfig {
  /**
   * The BullMQ queue instance.
   */
  queue: Queue;

  /**
   * Default job options (optional).
   */
  defaultJobOptions?: {
    attempts?: number;
    backoff?: { type: 'exponential' | 'fixed'; delay: number };
  };
}

/**
 * Create a JobsPort adapter using BullMQ.
 */
export function createBullMQJobsAdapter(config: BullMQJobsAdapterConfig): JobsPort {
  const { queue, defaultJobOptions = {} } = config;

  return {
    async send<T = Record<string, unknown>>(event: JobEvent<T>): Promise<{ id?: string }> {
      const job = await queue.add(event.name, event.data, {
        attempts: defaultJobOptions.attempts ?? 3,
        backoff: defaultJobOptions.backoff ?? { type: 'exponential', delay: 1000 },
      });
      return { id: job.id };
    },

    async sendBatch<T = Record<string, unknown>>(events: JobEvent<T>[]): Promise<{ ids?: string[] }> {
      if (events.length === 0) {
        return { ids: [] };
      }

      const jobs = await queue.addBulk(
        events.map((event) => ({
          name: event.name,
          data: event.data,
          opts: {
            attempts: defaultJobOptions.attempts ?? 3,
            backoff: defaultJobOptions.backoff ?? { type: 'exponential', delay: 1000 },
          },
        }))
      );

      return { ids: jobs.map((j) => j.id).filter(Boolean) as string[] };
    },
  };
}

// Re-export types for convenience
export type { JobsPort, JobEvent } from '@unisane/kernel';
```

### Step 4: Wire in Bootstrap

```typescript
// starters/saaskit/src/bootstrap.ts

async function setupJobsProvider() {
  const { setJobsProvider } = await import('@unisane/kernel');

  // Choose adapter based on environment
  const jobsProvider = process.env.JOBS_PROVIDER ?? 'inngest';

  if (jobsProvider === 'bullmq') {
    const { createBullMQJobsAdapter } = await import('@unisane/jobs-bullmq');
    const { Queue } = await import('bullmq');
    const queue = new Queue('jobs', { connection: { host: 'localhost', port: 6379 } });
    setJobsProvider(createBullMQJobsAdapter({ queue }));
    console.log('[bootstrap] BullMQ jobs adapter wired');
  } else {
    const { createInngestJobsAdapter } = await import('@unisane/jobs-inngest');
    const { inngest } = await import('./platform/inngest/client');
    setJobsProvider(createInngestJobsAdapter(inngest));
    console.log('[bootstrap] Inngest jobs adapter wired');
  }
}
```

---

## Adapter Design Patterns

### Pattern 1: Configuration Object

Use a config object for flexibility:

```typescript
export interface MongoOutboxAdapterConfig {
  collection: () => Collection<any>;
  maxRetries?: number;        // Default: 8
  baseDelaySec?: number;      // Default: 30
  maxDelaySec?: number;       // Default: 1800
}

export function createMongoOutboxAdapter(config: MongoOutboxAdapterConfig): OutboxPort {
  const { collection, maxRetries = 8, baseDelaySec = 30, maxDelaySec = 1800 } = config;
  // ...
}
```

### Pattern 2: Factory Function

Always use factory functions, not classes:

```typescript
// ✅ Good - Factory function
export function createStripeAdapter(config: StripeConfig): BillingProviderAdapter {
  return {
    async createCheckoutSession(args) { /* ... */ },
    async cancelSubscription(args) { /* ... */ },
  };
}

// ❌ Bad - Class (harder to test, more verbose)
export class StripeAdapter implements BillingProviderAdapter {
  constructor(private config: StripeConfig) {}
  async createCheckoutSession(args) { /* ... */ }
}
```

### Pattern 3: Lazy Initialization

Use functions for dependencies that need lazy init:

```typescript
// ✅ Good - Lazy collection getter
collection: () => db().collection('outbox')

// ❌ Bad - Eager collection (fails if DB not connected)
collection: db().collection('outbox')
```

### Pattern 4: Minimal Interface

Only require what the adapter needs:

```typescript
// ✅ Good - Minimal interface
export interface InngestLike {
  send(event: { name: string; data: Record<string, unknown> }): Promise<{ ids?: string[] }>;
}

// ❌ Bad - Coupling to full Inngest types
import type { Inngest } from 'inngest';
export function createAdapter(inngest: Inngest<any>) { /* ... */ }
```

### Pattern 5: Re-export Convenience Types

```typescript
// At the end of index.ts
export type { JobsPort, JobEvent } from '@unisane/kernel';
export { Queue } from 'bullmq'; // Re-export for convenience
```

---

## Testing Adapters

### Unit Tests

```typescript
// packages/adapters/jobs-bullmq/src/__tests__/index.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createBullMQJobsAdapter } from '../index';

describe('createBullMQJobsAdapter', () => {
  it('should send a job', async () => {
    const mockQueue = {
      add: vi.fn().mockResolvedValue({ id: 'job_123' }),
      addBulk: vi.fn(),
    };

    const adapter = createBullMQJobsAdapter({ queue: mockQueue as any });
    const result = await adapter.send({ name: 'test.job', data: { foo: 'bar' } });

    expect(mockQueue.add).toHaveBeenCalledWith('test.job', { foo: 'bar' }, expect.any(Object));
    expect(result.id).toBe('job_123');
  });

  it('should send batch of jobs', async () => {
    const mockQueue = {
      add: vi.fn(),
      addBulk: vi.fn().mockResolvedValue([{ id: 'job_1' }, { id: 'job_2' }]),
    };

    const adapter = createBullMQJobsAdapter({ queue: mockQueue as any });
    const result = await adapter.sendBatch([
      { name: 'job.one', data: {} },
      { name: 'job.two', data: {} },
    ]);

    expect(result.ids).toEqual(['job_1', 'job_2']);
  });

  it('should return empty array for empty batch', async () => {
    const mockQueue = { add: vi.fn(), addBulk: vi.fn() };
    const adapter = createBullMQJobsAdapter({ queue: mockQueue as any });

    const result = await adapter.sendBatch([]);

    expect(result.ids).toEqual([]);
    expect(mockQueue.addBulk).not.toHaveBeenCalled();
  });
});
```

### Integration Tests

```typescript
// packages/adapters/outbox-mongodb/src/__tests__/integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { createMongoOutboxAdapter } from '../index';

describe('MongoDB Outbox Adapter (integration)', () => {
  let mongod: MongoMemoryServer;
  let client: MongoClient;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    client = await MongoClient.connect(mongod.getUri());
  });

  afterAll(async () => {
    await client.close();
    await mongod.stop();
  });

  it('should enqueue and claim items', async () => {
    const collection = () => client.db('test').collection('outbox');
    const adapter = createMongoOutboxAdapter({ collection });

    // Enqueue
    const { id } = await adapter.enqueue({
      kind: 'email',
      payload: { to: 'test@example.com' },
    });
    expect(id).toBeDefined();

    // Claim
    const items = await adapter.claimBatch(new Date(), 10);
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('email');
  });
});
```

---

## Port Interface Reference

### JobsPort

```typescript
export interface JobsPort {
  send<T>(event: JobEvent<T>): Promise<{ id?: string }>;
  sendBatch<T>(events: JobEvent<T>[]): Promise<{ ids?: string[] }>;
}
```

### OutboxPort

```typescript
export interface OutboxPort {
  enqueue(item: OutboxItem): Promise<{ ok: true; id: string }>;
  claimBatch(now: Date, limit: number): Promise<OutboxRow[]>;
  markSuccess(id: string): Promise<void>;
  markFailure(id: string, err: string, attempts: number): Promise<void>;
  listDead(limit: number): Promise<Array<{ id: string }>>;
  requeue(ids: string[], now: Date): Promise<void>;
  countDead(): Promise<number>;
  purge(ids: string[]): Promise<void>;
}
```

### BillingProviderAdapter

```typescript
export interface BillingProviderAdapter {
  createCheckoutSession(args: CheckoutArgs): Promise<{ url: string }>;
  cancelSubscription(args: CancelArgs): Promise<{ ok: boolean }>;
  createBillingPortalSession(args: PortalArgs): Promise<{ url: string }>;
  handleWebhook(payload: unknown, signature: string): Promise<WebhookResult>;
  // ... more methods
}
```

### EmailProvider

```typescript
export interface EmailProvider {
  send(options: EmailOptions): Promise<{ id: string }>;
}

export interface EmailOptions {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}
```

---

## Best Practices

### Do

- ✅ Use factory functions (`createXxxAdapter`)
- ✅ Accept configuration objects with sensible defaults
- ✅ Use lazy initialization for database connections
- ✅ Define minimal interfaces for external dependencies
- ✅ Re-export types from kernel for convenience
- ✅ Write unit tests with mocked dependencies
- ✅ Write integration tests with real implementations
- ✅ Document with JSDoc and examples

### Don't

- ❌ Use classes for adapters
- ❌ Couple to specific library types
- ❌ Eagerly initialize connections
- ❌ Skip the config object pattern
- ❌ Forget to handle edge cases (empty arrays, nulls)
- ❌ Hard-code retry/timeout values

---

## Adding a New Port

If you need a new port interface:

1. **Define the interface in kernel:**
   ```typescript
   // kernel/src/ports/my-feature.port.ts
   export interface MyFeaturePort {
     doSomething(args: Args): Promise<Result>;
   }
   ```

2. **Add provider management:**
   ```typescript
   let _provider: MyFeaturePort = noopProvider;

   export function setMyFeatureProvider(provider: MyFeaturePort): void {
     _provider = provider;
   }

   export function getMyFeatureProvider(): MyFeaturePort {
     return _provider;
   }
   ```

3. **Export from ports/index.ts:**
   ```typescript
   export {
     type MyFeaturePort,
     setMyFeatureProvider,
     getMyFeatureProvider,
   } from "./my-feature.port";
   ```

4. **Rebuild kernel:**
   ```bash
   pnpm --filter @unisane/kernel build
   ```

5. **Create adapter package(s)**

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system architecture
- [Platform Layer](./platform-layer.md) - Platform module patterns
- [Module Development](./module-development.md) - Creating @unisane packages
- [kernel.md](./kernel.md) - Kernel internals

---

**Last Updated:** January 2026
