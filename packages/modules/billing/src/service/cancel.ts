import { SubscriptionsRepository } from "../data/subscriptions.repository";
import { getScopeId, getBillingProvider, events } from "@unisane/kernel";
import { getBillingMode } from "./mode";
import { ERR } from "@unisane/gateway";
import { BILLING_EVENTS } from "../domain/constants";
import { logBillingAudit, BILLING_AUDIT_ACTIONS } from "./audit";

export type CancelSubscriptionArgs = {
  atPeriodEnd: boolean;
};

export async function cancelSubscription(
  args: CancelSubscriptionArgs
): Promise<{ ok: true } | { ok: false; error: string }> {
  const scopeId = getScopeId();
  const mode = await getBillingMode();
  if (mode === "topup_only" || mode === "disabled") {
    throw ERR.validation("Subscriptions are disabled for this deployment.");
  }
  const providerSubId = await SubscriptionsRepository.findLatestProviderSubId(scopeId);
  if (!providerSubId) return { ok: false as const, error: "NO_SUBSCRIPTION" };
  try {
    const provider = getBillingProvider();
    await provider.cancelSubscription(providerSubId, !args.atPeriodEnd);
  } catch (e) {
    throw e;
  }
  if (args.atPeriodEnd) await SubscriptionsRepository.markCancelAtPeriodEnd(scopeId);
  else await SubscriptionsRepository.cancelImmediately(scopeId);

  // Audit log the cancellation
  await logBillingAudit({
    scopeId,
    action: BILLING_AUDIT_ACTIONS.SUBSCRIPTION_CANCELLED,
    targetType: 'subscription',
    targetId: providerSubId,
    changes: [
      { field: 'status', from: 'active', to: args.atPeriodEnd ? 'cancel_at_period_end' : 'canceled' },
    ],
    metadata: {
      providerSubId,
      cancelType: args.atPeriodEnd ? 'at_period_end' : 'immediate',
    },
  });

  await events.emit(BILLING_EVENTS.SUBSCRIPTION_CANCELLED, {
    scopeId,
    atPeriodEnd: args.atPeriodEnd,
  });
  return { ok: true as const };
}
