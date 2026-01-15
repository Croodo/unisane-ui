/**
 * Database Port Types
 *
 * Defines the abstract interface for database operations, enabling
 * pluggable database backends (MongoDB, PostgreSQL, MySQL, etc.).
 *
 * This follows the Ports & Adapters (Hexagonal) pattern where:
 * - Port = This interface (what the application needs)
 * - Adapter = MongoDB/PostgreSQL implementations (how it's provided)
 */

/**
 * Supported database provider types.
 */
export type DatabaseProviderType = 'mongo' | 'postgres' | 'mysql' | 'memory';

/**
 * Generic filter operators for database queries.
 * Maps to provider-specific operators (e.g., $eq, $gt for MongoDB).
 */
export interface FilterOperator<T = unknown> {
  $eq?: T;
  $ne?: T;
  $gt?: T;
  $gte?: T;
  $lt?: T;
  $lte?: T;
  $in?: T[];
  $nin?: T[];
  $exists?: boolean;
  $regex?: string;
  $like?: string;
  $ilike?: string;
}

/**
 * Generic filter for database queries.
 * Supports field-level operators or direct equality.
 */
export type DatabaseFilter<T = Record<string, unknown>> = {
  [K in keyof T]?: T[K] | FilterOperator<T[K]>;
} & {
  $and?: DatabaseFilter<T>[];
  $or?: DatabaseFilter<T>[];
  $not?: DatabaseFilter<T>;
};

/**
 * Sort direction.
 */
export type SortDirection = 'asc' | 'desc' | 1 | -1;

/**
 * Sort specification.
 */
export type SortSpec<T = Record<string, unknown>> = {
  [K in keyof T]?: SortDirection;
};

/**
 * Pagination options.
 */
export interface PaginationOptions {
  /** Number of records to skip */
  skip?: number;
  /** Maximum records to return */
  limit?: number;
  /** Cursor-based pagination token */
  cursor?: string;
}

/**
 * Query options for find operations.
 */
export interface QueryOptions<T = Record<string, unknown>> {
  /** Sort specification */
  sort?: SortSpec<T>;
  /** Pagination */
  pagination?: PaginationOptions;
  /** Fields to include (projection) */
  select?: (keyof T)[];
  /** Fields to exclude */
  exclude?: (keyof T)[];
  /** Include soft-deleted records */
  includeSoftDeleted?: boolean;
}

/**
 * Update operators for database modifications.
 */
export interface UpdateOperators<T = Record<string, unknown>> {
  /** Set field values */
  $set?: Partial<T>;
  /** Unset (remove) fields */
  $unset?: { [K in keyof T]?: true };
  /** Increment numeric fields */
  $inc?: { [K in keyof T]?: number };
  /** Push to array fields */
  $push?: { [K in keyof T]?: unknown };
  /** Pull from array fields */
  $pull?: { [K in keyof T]?: unknown };
  /** Add to set (unique push) */
  $addToSet?: { [K in keyof T]?: unknown };
}

/**
 * Result of a create operation.
 */
export interface CreateResult<T> {
  /** The created record */
  data: T;
  /** The generated ID */
  id: string;
}

/**
 * Result of an update operation.
 */
export interface UpdateResult<T> {
  /** The updated record (if returnDocument is true) */
  data?: T;
  /** Number of matched records */
  matchedCount: number;
  /** Number of modified records */
  modifiedCount: number;
}

/**
 * Result of a delete operation.
 */
export interface DeleteResult {
  /** Number of deleted records */
  deletedCount: number;
}

/**
 * Result of a paginated find operation.
 */
export interface FindManyResult<T> {
  /** The records */
  data: T[];
  /** Total count (if requested) */
  totalCount?: number;
  /** Next page cursor */
  nextCursor?: string;
  /** Whether more records exist */
  hasMore: boolean;
}

/**
 * Transaction session handle.
 * Opaque type - implementation is provider-specific.
 */
export interface TransactionSession {
  /** Provider-specific session ID */
  readonly id: string;
  /** Provider-specific session object */
  readonly native: unknown;
}

/**
 * Transaction options.
 */
export interface TransactionOptions {
  /** Read concern level */
  readConcern?: 'local' | 'majority' | 'linearizable' | 'snapshot';
  /** Write concern level */
  writeConcern?: 'majority' | number;
  /** Maximum commit time in milliseconds */
  maxCommitTimeMs?: number;
}

/**
 * Base document interface for all database records.
 */
export interface BaseRecord {
  /** Unique identifier (string representation) */
  id: string;
  /** Creation timestamp */
  createdAt?: Date;
  /** Last update timestamp */
  updatedAt?: Date;
  /** Soft delete timestamp */
  deletedAt?: Date | null;
}

/**
 * Scope-aware document (tenant, user, merchant, etc.)
 */
export interface ScopedRecord extends BaseRecord {
  /** The scope type */
  scopeType?: string;
  /** The scope identifier */
  scopeId?: string;
}

/**
 * Options that can include a transaction session.
 */
export interface SessionOptions {
  /** Transaction session for atomic operations */
  session?: TransactionSession;
}

