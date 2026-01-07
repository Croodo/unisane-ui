# Kernel Layer

> Detailed specification for `@unisane/kernel` - the foundation layer.
>
> **Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## Overview

The kernel provides core infrastructure that ALL modules depend on:

- **Context** - Request-scoped data (tenant, user, permissions)
- **Database** - Connection, transactions, tenant scoping
- **Events** - Type-safe pub/sub with versioning
- **Cache** - KV abstraction (Redis/Memory)
- **Errors** - Domain error classes
- **Observability** - Logging, tracing, metrics
- **Utils** - Crypto, IDs, money, normalization
- **RBAC** - Role-based access control

---

## Package Structure

```
packages/kernel/
├── src/
│   ├── index.ts                # Public API
│   │
│   ├── context/
│   │   ├── context.ts          # AsyncLocalStorage-based context
│   │   ├── types.ts            # Context type definitions
│   │   └── index.ts
│   │
│   ├── database/
│   │   ├── connection.ts       # Connection management
│   │   ├── transaction.ts      # Transaction support
│   │   ├── tenant-scope.ts     # Auto tenant filtering
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── events/
│   │   ├── emitter.ts          # Type-safe event emitter
│   │   ├── contracts.ts        # Event schema definitions
│   │   ├── registry.ts         # Event registration
│   │   └── index.ts
│   │
│   ├── cache/
│   │   ├── cache.ts            # KV cache abstraction
│   │   ├── providers/
│   │   │   ├── redis.ts
│   │   │   └── memory.ts
│   │   └── index.ts
│   │
│   ├── errors/
│   │   ├── base.ts             # Base error classes
│   │   ├── catalog.ts          # Error code catalog
│   │   └── index.ts
│   │
│   ├── observability/
│   │   ├── logger.ts           # Structured logging
│   │   ├── tracer.ts           # Distributed tracing
│   │   ├── metrics.ts          # Metrics collection
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── crypto.ts           # Hashing, encryption
│   │   ├── ids.ts              # ID generation (nanoid, ulid)
│   │   ├── money.ts            # Safe money math
│   │   ├── normalize.ts        # String normalization
│   │   ├── pagination.ts       # Cursor pagination
│   │   └── index.ts
│   │
│   └── rbac/
│       ├── permissions.ts      # Permission constants
│       ├── roles.ts            # Role definitions
│       ├── check.ts            # Permission checking
│       └── index.ts
│
├── __tests__/
├── package.json
└── tsconfig.json
```

---

## Context System

### Purpose

Request-scoped data without prop drilling. Uses Node.js `AsyncLocalStorage`.

### Types

```typescript
// kernel/src/context/types.ts

export interface RequestContext {
  // Request metadata
  requestId: string;
  startTime: number;

  // Authentication (populated by gateway)
  isAuthenticated: boolean;
  authMethod?: 'session' | 'apikey' | 'bearer';

  // User & Tenant (populated by gateway)
  userId?: string;
  tenantId?: string;

  // Authorization (populated by gateway)
  role?: string;
  permissions?: string[];

  // Billing (populated lazily on first access)
  plan?: string;

  // Feature flags cache (populated lazily)
  flags?: Record<string, boolean>;
}

export interface ContextAPI {
  run<T>(ctx: RequestContext, fn: () => Promise<T>): Promise<T>;
  get(): RequestContext;
  tryGet(): RequestContext | undefined;
  set(updates: Partial<RequestContext>): void;
  getPlan(): Promise<string>;
  getFlags(): Promise<Record<string, boolean>>;
}
```

### Implementation

