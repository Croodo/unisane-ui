# Unisane Architecture

> **Last Updated**: January 2026
> **Version**: Current implementation (not planned features)
> **Purpose**: Complete architectural knowledge for developers and LLMs

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Monorepo Structure](#monorepo-structure)
3. [Foundation Layer](#foundation-layer)
4. [Module Layer](#module-layer)
5. [Contract-First Codegen](#contract-first-codegen)
6. [Platform Layer](#platform-layer)
7. [Data Flow & Request Lifecycle](#data-flow--request-lifecycle)
8. [Testing Strategy](#testing-strategy)
9. [Development Workflow](#development-workflow)
10. [Deployment & Production](#deployment--production)
11. [Key Architectural Decisions](#key-architectural-decisions)
12. [Implementation Status](#implementation-status)

---

## Executive Summary

### What is Unisane?

**Unisane** is a production-ready, enterprise-grade SaaS starter kit distributed as **source code** (shadcn-style). It provides a complete foundation for building multi-tenant B2B SaaS applications with:

- **Zero runtime dependencies** on Unisane infrastructure
- **Full source code ownership** - customize everything
- **Contract-first development** - 91% of API code auto-generated
- **Modular monolith** architecture - easy to understand, deploy, and scale

### Key Statistics

- **30 packages** in monorepo (foundation + modules + UI + tooling)
- **~21,000 lines** of module business logic
- **~17,300 lines** of auto-generated code (91% of API routes)
- **15 business modules** (auth, identity, tenants, billing, credits, flags, settings, storage, audit, notify, usage, webhooks, ai, media, pdf)
- **800+ tests passing** (Vitest + Playwright)
- **51 E2E tests** covering critical flows
- **61 Material Design 3** UI components

### Technology Stack

**Backend**:
- Next.js 16 (App Router, React Server Components)
- TypeScript 5.9 (strict mode)
- MongoDB (with automatic tenant scoping)
- Redis/Upstash KV (caching layer)
- Pino (structured logging)
- Zod (validation and type inference)

**Frontend**:
- React 19
- Tailwind CSS v4 (with OKLCH color space)
- Material Design 3 components
- React Query v5 (data fetching)
- Recharts (data visualization)

**API & Contracts**:
- ts-rest (end-to-end type safety)
- Zod schemas (single source of truth)
- Custom codegen (AST parsing with ts-morph)

**Tooling**:
- pnpm + Turborepo (monorepo management)
- Vitest (unit/integration tests)
- Playwright (E2E tests)
- ESLint + Prettier
- Custom CLI (`unisane devtools`)

### Architecture Style

**Modular Monolith** with:
- **Contract-first development** - Define API contracts, generate routes/SDK/hooks
- **Hexagonal architecture** - Modules as domain services, starters as adapters
- **Event-driven communication** - Typed events with Zod schemas
- **Tenant isolation** - Automatic row-level security in all queries
- **Repository pattern** - Clean data access layer
- **RBAC** - 50+ permissions, 6 built-in roles

### Distribution Model

Unisane is distributed as **source code**, not as npm packages or runtime services:

1. **Clone the monorepo** - Get all source code
2. **Run codegen** - Generate routes, SDK, hooks from contracts
3. **Deploy anywhere** - Vercel, Railway, AWS, self-hosted
4. **No vendor lock-in** - No runtime dependencies on Unisane
5. **Full customization** - Modify any file in your codebase

Think "shadcn for backend" - copy the code you need, own it completely.

---

## Monorepo Structure

### Overview

The Unisane monorepo contains **30 packages** organized into 5 logical layers:

```
unisane-monorepo/
├── packages/
│   ├── foundation/        # Core infrastructure (3 packages)
│   ├── modules/           # Business domain modules (15 packages)
│   ├── ui/                # React components (3 packages)
│   └── tooling/           # Dev tools & codegen (9 packages)
├── starters/
│   └── saaskit/           # Production starter template
├── handbook/              # Architecture docs
└── tests/
    └── e2e/               # Playwright E2E tests
```

### Foundation Layer (3 packages)

Core infrastructure used by all modules:

1. **`@unisane/kernel`** - Context, database, cache, events, errors, RBAC, observability
2. **`@unisane/gateway`** - HTTP handlers, guards, auth, query DSL, error mapping
3. **`@unisane/contracts`** - Shared Zod schemas, common types

**Purpose**: Provide battle-tested primitives that modules build on top of.

**Key Features**:
- AsyncLocalStorage-based request context (no prop drilling)
- Automatic tenant scoping for all database queries
- Typed event system with Zod schemas
- Centralized error catalog (E1xxx-E8xxx codes)
- RBAC with 50+ permissions and 6 roles
- Redis/KV/memory cache adapters
- Pino structured logging
- Metrics and tracing

### Module Layer (15 packages)

Business domain modules under [packages/modules/](../../packages/modules/):

| Module | Package | Purpose | LOC |
|--------|---------|---------|-----|
| **auth** | `@unisane/auth` | Authentication (signup, signin, OTP, password reset) | ~1,200 |
| **identity** | `@unisane/identity` | Users, memberships, API keys | ~1,800 |
| **tenants** | `@unisane/tenants` | Multi-tenancy (tenant CRUD, settings) | ~800 |
| **billing** | `@unisane/billing` | Stripe/Razorpay subscriptions | ~2,000 |
| **credits** | `@unisane/credits` | Usage-based billing ledger | ~900 |
| **flags** | `@unisane/flags` | Feature flags with overrides | ~600 |
| **settings** | `@unisane/settings` | Key-value settings store | ~400 |
| **storage** | `@unisane/storage` | S3 file uploads | ~700 |
| **audit** | `@unisane/audit` | Audit logging | ~500 |
| **notify** | `@unisane/notify` | Email + in-app notifications | ~1,500 |
| **usage** | `@unisane/usage` | Usage metering | ~800 |
| **webhooks** | `@unisane/webhooks` | Outbound webhooks with retries | ~1,200 |
| **ai** | `@unisane/ai` | OpenAI/Anthropic wrapper | ~600 |
| **media** | `@unisane/media` | Image/video processing | ~700 |
| **pdf** | `@unisane/pdf` | PDF generation | ~400 |

**Total Module LOC**: ~21,000 lines of business logic

**Module Structure** (example: `@unisane/identity`):
```
packages/modules/identity/
├── src/
│   ├── data/
│   │   ├── User.model.ts          # Zod schemas
│   │   ├── User.repo.ts           # Repository pattern
│   │   └── Membership.repo.ts
│   ├── service/
│   │   ├── users.ts               # Business logic
│   │   └── memberships.ts
│   ├── events.ts                  # Typed events
│   └── index.ts                   # Public exports
├── test/
│   └── users.test.ts              # Vitest tests
└── package.json
```

### UI Layer (3 packages)

React components under [packages/ui/](../../packages/ui/):

1. **`@unisane/ui-core`** - 61 Material Design 3 components (Button, TextField, Card, etc.)
2. **`@unisane/ui-data-table`** - Powerful data table with sorting, filtering, pagination
3. **`@unisane/ui-tokens`** - Design tokens (colors, spacing, typography)

**Design System**:
- Material Design 3 principles
- Tailwind CSS v4 with OKLCH color space
- Dark mode support
- Responsive layouts
- Accessibility (ARIA, keyboard nav)

### Tooling Layer (9 packages)

Development tools under [packages/tooling/](../../packages/tooling/):

1. **`@unisane/devtools`** - CLI for codegen, migrations, dev server
2. **`@unisane/cli-core`** - CLI framework primitives
3. **`@unisane/test-utils`** - Test helpers and fixtures
4. **`@unisane/contracts-core`** - Contract metadata system
5. **`@unisane/gen-routes`** - Route generation from contracts
6. **`@unisane/gen-sdk`** - SDK generation (client + hooks)
7. **`@unisane/gen-types`** - Type extraction for browser
8. **`@unisane/eslint-config`** - Shared ESLint rules
9. **`@unisane/tsconfig`** - Shared TypeScript configs

**Key Tool**: `unisane devtools` CLI
- `routes:gen` - Generate API routes from contracts
- `sdk:gen` - Generate TypeScript SDK and React hooks
- `types:gen` - Extract browser-safe types
- `db:migrate` - Run database migrations
- `dev` - Start dev server with hot reload

### Starters

**[starters/saaskit/](../../starters/saaskit/)** - Production-ready starter template:

```
saaskit/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── api/                   # API routes
│   │   │   ├── rest/v1/           # 83 generated routes
│   │   │   ├── auth/              # Manual OAuth routes
│   │   │   ├── inngest/           # Background jobs
│   │   │   ├── webhooks/          # Webhook handlers
│   │   │   ├── health/            # Health checks
│   │   │   └── ready/             # Readiness probe
│   │   ├── (auth)/                # Auth pages
│   │   ├── (dash)/                # Dashboard pages
│   │   └── layout.tsx
│   ├── contracts/                 # ts-rest contracts with metadata
│   ├── sdk/                       # Generated SDK
│   │   ├── client/                # TypeScript clients
│   │   ├── hooks/                 # React Query hooks
│   │   └── types/                 # Browser-safe types
│   ├── platform/                  # Platform adapters
│   │   ├── db/                    # Database initialization
│   │   ├── cache/                 # Cache initialization
│   │   └── inngest/               # Background job functions
│   └── components/                # App-specific components
├── public/                        # Static assets
└── package.json
```

**Generated Code**:
- 83 API routes in `src/app/api/rest/v1/` (auto-generated from contracts)
- TypeScript SDK in `src/sdk/client/`
- React Query hooks in `src/sdk/hooks/`
- Type definitions in `src/sdk/types/`

**Manual Code**:
- 8 API routes (OAuth, webhooks, health checks)
- React pages and components
- Platform initialization
- Background job functions

**Ratio**: 91% generated, 9% manual

---

## Foundation Layer

The foundation layer provides core primitives that all modules and starters build on. It's battle-tested, production-ready infrastructure.

### @unisane/kernel

**Purpose**: Core primitives for building modules - context, database, cache, events, errors, RBAC, observability.

#### 1. Context System

**File**: [packages/foundation/kernel/src/context/context.ts](../../packages/foundation/kernel/src/context/context.ts)

**Problem**: How to pass request-scoped data (tenantId, userId, permissions) without prop drilling?

**Solution**: AsyncLocalStorage-based context with lazy loading.

```typescript
interface RequestContext {
  requestId: string;
  tenantId?: string;
  userId?: string;
  permissions?: Set<Permission>;  // Lazy-loaded from DB
  plan?: string;                  // Lazy-loaded from DB
  flags?: Record<string, boolean>; // Lazy-loaded from flags service
  trace?: { spanId: string; traceId: string };
}

// Set context at request start
setContext({ requestId: 'req_123', tenantId: 'tenant_abc', userId: 'user_xyz' });

// Access anywhere in the call stack (no prop drilling!)
const ctx = getContext();
console.log(ctx.tenantId); // 'tenant_abc'

// Lazy-load permissions when needed
const perms = await getPermissions(); // Fetches from DB once, caches in context
if (perms.has('users:write')) {
  // Allow action
}
```

**Benefits**:
- No prop drilling through 10 layers of functions
- Automatic cleanup after request completes
- Lazy loading - only fetch what you need
- Type-safe with TypeScript

**Usage Pattern**:
```typescript
// In HTTP handler (gateway sets context)
export const GET = makeHandler({ op: 'users.list' }, async ({ ctx }) => {
  // ctx is automatically set from request
  const users = await listUsers();
  return users;
});

// Deep in service layer
async function listUsers() {
  const ctx = getContext(); // No parameters needed!
  const tenantId = ctx.tenantId;
  return db.users.find({ tenantId });
}
```

#### 2. Database (MongoDB)

**File**: [packages/foundation/kernel/src/database/](../../packages/foundation/kernel/src/database/)

**Features**:
- Automatic tenant scoping
- Type-safe queries with Zod schemas
- Connection pooling
- Transaction support
- Migration utilities

**Tenant Scoping**:

Every query automatically includes `tenantId` from context:

```typescript
// packages/foundation/kernel/src/database/tenant-scope.ts
export function tenantFilter<T extends Record<string, unknown>>(
  filter: T
): T & { tenantId: string } {
  const ctx = getContext();
  if (!ctx.tenantId) throw new Error('No tenantId in context');
  return { ...filter, tenantId: ctx.tenantId };
}

// Usage in repositories
class UserRepo {
  static async findById(id: string) {
    const filter = tenantFilter({ _id: id }); // Auto-adds tenantId
    return db.users.findOne(filter);
    // Actual query: { _id: id, tenantId: 'tenant_abc' }
  }

  static async list() {
    const filter = tenantFilter({}); // Auto-adds tenantId
    return db.users.find(filter).toArray();
    // Actual query: { tenantId: 'tenant_abc' }
  }
}
```

**Connection**:
```typescript
import { getDb } from '@unisane/kernel';

const db = await getDb();
const users = db.collection('users');
```

**Migrations**:
```bash
unisane devtools db:migrate
```

#### 3. Cache (Redis/KV/Memory)

**File**: [packages/foundation/kernel/src/cache/](../../packages/foundation/kernel/src/cache/)

**Adapters**:
- **Redis** - Production (ioredis)
- **Upstash KV** - Serverless (REST API)
- **Memory** - Development/testing

**Interface**:
```typescript
import { kv } from '@unisane/kernel';

// Set with TTL
await kv.set('session:abc', JSON.stringify(session), { EX: 3600 });

// Get
const data = await kv.get('session:abc');

// Delete
await kv.del('session:abc');

// Atomic increment
await kv.incr('counter:api_calls');
```

**Cache Patterns**:
```typescript
// Cache-aside pattern
async function getUser(id: string): Promise<User> {
  const cacheKey = `user:${id}`;

  // Try cache first
  const cached = await kv.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Cache miss - fetch from DB
  const user = await db.users.findOne({ _id: id });

  // Populate cache
  await kv.set(cacheKey, JSON.stringify(user), { EX: 300 });

  return user;
}
```

#### 4. Events

**File**: [packages/foundation/kernel/src/events/](../../packages/foundation/kernel/src/events/)

**Typed Event System**:

```typescript
import { defineEvent, emit } from '@unisane/kernel';
import { z } from 'zod';

// Define event with Zod schema
export const UserCreatedEvent = defineEvent({
  name: 'user.created',
  schema: z.object({
    userId: z.string(),
    email: z.string(),
    tenantId: z.string(),
  }),
});

// Emit event
await emit(UserCreatedEvent, {
  userId: 'user_123',
  email: 'alice@example.com',
  tenantId: 'tenant_abc',
});

// Listen for event (in another module)
import { on } from '@unisane/kernel';

on(UserCreatedEvent, async (payload) => {
  // payload is typed!
  console.log(`New user: ${payload.email}`);

  // Send welcome email
  await sendWelcomeEmail(payload.email);
});
```

**Event Flow**:
1. Module A emits event after action completes
2. Event system delivers to all registered listeners
3. Listeners execute asynchronously (non-blocking)
4. Errors in listeners don't affect original operation

**Use Cases**:
- Send welcome email after user signup
- Update analytics after subscription change
- Invalidate cache after data mutation
- Trigger webhooks after important events

#### 5. Errors

**File**: [packages/foundation/kernel/src/errors/catalog.ts](../../packages/foundation/kernel/src/errors/catalog.ts)

**Centralized Error Catalog**:

```typescript
// Error definitions with codes
export const ERR = {
  // E1xxx - Authentication
  loginRequired: () => new DomainError('E1001', 'Login required'),
  invalidCredentials: () => new DomainError('E1002', 'Invalid credentials'),
  sessionExpired: () => new DomainError('E1003', 'Session expired'),

  // E2xxx - Authorization
  permissionDenied: (perm: string) =>
    new DomainError('E2001', `Permission denied: ${perm}`),

  // E3xxx - Validation
  invalidInput: (msg: string) =>
    new DomainError('E3001', `Invalid input: ${msg}`),

  // E4xxx - Resource
  notFound: (resource: string) =>
    new DomainError('E4001', `${resource} not found`),
  duplicate: (resource: string) =>
    new DomainError('E4002', `${resource} already exists`),

  // E5xxx - Business Logic
  insufficientCredits: () =>
    new DomainError('E5001', 'Insufficient credits'),
  subscriptionRequired: () =>
    new DomainError('E5002', 'Active subscription required'),

  // E6xxx - External Services
  stripeError: (msg: string) =>
    new DomainError('E6001', `Stripe error: ${msg}`),
  emailFailed: (msg: string) =>
    new DomainError('E6002', `Email failed: ${msg}`),

  // E7xxx - Rate Limiting
  rateLimitExceeded: () =>
    new DomainError('E7001', 'Rate limit exceeded'),

  // E8xxx - Internal
  internalError: (msg: string) =>
    new DomainError('E8001', `Internal error: ${msg}`),
};

// Usage in services
async function updateUser(id: string, input: unknown) {
  const user = await db.users.findOne({ _id: id });
  if (!user) throw ERR.notFound('User');

  // Update logic...
}
```

**Error Handling in Gateway**:

The gateway automatically maps domain errors to HTTP responses:

```typescript
// E1xxx -> 401 Unauthorized
// E2xxx -> 403 Forbidden
// E3xxx -> 400 Bad Request
// E4001 -> 404 Not Found
// E4002 -> 409 Conflict
// E5xxx -> 400 Bad Request (business logic)
// E6xxx -> 502 Bad Gateway
// E7xxx -> 429 Too Many Requests
// E8xxx -> 500 Internal Server Error
```

#### 6. RBAC (Role-Based Access Control)

**File**: [packages/foundation/kernel/src/rbac/](../../packages/foundation/kernel/src/rbac/)

**50+ Permissions**:

```typescript
export type Permission =
  // Users
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  // Tenants
  | 'tenants:read'
  | 'tenants:write'
  | 'tenants:delete'
  // Billing
  | 'billing:read'
  | 'billing:write'
  // Settings
  | 'settings:read'
  | 'settings:write'
  // ... 40+ more
  ;
```

**6 Built-in Roles**:

```typescript
export const ROLES = {
  super_admin: {
    name: 'Super Admin',
    permissions: ['*'], // All permissions
  },
  tenant_owner: {
    name: 'Tenant Owner',
    permissions: [
      'users:read', 'users:write', 'users:delete',
      'tenants:read', 'tenants:write',
      'billing:read', 'billing:write',
      'settings:read', 'settings:write',
      // ... all tenant-level permissions
    ],
  },
  tenant_admin: {
    name: 'Tenant Admin',
    permissions: [
      'users:read', 'users:write',
      'tenants:read',
      'settings:read', 'settings:write',
      // ... admin permissions
    ],
  },
  tenant_member: {
    name: 'Member',
    permissions: [
      'users:read',
      'tenants:read',
      'settings:read',
      // ... read-only permissions
    ],
  },
  tenant_billing: {
    name: 'Billing Manager',
    permissions: [
      'billing:read', 'billing:write',
      'usage:read',
    ],
  },
  tenant_support: {
    name: 'Support',
    permissions: [
      'users:read',
      'tenants:read',
      'audit:read',
    ],
  },
};
```

**Permission Checks**:

```typescript
import { can } from '@unisane/kernel';

// In service layer
async function deleteUser(id: string) {
  if (!can('users:delete')) {
    throw ERR.permissionDenied('users:delete');
  }

  await db.users.deleteOne({ _id: id });
}

// In gateway (automatic check)
export const DELETE = makeHandler({
  op: 'users.delete',
  perm: 'users:delete', // Automatic 403 if user lacks permission
}, async ({ params }) => {
  await deleteUser(params.id);
  return { success: true };
});
```

#### 7. Observability

**Logging** ([packages/foundation/kernel/src/observability/logger.ts](../../packages/foundation/kernel/src/observability/logger.ts)):

```typescript
import { logger } from '@unisane/kernel';

// Structured logging with Pino
logger.info({ userId: 'user_123' }, 'User logged in');
logger.error({ err, userId: 'user_123' }, 'Failed to update user');

// Logs include context automatically:
// {
//   level: 'info',
//   time: 1234567890,
//   requestId: 'req_abc',
//   tenantId: 'tenant_xyz',
//   userId: 'user_123',
//   msg: 'User logged in'
// }
```

**Metrics** ([packages/foundation/kernel/src/observability/metrics.ts](../../packages/foundation/kernel/src/observability/metrics.ts)):

```typescript
import { metrics } from '@unisane/kernel';

// Increment counter
metrics.inc('api.requests', 1, { endpoint: '/api/users', method: 'GET' });

// Record timing
const start = Date.now();
await doWork();
metrics.timing('api.duration', Date.now() - start, { endpoint: '/api/users' });

// Set gauge
metrics.gauge('active_connections', 42);
```

#### 8. Utilities

**ID Generation**:
```typescript
import { generateId } from '@unisane/kernel';

const userId = generateId('user'); // 'user_abc123...'
const tenantId = generateId('tenant'); // 'tenant_xyz789...'
```

**Crypto**:
```typescript
import { scryptHashPassword, scryptVerifyPassword } from '@unisane/kernel';

// Hash password
const { hash, salt } = await scryptHashPassword('password123');

// Verify password
const valid = await scryptVerifyPassword('password123', salt, hash);
```

**Money**:
```typescript
import { Money } from '@unisane/kernel';

const price = new Money(1999, 'USD'); // $19.99
console.log(price.format()); // '$19.99'
console.log(price.cents); // 1999
```

---

### @unisane/gateway

**Purpose**: HTTP request handling, authentication, authorization, validation, error mapping.

**File**: [packages/foundation/gateway/src/handler/httpHandler.ts](../../packages/foundation/gateway/src/handler/httpHandler.ts)

#### makeHandler

The `makeHandler` function wraps your service logic with automatic security and validation:

```typescript
import { makeHandler } from '@unisane/gateway';
import { z } from 'zod';

const ZCreateUser = z.object({
  email: z.string().email(),
  name: z.string(),
});

export const POST = makeHandler<typeof ZCreateUser>(
  {
    op: 'users.create',
    zod: ZCreateUser,           // Validate request body
    perm: 'users:write',        // Require permission
    requireUser: true,          // Require authenticated user
    rateKey: ({ ctx }) => `${ctx.tenantId}:users.create`, // Rate limit per tenant
  },
  async ({ body, ctx, requestId }) => {
    // body is typed and validated!
    const user = await createUser({
      email: body.email,
      name: body.name,
      tenantId: ctx.tenantId!,
    });

    return user;
  }
);
```

**What makeHandler Does**:

1. **Sets context** - Extract auth from session/JWT/API key, set tenantId/userId
2. **Rate limiting** - Check rate limit based on `rateKey`
3. **Authentication** - Return 401 if `requireUser: true` and no user
4. **Authorization** - Return 403 if `perm` specified and user lacks permission
5. **Validation** - Return 400 if body doesn't match `zod` schema
6. **Executes handler** - Call your service function
7. **Error mapping** - Convert domain errors to HTTP responses
8. **Logging** - Log request/response with context
9. **Metrics** - Record timing and status code

#### makeHandlerRaw

For handlers that need raw Request/Response (e.g., OAuth callbacks, webhooks):

```typescript
import { makeHandlerRaw } from '@unisane/gateway';

export const GET = makeHandlerRaw<unknown, { provider: string }>(
  {
    op: 'auth.oauth.callback',
    allowUnauthed: true,
  },
  async ({ req, params, requestId }) => {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');

    // Exchange code for tokens...

    return new Response(null, {
      status: 302,
      headers: { 'location': '/dashboard' },
    });
  }
);
```

#### Query DSL

**File**: [packages/foundation/gateway/src/query/](../../packages/foundation/gateway/src/query/)

Standardized query parameters for listing endpoints:

```typescript
import { parseListQuery } from '@unisane/gateway';

export const GET = makeHandler({ op: 'users.list' }, async ({ req }) => {
  const query = parseListQuery(req.url, {
    defaultLimit: 20,
    maxLimit: 100,
    sortFields: ['createdAt', 'email', 'name'],
    filterFields: ['status', 'role'],
  });

  const users = await db.users
    .find({ ...tenantFilter(query.filters) })
    .sort({ [query.sort.field]: query.sort.order === 'asc' ? 1 : -1 })
    .skip(query.offset)
    .limit(query.limit)
    .toArray();

  const total = await db.users.countDocuments(tenantFilter(query.filters));

  return { data: users, total, limit: query.limit, offset: query.offset };
});
```

---

### @unisane/contracts

**Purpose**: Shared Zod schemas and types used across modules.

**File**: [packages/foundation/contracts/src/](../../packages/foundation/contracts/src/)

**Common Schemas**:

```typescript
// Error response format
export const ZErrorResponse = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    details: z.record(z.unknown()).optional(),
  }),
});

// List response format
export const ZListResponse = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  });
```

---

## Module Layer

The module layer contains 15 business domain modules. Each module is self-contained with:
- **Data models** (Zod schemas)
- **Repositories** (data access with tenant scoping)
- **Services** (business logic)
- **Events** (typed with Zod)
- **Tests** (Vitest)

Modules communicate via:
1. **Direct imports** - Call service functions from other modules
2. **Events** - React to actions in other modules asynchronously

### Module Summary

All 15 modules follow consistent patterns:

1. **[@unisane/auth](../../packages/modules/auth/)** - Signup, signin, password reset, OTP
2. **[@unisane/identity](../../packages/modules/identity/)** - Users, memberships, API keys
3. **[@unisane/tenants](../../packages/modules/tenants/)** - Multi-tenancy, plan management
4. **[@unisane/billing](../../packages/modules/billing/)** - Stripe/Razorpay subscriptions
5. **[@unisane/credits](../../packages/modules/credits/)** - Usage-based billing ledger
6. **[@unisane/flags](../../packages/modules/flags/)** - Feature flags with overrides
7. **[@unisane/settings](../../packages/modules/settings/)** - Key-value settings store
8. **[@unisane/storage](../../packages/modules/storage/)** - S3 file uploads
9. **[@unisane/audit](../../packages/modules/audit/)** - Audit logging
10. **[@unisane/notify](../../packages/modules/notify/)** - Email + in-app notifications
11. **[@unisane/usage](../../packages/modules/usage/)** - Usage metering
12. **[@unisane/webhooks](../../packages/modules/webhooks/)** - Outbound webhooks with retries
13. **[@unisane/ai](../../packages/modules/ai/)** - OpenAI/Anthropic wrapper
14. **[@unisane/media](../../packages/modules/media/)** - Image/video processing
15. **[@unisane/pdf](../../packages/modules/pdf/)** - PDF generation

Each follows repository pattern, emits typed events, and has comprehensive test coverage.

---

## Contract-First Codegen

The most distinctive feature of Unisane is **contract-first development**: define API contracts with Zod + ts-rest, then auto-generate routes, SDK, and React hooks.

**Result**: 91% of API code is generated (83 out of 91 routes).

### How It Works

1. **Define contract** with Zod schemas and `defineOpMeta()` metadata
2. **Run codegen** - AST parsing extracts metadata
3. **Generate route handlers** - Automatic `makeHandler` wrappers
4. **Generate SDK** - TypeScript client + React Query hooks
5. **Extract types** - Browser-safe type definitions

### Example Contract

**File**: [starters/saaskit/src/contracts/users.contract.ts](../../starters/saaskit/src/contracts/)

```typescript
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { withMeta, defineOpMeta } from '@/src/contracts/meta';

const c = initContract();

export const usersContract = c.router({
  // List users
  list: withMeta(
    {
      method: 'GET',
      path: '/api/rest/v1/users',
      responses: {
        200: z.object({
          data: z.array(ZUser),
          total: z.number(),
        }),
      },
    },
    defineOpMeta({
      op: 'users.list',
      perm: 'users:read',
      requireUser: true,
      service: {
        importPath: '@unisane/identity',
        fn: 'listUsers',
        invoke: 'object',
        callArgs: [
          { name: 'filters', from: 'query' },
        ],
      },
    })
  ),

  // Create user
  create: withMeta(
    {
      method: 'POST',
      path: '/api/rest/v1/users',
      body: ZUserCreate,
      responses: {
        200: ZUser,
      },
    },
    defineOpMeta({
      op: 'users.create',
      perm: 'users:write',
      requireUser: true,
      idempotent: true,
      service: {
        importPath: '@unisane/identity',
        fn: 'createUser',
        invoke: 'object',
        callArgs: [
          { name: 'input', from: 'body' },
          { name: 'tenantId', from: 'ctx', key: 'tenantId' },
        ],
      },
      invalidate: [
        { kind: 'prefix', key: ['users', 'list'] },
      ],
    })
  ),
});
```

### Generated Route

**File**: [starters/saaskit/src/app/api/rest/v1/users/route.ts](../../starters/saaskit/src/app/api/rest/v1/users/route.ts)

```typescript
/* AUTO-GENERATED by 'npm run routes:gen' — DO NOT EDIT */
import { makeHandler } from '@unisane/gateway';
import { listUsers, createUser } from '@unisane/identity';

export const GET = makeHandler<undefined>(
  {
    op: 'users.list',
    perm: 'users:read',
    requireUser: true,
  },
  async ({ req, query, ctx }) => {
    const result = await listUsers({ filters: query });
    return result;
  }
);

export const POST = makeHandler<typeof ZUserCreate>(
  {
    op: 'users.create',
    perm: 'users:write',
    requireUser: true,
    idempotent: true,
    zod: ZUserCreate,
  },
  async ({ body, ctx }) => {
    const result = await createUser({
      input: body,
      tenantId: ctx?.tenantId,
    });
    return result;
  }
);

export const runtime = 'nodejs';
```

### Generated React Hook

**File**: [starters/saaskit/src/sdk/hooks/generated/domains/users.hooks.ts](../../starters/saaskit/src/sdk/hooks/generated/)

```typescript
/* AUTO-GENERATED by 'npm run sdk:gen' — DO NOT EDIT */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { browserApi, unwrapResponse } from '@/src/sdk/client';

// List users (query)
export function useUsersList(query?: { limit?: number }, options?) {
  return useQuery({
    queryKey: ['users', 'list', query],
    queryFn: async () => {
      const api = await browserApi();
      return unwrapResponse(await api.users.list({ query }));
    },
    ...options,
  });
}

// Create user (mutation)
export function useUsersCreate(options?) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (variables: { email: string; name: string }) => {
      const api = await browserApi();
      return unwrapResponse(await api.users.create({ body: variables }));
    },
    onSuccess: (data, variables, context) => {
      // Invalidate list queries (from metadata)
      qc.invalidateQueries({ queryKey: ['users', 'list'] });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}
```

### Development Workflow

```bash
# 1. Define contract
vim src/contracts/users.contract.ts

# 2. Generate everything
npm run routes:gen  # Generate route handlers
npm run sdk:gen     # Generate SDK + hooks
npm run types:gen   # Extract types

# 3. Use in React component (already generated!)
```

**In Practice**:

```tsx
'use client';

import { useUsersList, useUsersCreate } from '@/src/sdk/hooks';

export default function UsersPage() {
  const { data } = useUsersList({ limit: 20 });
  const createUser = useUsersCreate();

  const handleCreate = async (email: string, name: string) => {
    await createUser.mutateAsync({ email, name });
    // List query automatically refetched due to invalidate metadata
  };

  return (
    <div>
      <h1>Users</h1>
      {data?.data.map((user) => (
        <div key={user._id}>{user.name}</div>
      ))}
    </div>
  );
}
```

**Statistics**: 83 generated routes, 8 manual routes = 91% codegen coverage

---

## Platform Layer

The **platform layer** lives in starters (e.g., [starters/saaskit/](../../starters/saaskit/)) and provides:
- Next.js App Router setup
- Database/cache initialization
- Platform-specific routes (OAuth, webhooks, health)
- React pages and components
- Background job functions

This follows **hexagonal architecture**:
- **Core** = Modules (domain logic)
- **Adapters** = Platform layer (HTTP, DB, cache, jobs)

### Manual API Routes

Some routes require custom logic not suitable for codegen:

1. **OAuth** - [src/app/api/auth/signin/\[provider\]/route.ts](../../starters/saaskit/src/app/api/auth/signin/[provider]/route.ts) - Start OAuth flow with PKCE
2. **OAuth Callback** - Handle token exchange
3. **Webhooks** - Stripe webhook verification
4. **Health** - [src/app/api/health/route.ts](../../starters/saaskit/src/app/api/health/route.ts) - Database + cache checks
5. **Ready** - [src/app/api/ready/route.ts](../../starters/saaskit/src/app/api/ready/route.ts) - Kubernetes readiness probe
6. **Inngest** - [src/app/api/inngest/route.ts](../../starters/saaskit/src/app/api/inngest/route.ts) - Background job webhook

---

## Data Flow & Request Lifecycle

### Request Flow

```
Browser
  ↓
Next.js Route Handler
  ↓
makeHandler (gateway)
  ↓
1. Extract auth (session/JWT/API key)
2. Set context (tenantId, userId, requestId)
3. Check rate limit
4. Verify authentication (requireUser)
5. Check permissions (perm)
6. Validate body (zod)
  ↓
Service Function (module)
  ↓
Repository (data access)
  ↓
Database (MongoDB with tenant scoping)
  ↓
← Return data
  ↓
Emit event (if mutation)
  ↓
← Return response (JSON)
  ↓
Browser
```

### Context Propagation

Context flows through the entire request via AsyncLocalStorage:

```typescript
// Gateway sets context
setContext({ requestId: 'req_abc', tenantId: 'tenant_xyz', userId: 'user_123' });

// Service layer accesses context (no parameters!)
function createUser(input) {
  const ctx = getContext();
  console.log(ctx.tenantId); // 'tenant_xyz'

  return UserRepo.create({ ...input, tenantId: ctx.tenantId });
}

// Repository uses context for tenant scoping
class UserRepo {
  static async create(user) {
    const filter = tenantFilter({}); // Auto-adds tenantId from context
    await db.users.insertOne(user);
  }
}

// Logger includes context automatically
logger.info('User created');
// Output: { level: 'info', requestId: 'req_abc', tenantId: 'tenant_xyz', userId: 'user_123', msg: 'User created' }
```

---

## Testing Strategy

### Test Statistics

- **800+ tests passing** (Vitest)
- **51 E2E tests** (Playwright)
- **Coverage**: ~75% overall, >90% for critical paths

### Unit Tests

**Tool**: Vitest
**Location**: [packages/modules/\*/test/](../../packages/modules/)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '../src/service/users';
import { setContext } from '@unisane/kernel';

describe('Users Service', () => {
  beforeEach(() => {
    setContext({ requestId: 'test', tenantId: 'test_tenant', userId: 'test_user' });
  });

  it('should create user', async () => {
    const user = await createUser({
      email: 'alice@example.com',
      name: 'Alice',
      tenantId: 'test_tenant',
    });

    expect(user._id).toBeDefined();
    expect(user.email).toBe('alice@example.com');
  });
});
```

### E2E Tests

**Tool**: Playwright
**Location**: [tests/e2e/](../../tests/e2e/)

```typescript
import { test, expect } from '@playwright/test';

test('should create new user', async ({ page }) => {
  await page.goto('/users');
  await page.click('text=Add User');
  await page.fill('[name=email]', 'newuser@example.com');
  await page.fill('[name=name]', 'New User');
  await page.click('button[type=submit]');

  await expect(page.locator('text=newuser@example.com')).toBeVisible();
});
```

---

## Development Workflow

### Setup

```bash
# Clone repo
git clone https://github.com/unisane/unisane-monorepo.git
cd unisane-monorepo

# Install dependencies
pnpm install

# Set up environment
cp starters/saaskit/.env.example starters/saaskit/.env

# Run codegen
cd starters/saaskit
npm run routes:gen
npm run sdk:gen
npm run types:gen

# Start dev server
npm run dev
```

### Common Commands

```bash
# Development
npm run dev                 # Start dev server
npm run build               # Build for production
npm run start               # Start production server

# Code Generation
npm run routes:gen          # Generate API routes
npm run sdk:gen             # Generate SDK + hooks
npm run types:gen           # Extract types
npm run codegen             # Run all codegen

# Testing
npm run test                # Run unit tests
npm run test:e2e            # Run E2E tests

# Linting
npm run lint                # ESLint
npm run format              # Prettier
```

---

## Deployment & Production

### Environment Variables

**Required**:

```bash
# App
PUBLIC_BASE_URL=https://app.example.com
APP_ENV=prod

# Database
MONGODB_URI=mongodb+srv://...

# Cache
REDIS_URL=redis://...
# OR
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...

# Auth
JWT_SECRET=...
SESSION_SECRET=...

# OAuth
OAUTH_PROVIDERS=google,github
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Billing
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...

# Storage
AWS_S3_BUCKET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### Health Checks

**Liveness**: `GET /api/health?live=true` - Fast check (no dependencies)
**Readiness**: `GET /api/health` - Checks DB + Redis connections

### Deployment Platforms

- **Vercel** (easiest): `vercel --prod`
- **Railway**: `railway up`
- **Docker**: Build with multi-stage Dockerfile
- **AWS/GCP**: Deploy as container or serverless

---

## Key Architectural Decisions

### Why Modular Monolith?

**Decision**: Ship as single deployable monolith with well-defined modules.

**Rationale**:
- Simplicity - One codebase, one deployment, one database
- Performance - No network overhead between modules
- Transactions - ACID guarantees across modules
- Cost - One server, not 15 services

### Why Contract-First?

**Decision**: Define API contracts with Zod + ts-rest, generate routes/SDK/hooks.

**Rationale**:
- Type safety - Single source of truth
- DX - Change contract, get new routes/hooks automatically
- Consistency - All APIs follow same patterns
- Free SDK + React hooks

### Why Source Distribution?

**Decision**: Distribute as source code (shadcn-style), not npm packages.

**Rationale**:
- Full ownership - Customers own all code
- Customization - Modify any file without forking
- No version lock-in - Update at your own pace
- No black boxes - Read and understand all code

### Why AsyncLocalStorage?

**Decision**: Use Node.js AsyncLocalStorage for request context.

**Rationale**:
- Clean APIs - No `ctx` parameter in every function
- Automatic propagation - Context flows through call stack
- Lazy loading - Only fetch permissions/flags when needed

### Why Zod?

**Decision**: Use Zod schemas as single source of truth.

**Rationale**:
- Runtime validation - TypeScript types don't exist at runtime
- Type inference - Get TypeScript types from Zod schemas
- Serialization - Zod handles parsing and stringifying
- Single source - Define once, use everywhere

---

## Implementation Status

### What's Implemented ✅

**Foundation Layer**:
- ✅ AsyncLocalStorage context system
- ✅ MongoDB with tenant scoping
- ✅ Redis/Upstash KV cache
- ✅ Typed event system
- ✅ Error catalog (E1xxx-E8xxx)
- ✅ RBAC (50+ permissions, 6 roles)
- ✅ Structured logging (Pino)
- ✅ HTTP handlers (makeHandler, makeHandlerRaw)

**Modules** (all 15 implemented):
- ✅ auth, identity, tenants, billing, credits
- ✅ flags, settings, storage, audit, notify
- ✅ usage, webhooks, ai, media, pdf

**Code Generation**:
- ✅ Contract metadata extraction (AST parsing)
- ✅ Route generation from contracts
- ✅ SDK generation (TypeScript client)
- ✅ React Query hooks generation
- ✅ Type extraction (browser-safe)
- ✅ Automatic cache invalidation

**Platform**:
- ✅ Next.js 16 App Router
- ✅ OAuth (Google, GitHub) with PKCE
- ✅ Session management
- ✅ Health checks
- ✅ Background jobs (Inngest)

**UI**:
- ✅ 61 Material Design 3 components
- ✅ Data table with sorting/filtering
- ✅ Dark mode support

**Testing**:
- ✅ 800+ unit/integration tests
- ✅ 51 E2E tests

### What's Not Implemented ❌

**PRO Features** (available separately):
- ❌ Advanced analytics dashboard
- ❌ Custom RBAC roles
- ❌ Multi-region deployment
- ❌ White-label customization

**Future Roadmap**:
- ❌ GraphQL API
- ❌ WebSocket support
- ❌ Mobile SDKs
- ❌ Admin panel generator

---

## Summary

**Unisane** is a production-ready SaaS starter kit with:

- **30 packages** in foundation + modules + UI + tooling layers
- **Contract-first development** with 91% auto-generated API code
- **15 business modules** covering auth, billing, storage, and more
- **Modular monolith** architecture for simplicity and performance
- **Full source code** distribution (shadcn-style)
- **Battle-tested** infrastructure (AsyncLocalStorage, MongoDB, Redis, Zod)
- **Type safety** end-to-end with TypeScript and Zod
- **800+ tests** ensuring reliability
- **61 UI components** following Material Design 3

**For Developers**: Read contracts to understand APIs, use generated hooks in React, extend modules with new services.

**For LLMs**: Parse contracts to understand system capabilities, analyze service functions for business logic, follow repository pattern for data access.

---

**End of Architecture Documentation**

*Last updated: January 2026*
