/**
 * Migration Runner
 *
 * Executes migrations in order, tracks applied migrations, and supports rollback.
 *
 * @module database/migrations/runner
 */

import { hostname } from "node:os";
import { col } from "../connection";
import { COLLECTIONS } from "../collections";
import { getEnv } from "../../env";
import type {
  Migration,
  MigrationLogDoc,
  MigrationRunResult,
  MigrationRunOptions,
  MigrationContext,
  MigrationStatus,
  MigrationLogger,
} from "./types";

/**
 * Default logger that writes to console
 */
const defaultLogger: MigrationLogger = {
  info: (msg) => console.log(`[migrate] ${msg}`),
  warn: (msg) => console.warn(`[migrate] ⚠️  ${msg}`),
  error: (msg) => console.error(`[migrate] ❌ ${msg}`),
  debug: (msg) => {
    if (process.env.DEBUG) console.log(`[migrate] 🔍 ${msg}`);
  },
};

/**
 * Get the migrations collection
 */
function migrationsCol() {
  return col<MigrationLogDoc>(COLLECTIONS.MIGRATIONS);
}

/**
 * Get list of already applied migration IDs
 */
export async function getAppliedMigrations(): Promise<Set<string>> {
  const docs = await migrationsCol().find({}).toArray();
  return new Set(docs.map((d) => d._id));
}

/**
 * Record a migration as applied
 */
async function recordMigration(
  id: string,
  durationMs: number,
  notes?: string
): Promise<void> {
  const env = getEnv();
  const doc: MigrationLogDoc = {
    _id: id,
    appliedAt: new Date(),
    durationMs,
    environment: env.APP_ENV ?? "dev",
    hostname: hostname(),
    notes,
  };
  await migrationsCol().insertOne(doc);
}

/**
 * Remove a migration record (for rollback)
 */
async function removeMigrationRecord(id: string): Promise<void> {
  await migrationsCol().deleteOne({ _id: id });
}

/**
 * Sort migrations by ID (lexicographic order)
 * Migration IDs should be prefixed with numbers like 001_, 002_, etc.
 */
