# Testing Strategy

> Complete testing guide for the Unisane platform.
>
> **Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## Overview

Testing pyramid with four layers:

```
        ┌─────────┐
        │   E2E   │  Few, slow, high confidence
        └────┬────┘
      ┌──────┴──────┐
      │ Integration │  Some, medium speed
      └──────┬──────┘
   ┌─────────┴─────────┐
   │      Unit         │  Many, fast, mocked deps
   └─────────┬─────────┘
┌────────────┴────────────┐
│        Schema           │  Fast, no deps
└─────────────────────────┘
```

---

## Test Types

### 1. Schema Tests

Validate Zod schemas without any dependencies.

**Location:** `packages/{module}/__tests__/schemas.test.ts`

```typescript
// packages/billing/__tests__/schemas.test.ts

import { describe, it, expect } from 'vitest';
import { ZSubscribeInput, ZSubscription } from '../src/domain/schemas';

describe('ZSubscribeInput', () => {
  it('accepts valid input', () => {
    const result = ZSubscribeInput.safeParse({
      planId: 'pro',
      billingCycle: 'monthly',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid planId', () => {
    const result = ZSubscribeInput.safeParse({
      planId: 'invalid',
      billingCycle: 'monthly',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional fields', () => {
    const result = ZSubscribeInput.safeParse({
      planId: 'pro',
      billingCycle: 'yearly',
      couponCode: 'SAVE20',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.couponCode).toBe('SAVE20');
    }
  });
});
```

### 2. Unit Tests

Test service functions with mocked dependencies.

**Location:** `packages/{module}/__tests__/unit/*.test.ts`

```typescript
// packages/billing/__tests__/unit/subscription.service.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subscribe, cancelSubscription } from '../../src/service/subscription.service';
import { setSubscriptionRepo } from '../../src/data';
import { SubscriptionAlreadyExistsError } from '../../src/domain/errors';

// Mock kernel
vi.mock('@unisane/kernel', () => ({
  ctx: {
    get: vi.fn(() => ({
      tenantId: 'tenant-123',
      userId: 'user-123',
      permissions: ['billing:write'],
    })),
  },
  events: {
    emit: vi.fn(),
  },
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('subscription.service', () => {
  const mockRepo = {
    findByTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findById: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setSubscriptionRepo(mockRepo);
  });

  describe('subscribe', () => {
    it('creates subscription for new tenant', async () => {
      mockRepo.findByTenant.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue({
        id: 'sub-123',
        tenantId: 'tenant-123',
        planId: 'pro',
        status: 'active',
      });

      const result = await subscribe({
        planId: 'pro',
        billingCycle: 'monthly',
      });

      expect(result.id).toBe('sub-123');
      expect(result.planId).toBe('pro');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-123',
          planId: 'pro',
        })
      );
    });

    it('throws if tenant already has subscription', async () => {
      mockRepo.findByTenant.mockResolvedValue({
        id: 'existing-sub',
        status: 'active',
      });

      await expect(
        subscribe({ planId: 'pro', billingCycle: 'monthly' })
      ).rejects.toThrow(SubscriptionAlreadyExistsError);
    });

    it('emits subscription.created event', async () => {
      const { events } = await import('@unisane/kernel');

      mockRepo.findByTenant.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue({
        id: 'sub-123',
        tenantId: 'tenant-123',
        planId: 'pro',
        status: 'active',
      });

      await subscribe({ planId: 'pro', billingCycle: 'monthly' });

      expect(events.emit).toHaveBeenCalledWith(
        'billing.subscription.created',
        expect.objectContaining({
          subscriptionId: 'sub-123',
          planId: 'pro',
        })
      );
    });
  });

  describe('cancelSubscription', () => {
    it('cancels active subscription', async () => {
      mockRepo.findByTenant.mockResolvedValue({
        id: 'sub-123',
        status: 'active',
      });
      mockRepo.update.mockResolvedValue({
        id: 'sub-123',
        status: 'cancelled',
      });

      const result = await cancelSubscription({ reason: 'Too expensive' });

      expect(result.status).toBe('cancelled');
      expect(mockRepo.update).toHaveBeenCalledWith(
        'sub-123',
        expect.objectContaining({ status: 'cancelled' })
      );
    });
  });
});
```