```typescript
// kernel/src/context/context.ts

import { AsyncLocalStorage } from 'async_hooks';

const storage = new AsyncLocalStorage<RequestContext>();

export const ctx: ContextAPI = {
  run<T>(context: RequestContext, fn: () => Promise<T>): Promise<T> {
    return storage.run(context, fn);
  },

  get(): RequestContext {
    const context = storage.getStore();
    if (!context) {
      throw new Error('Context not initialized. Ensure code runs within ctx.run()');
    }
    return context;
  },

  tryGet(): RequestContext | undefined {
    return storage.getStore();
  },

  set(updates: Partial<RequestContext>): void {
    const current = this.get();
    Object.assign(current, updates);
  },

  // Lazy getters - fetch on first access
  async getPlan(): Promise<string> {
    const context = this.get();
    if (context.plan) return context.plan;

    const { getPlanForTenant } = await import('@unisane/billing');
    const plan = await getPlanForTenant(context.tenantId!);
    context.plan = plan;
    return plan;
  },

  async getFlags(): Promise<Record<string, boolean>> {
    const context = this.get();
    if (context.flags) return context.flags;

    const { getAllFlags } = await import('@unisane/flags');
    const flags = await getAllFlags(context.tenantId!);
    context.flags = flags;
    return flags;
  }
};
```

### Usage

```typescript
import { ctx } from '@unisane/kernel';

// In gateway - initialize context
await ctx.run({
  requestId: nanoid(),
  startTime: Date.now(),
  isAuthenticated: true,
  userId: 'user_123',
  tenantId: 'tenant_456',
}, async () => {
  // All code here has access to context
  await handleRequest();
});

// In service - access context
export async function createSubscription(input: SubscribeInput) {
  const { tenantId, userId } = ctx.get();
  // Use tenantId, userId...
}

// Safe access (doesn't throw)
const context = ctx.tryGet();
if (context?.tenantId) {
  // ...
}
```

---

## Database Layer

### Connection Management

```typescript
// kernel/src/database/connection.ts

import { MongoClient, Db, Collection, Document } from 'mongodb';

let client: MongoClient;
let db: Db;

export async function connectDb(uri: string): Promise<void> {
  client = new MongoClient(uri);
  await client.connect();
  db = client.db();
}

export async function disconnectDb(): Promise<void> {
  await client?.close();
}

export function getDb(): Db {
  if (!db) throw new Error('Database not connected');
  return db;
}

export function col<T extends Document>(name: string): Collection<T> {
  return getDb().collection<T>(name);
}

export async function healthCheck(): Promise<boolean> {
  try {
    await db.command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}
```

### Transaction Support

```typescript
// kernel/src/database/transaction.ts

import { ClientSession } from 'mongodb';

/**
 * Execute operations within a MongoDB transaction.
 * Automatically retries on transient errors.
 */
export async function withTransaction<T>(
  fn: (session: ClientSession) => Promise<T>
): Promise<T> {
  const session = client.startSession();

  try {
    let result: T;

    await session.withTransaction(async () => {
      result = await fn(session);
    }, {
      readConcern: { level: 'majority' },
      writeConcern: { w: 'majority' },
    });

    return result!;
  } finally {
    await session.endSession();
  }
}

// Usage
await withTransaction(async (session) => {
  await col('tenants').insertOne(tenant, { session });
  await col('memberships').insertOne(membership, { session });
  // Both succeed or both rollback
});
```

### Tenant Scoping

```typescript
// kernel/src/database/tenant-scope.ts

import { Filter } from 'mongodb';
import { ctx } from '../context';
import { NotFoundError } from '../errors';

/**
 * Automatically adds tenantId filter to queries.
 * Prevents accidental cross-tenant data access.
 */
export function tenantFilter<T>(filter: Filter<T> = {}): Filter<T> {
  const context = ctx.tryGet();

  if (!context?.tenantId) {
    throw new Error('tenantId required for tenant-scoped query');
  }

  return {
    ...filter,
    tenantId: context.tenantId,
  } as Filter<T>;
}

/**
 * Validates that a document belongs to current tenant.
 * Use after fetching by ID to prevent IDOR attacks.
 */
export function assertTenantOwnership<T extends { tenantId: string }>(
  doc: T | null,
  resourceName: string
): asserts doc is T {
  if (!doc) {
    throw new NotFoundError(resourceName);
  }

  const { tenantId } = ctx.get();
  if (doc.tenantId !== tenantId) {
    // Log security event but throw generic error
    logger.warn('Tenant ownership violation attempted', {
      resourceTenantId: doc.tenantId,
      requestTenantId: tenantId,
    });
    throw new NotFoundError(resourceName);
  }
}

// Usage
const subscriptions = await col('subscriptions')
  .find(tenantFilter({ status: 'active' }))
  .toArray();

const doc = await col('invoices').findOne({ _id: id });
assertTenantOwnership(doc, 'Invoice');
```

