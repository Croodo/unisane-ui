/**
 * Seed Data Runner
 *
 * Executes seed data configuration to populate the database with demo/test data.
 *
 * @module database/seed/runner
 */

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { ObjectId } from "mongodb";
import { col, db } from "../connection";
import { COLLECTIONS } from "../collections";
import type {
  SeedConfig,
  SeedRunOptions,
  SeedRunResult,
  SeedProviders,
  SeedLogger,
  SeedTenant,
  SeedUser,
  SeedMembership,
} from "./types";

/**
 * Default logger
 */
const defaultLogger: SeedLogger = {
  info: (msg) => console.log(`[seed] ${msg}`),
  warn: (msg) => console.warn(`[seed] ⚠️  ${msg}`),
  error: (msg) => console.error(`[seed] ❌ ${msg}`),
  success: (msg) => console.log(`[seed] ✓ ${msg}`),
};

/**
 * Generate a random slug-safe string
 */
function randomSlug(prefix: string, length: number = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";
  for (let i = 0; i < length; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${suffix}`;
}

/**
 * Generate synthetic tenant data
 */
function generateTenants(count: number): SeedTenant[] {
  const tenants: SeedTenant[] = [];
  const plans = ["free", "pro", "business"];

  for (let i = 0; i < count; i++) {
    const num = i + 1;
    tenants.push({
      slug: randomSlug("tenant"),
      name: `Test Tenant ${num}`,
      planId: plans[i % plans.length],
    });
  }

  return tenants;
}

/**
 * Generate synthetic user data
 */
function generateUsers(count: number, tenantSlug: string): SeedUser[] {
  const users: SeedUser[] = [];

  for (let i = 0; i < count; i++) {
    const num = i + 1;
    users.push({
      email: `user${num}@${tenantSlug}.test`,
      displayName: `User ${num}`,
      password: "testpassword123",
      globalRole: i === 0 ? "admin" : "user",
    });
  }

  return users;
}

/**
 * Generate memberships for users in a tenant
 */
function generateMemberships(
  tenantSlug: string,
  users: SeedUser[]
): SeedMembership[] {
  return users.map((user, index) => ({
    tenant: tenantSlug,
    email: user.email,
    roles: index === 0 ? ["owner", "admin"] : ["member"],
  }));
}

/**
 * Load seed configuration from a JSON file
 */
export async function loadSeedConfig(configPath: string): Promise<SeedConfig> {
  if (!existsSync(configPath)) {
    throw new Error(`Seed config file not found: ${configPath}`);
  }

  const content = await readFile(configPath, "utf-8");
  try {
    return JSON.parse(content) as SeedConfig;
  } catch (error) {
    throw new Error(
      `Failed to parse seed config: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Run seed data population
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
 *   hashPassword: async (pw) => scrypt(pw),
 * });
 * ```
 */
export async function runSeed(
  options: SeedRunOptions,
  providers: SeedProviders
): Promise<SeedRunResult> {
  const startTime = Date.now();
  const log = providers.logger ?? defaultLogger;
  const { configPath, reset = false, only, dryRun = false } = options;

  const result: SeedRunResult = {
    tenantsCreated: 0,
    usersCreated: 0,
    membershipsCreated: 0,
    apiKeysCreated: 0,
    subscriptionsCreated: 0,
    flagOverridesCreated: 0,
    durationMs: 0,
    dryRun,
    errors: [],
  };

  log.info(`Starting seed run (dryRun: ${dryRun})`);

  // Load config
  let config: SeedConfig = {};
  if (configPath) {
    log.info(`Loading config from ${configPath}`);
    config = await loadSeedConfig(configPath);
  }

  // Expand generate config into concrete data
  if (config.generate && (!only || only.includes("generate"))) {
    const { tenants: tenantCount = 0, usersPerTenant = 0 } = config.generate;

    if (tenantCount > 0) {
      log.info(`Generating ${tenantCount} synthetic tenants...`);
      const generatedTenants = generateTenants(tenantCount);
      config.tenants = [...(config.tenants ?? []), ...generatedTenants];

      if (usersPerTenant > 0) {
        for (const tenant of generatedTenants) {
          const users = generateUsers(usersPerTenant, tenant.slug);
          config.users = [...(config.users ?? []), ...users];
          config.memberships = [
            ...(config.memberships ?? []),
            ...generateMemberships(tenant.slug, users),
          ];
        }
      }
    }
  }

  // Reset database if requested
  if (reset && !dryRun) {
    log.warn("Resetting database collections...");
    const collections = [
      COLLECTIONS.TENANTS,
      COLLECTIONS.USERS,
      COLLECTIONS.AUTH_CREDENTIALS,
      COLLECTIONS.MEMBERSHIPS,
      COLLECTIONS.API_KEYS,
      COLLECTIONS.SUBSCRIPTIONS,
      COLLECTIONS.FLAG_OVERRIDES,
    ];
    for (const colName of collections) {
      try {
        await db().dropCollection(colName);
        log.info(`Dropped ${colName}`);
      } catch {
        // Collection may not exist
      }
    }
  }

  // Maps for lookups
  const tenantIdBySlug = new Map<string, string>();
  const userIdByEmail = new Map<string, string>();

  // Seed tenants
  if (config.tenants && (!only || only.includes("tenants"))) {
    log.info(`Seeding ${config.tenants.length} tenants...`);
    const tenantsCol = col(COLLECTIONS.TENANTS);

    for (const tenant of config.tenants) {
      try {
        if (dryRun) {
          log.info(`[DRY-RUN] Would create tenant: ${tenant.slug}`);
          result.tenantsCreated++;
          continue;
        }

        const existingTenant = await tenantsCol.findOne({ slug: tenant.slug });
        if (existingTenant) {
          tenantIdBySlug.set(tenant.slug, existingTenant._id.toString());
          log.info(`Tenant ${tenant.slug} already exists, skipping`);
          continue;
        }

        const now = new Date();
        const tenantId = new ObjectId();
        await tenantsCol.insertOne({
          _id: tenantId,
          slug: tenant.slug,
          name: tenant.name,
          planId: tenant.planId ?? "free",
          stripeCustomerId: tenant.stripeCustomerId ?? null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        });

        tenantIdBySlug.set(tenant.slug, tenantId.toString());
        result.tenantsCreated++;
        log.success(`Created tenant: ${tenant.slug}`);
      } catch (error) {
        result.errors.push({
          type: "tenant",
          message: `Failed to create tenant ${tenant.slug}: ${error instanceof Error ? error.message : String(error)}`,
        });
        log.error(`Failed to create tenant ${tenant.slug}`);
      }
    }
  }

  // Seed users
  if (config.users && (!only || only.includes("users"))) {
    log.info(`Seeding ${config.users.length} users...`);
    const usersCol = col(COLLECTIONS.USERS);
    const credsCol = col(COLLECTIONS.AUTH_CREDENTIALS);

    for (const user of config.users) {
      try {
        if (dryRun) {
          log.info(`[DRY-RUN] Would create user: ${user.email}`);
          result.usersCreated++;
          continue;
        }

        const existingUser = await usersCol.findOne({ email: user.email });
        if (existingUser) {
          userIdByEmail.set(user.email, existingUser._id.toString());
          log.info(`User ${user.email} already exists, skipping`);
          continue;
        }

        const now = new Date();
        const userId = new ObjectId();

        // Create user
        await usersCol.insertOne({
          _id: userId,
          email: user.email,
          displayName: user.displayName,
          globalRole: user.globalRole ?? "user",
          avatarUrl: user.avatarUrl ?? null,
          phone: user.phone ?? null,
          emailVerifiedAt: now, // Auto-verify seed users
          createdAt: now,
          updatedAt: now,
        });

        // Create auth credentials
        const passwordHash = await providers.hashPassword(user.password);
        const emailNorm = user.email.toLowerCase().trim();

        await credsCol.insertOne({
          _id: new ObjectId(),
          userId: userId.toString(),
          emailNorm,
          passwordHash,
          createdAt: now,
          updatedAt: now,
        });

        userIdByEmail.set(user.email, userId.toString());
        result.usersCreated++;
        log.success(`Created user: ${user.email}`);
      } catch (error) {
        result.errors.push({
          type: "user",
          message: `Failed to create user ${user.email}: ${error instanceof Error ? error.message : String(error)}`,
        });
        log.error(`Failed to create user ${user.email}`);
      }
    }
  }

  // Seed memberships
  if (config.memberships && (!only || only.includes("memberships"))) {
    log.info(`Seeding ${config.memberships.length} memberships...`);
    const membershipsCol = col(COLLECTIONS.MEMBERSHIPS);

    for (const membership of config.memberships) {
      try {
        const tenantId = tenantIdBySlug.get(membership.tenant);
        const userId = userIdByEmail.get(membership.email);

        if (!tenantId) {
          log.warn(
            `Skipping membership: tenant ${membership.tenant} not found`
          );
          continue;
        }
        if (!userId) {
          log.warn(`Skipping membership: user ${membership.email} not found`);
          continue;
        }

        if (dryRun) {
          log.info(
            `[DRY-RUN] Would create membership: ${membership.email} in ${membership.tenant}`
          );
          result.membershipsCreated++;
          continue;
        }

        const existing = await membershipsCol.findOne({
          tenantId,
          userId,
          deletedAt: null,
        });
        if (existing) {
          log.info(
            `Membership for ${membership.email} in ${membership.tenant} already exists, skipping`
          );
          continue;
        }

        const now = new Date();
        await membershipsCol.insertOne({
          _id: new ObjectId(),
          tenantId,
          userId,
          roles: membership.roles,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        });

        result.membershipsCreated++;
        log.success(
          `Created membership: ${membership.email} in ${membership.tenant}`
        );
      } catch (error) {
        result.errors.push({
          type: "membership",
          message: `Failed to create membership for ${membership.email}: ${error instanceof Error ? error.message : String(error)}`,
        });
        log.error(`Failed to create membership for ${membership.email}`);
      }
    }
  }

  // Seed API keys
  if (
    config.apiKeys &&
    (!only || only.includes("apiKeys")) &&
    providers.generateApiKey
  ) {
    log.info(`Seeding ${config.apiKeys.length} API keys...`);
    const apiKeysCol = col(COLLECTIONS.API_KEYS);

    for (const apiKey of config.apiKeys) {
      try {
        const tenantId = tenantIdBySlug.get(apiKey.tenant);
        if (!tenantId) {
          log.warn(`Skipping API key: tenant ${apiKey.tenant} not found`);
          continue;
        }

        if (dryRun) {
          log.info(`[DRY-RUN] Would create API key: ${apiKey.name}`);
          result.apiKeysCreated++;
          continue;
        }

        const { key, hash } = providers.generateApiKey();
        const now = new Date();

        await apiKeysCol.insertOne({
          _id: new ObjectId(),
          tenantId,
          name: apiKey.name,
          keyHash: hash,
          scopes: apiKey.scopes ?? ["read", "write"],
          createdBy: apiKey.actorEmail
            ? (userIdByEmail.get(apiKey.actorEmail) ?? null)
            : null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          expiresAt: null,
          lastUsedAt: null,
        });

        result.apiKeysCreated++;
        log.success(`Created API key: ${apiKey.name} (key: ${key})`);
      } catch (error) {
        result.errors.push({
          type: "apiKey",
          message: `Failed to create API key ${apiKey.name}: ${error instanceof Error ? error.message : String(error)}`,
        });
        log.error(`Failed to create API key ${apiKey.name}`);
      }
    }
  }

  // Seed subscriptions
  if (config.subscriptions && (!only || only.includes("subscriptions"))) {
    log.info(`Seeding ${config.subscriptions.length} subscriptions...`);
    const subsCol = col(COLLECTIONS.SUBSCRIPTIONS);

    for (const sub of config.subscriptions) {
      try {
        const tenantId = tenantIdBySlug.get(sub.tenant);
        if (!tenantId) {
          log.warn(`Skipping subscription: tenant ${sub.tenant} not found`);
          continue;
        }

        if (dryRun) {
          log.info(
            `[DRY-RUN] Would create subscription for ${sub.tenant}: ${sub.planId}`
          );
          result.subscriptionsCreated++;
          continue;
        }

        const existing = await subsCol.findOne({ tenantId });
        if (existing) {
          log.info(
            `Subscription for ${sub.tenant} already exists, skipping`
          );
          continue;
        }

        const now = new Date();
        await subsCol.insertOne({
          _id: new ObjectId(),
          tenantId,
          planId: sub.planId,
          status: sub.status ?? "active",
          quantity: sub.quantity ?? 1,
          currentPeriodStart: now,
          currentPeriodEnd: new Date(
            now.getTime() + 30 * 24 * 60 * 60 * 1000
          ),
          createdAt: now,
          updatedAt: now,
        });

        result.subscriptionsCreated++;
        log.success(`Created subscription for ${sub.tenant}: ${sub.planId}`);
      } catch (error) {
        result.errors.push({
          type: "subscription",
          message: `Failed to create subscription for ${sub.tenant}: ${error instanceof Error ? error.message : String(error)}`,
        });
        log.error(`Failed to create subscription for ${sub.tenant}`);
      }
    }
  }

  // Seed flag overrides
  if (config.flagOverrides && (!only || only.includes("flagOverrides"))) {
    log.info(`Seeding ${config.flagOverrides.length} flag overrides...`);
    const overridesCol = col(COLLECTIONS.FLAG_OVERRIDES);

    for (const override of config.flagOverrides) {
      try {
        const tenantId = override.tenant
          ? tenantIdBySlug.get(override.tenant)
          : null;
        const userId = override.email
          ? userIdByEmail.get(override.email)
          : null;

        if (override.tenant && !tenantId) {
          log.warn(
            `Skipping flag override: tenant ${override.tenant} not found`
          );
          continue;
        }
        if (override.email && !userId) {
          log.warn(
            `Skipping flag override: user ${override.email} not found`
          );
          continue;
        }

        if (dryRun) {
          log.info(
            `[DRY-RUN] Would create flag override: ${override.flagKey}`
          );
          result.flagOverridesCreated++;
          continue;
        }

        const now = new Date();
        await overridesCol.insertOne({
          _id: new ObjectId(),
          flagKey: override.flagKey,
          tenantId: tenantId ?? null,
          userId: userId ?? null,
          value: override.value,
          createdAt: now,
          updatedAt: now,
        });

        result.flagOverridesCreated++;
        log.success(`Created flag override: ${override.flagKey}`);
      } catch (error) {
        result.errors.push({
          type: "flagOverride",
          message: `Failed to create flag override ${override.flagKey}: ${error instanceof Error ? error.message : String(error)}`,
        });
        log.error(`Failed to create flag override ${override.flagKey}`);
      }
    }
  }

  result.durationMs = Date.now() - startTime;

  log.info("─".repeat(50));
  log.info(`Seed run complete in ${result.durationMs}ms`);
  log.info(`  Tenants: ${result.tenantsCreated}`);
  log.info(`  Users: ${result.usersCreated}`);
  log.info(`  Memberships: ${result.membershipsCreated}`);
  log.info(`  API Keys: ${result.apiKeysCreated}`);
  log.info(`  Subscriptions: ${result.subscriptionsCreated}`);
  log.info(`  Flag Overrides: ${result.flagOverridesCreated}`);
  if (result.errors.length > 0) {
    log.warn(`  Errors: ${result.errors.length}`);
  }

  return result;
}

/**
 * Create a default seed configuration file
 */
export function getDefaultSeedConfig(): SeedConfig {
  return {
    tenants: [
      { slug: "acme", name: "ACME Corporation", planId: "pro" },
      { slug: "demo", name: "Demo Company", planId: "free" },
    ],
    users: [
      {
        email: "admin@acme.com",
        displayName: "Admin User",
        password: "admin123",
        globalRole: "admin",
      },
      {
        email: "user@acme.com",
        displayName: "Regular User",
        password: "user123",
        globalRole: "user",
      },
      {
        email: "demo@demo.com",
        displayName: "Demo User",
        password: "demo123",
        globalRole: "user",
      },
    ],
    memberships: [
      { tenant: "acme", email: "admin@acme.com", roles: ["owner", "admin"] },
      { tenant: "acme", email: "user@acme.com", roles: ["member"] },
      { tenant: "demo", email: "demo@demo.com", roles: ["owner"] },
    ],
    subscriptions: [
      { tenant: "acme", planId: "pro", status: "active" },
      { tenant: "demo", planId: "free", status: "active" },
    ],
  };
}
