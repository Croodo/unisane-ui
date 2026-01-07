import { getDbProvider } from "../provider";
import type { DbProvider } from "../provider";

// Centralize repo adapter selection. Always provide a 'mongo' adapter; others are optional.
export function selectRepo<T>(
  adapters: Partial<Record<DbProvider, T>> & { mongo: T }
): T {
  const db = getDbProvider();
  return adapters[db] ?? adapters.mongo;
}
