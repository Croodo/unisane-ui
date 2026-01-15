import { SubscriptionsRepository } from "../data/subscriptions.repository";
import { getScopeId, getTenantsProvider, hasTenantsProvider } from "@unisane/kernel";
import { getBillingMode } from "./mode";
import { ERR } from "@unisane/gateway";

export async function getSubscription() {
  const scopeId = getScopeId();
  const [sub, tenant] = await Promise.all([
    SubscriptionsRepository.findLatest(scopeId).catch(() => null),
    hasTenantsProvider()
      ? getTenantsProvider().findById(scopeId).catch(() => null)
      : Promise.resolve(null),
  ]);
  return {
    ...(sub?.id ? { id: sub.id } : {}),
    ...(tenant?.planId ? { planId: tenant.planId } : {}),
    ...(sub?.status ? { status: sub.status } : {}),
    ...(typeof sub?.cancelAtPeriodEnd === "boolean"
      ? { cancelAtPeriodEnd: sub.cancelAtPeriodEnd }
      : {}),
    ...(sub?.currentPeriodEnd
      ? { currentPeriodEnd: sub.currentPeriodEnd.toISOString() }
      : {}),
  } as const;
}

export async function assertActiveSubscriptionForCredits(): Promise<void> {
  const scopeId = getScopeId();
  const mode = await getBillingMode();
  if (mode !== "subscription_with_credits") return;
  const sub = await SubscriptionsRepository.findLatest(scopeId).catch(() => null);
  const status = sub?.status;
  const isActive = status === "active" || status === "trialing";
  if (!isActive) {
    throw ERR.forbidden("An active subscription is required to use credits");
  }
}
