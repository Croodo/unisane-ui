import { isEnabledForScope } from "./overrides";
import { ExposuresRepo } from "../data/exposures.repository";
import { getEnv, logger, metrics, type AppEnv } from "@unisane/kernel";
import { z } from "zod";
import type { EvaluateFlagsArgs, EvalCtx } from "../domain/types";

export type { EvaluateFlagsArgs };

/**
 * FLAG-002 FIX: Exposure logging port interface.
 * Allows injection of custom exposure logging implementations for testing
 * or alternative storage backends (e.g., analytics service, BigQuery).
 */
export interface ExposureLogger {
  logBatch(exposures: Array<{
    env: AppEnv;
    flagKey: string;
    value: boolean;
    reason: "evaluation" | "rule_match" | "target_match" | "default" | "user_override" | "tenant_override";
    userId?: string;
    tenantId?: string;
    timestamp: string;
  }>): Promise<void>;
}

/**
 * FLAG-002 FIX: Default exposure logger using repository.
 * Can be replaced via setExposureLogger for testing or custom backends.
 */
let exposureLogger: ExposureLogger = {
  logBatch: (exposures) => ExposuresRepo.logBatch(exposures),
};

/**
 * FLAG-002 FIX: Set a custom exposure logger.
 * Use this for testing or to redirect exposures to analytics services.
 *
 * @example
 * ```typescript
 * // In tests:
 * setExposureLogger({ logBatch: async () => {} });
 *
 * // For analytics:
 * setExposureLogger({
 *   logBatch: async (exposures) => {
 *     await analyticsService.track('flag_exposures', exposures);
 *   }
 * });
 * ```
 */
export function setExposureLogger(logger: ExposureLogger): void {
  exposureLogger = logger;
}

/**
 * FLAG-002 FIX: Reset to default exposure logger.
 * Useful in test teardown.
 */
export function resetExposureLogger(): void {
  exposureLogger = {
    logBatch: (exposures) => ExposuresRepo.logBatch(exposures),
  };
}

/**
 * ROUTE-004 FIX: Zod schema for validating evaluateFlags input.
 * Ensures type safety at runtime instead of relying on unsafe casting.
 */
const ZEvaluateFlagsArgs = z.object({
  env: z.enum(["test", "dev", "stage", "prod"]).optional(),
  keys: z.array(z.string()).min(1, "At least one flag key is required"),
  context: z.object({
    tenantId: z.string().optional(),
    userId: z.string().optional(),
    email: z.string().optional(),
    country: z.string().optional(),
    plan: z.string().optional(),
  }).optional().default({}),
});

/**
 * FLAG-001 FIX: Evaluate multiple flags with batched exposure logging.
 *
 * **N+1 Mitigation:**
 * - Flag evaluations still run in parallel (inherent to flag system design)
 * - Exposure logging is batched into a single write operation
 * - This reduces DB writes from N to 1 for exposure tracking
 *
 * Note: Full N+1 fix for `isEnabledForScope` would require a batch override lookup,
 * which is a larger refactor. This fix focuses on the exposure logging bottleneck.
 *
 * ROUTE-004 FIX: Added Zod validation for input arguments.
 */
export async function evaluateFlags(args: EvaluateFlagsArgs) {
  // ROUTE-004 FIX: Validate input with Zod
  const parsed = ZEvaluateFlagsArgs.safeParse(args);
  if (!parsed.success) {
    const err = new Error(
      `Invalid evaluateFlags arguments: ${parsed.error.issues.map(i => i.message).join(', ')}`
    );
    (err as Error & { code: string }).code = "VALIDATION_ERROR";
    throw err;
  }
  const validatedArgs = parsed.data;

  const env: AppEnv = validatedArgs.env ?? getEnv().APP_ENV;
  const results: Record<string, boolean> = {};
  const timestamp = new Date().toISOString();

  // Build shared context once
  const ctx: EvalCtx = {
    ...(args.context.userId ? { userId: args.context.userId } : {}),
    ...(args.context.tenantId ? { tenantId: args.context.tenantId } : {}),
    ...(args.context.email ? { email: args.context.email } : {}),
    ...(args.context.country ? { country: args.context.country } : {}),
  };

  // FLAG-001 FIX: Collect exposures for batch logging
  const exposures: Array<{
    env: AppEnv;
    flagKey: string;
    value: boolean;
    reason: "evaluation" | "rule_match" | "target_match" | "default" | "user_override" | "tenant_override";
    userId?: string;
    tenantId?: string;
    timestamp: string;
  }> = [];

  // Evaluate all flags in parallel
  await Promise.all(
    args.keys.map(async (key) => {
      const value = await isEnabledForScope({
        env,
        key,
        scopeId: args.context.tenantId ?? "anon",
        ...(args.context.userId ? { userId: args.context.userId } : {}),
        ctx,
      });

      results[key] = value;

      // Collect exposure for batch logging
      exposures.push({
        env,
        flagKey: key,
        value,
        reason: "evaluation",
        userId: args.context.userId,
        tenantId: args.context.tenantId,
        timestamp,
      });
    })
  );

  // FLAG-001 FIX: Batch log all exposures (fire and forget)
  // FLAG-002 FIX: Use injected exposure logger instead of direct repository access
  if (exposures.length > 0) {
    void exposureLogger.logBatch(exposures).catch((err) => {
      logger.warn("flags: failed to batch log flag exposures", {
        err,
        count: exposures.length,
      });
      metrics.increment("flags.exposure.batch_log_failures", {
        labels: { count: String(exposures.length) },
      });
    });
  }

  return results;
}
