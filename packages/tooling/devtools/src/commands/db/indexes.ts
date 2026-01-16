/**
 * db:indexes command - Create or list database indexes
 *
 * Usage:
 *   unisane db indexes           List all index definitions
 *   unisane db indexes --apply   Apply all indexes to database
 *   unisane db indexes --list    List existing indexes in database
 *   unisane db indexes --dry-run Preview changes without applying
 *
 * Examples:
 *   unisane db indexes
 *   unisane db indexes --apply
 *   unisane db indexes --list users
 */

import { log } from "@unisane/cli-core";

export interface DbIndexesOptions {
  /** Apply indexes to database */
  apply?: boolean;
  /** List existing indexes from database */
  list?: boolean;
  /** Only process specific collection */
  collection?: string;
  /** Preview changes without applying */
  dryRun?: boolean;
}

/**
 * Main indexes command handler
 */
export async function dbIndexes(options: DbIndexesOptions = {}): Promise<number> {
  const { apply = false, list = false, collection, dryRun = false } = options;

  try {
    const {
      connectDb,
      INDEX_DEFINITIONS,
      ensureIndexes,
      listIndexes,
      COLLECTIONS,
    } = await import("@unisane/kernel");

    // If just listing definitions (no --apply or --list)
    if (!apply && !list) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return showIndexDefinitions(INDEX_DEFINITIONS as any, collection);
    }

    // Connect to database
    log.info("Connecting to database...");
    await connectDb();
    log.success("Connected");
    log.newline();

    // List existing indexes from database
    if (list) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await showDatabaseIndexes(listIndexes as any, collection);
    }

    // Apply indexes
    if (apply) {
      if (dryRun) {
        log.warn("[DRY-RUN] Would apply the following indexes:");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return showIndexDefinitions(INDEX_DEFINITIONS as any, collection);
      }

      log.section("Applying Indexes");
      const startTime = Date.now();

      await ensureIndexes();

      const duration = Date.now() - startTime;
      log.success(`Indexes applied in ${duration}ms`);
      return 0;
    }

    return 0;
  } catch (error) {
    log.error(`Failed: ${(error as Error).message}`);
    return 1;
  }
}

/**
 * Show index definitions from code
 */
function showIndexDefinitions(
  definitions: Record<string, Array<{ name?: string; key: Record<string, unknown> }>>,
  filterCollection?: string
): number {
  log.section("Index Definitions");

  const collections = filterCollection
    ? { [filterCollection]: definitions[filterCollection] }
    : definitions;

  let totalIndexes = 0;

  for (const [colName, indexes] of Object.entries(collections)) {
    if (!indexes) {
      if (filterCollection) {
        log.warn(`Collection '${filterCollection}' not found in index definitions`);
      }
      continue;
    }

    log.kv("Collection", colName);

    for (const index of indexes) {
      const keyStr = Object.entries(index.key)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");

      log.dim(`  • ${index.name ?? "(unnamed)"}`);
      log.dim(`    { ${keyStr} }`);
      totalIndexes++;
    }

    log.newline();
  }

  log.info(`Total: ${Object.keys(collections).length} collections, ${totalIndexes} indexes`);
  return 0;
}

/**
 * Show existing indexes from database
 */
async function showDatabaseIndexes(
  listIndexes: (name: string) => Promise<Array<{ name: string; key: Record<string, unknown> }>>,
  filterCollection?: string
): Promise<number> {
  log.section("Database Indexes");

  const { COLLECTIONS } = await import("@unisane/kernel");
  const collectionNames = filterCollection
    ? [filterCollection]
    : Object.values(COLLECTIONS);

  let totalIndexes = 0;

  for (const colName of collectionNames) {
    try {
      const indexes = await listIndexes(colName);

      if (indexes.length === 0) {
        continue;
      }

      log.kv("Collection", colName);

      for (const index of indexes) {
        const keyStr = Object.entries(index.key)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");

        log.dim(`  • ${index.name}`);
        log.dim(`    { ${keyStr} }`);
        totalIndexes++;
      }

      log.newline();
    } catch {
      // Collection may not exist yet
      continue;
    }
  }

  if (totalIndexes === 0) {
    log.warn("No indexes found in database");
    if (!filterCollection) {
      log.info("Run `unisane db indexes --apply` to create indexes");
    }
  } else {
    log.info(`Total: ${totalIndexes} indexes found`);
  }

  return 0;
}
