/**
 * Database Seed System
 *
 * Provides tools for populating the database with demo/test data.
 *
 * @module database/seed
 *
 * @example
 * ```typescript
 * import { runSeed, connectDb } from '@unisane/kernel';
 *
 * await connectDb();
 *
 * const result = await runSeed({
 *   configPath: './seed.data.json',
 * }, {
 *   hashPassword: async (pw) => scryptHash(pw),
 * });
 * ```
 */

export type {
  SeedConfig,
  SeedTenant,
  SeedUser,
  SeedMembership,
  SeedApiKey,
  SeedSubscription,
  SeedFlagOverride,
  SeedGenerateConfig,
  SeedLogger,
  SeedRunOptions,
  SeedRunResult,
  SeedProviders,
} from "./types";

export { runSeed, loadSeedConfig, getDefaultSeedConfig } from "./runner";
