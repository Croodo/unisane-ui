/**
 * Repository Pattern Abstractions
 *
 * Provides a consistent interface for data access across all modules.
 * Repositories should:
 * - Hide database implementation details
 * - Expose domain-focused methods
 * - Handle mapping between database documents and domain entities
 *
 * ## Repository Responsibilities
 * - CRUD operations for domain entities
 * - Query building and execution
 * - Document-to-entity mapping
 * - Pagination and sorting
 *
 * ## Anti-patterns to Avoid
 * - Exposing raw database connections
 * - Business logic in repositories
 * - Inconsistent query patterns
 * - Missing type safety
 */

/**
 * Standard pagination options for list operations.
 */
export interface PaginationOptions {
  /** Maximum items to return */
  limit: number;
  /** Cursor for next page (opaque string) */
  cursor?: string;
  /** Sort field and direction */
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

/**
 * Standard paginated result.
 */
export interface PaginatedResult<T> {
  /** Items in this page */
  items: T[];
  /** Cursor for next page (undefined if no more pages) */
  nextCursor?: string;
  /** Total count (optional, expensive for large datasets) */
  total?: number;
}

/**
 * Base interface for all repository ports.
 * Defines the minimum contract for CRUD operations.
 *
 * @typeParam T - Entity type
 * @typeParam ID - ID type (usually string)
 * @typeParam CreateInput - Input for create operations
 * @typeParam UpdateInput - Input for update operations
 */
export interface RepositoryPort<
  T,
  ID = string,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>
> {
  /**
   * Find entity by ID.
   * @returns Entity or null if not found
   */
  findById(id: ID): Promise<T | null>;

  /**
   * Create a new entity.
   * @returns Created entity with generated ID
   */
  create(input: CreateInput): Promise<T>;

  /**
   * Update an existing entity.
   * @returns Updated entity or null if not found
   */
  update(id: ID, input: UpdateInput): Promise<T | null>;

  /**
   * Delete an entity by ID.
   * @returns true if deleted, false if not found
   */
  delete(id: ID): Promise<boolean>;

  /**
   * Check if entity exists.
   */
  exists(id: ID): Promise<boolean>;
}

/**
 * Extended repository port with list/query capabilities.
 */
export interface QueryableRepositoryPort<
  T,
  ID = string,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>,
  FilterInput = Record<string, unknown>
> extends RepositoryPort<T, ID, CreateInput, UpdateInput> {
  /**
   * List entities with pagination and optional filtering.
   */
  list(options: PaginationOptions, filters?: FilterInput): Promise<PaginatedResult<T>>;

  /**
   * Count entities matching filters.
   */
  count(filters?: FilterInput): Promise<number>;
}

/**
 * Scoped repository port for tenant-aware data access.
 * All operations are scoped to a specific tenant.
 */
export interface ScopedRepositoryPort<
  T,
  ID = string,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>
> {
  /**
   * Find entity by ID within scope.
   */
  findById(scopeId: string, id: ID): Promise<T | null>;

  /**
   * Find all entities for a scope.
   */
  findByScope(scopeId: string, options?: PaginationOptions): Promise<PaginatedResult<T>>;

  /**
   * Create entity within scope.
   */
  create(scopeId: string, input: CreateInput): Promise<T>;

  /**
   * Update entity within scope.
   */
  update(scopeId: string, id: ID, input: UpdateInput): Promise<T | null>;

  /**
   * Delete entity within scope.
   */
  delete(scopeId: string, id: ID): Promise<boolean>;
}

/**
 * Unit of Work pattern for transactional operations.
 * Groups multiple repository operations into a single transaction.
 */
export interface UnitOfWork {
  /**
   * Begin a transaction.
   */
  begin(): Promise<void>;

  /**
   * Commit the transaction.
   */
  commit(): Promise<void>;

  /**
   * Rollback the transaction.
   */
  rollback(): Promise<void>;

  /**
   * Execute a function within a transaction.
   * Automatically commits on success, rolls back on error.
   */
  withTransaction<T>(fn: () => Promise<T>): Promise<T>;

