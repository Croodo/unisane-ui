# Kernel Layer

> Detailed specification for `@unisane/kernel` - the foundation layer.
>
> **Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)

**Last Updated:** January 2026 (reflects current codebase implementation)

---

## Overview

The kernel provides core infrastructure that ALL modules depend on:

- **Context** - Request-scoped data via AsyncLocalStorage (tenant, user, permissions)
- **Database** - Connection, transactions, tenant scoping, migrations
- **Events** - Type-safe pub/sub with Zod validation and outbox pattern
- **Cache** - KV abstraction (Redis/Memory with TTL)
- **Errors** - Domain error hierarchy with error catalog
- **Observability** - Structured logging (Pino), tracing (OpenTelemetry), metrics
- **Utils** - Crypto (AES-256-GCM), IDs (nanoid/ulid), money, time, slugs
- **RBAC** - Role-based access control (6 roles, 50+ permissions)
- **Pagination** - Cursor-based pagination (no .skip())
- **Security** - Input sanitization, XSS protection
- **Resilience** - Circuit breaker, retry logic
- **Platform** - Injectable implementations for multi-provider support

**Current Statistics (January 2026):**
- **241 unit tests** passing in kernel
- **~8,000 LOC** of foundation code
- **Zero dependencies on business modules** (pure foundation)

---

## Package Structure

```
packages/foundation/kernel/
├── src/
│   ├── index.ts                 # Public API barrel export
│   │
│   ├── context/
│   │   ├── context.ts           # AsyncLocalStorage-based context
│   │   ├── types.ts             # Context type definitions
│   │   └── index.ts
│   │
│   ├── database/
│   │   ├── connection.ts        # MongoDB connection management
│   │   ├── transactions.ts      # Transaction support (replica set)
│   │   ├── tenant-scope.ts      # Auto tenant filtering
│   │   ├── filters.ts           # Query filter builders
│   │   ├── aggregations.ts      # Aggregation utilities
│   │   ├── objectid.ts          # ObjectId utilities
│   │   ├── indexes.ts           # Index management
│   │   ├── collections.ts       # Collection registry
│   │   ├── base-repository.ts   # Base repository class (P1-005)
│   │   ├── document-mapper.ts   # Document mapping utilities
│   │   ├── migrations/          # Migration system (P3-007)
│   │   │   ├── runner.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── seed/                # Seed data system
│   │   │   ├── runner.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── repo/                # Repository selection
│   │   └── index.ts
│   │
│   ├── events/
│   │   ├── emitter.ts           # Type-safe event emitter
│   │   ├── registry.ts          # Event schema registration
│   │   ├── schemas.ts           # Centralized event schemas (P2-002)
│   │   ├── typed-emitter.ts     # emitTyped/onTyped helpers
│   │   ├── outbox-worker.ts     # Reliable delivery via outbox
│   │   ├── types.ts             # Event type definitions
│   │   └── index.ts
│   │
│   ├── cache/
│   │   ├── provider.ts          # Cache provider interface
│   │   ├── redis.ts             # Redis implementation
│   │   ├── memory.ts            # In-memory fallback
│   │   └── index.ts
│   │
│   ├── errors/
│   │   ├── catalog.ts           # Error code catalog (E1xxx-E8xxx)
│   │   ├── base.ts              # Base error classes
│   │   ├── factory.ts           # Error factory utilities
│   │   └── index.ts
│   │
│   ├── observability/
│   │   ├── pino.ts              # Pino logger configuration
│   │   ├── otel.ts              # OpenTelemetry setup (P1-001)
│   │   ├── metrics.ts           # Metrics collection
│   │   ├── tracer.ts            # Distributed tracing
│   │   └── index.ts
│   │
│   ├── pagination/
│   │   ├── types.ts             # Pagination types
│   │   ├── cursors.ts           # Cursor encoding/decoding
│   │   ├── mongo.ts             # MongoDB pagination (P2-009)
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── crypto.ts            # Hashing, encryption (P2-011)
│   │   ├── ids.ts               # ID generation (nanoid, ulid)
│   │   ├── money.ts             # Safe money math (cents)
│   │   ├── currency.ts          # Currency utilities
│   │   ├── time.ts              # Date/time utilities
│   │   ├── slug.ts              # Slug generation
│   │   ├── normalize.ts         # String normalization
│   │   ├── dto.ts               # DTO mapping utilities
│   │   ├── csv.ts               # CSV parsing/generation
│   │   ├── ratelimit.ts         # Rate limiting utilities
│   │   ├── jobs.ts              # Job utilities
│   │   ├── storage.ts           # Storage utilities
│   │   └── index.ts
│   │
│   ├── rbac/
│   │   ├── permissions.ts       # Permission constants (50+)
│   │   ├── roles.ts             # Role definitions (6 roles)
│   │   ├── rolePermissions.ts   # Role → Permission mapping
│   │   └── index.ts
│   │
│   ├── security/
│   │   ├── sanitize.ts          # Input sanitization (P0-003)
│   │   └── sanitize.test.ts     # 38 tests
│   │
│   ├── resilience/
│   │   ├── circuit-breaker.ts   # Circuit breaker pattern
│   │   └── index.ts             # 17 tests
│   │
│   ├── health/
│   │   ├── check.ts             # Health check utilities
│   │   └── index.ts             # 20 tests
│   │
│   ├── platform/
│   │   ├── mail.ts              # Injectable email sender
│   │   ├── storage.ts           # Injectable storage provider
│   │   ├── sms.ts               # Injectable SMS provider
│   │   └── index.ts
│   │
│   ├── constants/
│   │   ├── feature-flags.ts     # Feature flag constants
│   │   └── [30+ constant files]
│   │
│   ├── schema/
│   │   ├── types.ts             # Schema type definitions
│   │   └── utils.ts             # Schema utilities
│   │
│   ├── encoding/
│   │   ├── base64url.ts         # Base64URL encoding
│   │   └── base64urlJson.ts     # Base64URL JSON encoding
│   │
│   ├── env.ts                   # Environment configuration
│   ├── envJson.ts               # JSON env variable parser
│   ├── inngest.ts               # Inngest client
│   └── client.ts                # HTTP client utilities
│
├── __tests__/
│   ├── context.test.ts          # 35 tests
│   ├── crypto.test.ts           # 42 tests
│   ├── errors.test.ts           # 46 tests
│   ├── events.test.ts           # 30 tests
│   └── [additional test files]  # 88+ more tests
│
├── package.json
└── tsconfig.json
```