### 3. Integration Tests

Test with real database (MongoDB Memory Server).

**Location:** `packages/{module}/__tests__/integration/*.test.ts`

```typescript
// packages/billing/__tests__/integration/subscription.integration.test.ts

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { ctx } from '@unisane/kernel';
import { subscribe, getSubscription, cancelSubscription } from '../../src/service';
import { setSubscriptionRepo } from '../../src/data';
import { createMongoSubscriptionRepo } from '../../src/data/subscription.repo.mongo';

describe('subscription integration', () => {
  let mongod: MongoMemoryServer;
  let client: MongoClient;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    client = new MongoClient(mongod.getUri());
    await client.connect();

    const db = client.db();
    setSubscriptionRepo(createMongoSubscriptionRepo(db));
  });

  afterAll(async () => {
    await client?.close();
    await mongod?.stop();
  });

  beforeEach(async () => {
    await client.db().collection('subscriptions').deleteMany({});
  });

  it('full subscription lifecycle', async () => {
    await ctx.run({
      requestId: 'test',
      startTime: Date.now(),
      isAuthenticated: true,
      tenantId: 'tenant-123',
      userId: 'user-123',
      permissions: ['billing:write'],
    }, async () => {
      // Create subscription
      const subscription = await subscribe({
        planId: 'pro',
        billingCycle: 'monthly',
      });

      expect(subscription.id).toBeDefined();
      expect(subscription.status).toBe('active');
      expect(subscription.planId).toBe('pro');

      // Fetch subscription
      const fetched = await getSubscription(subscription.id);
      expect(fetched?.planId).toBe('pro');

      // Cancel subscription
      const cancelled = await cancelSubscription({ reason: 'Testing' });
      expect(cancelled.status).toBe('cancelled');

      // Verify in database
      const doc = await client.db()
        .collection('subscriptions')
        .findOne({ _id: subscription.id });
      expect(doc?.status).toBe('cancelled');
    });
  });

  it('prevents duplicate subscriptions', async () => {
    await ctx.run({
      requestId: 'test',
      startTime: Date.now(),
      isAuthenticated: true,
      tenantId: 'tenant-456',
      userId: 'user-456',
      permissions: ['billing:write'],
    }, async () => {
      // First subscription succeeds
      await subscribe({ planId: 'pro', billingCycle: 'monthly' });

      // Second subscription fails
      await expect(
        subscribe({ planId: 'enterprise', billingCycle: 'yearly' })
      ).rejects.toThrow('already has an active subscription');
    });
  });
});
```

### 4. E2E Tests

Test full request flow in starter.

**Location:** `starters/saaskit/e2e/*.test.ts`