  /**
   * Check if currently in a transaction.
   */
  isInTransaction(): boolean;
}

/**
 * Database-agnostic transaction executor type.
 * This function type can be implemented by different database adapters.
 */
export type TransactionExecutor = <T>(fn: () => Promise<T>) => Promise<T>;

/**
 * Creates a database-agnostic UnitOfWork.
 *
 * @param executor - Database-specific transaction executor
 * @returns UnitOfWork instance
 *
 * @example
 * ```typescript
 * // MongoDB
 * import { withMongoTransaction } from '@unisane/kernel';
 * const uow = createUnitOfWork((fn) => withMongoTransaction(() => fn()));
 *
 * // PostgreSQL (example)
 * const uow = createUnitOfWork((fn) => pgPool.transaction(fn));
 *
 * // Usage
 * await uow.withTransaction(async () => {
 *   await userRepo.create({ email: 'user@example.com' });
 *   await auditRepo.log('user.created');
 * });
 * ```
 */
export function createUnitOfWork(executor: TransactionExecutor): UnitOfWork {
  let inTransaction = false;

  return {
    async begin(): Promise<void> {
      // For the functional approach, begin is a no-op
      // The actual transaction starts in withTransaction
    },

    async commit(): Promise<void> {
      // For the functional approach, commit is handled automatically
    },

    async rollback(): Promise<void> {
      // For the functional approach, rollback is handled automatically on error
    },

    async withTransaction<T>(fn: () => Promise<T>): Promise<T> {
      inTransaction = true;
      try {
        return await executor(fn);
      } finally {
        inTransaction = false;
      }
    },

    isInTransaction(): boolean {
      return inTransaction;
    },
  };
}

/**
 * In-memory UnitOfWork for testing.
 * Simulates transactions without actual database.
 */
export class InMemoryUnitOfWork implements UnitOfWork {
  private _inTransaction = false;
  private _pendingOperations: Array<() => Promise<void>> = [];

  async begin(): Promise<void> {
    this._inTransaction = true;
    this._pendingOperations = [];
  }

  async commit(): Promise<void> {
    // Execute all pending operations
    for (const op of this._pendingOperations) {
      await op();
    }
    this._pendingOperations = [];
    this._inTransaction = false;
  }

  async rollback(): Promise<void> {
    this._pendingOperations = [];
    this._inTransaction = false;
  }

  async withTransaction<T>(fn: () => Promise<T>): Promise<T> {
    await this.begin();
    try {
      const result = await fn();
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  isInTransaction(): boolean {
    return this._inTransaction;
  }

  /**
   * Add an operation to be executed on commit (for testing).
   */
  addPendingOperation(op: () => Promise<void>): void {
    this._pendingOperations.push(op);
  }
}

/**
 * Document-to-entity mapper interface.
 * Used by repositories to convert between database documents and domain entities.
 */
export interface EntityMapper<TDocument, TEntity> {
  /**
   * Convert database document to domain entity.
   */
  toEntity(doc: TDocument): TEntity;

  /**
   * Convert domain entity to database document.
   */
  toDocument(entity: TEntity): TDocument;
}

// NOTE: BaseMongoRepository and selectRepo are defined in ../database
// Use those implementations instead of duplicating here.
// See: @unisane/kernel/database for the canonical implementations.

/**
 * In-memory repository for testing.
 * Implements the full RepositoryPort interface with an in-memory store.
 */
export class InMemoryRepository<T extends { id: string }>
  implements RepositoryPort<T, string, Omit<T, 'id'>, Partial<T>>
{
  private store = new Map<string, T>();
  private idCounter = 0;

  async findById(id: string): Promise<T | null> {
    return this.store.get(id) ?? null;
  }

  async create(input: Omit<T, 'id'>): Promise<T> {
    const id = `test_${++this.idCounter}`;
    const entity = { ...input, id } as T;
    this.store.set(id, entity);
    return entity;
  }

  async update(id: string, input: Partial<T>): Promise<T | null> {
    const existing = this.store.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...input };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.store.has(id);
  }

  /**
   * Clear all data (for testing).
   */
  clear(): void {
    this.store.clear();
    this.idCounter = 0;
  }

  /**
   * Get all items (for testing).
   */
  all(): T[] {
    return Array.from(this.store.values());
  }
}

/**
 * Database-agnostic filter operators.
 * These are translated by database adapters to native query syntax.
 */
export type QueryFilterOp =
  | { op: 'eq'; value: unknown }
  | { op: 'ne'; value: unknown }
  | { op: 'gt'; value: unknown }
  | { op: 'gte'; value: unknown }
  | { op: 'lt'; value: unknown }
  | { op: 'lte'; value: unknown }
  | { op: 'in'; value: unknown[] }
  | { op: 'nin'; value: unknown[] }
  | { op: 'contains'; value: string; caseSensitive?: boolean }
  | { op: 'startsWith'; value: string; caseSensitive?: boolean }
  | { op: 'endsWith'; value: string; caseSensitive?: boolean }
  | { op: 'isNull'; value: boolean }
  | { op: 'between'; min: unknown; max: unknown };

/**
 * A single filter condition.
 */
export interface FilterCondition {
  field: string;
  operator: QueryFilterOp;
}

/**
 * A group of filter conditions joined by OR logic.
 * Used for disjunctive queries like "email contains X OR name contains X".
 */
export interface OrGroup {
  type: 'or';
  conditions: FilterCondition[];
}

/**
 * Database-agnostic query specification.
 * Can be translated to MongoDB, SQL, or other query languages.
 *
 * - `filters` are joined with AND logic
 * - `orGroups` are each joined internally with OR, then ANDed with filters
 */
export interface QuerySpec {
  filters: FilterCondition[];
  orGroups: OrGroup[];
  sort: { field: string; direction: 'asc' | 'desc' } | null;
  limit: number;
  skip: number;
}

/**
 * Query builder helper for constructing database-agnostic queries.
 *
 * Uses a fluent API to build queries that can be translated to any database.
 * The built QuerySpec can be passed to database adapters (MongoDB, SQL, etc.)
 *
 * @example
 * ```typescript
 * const query = new QueryBuilder<User>()
 *   .where('email', 'eq', 'user@example.com')
 *   .where('age', 'gte', 18)
 *   .where('status', 'in', ['active', 'pending'])
 *   .sort('createdAt', 'desc')
 *   .limit(20)
 *   .build();
 *
 * // Pass to MongoDB adapter
 * const mongoFilter = toMongoFilter(query);
 *
 * // Or SQL adapter
 * const sqlWhere = toSqlWhere(query);
 * ```
 */
export class QueryBuilder<T = unknown> {
  private conditions: FilterCondition[] = [];
  private orConditions: OrGroup[] = [];
  private sortBy: { field: string; direction: 'asc' | 'desc' } | null = null;
  private limitVal: number = 50;
  private skipVal: number = 0;