function sortMigrations(migrations: Migration[]): Migration[] {
  return [...migrations].sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Validate migration IDs
 */
function validateMigrations(migrations: Migration[]): void {
  const ids = new Set<string>();
  for (const m of migrations) {
    if (!m.id || typeof m.id !== "string") {
      throw new Error(`Migration missing valid 'id' field`);
    }
    if (ids.has(m.id)) {
      throw new Error(`Duplicate migration ID: ${m.id}`);
    }
    if (!/^\d{3}_[a-z0-9_]+$/.test(m.id)) {
      throw new Error(
        `Invalid migration ID format: ${m.id}. Expected: XXX_description (e.g., 001_create_indexes)`
      );
    }
    ids.add(m.id);
  }
}

/**
 * Run migrations
 *
 * @param migrations - Array of migration definitions
 * @param options - Run options
 * @returns Result of the migration run
 *
 * @example
 * ```typescript
 * import { runMigrations } from '@unisane/kernel';
 * import { migrations } from './migrations/registry';
 *
 * const result = await runMigrations(migrations, { dryRun: true });
 * console.log(`Applied: ${result.applied.length}, Skipped: ${result.skipped.length}`);
 * ```
 */
export async function runMigrations(
  migrations: Migration[],
  options: MigrationRunOptions = {},
  logger: MigrationLogger = defaultLogger
): Promise<MigrationRunResult> {
  const startTime = Date.now();
  const { dryRun = false, only, target, direction = "up", force = false } = options;

  // Validate migrations
  validateMigrations(migrations);

  // Sort migrations
  let sorted = sortMigrations(migrations);

  // If going down, reverse the order
  if (direction === "down") {
    sorted = sorted.reverse();
  }

  // Filter by 'only' if specified
  if (only && only.length > 0) {
    const onlySet = new Set(only);
    sorted = sorted.filter((m) => onlySet.has(m.id));
  }

  // Filter up to 'target' if specified
  if (target) {
    const targetIndex = sorted.findIndex((m) => m.id === target);
    if (targetIndex === -1) {
      throw new Error(`Target migration not found: ${target}`);
    }
    sorted = sorted.slice(0, targetIndex + 1);
  }

  // Get already applied migrations
  const applied = await getAppliedMigrations();

  const result: MigrationRunResult = {
    applied: [],
    skipped: [],
    failed: [],
    durationMs: 0,
    dryRun,
  };

  logger.info(
    `Starting migration run (direction: ${direction}, dryRun: ${dryRun})`
  );
  logger.info(`Found ${sorted.length} migration(s) to process`);

  for (const migration of sorted) {
    const isApplied = applied.has(migration.id);

    // For 'up': skip if already applied (unless force)
    // For 'down': skip if not applied
    if (direction === "up") {
      if (isApplied && !force) {
        result.skipped.push(migration.id);
        logger.debug(`Skipping ${migration.id} (already applied)`);
        continue;
      }
    } else {
      if (!isApplied) {
        result.skipped.push(migration.id);
        logger.debug(`Skipping ${migration.id} (not applied, cannot rollback)`);
        continue;
      }
      if (!migration.down) {
        logger.warn(`${migration.id} has no 'down' function, cannot rollback`);
        result.failed.push({
          id: migration.id,
          error: "No down function defined",
        });
        continue;
      }
    }

    // Execute migration
    const migrationStart = Date.now();
    const fn = direction === "up" ? migration.up : migration.down!;

    const ctx: MigrationContext = {
      dryRun,
      log: logger,
    };

    try {
      logger.info(
        `${dryRun ? "[DRY-RUN] " : ""}${direction === "up" ? "Applying" : "Reverting"} ${migration.id}: ${migration.description}`
      );

      if (!dryRun) {
        await fn(ctx);
        const durationMs = Date.now() - migrationStart;

        if (direction === "up") {
          await recordMigration(migration.id, durationMs);
        } else {
          await removeMigrationRecord(migration.id);
        }

        logger.info(`✓ ${migration.id} completed in ${durationMs}ms`);
      } else {
        logger.info(`✓ ${migration.id} would be ${direction === "up" ? "applied" : "reverted"}`);
      }

      result.applied.push(migration.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to ${direction === "up" ? "apply" : "revert"} ${migration.id}: ${errorMessage}`);
      result.failed.push({ id: migration.id, error: errorMessage });

      // Stop on first failure
      break;
    }
  }

  result.durationMs = Date.now() - startTime;

  logger.info(
    `Migration run complete: ${result.applied.length} ${direction === "up" ? "applied" : "reverted"}, ${result.skipped.length} skipped, ${result.failed.length} failed (${result.durationMs}ms)`
  );

  return result;
}

/**
 * Get the status of all migrations
 */
export async function getMigrationStatus(
  migrations: Migration[]
): Promise<MigrationStatus[]> {
  validateMigrations(migrations);

  const applied = await getAppliedMigrations();
  const appliedDocs = await migrationsCol().find({}).toArray();
  const appliedMap = new Map(appliedDocs.map((d) => [d._id, d]));

  const sorted = sortMigrations(migrations);

  return sorted.map((m) => ({
    id: m.id,
    description: m.description,
    applied: applied.has(m.id),
    appliedAt: appliedMap.get(m.id)?.appliedAt,
    hasDown: !!m.down,
  }));
}

/**
 * Get list of pending migrations (not yet applied)
 */
export async function getPendingMigrations(
  migrations: Migration[]
): Promise<Migration[]> {
  const applied = await getAppliedMigrations();
  const sorted = sortMigrations(migrations);
  return sorted.filter((m) => !applied.has(m.id));
}

/**
 * Check if there are any pending migrations
 */
export async function hasPendingMigrations(
  migrations: Migration[]
): Promise<boolean> {
  const pending = await getPendingMigrations(migrations);
  return pending.length > 0;
}

/**
 * Reset migration history (WARNING: use with caution!)
 * This removes all migration records but does NOT revert the migrations.
 */
export async function resetMigrationHistory(): Promise<number> {
  const result = await migrationsCol().deleteMany({});
  return result.deletedCount;
}
