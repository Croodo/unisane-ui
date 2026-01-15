/**
 * Migration: Create scope-based indexes
 *
 * This migration creates new indexes using scopeId instead of tenantId
 * to support the universal scope system.
 *
 * Run this AFTER 004_tenant_to_scope migration has converted the data.
 *
 * Note: Old tenantId indexes should be dropped by the previous migration.
 * This migration creates the new scopeId/scopeType indexes.
 */

import type { Migration, MigrationContext } from '@unisane/kernel';
import { db, COLLECTIONS } from '@unisane/kernel';
import type { IndexDescription } from 'mongodb';

/**
 * New indexes using scopeId/scopeType for universal scope system.
 * These replace the old tenantId-based indexes.
 */
const NEW_INDEXES: Record<string, IndexDescription[]> = {
  [COLLECTIONS.MEMBERSHIPS]: [
    { key: { scopeId: 1, userId: 1, deletedAt: 1 }, name: 'memberships_scope_user_deleted' },
  ],
  [COLLECTIONS.API_KEYS]: [
    { key: { scopeId: 1, deletedAt: 1 }, name: 'apikeys_scope_deleted' },
  ],
  [COLLECTIONS.SUBSCRIPTIONS]: [
    { key: { scopeId: 1 }, name: 'subs_scope' },
  ],
  [COLLECTIONS.PAYMENTS]: [
    { key: { scopeId: 1, createdAt: -1 }, name: 'payments_scope_created' },
  ],
  [COLLECTIONS.INVOICES]: [
    { key: { scopeId: 1, createdAt: -1 }, name: 'invoices_scope_created' },
  ],
  [COLLECTIONS.ORDERS]: [
    { key: { scopeId: 1, createdAt: -1 }, name: 'orders_scope_created' },
  ],
  [COLLECTIONS.TENANT_INTEGRATIONS]: [
    { key: { scopeId: 1, provider: 1 }, unique: true, name: 'si_scope_provider_unique' },
  ],
  [COLLECTIONS.AUDIT_LOGS]: [
    { key: { scopeId: 1, createdAt: -1 }, name: 'audit_scope_created' },
  ],
  [COLLECTIONS.CREDIT_LEDGER]: [
    { key: { scopeId: 1, kind: 1, expiresAt: 1 }, name: 'credits_scope_kind_expires' },
    { key: { scopeId: 1, createdAt: -1 }, name: 'credits_scope_created' },
    { key: { scopeId: 1, idemKey: 1 }, unique: true, sparse: true, name: 'credits_scope_idem_unique' },
  ],
  [COLLECTIONS.INAPP_NOTIFICATIONS]: [
    { key: { scopeId: 1, userId: 1, createdAt: -1 }, name: 'inapp_scope_user_created' },
    { key: { scopeId: 1, userId: 1, deletedAt: 1 }, name: 'inapp_scope_user_deleted' },
  ],
  [COLLECTIONS.INAPP_RECEIPTS]: [
    { key: { scopeId: 1, userId: 1, notificationId: 1 }, unique: true, name: 'receipts_scope_user_notif_unique' },
    { key: { scopeId: 1, userId: 1, readAt: 1 }, name: 'receipts_scope_user_read' },
  ],
  [COLLECTIONS.WEBHOOKS]: [
    { key: { scopeId: 1, deletedAt: 1 }, name: 'webhooks_scope_deleted' },
    { key: { scopeId: 1, events: 1 }, name: 'webhooks_scope_events' },
  ],
  [COLLECTIONS.SETTINGS]: [
    { key: { scopeId: 1, key: 1 }, unique: true, name: 'settings_scope_key_unique' },
  ],
  [COLLECTIONS.FLAG_OVERRIDES]: [
    { key: { flagKey: 1, scopeId: 1 }, name: 'overrides_flag_scope' },
  ],
  [COLLECTIONS.FILES]: [
    { key: { scopeId: 1, path: 1 }, name: 'files_scope_path' },
    { key: { scopeId: 1, createdAt: -1 }, name: 'files_scope_created' },
  ],
};

export const migration: Migration = {
  id: '005_scope_indexes',
  description: 'Create scope-based indexes for universal scope system',
  dependencies: ['004_tenant_to_scope'],

  async up(ctx: MigrationContext) {
    const database = db();
    let created = 0;
    let skipped = 0;

    for (const [colName, indexes] of Object.entries(NEW_INDEXES)) {
      ctx.log.info(`Creating indexes for collection: ${colName}`);
      const col = database.collection(colName);

      for (const indexDef of indexes) {
        ctx.log.info(`  Creating index: ${indexDef.name}`);

        if (ctx.dryRun) {
          ctx.log.info(`  [DRY RUN] Would create index ${indexDef.name}`);
          continue;
        }

        try {
          await col.createIndex(indexDef.key, {
            ...indexDef,
            background: true,
          });
          created++;
          ctx.log.info(`  Created: ${indexDef.name}`);
        } catch (e) {
          const code = (e as { code?: number }).code;
          if (code === 85 || code === 86) {
            // Index exists with different options
            skipped++;
            ctx.log.warn(`  Skipped (already exists): ${indexDef.name}`);
          } else {
            throw e;
          }
        }
      }
    }

    ctx.log.info(`Index creation complete: ${created} created, ${skipped} skipped`);
  },

  async down(ctx: MigrationContext) {
    const database = db();
    let dropped = 0;

    for (const [colName, indexes] of Object.entries(NEW_INDEXES)) {
      ctx.log.info(`Dropping indexes for collection: ${colName}`);
      const col = database.collection(colName);

      for (const indexDef of indexes) {
        if (!indexDef.name) continue;

        ctx.log.info(`  Dropping index: ${indexDef.name}`);

        if (ctx.dryRun) {
          ctx.log.info(`  [DRY RUN] Would drop index ${indexDef.name}`);
          continue;
        }

        try {
          await col.dropIndex(indexDef.name);
          dropped++;
          ctx.log.info(`  Dropped: ${indexDef.name}`);
        } catch (e) {
          // Index might not exist
          ctx.log.debug(`  Index ${indexDef.name} doesn't exist (skipped)`);
        }
      }
    }

    ctx.log.info(`Index removal complete: ${dropped} dropped`);
  },
};

export default migration;
