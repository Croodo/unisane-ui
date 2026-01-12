/**
 * db:rename command - Rename MongoDB collections
 *
 * Usage:
 *   unisane db rename <from> <to>
 *   unisane db rename --apply-migrations
 *
 * Examples:
 *   unisane db rename apikeys api_keys
 *   unisane db rename --apply-migrations  # Apply all pending collection renames
 */

import { log } from '@unisane/cli-core';

/**
 * Known collection renames (old -> new).
 * Add new entries here when standardizing collection names.
 */
const KNOWN_RENAMES: Array<{ from: string; to: string; description: string }> = [
  { from: 'authcredentials', to: 'auth_credentials', description: 'Auth credentials (snake_case)' },
  { from: 'apikeys', to: 'api_keys', description: 'API keys (snake_case)' },
  { from: 'tenantintegrations', to: 'tenant_integrations', description: 'Tenant integrations (snake_case)' },
  { from: 'settings_kv', to: 'settings', description: 'Settings (simplified name)' },
];

export interface DbRenameOptions {
  applyMigrations?: boolean;
  dryRun?: boolean;
}

export async function dbRename(
  from?: string,
  to?: string,
  options: DbRenameOptions = {}
): Promise<number> {
  const { applyMigrations, dryRun } = options;

  // Apply all known migrations
  if (applyMigrations) {
    return applyKnownRenames(dryRun);
  }

  // Manual rename
  if (!from || !to) {
    log.error('Usage: unisane db rename <from> <to>');
    log.dim('Or: unisane db rename --apply-migrations');
    return 1;
  }

  return renameCollection(from, to, dryRun);
}

async function applyKnownRenames(dryRun?: boolean): Promise<number> {
  log.section('Collection Renames');

  if (KNOWN_RENAMES.length === 0) {
    log.success('No pending collection renames');
    return 0;
  }

  try {
    const { connectDb, db } = await import('@unisane/kernel');
    await connectDb();

    const database = db();
    const existingCollections = await database.listCollections().toArray();
    const existingNames = new Set(existingCollections.map((c) => c.name));

    log.info(`Found ${existingNames.size} existing collections`);
    log.newline();

    let applied = 0;
    let skipped = 0;

    for (const { from, to, description } of KNOWN_RENAMES) {
      log.dim(`${description}`);

      if (!existingNames.has(from)) {
        log.kv('  SKIP', `'${from}' does not exist`);
        skipped++;
        continue;
      }

      if (existingNames.has(to)) {
        log.kv('  SKIP', `'${to}' already exists`);
        skipped++;
        continue;
      }

      if (dryRun) {
        log.kv('  DRY-RUN', `Would rename '${from}' -> '${to}'`);
        applied++;
        continue;
      }

      try {
        await database.collection(from).rename(to);
        log.kv('  OK', `'${from}' -> '${to}'`);
        applied++;
      } catch (error) {
        log.kv('  ERROR', `Failed: ${(error as Error).message}`);
      }
    }

    log.newline();
    if (dryRun) {
      log.info(`Dry run: ${applied} rename(s) would be applied, ${skipped} skipped`);
    } else {
      log.success(`Applied ${applied} rename(s), ${skipped} skipped`);
    }

    return 0;
  } catch (error) {
    log.error(`Failed to connect: ${(error as Error).message}`);
    return 1;
  }
}

async function renameCollection(from: string, to: string, dryRun?: boolean): Promise<number> {
  log.section('Rename Collection');

  try {
    const { connectDb, db } = await import('@unisane/kernel');
    await connectDb();

    const database = db();
    const existingCollections = await database.listCollections().toArray();
    const existingNames = new Set(existingCollections.map((c) => c.name));

    if (!existingNames.has(from)) {
      log.error(`Collection '${from}' does not exist`);
      return 1;
    }

    if (existingNames.has(to)) {
      log.error(`Collection '${to}' already exists`);
      return 1;
    }

    if (dryRun) {
      log.info(`Dry run: Would rename '${from}' -> '${to}'`);
      return 0;
    }

    await database.collection(from).rename(to);
    log.success(`Renamed '${from}' -> '${to}'`);

    return 0;
  } catch (error) {
    log.error(`Rename failed: ${(error as Error).message}`);
    return 1;
  }
}

/**
 * List all collections in the database
 */
export async function dbListCollections(): Promise<number> {
  log.section('Collections');

  try {
    const { connectDb, db } = await import('@unisane/kernel');
    await connectDb();

    const database = db();
    const collections = await database.listCollections().toArray();
    const names = collections.map((c) => c.name).sort();

    log.info(`Found ${names.length} collection(s)`);
    log.newline();

    for (const name of names) {
      console.log(`  ${name}`);
    }

    return 0;
  } catch (error) {
    log.error(`Failed: ${(error as Error).message}`);
    return 1;
  }
}
