import { z } from 'zod';

// Database providers
export const DB_PROVIDERS = ['mongo', 'mysql'] as const;
export type DbProvider = (typeof DB_PROVIDERS)[number];
export const ZDbProvider = z.enum(DB_PROVIDERS);
export const DEFAULT_DB_PROVIDER: DbProvider = 'mongo';
