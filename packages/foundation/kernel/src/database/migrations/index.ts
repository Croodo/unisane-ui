/**
 * Database Migration System
 *
 * Provides version-controlled schema changes with support for:
 * - Forward and backward migrations (up/down)
 * - Migration history tracking
 * - Dry-run mode for previewing changes
 * - Dependency ordering
 *
 * @module database/migrations
 *
 * @example
 * ```typescript
 * // Define a migration
 * import type { Migration } from '@unisane/kernel';
 *
 * export const migration: Migration = {
 *   id: '001_create_indexes',
 *   description: 'Create initial indexes',
 *   up: async (ctx) => {
 *     if (ctx.dryRun) {
 *       ctx.log.info('Would create indexes');
 *       return;
 *     }
 *     // Create indexes...
 *   },
 *   down: async (ctx) => {
 *     // Drop indexes...
 *   },
 * };
 *
 * // Run migrations
 * import { runMigrations, connectDb } from '@unisane/kernel';
 * import { migrations } from './registry';
 *
 * await connectDb();
 * const result = await runMigrations(migrations);
 * ```
 */

export type {
  Migration,
  MigrationContext,
  MigrationLogger,
  MigrationDirection,
  MigrationLogDoc,
  MigrationRunResult,
  MigrationRunOptions,
  MigrationStatus,
} from "./types";

export {
  runMigrations,
  getMigrationStatus,
  getPendingMigrations,
  hasPendingMigrations,
  getAppliedMigrations,
  resetMigrationHistory,
} from "./runner";
