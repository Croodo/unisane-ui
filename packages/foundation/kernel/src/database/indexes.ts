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

/**
 * Index definitions by collection
 */
export const INDEX_DEFINITIONS: Record<string, IndexDescription[]> = {
  // Users collection
  users: [
    { key: { email: 1 }, unique: true, sparse: true, name: "users_email_unique" },
    { key: { authUserId: 1 }, name: "users_authUserId" },
    { key: { username: 1 }, sparse: true, name: "users_username" },
    { key: { phone: 1 }, sparse: true, name: "users_phone" },
  ],

  // Memberships collection
  memberships: [
    { key: { tenantId: 1, userId: 1, deletedAt: 1 }, name: "memberships_tenant_user_deleted" },
    { key: { userId: 1, deletedAt: 1 }, name: "memberships_user_deleted" },
  ],

  // Tenants collection
  tenants: [
    { key: { slug: 1 }, unique: true, name: "tenants_slug_unique" },
    { key: { ownerId: 1 }, name: "tenants_owner" },
    { key: { deletedAt: 1 }, name: "tenants_deleted" },
  ],

  // Audit logs collection
  audit_logs: [
    { key: { tenantId: 1, createdAt: -1 }, name: "audit_tenant_created" },
    { key: { actorId: 1, createdAt: -1 }, name: "audit_actor_created" },
    { key: { action: 1, createdAt: -1 }, name: "audit_action_created" },
  ],

  // Credit ledger collection
  credit_ledger: [
    { key: { tenantId: 1, kind: 1, expiresAt: 1 }, name: "credits_tenant_kind_expires" },
    { key: { tenantId: 1, createdAt: -1 }, name: "credits_tenant_created" },
    { key: { tenantId: 1, idemKey: 1 }, unique: true, sparse: true, name: "credits_idem_unique" },
  ],

  // In-app notifications collection
  inapp_notifications: [
    { key: { tenantId: 1, userId: 1, createdAt: -1 }, name: "inapp_tenant_user_created" },
    { key: { tenantId: 1, userId: 1, deletedAt: 1 }, name: "inapp_tenant_user_deleted" },
  ],

  // In-app receipts collection
  inapp_receipts: [
    { key: { tenantId: 1, userId: 1, notificationId: 1 }, unique: true, name: "receipts_tenant_user_notif_unique" },
    { key: { tenantId: 1, userId: 1, readAt: 1 }, name: "receipts_tenant_user_read" },
  ],

  // API keys collection
  api_keys: [
    { key: { tenantId: 1, deletedAt: 1 }, name: "apikeys_tenant_deleted" },
    { key: { keyHash: 1 }, unique: true, name: "apikeys_hash_unique" },
  ],

  // Webhooks collection
  webhooks: [
    { key: { tenantId: 1, deletedAt: 1 }, name: "webhooks_tenant_deleted" },
    { key: { tenantId: 1, events: 1 }, name: "webhooks_tenant_events" },
  ],

  // Webhook events collection
  webhook_events: [
    { key: { webhookId: 1, createdAt: -1 }, name: "whevents_webhook_created" },
    { key: { status: 1, nextRetryAt: 1 }, name: "whevents_status_retry" },
  ],

  // Settings collection
  settings: [
    { key: { tenantId: 1, key: 1 }, unique: true, name: "settings_tenant_key_unique" },
  ],

  // Feature flags collection
  feature_flags: [
    { key: { key: 1 }, unique: true, name: "flags_key_unique" },
  ],

  // Flag overrides collection
  flag_overrides: [
    { key: { flagKey: 1, tenantId: 1 }, name: "overrides_flag_tenant" },
    { key: { flagKey: 1, userId: 1 }, name: "overrides_flag_user" },
  ],

  // Outbox collection (event sourcing)
  _outbox: [
    { key: { status: 1, createdAt: 1 }, name: "outbox_status_created" },
    { key: { status: 1, retryCount: 1, nextRetryAt: 1 }, name: "outbox_retry" },
  ],

  // Dead letter queue
  _dead_letter: [
    { key: { createdAt: -1 }, name: "dlq_created" },
    { key: { originalEvent: 1 }, name: "dlq_event" },
  ],

  // Files/Storage collection
  files: [
    { key: { tenantId: 1, path: 1 }, name: "files_tenant_path" },
    { key: { tenantId: 1, createdAt: -1 }, name: "files_tenant_created" },
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
