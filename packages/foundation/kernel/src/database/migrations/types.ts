/**
 * Migration System Types
 *
 * Type definitions for the database migration system.
 *
 * @module database/migrations/types
 */

import type { ClientSession } from "mongodb";

/**
 * Migration direction - whether we're applying or reverting
 */
export type MigrationDirection = "up" | "down";

/**
 * Migration execution context passed to up/down functions
 */
export interface MigrationContext {
  /** MongoDB session for transaction support (if available) */
  session?: ClientSession;
  /** Whether this is a dry-run (no actual changes) */
  dryRun: boolean;
  /** Logger for migration output */
  log: MigrationLogger;
}

/**
 * Logger interface for migration output
 */
export interface MigrationLogger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  debug: (message: string) => void;
}

/**
 * Migration definition interface
 *
 * Each migration should export an object implementing this interface.
 * The `id` must be unique and should follow the pattern: XXX_description
 * where XXX is a 3-digit number (e.g., 001_create_indexes)
 *
 * @example
 * ```typescript
 * import type { Migration } from '@unisane/kernel';
 *
 * export const migration: Migration = {
 *   id: '001_create_initial_indexes',
 *   description: 'Create initial database indexes',
 *   up: async (ctx) => {
 *     // Apply migration
 *   },
 *   down: async (ctx) => {
 *     // Revert migration (optional)
 *   },
 * };
 * ```
 */
export interface Migration {
  /** Unique migration identifier (e.g., '001_create_indexes') */
  id: string;
  /** Human-readable description of what this migration does */
  description: string;
  /** Apply the migration */
  up: (ctx: MigrationContext) => Promise<void>;
  /** Revert the migration (optional - some migrations can't be reverted) */
  down?: (ctx: MigrationContext) => Promise<void>;
  /**
   * Dependencies - migration IDs that must be applied before this one.
   * By default, migrations are applied in ID order (lexicographic).
   * Use this only when you need explicit ordering.
   */
  dependencies?: string[];
}

/**
 * Migration log document stored in the _migrations collection
 */
export interface MigrationLogDoc {
  /** Migration ID (e.g., '001_create_indexes') - also used as _id */
  _id: string;
  /** When the migration was applied */
  appliedAt: Date;
  /** Duration in milliseconds */
  durationMs: number;
  /** Environment where migration was applied */
  environment: string;
  /** Hostname of machine that ran the migration */
  hostname: string;
  /** Optional notes or errors */
  notes?: string;
}

/**
 * Result of a migration run
 */
export interface MigrationRunResult {
  /** Migrations that were applied */
  applied: string[];
  /** Migrations that were skipped (already applied) */
  skipped: string[];
  /** Migrations that failed */
  failed: Array<{ id: string; error: string }>;
  /** Total duration in milliseconds */
  durationMs: number;
  /** Whether this was a dry run */
  dryRun: boolean;
}

/**
 * Options for running migrations
 */
export interface MigrationRunOptions {
  /** Only preview changes without applying */
  dryRun?: boolean;
  /** Only run specific migrations by ID */
  only?: string[];
  /** Run up to this migration (inclusive) */
  target?: string;
  /** Run migrations in down direction (revert) */
  direction?: MigrationDirection;
  /** Force re-run already applied migrations */
  force?: boolean;
}

/**
 * Migration status for a single migration
 */
export interface MigrationStatus {
  id: string;
  description: string;
  applied: boolean;
  appliedAt?: Date;
  hasDown: boolean;
}
