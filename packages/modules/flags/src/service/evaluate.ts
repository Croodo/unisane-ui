import { isEnabledForScope } from "./overrides";
import { ExposuresRepo } from "../data/exposures.repository";
import { getEnv, logger, metrics } from "@unisane/kernel";
import type { EvaluateFlagsArgs, EvalCtx } from "../domain/types";

export type { EvaluateFlagsArgs };

export async function evaluateFlags(args: EvaluateFlagsArgs) {
  const env = args.env ?? getEnv().APP_ENV;
  const results: Record<string, boolean> = {};

  // Evaluate in parallel
  await Promise.all(
    args.keys.map(async (key) => {
      const ctx: EvalCtx = {
        ...(args.context.userId ? { userId: args.context.userId } : {}),
        ...(args.context.tenantId ? { tenantId: args.context.tenantId } : {}),
        ...(args.context.email ? { email: args.context.email } : {}),
        ...(args.context.country ? { country: args.context.country } : {}),
        // plan: args.context.plan, // Need to map string to PlanId if we want to support it here
      };

      const value = await isEnabledForScope({
        env,
        key,
        scopeId: args.context.tenantId ?? "anon", // Fallback for scope-less eval
        ...(args.context.userId ? { userId: args.context.userId } : {}),
        ctx,
      });

      results[key] = value;

      // Log exposure (fire and forget)
      // Note: isEnabledForScope doesn't currently return the *reason*.
      // For now we log a generic reason. To improve this, we'd need to refactor
      // isEnabledForScope to return { value, reason }.
      // For MVP analytics, just knowing the value + context is often enough.
      void ExposuresRepo.log({
        env,
        flagKey: key,
        value,
        reason: "evaluation", // Placeholder until we refactor evaluator to return metadata
        userId: args.context.userId,
        tenantId: args.context.tenantId,
        timestamp: new Date().toISOString(),
      }).catch((err) => {
        // Suppress logging errors to avoid impacting the user
        logger.warn("flags: failed to log flag exposure", { err });
        metrics.increment("flags.exposure.log_failures", { labels: { flagKey: key } });
      });
    })
  );

  return results;
}
