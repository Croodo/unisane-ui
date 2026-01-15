# Database Portability Analysis

> **For LLMs**: Load when discussing database switching, PostgreSQL migration, or database abstraction work.

---

## Executive Summary

The Unisane monorepo has a **hexagonal architecture** with clear port/adapter separation. However, **22+ MongoDB-specific repository files** in the modules layer would block switching to a different database (e.g., PostgreSQL).

**Current State**: Database abstraction layer is now complete. All core patterns (IdGenerator, QueryBuilder, UpdateBuilder, UnitOfWork) are implemented with adapters for both MongoDB and PostgreSQL.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                          │
│  (starters/saaskit, starters/docs, etc.)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Modules Layer                              │
│  (identity, tenants, billing, auth, etc.)                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  *.repository.mongo.ts  ← PROBLEM: MongoDB-specific     │   │
│  │  - Uses ObjectId directly                               │   │
│  │  - Uses MongoDB collection API (.find, .aggregate)      │   │
│  │  - Uses MongoDB operators ($set, $inc, $push)           │   │
│  │  - Uses MongoDB aggregation pipelines                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Kernel (Foundation)                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ QueryBuilder    │  │ toMongoFilter() │  │ DatabasePort   │  │
│  │ (DB-agnostic)   │  │ (MongoDB only)  │  │ (abstraction)  │  │
│  └─────────────────┘  └─────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Adapters Layer                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  database-mongodb     ← OK: Proper adapter location     │   │
│  │  outbox-mongodb                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Critical Blockers

### 1. ObjectId Usage (RESOLVED ✓)

**Status**: IdGenerator abstraction fully implemented and migrated.

**Solution Implemented**:

```typescript
// Database-agnostic - Available in @unisane/kernel
import { newEntityId, toNativeId, isValidId } from '@unisane/kernel';
import type { ObjectId } from 'mongodb'; // Type-only import

// Generate ID
const id = newEntityId(); // Returns ObjectId hex string by default

// Convert to native type for MongoDB queries
const nativeId = toNativeId(id) as ObjectId;

// Validate ID format
if (isValidId(someId)) { /* valid */ }
```

**Configuration** (in app bootstrap):
```typescript
import { autoConfigureIdGenerator, setIdGenerator, UuidGenerator } from '@unisane/kernel';

// Auto-configure based on DB_TYPE env var
autoConfigureIdGenerator();

// Or explicit: use UUID for PostgreSQL
setIdGenerator(new UuidGenerator());
```

**Migrated Files**:
- ✓ `packages/modules/identity/src/data/users.repository.mongo.ts`
- ✓ `packages/modules/webhooks/src/data/webhooks.repository.mongo.ts`
- ✓ `packages/modules/storage/src/data/storage.repository.mongo.ts`
- ✓ `packages/pro/import-export/src/data/export.repository.mongo.ts`
- ✓ All other repositories now use type-only ObjectId imports

