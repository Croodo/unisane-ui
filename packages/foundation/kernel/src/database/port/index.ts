/**
 * Database Port Module
 *
 * Provides pluggable database abstractions following the Ports & Adapters pattern.
 *
 * @example
 * ```typescript
 * import { getDatabaseProvider, createDatabaseProvider } from '@unisane/kernel';
 *
 * // Get the configured provider
 * const db = getDatabaseProvider();
 *
 * // Use the collection interface
 * const users = db.collection<User>('users');
 * const user = await users.findById(userId);
 *
 * // Create a specific provider
 * const memDb = createDatabaseProvider({ type: 'memory' });
 * ```
 */

import { getEnv } from '../../env';
import { logger } from '../../observability';
import type { DatabaseProvider, DatabaseProviderConfig, DatabaseProviderType } from './types';
import { MongoDBProvider } from './mongo-adapter';
import { MemoryDatabaseProvider } from './memory-adapter';

const log = logger.child({ module: 'database', component: 'port' });

// Global singleton for the database provider
let databaseProvider: DatabaseProvider | null = null;
let currentProviderType: DatabaseProviderType = 'mongo';

/**
 * Get the database provider type from environment.
 */
export function getDatabaseProviderType(): DatabaseProviderType {
  const env = getEnv();

  // Check for explicit provider setting
  const explicit = process.env.DATABASE_PROVIDER as DatabaseProviderType | undefined;
  if (explicit) return explicit;

  // Default to memory in test environments
  if (env.APP_ENV === 'test' || process.env.NODE_ENV === 'test') {
    return 'memory';
  }

  // Default to mongo if URI is configured
  if (env.MONGODB_URI) {
    return 'mongo';
  }

  // Fall back to memory for dev without config
  if (env.APP_ENV === 'dev') {
    return 'memory';
  }

  return 'mongo';
}

/**
 * Create a database provider from configuration.
 */
export function createDatabaseProvider(config: DatabaseProviderConfig): DatabaseProvider {
  switch (config.type) {
    case 'mongo':
      return new MongoDBProvider();

    case 'memory':
      return new MemoryDatabaseProvider();

    case 'postgres':
      // TODO: Implement PostgreSQL adapter
      throw new Error('PostgreSQL database provider not yet implemented');

    case 'mysql':
      // TODO: Implement MySQL adapter
      throw new Error('MySQL database provider not yet implemented');

    default:
      throw new Error(`Unknown database provider type: ${config.type}`);
  }
}

/**
 * Create database provider from environment variables.
 */
function createDatabaseProviderFromEnv(): DatabaseProvider {
  const type = getDatabaseProviderType();

  log.info('initializing database provider', { type });

  switch (type) {
    case 'mongo':
      return new MongoDBProvider();

    case 'memory':
      log.warn('using in-memory database - data will be lost on restart');
      return new MemoryDatabaseProvider();

    default:
      throw new Error(`Unsupported database provider: ${type}`);
  }
}

/**
 * Get the current database provider instance.
 * Creates it from environment if not already set.
 */
export function getDatabaseProvider(): DatabaseProvider {
  if (!databaseProvider) {
    databaseProvider = createDatabaseProviderFromEnv();
    currentProviderType = getDatabaseProviderType();
  }
  return databaseProvider;
}

/**
 * Set a custom database provider.
 * Useful for testing or custom configurations.
 */
export function setDatabaseProvider(provider: DatabaseProvider): void {
  databaseProvider = provider;
  currentProviderType = provider.type;
  log.info('custom database provider set', { type: provider.type });
}

/**
 * Reset the database provider to be re-initialized from environment.
 * Useful for testing.
 */
export function resetDatabaseProvider(): void {
  databaseProvider = null;
  currentProviderType = 'mongo';
}

/**
 * Get the current provider type.
 */
export function getCurrentDatabaseProviderType(): DatabaseProviderType {
  return currentProviderType;
}

// Re-export types
export type {
  DatabaseProviderType,
  DatabaseProvider,
  DatabaseProviderConfig,
  DatabaseCollection,
  DatabaseFilter,
  FilterOperator,
  QueryOptions,
  UpdateOperators,
  CreateResult,
  UpdateResult,
  DeleteResult,
  FindManyResult,
  TransactionSession,
  TransactionOptions,
  SessionOptions,
  DatabaseHealthStatus,
  BaseRecord,
  ScopedRecord,
  SortDirection,
  SortSpec,
  PaginationOptions,
} from './types';

// Re-export adapters
export { MongoDBProvider, createMongoDBProvider } from './mongo-adapter';
export { MemoryDatabaseProvider, createMemoryDatabaseProvider, clearMemoryStorage } from './memory-adapter';
