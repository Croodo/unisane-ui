# Module Development Guide

> **Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)

Complete guide for creating new modules in the Unisane platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Module Layers](#module-layers)
3. [Creating a New Module](#creating-a-new-module)
4. [Module Structure](#module-structure)
5. [Domain Layer](#domain-layer)
   - [schemas.ts vs types.ts](#schemasts-vs-typests--the-critical-distinction)
   - [Avoiding Duplication](#avoiding-duplication)
6. [Service Implementation](#service-implementation)
7. [Data Layer](#data-layer)
8. [Contract Definition](#contract-definition)
9. [Event Integration](#event-integration)
10. [Testing Your Module](#testing-your-module)
11. [Module Checklist](#module-checklist)

---

## Overview

Modules are self-contained business logic packages that follow clean architecture principles. Each module:

- Has a single responsibility
- Exposes a clean public API
- Manages its own data
- Communicates via events for side effects
- Respects layer dependencies

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
│  │         service/{operation}.ts (one per fn)          │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   DATA LAYER                         │    │
│  │       Repository, models, database access            │    │
│  │              data/*.repository.ts                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  DOMAIN LAYER                        │    │
│  │           Types, schemas, constants                  │    │
│  │                 domain/types.ts                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Module Layers

Modules are organized into layers based on their dependencies. **Lower layers cannot import from higher layers.**

```
Layer 0: KERNEL (foundation)
├── ctx, db, redis, events, logger, errors
│
Layer 1: GATEWAY (API infrastructure)
├── handler, middleware, auth, rate-limit
│
Layer 2: FOUNDATION (no business deps)
├── identity, settings, storage
│
Layer 3: CORE (basic business)
├── tenants, auth, sso
│
Layer 4: BUSINESS (feature modules)
├── billing, flags, audit
│
Layer 5: FEATURES (advanced)
├── credits, usage, notify, webhooks, ai, media
```

### Dependency Rules

```typescript
// ✅ ALLOWED - Lower layer importing from lower layer
// In packages/tenants (Layer 3)
import { ctx, logger } from "@unisane/kernel";     // Layer 0 ✓
import { withAuth } from "@unisane/gateway";       // Layer 1 ✓
import { getUserById } from "@unisane/identity";   // Layer 2 ✓

// ❌ FORBIDDEN - Lower layer importing from higher layer
// In packages/tenants (Layer 3)
import { getBalance } from "@unisane/credits";     // Layer 5 ✗ VIOLATION!
```

### Checking Layer Violations

```bash
# Run layer violation check
pnpm check:layers

# Output:
# ❌ packages/tenants/src/service/tenants.ts
#    Line 5: Cannot import from @unisane/credits (Layer 5) in Layer 3 module
```

---

## Creating a New Module

### Step 1: Use the Generator

```bash
# Generate a new module
pnpm gen:module rewards

# Options:
#   --layer=4        # Specify layer (default: auto-detect)
#   --with-contract  # Include contract boilerplate
#   --with-events    # Include event definitions
```

This creates:

```
packages/rewards/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── service/
│   │   ├── getBalance.ts
│   │   ├── grantRewards.ts
│   │   └── index.ts           # Barrel export
│   ├── data/
│   │   └── rewards.repository.ts
│   └── domain/
│       └── types.ts
└── __tests__/
    └── getBalance.test.ts
```

### Step 2: Manual Creation (Alternative)

If not using the generator:

```bash
# Create directory structure
mkdir -p packages/rewards/src/{service,data,domain}
mkdir -p packages/rewards/__tests__

# Create package.json
cat > packages/rewards/package.json << 'EOF'
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
    "build": "tsup src/index.ts --format esm --dts",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@unisane/kernel": "workspace:*"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
EOF

# Create tsconfig.json
cat > packages/rewards/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "__tests__"]
}
EOF
```

---

## Module Structure

### Recommended File Organization

**Important: One function per file in the service layer.** Each service function gets its own file, exported via a barrel `index.ts`. This prevents large files, makes code easier to navigate, and enables clear import paths.

```
packages/rewards/
├── package.json
├── tsconfig.json
│
├── src/
│   ├── index.ts                    # Public API exports
│   │
│   ├── service/                    # Business logic — ONE FUNCTION PER FILE
│   │   ├── getBalance.ts           # Single function: getBalance()
│   │   ├── grantRewards.ts         # Single function: grantRewards()
│   │   ├── redeemRewards.ts        # Single function: redeemRewards()
│   │   ├── getHistory.ts           # Single function: getHistory()
│   │   └── index.ts                # Barrel export: re-exports all functions
│   │
│   ├── data/                       # Data access
│   │   ├── rewards.repository.ts   # Public repo (uses selectRepo)
│   │   └── rewards.repository.mongo.ts  # MongoDB implementation
│   │
│   ├── domain/                     # Types, schemas & constants
│   │   ├── schemas.ts              # Zod schemas (API input validation)
│   │   ├── types.ts                # TypeScript types (internal models)
│   │   ├── ports.ts                # Repository interfaces
│   │   ├── constants.ts            # Magic values
│   │   ├── errors.ts               # Domain-specific errors
│   │   ├── keys.ts                 # Cache key builders
│   │   └── index.ts                # Domain exports
│   │
│   └── events/                     # Event definitions (optional)
│       ├── handlers.ts             # Event handlers
│       └── index.ts                # Event exports
│
└── __tests__/
    ├── getBalance.test.ts          # Test per service file
    ├── grantRewards.test.ts
    ├── rewards.repository.test.ts
    └── fixtures/
        └── rewards.fixtures.ts
```

### Public API (index.ts)

```typescript
// packages/rewards/src/index.ts

/**
 * @module @unisane/rewards
 * @description Rewards and loyalty points management
 * @layer 5
 */

// ═══════════════════════════════════════════════════════════════
// SERVICE EXPORTS (from barrel)
// ═══════════════════════════════════════════════════════════════
export {
  getBalance,
  grantRewards,
  redeemRewards,
  getHistory,
} from "./service";

// ═══════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════
export type {
  Reward,
  RewardBalance,
  RewardTransaction,
  RedemptionOption,
  GrantRewardsInput,
  RedeemRewardsInput,
} from "./domain/types";

// ═══════════════════════════════════════════════════════════════
// CONSTANT EXPORTS
// ═══════════════════════════════════════════════════════════════
export { REWARD_TYPES, REDEMPTION_STATUS } from "./domain/constants";

// ═══════════════════════════════════════════════════════════════
// ERROR EXPORTS
// ═══════════════════════════════════════════════════════════════
export { InsufficientRewardsError, RewardExpiredError } from "./domain/errors";
```

---

## Domain Layer

The domain layer defines the **shape of data** in your module. It contains no business logic—only type definitions, validation schemas, and constants.

### Domain Files Overview

```
domain/
├── schemas.ts      # Zod schemas for API INPUT validation
├── types.ts        # TypeScript types for INTERNAL models
├── ports.ts        # Repository interfaces (optional)
├── constants.ts    # Enums, magic values
├── errors.ts       # Domain-specific error classes
├── keys.ts         # Cache key builders
└── index.ts        # Barrel exports
```

### schemas.ts vs types.ts — The Critical Distinction

These two files serve **different purposes** and should NOT be consolidated:

| Aspect | `schemas.ts` | `types.ts` |
|--------|--------------|------------|
| **Purpose** | API input/output validation | Internal domain models |
| **Contains** | Zod schemas (`z.object({...})`) | TypeScript types (`type X = {...}`) |
| **Runtime** | Has runtime validation | Compile-time only |
| **Used at** | API boundary (route handlers) | Service/data layer |
| **Validates** | External untrusted input | N/A (trusted internal data) |
| **Transforms** | May coerce strings to numbers, dates, etc. | Pure shape definition |

#### When to Use Each

```
CLIENT REQUEST                    INTERNAL PROCESSING
      │                                  │
      ▼                                  ▼
┌─────────────┐                  ┌─────────────┐
│ schemas.ts  │                  │  types.ts   │
│             │                  │             │
│ ZGrantInput │ ──validates──►   │ LedgerEntry │
│ ZListQuery  │   transforms     │ BalanceView │
│ ZUpdateBody │                  │ ServiceArgs │
└─────────────┘                  └─────────────┘
      │                                  │
   API Layer                      Service/Data Layer
```

### schemas.ts — API Input Validation

**Purpose:** Define Zod schemas for validating data coming FROM clients (requests) or going TO clients (responses).

```typescript
// domain/schemas.ts
import { z } from "zod";

// ═══════════════════════════════════════════════════════════════
// INPUT SCHEMAS — What clients SEND to us
// ═══════════════════════════════════════════════════════════════

/**
 * Grant rewards to a tenant.
 * Used in: POST /api/rewards/grant
 */
export const ZGrantRewards = z.object({
  amount: z.number().int().positive(),
  reason: z.string().min(2).max(200),
  expiresAt: z.string().datetime().optional(),  // ISO string from client
  idem: z.string().uuid(),                       // Idempotency key
});

/**
 * Redeem rewards from balance.
 * Used in: POST /api/rewards/redeem
 */
export const ZRedeemRewards = z.object({
  amount: z.number().int().positive(),
  redemptionId: z.string().min(1),
});

/**
 * List rewards with pagination.
 * Used in: GET /api/rewards/history
 */
export const ZListRewards = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(["grant", "redeem"]).optional(),
});

// ═══════════════════════════════════════════════════════════════
// INFERRED TYPES — For TypeScript convenience
// ═══════════════════════════════════════════════════════════════

export type GrantRewardsInput = z.infer<typeof ZGrantRewards>;
export type RedeemRewardsInput = z.infer<typeof ZRedeemRewards>;
export type ListRewardsQuery = z.infer<typeof ZListRewards>;
```

**Key characteristics:**
- Uses Zod validation methods: `.min()`, `.max()`, `.email()`, `.uuid()`, etc.
- May transform data: `.coerce.number()` converts string "10" to number 10
- Dates come as ISO strings from API, not Date objects
- Always export inferred types: `z.infer<typeof ZSchema>`

### types.ts — Internal Domain Models

**Purpose:** Define TypeScript types for internal data structures—database records, service function arguments, computed views.

```typescript
// domain/types.ts

// ═══════════════════════════════════════════════════════════════
// DATABASE MODELS — Shape of documents in MongoDB
// ═══════════════════════════════════════════════════════════════

/**
 * Raw reward document as stored in database.
 * Note: Uses Date objects, not ISO strings.
 */
export type RewardDoc = {
  _id: string;
  tenantId: string;
  amount: number;
  type: "grant" | "redeem";
  reason: string;
  consumed: number;
  expiresAt: Date | null;      // Date object, not string
  createdAt: Date;
  updatedAt: Date;
};

// ═══════════════════════════════════════════════════════════════
// VIEW MODELS — Transformed data for service/API responses
// ═══════════════════════════════════════════════════════════════

/**
 * Reward entry as returned to clients.
 * Transformed from RewardDoc by repository.
 */
export type RewardEntry = {
  id: string;                  // Mapped from _id
  amount: number;
  type: "grant" | "redeem";
  reason: string;
  createdAt: Date;
  expiresAt: Date | null;
};

/**
 * Aggregated balance view.
 */
export type RewardBalance = {
  total: number;
  available: number;
  consumed: number;
  expiringSoon: number;        // Computed field
};

// ═══════════════════════════════════════════════════════════════
// SERVICE ARGUMENTS — Internal function parameters
// ═══════════════════════════════════════════════════════════════

/**
 * Arguments for balance lookup.
 * Used internally by service functions.
 */
export type GetBalanceArgs = {
  tenantId: string;
  includeExpired?: boolean;
};

/**
 * Arguments for consuming rewards.
 */
export type ConsumeRewardsArgs = {
  tenantId: string;
  amount: number;
  reason: string;
  feature?: string;
};
```

**Key characteristics:**
- Pure TypeScript types (no Zod, no runtime)
- Uses `Date` objects, not ISO strings
- Includes internal fields not exposed to API (`_id`, `tenantId`)
- Defines service function argument shapes
- May include computed/aggregated fields

### Real-World Example: Why They Differ

Consider a "grant rewards" operation:

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// schemas.ts — API Input (from client)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const ZGrantRewards = z.object({
  amount: z.number().int().positive(),
  reason: z.string().min(2),
  expiresAt: z.string().datetime().optional(),  // ◄── ISO string
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// types.ts — Database Document
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export type RewardDoc = {
  _id: string;                    // ◄── Internal ID
  tenantId: string;               // ◄── Not in API input
  amount: number;
  reason: string;
  expiresAt: Date | null;         // ◄── Date object
  createdAt: Date;                // ◄── Auto-generated
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// The transformation happens in the service layer:
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API Input (schemas.ts)     →    DB Document (types.ts)
// {                                {
//   amount: 100,                     _id: "uuid",
//   reason: "bonus",                 tenantId: "tenant-123",  ◄── Added from ctx
//   expiresAt: "2025-12-31"          amount: 100,
// }                                  reason: "bonus",
//                                    expiresAt: new Date("2025-12-31"),  ◄── Parsed
//                                    createdAt: new Date(),  ◄── Auto-set
//                                  }
```

### Avoiding Duplication

**Problem:** Sometimes the same shape appears in both files.

```typescript
// ❌ BAD — Duplicated shape
// schemas.ts
export const ZRewardView = z.object({ id: z.string(), amount: z.number() });

// types.ts
export type RewardView = { id: string; amount: number };  // Same shape!
```

**Solution:** If you need BOTH Zod validation AND TypeScript type for the SAME shape, define it once:

```typescript
// ✅ GOOD — Single source of truth
// schemas.ts
export const ZRewardView = z.object({
  id: z.string(),
  amount: z.number(),
  type: z.enum(["grant", "redeem"]),
  createdAt: z.string().datetime(),
});

// Export inferred type — no need to duplicate in types.ts
export type RewardView = z.infer<typeof ZRewardView>;
```

```typescript
// types.ts — Only types NOT covered by schemas
export type RewardDoc = { ... };      // DB-specific
export type GetBalanceArgs = { ... }; // Service args
export type InternalStats = { ... };  // Computed/internal
```

### When to Create Each File

| Scenario | Create in |
|----------|-----------|
| Validating POST/PUT request body | `schemas.ts` |
| Validating query parameters | `schemas.ts` |
| Validating API response shape | `schemas.ts` |
| Defining database document structure | `types.ts` |
| Defining service function arguments | `types.ts` |
| Defining internal computed types | `types.ts` |
| Defining types shared with other modules | `types.ts` |

### Complete Domain Layer Example

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// domain/schemas.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { z } from "zod";

// Input schemas
export const ZCreateReward = z.object({
  amount: z.number().int().positive(),
  reason: z.string().min(2).max(200),
  type: z.enum(["signup_bonus", "referral", "manual"]),
  expiresAt: z.string().datetime().optional(),
  idem: z.string().uuid(),
});

export const ZRedeemReward = z.object({
  amount: z.number().int().positive(),
  itemId: z.string().min(1),
});

export const ZListQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Response schemas (for documentation/validation)
export const ZRewardResponse = z.object({
  id: z.string(),
  amount: z.number(),
  type: z.string(),
  reason: z.string(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable(),
});

// Inferred types
export type CreateRewardInput = z.infer<typeof ZCreateReward>;
export type RedeemRewardInput = z.infer<typeof ZRedeemReward>;
export type ListQuery = z.infer<typeof ZListQuery>;
export type RewardResponse = z.infer<typeof ZRewardResponse>;
```

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// domain/types.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Database document
export type RewardDoc = {
  _id: string;
  tenantId: string;
  userId: string;
  amount: number;
  type: "signup_bonus" | "referral" | "manual";
  reason: string;
  consumed: number;
  idemKey: string;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// Aggregated balance
export type RewardBalance = {
  total: number;
  available: number;
  consumed: number;
  pending: number;
  expiringSoon: number;
};

// Service arguments
export type GetBalanceArgs = { tenantId: string };
export type ConsumeArgs = {
  tenantId: string;
  amount: number;
  reason: string;
};

// Pagination result
export type RewardPage = {
  items: RewardDoc[];
  nextCursor?: string;
};
```

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// domain/constants.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const REWARD_TYPES = {
  SIGNUP_BONUS: "signup_bonus",
  REFERRAL: "referral",
  MANUAL: "manual",
} as const;

export const DEFAULT_EXPIRY_DAYS = 365;
export const MAX_REDEMPTION_PER_DAY = 10;
```

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// domain/errors.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { DomainError } from "@unisane/kernel";

export class InsufficientRewardsError extends DomainError {
  constructor(requested: number, available: number) {
    super(
      "INSUFFICIENT_REWARDS",
      `Requested ${requested} but only ${available} available`
    );
  }
}

export class RewardExpiredError extends DomainError {
  constructor(rewardId: string) {
    super("REWARD_EXPIRED", `Reward ${rewardId} has expired`);
  }
}
```

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// domain/keys.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const rewardKeys = {
  balance: (tenantId: string) => `rewards:balance:${tenantId}`,
  idemLock: (tenantId: string, idem: string) => `rewards:idem:${tenantId}:${idem}`,
  dailyCount: (tenantId: string, date: string) => `rewards:daily:${tenantId}:${date}`,
} as const;
```

### ports.ts — Repository Interfaces (Database Abstraction)

**Purpose:** Define interfaces for data access operations to support **multiple database backends**.

SaasKit is designed to support multiple databases:
- **MongoDB** (default, fully implemented)
- **PostgreSQL** (planned)
- **MySQL** (planned)

The `ports.ts` file defines the **contract** that all database implementations must follow. This allows users to switch databases via configuration without changing service code.

#### How Database Selection Works

```
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE ABSTRACTION                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐                                        │
│  │  domain/ports   │  ◄── Interface (contract)              │
│  │  RewardRepoPort │                                        │
│  └────────┬────────┘                                        │
│           │                                                  │
│           │ implements                                       │
│           ▼                                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 data/ implementations                │    │
│  ├─────────────────┬─────────────────┬─────────────────┤    │
│  │ rewards.repo    │ rewards.repo    │ rewards.repo    │    │
│  │ .mongo.ts       │ .postgres.ts    │ .mysql.ts       │    │
│  │ (implemented)   │ (future)        │ (future)        │    │
│  └─────────────────┴─────────────────┴─────────────────┘    │
│           │                                                  │
│           │ selectRepo()                                     │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │ data/rewards    │  ◄── Public repository (delegates)     │
│  │ .repository.ts  │                                        │
│  └─────────────────┘                                        │
│           │                                                  │
│           │ used by                                          │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │ service/        │  ◄── Business logic (DB-agnostic)      │
│  │ rewards.service │                                        │
│  └─────────────────┘                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Defining a Repository Port

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// domain/ports.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import type { RewardDoc, RewardBalance, RewardPage } from "./types";

/**
 * Repository interface for rewards data access.
 *
 * All database implementations (MongoDB, PostgreSQL, MySQL) must
 * implement this interface. Services use only these methods,
 * making them database-agnostic.
 */
export interface RewardRepoPort {
  // Queries
  findById(tenantId: string, id: string): Promise<RewardDoc | null>;
  findByIdem(tenantId: string, idemKey: string): Promise<RewardDoc | null>;
  getBalance(tenantId: string): Promise<RewardBalance>;
  listPage(args: { tenantId: string; limit: number; cursor?: string }): Promise<RewardPage>;

  // Mutations
  insert(doc: Omit<RewardDoc, "_id" | "createdAt" | "updatedAt">): Promise<{ id: string }>;
  updateConsumed(tenantId: string, id: string, consumed: number): Promise<void>;

  // Batch operations (for admin)
  getBalancesByTenantIds(tenantIds: string[]): Promise<Map<string, number>>;
}
```

#### Implementing for MongoDB

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// data/rewards.repository.mongo.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { col } from "@/src/core/db/connection";
import type { RewardRepoPort } from "../domain/ports";
import type { RewardDoc, RewardBalance } from "../domain/types";

const collection = () => col<RewardDoc>("rewards");

export const RewardRepoMongo: RewardRepoPort = {
  async findById(tenantId, id) {
    return collection().findOne({ _id: id, tenantId });
  },

  async findByIdem(tenantId, idemKey) {
    return collection().findOne({ tenantId, idemKey });
  },

  async getBalance(tenantId) {
    const [result] = await collection().aggregate<RewardBalance>([
      { $match: { tenantId } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          consumed: { $sum: "$consumed" },
        },
      },
      {
        $project: {
          total: 1,
          consumed: 1,
          available: { $subtract: ["$total", "$consumed"] },
        },
      },
    ]).toArray();

    return result ?? { total: 0, consumed: 0, available: 0 };
  },

  async insert(doc) {
    const now = new Date();
    const result = await collection().insertOne({
      ...doc,
      _id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    } as RewardDoc);
    return { id: result.insertedId };
  },

  // ... other methods
};
```

#### Future: Implementing for PostgreSQL

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// data/rewards.repository.postgres.ts (future)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { db } from "@/src/core/db/postgres";
import { rewards } from "@/src/core/db/schema";
import type { RewardRepoPort } from "../domain/ports";

export const RewardRepoPostgres: RewardRepoPort = {
  async findById(tenantId, id) {
    return db.query.rewards.findFirst({
      where: (r, { eq, and }) => and(eq(r.id, id), eq(r.tenantId, tenantId)),
    });
  },

  async getBalance(tenantId) {
    const result = await db
      .select({
        total: sql<number>`sum(amount)`,
        consumed: sql<number>`sum(consumed)`,
      })
      .from(rewards)
      .where(eq(rewards.tenantId, tenantId));

    return {
      total: result[0]?.total ?? 0,
      consumed: result[0]?.consumed ?? 0,
      available: (result[0]?.total ?? 0) - (result[0]?.consumed ?? 0),
    };
  },

  // ... other methods using Drizzle ORM
};
```

#### The Repository Selector

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// data/rewards.repository.ts (public API)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import type { RewardRepoPort } from "../domain/ports";
import { selectRepo } from "@/src/core/repo";
import { RewardRepoMongo } from "./rewards.repository.mongo";
// import { RewardRepoPostgres } from "./rewards.repository.postgres"; // future

// selectRepo picks the implementation based on DB_PROVIDER env var
const repo = selectRepo<RewardRepoPort>({
  mongo: RewardRepoMongo,
  // postgres: RewardRepoPostgres,  // future
  // mysql: RewardRepoMySQL,        // future
});

// Export individual functions for service layer
export const findById = repo.findById;
export const findByIdem = repo.findByIdem;
export const getBalance = repo.getBalance;
export const listPage = repo.listPage;
export const insert = repo.insert;
```

#### How Users Switch Databases

```bash
# .env - Default (MongoDB)
DB_PROVIDER=mongo

# .env - Future (PostgreSQL)
DB_PROVIDER=postgres
```

The `selectRepo` function reads `DB_PROVIDER` and returns the appropriate implementation:

```typescript
// core/repo/select.ts
export function selectRepo<T>(adapters: { mongo: T } & Partial<Record<DbProvider, T>>): T {
  const db = getDbProvider(); // reads DB_PROVIDER env
  return adapters[db] ?? adapters.mongo; // fallback to mongo
}
```

#### Why This Pattern Matters

| Benefit | Explanation |
|---------|-------------|
| **User choice** | Users can choose MongoDB, PostgreSQL, or MySQL based on their existing stack |
| **Service isolation** | Services don't know/care which database is used |
| **Easy migration** | Switch databases by implementing the port + changing env var |
| **Type safety** | Interface ensures all implementations have the same methods |
| **Testability** | Can inject mock repositories for testing |
| **Future-proof** | Add new databases without changing service code |

#### Summary: Data Layer Files

```
domain/
└── ports.ts                         # Interface (contract) for all DB implementations

data/
├── rewards.repository.ts            # Public API — uses selectRepo() to delegate
├── rewards.repository.mongo.ts      # MongoDB implementation (default)
├── rewards.repository.postgres.ts   # PostgreSQL implementation (future)
└── rewards.repository.mysql.ts      # MySQL implementation (future)
```

#### When to Define Ports

| Scenario | Use ports.ts? |
|----------|---------------|
| Module has database operations | ✅ Yes — always define the interface |
| Module only uses cache (Redis) | ❌ No — Redis API is uniform |
| Module calls external APIs | ❌ No — use provider interfaces instead |
| Module is pure computation | ❌ No — no data layer needed |

### Database-Agnostic Patterns (CRITICAL)

To support multiple databases (MongoDB, PostgreSQL, MySQL), follow these rules **strictly**:

#### ❌ NEVER Do This (Database-Specific)

```typescript
// ❌ WRONG - Direct MongoDB imports in service layer
import { ObjectId } from "mongodb";
import { col } from "@unisane/kernel";

// ❌ WRONG - Using _id directly (MongoDB-specific)
const doc = await col("users").findOne({ _id: new ObjectId(id) });

// ❌ WRONG - MongoDB-specific operators in service
const users = await col("users").find({ age: { $gt: 18 } }).toArray();

// ❌ WRONG - Importing repository.mongo.ts directly
import { UserRepoMongo } from "../data/user.repository.mongo";
```

#### ✅ ALWAYS Do This (Database-Agnostic)

```typescript
// ✅ CORRECT - Import from public repository (not .mongo.ts)
import { UserRepo } from "../data/user.repository";

// ✅ CORRECT - Use string IDs, let repository handle conversion
const user = await UserRepo.findById(id); // id is string

// ✅ CORRECT - Use repository methods, not raw queries
const users = await UserRepo.findAdults(); // Repository implements the query

// ✅ CORRECT - Domain types use string IDs
type User = {
  id: string;        // ✅ string, not ObjectId
  tenantId: string;
  email: string;
  createdAt: Date;   // ✅ Date objects are universal
};
```

#### Repository Implementation Rules

| Layer | Can Use | Cannot Use |
|-------|---------|------------|
| **Service** | `UserRepo.findById()` | `ObjectId`, `col()`, MongoDB operators |
| **Repository (public)** | `selectRepo()` | Direct DB calls |
| **Repository (.mongo.ts)** | `ObjectId`, `col()`, `$gt`, `$in` | Nothing restricted |
| **Domain types** | `string` for IDs | `ObjectId` type |

#### ID Handling Pattern

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// domain/types.ts — Use string IDs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export type User = {
  id: string;           // ✅ string - database agnostic
  tenantId: string;
  email: string;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// data/user.repository.mongo.ts — Convert to ObjectId internally
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { ObjectId } from "mongodb";
import { col } from "@unisane/kernel";

// Internal MongoDB document type (not exported to domain)
interface UserDoc {
  _id: ObjectId;        // MongoDB uses ObjectId internally
  tenantId: string;
  email: string;
}

// Convert MongoDB doc to domain type
function toDto(doc: UserDoc): User {
  return {
    id: doc._id.toHexString(),  // ObjectId → string
    tenantId: doc.tenantId,
    email: doc.email,
  };
}

async function findById(id: string): Promise<User | null> {
  if (!ObjectId.isValid(id)) return null;  // Validate before conversion
  const doc = await col<UserDoc>("users").findOne({ _id: new ObjectId(id) });
  return doc ? toDto(doc) : null;
}
```

#### Why This Matters

| Without Abstraction | With Abstraction |
|--------------------|------------------|
| Change DB = rewrite services | Change DB = add new repo file |
| 50+ files to modify | 1 file per module |
| High risk of bugs | Isolated changes |
| Long migration | Quick migration |

---

## Service Implementation

### Service File Guidelines

- **One function per file** — Each service function lives in its own file
- **Barrel export via index.ts** — All functions re-exported from `service/index.ts`
- **Use kernel utilities** — `getTenantId()`, `getUserId()`, `logger`, `events`, etc.
- **No direct HTTP handling** — Services are transport-agnostic
- **Filename matches function** — `grantRewards.ts` exports `grantRewards()`

### Service File Pattern

```
service/
├── getBalance.ts       # export async function getBalance() { ... }
├── grantRewards.ts     # export async function grantRewards() { ... }
├── redeemRewards.ts    # export async function redeemRewards() { ... }
├── getHistory.ts       # export async function getHistory() { ... }
└── index.ts            # Re-exports all functions
```

### Service Barrel Export (service/index.ts)

```typescript
// packages/rewards/src/service/index.ts

/**
 * Service barrel export.
 * Re-exports all service functions for clean imports.
 */

export { getBalance } from "./getBalance";
export { grantRewards } from "./grantRewards";
export { redeemRewards } from "./redeemRewards";
export { getHistory } from "./getHistory";
```

### Example Service File

Each service file follows this pattern:

```typescript
// packages/rewards/src/service/grantRewards.ts

import { getTenantId, getUserId, logger, events } from "@unisane/kernel";
import { RewardsRepo } from "../data/rewards.repository";
import { REWARDS_EVENTS } from "../domain/constants";
import type { GrantRewardsArgs } from "../domain/types";
import { ERR } from "@unisane/gateway";

// ════════════════════════════════════════════════════════════════════════════
// Grant Rewards
// ════════════════════════════════════════════════════════════════════════════

export type { GrantRewardsArgs };

/**
 * Grant rewards to a tenant.
 *
 * @throws {ValidationError} If amount is invalid
 */
export async function grantRewards(args: GrantRewardsArgs) {
  const tenantId = getTenantId();
  const userId = getUserId();

  // Validation
  if (args.amount <= 0) {
    throw ERR.validation("Amount must be positive");
  }

  // Create transaction
  const transaction = await RewardsRepo.insertTransaction({
    tenantId,
    type: "grant",
    amount: args.amount,
    reason: args.reason,
    expiresAt: args.expiresAt ?? null,
  });

  logger.info("rewards.granted", {
    tenantId,
    amount: args.amount,
    transactionId: transaction.id,
  });

  // Emit event for side effects
  await events.emit(REWARDS_EVENTS.GRANTED, {
    tenantId,
    userId,
    transactionId: transaction.id,
    amount: args.amount,
  });

  return transaction;
}
```

### Another Example: getBalance.ts

```typescript
// packages/rewards/src/service/getBalance.ts

import { getTenantId, logger } from "@unisane/kernel";
import { RewardsRepo } from "../data/rewards.repository";
import type { RewardBalance } from "../domain/types";

// ════════════════════════════════════════════════════════════════════════════
// Get Balance
// ════════════════════════════════════════════════════════════════════════════

export type { RewardBalance };

/**
 * Get the current reward balance for the current tenant.
 */
export async function getBalance(): Promise<RewardBalance> {
  const tenantId = getTenantId();

  const balance = await RewardsRepo.getBalance(tenantId);

  logger.info("rewards.balance.retrieved", { tenantId, balance: balance.total });

  return balance;
}
```

### Service File Naming Convention

| Function | Filename |
|----------|----------|
| `getBalance()` | `getBalance.ts` |
| `grantRewards()` | `grantRewards.ts` |
| `redeemRewards()` | `redeemRewards.ts` |
| `getHistory()` | `getHistory.ts` |
| `cancelSubscription()` | `cancelSubscription.ts` |
| `listInvoices()` | `listInvoices.ts` |

### Why One Function Per File?

| Benefit | Explanation |
|---------|-------------|
| **Easy navigation** | Find function by filename — no searching within large files |
| **Clear ownership** | Each file has single responsibility |
| **Better diffs** | Git diffs show exactly which function changed |
| **Parallel development** | Multiple devs can work on different functions without conflicts |
| **Consistent pattern** | Every module follows the same structure |
| **Test alignment** | Test files map directly to service files |

### Context Usage Pattern

Use `getTenantId()` and `getUserId()` helpers from kernel — they return `string` (not `string | undefined`) and throw if not set:

```typescript
// Always use getTenantId()/getUserId() at the start of service functions
export async function someServiceFunction(args: SomeArgs) {
  const tenantId = getTenantId();  // Returns string, throws if not set
  const userId = getUserId();      // Returns string, throws if not set

  // Use tenantId for data scoping
  const data = await Repository.findByTenant(tenantId);

  // Include context in logs for tracing
  logger.info("operation.completed", { tenantId, userId });

  return data;
}
```

**Why `getTenantId()` instead of `ctx.get().tenantId`?**

| Pattern | Return Type | Behavior |
|---------|-------------|----------|
| `ctx.get().tenantId` | `string \| undefined` | Requires null checks |
| `getTenantId()` | `string` | Throws if not set — cleaner code |

```typescript
// ❌ BAD — Requires null checks or type assertions
const { tenantId } = ctx.get();
await repo.find(tenantId!);  // Unsafe assertion

// ✅ GOOD — Type-safe, throws if context not set
const tenantId = getTenantId();
await repo.find(tenantId);   // tenantId is guaranteed string
```

---

## Data Layer

### Repository Pattern

```typescript
// packages/rewards/src/data/rewards.repository.ts

import { db, withTransaction } from "@unisane/kernel";
import type { RewardTransaction, RewardBalance } from "../domain/types";

const collection = () => db.collection<RewardDoc>("rewards");
const transactionsCollection = () => db.collection<TransactionDoc>("rewardTransactions");

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface RewardDoc {
  _id: string;
  tenantId: string;
  amount: number;
  type: string;
  expiresAt: Date | null;
  consumed: number;
  createdAt: Date;
}

interface TransactionDoc {
  _id: string;
  tenantId: string;
  type: "grant" | "redeem";
  amount: number;
  reason: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════════

export async function getBalance(tenantId: string): Promise<RewardBalance> {
  const pipeline = [
    { $match: { tenantId } },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
        consumed: { $sum: "$consumed" },
      },
    },
  ];

  const [result] = await collection().aggregate(pipeline).toArray();

  return {
    total: result?.total ?? 0,
    consumed: result?.consumed ?? 0,
    available: (result?.total ?? 0) - (result?.consumed ?? 0),
  };
}

export async function findActiveRewards(
  tenantId: string,
  amount: number
): Promise<RewardDoc[]> {
  const now = new Date();

  return collection()
    .find({
      tenantId,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      $expr: { $lt: ["$consumed", "$amount"] },
    })
    .sort({ expiresAt: 1, createdAt: 1 }) // FIFO by expiry
    .toArray();
}

// ═══════════════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════════════

export async function insertTransaction(
  data: Omit<TransactionDoc, "_id" | "createdAt">
): Promise<RewardTransaction> {
  const doc: TransactionDoc = {
    _id: crypto.randomUUID(),
    ...data,
    createdAt: new Date(),
  };

  await transactionsCollection().insertOne(doc);

  return mapToTransaction(doc);
}

// ═══════════════════════════════════════════════════════════════
// PAGINATION
// ═══════════════════════════════════════════════════════════════

export async function listTransactions(options: {
  tenantId: string;
  cursor?: string;
  limit: number;
  type?: "grant" | "redeem";
}): Promise<{ transactions: RewardTransaction[]; nextCursor?: string }> {
  const filter: Record<string, unknown> = { tenantId: options.tenantId };

  if (options.type) {
    filter.type = options.type;
  }

  if (options.cursor) {
    filter._id = { $lt: options.cursor };
  }

  const docs = await transactionsCollection()
    .find(filter)
    .sort({ _id: -1 })
    .limit(options.limit + 1)
    .toArray();

  const hasMore = docs.length > options.limit;
  const items = hasMore ? docs.slice(0, -1) : docs;

  return {
    transactions: items.map(mapToTransaction),
    nextCursor: hasMore ? items[items.length - 1]._id : undefined,
  };
}

// ═══════════════════════════════════════════════════════════════
// MAPPERS
// ═══════════════════════════════════════════════════════════════

function mapToTransaction(doc: TransactionDoc): RewardTransaction {
  return {
    id: doc._id,
    tenantId: doc.tenantId,
    type: doc.type,
    amount: doc.amount,
    reason: doc.reason,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
  };
}
```

### Cache Keys

```typescript
// packages/rewards/src/data/keys.ts

export const rewardKeys = {
  balance: (tenantId: string) => `rewards:balance:${tenantId}`,
  history: (tenantId: string) => `rewards:history:${tenantId}`,
  transaction: (id: string) => `rewards:tx:${id}`,
} as const;
```

---

## Contract Definition

### Adding to Contracts Package

```typescript
// packages/contracts/src/rewards/rewards.contract.ts

import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  RewardBalanceSchema,
  RewardTransactionSchema,
  GrantRewardsSchema,
  RedeemRewardsSchema,
} from "./rewards.schema";

const c = initContract();

export const rewardsContract = c.router(
  {
    // Get balance
    balance: {
      method: "GET",
      path: "/rewards/balance",
      responses: {
        200: RewardBalanceSchema,
      },
      summary: "Get reward balance for current tenant",
    },

    // Grant rewards
    grant: {
      method: "POST",
      path: "/rewards/grant",
      body: GrantRewardsSchema,
      responses: {
        201: RewardTransactionSchema,
        400: z.object({ error: z.string() }),
      },
      summary: "Grant rewards to tenant",
    },

    // Redeem rewards
    redeem: {
      method: "POST",
      path: "/rewards/redeem",
      body: RedeemRewardsSchema,
      responses: {
        200: RewardTransactionSchema,
        400: z.object({ error: z.string() }),
      },
      summary: "Redeem rewards",
    },

    // Get history
    history: {
      method: "GET",
      path: "/rewards/history",
      query: z.object({
        cursor: z.string().optional(),
        limit: z.coerce.number().min(1).max(100).default(20),
        type: z.enum(["grant", "redeem"]).optional(),
      }),
      responses: {
        200: z.object({
          items: z.array(RewardTransactionSchema),
          nextCursor: z.string().optional(),
        }),
      },
      summary: "Get reward transaction history",
    },
  },
  {
    pathPrefix: "/api/v1",
  }
);
```

### Adding Operation Metadata

```typescript
// packages/contracts/src/meta.ts

export const opMeta = defineOpMeta({
  // ... existing ops ...

  // ─────────────────────────────────────────────────────────
  // REWARDS
  // ─────────────────────────────────────────────────────────
  "rewards.balance": {
    auth: "required",
    rateLimit: { key: "tenant", limit: 100, window: "1m" },
    service: "rewards",
    fn: "getRewardBalance",
    cache: { ttl: 10, scope: "tenant" },
  },

  "rewards.grant": {
    auth: "required",
    permission: "rewards:grant",
    rateLimit: { key: "tenant", limit: 50, window: "1m" },
    service: "rewards",
    fn: "grantRewards",
  },

  "rewards.redeem": {
    auth: "required",
    permission: "rewards:redeem",
    rateLimit: { key: "tenant", limit: 100, window: "1m" },
    service: "rewards",
    fn: "redeemRewards",
  },

  "rewards.history": {
    auth: "required",
    rateLimit: { key: "tenant", limit: 100, window: "1m" },
    service: "rewards",
    fn: "getRewardHistory",
  },
});
```

---

## Event Integration

### Defining Events

```typescript
// packages/rewards/src/events/index.ts

import { events } from "@unisane/kernel";

// ═══════════════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════════════

export interface RewardsGrantedEvent {
  tenantId: string;
  userId: string;
  transactionId: string;
  amount: number;
  type: string;
}

export interface RewardsRedeemedEvent {
  tenantId: string;
  userId: string;
  transactionId: string;
  amount: number;
  redemptionId: string;
}

// ═══════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

// Handle billing events to grant rewards
events.on("billing.subscription.created", async (event) => {
  const { tenantId, planId } = event;

  // Grant signup bonus
  await grantRewards({
    amount: 100,
    type: "signup_bonus",
    reason: `Signup bonus for ${planId} plan`,
  });
});

// Handle usage events
events.on("usage.milestone.reached", async (event) => {
  const { tenantId, milestone } = event;

  // Grant milestone rewards
  await grantRewards({
    amount: milestone.rewardAmount,
    type: "milestone",
    reason: `Reached ${milestone.name}`,
  });
});
```

### Emitting Events

```typescript
// In service functions
await events.emit("rewards.granted", {
  tenantId,
  userId,
  transactionId: transaction.id,
  amount: input.amount,
  type: input.type,
});

// For critical events that must not be lost
await events.emitReliable("rewards.redeemed", {
  tenantId,
  userId,
  transactionId: transaction.id,
  amount: input.amount,
});
```

---

## Testing Your Module

### Unit Tests

```typescript
// packages/rewards/__tests__/rewards.service.test.ts

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ctx } from "@unisane/kernel";
import { grantRewards, getRewardBalance } from "../src/service/rewards.service";
import * as repository from "../src/data/rewards.repository";

vi.mock("../src/data/rewards.repository");

describe("rewards.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock context
    vi.spyOn(ctx, "get").mockReturnValue({
      tenantId: "tenant-123",
      userId: "user-456",
      requestId: "req-789",
    });
  });

  describe("grantRewards", () => {
    it("grants rewards successfully", async () => {
      const mockTransaction = {
        id: "tx-1",
        tenantId: "tenant-123",
        type: "grant",
        amount: 100,
        reason: "Test",
        createdAt: new Date(),
      };

      vi.spyOn(repository, "insertTransaction").mockResolvedValue(mockTransaction);

      const result = await grantRewards({
        amount: 100,
        type: "signup_bonus",
        reason: "Test",
      });

      expect(result.amount).toBe(100);
      expect(repository.insertTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "tenant-123",
          amount: 100,
        })
      );
    });

    it("throws ValidationError for negative amount", async () => {
      await expect(
        grantRewards({
          amount: -10,
          type: "signup_bonus",
          reason: "Test",
        })
      ).rejects.toThrow("Amount must be positive");
    });
  });

  describe("getRewardBalance", () => {
    it("returns balance", async () => {
      vi.spyOn(repository, "getBalance").mockResolvedValue({
        total: 500,
        consumed: 100,
        available: 400,
      });

      const result = await getRewardBalance();

      expect(result.available).toBe(400);
    });
  });
});
```

### Integration Tests

```typescript
// packages/rewards/__tests__/rewards.integration.test.ts

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupTestDb, teardownTestDb, createTestContext } from "@unisane/kernel/testing";
import { grantRewards, redeemRewards, getRewardBalance } from "../src";

