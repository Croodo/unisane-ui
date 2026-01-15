# Phase 5: Testing

> **For LLMs**: Establish test infrastructure and increase coverage to 70%.

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Status** | Blocked |
| **Dependencies** | Phase 4 (observability) |
| **Blocks** | Phase 6 (documentation) |
| **Target Coverage** | 70% overall, 90% for critical paths |

---

## Prerequisites Check

Before starting this phase:
- Phase 0-4 complete
- Observability in place (helps debug test failures)
- Decoupling complete (enables unit testing)

---

## Test Strategy

### Test Pyramid

```
        ┌─────────────┐
        │   E2E (10%) │  ← Few, expensive, slow
        ├─────────────┤
        │Integration  │  ← More, test boundaries
        │    (30%)    │
        ├─────────────┤
        │   Unit      │  ← Many, fast, cheap
        │   (60%)     │
        └─────────────┘
```

### Coverage Targets by Layer

| Layer | Target | Critical Paths |
|-------|--------|----------------|
| Kernel | 80% | Ports, cache, events |
| Gateway | 70% | Auth, handlers |
| Adapters | 70% | All public methods |
| Modules | 70% | Service layer, domain logic |
| Contracts | 90% | Schema validation |

---

## Tasks

### 1. Set Up Test Infrastructure