See [PATTERNS.md Pattern 10](../PATTERNS.md#pattern-10-database-agnostic-id-generation) for usage guide.

**Migration Effort**: Complete.

---

### 2. Aggregation Pipelines (CRITICAL)

**Problem**: 15+ files use MongoDB-specific aggregation operators.

**MongoDB Operators Used**:
- `$match`, `$group`, `$project`, `$sort`
- `$first`, `$sum`, `$cond`, `$filter`
- `$size`, `$in`, `$gt`, `$ifNull`

**Affected Files**:
| File | Complexity |
|------|------------|
| `users.enrichments.mongo.ts` | Very High (multi-stage pipeline) |
| `subscriptions.repository.mongo.ts` | High ($group with $first) |
| `invoices.repository.mongo.ts` | Medium |
| `audit.repository.mongo.ts` | High |
| `notifications.repository.mongo.ts` | Medium |
| `analytics.repository.mongo.ts` | High |

**Example**:
```typescript
// Current (MongoDB)
.aggregate([
  { $match: { scopeId: { $in: scopeIds } } },
  { $sort: { createdAt: -1 } },
  { $group: { _id: "$scopeId", planId: { $first: "$planId" } } }
])

// PostgreSQL equivalent
SELECT DISTINCT ON (scope_id) scope_id, plan_id
FROM subscriptions
WHERE scope_id = ANY($1)
ORDER BY scope_id, created_at DESC
```

**Migration Effort**: Very High - each pipeline needs SQL translation.

---

### 3. Collection API (CRITICAL)

**Problem**: All 22 repositories use MongoDB collection methods directly.

**Methods Used**:
- `.find()`, `.findOne()`, `.findOneAndUpdate()`
- `.insertOne()`, `.insertMany()`
- `.updateOne()`, `.updateMany()`
- `.deleteOne()`, `.deleteMany()`
- `.aggregate()`, `.countDocuments()`

**Example**:
```typescript
// Current (MongoDB-specific)
const users = await col<UserDoc>(COLLECTIONS.USERS)
  .find({ scopeId })
  .project({ email: 1, displayName: 1 })
  .sort({ createdAt: -1 })
  .limit(10)
  .toArray();

// Target (abstracted)
const query = new QueryBuilder<User>()
  .whereEq('scopeId', scopeId)
  .sort('createdAt', 'desc')
  .limit(10)
  .build();

const users = await userRepository.findMany(query);
```

**Migration Effort**: Very High - all 22 repository files need rewriting.

---

### 4. Update Operators (RESOLVED ✓)

**Status**: UpdateBuilder abstraction fully implemented with adapters.

**Solution Implemented**:

```typescript
import { UpdateBuilder, toMongoUpdate, toSqlUpdate } from '@unisane/kernel';

// Database-agnostic update specification
const update = new UpdateBuilder<Settings>()
  .set('value', newValue)
  .set('updatedAt', now)
  .inc('version', 1)
  .unset('deprecated')
  .build();

// MongoDB adapter
const mongoUpdate = toMongoUpdate(update);
// Result: { $set: { value: newValue, updatedAt: now }, $inc: { version: 1 }, $unset: { deprecated: "" } }

// PostgreSQL adapter
const { sql, values } = toSqlUpdate(update, { table: 'settings', where: 'scope_id = $1 AND key = $2' });
// Result: UPDATE settings SET value = $3, updated_at = $4, version = version + 1, deprecated = NULL WHERE scope_id = $1 AND key = $2
```

**Supported Operations**:
- `set(field, value)` - Set field value
- `inc(field, amount)` - Increment numeric field
- `unset(field)` - Remove/null field
- `currentDate(field)` - Set to current timestamp
- `push(field, value)` - Array append (MongoDB)
- `pull(field, value)` - Array remove (MongoDB)
- `addToSet(field, value)` - Array add if not exists (MongoDB)

**Migration Effort**: Complete - abstraction available, individual repositories can migrate incrementally.

---

### 5. Transaction Sessions (RESOLVED ✓)

**Status**: UnitOfWork abstraction fully implemented with adapters.

**Solution Implemented**:

```typescript
import { UnitOfWork, createUnitOfWork, InMemoryUnitOfWork } from '@unisane/kernel';

// Database-agnostic transaction pattern
const uow = createUnitOfWork(mongoTransactionExecutor); // or pgTransactionExecutor

await uow.run(async () => {
  // All operations within this callback are transactional
  await creditsRepo.debit(tenantId, 100);
  await transactionsRepo.create({ tenantId, amount: -100, type: 'debit' });
});
// Auto-commits on success, auto-rollbacks on error
```

**UnitOfWork Interface**:
```typescript
interface UnitOfWork {
  run<T>(fn: () => Promise<T>): Promise<T>;  // Run transactionally
  isActive(): boolean;                        // Check if in transaction
}

interface TransactionExecutor {
  execute<T>(fn: () => Promise<T>): Promise<T>;
}
```

**Implementations Available**:
- `createUnitOfWork(executor)` - Factory for database-specific UoW
- `InMemoryUnitOfWork` - For testing (tracks pending operations)

**Migration Effort**: Complete - abstraction available, repositories can adopt incrementally.

---

## Affected Files Inventory

### Module Repositories (22 files)

| Module | File | Blockers |
|--------|------|----------|
| identity | `users.repository.mongo.ts` | ObjectId, Collection, Aggregate |
| identity | `users.queries.mongo.ts` | Collection, Aggregate |
| identity | `users.enrichments.mongo.ts` | Complex aggregation |
| identity | `api-keys.repository.mongo.ts` | Collection |
| identity | `memberships.repository.mongo.ts` | Collection, Aggregate |
| auth | `auth.repository.mongo.ts` | Collection |
| tenants | `tenants.repository.mongo.ts` | ObjectId, Collection |
| billing | `subscriptions.repository.mongo.ts` | Collection, Aggregate |
| billing | `invoices.repository.mongo.ts` | Collection, Aggregate |
| billing | `payments.repository.mongo.ts` | Collection |
| billing | `scope-integrations.repository.mongo.ts` | Collection |
| credits | `credits.repository.mongo.ts` | Collection |
| audit | `audit.repository.mongo.ts` | Collection, Aggregate |
| usage | `usage.repository.mongo.ts` | Collection |
| flags | `flags.repository.mongo.ts` | Collection |
| flags | `overrides.repository.mongo.ts` | Collection |
| flags | `exposures.repository.mongo.ts` | Collection |
| webhooks | `webhooks.repository.mongo.ts` | Collection |
| storage | `storage.repository.mongo.ts` | Collection |
| notify | `notifications.repository.mongo.ts` | Collection, Aggregate |
| notify | `suppression.repository.mongo.ts` | Collection |
| settings | `settings.repository.mongo.ts` | Collection |

### Kernel Files (7 files)

| File | Issue |
|------|-------|
| `database/mongo-types.ts` | Re-exports MongoDB types |
| `database/objectid.ts` | Exports ObjectId directly |
| `database/transactions.ts` | Uses ClientSession |
| `database/base-repository.ts` | Uses Collection types |
| `database/aggregations.ts` | MongoDB pipeline helpers |
| `database/filters.ts` | MongoDB operators in softDeleteFilter |
| `pagination/mongo.ts` | MongoDB seek pagination |

---

## What's Already Database-Agnostic

All core database operations are now abstracted with adapters for MongoDB and PostgreSQL.

### 1. IdGenerator (Kernel)

```typescript
import { newEntityId, toNativeId, isValidId, setIdGenerator, UuidGenerator } from '@unisane/kernel';

// Generate database-agnostic ID
const id = newEntityId();

// Convert to native type for database operations
const nativeId = toNativeId(id);

// Validate ID format
if (isValidId(someId)) { /* valid */ }

// Switch to UUID for PostgreSQL
setIdGenerator(new UuidGenerator());
```

**Available Generators**: `ObjectIdGenerator`, `UuidGenerator`, `NanoidGenerator`, `CuidGenerator`

---

### 2. QueryBuilder (Kernel)

```typescript
import { QueryBuilder, toMongoFilter, toSqlWhere, toSqlSelect } from '@unisane/kernel';

const query = new QueryBuilder<User>()
  .whereEq('status', 'active')
  .whereGte('age', 18)
  .whereContains('email', '@example.com')
  .whereTextSearch('john', ['email', 'displayName'])
  .sort('createdAt', 'desc')
  .limit(20)
  .build();

// MongoDB adapter
const mongoFilter = toMongoFilter(query);

// PostgreSQL adapters
const { sql: whereClause, values } = toSqlWhere(query, { table: 'users' });
const { sql: selectQuery, values: params } = toSqlSelect(query, {
  table: 'users',
  columns: ['id', 'email', 'display_name']
});
```

**Supported Operations**:
- `whereEq`, `whereNe` - Equality
- `whereGt`, `whereGte`, `whereLt`, `whereLte` - Comparisons
- `whereIn`, `whereNin` - Array membership
- `whereContains`, `whereStartsWith`, `whereEndsWith` - String matching
- `whereNull`, `whereNotNull` - Null checks
- `whereBetween` - Range queries
- `whereOr`, `whereTextSearch` - Disjunctive queries

---

### 3. UpdateBuilder (Kernel)

```typescript
import { UpdateBuilder, toMongoUpdate, toSqlUpdate } from '@unisane/kernel';

const update = new UpdateBuilder<User>()
  .set('email', 'new@example.com')
  .set('updatedAt', new Date())
  .inc('loginCount', 1)
  .unset('temporaryFlag')
  .currentDate('lastActivityAt')
  .build();

// MongoDB adapter
const mongoUpdate = toMongoUpdate(update);
// { $set: { email: '...', updatedAt: ... }, $inc: { loginCount: 1 }, $unset: { temporaryFlag: '' }, $currentDate: { lastActivityAt: true } }

// PostgreSQL adapter
const { sql, values } = toSqlUpdate(update, { table: 'users', where: 'id = $1' });
// UPDATE users SET email = $2, updated_at = $3, login_count = login_count + 1, temporary_flag = NULL, last_activity_at = NOW() WHERE id = $1
```

**Supported Operations**:
- `set(field, value)` - Set field value
- `inc(field, amount)` - Increment numeric field
- `unset(field)` - Remove/null field
- `currentDate(field)` - Set to current timestamp

---

### 4. UnitOfWork (Kernel)

```typescript
import { createUnitOfWork, InMemoryUnitOfWork, type TransactionExecutor } from '@unisane/kernel';

// Create UnitOfWork with database-specific executor
const mongoExecutor: TransactionExecutor = {
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const session = client.startSession();
    try {
      session.startTransaction();
      const result = await fn();
      await session.commitTransaction();
      return result;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }
};

const uow = createUnitOfWork(mongoExecutor);

await uow.run(async () => {
  await repo1.update(...);
  await repo2.create(...);
}); // Auto-commit/rollback

// For testing
const testUow = new InMemoryUnitOfWork();
```

---

### 5. SQL Utilities (Kernel)

```typescript
import { camelToSnake, toSqlWhere, toSqlUpdate, toSqlSelect } from '@unisane/kernel';

// Field name conversion
camelToSnake('displayName'); // 'display_name'
camelToSnake('createdAt');   // 'created_at'

// All SQL adapters support snake_case conversion automatically
```

---

### Files Using Abstractions

| File | Abstractions Used |
|------|-------------------|
| `users.repository.mongo.ts` | IdGenerator, QueryBuilder |
| `users.filters.ts` | QueryBuilder |
| `tenants.repository.mongo.ts` | QueryBuilder |
| `webhooks.repository.mongo.ts` | IdGenerator |
| `storage.repository.mongo.ts` | IdGenerator |
| `auth.repository.mongo.ts` | Type-only imports |

---

## Migration Strategy

### Phase 1: ID Abstraction ✓ COMPLETE

**Status**: Fully implemented and migrated.

```typescript
import { newEntityId, toNativeId, isValidId } from '@unisane/kernel';

const id = newEntityId();           // Database-agnostic
const native = toNativeId(id);       // For queries
const valid = isValidId(someId);     // Validation
```

**Implementations**: `ObjectIdGenerator`, `UuidGenerator`, `NanoidGenerator`, `CuidGenerator`

---

### Phase 2: Query Abstraction ✓ COMPLETE

**Status**: QueryBuilder with MongoDB and PostgreSQL adapters.

```typescript
import { QueryBuilder, toMongoFilter, toSqlWhere, toSqlSelect } from '@unisane/kernel';

const query = new QueryBuilder<User>()
  .whereEq('status', 'active')
  .whereGte('age', 18)
  .build();

const mongoFilter = toMongoFilter(query);
const { sql, values } = toSqlSelect(query, { table: 'users', columns: ['*'] });
```

---

### Phase 3: Update Abstraction ✓ COMPLETE

**Status**: UpdateBuilder with MongoDB and PostgreSQL adapters.

```typescript
import { UpdateBuilder, toMongoUpdate, toSqlUpdate } from '@unisane/kernel';

const update = new UpdateBuilder<User>()
  .set('email', 'new@example.com')
  .inc('loginCount', 1)
  .build();

const mongoUpdate = toMongoUpdate(update);
const { sql, values } = toSqlUpdate(update, { table: 'users', where: 'id = $1' });
```

---

### Phase 4: Transaction Abstraction ✓ COMPLETE

**Status**: UnitOfWork pattern with factory and in-memory implementation.

```typescript
import { createUnitOfWork, InMemoryUnitOfWork } from '@unisane/kernel';

const uow = createUnitOfWork(databaseExecutor);

await uow.run(async () => {
  await repo1.update(...);
  await repo2.create(...);
}); // Auto-commit/rollback
```

---

### Phase 5: Repository Migration (REMAINING)

**Goal**: Migrate existing repositories to use abstractions.

**Status**: Abstractions complete, individual repository migration in progress.

```typescript
// Current pattern (MongoDB-specific)
await col('users').updateOne({ _id }, { $set: { email } });

// Target pattern (database-agnostic)
const update = new UpdateBuilder<User>().set('email', email).build();
await userRepo.update(id, toMongoUpdate(update)); // or toSqlUpdate for Postgres
```

**Remaining Work**:
- Migrate repositories incrementally to use UpdateBuilder
- Replace direct collection API calls with repository interface methods
- Convert aggregation pipelines to domain-specific repository methods

---

## Quick Wins

### 1. ✓ DONE - IdGenerator Abstraction

All ID generation now uses `newEntityId()`, `toNativeId()`, `isValidId()`.

### 2. ✓ DONE - QueryBuilder with SQL Adapters

`toSqlWhere()`, `toSqlSelect()` available for PostgreSQL compatibility.

### 3. ✓ DONE - UpdateBuilder with SQL Adapters

`toSqlUpdate()` available for PostgreSQL compatibility.

### 4. ✓ DONE - UnitOfWork Pattern

`createUnitOfWork()` and `InMemoryUnitOfWork` available.

### 5. Add ESLint Rule (Recommended)

**Rule**: Flag direct `mongodb` imports in modules.

```javascript
// .eslintrc.js
rules: {
  'no-restricted-imports': ['error', {
    patterns: [{
      group: ['mongodb'],
      importNames: ['Collection', 'ObjectId', 'Filter'],
      message: 'Use @unisane/kernel abstractions instead'
    }]
  }]
}
```

---

## Progress Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: ID Abstraction | ✓ COMPLETE | All generators implemented |
| Phase 2: Query Abstraction | ✓ COMPLETE | QueryBuilder + SQL adapters |
| Phase 3: Update Abstraction | ✓ COMPLETE | UpdateBuilder + SQL adapters |
| Phase 4: Transaction Abstraction | ✓ COMPLETE | UnitOfWork pattern |
| Phase 5: Repository Migration | IN PROGRESS | Individual repos need migration |

**Abstractions Complete**: 100%
**Repository Migration**: ~30% (key repositories migrated)

---

## Recommendations

### Now (Immediate)

1. ✓ Use `QueryBuilder` for all new filter building
2. ✓ Use `UpdateBuilder` for all new update operations
3. ✓ Use `newEntityId()` for all ID generation
4. Add ESLint rule to flag direct `mongodb` imports

### Next Steps

1. Migrate remaining repositories to use UpdateBuilder pattern
2. Create PostgreSQL repository implementations as proof of concept
3. Add database selection via `DB_TYPE` environment config

### Future

1. Complete migration of all 22 repositories to use abstractions
2. Implement PostgreSQL adapter package (`@unisane/database-postgres`)
3. Support multi-database deployments (read replicas, sharding)

---

## Kernel Exports Summary

```typescript
// ID Generation
export { newEntityId, toNativeId, isValidId, setIdGenerator, autoConfigureIdGenerator } from '@unisane/kernel';
export { ObjectIdGenerator, UuidGenerator, NanoidGenerator, CuidGenerator } from '@unisane/kernel';

// Query Building
export { QueryBuilder, toMongoFilter, toSqlWhere, toSqlSelect } from '@unisane/kernel';

// Update Building
export { UpdateBuilder, toMongoUpdate, toSqlUpdate } from '@unisane/kernel';

// Transactions
export { createUnitOfWork, InMemoryUnitOfWork } from '@unisane/kernel';
export type { UnitOfWork, TransactionExecutor } from '@unisane/kernel';

// Utilities
export { camelToSnake } from '@unisane/kernel';

// Repository Interfaces
export type { RepositoryPort, QueryableRepositoryPort, ScopedRepositoryPort } from '@unisane/kernel';
export type { QuerySpec, UpdateSpec, SqlOptions, SqlResult } from '@unisane/kernel';
```

---

## Related Documents

- [PATTERNS.md](../PATTERNS.md#pattern-9-repository-with-querybuilder) - QueryBuilder usage patterns
- [PATTERNS.md](../PATTERNS.md#pattern-10-database-agnostic-id-generation) - IdGenerator patterns
- [ADAPTERS.md](./ADAPTERS.md) - Adapter inventory
- [PORTS.md](./PORTS.md) - Port definitions

---

> **Last Updated**: 2026-01-15 | **Version**: 2.0