---

## Context System

### Purpose

Request-scoped data without prop drilling. Uses Node.js `AsyncLocalStorage` with global singleton pattern to work correctly in Next.js/Turbopack chunking.

### Types

```typescript
// kernel/src/context/types.ts

export interface RequestContext {
  // Request metadata
  requestId: string;
  startTime: number;

  // Tenant & User (set by gateway after auth)
  tenantId?: string;
  userId?: string;

  // Lazy-loaded fields (fetched on first access, cached)
  plan?: string;
  flags?: Record<string, boolean>;

  // Additional metadata
  metadata?: Record<string, unknown>;
}

export interface CreateContextOptions {
  requestId?: string;
  tenantId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface ContextAPI {
  run<T>(ctx: RequestContext, fn: () => Promise<T>): Promise<T>;
  get(): RequestContext;
  tryGet(): RequestContext | undefined;
  getPlan(): Promise<string>;
  getFlags(): Promise<Record<string, boolean>>;
}
```

### Implementation

**Key Features (January 2026):**
- Global singleton AsyncLocalStorage (fixes Next.js/Turbopack module duplication)
- Lazy loading for plan and flags (avoids circular dependencies)
- Injectable loaders set during bootstrap
- Dedicated error classes (`ContextNotInitializedError`, `ContextFieldRequiredError`)

```typescript
// kernel/src/context/context.ts

import { AsyncLocalStorage } from 'async_hooks';
import type { RequestContext, ContextAPI } from './types';

// Global singleton to fix Next.js/Turbopack chunking issues
const globalForContext = global as unknown as {
  __kernelContextStorage?: AsyncLocalStorage<RequestContext>;
};

if (!globalForContext.__kernelContextStorage) {
  globalForContext.__kernelContextStorage = new AsyncLocalStorage<RequestContext>();
}

const storage = globalForContext.__kernelContextStorage;

export class ContextNotInitializedError extends Error {
  constructor() {
    super('Context not initialized. Ensure ctx.run() wraps this call.');
    this.name = 'ContextNotInitializedError';
  }
}

export class ContextFieldRequiredError extends Error {
  constructor(field: string) {
    super(`Context field '${field}' is required but not set.`);
    this.name = 'ContextFieldRequiredError';
  }
}

export const ctx: ContextAPI = {
  run<T>(context: RequestContext, fn: () => Promise<T>): Promise<T> {
    return storage.run(context, fn);
  },

  get(): RequestContext {
    const context = storage.getStore();
    if (!context) {
      throw new ContextNotInitializedError();
    }
    return context;
  },

  tryGet(): RequestContext | undefined {
    return storage.getStore();
  },

  async getPlan(): Promise<string> {
    const context = this.get();
    if (!context.tenantId) {
      throw new ContextFieldRequiredError('tenantId');
    }

    // Return cached if available
    if (context.plan) {
      return context.plan;
    }

    // Use registered loader (set during bootstrap)
    if (globalForLoaders.__kernelPlanLoader) {
      const plan = await globalForLoaders.__kernelPlanLoader(context.tenantId);
      context.plan = plan;
      return plan;
    }

    return 'free'; // Default fallback
  },

  async getFlags(): Promise<Record<string, boolean>> {
    const context = this.get();
    if (!context.tenantId) {
      throw new ContextFieldRequiredError('tenantId');
    }

    // Return cached if available
    if (context.flags) {
      return context.flags;
    }

    // Use registered loader
    if (globalForLoaders.__kernelFlagsLoader) {
      const flags = await globalForLoaders.__kernelFlagsLoader(context.tenantId);
      context.flags = flags;
      return flags;
    }

    return {}; // Default fallback
  },
};

// Convenience helpers
export function getTenantId(): string {
  const context = ctx.get();
  if (!context.tenantId) {
    throw new ContextFieldRequiredError('tenantId');
  }
  return context.tenantId;
}

export function getUserId(): string {
  const context = ctx.get();
  if (!context.userId) {
    throw new ContextFieldRequiredError('userId');
  }
  return context.userId;
}

export function getRequestId(): string {
  return ctx.get().requestId;
}
```

### Usage

```typescript
import { ctx, createContext, runInContext, getTenantId } from '@unisane/kernel';

// In gateway - initialize context
await ctx.run({
  requestId: 'req_123',
  startTime: Date.now(),
  tenantId: 'tenant_456',
  userId: 'user_789',
}, async () => {
  await handleRequest();
});

// Convenience wrapper
await runInContext({ tenantId: 'tenant_123', userId: 'user_456' }, async () => {
  // Your code here
});

// In service - access context
export async function createSubscription(input: SubscribeInput) {
  const tenantId = getTenantId(); // Convenience helper
  const userId = getUserId();
  // Use tenantId, userId...
}

// Safe access (doesn't throw)
const context = ctx.tryGet();
if (context?.tenantId) {
  // ...
}
```

**Test Coverage:** 35 tests in [context.test.ts](../../packages/foundation/kernel/src/__tests__/context.test.ts)

---

## Database Layer

### Connection Management

**Current Implementation (MongoDB-first):**

```typescript
// kernel/src/database/connection.ts

import { MongoClient, Db, Collection, Document } from 'mongodb';

let client: MongoClient;
let db: Db;

export async function connectDb(uri?: string): Promise<void> {
  const connectionUri = uri || process.env.MONGODB_URI;
  if (!connectionUri) {
    throw new Error('MONGODB_URI required');
  }

  client = new MongoClient(connectionUri);
  await client.connect();
  db = client.db();
}

export async function closeDb(): Promise<void> {
  await client?.close();
}

export function getDb(): Db {
  if (!db) throw new Error('Database not connected');
  return db;
}

// Shorthand for getting collections
export function col<T extends Document = Document>(name: string): Collection<T> {
  return getDb().collection<T>(name);
}

// Alias for backwards compatibility
export const db = getDb;

export async function mongoHealth(): Promise<{ ok: boolean; error?: string }> {
  try {
    await getDb().command({ ping: 1 });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
```

