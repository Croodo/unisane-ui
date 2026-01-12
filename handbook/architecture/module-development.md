# Module Development Guide

> **Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)

Complete guide for creating new modules in the Unisane platform based on current implementation patterns (January 2026).

---

## Table of Contents

1. [Overview](#overview)
2. [Module Structure](#module-structure)
3. [Creating a New Module](#creating-a-new-module)
4. [Domain Layer](#domain-layer)
5. [Data Layer](#data-layer)
6. [Service Layer](#service-layer)
7. [Contract Definition](#contract-definition)
8. [Event Integration](#event-integration)
9. [Testing Your Module](#testing-your-module)
10. [Module Checklist](#module-checklist)

---

## Overview

Modules are self-contained business logic packages following clean architecture principles. Each module:

- Has a single responsibility
- Exposes a clean public API through barrel exports
- Manages its own data via repository pattern
- Communicates via typed events for side effects
- Uses contract-first codegen for API routes

```
┌─────────────────────────────────────────────────────────────┐
│                    MODULE ANATOMY                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    PUBLIC API                        │    │
│  │              index.ts (exports)                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  SERVICE LAYER                       │    │
│  │         Business logic, orchestration                │    │
│  │         service/{operation}.ts                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   DATA LAYER                         │    │
│  │       Repository pattern with MongoDB                │    │
│  │       data/*.repository.mongo.ts                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  DOMAIN LAYER                        │    │
│  │           Types, Zod schemas, constants              │    │
│  │                 domain/                              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Statistics

Based on current implementation (January 2026):
- **15 business modules** in production
- **~21,000 LOC** of module business logic
- **800+ tests** passing (241 kernel, 100 gateway, 11 module tests)
- **51 E2E tests** with Playwright
- **Repository pattern** with base utilities
- **Typed events** with Zod schemas (35+ events in registry)

---

## Module Structure

### Current Module Organization

All 15 production modules follow this structure:

```
packages/modules/{module}/
├── package.json
├── tsconfig.json
├── README.md                    # Required documentation
│
├── src/
│   ├── index.ts                 # Public API exports
│   │
│   ├── service/                 # Business logic
│   │   ├── {operation}.ts       # One operation per file
│   │   └── index.ts             # Barrel export
│   │
│   ├── data/                    # Data access
│   │   └── {entity}.repository.mongo.ts
│   │
│   └── domain/                  # Types & schemas
│       ├── types.ts             # TypeScript types
│       ├── schemas.ts           # Zod schemas (if API module)
│       ├── constants.ts         # Enums, magic values
│       └── errors.ts            # Domain errors (optional)
│
└── test/
    └── {service}.test.ts        # Vitest tests
```

### Example: @unisane/credits Module

```
packages/modules/credits/
├── src/
│   ├── index.ts
│   ├── service/
│   │   ├── addCredits.ts
│   │   ├── deductCredits.ts
│   │   ├── getBalance.ts
│   │   └── index.ts
│   ├── data/
│   │   └── transactions.repository.mongo.ts
│   └── domain/
│       ├── types.ts
│       ├── constants.ts
│       └── errors.ts
└── test/
    └── credits.test.ts          # 49 tests passing
```

---

## Creating a New Module

### Step 1: Create Package Structure

```bash
# Create directory structure
mkdir -p packages/modules/rewards/src/{service,data,domain}
mkdir -p packages/modules/rewards/test

# Create package.json
cat > packages/modules/rewards/package.json << 'EOF'
{
  "name": "@unisane/rewards",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@unisane/kernel": "workspace:*"
  },
  "devDependencies": {
    "@unisane/test-utils": "workspace:*",
    "typescript": "^5.9.0",
    "vitest": "^2.0.0"
  }
}
EOF

# Create tsconfig.json
cat > packages/modules/rewards/tsconfig.json << 'EOF'
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
EOF
```

### Step 2: Create Public API (index.ts)

```typescript
// packages/modules/rewards/src/index.ts

/**
 * @module @unisane/rewards
 * @description Rewards and loyalty points management
 */

// ═══════════════════════════════════════════════════════════════
// SERVICE EXPORTS
// ═══════════════════════════════════════════════════════════════
export {
  getBalance,
  addCredits,
  deductCredits,
  getHistory,
} from "./service";

// ═══════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════
export type {
  RewardBalance,
  RewardTransaction,
  AddCreditsInput,
  DeductCreditsInput,
} from "./domain/types";

// ═══════════════════════════════════════════════════════════════
// CONSTANT EXPORTS
// ═══════════════════════════════════════════════════════════════
export { REWARD_TYPES } from "./domain/constants";
```

---

## Domain Layer

The domain layer defines data shapes, validation schemas, and business constants.

### File Structure

```
domain/
├── types.ts        # TypeScript types (internal models)
├── schemas.ts      # Zod schemas (API validation)
├── constants.ts    # Enums, magic values
└── errors.ts       # Domain-specific errors (optional)
```

### domain/types.ts — Internal Types

```typescript
// packages/modules/rewards/src/domain/types.ts

/**
 * Database document as stored in MongoDB
 */
export type RewardTransactionDoc = {
  _id: string;
  tenantId: string;
  type: "credit" | "debit";
  amount: number;
  balance: number;      // Balance after this transaction
  reason: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
};

/**
 * View model for API responses
 */
export type RewardTransaction = {
  id: string;
  type: "credit" | "debit";
  amount: number;
  balance: number;
  reason: string;
  createdAt: Date;
};

/**
 * Aggregated balance view
 */
export type RewardBalance = {
  balance: number;
  totalCredits: number;
  totalDebits: number;
};

/**
 * Service function arguments
 */
export type AddCreditsInput = {
  tenantId: string;
  amount: number;
  reason: string;
  metadata?: Record<string, unknown>;
};

export type DeductCreditsInput = {
  tenantId: string;
  amount: number;
  reason: string;
  metadata?: Record<string, unknown>;
};
```

### domain/schemas.ts — Zod Validation (for API modules)

```typescript
// packages/modules/rewards/src/domain/schemas.ts
import { z } from "zod";

/**
 * Add credits input schema
 */
export const ZAddCredits = z.object({
  amount: z.number().int().positive(),
  reason: z.string().min(2).max(200),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Deduct credits input schema
 */
export const ZDeductCredits = z.object({
  amount: z.number().int().positive(),
  reason: z.string().min(2).max(200),
  metadata: z.record(z.unknown()).optional(),
});

// Inferred types for convenience
export type AddCreditsInput = z.infer<typeof ZAddCredits>;
export type DeductCreditsInput = z.infer<typeof ZDeductCredits>;
```

### domain/constants.ts

```typescript
// packages/modules/rewards/src/domain/constants.ts

export const REWARD_TYPES = {
  SIGNUP_BONUS: "signup_bonus",
  REFERRAL: "referral",
  MANUAL: "manual",
} as const;

export const DEFAULT_EXPIRY_DAYS = 365;
```

### domain/errors.ts (optional)

```typescript
// packages/modules/rewards/src/domain/errors.ts
import { DomainError } from "@unisane/kernel";

export class InsufficientRewardsError extends DomainError {
  constructor(requested: number, available: number) {
    super(
      "INSUFFICIENT_REWARDS",
      `Requested ${requested} but only ${available} available`
    );
  }
}
```

---

## Data Layer

The data layer implements repository pattern with MongoDB.

### Current Pattern (2026)

After P1-005 implementation, use base repository utilities for new modules:

```typescript
// packages/modules/rewards/src/data/transactions.repository.mongo.ts

import { col } from "@unisane/kernel";
import type { RewardTransactionDoc, RewardBalance } from "../domain/types";

const collection = () => col<RewardTransactionDoc>("reward_transactions");

// ═══════════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════════

export async function getBalance(tenantId: string): Promise<RewardBalance> {
  const [result] = await collection()
    .aggregate<RewardBalance>([
      { $match: { tenantId } },
      {
        $group: {
          _id: null,
          totalCredits: {
            $sum: { $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0] },
          },
          totalDebits: {
            $sum: { $cond: [{ $eq: ["$type", "debit"] }, "$amount", 0] },
          },
        },
      },
      {
        $project: {
          totalCredits: 1,
          totalDebits: 1,
          balance: { $subtract: ["$totalCredits", "$totalDebits"] },
        },
      },
    ])
    .toArray();

  return (
    result ?? {
      balance: 0,
      totalCredits: 0,
      totalDebits: 0,
    }
  );
}

export async function getLatestTransaction(
  tenantId: string
): Promise<RewardTransactionDoc | null> {
  return collection()
    .findOne({ tenantId }, { sort: { createdAt: -1 } });
}

// ═══════════════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════════════

export async function insertTransaction(
  data: Omit<RewardTransactionDoc, "_id" | "createdAt">
): Promise<{ id: string }> {
  const doc: RewardTransactionDoc = {
    _id: crypto.randomUUID(),
    ...data,
    createdAt: new Date(),
  };

  await collection().insertOne(doc);

  return { id: doc._id };
}

// ═══════════════════════════════════════════════════════════════
// PAGINATION
// ═══════════════════════════════════════════════════════════════

export async function listTransactions(options: {
  tenantId: string;
  cursor?: string;
  limit: number;
}): Promise<{ items: RewardTransactionDoc[]; nextCursor?: string }> {
  const filter: Record<string, unknown> = { tenantId: options.tenantId };

  if (options.cursor) {
    filter._id = { $lt: options.cursor };
  }

  const docs = await collection()
    .find(filter)
    .sort({ _id: -1 })
    .limit(options.limit + 1)
    .toArray();

  const hasMore = docs.length > options.limit;
  const items = hasMore ? docs.slice(0, -1) : docs;

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1]._id : undefined,
  };
}
```

### Database-Agnostic Pattern

**CRITICAL**: Follow these rules for future database support (PostgreSQL, MySQL):

```typescript
// ✅ CORRECT - Use string IDs in domain types
export type RewardTransaction = {
  id: string;           // NOT ObjectId
  tenantId: string;
  amount: number;
  createdAt: Date;      // Date objects are universal
};

// ✅ CORRECT - Import from public repository
import { RewardRepo } from "../data/rewards.repository";

// ✅ CORRECT - Let repository handle ID conversion
const transaction = await RewardRepo.findById(id);

// ❌ WRONG - Don't use MongoDB-specific types in service layer
import { ObjectId } from "mongodb";
const doc = await col("rewards").findOne({ _id: new ObjectId(id) });
```

### Using Base Repository Utilities

For simple CRUD operations, use kernel base repository (implemented in P1-005):

```typescript
import { createTenantScopedRepository } from "@unisane/kernel";

const rewardsRepo = createTenantScopedRepository<
  RewardDoc,
  RewardView,
  CreateInput,
  UpdateInput
>({
  collectionName: "rewards",
  mapDocToView: (doc) => ({
    id: String(doc._id),
    amount: doc.amount,
    createdAt: doc.createdAt,
  }),
  buildDocFromInput: (input, now) => ({
    ...input,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }),
  buildUpdateSet: (update, now) => ({
    ...update,
    updatedAt: now,
  }),
});

// Use generated methods
export const findById = rewardsRepo.findById;
export const findMany = rewardsRepo.findMany;
export const create = rewardsRepo.create;
export const softDelete = rewardsRepo.softDelete;
```

---

## Service Layer

Service layer implements business logic. Each operation gets its own file.

### Service File Pattern

```
service/
├── getBalance.ts       # export async function getBalance()
├── addCredits.ts       # export async function addCredits()
├── deductCredits.ts    # export async function deductCredits()
├── getHistory.ts       # export async function getHistory()
└── index.ts            # Barrel export
```

### Example Service File

```typescript
// packages/modules/rewards/src/service/addCredits.ts

import { getTenantId, getUserId, logger } from "@unisane/kernel";
import { emitTyped } from "@unisane/kernel";
import * as RewardRepo from "../data/transactions.repository.mongo";
import type { AddCreditsInput } from "../domain/types";
import { ERR } from "@unisane/kernel";

/**
 * Add credits to a tenant's balance
 */
export async function addCredits(
  input: AddCreditsInput
): Promise<{ id: string; balance: number }> {
  const tenantId = getTenantId(); // Throws if not set
  const userId = getUserId();

  // Validation
  if (input.amount <= 0) {
    throw ERR.invalidInput("Amount must be positive");
  }

  // Get latest balance
  const latest = await RewardRepo.getLatestTransaction(tenantId);
  const previousBalance = latest?.balance ?? 0;
  const newBalance = previousBalance + input.amount;

  // Create transaction
  const result = await RewardRepo.insertTransaction({
    tenantId,
    type: "credit",
    amount: input.amount,
    balance: newBalance,
    reason: input.reason,
    metadata: input.metadata,
  });

  logger.info("credits.added", {
    tenantId,
    userId,
    amount: input.amount,
    balance: newBalance,
  });

  // Emit typed event (P2-002 implementation)
  await emitTyped("credits.added", {
    tenantId,
    userId,
    transactionId: result.id,
    amount: input.amount,
    balance: newBalance,
  });

  return { id: result.id, balance: newBalance };
}
```

### Service Barrel Export

```typescript
// packages/modules/rewards/src/service/index.ts

export { getBalance } from "./getBalance";
export { addCredits } from "./addCredits";
export { deductCredits } from "./deductCredits";
export { getHistory } from "./getHistory";
```

### Context Usage Pattern

Always use `getTenantId()` and `getUserId()` at the start of service functions:

```typescript
export async function someOperation(input: Input) {
  const tenantId = getTenantId(); // Returns string, throws if not set
  const userId = getUserId();     // Returns string, throws if not set

  // Use for data scoping
  const data = await repo.findByTenant(tenantId);

  // Include in logs for tracing
  logger.info("operation.completed", { tenantId, userId });

  return data;
}
```

---

## Contract Definition

For modules that expose API endpoints, define contracts for codegen.

### Contract File

```typescript
// starters/saaskit/src/contracts/rewards.contract.ts

import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { withMeta, defineOpMeta } from "@/src/contracts/meta";
import { ZAddCredits, ZDeductCredits } from "@unisane/rewards/domain/schemas";

const c = initContract();

export const rewardsContract = c.router({
  // Get balance
  getBalance: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/rewards/balance",
      responses: {
        200: z.object({
          balance: z.number(),
          totalCredits: z.number(),
          totalDebits: z.number(),
        }),
      },
    },
    defineOpMeta({
      op: "rewards.getBalance",
      requireUser: true,
      perm: "rewards:read",
      service: {
        importPath: "@unisane/rewards",
        fn: "getBalance",
        invoke: "object",
        callArgs: [],
      },
    })
  ),

  // Add credits
  addCredits: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/rewards/add",
      body: ZAddCredits,
      responses: {
        201: z.object({
          id: z.string(),
          balance: z.number(),
        }),
      },
    },
    defineOpMeta({
      op: "rewards.addCredits",
      requireUser: true,
      perm: "rewards:write",
      idempotent: true,
      service: {
        importPath: "@unisane/rewards",
        fn: "addCredits",
        invoke: "object",
        callArgs: [{ name: "input", from: "body" }],
      },
      invalidate: [{ kind: "prefix", key: ["rewards", "balance"] }],
    })
  ),
});
```

### Generated Route

Running `npm run routes:gen` creates:

```typescript
// starters/saaskit/src/app/api/rest/v1/rewards/balance/route.ts
/* AUTO-GENERATED — DO NOT EDIT */
import { makeHandler } from "@unisane/gateway";
import { getBalance } from "@unisane/rewards";

export const GET = makeHandler(
  {
    op: "rewards.getBalance",
    requireUser: true,
    perm: "rewards:read",
  },
  async ({ ctx }) => {
    const result = await getBalance();
    return result;
  }
);

export const runtime = "nodejs";
```

### Generated React Hook

Running `npm run sdk:gen` creates:

```typescript
// starters/saaskit/src/sdk/hooks/generated/domains/rewards.hooks.ts
/* AUTO-GENERATED — DO NOT EDIT */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useRewardsGetBalance(options?) {
  return useQuery({
    queryKey: ["rewards", "balance"],
    queryFn: async () => {
      const api = await browserApi();
      return unwrapResponse(await api.rewards.getBalance());
    },
    ...options,
  });
}

export function useRewardsAddCredits(options?) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (variables) => {
      const api = await browserApi();
      return unwrapResponse(await api.rewards.addCredits({ body: variables }));
    },
    onSuccess: (data, variables, context) => {
      // Auto-invalidate balance query (from metadata)
      qc.invalidateQueries({ queryKey: ["rewards", "balance"] });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}
```

---

## Event Integration

Use the typed event system (implemented in P2-002).

### Defining Events

Events are centralized in `kernel/src/events/schemas.ts`:

```typescript
// kernel/src/events/schemas.ts (registry)

import { z } from "zod";

export const EventSchemas = {
  // ... existing events

  // Rewards events
  "rewards.added": z.object({
    tenantId: z.string(),
    userId: z.string(),
    transactionId: z.string(),
    amount: z.number(),
    balance: z.number(),
  }),

  "rewards.deducted": z.object({
    tenantId: z.string(),
    userId: z.string(),
    transactionId: z.string(),
    amount: z.number(),
    balance: z.number(),
  }),
} as const;
```

### Emitting Typed Events

```typescript
import { emitTyped } from "@unisane/kernel";

// Type-safe emission - TS enforces correct payload
await emitTyped("rewards.added", {
  tenantId,
  userId,
  transactionId: result.id,
  amount: input.amount,
  balance: newBalance,
});
```

### Listening to Events

```typescript
import { onTyped } from "@unisane/kernel";

// Type-safe subscription
onTyped("rewards.added", async (event) => {
  console.log(event.payload.balance); // Typed correctly

  // Send notification
  await sendNotification({
    userId: event.payload.userId,
    message: `You received ${event.payload.amount} credits!`,
  });
});
```

---

## Testing Your Module

### Unit Tests

Use Vitest with test utils from kernel:

```typescript
// packages/modules/rewards/test/addCredits.test.ts

import { describe, it, expect, beforeEach, vi } from "vitest";
import { setContext, clearContext } from "@unisane/kernel";
import { addCredits } from "../src/service/addCredits";
import * as RewardRepo from "../src/data/transactions.repository.mongo";

vi.mock("../src/data/transactions.repository.mongo");

describe("addCredits", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set test context
    setContext({
      requestId: "test_req",
      tenantId: "test_tenant",
      userId: "test_user",
    });
  });

  afterEach(() => {
    clearContext();
  });

  it("should add credits successfully", async () => {
    vi.spyOn(RewardRepo, "getLatestTransaction").mockResolvedValue({
      _id: "tx1",
      tenantId: "test_tenant",
      type: "credit",
      amount: 100,
      balance: 100,
      reason: "Previous",
      createdAt: new Date(),
    });

    vi.spyOn(RewardRepo, "insertTransaction").mockResolvedValue({
      id: "tx2",
    });

    const result = await addCredits({
      tenantId: "test_tenant",
      amount: 50,
      reason: "Test credit",
    });

    expect(result.balance).toBe(150);
    expect(RewardRepo.insertTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "test_tenant",
        type: "credit",
        amount: 50,
        balance: 150,
      })
    );
  });

  it("should throw for negative amount", async () => {
    await expect(
      addCredits({
        tenantId: "test_tenant",
        amount: -10,
        reason: "Test",
      })
    ).rejects.toThrow("Amount must be positive");
  });
});
```

### Integration Tests

Test full flows with real database:

```typescript
// packages/modules/rewards/test/rewards.integration.test.ts

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupTestDb, teardownTestDb } from "@unisane/test-utils";
import { setContext, clearContext } from "@unisane/kernel";
import { addCredits, deductCredits, getBalance } from "../src";

