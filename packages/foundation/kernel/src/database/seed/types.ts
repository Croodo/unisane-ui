/**
 * Seed Data System Types
 *
 * Type definitions for the database seeding system.
 *
 * @module database/seed/types
 */

/**
 * Seed data configuration schema
 *
 * JSON configuration file format for seed data.
 *
 * @example
 * ```json
 * {
 *   "tenants": [
 *     { "slug": "acme", "name": "ACME Corp", "planId": "pro" }
 *   ],
 *   "users": [
 *     { "email": "admin@acme.com", "displayName": "Admin", "password": "test123" }
 *   ],
 *   "generate": {
 *     "tenants": 5,
 *     "usersPerTenant": 3
 *   }
 * }
 * ```
 */
export interface SeedConfig {
  /** Tenant data to seed */
  tenants?: SeedTenant[];
  /** User data to seed */
  users?: SeedUser[];
  /** Membership relationships */
  memberships?: SeedMembership[];
  /** API keys to create */
  apiKeys?: SeedApiKey[];
  /** Subscription data */
  subscriptions?: SeedSubscription[];
  /** Feature flag overrides */
  flagOverrides?: SeedFlagOverride[];
  /** Synthetic data generation settings */
  generate?: SeedGenerateConfig;
}

/**
 * Tenant seed data
 */
export interface SeedTenant {
  /** Unique slug identifier */
  slug: string;
  /** Display name */
  name: string;
  /** Plan ID */
  planId?: string;
  /** Stripe customer ID (if existing) */
  stripeCustomerId?: string;
}

/**
 * User seed data
 */
export interface SeedUser {
  /** Email address */
  email: string;
  /** Display name */
  displayName: string;
  /** Plain-text password (will be hashed) */
  password: string;
  /** Global role (admin, support, user) */
  globalRole?: "admin" | "support" | "user";
  /** Avatar URL */
  avatarUrl?: string;
  /** Phone number */
  phone?: string;
}

/**
 * Membership seed data (links users to tenants)
 */
export interface SeedMembership {
  /** Tenant slug */
  tenant: string;
  /** User email */
  email: string;
  /** Roles within the tenant */
  roles: string[];
}

/**
 * API key seed data
 */
export interface SeedApiKey {
  /** Tenant slug */
  tenant: string;
  /** Key name */
  name: string;
  /** Scopes for the key */
  scopes?: string[];
  /** Email of user who created the key */
  actorEmail?: string;
}

/**
 * Subscription seed data
 */
export interface SeedSubscription {
  /** Tenant slug */
  tenant: string;
  /** Plan ID */
  planId: string;
  /** Status */
  status?: "active" | "past_due" | "canceled" | "trialing";
  /** Quantity */
  quantity?: number;
}

/**
 * Feature flag override seed data
 */
export interface SeedFlagOverride {
  /** Flag key */
  flagKey: string;
  /** Tenant slug (for tenant-level override) */
  tenant?: string;
  /** User email (for user-level override) */
  email?: string;
  /** Override value */
  value: boolean | string | number;
}

/**
 * Synthetic data generation config
 */
export interface SeedGenerateConfig {
  /** Number of random tenants to generate */
  tenants?: number;
  /** Number of users per tenant */
  usersPerTenant?: number;
  /** Number of invoices per tenant */
  invoicesPerTenant?: number;
  /** Number of audit logs per tenant */
  auditLogsPerTenant?: number;
}

/**
 * Logger interface for seed output
 */
export interface SeedLogger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  success: (message: string) => void;
}

/**
 * Seed run options
 */
export interface SeedRunOptions {
  /** Config file path */
  configPath?: string;
  /** Reset database before seeding */
  reset?: boolean;
  /** Only run specific seeders */
  only?: Array<"tenants" | "users" | "memberships" | "apiKeys" | "subscriptions" | "flagOverrides" | "generate">;
  /** Dry run - preview changes */
  dryRun?: boolean;
}

/**
 * Seed run result
 */
export interface SeedRunResult {
  /** Number of tenants created */
  tenantsCreated: number;
  /** Number of users created */
  usersCreated: number;
  /** Number of memberships created */
  membershipsCreated: number;
  /** Number of API keys created */
  apiKeysCreated: number;
  /** Number of subscriptions created */
  subscriptionsCreated: number;
  /** Number of flag overrides created */
  flagOverridesCreated: number;
  /** Duration in milliseconds */
  durationMs: number;
  /** Whether this was a dry run */
  dryRun: boolean;
  /** Errors that occurred */
  errors: Array<{ type: string; message: string }>;
}

/**
 * Provider functions for seeding
 * These are injected by the application to avoid circular dependencies
 */
export interface SeedProviders {
  /** Hash a password */
  hashPassword: (password: string) => Promise<string>;
  /** Generate an API key */
  generateApiKey?: () => { key: string; hash: string };
  /** Custom logger */
  logger?: SeedLogger;
}