### Transaction Support (P2-004)

**Implemented in January 2026:**

```typescript
// kernel/src/database/transactions.ts

import { ClientSession, TransactionOptions } from 'mongodb';
import { getDb } from './connection';

export const DEFAULT_TRANSACTION_OPTIONS: TransactionOptions = {
  readConcern: { level: 'majority' },
  writeConcern: { w: 'majority' },
  readPreference: 'primary',
};

/**
 * Check if transactions are enabled.
 * Requires MongoDB replica set and MONGODB_TRANSACTIONS_ENABLED=true
 */
export function isTransactionsEnabled(): boolean {
  return process.env.MONGODB_TRANSACTIONS_ENABLED === 'true';
}

/**
 * Execute operations within a MongoDB transaction.
 * Automatically handles commit/rollback.
 *
 * If transactions are disabled (no replica set), runs fn without transaction.
 */
export async function withMongoTransaction<T>(
  fn: (session: ClientSession | null) => Promise<T>,
  options: TransactionOptions = DEFAULT_TRANSACTION_OPTIONS
): Promise<T> {
  if (!isTransactionsEnabled()) {
    // No transaction support - run without session
    return fn(null);
  }

  const db = getDb();
  const session = db.client.startSession();

  try {
    let result: T;

    await session.withTransaction(async () => {
      result = await fn(session);
    }, options);

    return result!;
  } finally {
    await session.endSession();
  }
}

/**
 * Retryable transaction with exponential backoff.
 * Useful for critical operations that must succeed.
 */
export async function withRetryableTransaction<T>(
  fn: (session: ClientSession | null) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await withMongoTransaction(fn);
    } catch (error) {
      lastError = error as Error;
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }

  throw lastError || new Error('Transaction failed after retries');
}

// Usage
await withMongoTransaction(async (session) => {
  await col('tenants').insertOne(tenant, { session });
  await col('memberships').insertOne(membership, { session });
  // Both succeed or both rollback
});
```

**Aliases:**
- `withTransaction()` - Alias for `withMongoTransaction()`

### Tenant Scoping

**Current Implementation with Explicit Variants:**

```typescript
// kernel/src/database/tenant-scope.ts

import { Filter } from 'mongodb';
import { getTenantId, ctx } from '../context';

export class TenantIsolationError extends Error {
  constructor(resourceTenantId: string, contextTenantId: string) {
    super(`Tenant isolation violation: resource belongs to ${resourceTenantId}, context is ${contextTenantId}`);
    this.name = 'TenantIsolationError';
  }
}

export class TenantContextRequiredError extends Error {
  constructor() {
    super('tenantId required for tenant-scoped operation');
    this.name = 'TenantContextRequiredError';
  }
}

export interface TenantScoped {
  tenantId: string;
  deletedAt?: Date | null;
}

/**
 * Automatically adds tenantId filter to queries (uses context).
 * Prevents accidental cross-tenant data access.
 */
export function tenantFilter<T>(filter: Filter<T> = {}): Filter<T> {
  const tenantId = getTenantId(); // Throws if not in context or tenantId not set

  return {
    ...filter,
    tenantId,
  } as Filter<T>;
}

/**
 * Tenant filter + active records only (deletedAt: null).
 */
export function tenantFilterActive<T>(filter: Filter<T> = {}): Filter<T> {
  return {
    ...tenantFilter(filter),
    deletedAt: null,
  } as Filter<T>;
}

/**
 * Explicit tenant filter for auth-time operations (before ctx.run()).
 * Use when you need to query during authentication, before context is set.
 */
export function explicitTenantFilter<T>(
  tenantId: string,
  filter: Filter<T> = {}
): Filter<T> {
  return {
    ...filter,
    tenantId,
  } as Filter<T>;
}

/**
 * Explicit tenant filter + active records only.
 */
export function explicitTenantFilterActive<T>(
  tenantId: string,
  filter: Filter<T> = {}
): Filter<T> {
  return {
    ...explicitTenantFilter(tenantId, filter),
    deletedAt: null,
  } as Filter<T>;
}

/**
 * Validates that a document belongs to current tenant.
 * Use after fetching by ID to prevent IDOR attacks.
 *
 * @throws TenantIsolationError if tenant mismatch
 * @throws Error if document is null (use custom error before this)
 */
export function assertTenantOwnership<T extends TenantScoped>(
  doc: T | null,
  resourceName: string
): asserts doc is T {
  if (!doc) {
    throw new Error(`${resourceName} not found`);
  }

  const tenantId = getTenantId();
  if (doc.tenantId !== tenantId) {
    // Log security event
    console.warn('[security] Tenant ownership violation', {
      resourceTenantId: doc.tenantId,
      contextTenantId: tenantId,
      resourceName,
    });
    throw new TenantIsolationError(doc.tenantId, tenantId);
  }
}

/**
 * Check if a document belongs to current tenant (boolean return).
 */
export function isTenantOwned<T extends TenantScoped>(doc: T | null): boolean {
  if (!doc) return false;

  const context = ctx.tryGet();
  if (!context?.tenantId) return false;

  return doc.tenantId === context.tenantId;
}

// Utility helpers
export function withTenantId<T extends object>(tenantId: string, data: T): T & { tenantId: string } {
  return { ...data, tenantId };
}

export function filterByTenant<T extends TenantScoped>(items: T[]): T[] {
  const tenantId = getTenantId();
  return items.filter(item => item.tenantId === tenantId);
}

// Usage
const subscriptions = await col('subscriptions')
  .find(tenantFilter({ status: 'active' }))
  .toArray();

const doc = await col('invoices').findOne({ _id: id });
assertTenantOwnership(doc, 'Invoice');
```