  /**
   * Add a filter condition.
   */
  where<K extends keyof T & string>(
    field: K,
    op: QueryFilterOp['op'],
    value: unknown
  ): this {
    const operator = this.createOperator(op, value);
    this.conditions.push({ field, operator });
    return this;
  }

  /**
   * Add equality filter (shorthand).
   */
  whereEq(field: keyof T & string, value: unknown): this {
    return this.where(field, 'eq', value);
  }

  /**
   * Add greater-than filter.
   */
  whereGt(field: keyof T & string, value: unknown): this {
    return this.where(field, 'gt', value);
  }

  /**
   * Add greater-than-or-equal filter.
   */
  whereGte(field: keyof T & string, value: unknown): this {
    return this.where(field, 'gte', value);
  }

  /**
   * Add less-than filter.
   */
  whereLt(field: keyof T & string, value: unknown): this {
    return this.where(field, 'lt', value);
  }

  /**
   * Add less-than-or-equal filter.
   */
  whereLte(field: keyof T & string, value: unknown): this {
    return this.where(field, 'lte', value);
  }

  /**
   * Add in-array filter.
   */
  whereIn(field: keyof T & string, values: unknown[]): this {
    this.conditions.push({
      field,
      operator: { op: 'in', value: values },
    });
    return this;
  }

  /**
   * Add not-in-array filter.
   */
  whereNotIn(field: keyof T & string, values: unknown[]): this {
    this.conditions.push({
      field,
      operator: { op: 'nin', value: values },
    });
    return this;
  }

  /**
   * Add text contains filter (case-insensitive by default).
   */
  whereContains(field: keyof T & string, text: string, caseSensitive = false): this {
    this.conditions.push({
      field,
      operator: { op: 'contains', value: text, caseSensitive },
    });
    return this;
  }

  /**
   * Add starts-with filter.
   */
  whereStartsWith(field: keyof T & string, text: string, caseSensitive = false): this {
    this.conditions.push({
      field,
      operator: { op: 'startsWith', value: text, caseSensitive },
    });
    return this;
  }

  /**
   * Add between filter (inclusive).
   */
  whereBetween(field: keyof T & string, min: unknown, max: unknown): this {
    this.conditions.push({
      field,
      operator: { op: 'between', min, max },
    });
    return this;
  }

  /**
   * Add null check filter.
   */
  whereNull(field: keyof T & string, isNull = true): this {
    this.conditions.push({
      field,
      operator: { op: 'isNull', value: isNull },
    });
    return this;
  }

  /**
   * Add an OR group - conditions within are joined with OR logic.
   * Multiple OR groups are ANDed with each other and with regular filters.
   *
   * @example
   * ```typescript
   * // Search across multiple fields: (email contains X OR name contains X)
   * query.whereOr([
   *   { field: 'email', op: 'contains', value: searchTerm },
   *   { field: 'name', op: 'contains', value: searchTerm },
   * ]);
   * ```
   */
  whereOr(conditions: Array<{ field: keyof T & string; op: QueryFilterOp['op']; value: unknown }>): this {
    const orConditions: FilterCondition[] = conditions.map(c => ({
      field: c.field,
      operator: this.createOperator(c.op, c.value),
    }));
    this.orConditions.push({ type: 'or', conditions: orConditions });
    return this;
  }