---

## Event System

### Event Contracts

All events have typed schemas with versioning:

```typescript
// kernel/src/events/contracts.ts

import { z } from 'zod';

// Base metadata for all events
export const EventMeta = z.object({
  eventId: z.string(),
  eventType: z.string(),
  version: z.number(),
  timestamp: z.string().datetime(),
  source: z.string(),
  correlationId: z.string().optional(),
});

// Billing events
export const SubscriptionCreatedV1 = z.object({
  _meta: EventMeta,
  tenantId: z.string(),
  subscriptionId: z.string(),
  planId: z.string(),
  billingCycle: z.enum(['monthly', 'yearly']),
});

export const SubscriptionCancelledV1 = z.object({
  _meta: EventMeta,
  tenantId: z.string(),
  subscriptionId: z.string(),
  reason: z.string().optional(),
  cancelledAt: z.string().datetime(),
});

// Event registry - single source of truth
export const EventRegistry = {
  'billing.subscription.created': SubscriptionCreatedV1,
  'billing.subscription.cancelled': SubscriptionCancelledV1,
  'billing.invoice.paid': InvoicePaidV1,
  'identity.user.created': UserCreatedV1,
  'identity.user.deleted': UserDeletedV1,
  'tenant.created': TenantCreatedV1,
  'tenant.deleted': TenantDeletedV1,
} as const;

export type EventType = keyof typeof EventRegistry;
export type EventPayload<T extends EventType> = z.infer<typeof EventRegistry[T]>;
```

### Type-Safe Emitter

```typescript
// kernel/src/events/emitter.ts

type EventHandler<T extends EventType> = (payload: EventPayload<T>) => Promise<void>;

class TypedEventEmitter {
  private handlers: Map<EventType, Set<EventHandler<any>>> = new Map();

  on<T extends EventType>(eventType: T, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => this.handlers.get(eventType)?.delete(handler);
  }

  async emit<T extends EventType>(
    eventType: T,
    payload: Omit<EventPayload<T>, '_meta'>
  ): Promise<void> {
    const schema = EventRegistry[eventType];

    // Add metadata
    const fullPayload = {
      ...payload,
      _meta: {
        eventId: nanoid(),
        eventType,
        version: 1,
        timestamp: new Date().toISOString(),
        source: 'saaskit',
      },
    };

    // Validate
    const result = schema.safeParse(fullPayload);
    if (!result.success) {
      logger.error('Event validation failed', { eventType, errors: result.error });
      throw new Error(`Invalid event payload for ${eventType}`);
    }

    // Execute handlers
    const handlers = this.handlers.get(eventType);
    if (!handlers?.size) return;

    await Promise.allSettled(
      Array.from(handlers).map(h => h(result.data))
    );
  }
}

export const events = new TypedEventEmitter();
```

### Usage

```typescript
import { events } from '@unisane/kernel';

// Subscribe to events
events.on('billing.subscription.created', async (payload) => {
  // payload is fully typed
  await sendWelcomeEmail(payload.tenantId);
});

// Emit events
await events.emit('billing.subscription.created', {
  tenantId: 'ten_123',
  subscriptionId: 'sub_456',
  planId: 'pro',
  billingCycle: 'monthly',
});
```

---

## Error System

### Error Codes

