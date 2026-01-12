/**
 * Migration: 002_seed_default_flags
 *
 * Seeds the default feature flags for the application.
 * These flags control various platform features.
 */

import type { Migration } from "@unisane/kernel";
import { ObjectId } from "mongodb";

/**
 * Default feature flags to seed
 */
const DEFAULT_FLAGS = [
  {
    key: "billing.enabled",
    description: "Enable billing features",
    defaultValue: true,
    environments: ["dev", "stage", "prod"],
  },
  {
    key: "billing.checkout.enabled",
    description: "Enable checkout flow",
    defaultValue: true,
    environments: ["dev", "stage", "prod"],
  },
  {
    key: "webhooks.enabled",
    description: "Enable webhooks",
    defaultValue: true,
    environments: ["dev", "stage", "prod"],
  },
  {
    key: "api_keys.enabled",
    description: "Enable API key management",
    defaultValue: true,
    environments: ["dev", "stage", "prod"],
  },
  {
    key: "audit.enabled",
    description: "Enable audit logging",
    defaultValue: true,
    environments: ["dev", "stage", "prod"],
  },
  {
    key: "credits.enabled",
    description: "Enable credit system",
    defaultValue: false,
    environments: ["dev", "stage"],
  },
  {
    key: "maintenance.mode",
    description: "Enable maintenance mode",
    defaultValue: false,
    environments: ["dev", "stage", "prod"],
  },
];

export const migration: Migration = {
  id: "002_seed_default_flags",
  description: "Seed default feature flags",

  up: async (ctx) => {
    const { col, COLLECTIONS } = await import("@unisane/kernel");

    if (ctx.dryRun) {
      ctx.log.info(`Would seed ${DEFAULT_FLAGS.length} default feature flags`);
      return;
    }

    const flagsCol = col(COLLECTIONS.FEATURE_FLAGS);
    const now = new Date();

    for (const flag of DEFAULT_FLAGS) {
      // Check if flag already exists
      const existing = await flagsCol.findOne({ key: flag.key });
      if (existing) {
        ctx.log.debug(`Flag ${flag.key} already exists, skipping`);
        continue;
      }

      await flagsCol.insertOne({
        _id: new ObjectId(),
        key: flag.key,
        description: flag.description,
        defaultValue: flag.defaultValue,
        environments: flag.environments,
        createdAt: now,
        updatedAt: now,
      });

      ctx.log.info(`Created flag: ${flag.key}`);
    }
  },

  down: async (ctx) => {
    const { col, COLLECTIONS } = await import("@unisane/kernel");

    if (ctx.dryRun) {
      ctx.log.info(`Would remove ${DEFAULT_FLAGS.length} default feature flags`);
      return;
    }

    const flagsCol = col(COLLECTIONS.FEATURE_FLAGS);
    const flagKeys = DEFAULT_FLAGS.map((f) => f.key);

    const result = await flagsCol.deleteMany({ key: { $in: flagKeys } });
    ctx.log.info(`Removed ${result.deletedCount} feature flags`);
  },
};

export default migration;
