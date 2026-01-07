// Central DB provider switch — default is 'mongo'.
// In the future, introduce env/config to choose additional providers.

import { getEnv } from '../env';
import { DEFAULT_DB_PROVIDER } from '../constants/db';
import type { DbProvider } from '../constants/db';

// Single decision point for DB provider. Keep Mongo as the default.
// Reads an optional DB_PROVIDER env for future switching.
export function getDbProvider(): DbProvider {
  const env = getEnv();
  return env.DB_PROVIDER ?? DEFAULT_DB_PROVIDER;
}

export type { DbProvider };
