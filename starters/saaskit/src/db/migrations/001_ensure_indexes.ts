/**
 * Migration: 001_ensure_indexes
 *
 * Ensures all defined indexes exist in the database.
 * This is typically the first migration to run.
 *
 * Note: ensureIndexes() is idempotent - it won't fail if indexes already exist.
 */

import type { Migration } from "@unisane/kernel";

export const migration: Migration = {
  id: "001_ensure_indexes",
  description: "Create all defined database indexes",

  up: async (ctx) => {
    const { ensureIndexes } = await import("@unisane/kernel");

    if (ctx.dryRun) {
      ctx.log.info("Would create all defined indexes");
      return;
    }

    await ensureIndexes();
  },

  // Indexes are generally not dropped on rollback as it would be destructive
  // and could affect production performance significantly.
  // If you need to drop indexes, do so explicitly in a dedicated migration.
  down: async (ctx) => {
    ctx.log.warn("Index dropping not implemented - indexes are preserved on rollback");
  },
};

export default migration;