```typescript
// starters/saaskit/e2e/billing.e2e.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../src/server';

describe('Billing API E2E', () => {
  let server: ReturnType<typeof createServer>;
  let baseUrl: string;
  let authToken: string;

  beforeAll(async () => {
    server = await createServer({ port: 0 });
    baseUrl = `http://localhost:${server.port}`;

    // Create test user and get token
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }),
    });
    const { token } = await res.json();
    authToken = token;
  });

  afterAll(async () => {
    await server.close();
  });

  it('creates subscription via API', async () => {
    const res = await fetch(`${baseUrl}/api/billing/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        planId: 'pro',
        billingCycle: 'monthly',
      }),
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.planId).toBe('pro');
    expect(body.data.status).toBe('active');
  });

  it('returns 401 without auth', async () => {
    const res = await fetch(`${baseUrl}/api/billing/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: 'pro' }),
    });

    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid input', async () => {
    const res = await fetch(`${baseUrl}/api/billing/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        planId: 'invalid-plan',
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_FAILED');
  });
});
```

---

## Test Utilities Package

### Structure

```
packages/test-utils/
├── src/
│   ├── index.ts
│   ├── context.ts      # Context mocking
│   ├── database.ts     # MongoDB Memory Server
│   ├── events.ts       # Event mocking/assertions
│   ├── cache.ts        # Cache mocking
│   ├── http.ts         # HTTP request helpers
│   └── fixtures/
│       ├── index.ts
│       ├── user.ts
│       ├── tenant.ts
│       └── subscription.ts
├── package.json
└── tsconfig.json
```

### Context Mocking

```typescript
// packages/test-utils/src/context.ts

import { vi } from 'vitest';
import type { RequestContext } from '@unisane/kernel';

export function createMockContext(
  overrides: Partial<RequestContext> = {}
): RequestContext {
  return {
    requestId: 'test-request-id',
    startTime: Date.now(),
    isAuthenticated: true,
    authMethod: 'session',
    userId: 'test-user-id',
    tenantId: 'test-tenant-id',
    role: 'owner',
    permissions: ['*'],
    ...overrides,
  };
}

export function mockKernelContext(overrides: Partial<RequestContext> = {}) {
  const mockCtx = createMockContext(overrides);

  vi.mock('@unisane/kernel', async (importOriginal) => {
    const original = await importOriginal<typeof import('@unisane/kernel')>();
    return {
      ...original,
      ctx: {
        get: vi.fn(() => mockCtx),
        tryGet: vi.fn(() => mockCtx),
        run: vi.fn((_, fn) => fn()),
        set: vi.fn(),
      },
    };
  });

  return mockCtx;
}
```

### Database Helpers

```typescript
// packages/test-utils/src/database.ts

import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';

let mongod: MongoMemoryServer;
let client: MongoClient;
let db: Db;

export async function setupTestDb(): Promise<Db> {
  mongod = await MongoMemoryServer.create();
  client = new MongoClient(mongod.getUri());
  await client.connect();
  db = client.db();
  return db;
}

export async function teardownTestDb(): Promise<void> {
  await client?.close();
  await mongod?.stop();
}

export function getTestDb(): Db {
  if (!db) throw new Error('Test DB not initialized');
  return db;
}

export async function clearCollections(...names: string[]): Promise<void> {
  await Promise.all(
    names.map(name => db.collection(name).deleteMany({}))
  );
}
```

### Event Mocking

```typescript
// packages/test-utils/src/events.ts

import { vi } from 'vitest';
import type { EventType, EventPayload } from '@unisane/kernel';

export function createMockEvents() {
  const emitted: Array<{ type: string; payload: unknown }> = [];

  const mock = {
    emit: vi.fn(async (type: string, payload: unknown) => {
      emitted.push({ type, payload });
    }),
    on: vi.fn(),
    emitted: (type?: string) => {
      if (!type) return emitted;
      return emitted.filter(e => e.type === type);
    },
    wasEmitted: (type: string) => emitted.some(e => e.type === type),
    clear: () => emitted.length = 0,
  };

  vi.mock('@unisane/kernel', async (importOriginal) => {
    const original = await importOriginal();
    return { ...original, events: mock };
  });

  return mock;
}

// Usage in tests
const mockEvents = createMockEvents();
await someService();
expect(mockEvents.wasEmitted('billing.subscription.created')).toBe(true);
```

### Fixtures

```typescript
// packages/test-utils/src/fixtures/user.ts

import { nanoid } from 'nanoid';

export interface UserFixture {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
}

export function createUserFixture(
  overrides: Partial<UserFixture> = {}
): UserFixture {
  return {
    id: `usr_${nanoid(16)}`,
    email: `test-${nanoid(8)}@example.com`,
    name: 'Test User',
    passwordHash: 'hashed_password',
    createdAt: new Date(),
    ...overrides,
  };
}

// packages/test-utils/src/fixtures/subscription.ts

export interface SubscriptionFixture {
  id: string;
  tenantId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'past_due';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
}

export function createSubscriptionFixture(
  overrides: Partial<SubscriptionFixture> = {}
): SubscriptionFixture {
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return {
    id: `sub_${nanoid(16)}`,
    tenantId: `ten_${nanoid(16)}`,
    planId: 'pro',
    status: 'active',
    billingCycle: 'monthly',
    currentPeriodStart: now,
    currentPeriodEnd: nextMonth,
    createdAt: now,
    ...overrides,
  };
}
```

---

## Vitest Configuration

### Workspace Config

```typescript
// vitest.workspace.ts

import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  // Unit tests (fast, no database)
  {
    extends: './vitest.config.ts',
    test: {
      name: 'unit',
      include: ['packages/**/__tests__/unit/**/*.test.ts'],
      environment: 'node',
    },
  },
  // Schema tests (fast, no deps)
  {
    extends: './vitest.config.ts',
    test: {
      name: 'schema',
      include: ['packages/**/__tests__/schemas.test.ts'],
      environment: 'node',
    },
  },
  // Integration tests (slower, with database)
  {
    extends: './vitest.config.ts',
    test: {
      name: 'integration',
      include: ['packages/**/__tests__/integration/**/*.test.ts'],
      environment: 'node',
      poolOptions: {
        threads: { singleThread: true }, // Serial for DB tests
      },
    },
  },
  // E2E tests (slowest, full server)
  {
    extends: './vitest.config.ts',
    test: {
      name: 'e2e',
      include: ['starters/**/__tests__/e2e/**/*.test.ts'],
      environment: 'node',
      testTimeout: 30000,
    },
  },
]);
```

### Base Config

```typescript
// vitest.config.ts

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules',
        '**/__tests__/**',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@unisane/kernel': path.resolve(__dirname, 'packages/kernel/src'),
      '@unisane/gateway': path.resolve(__dirname, 'packages/gateway/src'),
      // ... other aliases
    },
  },
});
```

---

## Running Tests

```bash
# Run all tests
pnpm test

# Run specific test type
pnpm test --project=unit
pnpm test --project=schema
pnpm test --project=integration
pnpm test --project=e2e

# Run specific package
pnpm --filter @unisane/billing test

# Run with coverage
pnpm test -- --coverage

# Watch mode
pnpm test -- --watch

# Run single file
pnpm test packages/billing/__tests__/unit/subscription.service.test.ts
```

---

## CI Configuration

```yaml
# .github/workflows/test.yml

name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install

      # Fast tests first
      - name: Schema Tests
        run: pnpm test --project=schema

      - name: Unit Tests
        run: pnpm test --project=unit

      # Slower tests after
      - name: Integration Tests
        run: pnpm test --project=integration

      - name: E2E Tests
        run: pnpm test --project=e2e

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Best Practices

### 1. Test Naming

```typescript
// Good: Descriptive, behavior-focused
it('creates subscription for tenant without existing subscription', ...);
it('throws SubscriptionAlreadyExistsError when tenant has active subscription', ...);
it('emits billing.subscription.created event on success', ...);

// Bad: Implementation-focused
it('calls repo.create', ...);
it('works correctly', ...);
```

### 2. Arrange-Act-Assert

```typescript
it('cancels subscription', async () => {
  // Arrange
  mockRepo.findByTenant.mockResolvedValue({
    id: 'sub-123',
    status: 'active',
  });

  // Act
  const result = await cancelSubscription({ reason: 'Testing' });

  // Assert
  expect(result.status).toBe('cancelled');
  expect(mockRepo.update).toHaveBeenCalledWith(
    'sub-123',
    expect.objectContaining({ status: 'cancelled' })
  );
});
```

### 3. Test Data Factories

```typescript
// Good: Use factories
const user = createUserFixture({ email: 'specific@test.com' });
const subscription = createSubscriptionFixture({ planId: 'enterprise' });

// Bad: Hardcoded data everywhere
const user = {
  id: 'usr_abc123',
  email: 'test@test.com',
  // ... 10 more fields
};
```

### 4. Isolated Tests

```typescript
// Good: Each test is independent
beforeEach(() => {
  vi.clearAllMocks();
  // Reset state
});

// Bad: Tests depend on each other
let subscription; // Shared state across tests
```

### 5. Test Error Paths

```typescript
describe('error handling', () => {
  it('throws NotFoundError when subscription does not exist', ...);
  it('throws AuthorizationError without permission', ...);
  it('throws ValidationError for invalid input', ...);
});
```

---

**Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)