### Base Repository (P1-005)

**Implemented in January 2026:**

```typescript
// kernel/src/database/base-repository.ts

import { Filter, UpdateFilter, Document } from 'mongodb';
import { col } from './connection';
import { tenantFilter, tenantFilterActive } from './tenant-scope';

export interface BaseRepositoryConfig<TDoc extends Document, TView, TCreate, TUpdate> {
  collectionName: string;
  mapDocToView: (doc: TDoc) => TView;
  buildDocFromInput: (input: TCreate, now: Date) => Omit<TDoc, '_id'>;
  buildUpdateSet: (update: TUpdate, now: Date) => UpdateFilter<TDoc>;
}

/**
 * Create a tenant-scoped repository with common CRUD operations.
 * Handles soft delete, tenant isolation, and document mapping automatically.
 */
export function createTenantScopedRepository<TDoc extends Document, TView, TCreate, TUpdate>(
  config: BaseRepositoryConfig<TDoc, TView, TCreate, TUpdate>
) {
  const collection = () => col<TDoc>(config.collectionName);

  return {
    async findById(id: string): Promise<TView | null> {
      const doc = await collection().findOne(tenantFilterActive({ _id: id }));
      return doc ? config.mapDocToView(doc) : null;
    },

    async findMany(filter: Filter<TDoc> = {}): Promise<TView[]> {
      const docs = await collection()
        .find(tenantFilterActive(filter))
        .toArray();
      return docs.map(config.mapDocToView);
    },

    async create(input: TCreate): Promise<TView> {
      const now = new Date();
      const doc = {
        _id: crypto.randomUUID(),
        ...config.buildDocFromInput(input, now),
      } as TDoc;

      await collection().insertOne(doc);
      return config.mapDocToView(doc);
    },

    async update(id: string, update: TUpdate): Promise<TView | null> {
      const now = new Date();
      const updateSet = config.buildUpdateSet(update, now);

      const result = await collection().findOneAndUpdate(
        tenantFilterActive({ _id: id }),
        updateSet,
        { returnDocument: 'after' }
      );

      return result ? config.mapDocToView(result) : null;
    },

    async softDelete(id: string): Promise<boolean> {
      const result = await collection().updateOne(
        tenantFilterActive({ _id: id }),
        { $set: { deletedAt: new Date() } }
      );

      return result.modifiedCount > 0;
    },

    async hardDelete(id: string): Promise<boolean> {
      const result = await collection().deleteOne(tenantFilter({ _id: id }));
      return result.deletedCount > 0;
    },
  };
}
```

### Soft Delete Pattern (P2-008)

```typescript
// kernel/src/database/filters.ts

/**
 * Standard soft delete filter.
 * Include in all queries to exclude deleted records.
 */
export const SOFT_DELETE_FILTER = { deletedAt: null } as const;

export function softDeleteFilter<T>(filter: Filter<T> = {}): Filter<T> {
  return {
    ...filter,
    ...SOFT_DELETE_FILTER,
  } as Filter<T>;
}
```

### Migration System (P3-007)

**Implemented in January 2026:**

```typescript
// kernel/src/database/migrations/types.ts

export interface Migration {
  id: string; // Unique identifier (e.g., "001_add_tenant_indexes")
  description: string;
  up: (db: Db) => Promise<void>;
  down?: (db: Db) => Promise<void>; // Optional rollback
}

// kernel/src/database/migrations/runner.ts

export async function runMigrations(migrations: Migration[]): Promise<void> {
  const db = getDb();
  const collection = db.collection('_migrations');

  // Ensure migrations collection exists
  await collection.createIndex({ id: 1 }, { unique: true });

  for (const migration of migrations) {
    // Check if already applied
    const existing = await collection.findOne({ id: migration.id });
    if (existing) {
      console.log(`[migration] Skipping ${migration.id} (already applied)`);
      continue;
    }

    console.log(`[migration] Running ${migration.id}: ${migration.description}`);
    await migration.up(db);

    // Record migration
    await collection.insertOne({
      id: migration.id,
      description: migration.description,
      appliedAt: new Date(),
    });

    console.log(`[migration] Completed ${migration.id}`);
  }
}

export async function getMigrationStatus(): Promise<{ id: string; appliedAt: Date }[]> {
  const db = getDb();
  return db.collection('_migrations')
    .find({})
    .sort({ appliedAt: 1 })
    .toArray();
}
```

---

## Event System

### Centralized Event Schemas (P2-002)

**Implemented in January 2026:**

All event schemas are now centralized in one registry:

```typescript
// kernel/src/events/schemas.ts

import { z } from 'zod';

// Base event schemas
export const TenantEventSchema = z.object({
  tenantId: z.string(),
});

export const UserActionEventSchema = z.object({
  tenantId: z.string(),
  userId: z.string(),
});

// Centralized event registry (35+ events)
export const EventSchemas = {
  // Tenant events
  'tenant.created': TenantEventSchema.extend({
    tenantId: z.string(),
    name: z.string(),
    slug: z.string(),
  }),
  'tenant.deleted': TenantEventSchema.extend({
    tenantId: z.string(),
    deletedAt: z.string(),
  }),

  // Storage events
  'storage.upload.requested': UserActionEventSchema.extend({
    uploadId: z.string(),
    key: z.string(),
  }),
  'storage.upload.confirmed': UserActionEventSchema.extend({
    uploadId: z.string(),
    key: z.string(),
    sizeBytes: z.number(),
  }),

  // Credits events
  'credits.granted': TenantEventSchema.extend({
    amount: z.number(),
    reason: z.string(),
    id: z.string(),
  }),
  'credits.consumed': TenantEventSchema.extend({
    amount: z.number(),
    reason: z.string(),
    feature: z.string(),
  }),

  // ... 30+ more event types
} as const;

export type EventType = keyof typeof EventSchemas;
export type EventPayload<T extends EventType> = z.infer<typeof EventSchemas[T]>;

// Utility to get schema for an event type
export function getSchema(eventType: EventType): z.ZodType {
  return EventSchemas[eventType];
}

// Check if event type is registered
export function isValidEventType(eventType: string): eventType is EventType {
  return eventType in EventSchemas;
}
```