**Test Framework Config**:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/test/**',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
    setupFiles: ['./test/setup.ts'],
  },
});
```

**Test Setup**:
```typescript
// test/setup.ts
import { beforeEach, afterEach, vi } from 'vitest';
import { mockPorts, resetPorts } from './mocks/ports';

beforeEach(() => {
  // Reset all mocks
  vi.clearAllMocks();

  // Set up port mocks
  mockPorts();
});

afterEach(() => {
  // Clean up
  resetPorts();
});
```

**Checklist**:
- [ ] Add vitest to devDependencies
- [ ] Create `vitest.config.ts`
- [ ] Create `test/setup.ts`
- [ ] Add test scripts to package.json
- [ ] Configure coverage thresholds

---

### 2. Create Port Mocks

**Why**: With ports, we can easily mock cross-module dependencies.

```typescript
// test/mocks/ports.ts
import { vi } from 'vitest';
import {
  setFlagsPort,
  setBillingPort,
  setCreditsPort,
  setAuditPort,
  setUsagePort,
  setNotifyPort,
  setTenantsQueryPort,
} from '@unisane/kernel';

export const mockFlagsPort = {
  isEnabled: vi.fn().mockResolvedValue(true),
  getAllFlags: vi.fn().mockResolvedValue({}),
};

export const mockBillingPort = {
  getSubscriptionStatus: vi.fn().mockResolvedValue({ hasActiveSubscription: true }),
  createCheckoutSession: vi.fn().mockResolvedValue({ id: 'session_123', url: 'https://...' }),
};

export const mockCreditsPort = {
  consume: vi.fn().mockResolvedValue({ remaining: 100 }),
  grant: vi.fn().mockResolvedValue({ newBalance: 200 }),
  getBalance: vi.fn().mockResolvedValue({ available: 100, reserved: 0, expiring: [] }),
  hasSufficient: vi.fn().mockResolvedValue(true),
};

export const mockAuditPort = {
  log: vi.fn().mockResolvedValue(undefined),
  query: vi.fn().mockResolvedValue({ entries: [], total: 0 }),
};

export const mockUsagePort = {
  record: vi.fn().mockResolvedValue(undefined),
  getUsage: vi.fn().mockResolvedValue([]),
  getCurrentPeriodUsage: vi.fn().mockResolvedValue({ used: 0, limit: null }),
};

export const mockNotifyPort = {
  sendEmail: vi.fn().mockResolvedValue({ messageId: 'msg_123' }),
  sendInApp: vi.fn().mockResolvedValue({ notificationId: 'notif_123' }),
  sendWebhook: vi.fn().mockResolvedValue({ delivered: true }),
};

export const mockTenantsQueryPort = {
  getById: vi.fn().mockResolvedValue({ id: 'tenant_123', name: 'Test', status: 'active' }),
  getByIds: vi.fn().mockResolvedValue(new Map()),
  isActive: vi.fn().mockResolvedValue(true),
  getSubscriptionStatus: vi.fn().mockResolvedValue({ hasActiveSubscription: true }),
};

export function mockPorts(): void {
  setFlagsPort(mockFlagsPort);
  setBillingPort(mockBillingPort);
  setCreditsPort(mockCreditsPort);
  setAuditPort(mockAuditPort);
  setUsagePort(mockUsagePort);
  setNotifyPort(mockNotifyPort);
  setTenantsQueryPort(mockTenantsQueryPort);
}

export function resetPorts(): void {
  // Reset all mock implementations
  Object.values(mockFlagsPort).forEach(fn => fn.mockClear());
  Object.values(mockBillingPort).forEach(fn => fn.mockClear());
  Object.values(mockCreditsPort).forEach(fn => fn.mockClear());
  Object.values(mockAuditPort).forEach(fn => fn.mockClear());
  Object.values(mockUsagePort).forEach(fn => fn.mockClear());
  Object.values(mockNotifyPort).forEach(fn => fn.mockClear());
  Object.values(mockTenantsQueryPort).forEach(fn => fn.mockClear());
}
```

**Checklist**:
- [ ] Create mocks for all 8 ports
- [ ] Add `mockPorts()` to test setup
- [ ] Add `resetPorts()` to test teardown
- [ ] Export individual mocks for custom behavior

---

### 3. Write Unit Tests for Modules

**Example: AI Module**:
```typescript
// packages/modules/ai/src/service/generate.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { generate } from './generate';
import { mockFlagsPort, mockCreditsPort } from '@test/mocks/ports';

describe('generate', () => {
  const defaultArgs = {
    scopeId: 'scope_123',
    prompt: 'Hello',
    model: 'gpt-4',
    estimatedTokens: 100,
  };

  describe('when feature is disabled', () => {
    beforeEach(() => {
      mockFlagsPort.isEnabled.mockResolvedValue(false);
    });

    it('throws FeatureDisabledError', async () => {
      await expect(generate(defaultArgs)).rejects.toThrow('FeatureDisabledError');
    });

    it('does not consume credits', async () => {
      try {
        await generate(defaultArgs);
      } catch {}
      expect(mockCreditsPort.consume).not.toHaveBeenCalled();
    });
  });

  describe('when credits are insufficient', () => {
    beforeEach(() => {
      mockFlagsPort.isEnabled.mockResolvedValue(true);
      mockCreditsPort.hasSufficient.mockResolvedValue(false);
    });

    it('throws InsufficientCreditsError', async () => {
      await expect(generate(defaultArgs)).rejects.toThrow('InsufficientCreditsError');
    });
  });

  describe('when all checks pass', () => {
    beforeEach(() => {
      mockFlagsPort.isEnabled.mockResolvedValue(true);
      mockCreditsPort.hasSufficient.mockResolvedValue(true);
    });

    it('generates content', async () => {
      const result = await generate(defaultArgs);
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
    });

    it('consumes credits', async () => {
      await generate(defaultArgs);
      expect(mockCreditsPort.consume).toHaveBeenCalledWith({
        scopeId: defaultArgs.scopeId,
        amount: expect.any(Number),
        reason: expect.stringContaining('generate'),
      });
    });
  });
});
```

**Checklist**:
- [ ] Write tests for each module's service layer
- [ ] Test error paths
- [ ] Test port interactions
- [ ] Aim for 70% coverage per module

---

### 4. Write Integration Tests for Adapters

**Example: Stripe Adapter**:
```typescript
// packages/adapters/billing-stripe/src/index.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createStripeAdapter } from './index';
import Stripe from 'stripe';

// Use Stripe test mode
const stripe = new Stripe(process.env.STRIPE_TEST_KEY!, {
  apiVersion: '2023-10-16',
});

describe('StripeAdapter (integration)', () => {
  const adapter = createStripeAdapter({
    secretKey: process.env.STRIPE_TEST_KEY!,
  });

  describe('createCheckoutSession', () => {
    it('creates a valid checkout session', async () => {
      const session = await adapter.createCheckoutSession({
        priceId: 'price_test123',
        scopeId: 'scope_test',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(session.id).toMatch(/^cs_test_/);
      expect(session.url).toContain('checkout.stripe.com');
    });
  });

  describe('getSubscription', () => {
    it('returns null for non-existent subscription', async () => {
      const result = await adapter.getSubscription('sub_nonexistent');
      expect(result).toBeNull();
    });
  });
});
```

**Checklist**:
- [ ] Write integration tests for each adapter
- [ ] Use test/sandbox credentials
- [ ] Test both success and error paths
- [ ] Add to CI with secrets

---

### 5. Write E2E Tests for Critical Flows

**Example: Auth Flow**:
```typescript
// test/e2e/auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, TestApp } from './utils';

describe('Auth Flow (E2E)', () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('signup → verify → login', () => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPass123!';

    it('allows user to sign up', async () => {
      const response = await app.request('POST', '/api/auth/signup', {
        email: testEmail,
        password: testPassword,
      });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe(testEmail);
    });

    it('sends verification email', async () => {
      // Check email was sent (via test email service)
      const emails = await app.getTestEmails(testEmail);
      expect(emails).toHaveLength(1);
      expect(emails[0].subject).toContain('Verify');
    });

    it('allows login after verification', async () => {
      // Extract verification token from email
      const emails = await app.getTestEmails(testEmail);
      const token = extractVerificationToken(emails[0].body);

      // Verify email
      await app.request('POST', '/api/auth/verify', { token });

      // Login
      const response = await app.request('POST', '/api/auth/login', {
        email: testEmail,
        password: testPassword,
      });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });
  });
});
```

**Critical Flows to Test**:
- [ ] Auth: signup → verify → login → refresh
- [ ] Billing: subscribe → webhook → access
- [ ] AI: generate with credits check
- [ ] Tenant: create → invite → join

---

### 6. Add CI Pipeline

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:unit
      - uses: codecov/codecov-action@v3

  integration:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017
      redis:
        image: redis:7
        ports:
          - 6379:6379
    env:
      STRIPE_TEST_KEY: ${{ secrets.STRIPE_TEST_KEY }}
      MONGODB_URI: mongodb://localhost:27017/test
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:integration

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test:e2e
```

**Checklist**:
- [ ] Create CI workflow
- [ ] Add unit test job
- [ ] Add integration test job with services
- [ ] Add E2E test job
- [ ] Configure coverage reporting

---

## Test Scripts

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --coverage",
    "test:watch": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "vitest run --config vitest.e2e.config.ts",
    "test:coverage": "vitest run --coverage --coverage.reporter=lcov"
  }
}
```

---

## Verification

```bash
# Run all tests
pnpm test

# Check coverage
pnpm test:coverage

# Coverage should show:
# - Overall: ≥70%
# - Kernel: ≥80%
# - Critical paths: ≥90%
```

---

## Success Criteria

Phase 5 is complete when:

1. Test infrastructure set up
2. Port mocks available
3. Unit tests for all modules (70% coverage)
4. Integration tests for adapters
5. E2E tests for critical flows
6. CI pipeline runs tests
7. Coverage thresholds enforced

---

## Next Phase

After Phase 5 is complete, proceed to **[PHASE-6-DOCUMENTATION.md](./PHASE-6-DOCUMENTATION.md)** for final documentation.

---

> **Last Updated**: 2025-01-15