```typescript
// kernel/src/errors/catalog.ts

export type ErrorCode =
  // Authentication
  | 'AUTH_REQUIRED'
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_TOKEN_EXPIRED'

  // Authorization
  | 'FORBIDDEN'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'TENANT_ACCESS_DENIED'

  // Not Found
  | 'NOT_FOUND'
  | 'RESOURCE_NOT_FOUND'

  // Validation
  | 'VALIDATION_FAILED'
  | 'INVALID_INPUT'

  // Conflict
  | 'CONFLICT'
  | 'DUPLICATE'
  | 'ALREADY_EXISTS'

  // Rate Limiting
  | 'RATE_LIMITED'

  // Business Logic
  | 'INSUFFICIENT_CREDITS'
  | 'SUBSCRIPTION_REQUIRED'
  | 'FEATURE_DISABLED'
  | 'QUOTA_EXCEEDED'
  | 'INVALID_STATE'

  // Server
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';
```

### Base Error Classes

```typescript
// kernel/src/errors/base.ts

export class DomainError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;
    super('NOT_FOUND', message, { resource, id });
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_FAILED', message, details);
  }
}

export class AuthenticationError extends DomainError {
  constructor(message = 'Authentication required') {
    super('AUTH_REQUIRED', message);
  }
}

export class AuthorizationError extends DomainError {
  constructor(message = 'Access denied') {
    super('FORBIDDEN', message);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, details?: unknown) {
    super('CONFLICT', message, details);
  }
}

export class BusinessError extends DomainError {
  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(code, message, details);
  }
}
```

### Usage

```typescript
import { NotFoundError, BusinessError } from '@unisane/kernel/errors';

// In service
if (!subscription) {
  throw new NotFoundError('Subscription', subscriptionId);
}

if (credits < required) {
  throw new BusinessError(
    'INSUFFICIENT_CREDITS',
    `Need ${required} credits, have ${credits}`,
    { required, available: credits }
  );
}
```

---

## Observability

### Structured Logger

```typescript
// kernel/src/observability/logger.ts

import pino from 'pino';
import { ctx } from '../context';

const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
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

### Tracer

```typescript
// kernel/src/observability/tracer.ts

export const tracer = {
  async trace<T>(
    name: string,
    fn: () => Promise<T>,
    attributes?: Record<string, string>
  ): Promise<T> {
    const start = performance.now();

    try {
      const result = await fn();
      logger.debug(`span:${name}`, {
        duration: performance.now() - start,
        status: 'ok',
        ...attributes,
      });
      return result;
    } catch (error) {
      logger.debug(`span:${name}`, {
        duration: performance.now() - start,
        status: 'error',
        ...attributes,
      });
      throw error;
    }
  },
};

// Usage
const result = await tracer.trace('billing.subscribe', async () => {
  return await subscribe(input);
}, { planId: input.planId });
```

---

## Utilities

### ID Generation

```typescript
// kernel/src/utils/ids.ts

import { nanoid } from 'nanoid';
import { ulid } from 'ulid';

// Short random ID (default 21 chars)
export const id = () => nanoid();

// Prefixed ID for different entity types
export const prefixedId = (prefix: string) => `${prefix}_${nanoid(16)}`;

// Common prefixed IDs
export const tenantId = () => prefixedId('ten');
export const userId = () => prefixedId('usr');
export const subscriptionId = () => prefixedId('sub');
export const invoiceId = () => prefixedId('inv');
export const apiKeyId = () => prefixedId('key');

// Sortable ID (for time-ordered records)
export const sortableId = () => ulid();
```

### Safe Money Math

```typescript
// kernel/src/utils/money.ts

// All money stored as cents (integers) to avoid floating point issues

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
```

### Crypto Utilities

```typescript
// kernel/src/utils/crypto.ts

import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';

export function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

export function generateApiKey(): { key: string; hash: string } {
  const key = `sk_${generateToken(24)}`;
  const hash = sha256(key);
  return { key, hash };
}

