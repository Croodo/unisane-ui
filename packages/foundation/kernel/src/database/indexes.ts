/**
 * MongoDB Index Definitions
 *
 * Run `ensureIndexes()` during application startup to create indexes.
 * Indexes are created with { background: true } so they don't block operations.
 *
 * @module database/indexes
 */
import type { IndexDescription } from "mongodb";
import { db } from "./connection";
import { logger } from "../observability/logger";
import { COLLECTIONS } from "./collections";

/**
 * Index definitions by collection.
 * Uses COLLECTIONS constants for consistency with repository code.
 */
export const INDEX_DEFINITIONS: Record<string, IndexDescription[]> = {
  // ─────────────────────────────────────────────────────────────────────────
  // Auth Module
  // ─────────────────────────────────────────────────────────────────────────
  [COLLECTIONS.AUTH_CREDENTIALS]: [
    { key: { emailNorm: 1 }, unique: true, name: "authcred_email_unique" },
    { key: { userId: 1 }, name: "authcred_user" },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // Identity Module
  // ─────────────────────────────────────────────────────────────────────────
  [COLLECTIONS.USERS]: [
    { key: { email: 1 }, unique: true, sparse: true, name: "users_email_unique" },
    { key: { authUserId: 1 }, name: "users_authUserId" },
    { key: { username: 1 }, sparse: true, name: "users_username" },
    { key: { phone: 1 }, sparse: true, name: "users_phone" },
  ],

  [COLLECTIONS.MEMBERSHIPS]: [
    { key: { tenantId: 1, userId: 1, deletedAt: 1 }, name: "memberships_tenant_user_deleted" },
    { key: { userId: 1, deletedAt: 1 }, name: "memberships_user_deleted" },
  ],

  [COLLECTIONS.API_KEYS]: [
    { key: { tenantId: 1, deletedAt: 1 }, name: "apikeys_tenant_deleted" },
    { key: { keyHash: 1 }, unique: true, sparse: true, name: "apikeys_hash_unique" },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // Tenants Module
  // ─────────────────────────────────────────────────────────────────────────
  [COLLECTIONS.TENANTS]: [
    { key: { slug: 1 }, unique: true, name: "tenants_slug_unique" },
    { key: { ownerId: 1 }, name: "tenants_owner" },
    { key: { deletedAt: 1 }, name: "tenants_deleted" },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // Billing Module
  // ─────────────────────────────────────────────────────────────────────────
  [COLLECTIONS.SUBSCRIPTIONS]: [
    { key: { tenantId: 1 }, name: "subs_tenant" },
    { key: { status: 1 }, name: "subs_status" },
    { key: { stripeSubscriptionId: 1 }, sparse: true, name: "subs_stripe_id" },
  ],

  [COLLECTIONS.PAYMENTS]: [
    { key: { tenantId: 1, createdAt: -1 }, name: "payments_tenant_created" },
    { key: { stripePaymentIntentId: 1 }, sparse: true, name: "payments_stripe_id" },
  ],

  [COLLECTIONS.INVOICES]: [
    { key: { tenantId: 1, createdAt: -1 }, name: "invoices_tenant_created" },
    { key: { stripeInvoiceId: 1 }, sparse: true, name: "invoices_stripe_id" },
  ],

  [COLLECTIONS.ORDERS]: [
    { key: { tenantId: 1, createdAt: -1 }, name: "orders_tenant_created" },
    { key: { status: 1 }, name: "orders_status" },
  ],

  [COLLECTIONS.TENANT_INTEGRATIONS]: [
    { key: { tenantId: 1, provider: 1 }, unique: true, name: "ti_tenant_provider_unique" },
    { key: { provider: 1, customerId: 1 }, name: "ti_provider_customer" },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // Audit Module
  // ─────────────────────────────────────────────────────────────────────────
  [COLLECTIONS.AUDIT_LOGS]: [
    { key: { tenantId: 1, createdAt: -1 }, name: "audit_tenant_created" },
    { key: { actorId: 1, createdAt: -1 }, name: "audit_actor_created" },
    { key: { action: 1, createdAt: -1 }, name: "audit_action_created" },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // Credits Module
  // ─────────────────────────────────────────────────────────────────────────
  [COLLECTIONS.CREDIT_LEDGER]: [
    { key: { tenantId: 1, kind: 1, expiresAt: 1 }, name: "credits_tenant_kind_expires" },
    { key: { tenantId: 1, createdAt: -1 }, name: "credits_tenant_created" },
    { key: { tenantId: 1, idemKey: 1 }, unique: true, sparse: true, name: "credits_idem_unique" },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // Notify Module
  // ─────────────────────────────────────────────────────────────────────────
  [COLLECTIONS.INAPP_NOTIFICATIONS]: [
    { key: { tenantId: 1, userId: 1, createdAt: -1 }, name: "inapp_tenant_user_created" },
    { key: { tenantId: 1, userId: 1, deletedAt: 1 }, name: "inapp_tenant_user_deleted" },
  ],

  [COLLECTIONS.INAPP_RECEIPTS]: [
    { key: { tenantId: 1, userId: 1, notificationId: 1 }, unique: true, name: "receipts_tenant_user_notif_unique" },
    { key: { tenantId: 1, userId: 1, readAt: 1 }, name: "receipts_tenant_user_read" },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // Webhooks Module
  // ─────────────────────────────────────────────────────────────────────────
  [COLLECTIONS.WEBHOOKS]: [
    { key: { tenantId: 1, deletedAt: 1 }, name: "webhooks_tenant_deleted" },
    { key: { tenantId: 1, events: 1 }, name: "webhooks_tenant_events" },
  ],

  [COLLECTIONS.WEBHOOK_EVENTS]: [
    { key: { webhookId: 1, createdAt: -1 }, name: "whevents_webhook_created" },
    { key: { status: 1, nextRetryAt: 1 }, name: "whevents_status_retry" },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // Settings Module
  // ─────────────────────────────────────────────────────────────────────────
  [COLLECTIONS.SETTINGS]: [
    { key: { tenantId: 1, key: 1 }, unique: true, name: "settings_tenant_key_unique" },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // Flags Module
  // ─────────────────────────────────────────────────────────────────────────
  [COLLECTIONS.FEATURE_FLAGS]: [
    { key: { key: 1 }, unique: true, name: "flags_key_unique" },
  ],

  [COLLECTIONS.FLAG_OVERRIDES]: [
    { key: { flagKey: 1, tenantId: 1 }, name: "overrides_flag_tenant" },
    { key: { flagKey: 1, userId: 1 }, name: "overrides_flag_user" },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // Storage Module
  // ─────────────────────────────────────────────────────────────────────────
  [COLLECTIONS.FILES]: [
    { key: { tenantId: 1, path: 1 }, name: "files_tenant_path" },
    { key: { tenantId: 1, createdAt: -1 }, name: "files_tenant_created" },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // System / Kernel
  // ─────────────────────────────────────────────────────────────────────────
  [COLLECTIONS.OUTBOX]: [
    { key: { status: 1, createdAt: 1 }, name: "outbox_status_created" },
    { key: { status: 1, retryCount: 1, nextRetryAt: 1 }, name: "outbox_retry" },
  ],

  [COLLECTIONS.DEAD_LETTER]: [
    { key: { createdAt: -1 }, name: "dlq_created" },
    { key: { originalEvent: 1 }, name: "dlq_event" },
  ],
};

/**
 * Ensure all defined indexes exist
 *
 * Call this during application startup. Indexes are created in the background
 * and won't block the application from starting.
 *
 * @example
 * ```typescript
 * import { connectDb, ensureIndexes } from '@unisane/kernel';
 *
 * async function bootstrap() {
 *   await connectDb();
 *   await ensureIndexes();
 *   // ... start server
 * }
 * ```
 */
export async function ensureIndexes(): Promise<void> {
  const database = db();
  const startTime = Date.now();
  let totalCreated = 0;
  let totalSkipped = 0;

  logger.info("Starting index creation...");

  for (const [collectionName, indexes] of Object.entries(INDEX_DEFINITIONS)) {
    try {
      const collection = database.collection(collectionName);

      for (const indexDef of indexes) {
        try {
          // createIndex is idempotent - won't error if index already exists
          await collection.createIndex(indexDef.key, {
            ...indexDef,
            background: true,
          });
          totalCreated++;
        } catch (error) {
          // Code 85 = IndexOptionsConflict, Code 86 = IndexKeySpecsConflict
          // These mean the index exists but with different options - skip silently
          const code = (error as { code?: number }).code;
          if (code === 85 || code === 86) {
            totalSkipped++;
            logger.debug(`Index ${indexDef.name} already exists with different options`, {
              collection: collectionName,
              index: indexDef.name,
            });
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      logger.error(`Failed to create indexes for ${collectionName}`, {
        collection: collectionName,
        error: (error as Error).message,
      });
      // Continue with other collections
    }
  }

  const duration = Date.now() - startTime;
  logger.info(`Index creation complete`, {
    created: totalCreated,
    skipped: totalSkipped,
    durationMs: duration,
  });
}

/**
 * List all indexes for a collection
 */
export async function listIndexes(collectionName: string): Promise<IndexDescription[]> {
  const collection = db().collection(collectionName);
  return collection.listIndexes().toArray() as Promise<IndexDescription[]>;
}

/**
 * Drop all non-_id indexes for a collection (use with caution!)
 */
export async function dropIndexes(collectionName: string): Promise<void> {
  const collection = db().collection(collectionName);
  await collection.dropIndexes();
  logger.warn(`Dropped all indexes for ${collectionName}`);
}
