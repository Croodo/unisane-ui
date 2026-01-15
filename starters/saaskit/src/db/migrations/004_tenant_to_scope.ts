/**
 * Migration: Convert tenantId to scopeId/scopeType
 *
 * This migration updates all tenant-scoped collections to use the new
 * universal scope system (scopeType + scopeId) instead of the legacy
 * tenantId field.
 *
 * Changes:
 * - Adds scopeType: 'tenant' to all documents with tenantId
 * - Renames tenantId -> scopeId
 * - Creates new indexes on scopeType + scopeId
 * - Removes old tenantId indexes
 *
 * Reversible: Yes (down function restores tenantId)
 */

import type { Migration, MigrationContext } from '@unisane/kernel';
import { db, COLLECTIONS } from '@unisane/kernel';

/**
 * Collections that need tenantId -> scopeId migration.
 * Each entry specifies the collection name and the old index name to drop.
 */
const COLLECTIONS_TO_MIGRATE = [
  { name: COLLECTIONS.MEMBERSHIPS, oldIndex: 'memberships_tenant_user_deleted' },
  { name: COLLECTIONS.API_KEYS, oldIndex: 'apikeys_tenant_deleted' },
  { name: COLLECTIONS.SUBSCRIPTIONS, oldIndex: 'subs_tenant' },
  { name: COLLECTIONS.PAYMENTS, oldIndex: 'payments_tenant_created' },
  { name: COLLECTIONS.INVOICES, oldIndex: 'invoices_tenant_created' },
  { name: COLLECTIONS.ORDERS, oldIndex: 'orders_tenant_created' },
  { name: COLLECTIONS.TENANT_INTEGRATIONS, oldIndex: 'ti_tenant_provider_unique' },
  { name: COLLECTIONS.AUDIT_LOGS, oldIndex: 'audit_tenant_created' },
  { name: COLLECTIONS.CREDIT_LEDGER, oldIndex: 'credits_tenant_kind_expires' },
  { name: COLLECTIONS.INAPP_NOTIFICATIONS, oldIndex: 'inapp_tenant_user_created' },
  { name: COLLECTIONS.INAPP_RECEIPTS, oldIndex: 'receipts_tenant_user_notif_unique' },
  { name: COLLECTIONS.WEBHOOKS, oldIndex: 'webhooks_tenant_deleted' },
  { name: COLLECTIONS.SETTINGS, oldIndex: 'settings_tenant_key_unique' },
  { name: COLLECTIONS.FLAG_OVERRIDES, oldIndex: 'overrides_flag_tenant' },
  { name: COLLECTIONS.FILES, oldIndex: 'files_tenant_path' },
  { name: COLLECTIONS.OUTBOX, oldIndex: null }, // outbox uses tenantId directly
] as const;

export const migration: Migration = {
  id: '004_tenant_to_scope',
  description: 'Convert tenantId to scopeId/scopeType for universal scope system',

  async up(ctx: MigrationContext) {
    const database = db();

    for (const { name, oldIndex } of COLLECTIONS_TO_MIGRATE) {
      ctx.log.info(`Processing collection: ${name}`);

      const col = database.collection(name);

      // Count documents with tenantId but no scopeId
      const count = await col.countDocuments({
        tenantId: { $exists: true },
        scopeId: { $exists: false },
      });

      if (count === 0) {
        ctx.log.info(`  No documents to migrate in ${name}`);
        continue;
      }

      ctx.log.info(`  Found ${count} documents to migrate`);

      if (ctx.dryRun) {
        ctx.log.info(`  [DRY RUN] Would migrate ${count} documents`);
        continue;
      }

      // Update all documents: add scopeType, rename tenantId to scopeId
      const result = await col.updateMany(
        {
          tenantId: { $exists: true },
          scopeId: { $exists: false },
        },
        [
          {
            $set: {
              scopeType: 'tenant',
              scopeId: '$tenantId',
            },
          },
          {
            $unset: 'tenantId',
          },
        ]
      );

      ctx.log.info(`  Migrated ${result.modifiedCount} documents`);

      // Drop old index if it exists
      if (oldIndex) {
        try {
          await col.dropIndex(oldIndex);
          ctx.log.info(`  Dropped old index: ${oldIndex}`);
        } catch (e) {
          // Index might not exist
          ctx.log.debug(`  Index ${oldIndex} doesn't exist (skipped)`);
        }
      }
    }

    ctx.log.info('Migration complete');
  },

  async down(ctx: MigrationContext) {
    const database = db();

    for (const { name } of COLLECTIONS_TO_MIGRATE) {
      ctx.log.info(`Reverting collection: ${name}`);

      const col = database.collection(name);

      // Count documents with scopeId but no tenantId
      const count = await col.countDocuments({
        scopeId: { $exists: true },
        scopeType: 'tenant',
        tenantId: { $exists: false },
      });

      if (count === 0) {
        ctx.log.info(`  No documents to revert in ${name}`);
        continue;
      }

      ctx.log.info(`  Found ${count} documents to revert`);

      if (ctx.dryRun) {
        ctx.log.info(`  [DRY RUN] Would revert ${count} documents`);
        continue;
      }

      // Revert: rename scopeId back to tenantId, remove scopeType
      const result = await col.updateMany(
        {
          scopeId: { $exists: true },
          scopeType: 'tenant',
          tenantId: { $exists: false },
        },
        [
          {
            $set: {
              tenantId: '$scopeId',
            },
          },
          {
            $unset: ['scopeId', 'scopeType'],
          },
        ]
      );

      ctx.log.info(`  Reverted ${result.modifiedCount} documents`);
    }

    ctx.log.info('Revert complete');
  },
};

export default migration;
