import { getBillingProvider } from "@unisane/kernel";
import { mapPlanIdForProvider } from "@unisane/kernel";
import { getEnv } from "@unisane/kernel";
import { getBillingMode } from "./mode";
import { ERR } from "@unisane/gateway";

export async function subscribe(args: {
  tenantId: string;
  planId: string;
  quantity?: number;
  successUrl: string;
  cancelUrl: string;
}) {
  const mode = await getBillingMode();
  if (mode === "topup_only" || mode === "disabled") {
    throw ERR.validation("Subscriptions are disabled for this deployment.");
  }
  const provider = getBillingProvider();
  const { BILLING_PROVIDER } = getEnv();
  const resolvedPlanId = mapPlanIdForProvider(args.planId, BILLING_PROVIDER ?? 'stripe');
  return provider.createCheckout({ ...args, planId: resolvedPlanId });
}
