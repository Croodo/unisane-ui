import { getDbProvider } from './provider';
import { connectDb as connectDriverDb, mongoHealth } from './connection';

export async function connectDb() {
  const provider = getDbProvider();
  switch (provider) {
    case 'mongo':
      return connectDriverDb();
    default:
      throw new Error(`DB provider '${provider}' not supported yet`);
  }
}

export async function dbHealth() {
  try {
    const provider = getDbProvider();
    switch (provider) {
      case 'mongo':
        return mongoHealth();
      default:
        return {
          ok: false,
          error: `DB provider '${provider}' not supported yet`,
        } as const;
    }
  } catch (e) {
    return { ok: false, error: (e as Error)?.message ?? "dbHealth failed" } as const;
  }
}

/**
 * Database-agnostic transaction wrapper.
 *
 * For MongoDB with replica set: Uses real transactions with ClientSession.
 * For MongoDB without replica set: No-op passthrough (set MONGODB_TRANSACTIONS_ENABLED=false).
 * For other providers: Falls back to no-op passthrough.
 *
 * @example
 * ```typescript
 * // Simple usage - session passed to callback
 * await withTransaction(async (session) => {
 *   await col('users').updateOne({ _id }, { $set: { name } }, { session });
 *   await col('audit').insertOne({ action: 'user.updated' }, { session });
 * });
 * ```
 */
export { withMongoTransaction as withTransaction } from './transactions';

// Transaction utilities
export {
  withMongoTransaction,
  withRetryableTransaction,
  isTransactionsEnabled,
  DEFAULT_TRANSACTION_OPTIONS,
} from './transactions';
export type { TransactionAwareOptions } from './transactions';

// Re-export commonly used items
export { col, db, closeDb } from './connection';
export { getDbProvider } from './provider';
export type { DbProvider } from './provider';

// Tenant scoping utilities
export {
  tenantFilter,
  tenantFilterActive,
  assertTenantOwnership,
  isTenantOwned,
  withTenantId,
  filterByTenant,
  TenantIsolationError,
  TenantContextRequiredError,
  // Explicit variants for auth-time operations (before ctx.run())
  explicitTenantFilter,
  explicitTenantFilterActive,
} from './tenant-scope';
export type { TenantScoped } from './tenant-scope';

// Filter utilities
export { buildMongoFilter, escapeRegex, softDeleteFilter, SOFT_DELETE_FILTER } from './filters';
export type { FilterOp, FilterSpec } from './types';

// Repository selection
export { selectRepo } from './repo';

// Aggregation utilities
export { runStatsAggregation, parseSortSpec, COMMON_SORT_FIELDS } from './aggregations';
export type { StatsResult } from './aggregations';

// ObjectId utilities
export { maybeObjectId } from './objectid';

// Index management
export { ensureIndexes, listIndexes, dropIndexes, INDEX_DEFINITIONS } from './indexes';

// Migration system
export {
  runMigrations,
  getMigrationStatus,
  getPendingMigrations,
  hasPendingMigrations,
  getAppliedMigrations,
  resetMigrationHistory,
} from './migrations/index';
export type {
  Migration,
  MigrationContext,
  MigrationLogger,
  MigrationDirection,
  MigrationLogDoc,
  MigrationRunResult,
  MigrationRunOptions,
  MigrationStatus,
} from './migrations/index';

// Seed system
export {
  runSeed,
  loadSeedConfig,
  getDefaultSeedConfig,
} from './seed/index';
export type {
  SeedConfig,
  SeedTenant,
  SeedUser,
  SeedMembership,
  SeedApiKey,
  SeedSubscription,
  SeedFlagOverride,
  SeedGenerateConfig,
  SeedLogger,
  SeedRunOptions,
  SeedRunResult,
  SeedProviders,
} from './seed/index';

// Collection names
export { COLLECTIONS, getAllCollectionNames, isValidCollectionName } from './collections';
export type { CollectionName } from './collections';

// Base repository utilities
export {
  createMongoRepository,
  createTenantScopedRepository,
  buildStandardUpdateSet,
} from './base-repository';
export type {
  BaseDocument,
  BaseView,
  RepositoryConfig,
  BaseMongoRepository,
  TenantScopedRepository,
  BulkCreateResult,
  BulkDeleteResult,
} from './base-repository';

// Document mapper utilities
export {
  idToString,
  dateToIsoString,
  coalesce,
  createDocumentMapper,
  createBatchMapper,
  viewsToMap,
  buildCreateTimestamps,
  buildUpdateTimestamp,
  buildSoftDeleteTimestamps,
} from './document-mapper';
export type {
  MapperOptions,
  TimestampFields,
  SoftDeleteField,
} from './document-mapper';

/**
 * Check if an error is a duplicate key error (Mongo or MySQL).
 * Useful for handling unique constraint violations across database providers.
 */
export function isDuplicateKeyError(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false;
  const obj = e as { code?: unknown; errno?: unknown };
  const code = obj.code;
  const errno = obj.errno;
  if (typeof code === 'number' && code === 11000) return true; // Mongo duplicate key
  if (typeof code === 'string' && code.toUpperCase() === 'ER_DUP_ENTRY') return true; // MySQL duplicate key
  if (typeof errno === 'number' && errno === 1062) return true; // MySQL duplicate key
  return false;
}
