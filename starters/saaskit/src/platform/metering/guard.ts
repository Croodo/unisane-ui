import type { FeatureKey } from "@/src/shared/constants/features";
import type { PlanId } from "@/src/shared/constants/plan";
import {
  resolveTokenPolicy,
  resolveEntitlements,
} from "@/src/platform/metering/policy";
import type { FeaturePolicyMap } from "@/src/shared/constants/metering";
import { getWindow, increment } from "@/src/modules/usage";
import { consume as consumeCredits } from "@/src/modules/credits";
import { metrics } from "@/src/core/metrics";

export type UsagePort = {
  getWindow(args: {
    tenantId: string;
    feature: FeatureKey;
    window: "day" | "hour" | "minute";
  }): Promise<number>;
  increment(args: {
    tenantId: string;
    feature: FeatureKey;
    n: number;
    idempotencyKey: string;
  }): Promise<void>;
};

export type CreditsPort = {
  consume(args: {
    tenantId: string;
    amount: number;
    feature: FeatureKey;
    idem: string;
  }): Promise<void>;
};

export function createGuard(deps: { usage: UsagePort; credits: CreditsPort }) {
  return {
    async enforceTokensAndQuota(args: {
      tenantId: string;
      plan: PlanId;
      feature: FeatureKey;
      units?: number;
      idem: string;
      tenantOverrides?: Partial<FeaturePolicyMap>;
    }) {
      const overrides = args.tenantOverrides;
      const policy = resolveTokenPolicy({
        feature: args.feature,
        plan: args.plan,
        ...(overrides ? { tenantOverrides: overrides } : {}),
      });
      const units = args.units ?? 1;
      const tokens = policy.cost * units;
      const used = await deps.usage.getWindow({
        tenantId: args.tenantId,
        feature: args.feature,
        window: "day",
      });
      const remainingFree = (policy.dailyFree ?? 0) - used;
      const payable = Math.max(0, tokens - Math.max(0, remainingFree));
      await deps.usage.increment({
        tenantId: args.tenantId,
        feature: args.feature,
        n: units,
        idempotencyKey: args.idem,
      });
      try {
        metrics.inc("quota_used_total", { feature: args.feature, units });
      } catch {}
      if (payable > 0) {
        await deps.credits.consume({
          tenantId: args.tenantId,
          amount: payable,
          feature: args.feature,
          idem: `idem:${args.idem}`,
        });
        try {
          metrics.inc("credits_spent_total", {
            feature: args.feature,
            tokens: payable,
          });
        } catch {}
      }
      return {
        payable,
        freeUsed: Math.min(tokens, Math.max(0, remainingFree)),
      } as const;
    },
  } as const;
}

// DX helper: default guard wired to module services
export function createDefaultGuard() {
  return createGuard({
    usage: {
      getWindow: ({ tenantId, feature, window }) =>
        getWindow({ tenantId, feature, window }) as Promise<number>,
      increment: ({ tenantId, feature, n, idempotencyKey }) =>
        increment({ tenantId, feature, n, idempotencyKey }).then(
          () => undefined
        ),
    },
    credits: {
      consume: ({ tenantId, amount, feature, idem }) =>
        consumeCredits({ tenantId, amount, feature, reason: idem }).then(
          () => undefined
        ),
    },
  });
}

// DX helper: one-call enforcement using defaults
export async function enforceTokensAndQuota(args: {
  tenantId: string;
  plan: PlanId;
  feature: FeatureKey;
  idem: string;
  units?: number;
  tenantOverrides?: Partial<FeaturePolicyMap>;
}) {
  const guard = createDefaultGuard();
  return guard.enforceTokensAndQuota(args);
}

// -------- Optional DX wrappers (feature toggles, capacities, quota checks) --------
import { ERR } from "@/src/gateway/errors";

/** Require a boolean feature toggle for a tenant */
export async function requireFeatureForTenant(
  tenantId: string,
  toggleKey: string
): Promise<void> {
  const e = await resolveEntitlements(tenantId);
  const on = Boolean((e.toggles as Record<string, unknown>)[toggleKey]);
  if (!on) throw ERR.forbidden("Feature not enabled for plan");
}

/** Ensure a numeric capacity (e.g., seats, channels) has room given current usage */
export async function ensureCapacityForTenant(
  tenantId: string,
  capacityKey: string,
  used: number
): Promise<{ limit: number; remaining: number }> {
  const e = await resolveEntitlements(tenantId);
  const limitRaw = (e.capacities as Record<string, unknown>)[capacityKey];
  const limit = typeof limitRaw === "number" ? limitRaw : 0;
  const remaining = Math.max(0, limit - used);
  if (remaining <= 0) throw ERR.forbidden("Capacity exceeded for plan");
  return { limit, remaining } as const;
}

/** Check a per-feature daily quota window against entitlements (best-effort) */
export async function checkQuotaWindow(
  tenantId: string,
  feature: string
): Promise<{ used: number; limit: number; ok: boolean }> {
  const e = await resolveEntitlements(tenantId);
  const q = (
    e.quotas as Record<
      string,
      { limit: number; window: "day" | "month" | "year" } | undefined
    >
  )[feature];
  if (!q) return { used: 0, limit: Number.POSITIVE_INFINITY, ok: true };
  // Only day window is tracked precisely; others require additional rollups.
  const used =
    q.window === "day"
      ? await getWindow({ tenantId, feature, window: "day" })
      : 0;
  const ok = used < q.limit;
  return { used, limit: q.limit, ok } as const;
}