### Type-Safe Emitter with emitTyped/onTyped

```typescript
// kernel/src/events/typed-emitter.ts

import { z } from 'zod';
import { events } from './emitter';
import { EventSchemas, EventType, EventPayload } from './schemas';

/**
 * Type-safe event emission with compile-time type checking.
 * Validates payload against registered schema.
 */
export async function emitTyped<T extends EventType>(
  eventType: T,
  payload: EventPayload<T>
): Promise<void> {
  const schema = EventSchemas[eventType];

  // Validate at runtime
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new Error(`Event validation failed for ${eventType}: ${result.error.message}`);
  }

  // Emit using base event system
  await events.emit(eventType, payload);
}

/**
 * Type-safe event subscription with compile-time type checking.
 */
export function onTyped<T extends EventType>(
  eventType: T,
  handler: (event: { eventId: string; eventType: T; payload: EventPayload<T> }) => Promise<void> | void
): () => void {
  return events.on(eventType, handler as any);
}

// Usage
await emitTyped('credits.granted', {
  tenantId: 'tenant_123',
  amount: 100,
  reason: 'signup_bonus',
  id: 'tx_456',
});

onTyped('credits.granted', async (event) => {
  console.log('Credits granted:', event.payload.amount); // Fully typed
});
```

### Event Emitter Implementation

```typescript
// kernel/src/events/emitter.ts

import { EventEmitter } from 'events';
import { generateId } from '../utils/ids';
import { logger } from '../observability';

type EventHandler = (event: { eventId: string; eventType: string; payload: any }) => Promise<void> | void;

class DomainEventEmitter {
  private emitter = new EventEmitter();
  private maxHandlers = 50; // Prevent memory leaks

  constructor() {
    this.emitter.setMaxListeners(this.maxHandlers);
  }

  on(eventType: string, handler: EventHandler): () => void {
    this.emitter.on(eventType, handler);

    // Return unsubscribe function
    return () => this.emitter.off(eventType, handler);
  }

  once(eventType: string, handler: EventHandler): void {
    this.emitter.once(eventType, handler);
  }

  async emit(eventType: string, payload: any): Promise<void> {
    const eventId = generateId('evt');

    const event = {
      eventId,
      eventType,
      payload,
    };

    logger.debug('event.emitted', { eventType, eventId });

    // Fire handlers (don't wait, fire-and-forget)
    const listeners = this.emitter.listeners(eventType);

    for (const listener of listeners) {
      try {
        await Promise.resolve(listener(event));
      } catch (error) {
        logger.error('event.handler.failed', {
          eventType,
          eventId,
          error: (error as Error).message,
        });
      }
    }
  }

  // Get handler statistics
  getHandlerStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const eventName of this.emitter.eventNames()) {
      stats[String(eventName)] = this.emitter.listenerCount(eventName);
    }
    return stats;
  }
}

export const events = new DomainEventEmitter();
```

**Test Coverage:** 30 tests in [events.test.ts](../../packages/foundation/kernel/src/__tests__/events.test.ts)

---

## Error System

### Error Catalog

**Current Implementation (E1xxx-E8xxx codes):**

```typescript
// kernel/src/errors/catalog.ts

export const ERR = {
  // E1xxx - Authentication/Authorization
  authRequired: () => createError('E1001', 'AUTH_REQUIRED', 'Authentication required', 401),
  authInvalidCredentials: () => createError('E1002', 'AUTH_INVALID_CREDENTIALS', 'Invalid credentials', 401),
  authTokenExpired: () => createError('E1003', 'AUTH_TOKEN_EXPIRED', 'Token expired', 401),
  forbidden: (msg?: string) => createError('E1004', 'FORBIDDEN', msg || 'Access denied', 403),

  // E2xxx - Not Found
  notFound: (resource: string) => createError('E2001', 'NOT_FOUND', `${resource} not found`, 404),

  // E3xxx - Validation
  invalidInput: (msg: string) => createError('E3001', 'INVALID_INPUT', msg, 400),
  validationFailed: (details: unknown) => createError('E3002', 'VALIDATION_FAILED', 'Validation failed', 400, details),

  // E4xxx - Conflict
  conflict: (msg: string) => createError('E4001', 'CONFLICT', msg, 409),
  duplicate: (resource: string) => createError('E4002', 'DUPLICATE', `${resource} already exists`, 409),

  // E5xxx - Business Logic
  insufficientCredits: (required: number, available: number) =>
    createError('E5001', 'INSUFFICIENT_CREDITS', `Need ${required} credits, have ${available}`, 402, { required, available }),
  quotaExceeded: (feature: string) =>
    createError('E5002', 'QUOTA_EXCEEDED', `Quota exceeded for ${feature}`, 429, { feature }),
  subscriptionRequired: () =>
    createError('E5003', 'SUBSCRIPTION_REQUIRED', 'Active subscription required', 402),

  // E6xxx - Rate Limiting
  rateLimited: (retryAfter?: number) =>
    createError('E6001', 'RATE_LIMITED', 'Too many requests', 429, { retryAfter }),

  // E7xxx - External Services
  externalServiceError: (service: string, msg: string) =>
    createError('E7001', 'EXTERNAL_SERVICE_ERROR', `${service}: ${msg}`, 502, { service }),

  // E8xxx - Internal
  internalError: (msg: string) =>
    createError('E8001', 'INTERNAL_ERROR', msg, 500),
} as const;

function createError(
  code: string,
  type: string,
  message: string,
  status: number,
  details?: unknown
): DomainError {
  return new DomainError(code, type, message, status, details);
}
```

### Base Error Classes