  /**
   * Add text search across multiple fields (OR logic).
   * Shorthand for common "search box" pattern.
   *
   * @example
   * ```typescript
   * // Search for "john" in email OR displayName
   * query.whereTextSearch('john', ['email', 'displayName']);
   * ```
   */
  whereTextSearch(text: string, fields: Array<keyof T & string>, caseSensitive = false): this {
    if (!text || fields.length === 0) return this;

    const conditions: FilterCondition[] = fields.map(field => ({
      field,
      operator: { op: 'contains' as const, value: text, caseSensitive },
    }));
    this.orConditions.push({ type: 'or', conditions });
    return this;
  }

  /**
   * Set sort order.
   */
  sort(field: keyof T & string, direction: 'asc' | 'desc' = 'asc'): this {
    this.sortBy = { field, direction };
    return this;
  }

  /**
   * Set limit.
   */
  limit(n: number): this {
    this.limitVal = Math.max(1, Math.min(n, 1000));
    return this;
  }

  /**
   * Set skip/offset.
   */
  skip(n: number): this {
    this.skipVal = Math.max(0, n);
    return this;
  }

  /**
   * Build the database-agnostic query specification.
   */
  build(): QuerySpec {
    return {
      filters: [...this.conditions],
      orGroups: [...this.orConditions],
      sort: this.sortBy,
      limit: this.limitVal,
      skip: this.skipVal,
    };
  }

