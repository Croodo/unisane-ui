/**
 * Centralized Collection Names
 *
 * Single source of truth for all MongoDB collection names used in the system.
 * Import from @unisane/kernel and use these constants instead of string literals.
 *
 * @example
 * ```typescript
 * import { COLLECTIONS, col } from '@unisane/kernel';
 *
 * const usersCol = () => col<UserDoc>(COLLECTIONS.USERS);
 * ```
 *
 * @module database/collections
 */

/**
 * All collection names in the system.
 * Grouped by module for easier navigation.
 */
export const COLLECTIONS = {
  // ─────────────────────────────────────────────────────────────────────────
  // Auth Module
  // ─────────────────────────────────────────────────────────────────────────
  AUTH_CREDENTIALS: "auth_credentials",

  // ─────────────────────────────────────────────────────────────────────────
  // Identity Module
  // ─────────────────────────────────────────────────────────────────────────
  USERS: "users",
  MEMBERSHIPS: "memberships",
  API_KEYS: "api_keys",

  // ─────────────────────────────────────────────────────────────────────────
  // Tenants Module
  // ─────────────────────────────────────────────────────────────────────────
  TENANTS: "tenants",

  // ─────────────────────────────────────────────────────────────────────────
  // Billing Module
  // ─────────────────────────────────────────────────────────────────────────
  SUBSCRIPTIONS: "subscriptions",
  PAYMENTS: "payments",
  INVOICES: "invoices",
  ORDERS: "orders",
  TENANT_INTEGRATIONS: "tenant_integrations",

  // ─────────────────────────────────────────────────────────────────────────
  // Credits Module
  // ─────────────────────────────────────────────────────────────────────────
  CREDIT_LEDGER: "credit_ledger",

  // ─────────────────────────────────────────────────────────────────────────
  // Flags Module
  // ─────────────────────────────────────────────────────────────────────────
  FEATURE_FLAGS: "feature_flags",
  FLAG_OVERRIDES: "feature_flag_overrides",
  FLAG_EXPOSURES: "feature_flag_exposures",

  // ─────────────────────────────────────────────────────────────────────────
  // Settings Module
  // ─────────────────────────────────────────────────────────────────────────
  SETTINGS: "settings",

  // ─────────────────────────────────────────────────────────────────────────
  // Storage Module
  // ─────────────────────────────────────────────────────────────────────────
  FILES: "storage_files",

  // ─────────────────────────────────────────────────────────────────────────
  // Audit Module
  // ─────────────────────────────────────────────────────────────────────────
  AUDIT_LOGS: "audit_logs",

  // ─────────────────────────────────────────────────────────────────────────
  // Notify Module
  // ─────────────────────────────────────────────────────────────────────────
  INAPP_NOTIFICATIONS: "inapp_notifications",
  INAPP_RECEIPTS: "inapp_receipts",
  EMAIL_SUPPRESSIONS: "email_suppressions",

  // ─────────────────────────────────────────────────────────────────────────
  // Usage Module
  // ─────────────────────────────────────────────────────────────────────────
  USAGE_SAMPLES: "usage_samples",

  // ─────────────────────────────────────────────────────────────────────────
  // Webhooks Module
  // ─────────────────────────────────────────────────────────────────────────
  WEBHOOKS: "webhooks",
  WEBHOOK_EVENTS: "webhook_events",

  // ─────────────────────────────────────────────────────────────────────────
  // Import/Export (PRO)
  // ─────────────────────────────────────────────────────────────────────────
  EXPORT_JOBS: "export_jobs",
  IMPORT_JOBS: "import_jobs",

  // ─────────────────────────────────────────────────────────────────────────
  // System / Kernel
  // ─────────────────────────────────────────────────────────────────────────
  OUTBOX: "_outbox",
  /** BOOT-006 FIX: Separate collection for domain events outbox */
  EVENTS_OUTBOX: "_events_outbox",
  DEAD_LETTER: "_dead_letter",
  MIGRATIONS: "_migrations",
} as const;

/**
 * Type representing all valid collection names.
 * Use this to type-check collection name parameters.
 */
export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/**
 * Get all collection names as an array (useful for iteration).
 */
export function getAllCollectionNames(): CollectionName[] {
  return Object.values(COLLECTIONS);
}

/**
 * Check if a string is a valid collection name.
 */
export function isValidCollectionName(name: string): name is CollectionName {
  return (Object.values(COLLECTIONS) as string[]).includes(name);
}
