/**
 * db:query command - Quick database query utility for debugging
 *
 * Usage:
 *   unisane db query <collection> [filterJson]
 *
 * Examples:
 *   unisane db query tenants
 *   unisane db query users '{"email":"admin@example.com"}'
 *   unisane db query subscriptions '{"status":"active"}'
 */

import { log } from '@unisane/cli-core';

export interface DbQueryOptions {
  limit?: number;
}

export async function dbQuery(
  collection: string,
  filterJson?: string,
  options: DbQueryOptions = {}
): Promise<number> {
  if (!collection || !collection.trim()) {
    log.error('Usage: unisane db query <collection> [filterJson]');
    log.dim('Example: unisane db query tenants \'{"slug":"acme"}\'');
    return 1;
  }

  const limit = options.limit ?? 50;

  try {
    // Dynamic import to avoid loading MongoDB when not needed
    const { connectDb, col } = await import('@unisane/kernel');

    await connectDb();

    let filter: Record<string, unknown> = {};
    if (filterJson && filterJson.trim()) {
      try {
        filter = JSON.parse(filterJson) as Record<string, unknown>;
      } catch (e) {
        log.error(`Invalid JSON for filter: ${(e as Error).message}`);
        return 1;
      }
    }

    log.info(`Querying ${collection} with filter: ${JSON.stringify(filter)}`);
    log.dim(`Limit: ${limit}`);
    log.newline();

    const cursor = col(collection).find(filter).limit(limit);
    const docs = await cursor.toArray();

    if (docs.length === 0) {
      log.warn('No documents found');
      return 0;
    }

    log.success(`Found ${docs.length} document(s)`);
    log.newline();
    console.log(JSON.stringify(docs, null, 2));

    return 0;
  } catch (error) {
    log.error(`Query failed: ${(error as Error).message}`);
    return 1;
  }
}