  /**
   * Create an operator object from shorthand.
   */
  private createOperator(op: QueryFilterOp['op'], value: unknown): QueryFilterOp {
    switch (op) {
      case 'eq': return { op: 'eq', value };
      case 'ne': return { op: 'ne', value };
      case 'gt': return { op: 'gt', value };
      case 'gte': return { op: 'gte', value };
      case 'lt': return { op: 'lt', value };
      case 'lte': return { op: 'lte', value };
      case 'in': return { op: 'in', value: value as unknown[] };
      case 'nin': return { op: 'nin', value: value as unknown[] };
      case 'contains': return { op: 'contains', value: value as string };
      case 'startsWith': return { op: 'startsWith', value: value as string };
      case 'endsWith': return { op: 'endsWith', value: value as string };
      case 'isNull': return { op: 'isNull', value: value as boolean };
      case 'between': throw new Error('Use whereBetween() for between operator');
      default: return { op: 'eq', value };
    }
  }
}

/**
 * Convert QuerySpec to MongoDB filter syntax.
 * Use this adapter when working with MongoDB repositories.
 *
 * @example
 * ```typescript
 * const query = new QueryBuilder<User>()
 *   .whereEq('status', 'active')
 *   .whereGte('age', 18)
 *   .build();
 *
 * const mongoFilter = toMongoFilter(query);
 * // { status: 'active', age: { $gte: 18 } }
 * ```
 */
export function toMongoFilter(spec: QuerySpec): Record<string, unknown> {
  const filter: Record<string, unknown> = {};

  // Process AND conditions
  for (const condition of spec.filters) {
    applyConditionToFilter(filter, condition);
  }

  // Process OR groups - each becomes a $or clause, all ANDed together
  if (spec.orGroups.length > 0) {
    const andClauses: Record<string, unknown>[] = [];

    // Add existing filter conditions as first AND clause (if any)
    if (Object.keys(filter).length > 0) {
      andClauses.push({ ...filter });
      // Clear the filter since we'll rebuild with $and
      for (const key of Object.keys(filter)) {
        delete filter[key];
      }
    }

    // Add each OR group as an AND clause
    for (const orGroup of spec.orGroups) {
      const orConditions: Record<string, unknown>[] = [];
      for (const condition of orGroup.conditions) {
        const subFilter: Record<string, unknown> = {};
        applyConditionToFilter(subFilter, condition);
        orConditions.push(subFilter);
      }
      if (orConditions.length > 0) {
        andClauses.push({ $or: orConditions });
      }
    }

    // If we have multiple clauses, wrap in $and
    if (andClauses.length > 1) {
      filter['$and'] = andClauses;
    } else if (andClauses.length === 1) {
      // Single clause - just merge it back
      Object.assign(filter, andClauses[0]);
    }
  }

  return filter;
}

/**
 * Apply a single filter condition to a MongoDB filter object.
 */
function applyConditionToFilter(filter: Record<string, unknown>, condition: FilterCondition): void {
  const { field, operator } = condition;

  switch (operator.op) {
    case 'eq':
      filter[field] = operator.value;
      break;
    case 'ne':
      filter[field] = { $ne: operator.value };
      break;
    case 'gt':
      filter[field] = { $gt: operator.value };
      break;
    case 'gte':
      filter[field] = { $gte: operator.value };
      break;
    case 'lt':
      filter[field] = { $lt: operator.value };
      break;
    case 'lte':
      filter[field] = { $lte: operator.value };
      break;
    case 'in':
      filter[field] = { $in: operator.value };
      break;
    case 'nin':
      filter[field] = { $nin: operator.value };
      break;
    case 'contains':
      filter[field] = {
        $regex: escapeRegex(operator.value),
        $options: operator.caseSensitive ? '' : 'i',
      };
      break;
    case 'startsWith':
      filter[field] = {
        $regex: `^${escapeRegex(operator.value)}`,
        $options: operator.caseSensitive ? '' : 'i',
      };
      break;
    case 'endsWith':
      filter[field] = {
        $regex: `${escapeRegex(operator.value)}$`,
        $options: operator.caseSensitive ? '' : 'i',
      };
      break;
    case 'isNull':
      filter[field] = operator.value ? { $eq: null } : { $ne: null };
      break;
    case 'between':
      filter[field] = { $gte: operator.min, $lte: operator.max };
      break;
  }
}

/**
 * Escape special regex characters for safe use in MongoDB $regex.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// =============================================================================
// Update Builder - Database-Agnostic Update Operations
// =============================================================================

/**
 * Update operation types for database-agnostic updates.
 */
export type UpdateOp =
  | { op: 'set'; field: string; value: unknown }
  | { op: 'setOnInsert'; field: string; value: unknown }
  | { op: 'unset'; field: string }
  | { op: 'inc'; field: string; value: number }
  | { op: 'mul'; field: string; value: number }
  | { op: 'min'; field: string; value: unknown }
  | { op: 'max'; field: string; value: unknown }
  | { op: 'push'; field: string; value: unknown }
  | { op: 'pull'; field: string; value: unknown }
  | { op: 'addToSet'; field: string; value: unknown }
  | { op: 'rename'; from: string; to: string }
  | { op: 'currentDate'; field: string };

/**
 * Database-agnostic update specification.
 * Can be translated to MongoDB or SQL update statements.
 */
export interface UpdateSpec {
  operations: UpdateOp[];
}

/**
 * Fluent builder for database-agnostic update operations.
 *
 * @example
 * ```typescript
 * const update = new UpdateBuilder<User>()
 *   .set('name', 'John')
 *   .inc('loginCount', 1)
 *   .unset('tempField')
 *   .currentDate('updatedAt')
 *   .build();
 *
 * // MongoDB
 * const mongoUpdate = toMongoUpdate(update);
 * // { $set: { name: 'John' }, $inc: { loginCount: 1 }, ... }
 *
 * // SQL
 * const { sql, params } = toSqlUpdate(update, { table: 'users', where: 'id = $1', whereParams: ['user123'] });
 * // UPDATE users SET name = $2, login_count = login_count + $3, ... WHERE id = $1
 * ```
 */
export class UpdateBuilder<T = unknown> {
  private ops: UpdateOp[] = [];

  /**
   * Set a field to a specific value.
   */
  set<K extends keyof T & string>(field: K, value: T[K]): this {
    this.ops.push({ op: 'set', field, value });
    return this;
  }

  /**
   * Set multiple fields at once.
   */
  setMany(values: Partial<T>): this {
    for (const [field, value] of Object.entries(values)) {
      if (value !== undefined) {
        this.ops.push({ op: 'set', field, value });
      }
    }
    return this;
  }

  /**
   * Set a field only on insert (for upsert operations).
   * Value is only applied when a new document is created, not on updates.
   */
  setOnInsert<K extends keyof T & string>(field: K, value: T[K]): this {
    this.ops.push({ op: 'setOnInsert', field, value });
    return this;
  }

  /**
   * Set multiple fields only on insert (for upsert operations).
   */
  setOnInsertMany(values: Partial<T>): this {
    for (const [field, value] of Object.entries(values)) {
      if (value !== undefined) {
        this.ops.push({ op: 'setOnInsert', field, value });
      }
    }
    return this;
  }

  /**
   * Remove/unset a field.
   */
  unset(field: keyof T & string): this {
    this.ops.push({ op: 'unset', field });
    return this;
  }

  /**
   * Increment a numeric field.
   */
  inc(field: keyof T & string, value: number = 1): this {
    this.ops.push({ op: 'inc', field, value });
    return this;
  }

  /**
   * Decrement a numeric field (shorthand for negative inc).
   */
  dec(field: keyof T & string, value: number = 1): this {
    this.ops.push({ op: 'inc', field, value: -value });
    return this;
  }