```typescript
// kernel/src/errors/base.ts

export class DomainError extends Error {
  constructor(
    public readonly code: string,        // E1001, E2001, etc.
    public readonly type: string,        // AUTH_REQUIRED, NOT_FOUND, etc.
    message: string,
    public readonly status: number,      // HTTP status code
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'DomainError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      type: this.type,
      message: this.message,
      status: this.status,
      details: this.details,
    };
  }
}

// Check if error is a domain error
export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

// Wrap unknown errors
export function wrapError(error: unknown): DomainError {
  if (isDomainError(error)) {
    return error;
  }

  const message = error instanceof Error ? error.message : 'Unknown error';
  return ERR.internalError(message);
}
```

### Usage

```typescript
import { ERR, isDomainError } from '@unisane/kernel';

// Throw domain errors
if (!subscription) {
  throw ERR.notFound('Subscription');
}

if (credits < required) {
  throw ERR.insufficientCredits(required, credits);
}

// Handle errors
try {
  await someOperation();
} catch (error) {
  if (isDomainError(error)) {
    console.log('Domain error:', error.code, error.message);
  } else {
    console.log('Unknown error:', error);
  }
}
```

**Test Coverage:** 46 tests in [errors.test.ts](../../packages/foundation/kernel/src/__tests__/errors.test.ts)

---

## Observability

### Structured Logger (Pino)

```typescript
// kernel/src/observability/pino.ts

import pino from 'pino';
import { ctx } from '../context';

const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: ['password', 'token', 'apiKey', 'secret'],
    remove: true,
  },
});

export const logger = {
  trace: (msg: string, data?: object) => log('trace', msg, data),
  debug: (msg: string, data?: object) => log('debug', msg, data),
  info: (msg: string, data?: object) => log('info', msg, data),
  warn: (msg: string, data?: object) => log('warn', msg, data),
  error: (msg: string, data?: object) => log('error', msg, data),

  child: (module: string) => ({
    trace: (msg: string, data?: object) => log('trace', msg, { ...data, module }),
    debug: (msg: string, data?: object) => log('debug', msg, { ...data, module }),
    info: (msg: string, data?: object) => log('info', msg, { ...data, module }),
    warn: (msg: string, data?: object) => log('warn', msg, { ...data, module }),
    error: (msg: string, data?: object) => log('error', msg, { ...data, module }),
  }),
};

function log(level: string, msg: string, data?: object) {
  const context = ctx.tryGet();

  baseLogger[level]({
    ...data,
    requestId: context?.requestId,
    tenantId: context?.tenantId,
    userId: context?.userId,
  }, msg);
}
```

### OpenTelemetry Tracing (P1-001)

**Implemented in January 2026:**

```typescript
// kernel/src/observability/otel.ts

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

let sdk: NodeSDK | null = null;

export function initTracing(serviceName: string): void {
  if (sdk) return; // Already initialized

  sdk = new NodeSDK({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: serviceName,
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();

  process.on('SIGTERM', () => {
    sdk?.shutdown().then(() => {
      console.log('[otel] Tracing terminated');
      process.exit(0);
    });
  });

  console.log('[otel] Tracing initialized');
}
```

### Metrics

```typescript
// kernel/src/observability/metrics.ts

type MetricTags = Record<string, string | number>;

class MetricsCollector {
  private metrics: Map<string, number> = new Map();

  inc(name: string, value: number = 1, tags?: MetricTags): void {
    const key = this.buildKey(name, tags);
    this.metrics.set(key, (this.metrics.get(key) || 0) + value);
  }

  gauge(name: string, value: number, tags?: MetricTags): void {
    const key = this.buildKey(name, tags);
    this.metrics.set(key, value);
  }

  private buildKey(name: string, tags?: MetricTags): string {
    if (!tags) return name;
    const tagStr = Object.entries(tags)
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    return `${name}{${tagStr}}`;
  }

  getAll(): Map<string, number> {
    return new Map(this.metrics);
  }

  reset(): void {
    this.metrics.clear();
  }
}

export const observabilityMetrics = new MetricsCollector();

// Convenience alias
export const metrics = observabilityMetrics;
```

---

## Utilities

### Crypto (AES-256-GCM) - P2-011

**Implemented in January 2026:**

```typescript
// kernel/src/utils/crypto.ts

import { createHash, randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'crypto';

// SHA-256 hashing
export function sha256Hex(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

// Random token generation
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

export function randomDigits(length: number): string {
  const digits = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += digits[Math.floor(Math.random() * digits.length)];
  }
  return result;
}

// Password hashing with scrypt
export function hashPassword(password: string, salt?: Buffer): { hash: string; salt: string } {
  const saltBuf = salt || randomBytes(16);
  const derived = scryptSync(password, saltBuf, 64);
  return {
    hash: derived.toString('hex'),
    salt: saltBuf.toString('hex'),
  };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: computed } = hashPassword(password, Buffer.from(salt, 'hex'));
  return computed === hash;
}

// AES-256-GCM encryption (P2-011)
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export function encryptField(text: string, key: Buffer): string {
  if (key.length !== 32) {
    throw new Error('Encryption key must be 32 bytes for AES-256');
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Format: iv (16 bytes) + tag (16 bytes) + encrypted data
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptField(encrypted: string, key: Buffer): string {
  if (key.length !== 32) {
    throw new Error('Encryption key must be 32 bytes for AES-256');
  }

  const data = Buffer.from(encrypted, 'base64');
  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const content = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return decipher.update(content) + decipher.final('utf8');
}

// Create search token (for encrypted field lookups)
export function createSearchToken(value: string, key: Buffer): string {
  // Use HMAC for deterministic, searchable token
  const hmac = createHash('sha256').update(key).update(value).digest();
  return hmac.toString('base64url');
}
```

**Test Coverage:** 42 tests in [crypto.test.ts](../../packages/foundation/kernel/src/__tests__/crypto.test.ts)

### ID Generation

