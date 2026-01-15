import { SubscriptionsRepository } from "../data/subscriptions.repository";
import { getBillingProvider, getTenantsProvider, hasTenantsProvider } from "@unisane/kernel";
import { mapPlanIdForProvider } from "@unisane/kernel";
import { getBillingMode } from "./mode";
import type { PlanId } from "@unisane/kernel";
import { PLAN_META } from "@unisane/kernel";
import { getEnv } from "@unisane/kernel";
import { ERR } from "@unisane/gateway";

export async function changePlan(args: {
  scopeId: string;
  planId: PlanId;
}) {
  const mode = await getBillingMode();
  if (mode !== "subscription" && mode !== "subscription_with_credits") {
    throw ERR.validation("Plan changes are disabled for this deployment.");
  }

  const [currentSub, providerSubId, tenant] = await Promise.all([
    SubscriptionsRepository.getLatest(args.scopeId).catch(() => null),
    SubscriptionsRepository.getLatestProviderSubId(args.scopeId),
    hasTenantsProvider()
      ? getTenantsProvider().findById(args.scopeId).catch(() => null)
      : Promise.resolve(null),
  ]);

  if (!providerSubId || !currentSub) {
    return { ok: false as const, error: "NO_SUBSCRIPTION" as const };
  }

  const currentPlanId = (tenant?.planId as PlanId | undefined) ?? "free";
  if (currentPlanId === args.planId) {
    return { ok: true as const };
  }

  const currentMeta = PLAN_META[currentPlanId as PlanId] as
    | (typeof PLAN_META)[PlanId]
    | undefined;
  const nextMeta = PLAN_META[args.planId];
  if (!nextMeta) {
    throw ERR.validation("Unknown plan id for changePlan");
  }

  const currentPrice = currentMeta?.defaultPrice?.amount ?? 0;
  const nextPrice = nextMeta.defaultPrice?.amount ?? 0;

  // Only handle upgrades (more expensive) via API.
  // Downgrades should be done via the billing portal so they take effect at the next renewal.
  if (nextPrice <= currentPrice) {
    return {
      ok: false as const,
      error: "DOWNGRADE_USE_PORTAL" as const,
    };
  }

  const provider = getBillingProvider();
  const { BILLING_PROVIDER } = getEnv();
  const providerPlanId = mapPlanIdForProvider(
    args.planId,
    BILLING_PROVIDER ?? 'stripe'
  );
  await provider.updateSubscriptionPlan({
    scopeId: args.scopeId,
    providerSubId,
    planId: providerPlanId,
  });

  // Do not mutate local subscription row here; Stripe webhooks will upsert the new plan/status.
  return { ok: true as const };
}