  /**
   * Multiply a numeric field.
   */
  mul(field: keyof T & string, value: number): this {
    this.ops.push({ op: 'mul', field, value });
    return this;
  }

  /**
   * Set to the minimum of current and provided value.
   */
  min(field: keyof T & string, value: unknown): this {
    this.ops.push({ op: 'min', field, value });
    return this;
  }

  /**
   * Set to the maximum of current and provided value.
   */
  max(field: keyof T & string, value: unknown): this {
    this.ops.push({ op: 'max', field, value });
    return this;
  }

  /**
   * Push a value to an array field.
   */
  push(field: keyof T & string, value: unknown): this {
    this.ops.push({ op: 'push', field, value });
    return this;
  }

  /**
   * Remove a value from an array field.
   */
  pull(field: keyof T & string, value: unknown): this {
    this.ops.push({ op: 'pull', field, value });
    return this;
  }

  /**
   * Add to set (only if not already present).
   */
  addToSet(field: keyof T & string, value: unknown): this {
    this.ops.push({ op: 'addToSet', field, value });
    return this;
  }

  /**
   * Rename a field.
   */
  rename(from: keyof T & string, to: string): this {
    this.ops.push({ op: 'rename', from, to });
    return this;
  }

  /**
   * Set field to current timestamp.
   */
  currentDate(field: keyof T & string): this {
    this.ops.push({ op: 'currentDate', field });
    return this;
  }

  /**
   * Build the update specification.
   */
  build(): UpdateSpec {
    return { operations: [...this.ops] };
  }