/**
 * Database collection/table operations interface.
 * This is the main abstraction for CRUD operations.
 *
 * All methods accept an optional `session` parameter for transaction support.
 * When a session is provided, the operation participates in that transaction.
 */
export interface DatabaseCollection<T extends BaseRecord = BaseRecord> {
  /** Collection/table name */
  readonly name: string;

  /**
   * Create a new record.
   */
  create(
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
    options?: SessionOptions
  ): Promise<CreateResult<T>>;

  /**
   * Create multiple records.
   */
  createMany(
    data: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>,
    options?: SessionOptions
  ): Promise<CreateResult<T>[]>;

  /**
   * Find a record by ID.
   */
  findById(
    id: string,
    options?: Omit<QueryOptions<T>, 'pagination' | 'sort'> & SessionOptions
  ): Promise<T | null>;

  /**
   * Find multiple records by IDs.
   */
  findByIds(
    ids: string[],
    options?: Omit<QueryOptions<T>, 'pagination' | 'sort'> & SessionOptions
  ): Promise<Map<string, T>>;

  /**
   * Find one record matching a filter.
   */
  findOne(
    filter: DatabaseFilter<T>,
    options?: Omit<QueryOptions<T>, 'pagination'> & SessionOptions
  ): Promise<T | null>;

  /**
   * Find multiple records matching a filter.
   */
  findMany(
    filter: DatabaseFilter<T>,
    options?: QueryOptions<T> & SessionOptions
  ): Promise<FindManyResult<T>>;

  /**
   * Update a record by ID.
   */
  updateById(
    id: string,
    update: UpdateOperators<T>,
    options?: SessionOptions
  ): Promise<UpdateResult<T>>;

  /**
   * Update one record matching a filter.
   */
  updateOne(
    filter: DatabaseFilter<T>,
    update: UpdateOperators<T>,
    options?: SessionOptions
  ): Promise<UpdateResult<T>>;

  /**
   * Update multiple records matching a filter.
   */
  updateMany(
    filter: DatabaseFilter<T>,
    update: UpdateOperators<T>,
    options?: SessionOptions
  ): Promise<UpdateResult<T>>;

  /**
   * Soft delete a record by ID.
   */
  softDelete(id: string, options?: SessionOptions): Promise<UpdateResult<T>>;

  /**
   * Soft delete multiple records by IDs.
   */
  softDeleteMany(ids: string[], options?: SessionOptions): Promise<UpdateResult<T>>;

  /**
   * Hard delete a record by ID.
   */
  hardDelete(id: string, options?: SessionOptions): Promise<DeleteResult>;

  /**
   * Hard delete multiple records by IDs.
   */
  hardDeleteMany(ids: string[], options?: SessionOptions): Promise<DeleteResult>;

  /**
   * Count records matching a filter.
   */
  count(filter?: DatabaseFilter<T>, options?: SessionOptions): Promise<number>;

  /**
   * Check if a record exists.
   */
  exists(filter: DatabaseFilter<T>, options?: SessionOptions): Promise<boolean>;
}

/**
 * Database connection health status.
 */
export interface DatabaseHealthStatus {
  ok: boolean;
  latencyMs?: number;
  error?: string;
  details?: Record<string, unknown>;
}

/**
 * Database provider interface.
 * Each database backend (MongoDB, PostgreSQL, etc.) implements this.
 */
export interface DatabaseProvider {
  /** Provider type identifier */
  readonly type: DatabaseProviderType;

  /**
   * Connect to the database.
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the database.
   */
  disconnect(): Promise<void>;

  /**
   * Check connection health.
   */
  health(): Promise<DatabaseHealthStatus>;

  /**
   * Get a collection/table interface.
   */
  collection<T extends BaseRecord>(name: string): DatabaseCollection<T>;

  /**
   * Start a transaction.
   */
  startTransaction(options?: TransactionOptions): Promise<TransactionSession>;

  /**
   * Commit a transaction.
   */
  commitTransaction(session: TransactionSession): Promise<void>;

  /**
   * Abort/rollback a transaction.
   */
  abortTransaction(session: TransactionSession): Promise<void>;

  /**
   * Execute operations within a transaction.
   */
  withTransaction<T>(
    fn: (session: TransactionSession) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T>;

  /**
   * Get the native database client (for advanced operations).
   * @deprecated Prefer using the abstracted methods.
   */
  getNativeClient(): unknown;
}

/**
 * Database provider configuration.
 */
export interface DatabaseProviderConfig {
  type: DatabaseProviderType;

  /** MongoDB configuration */
  mongo?: {
    uri: string;
    database: string;
    options?: {
      maxPoolSize?: number;
      minPoolSize?: number;
      maxIdleTimeMS?: number;
      serverSelectionTimeoutMS?: number;
      retryWrites?: boolean;
      retryReads?: boolean;
    };
  };

  /** PostgreSQL configuration */
  postgres?: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl?: boolean;
    poolSize?: number;
  };

  /** MySQL configuration */
  mysql?: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl?: boolean;
    connectionLimit?: number;
  };
}
