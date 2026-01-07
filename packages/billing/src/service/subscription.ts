import { getLatest } from "../data/subscriptions.repository";
import { TenantsRepo } from "@unisane/tenants";
import { getTenantId } from "@unisane/kernel";
import { getBillingMode } from "./mode";
import { ERR } from "@unisane/gateway";

export async function getSubscription() {
  const tenantId = getTenantId();
  const [sub, tenant] = await Promise.all([
    getLatest(tenantId).catch(() => null),
    TenantsRepo.findById(tenantId).catch(() => null),
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
  const tenantId = getTenantId();
  const mode = await getBillingMode();
  if (mode !== "subscription_with_credits") return;
  const sub = await getLatest(tenantId).catch(() => null);
  const status = sub?.status;
  const isActive = status === "active" || status === "trialing";
  if (!isActive) {
    throw ERR.forbidden("An active subscription is required to use credits");
  }
}
