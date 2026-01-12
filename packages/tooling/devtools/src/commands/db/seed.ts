/**
 * db:seed command - Seed database with demo data
 *
 * Usage:
 *   unisane db seed                      Run with default config
 *   unisane db seed --config path.json   Run with custom config
 *   unisane db seed --reset              Reset database before seeding
 *   unisane db seed --dry-run            Preview changes
 *   unisane db seed --generate           Create default config file
 *
 * Examples:
 *   unisane db seed
 *   unisane db seed --config ./seed.data.json
 *   unisane db seed --reset --dry-run
 */

import { log } from "@unisane/cli-core";
import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export interface DbSeedOptions {
  /** Path to seed configuration file */
  config?: string;
  /** Reset database before seeding */
  reset?: boolean;
  /** Preview changes without applying */
  dryRun?: boolean;
  /** Generate default config file */
  generate?: boolean;
  /** Only run specific seeders */
  only?: string[];
}

/**
 * Default seed config file path
 */
const DEFAULT_CONFIG_PATH = "./seed.data.json";

/**
 * Main seed command handler
 */
export async function dbSeed(options: DbSeedOptions = {}): Promise<number> {
  const {
    config,
    reset = false,
    dryRun = false,
    generate = false,
    only,
  } = options;

  try {
    // Handle --generate flag: create default config file
    if (generate) {
      return await generateDefaultConfig();
    }

    const { connectDb, runSeed, getDefaultSeedConfig } = await import(
      "@unisane/kernel"
    );

    // Determine config path
    const configPath = config ?? DEFAULT_CONFIG_PATH;
    const absoluteConfigPath = resolve(process.cwd(), configPath);

    // Check if config file exists
    if (!existsSync(absoluteConfigPath)) {
      log.warn(`Config file not found: ${configPath}`);
      log.info("Using default seed configuration");
      log.dim(
        "Run `unisane db seed --generate` to create a customizable config file"
      );
      log.newline();
    }

    // Connect to database
    log.info("Connecting to database...");
    await connectDb();
    log.success("Connected");
    log.newline();

    // Get password hashing function
    const hashPassword = await getPasswordHasher();

    // Create logger
    const seedLogger = {
      info: (msg: string) => log.info(msg),
      warn: (msg: string) => log.warn(msg),
      error: (msg: string) => log.error(msg),
      success: (msg: string) => log.success(msg),
    };

    // Parse 'only' option
    const onlyArray = only
      ? (only as Array<
          | "tenants"
          | "users"
          | "memberships"
          | "apiKeys"
          | "subscriptions"
          | "flagOverrides"
          | "generate"
        >)
      : undefined;

    // Run seed
    log.section(dryRun ? "Previewing Seed Data" : "Seeding Database");

    if (reset && !dryRun) {
      log.warn("Database will be reset before seeding");
    }

    const result = await runSeed(
      {
        configPath: existsSync(absoluteConfigPath)
          ? absoluteConfigPath
          : undefined,
        reset,
        dryRun,
        only: onlyArray,
      },
      {
        hashPassword,
        generateApiKey: createApiKeyGenerator(),
        logger: seedLogger,
      }
    );

    // Show results
    log.newline();
    log.section("Summary");

    const stats = [
      ["Tenants", result.tenantsCreated],
      ["Users", result.usersCreated],
      ["Memberships", result.membershipsCreated],
      ["API Keys", result.apiKeysCreated],
      ["Subscriptions", result.subscriptionsCreated],
      ["Flag Overrides", result.flagOverridesCreated],
    ];

    for (const [label, count] of stats) {
      if (count > 0) {
        log.kv(label as string, String(count));
      }
    }

    if (result.errors.length > 0) {
      log.newline();
      log.error(`Errors: ${result.errors.length}`);
      for (const { type, message } of result.errors) {
        log.dim(`  • [${type}] ${message}`);
      }
    }

    log.newline();
    log.info(`Completed in ${result.durationMs}ms`);

    return result.errors.length > 0 ? 1 : 0;
  } catch (error) {
    log.error(`Failed: ${(error as Error).message}`);
    return 1;
  }
}

/**
 * Generate default config file
 */
async function generateDefaultConfig(): Promise<number> {
  const { getDefaultSeedConfig } = await import("@unisane/kernel");
  const configPath = resolve(process.cwd(), DEFAULT_CONFIG_PATH);

  if (existsSync(configPath)) {
    log.error(`Config file already exists: ${DEFAULT_CONFIG_PATH}`);
    log.info("Delete it first or use a different path with --config");
    return 1;
  }

  const defaultConfig = getDefaultSeedConfig();
  const content = JSON.stringify(defaultConfig, null, 2);

  writeFileSync(configPath, content, "utf-8");
  log.success(`Created ${DEFAULT_CONFIG_PATH}`);
  log.info("Edit this file to customize seed data");
  log.newline();
  log.dim("Available sections:");
  log.dim("  • tenants - Organizations/companies");
  log.dim("  • users - User accounts");
  log.dim("  • memberships - User-tenant relationships");
  log.dim("  • apiKeys - API keys for tenants");
  log.dim("  • subscriptions - Billing subscriptions");
  log.dim("  • flagOverrides - Feature flag overrides");
  log.dim("  • generate - Synthetic data generation config");

  return 0;
}

/**
 * Get password hashing function
 *
 * Tries to use scrypt from auth module, falls back to a simple hash
 */
async function getPasswordHasher(): Promise<(password: string) => Promise<string>> {
  try {
    // Try to import from auth module
    const { scryptHashPassword } = await import("@unisane/auth");
    return scryptHashPassword;
  } catch {
    // Fallback: use Node.js crypto scrypt directly
    const { scrypt, randomBytes } = await import("node:crypto");
    const { promisify } = await import("node:util");
    const scryptAsync = promisify(scrypt);

    return async (password: string): Promise<string> => {
      const salt = randomBytes(16).toString("hex");
      const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
      return `${salt}:${derivedKey.toString("hex")}`;
    };
  }
}

/**
 * Create API key generator
 */
function createApiKeyGenerator(): () => { key: string; hash: string } {
  const { randomBytes, createHash } = require("node:crypto") as typeof import("node:crypto");

  return () => {
    // Generate a random 32-byte key, encode as base64url
    const keyBytes = randomBytes(32);
    const key = keyBytes
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    // Hash the key for storage
    const hash = createHash("sha256").update(key).digest("hex");

    return { key: `usk_${key}`, hash };
  };
}
