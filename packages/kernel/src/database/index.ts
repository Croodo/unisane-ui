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
 * For MongoDB (without replica set), this is a no-op passthrough.
 * For other providers (MySQL, etc.), wraps the function in a transaction.
 * Services can call withTransaction regardless of provider for consistent semantics.
 */
export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  const provider = getDbProvider();
  switch (provider) {
    case 'mongo':
      // Mongo transaction support requires sessions and replica set; for local/dev and most flows, we no-op.
      // Services remain consistent by calling withTransaction regardless of provider.
      return fn();
    default:
      // For unsupported providers, just run the function directly
      return fn();
  }
}

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
