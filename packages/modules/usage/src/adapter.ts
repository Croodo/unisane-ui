/**
 * Usage Port Adapter
 *
 * Implements UsagePort interface from kernel.
 * Wraps the existing usage module service functions.
 * Used by billing/ai modules for usage tracking via the kernel port.
 */

import type {
  UsagePort,
  UsageAggregate,
  CurrentUsage,
  UsageWindow,
} from "@unisane/kernel";
import { runWithScope } from "@unisane/kernel";
import { increment } from "./service/increment";
import { getWindow } from "./service/getWindow";

/**
 * UsagePort implementation that wraps the usage module services.
 */
export const usageAdapter: UsagePort = {
  async record(args) {
    return runWithScope({ type: "tenant", id: args.scopeId }, async () => {
      await increment({
        feature: args.metric,
        n: args.value,
      });
    });
  },

  async recordBatch(events) {
    // Process each event - could be optimized with batch operations
    for (const event of events) {
      await runWithScope({ type: "tenant", id: event.scopeId }, async () => {
        await increment({
          feature: event.metric,
          n: event.value,
        });
      });
    }
  },

  async getUsage(args) {
    return runWithScope({ type: "tenant", id: args.scopeId }, async () => {
      // Get usage for the window
      const value = await getWindow({
        feature: args.metric,
        window: args.window,
        at: args.from,
      });

      const aggregate: UsageAggregate = {
        period: args.from.toISOString(),
        value,
        count: 1, // Single aggregation point
      };

      return [aggregate];
    });
  },

  async getCurrentPeriodUsage(args) {
    return runWithScope({ type: "tenant", id: args.scopeId }, async () => {
      const now = new Date();

      // Get current day usage as default period
      const value = await getWindow({
        feature: args.metric,
        window: "day" as UsageWindow,
        at: now,
      });

      // Calculate period boundaries (start and end of current day UTC)
      const periodStart = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          0,
          0,
          0
        )
      );
      const periodEnd = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 1,
          0,
          0,
          0
        )
      );

      const currentUsage: CurrentUsage = {
        used: value,
        limit: null, // Usage module doesn't manage limits directly
        remaining: null,
        periodStart,
        periodEnd,
      };

      return currentUsage;
    });
  },

  async isWithinLimit(args) {
    return runWithScope({ type: "tenant", id: args.scopeId }, async () => {
      // Usage module doesn't manage limits directly
      // This would need to be coordinated with billing/plan limits
      // For now, return true (no limit checking at usage level)
      return true;
    });
  },
};