describe("rewards integration", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  it("full rewards lifecycle", async () => {
    await createTestContext({ tenantId: "test-tenant" }, async () => {
      // Grant rewards
      const grant = await grantRewards({
        amount: 100,
        type: "signup_bonus",
        reason: "Welcome bonus",
      });
      expect(grant.amount).toBe(100);

      // Check balance
      const balance1 = await getRewardBalance();
      expect(balance1.available).toBe(100);

      // Redeem some
      const redeem = await redeemRewards({
        amount: 30,
        reason: "Discount redemption",
        redemptionId: "redemption-1",
      });
      expect(redeem.amount).toBe(-30);

      // Check final balance
      const balance2 = await getRewardBalance();
      expect(balance2.available).toBe(70);
    });
  });
});
```

---

## Module Checklist

Use this checklist when creating a new module:

### Setup
- [ ] Created package directory structure
- [ ] Added `package.json` with correct name and dependencies
- [ ] Added `tsconfig.json` extending base config
- [ ] Added to workspace root `pnpm-workspace.yaml` if needed
- [ ] Verified layer assignment is correct

### Domain Layer
- [ ] Created `domain/types.ts` with all TypeScript interfaces
- [ ] Created `domain/constants.ts` for magic values
- [ ] Created `domain/errors.ts` for domain-specific errors
- [ ] All types are exported from `index.ts`

### Data Layer
- [ ] Created `data/{entity}.repository.ts` (public, uses `selectRepo()`)
- [ ] Created `data/{entity}.repository.mongo.ts` (MongoDB implementation)
- [ ] Created `domain/ports.ts` with repository interface
- [ ] Created `domain/keys.ts` for cache key patterns (**NOT** `data/keys.ts`)
- [ ] All database operations use `tenantFilter()` from kernel
- [ ] No direct `ObjectId` usage outside `.mongo.ts` files
- [ ] Domain types use `string` for IDs (not `ObjectId`)
- [ ] Pagination implemented with cursor pattern
- [ ] Indexes documented/created

### Service Layer
- [ ] Created `service/{operation}.ts` files (one function per file)
- [ ] Created `service/index.ts` barrel export
- [ ] All functions use `getTenantId()`/`getUserId()` for context
- [ ] Import from `data/{entity}.repository.ts` (NOT `.mongo.ts`)
- [ ] No direct MongoDB imports (`ObjectId`, `col()`) in service files
- [ ] Proper logging with structured data
- [ ] Events emitted for side effects
- [ ] Input validation in service layer
- [ ] Error handling with domain errors

### Public API
- [ ] `index.ts` exports all public functions and types
- [ ] Module JSDoc with `@module`, `@description`, `@layer`
- [ ] No internal types/functions leaked
- [ ] Re-exported types for consumer convenience

### Contract (if API module)
- [ ] Created contract in `packages/contracts/src/{module}/`
- [ ] Added Zod schemas for request/response
- [ ] Added to root contract composition
- [ ] Added `defineOpMeta` entries for all operations

### Testing
- [ ] Unit tests for service functions
- [ ] Repository tests with mock data
- [ ] Integration tests for critical paths
- [ ] Test fixtures created

### Documentation
- [ ] **README.md in package root** (REQUIRED - see template below)
- [ ] Updated `starterPackages` in build-starter.ts
- [ ] Added to ARCHITECTURE.md module list (if significant)

### README.md Template

Every package MUST have a `README.md` in its root:

```markdown
# @unisane/{module-name}

> {One-line description of what this module does}

## Overview

{2-3 sentences explaining the module's purpose and main features}

## Installation

This package is part of the Unisane monorepo and is not published separately.

## Usage

\`\`\`typescript
import { functionName } from "@unisane/{module-name}";

// Example usage
const result = await functionName({ ... });
\`\`\`

## API

### Functions

| Function | Description |
|----------|-------------|
| `functionName()` | Brief description |
| `anotherFunction()` | Brief description |

### Types

| Type | Description |
|------|-------------|
| `TypeName` | Brief description |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `module.event.name` | `{ field: type }` | When this event fires |

## Dependencies

- `@unisane/kernel` - Core utilities
- `@unisane/gateway` - API layer (if applicable)

## Layer

This module is at **Layer {N}** in the architecture hierarchy.
\`\`\`

---

**Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)
**See Also:** [kernel.md](./kernel.md), [contracts-guide.md](./contracts-guide.md), [testing.md](./testing.md)
