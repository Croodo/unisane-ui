import { SubscriptionsRepository } from "../data/subscriptions.repository";
import { getTenantId, getBillingProvider, events } from "@unisane/kernel";
import { getBillingMode } from "./mode";
import { ERR } from "@unisane/gateway";
import { BILLING_EVENTS } from "../domain/constants";

export type CancelSubscriptionArgs = {
  atPeriodEnd: boolean;
};

export async function cancelSubscription(
  args: CancelSubscriptionArgs
): Promise<{ ok: true } | { ok: false; error: string }> {
  const tenantId = getTenantId();
  const mode = await getBillingMode();
  if (mode === "topup_only" || mode === "disabled") {
    throw ERR.validation("Subscriptions are disabled for this deployment.");
  }
  const providerSubId = await SubscriptionsRepository.getLatestProviderSubId(tenantId);
  if (!providerSubId) return { ok: false as const, error: "NO_SUBSCRIPTION" };
  try {
    const provider = getBillingProvider();
    await provider.cancelSubscription(providerSubId, !args.atPeriodEnd);
  } catch (e) {
    throw e;
  }
  if (args.atPeriodEnd) await SubscriptionsRepository.setCancelAtPeriodEnd(tenantId);
  else await SubscriptionsRepository.setCanceledImmediate(tenantId);

  await events.emit(BILLING_EVENTS.SUBSCRIPTION_CANCELLED, {
    tenantId,
    atPeriodEnd: args.atPeriodEnd,
  });
  return { ok: true as const };
}