describe("rewards integration", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  it("should handle credit lifecycle", async () => {
    setContext({
      requestId: "test",
      tenantId: "test_tenant",
      userId: "test_user",
    });

    // Add credits
    await addCredits({
      tenantId: "test_tenant",
      amount: 100,
      reason: "Test credit",
    });

    // Check balance
    const balance1 = await getBalance();
    expect(balance1.balance).toBe(100);

    // Deduct some
    await deductCredits({
      tenantId: "test_tenant",
      amount: 30,
      reason: "Test debit",
    });

    // Check final balance
    const balance2 = await getBalance();
    expect(balance2.balance).toBe(70);

    clearContext();
  });
});
```

### Current Test Coverage

Based on ISSUES-ROADMAP.md (P0-001):

| Module | Tests | Status |
|--------|-------|--------|
| kernel | 241 | ✅ Complete |
| gateway | 100 | ✅ Complete |
| auth | 77 | ✅ Complete |
| identity | 111 | ✅ Complete |
| tenants | 74 | ✅ Complete |
| billing | 103 | ✅ Complete |
| credits | 49 | ✅ Complete |
| flags | 65 | ✅ Complete |
| usage | 44 | ✅ Complete |
| webhooks | 42 | ✅ Complete |

---

## Module Checklist

Use this checklist when creating a new module:

### Setup
- [ ] Created package directory structure
- [ ] Added `package.json` with correct dependencies
- [ ] Added `tsconfig.json` extending base config
- [ ] Created `README.md` with module documentation

### Domain Layer
- [ ] Created `domain/types.ts` with TypeScript types
- [ ] Created `domain/schemas.ts` with Zod schemas (if API module)
- [ ] Created `domain/constants.ts` for magic values
- [ ] Created `domain/errors.ts` for domain-specific errors (if needed)
- [ ] All types use `string` for IDs (not `ObjectId`)

### Data Layer
- [ ] Created `data/{entity}.repository.mongo.ts`
- [ ] All queries use automatic tenant scoping
- [ ] Cursor-based pagination implemented
- [ ] No `ObjectId` types exposed to service layer
- [ ] Soft delete pattern used (`deletedAt` field)

### Service Layer
- [ ] Created one file per operation in `service/`
- [ ] Created `service/index.ts` barrel export
- [ ] All functions use `getTenantId()`/`getUserId()`
- [ ] No direct MongoDB imports in service files
- [ ] Proper structured logging
- [ ] Typed events emitted for mutations
- [ ] Input validation in service layer

### Public API
- [ ] `index.ts` exports all public functions and types
- [ ] Module JSDoc with `@module` and `@description`
- [ ] No internal types/functions leaked

### Contract (if API module)
- [ ] Created contract in `starters/saaskit/src/contracts/`
- [ ] Added Zod schemas for validation
- [ ] Added `defineOpMeta` for code generation
- [ ] Specified `invalidate` keys for React Query

### Events
- [ ] Added event schemas to `kernel/src/events/schemas.ts`
- [ ] Used `emitTyped()` for type-safe emission
- [ ] Used `onTyped()` for type-safe subscriptions

### Testing
- [ ] Unit tests for service functions (Vitest)
- [ ] Integration tests for critical paths
- [ ] Test fixtures created
- [ ] Mocked external dependencies

### Documentation
- [ ] **README.md** in package root (REQUIRED)
- [ ] Updated module list in ARCHITECTURE.md
- [ ] Added collection names to centralized registry (P1-006)

---

## Recent Improvements

Based on ISSUES-ROADMAP.md, these improvements are now available:

### P0-001: Test Infrastructure ✅
- 800+ tests passing across foundation and modules
- 51 E2E tests with Playwright
- Vitest configuration at monorepo root

### P1-005: Repository Base Class ✅
- `createTenantScopedRepository()` for new modules
- Common CRUD operations with soft delete
- Document mapping utilities
- Use for NEW repositories only (existing ones stable)

### P2-002: Event Schema Registry ✅
- Centralized event registry in `kernel/src/events/schemas.ts`
- Type-safe `emitTyped()` and `onTyped()` helpers
- 35+ event schemas registered
- Compile-time type checking

### P2-003: Null Handling Convention ✅
- Documented `findX()` vs `getX()` pattern
- `findX()` returns `T | null` (absence is valid)
- `getX()` returns `T` (throws if not found)

### P2-004: Transaction Support ✅
- `withTransaction()` helper in kernel
- `withRetryableTransaction()` for critical operations
- Session management handled automatically
- MongoDB replica set required

### P2-005: API Versioning ✅
- URL-based versioning (`/api/rest/v1/`)
- RFC 8594 deprecation headers
- Version lifecycle documented
- `buildDeprecationHeaders()` utility

### P2-006: Request Logging ✅
- Structured request/response logging
- Configurable body logging for security
- Sampling support for high-traffic endpoints
- Sensitive field redaction

### P2-008: Soft Delete Consistency ✅
- `softDeleteFilter()` helper in kernel
- Automatic filtering in base repository
- `hardDelete()` for GDPR compliance
- Consistent across all modules

### P2-009: Pagination Consistency ✅
- Cursor-based pagination standardized
- No `.skip()` operations (performance)
- Documented in `kernel/src/pagination/types.ts`
- All 37 modules use cursor pagination

### P2-011: Field Encryption ✅
- AES-256-GCM encryption utilities in kernel
- `encryptField()` and `decryptField()`
- `createSearchToken()` for indexed lookups
- `DATA_ENCRYPTION_KEY` env variable

---

## Summary

Follow these key principles when creating modules:

1. **One operation per service file** - Easy navigation and testing
2. **Repository pattern** - Abstract database implementation
3. **String IDs in domain types** - Database-agnostic
4. **Typed events** - Use `emitTyped()` and `onTyped()`
5. **Cursor pagination** - Performance and consistency
6. **Soft delete** - Use `softDeleteFilter()` everywhere
7. **Contract-first** - Define contracts, generate code
8. **Test comprehensively** - Unit + integration + E2E
9. **Document thoroughly** - README.md required

---

**Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)
**See Also:** [kernel.md](./kernel.md), [contracts-guide.md](./contracts-guide.md), [testing.md](./testing.md)
