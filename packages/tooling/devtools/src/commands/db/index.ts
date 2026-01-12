/**
 * Database commands
 *
 * Commands for interacting with the database:
 * - query: Quick database query utility
 * - rename: Rename collections
 * - collections: List all collections
 * - indexes: Create or list database indexes
 * - migrate: Run database migrations
 * - seed: Seed database with demo data
 */

export { dbQuery } from './query.js';
export type { DbQueryOptions } from './query.js';

export { dbRename, dbListCollections } from './rename.js';
export type { DbRenameOptions } from './rename.js';

export { dbIndexes } from './indexes.js';
export type { DbIndexesOptions } from './indexes.js';

export { dbMigrate } from './migrate.js';
export type { DbMigrateOptions } from './migrate.js';

export { dbSeed } from './seed.js';
export type { DbSeedOptions } from './seed.js';