```typescript
// kernel/src/utils/ids.ts

import { nanoid, customAlphabet } from 'nanoid';
import { ulid } from 'ulid';

// Short random ID (21 chars, URL-safe)
export function generateId(prefix?: string): string {
  const id = nanoid(16);
  return prefix ? `${prefix}_${id}` : id;
}

// Common prefixed IDs
export const tenantId = () => generateId('tenant');
export const userId = () => generateId('user');
export const subscriptionId = () => generateId('sub');
export const invoiceId = () => generateId('inv');
export const apiKeyId = () => generateId('key');

// Sortable ID (time-ordered, 26 chars)
export const sortableId = () => ulid();

// Custom alphabet ID
export function customId(length: number, alphabet: string): string {
  return customAlphabet(alphabet, length)();
}
```

### Safe Money Math

**All money stored as cents (integers):**

```typescript
// kernel/src/utils/money.ts

export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function toDollars(cents: number): number {
  return cents / 100;
}

export function formatMoney(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(toDollars(cents));
}

export function addMoney(...amounts: number[]): number {
  return amounts.reduce((sum, n) => sum + n, 0);
}

export function subtractMoney(a: number, b: number): number {
  return a - b;
}

export function multiplyMoney(cents: number, multiplier: number): number {
  return Math.round(cents * multiplier);
}

// Usage
const price = toCents(19.99); // 1999
const total = addMoney(price, toCents(2.50)); // 2249
console.log(formatMoney(total)); // "$22.49"
```

---

## RBAC

### Permissions (50+)

```typescript
// kernel/src/rbac/permissions.ts

export const PERMISSIONS = {
  // Workspace
  'workspace:read': 'View workspace details',
  'workspace:write': 'Modify workspace settings',
  'workspace:delete': 'Delete workspace',
  'workspace:transfer': 'Transfer ownership',

  // Members
  'members:read': 'View members',
  'members:write': 'Invite/modify members',
  'members:delete': 'Remove members',

  // API Keys
  'apikeys:read': 'View API keys',
  'apikeys:write': 'Create/modify API keys',
  'apikeys:delete': 'Delete API keys',

  // Billing
  'billing:read': 'View billing info',
  'billing:write': 'Modify subscription/payment',

  // Audit
  'audit:read': 'View audit logs',

  // ... 40+ more permissions
} as const;

export type Permission = keyof typeof PERMISSIONS;
```

### Roles (6)

```typescript
// kernel/src/rbac/roles.ts

export const ROLES = {
  owner: {
    name: 'Owner',
    description: 'Full access including workspace deletion',
  },
  admin: {
    name: 'Admin',
    description: 'Manage workspace, members, and billing',
  },
  member: {
    name: 'Member',
    description: 'Standard workspace access',
  },
  billing: {
    name: 'Billing',
    description: 'Manage billing and subscriptions only',
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access',
  },
  guest: {
    name: 'Guest',
    description: 'Limited temporary access',
  },
} as const;

export type Role = keyof typeof ROLES;
```

### Role Permissions Mapping

```typescript
// kernel/src/rbac/rolePermissions.ts

import type { Role } from './roles';
import type { Permission } from './permissions';

export const ROLE_PERMISSIONS: Record<Role, Permission[] | ['*']> = {
  owner: ['*'], // All permissions

  admin: [
    'workspace:read', 'workspace:write',
    'members:read', 'members:write', 'members:delete',
    'apikeys:read', 'apikeys:write', 'apikeys:delete',
    'billing:read', 'billing:write',
    'audit:read',
    // ... all admin permissions
  ],

  member: [
    'workspace:read',
    'members:read',
    'apikeys:read',
  ],

  billing: [
    'workspace:read',
    'billing:read', 'billing:write',
  ],

  viewer: [
    'workspace:read',
    'members:read',
  ],

  guest: [
    'workspace:read',
  ],
};

export function getPermissionsForRole(role: Role): Permission[] | ['*'] {
  return ROLE_PERMISSIONS[role];
}
```

---

## Pagination (P2-009)

**Cursor-based pagination (no .skip() for performance):**

```typescript
// kernel/src/pagination/types.ts

export interface CursorPaginationOptions {
  cursor?: string;
  limit?: number;
}

export interface CursorPaginationResult<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

// kernel/src/pagination/mongo.ts

import { Filter, Collection } from 'mongodb';
import { decodeCursor, encodeCursor } from './cursors';

export async function paginateMongo<T>(
  collection: Collection<T>,
  filter: Filter<T>,
  options: CursorPaginationOptions = {}
): Promise<CursorPaginationResult<T>> {
  const limit = Math.min(options.limit || 20, 100); // Max 100

  // Decode cursor
  let cursorFilter: Filter<T> = {};
  if (options.cursor) {
    const decoded = decodeCursor(options.cursor);
    cursorFilter = { _id: { $lt: decoded.id } } as Filter<T>;
  }

  // Fetch limit + 1 to check for more
  const items = await collection
    .find({ ...filter, ...cursorFilter })
    .sort({ _id: -1 })
    .limit(limit + 1)
    .toArray();

  const hasMore = items.length > limit;
  const results = hasMore ? items.slice(0, limit) : items;

  return {
    items: results,
    nextCursor: hasMore ? encodeCursor({ id: results[results.length - 1]._id }) : undefined,
    hasMore,
  };
}
```

---

## Security (P0-003)

### Input Sanitization

```typescript
// kernel/src/security/sanitize.ts

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML to prevent XSS attacks.
 * Removes all dangerous tags and attributes.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  });
}

/**
 * Strip all HTML tags (for plain text fields).
 */
export function stripHtml(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

/**
 * Escape special characters for safe display.
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
```

**Test Coverage:** 38 tests in [sanitize.test.ts](../../packages/foundation/kernel/src/security/sanitize.test.ts)

---

## Resilience

### Circuit Breaker

```typescript
// kernel/src/resilience/circuit-breaker.ts

export enum CircuitState {
  CLOSED = 'CLOSED',   // Normal operation
  OPEN = 'OPEN',       // Failing, reject immediately
  HALF_OPEN = 'HALF_OPEN', // Testing if recovered
}

export interface CircuitBreakerOptions {
  failureThreshold: number;  // Failures before opening
  resetTimeout: number;      // ms to wait before half-open
  successThreshold: number;  // Successes to close from half-open
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private nextAttempt: number = 0;

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = CircuitState.HALF_OPEN;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successes = 0;
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.successes = 0;

    if (this.failures >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.options.resetTimeout;
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}
```

