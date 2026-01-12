/**
 * db:migrate command - Run database migrations
 *
 * Usage:
 *   unisane db migrate                Run pending migrations
 *   unisane db migrate --status       Show migration status
 *   unisane db migrate --dry-run      Preview migrations without running
 *   unisane db migrate --down         Rollback last migration
 *   unisane db migrate --target XXX   Run up to specific migration
 *   unisane db migrate --reset        Reset migration history
 *
 * Examples:
 *   unisane db migrate
 *   unisane db migrate --status
 *   unisane db migrate --down --target 001_init
 */

import { log } from "@unisane/cli-core";

export interface DbMigrateOptions {
  /** Preview changes without applying */
  dryRun?: boolean;
  /** Run migrations in down direction (rollback) */
  down?: boolean;
  /** Run up to this migration (inclusive) */
  target?: string;
  /** Show status of all migrations */
  status?: boolean;
  /** Reset migration history (dangerous!) */
  reset?: boolean;
  /** Force re-run already applied migrations */
  force?: boolean;
  /** Path to migrations directory */
  migrationsPath?: string;
}

/**
 * Default migrations directory relative to CWD
 */
const DEFAULT_MIGRATIONS_PATH = "./src/db/migrations";

/**
 * Main migrate command handler
 */
export async function dbMigrate(options: DbMigrateOptions = {}): Promise<number> {
  const {
    dryRun = false,
    down = false,
    target,
    status = false,
    reset = false,
    force = false,
    migrationsPath = DEFAULT_MIGRATIONS_PATH,
  } = options;

  try {
    const {
      connectDb,
      runMigrations,
      getMigrationStatus,
      resetMigrationHistory,
    } = await import("@unisane/kernel");

    // Connect to database
    log.info("Connecting to database...");
    await connectDb();
    log.success("Connected");
    log.newline();

    // Load migrations from the migrations directory
    const migrations = await loadMigrations(migrationsPath);

    if (migrations.length === 0) {
      log.warn(`No migrations found in ${migrationsPath}`);
      log.info("Create migrations in src/db/migrations/ with the pattern XXX_description.ts");
      log.dim("Example: 001_create_indexes.ts");
      return 0;
    }

    log.info(`Found ${migrations.length} migration(s)`);
    log.newline();

    // Show status
    if (status) {
      return await showMigrationStatus(getMigrationStatus, migrations);
    }

    // Reset migration history
    if (reset) {
      if (dryRun) {
        log.warn("[DRY-RUN] Would reset migration history");
        return 0;
      }

      log.warn("Resetting migration history...");
      log.warn("This does NOT revert migrations, only removes the history records.");

      const count = await resetMigrationHistory();
      log.success(`Reset ${count} migration record(s)`);
      return 0;
    }

    // Create logger for migration runner
    const migrationLogger = {
      info: (msg: string) => log.info(msg),
      warn: (msg: string) => log.warn(msg),
      error: (msg: string) => log.error(msg),
      debug: (msg: string) => log.dim(msg),
    };

    // Run migrations
    log.section(down ? "Rolling Back Migrations" : "Running Migrations");

    const result = await runMigrations(
      migrations,
      {
        dryRun,
        direction: down ? "down" : "up",
        target,
        force,
      },
      migrationLogger
    );

    // Show results
    log.newline();
    log.section("Summary");

    if (result.applied.length > 0) {
      log.success(`${down ? "Reverted" : "Applied"}: ${result.applied.length}`);
      for (const id of result.applied) {
        log.dim(`  • ${id}`);
      }
    }

    if (result.skipped.length > 0) {
      log.info(`Skipped: ${result.skipped.length}`);
      for (const id of result.skipped) {
        log.dim(`  • ${id}`);
      }
    }

    if (result.failed.length > 0) {
      log.error(`Failed: ${result.failed.length}`);
      for (const { id, error } of result.failed) {
        log.dim(`  • ${id}: ${error}`);
      }
      return 1;
    }

    log.newline();
    log.info(`Completed in ${result.durationMs}ms`);

    return 0;
  } catch (error) {
    log.error(`Failed: ${(error as Error).message}`);
    return 1;
  }
}

/**
 * Load migrations from the migrations directory
 */
async function loadMigrations(
  migrationsPath: string
): Promise<Array<import("@unisane/kernel").Migration>> {
  const { existsSync, readdirSync } = await import("node:fs");
  const { join, resolve } = await import("node:path");
  const { pathToFileURL } = await import("node:url");

  const absolutePath = resolve(process.cwd(), migrationsPath);

  if (!existsSync(absolutePath)) {
    return [];
  }

  const files = readdirSync(absolutePath);
  const migrationFiles = files
    .filter((f) => /^\d{3}_[a-z0-9_]+\.(ts|js)$/.test(f))
    .sort();

  const migrations: Array<import("@unisane/kernel").Migration> = [];

  for (const file of migrationFiles) {
    try {
      const filePath = join(absolutePath, file);
      const fileUrl = pathToFileURL(filePath).href;

      // Dynamic import the migration file
      const mod = await import(fileUrl);

      // Support both default export and named 'migration' export
      const migration = mod.default ?? mod.migration;

      if (!migration || typeof migration.up !== "function") {
        log.warn(`Skipping ${file}: missing 'up' function`);
        continue;
      }

      // Ensure ID matches filename
      const expectedId = file.replace(/\.(ts|js)$/, "");
      if (migration.id !== expectedId) {
        log.warn(
          `Migration ${file} has ID '${migration.id}' but expected '${expectedId}'`
        );
      }

      migrations.push(migration);
    } catch (error) {
      log.warn(`Failed to load ${file}: ${(error as Error).message}`);
    }
  }

  return migrations;
}

/**
 * Show migration status
 */
async function showMigrationStatus(
  getMigrationStatus: (
    migrations: Array<import("@unisane/kernel").Migration>
  ) => Promise<Array<import("@unisane/kernel").MigrationStatus>>,
  migrations: Array<import("@unisane/kernel").Migration>
): Promise<number> {
  log.section("Migration Status");

  const statuses = await getMigrationStatus(migrations);

  if (statuses.length === 0) {
    log.warn("No migrations found");
    return 0;
  }

  let applied = 0;
  let pending = 0;

  for (const status of statuses) {
    const icon = status.applied ? "✓" : "○";
    const dateStr = status.appliedAt
      ? ` (${status.appliedAt.toISOString().split("T")[0]})`
      : "";
    const downStr = status.hasDown ? "" : " [no rollback]";

    if (status.applied) {
      log.success(`${icon} ${status.id}${dateStr}${downStr}`);
      applied++;
    } else {
      log.dim(`${icon} ${status.id} - ${status.description}${downStr}`);
      pending++;
    }
  }

  log.newline();
  log.info(`Applied: ${applied}, Pending: ${pending}`);

  return 0;
}