  /**
   * Check if any operations have been added.
   */
  isEmpty(): boolean {
    return this.ops.length === 0;
  }
}

/**
 * Convert UpdateSpec to MongoDB update syntax.
 *
 * @example
 * ```typescript
 * const update = new UpdateBuilder()
 *   .set('name', 'John')
 *   .inc('count', 1)
 *   .build();
 *
 * const mongoUpdate = toMongoUpdate(update);
 * // { $set: { name: 'John' }, $inc: { count: 1 } }
 * ```
 */
export function toMongoUpdate(spec: UpdateSpec): Record<string, unknown> {
  const result: Record<string, Record<string, unknown>> = {};

  for (const op of spec.operations) {
    switch (op.op) {
      case 'set':
        result['$set'] = result['$set'] ?? {};
        result['$set'][op.field] = op.value;
        break;
      case 'setOnInsert':
        result['$setOnInsert'] = result['$setOnInsert'] ?? {};
        result['$setOnInsert'][op.field] = op.value;
        break;
      case 'unset':
        result['$unset'] = result['$unset'] ?? {};
        result['$unset'][op.field] = '';
        break;
      case 'inc':
        result['$inc'] = result['$inc'] ?? {};
        result['$inc'][op.field] = op.value;
        break;
      case 'mul':
        result['$mul'] = result['$mul'] ?? {};
        result['$mul'][op.field] = op.value;
        break;
      case 'min':
        result['$min'] = result['$min'] ?? {};
        result['$min'][op.field] = op.value;
        break;
      case 'max':
        result['$max'] = result['$max'] ?? {};
        result['$max'][op.field] = op.value;
        break;
      case 'push':
        result['$push'] = result['$push'] ?? {};
        result['$push'][op.field] = op.value;
        break;
      case 'pull':
        result['$pull'] = result['$pull'] ?? {};
        result['$pull'][op.field] = op.value;
        break;
      case 'addToSet':
        result['$addToSet'] = result['$addToSet'] ?? {};
        result['$addToSet'][op.field] = op.value;
        break;
      case 'rename':
        result['$rename'] = result['$rename'] ?? {};
        result['$rename'][op.from] = op.to;
        break;
      case 'currentDate':
        result['$currentDate'] = result['$currentDate'] ?? {};
        result['$currentDate'][op.field] = true;
        break;
    }
  }

  return result;
}

// =============================================================================
// SQL Adapters - PostgreSQL/MySQL Compatible
// =============================================================================

/**
 * Options for SQL generation.
 */
export interface SqlOptions {
  /** Table name */
  table: string;
  /** Parameter style: 'positional' ($1, $2) or 'named' (:name) */
  paramStyle?: 'positional' | 'named';
  /** Starting parameter index for positional params (default: 1) */
  startParam?: number;
  /** Field name transformer (e.g., camelCase to snake_case) */
  fieldTransform?: (field: string) => string;
}

/**
 * Result of SQL generation.
 */
export interface SqlResult {
  /** SQL query string */
  sql: string;
  /** Parameter values */
  params: unknown[];
}

/**
 * Convert camelCase to snake_case.
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert QuerySpec to SQL WHERE clause.
 *
 * @example
 * ```typescript
 * const query = new QueryBuilder<User>()
 *   .whereEq('status', 'active')
 *   .whereGte('age', 18)
 *   .build();
 *
 * const { sql, params } = toSqlWhere(query, { startParam: 1 });
 * // sql: "status = $1 AND age >= $2"
 * // params: ['active', 18]
 * ```
 */
export function toSqlWhere(
  spec: QuerySpec,
  options: Partial<SqlOptions> = {}
): SqlResult {
  const { paramStyle = 'positional', startParam = 1, fieldTransform = camelToSnake } = options;
  const params: unknown[] = [];
  const clauses: string[] = [];
  let paramIndex = startParam;

  const getParam = () => {
    if (paramStyle === 'positional') {
      return `$${paramIndex++}`;
    }
    return `$${paramIndex++}`; // Simplified, named params need more work
  };

  // Process AND conditions
  for (const condition of spec.filters) {
    const { clause, conditionParams } = conditionToSql(condition, getParam, fieldTransform);
    clauses.push(clause);
    params.push(...conditionParams);
  }

  // Process OR groups
  for (const orGroup of spec.orGroups) {
    const orClauses: string[] = [];
    for (const condition of orGroup.conditions) {
      const { clause, conditionParams } = conditionToSql(condition, getParam, fieldTransform);
      orClauses.push(clause);
      params.push(...conditionParams);
    }
    if (orClauses.length > 0) {
      clauses.push(`(${orClauses.join(' OR ')})`);
    }
  }

  return {
    sql: clauses.length > 0 ? clauses.join(' AND ') : '1=1',
    params,
  };
}

/**
 * Convert a single filter condition to SQL.
 */
function conditionToSql(
  condition: FilterCondition,
  getParam: () => string,
  fieldTransform: (s: string) => string
): { clause: string; conditionParams: unknown[] } {
  const field = fieldTransform(condition.field);
  const { operator } = condition;
  const conditionParams: unknown[] = [];

  let clause: string;

  switch (operator.op) {
    case 'eq':
      if (operator.value === null) {
        clause = `${field} IS NULL`;
      } else {
        clause = `${field} = ${getParam()}`;
        conditionParams.push(operator.value);
      }
      break;
    case 'ne':
      if (operator.value === null) {
        clause = `${field} IS NOT NULL`;
      } else {
        clause = `${field} != ${getParam()}`;
        conditionParams.push(operator.value);
      }
      break;
    case 'gt':
      clause = `${field} > ${getParam()}`;
      conditionParams.push(operator.value);
      break;
    case 'gte':
      clause = `${field} >= ${getParam()}`;
      conditionParams.push(operator.value);
      break;
    case 'lt':
      clause = `${field} < ${getParam()}`;
      conditionParams.push(operator.value);
      break;
    case 'lte':
      clause = `${field} <= ${getParam()}`;
      conditionParams.push(operator.value);
      break;
    case 'in':
      if (operator.value.length === 0) {
        clause = '1=0'; // Empty IN is always false
      } else {
        const placeholders = operator.value.map(() => getParam()).join(', ');
        clause = `${field} IN (${placeholders})`;
        conditionParams.push(...operator.value);
      }
      break;
    case 'nin':
      if (operator.value.length === 0) {
        clause = '1=1'; // Empty NOT IN is always true
      } else {
        const placeholders = operator.value.map(() => getParam()).join(', ');
        clause = `${field} NOT IN (${placeholders})`;
        conditionParams.push(...operator.value);
      }
      break;
    case 'contains':
      clause = operator.caseSensitive
        ? `${field} LIKE ${getParam()}`
        : `LOWER(${field}) LIKE LOWER(${getParam()})`;
      conditionParams.push(`%${escapeSqlLike(operator.value)}%`);
      break;
    case 'startsWith':
      clause = operator.caseSensitive
        ? `${field} LIKE ${getParam()}`
        : `LOWER(${field}) LIKE LOWER(${getParam()})`;
      conditionParams.push(`${escapeSqlLike(operator.value)}%`);
      break;
    case 'endsWith':
      clause = operator.caseSensitive
        ? `${field} LIKE ${getParam()}`
        : `LOWER(${field}) LIKE LOWER(${getParam()})`;
      conditionParams.push(`%${escapeSqlLike(operator.value)}`);
      break;
    case 'isNull':
      clause = operator.value ? `${field} IS NULL` : `${field} IS NOT NULL`;
      break;
    case 'between':
      clause = `${field} BETWEEN ${getParam()} AND ${getParam()}`;
      conditionParams.push(operator.min, operator.max);
      break;
    default:
      clause = '1=1';
  }

  return { clause, conditionParams };
}

/**
 * Escape special LIKE characters.
 */
function escapeSqlLike(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&');
}

/**
 * Convert UpdateSpec to SQL UPDATE statement.
 *
 * @example
 * ```typescript
 * const update = new UpdateBuilder()
 *   .set('name', 'John')
 *   .inc('count', 1)
 *   .currentDate('updatedAt')
 *   .build();
 *
 * const { sql, params } = toSqlUpdate(update, {
 *   table: 'users',
 *   where: 'id = $1',
 *   whereParams: ['user123'],
 * });
 * // sql: "UPDATE users SET name = $2, count = count + $3, updated_at = NOW() WHERE id = $1"
 * // params: ['user123', 'John', 1]
 * ```
 */
export function toSqlUpdate(
  spec: UpdateSpec,
  options: SqlOptions & { where?: string; whereParams?: unknown[] }
): SqlResult {
  const {
    table,
    where = '1=1',
    whereParams = [],
    startParam = 1,
    fieldTransform = camelToSnake,
  } = options;

  const setClauses: string[] = [];
  const params: unknown[] = [...whereParams];
  let paramIndex = startParam + whereParams.length;

  for (const op of spec.operations) {
    const field = fieldTransform(op.op === 'rename' ? op.from : op.field);

    switch (op.op) {
      case 'set':
        setClauses.push(`${field} = $${paramIndex++}`);
        params.push(op.value);
        break;
      case 'setOnInsert':
        // For SQL, setOnInsert is handled via INSERT ... ON CONFLICT
        // In UPDATE context, we skip these (they only apply on insert)
        // The caller should use toSqlUpsert for proper handling
        break;
      case 'unset':
        setClauses.push(`${field} = NULL`);
        break;
      case 'inc':
        setClauses.push(`${field} = ${field} + $${paramIndex++}`);
        params.push(op.value);
        break;
      case 'mul':
        setClauses.push(`${field} = ${field} * $${paramIndex++}`);
        params.push(op.value);
        break;
      case 'min':
        setClauses.push(`${field} = LEAST(${field}, $${paramIndex++})`);
        params.push(op.value);
        break;
      case 'max':
        setClauses.push(`${field} = GREATEST(${field}, $${paramIndex++})`);
        params.push(op.value);
        break;
      case 'currentDate':
        setClauses.push(`${field} = NOW()`);
        break;
      case 'rename':
        // SQL doesn't support field rename in UPDATE, skip
        break;
      case 'push':
      case 'pull':
      case 'addToSet':
        // Array operations - use JSON functions for PostgreSQL
        // This is simplified; real implementation depends on column type
        if (op.op === 'push') {
          setClauses.push(`${field} = ${field} || $${paramIndex++}::jsonb`);
          params.push(JSON.stringify([op.value]));
        }
        break;
    }
  }

  if (setClauses.length === 0) {
    return { sql: '', params: [] };
  }

  return {
    sql: `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${where}`,
    params,
  };
}

/**
 * Generate SQL SELECT statement from QuerySpec.
 *
 * @example
 * ```typescript
 * const query = new QueryBuilder<User>()
 *   .whereEq('status', 'active')
 *   .sort('createdAt', 'desc')
 *   .limit(20)
 *   .build();
 *
 * const { sql, params } = toSqlSelect(query, {
 *   table: 'users',
 *   columns: ['id', 'email', 'name'],
 * });
 * // sql: "SELECT id, email, name FROM users WHERE status = $1 ORDER BY created_at DESC LIMIT 20"
 * // params: ['active']
 * ```
 */
export function toSqlSelect(
  spec: QuerySpec,
  options: SqlOptions & { columns?: string[] }
): SqlResult {
  const {
    table,
    columns = ['*'],
    fieldTransform = camelToSnake,
  } = options;

  const { sql: whereClause, params } = toSqlWhere(spec, options);

  const columnsList = columns
    .map(c => c === '*' ? '*' : fieldTransform(c))
    .join(', ');

  let sql = `SELECT ${columnsList} FROM ${table}`;

  if (whereClause && whereClause !== '1=1') {
    sql += ` WHERE ${whereClause}`;
  }

  if (spec.sort) {
    const sortField = fieldTransform(spec.sort.field);
    const sortDir = spec.sort.direction.toUpperCase();
    sql += ` ORDER BY ${sortField} ${sortDir}`;
  }

  if (spec.limit > 0) {
    sql += ` LIMIT ${spec.limit}`;
  }

  if (spec.skip > 0) {
    sql += ` OFFSET ${spec.skip}`;
  }

  return { sql, params };
}