// AES-256-GCM encryption
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string, key: Buffer): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decrypt(encrypted: string, key: Buffer): string {
  const data = Buffer.from(encrypted, 'base64');
  const iv = data.subarray(0, 16);
  const tag = data.subarray(16, 32);
  const content = data.subarray(32);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(content) + decipher.final('utf8');
}
```

---

## RBAC

### Permissions

```typescript
// kernel/src/rbac/permissions.ts

export const PERMISSIONS = {
  // Settings
  'settings:read': 'View workspace settings',
  'settings:write': 'Modify workspace settings',

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

  // Workspace
  'workspace:delete': 'Delete workspace',
  'workspace:transfer': 'Transfer ownership',
} as const;

export type Permission = keyof typeof PERMISSIONS;
```

### Role Definitions

```typescript
// kernel/src/rbac/roles.ts

import type { Permission } from './permissions';

export const ROLES = {
  owner: {
    name: 'Owner',
    permissions: ['*'], // All permissions
  },
  admin: {
    name: 'Admin',
    permissions: [
      'settings:read', 'settings:write',
      'members:read', 'members:write', 'members:delete',
      'apikeys:read', 'apikeys:write', 'apikeys:delete',
      'billing:read', 'billing:write',
      'audit:read',
    ],
  },
  member: {
    name: 'Member',
    permissions: [
      'settings:read',
      'members:read',
      'apikeys:read',
    ],
  },
  viewer: {
    name: 'Viewer',
    permissions: [
      'settings:read',
      'members:read',
    ],
  },
} as const;

export type Role = keyof typeof ROLES;
```

### Permission Checking

```typescript
// kernel/src/rbac/check.ts

import { ctx } from '../context';
import { AuthorizationError } from '../errors';
import { ROLES, Role } from './roles';
import type { Permission } from './permissions';

export function hasPermission(permission: Permission): boolean {
  const { permissions, role } = ctx.get();

  // Owner has all permissions
  if (role === 'owner') return true;

  // Check explicit permissions
  if (permissions?.includes(permission)) return true;
  if (permissions?.includes('*')) return true;

  return false;
}

export function requirePermission(permission: Permission): void {
  if (!hasPermission(permission)) {
    throw new AuthorizationError(`Permission '${permission}' required`);
  }
}

// Alias
export const can = hasPermission;
export const enforce = requirePermission;
```

---

## Public API

```typescript
// kernel/src/index.ts

// Context
export { ctx } from './context';
export type { RequestContext, ContextAPI } from './context/types';

// Database
export { connectDb, disconnectDb, getDb, col, healthCheck } from './database/connection';
export { withTransaction } from './database/transaction';
export { tenantFilter, assertTenantOwnership } from './database/tenant-scope';

// Events
export { events } from './events/emitter';
export { EventRegistry } from './events/contracts';
export type { EventType, EventPayload } from './events/contracts';

// Cache
export { cache } from './cache';
export type { CacheProvider } from './cache/types';

// Errors
export {
  DomainError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  BusinessError,
} from './errors';
export type { ErrorCode } from './errors/catalog';

// Observability
export { logger } from './observability/logger';
export { tracer } from './observability/tracer';
export { metrics } from './observability/metrics';

// Utils
export * from './utils/ids';
export * from './utils/crypto';
export * from './utils/money';
export * from './utils/normalize';
export * from './utils/pagination';

// RBAC
export { can, enforce, hasPermission, requirePermission } from './rbac/check';
export { PERMISSIONS } from './rbac/permissions';
export { ROLES } from './rbac/roles';
export type { Permission, Role } from './rbac';
```

---

## Testing

See [testing.md](./testing.md) for kernel testing patterns.

```typescript
// Example: Testing with mocked context
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ctx } from '@unisane/kernel';

vi.mock('@unisane/kernel', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    ctx: {
      get: vi.fn(() => ({
        tenantId: 'test-tenant',
        userId: 'test-user',
        permissions: ['*'],
      })),
    },
  };
});

describe('service', () => {
  it('uses context', async () => {
    const result = await someService();
    expect(ctx.get).toHaveBeenCalled();
  });
});
```

---

**Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)