**Test Coverage:** 17 tests in [circuit-breaker.test.ts](../../packages/foundation/kernel/src/resilience/__tests__/circuit-breaker.test.ts)

---

## Public API

```typescript
// kernel/src/index.ts

// Context (request-scoped data via AsyncLocalStorage)
export * from './context';

// Events (typed domain event system)
export * from './events';

// Errors (domain error hierarchy)
export * from './errors';

// Observability (logging, tracing, metrics)
export * from './observability';

// Database
export * from './database';

// Cache/KV
export * from './cache';

// Pagination
export * from './pagination';

// RBAC
export * from './rbac';

// Security (input sanitization, XSS protection)
export * from './security/sanitize';

// Health checks
export * from './health';

// Resilience (circuit breaker, retry, etc.)
export * from './resilience';

// Constants
export * from './constants';

// Schema utilities
export * from './schema/types';
export * from './schema/utils';

// Encoding
export * from './encoding/base64url';
export * from './encoding/base64urlJson';

// Environment
export { getEnv } from './env';
export type { Env } from './env';

// Utilities
export * from './utils/crypto';
export * from './utils/ids';
export * from './utils/money';
export * from './utils/currency';
export * from './utils/time';
export * from './utils/slug';
export * from './utils/normalize';
export * from './utils/dto';
export * from './utils/csv';
export * from './utils/ratelimit';
export * from './utils/jobs';
export * from './utils/storage';

// Metrics - re-export observabilityMetrics as 'metrics' for convenience
export { observabilityMetrics as metrics } from './observability';

// Inngest
export * from './inngest';

// Platform (injectable implementations)
export * from './platform';

// Contracts (API schemas)
export * from './contracts';
```

---

## Testing

**Current Test Coverage (January 2026):**

| Test File | Tests | What's Covered |
|-----------|-------|----------------|
| context.test.ts | 35 | ctx.run, ctx.get, createContext, runInContext, getTenantId, getUserId, getRequestId, getPlan, getFlags |
| errors.test.ts | 46 | DomainError, isDomainError, wrapError, createDomainError, all common error classes, error catalog |
| crypto.test.ts | 42 | sha256Hex, randomDigits, randomToken, scrypt password hashing, AES-256-GCM encryption, search tokens |
| events.test.ts | 30 | events.emit, events.on, events.once, events.onAll, events.off, handler stats |
| sanitize.test.ts | 38 | sanitizeHtml, stripHtml, escapeHtml, XSS protection |
| otel.test.ts | 6 | OpenTelemetry initialization, tracing setup |
| health.test.ts | 20 | Health check utilities, MongoDB ping |
| circuit-breaker.test.ts | 17 | Circuit breaker state transitions, failure threshold |
| **Total** | **241+** | **Comprehensive foundation coverage** |

See [testing.md](./testing.md) for kernel testing patterns.

---

## Recent Improvements (2026)

Based on ISSUES-ROADMAP.md:

### ✅ P0-001: Test Infrastructure
- 241 unit tests passing in kernel
- Comprehensive coverage for context, events, errors, crypto
- Vitest configuration at monorepo root

### ✅ P1-001: OpenTelemetry Tracing
- Distributed tracing in `observability/otel.ts`
- Auto-instrumentation for Node.js
- Spans for all kernel operations

### ✅ P1-005: Repository Base Class
- `createTenantScopedRepository()` for new modules
- Common CRUD operations with soft delete
- Document mapping utilities
- Use for NEW repositories only

### ✅ P2-002: Event Schema Registry
- Centralized event registry in `events/schemas.ts`
- Type-safe `emitTyped()` and `onTyped()` helpers
- 35+ event schemas registered
- Compile-time type checking

### ✅ P2-004: Transaction Support
- `withTransaction()` and `withRetryableTransaction()` helpers
- Session management handled automatically
- MongoDB replica set support
- Graceful fallback when transactions disabled

### ✅ P2-008: Soft Delete Consistency
- `softDeleteFilter()` helper
- Automatic filtering in base repository
- `hardDelete()` for GDPR compliance
- Consistent across all modules

### ✅ P2-009: Pagination Consistency
- Cursor-based pagination standardized
- No `.skip()` operations (performance)
- Documented in `pagination/types.ts`
- MongoDB-specific helpers

### ✅ P2-011: Field Encryption
- AES-256-GCM encryption utilities
- `encryptField()` and `decryptField()`
- `createSearchToken()` for indexed lookups
- `DATA_ENCRYPTION_KEY` env variable

### ✅ P3-007: Database Migration System
- Full migration runner in `database/migrations/`
- Up/down migrations support
- Migration status tracking
- Seed data system

### ✅ P0-003: Input Sanitization
- `sanitize.ts` with DOMPurify
- XSS protection for HTML fields
- 38 tests covering edge cases

---

## Summary

The kernel provides battle-tested infrastructure for all Unisane modules:

**Core Systems:**
- **Context**: AsyncLocalStorage-based, global singleton, lazy loading
- **Database**: MongoDB with transactions, migrations, tenant scoping
- **Events**: Type-safe with Zod, emitTyped/onTyped, outbox pattern
- **Errors**: E1xxx-E8xxx catalog, domain error hierarchy
- **Observability**: Pino logging, OpenTelemetry, metrics
- **Pagination**: Cursor-based (no .skip())
- **Security**: Input sanitization, XSS protection
- **RBAC**: 6 roles, 50+ permissions

**Key Principles:**
- Zero dependencies on business modules
- Type-safety everywhere (Zod, TypeScript)
- Multi-tenant by default
- Performance-focused (cursor pagination, soft delete)
- Battle-tested (241 unit tests)

---

**Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)
**See Also:** [module-development.md](./module-development.md), [platform-layer.md](./platform-layer.md), [testing.md](./testing.md)
