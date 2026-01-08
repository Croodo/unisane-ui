import { SubscriptionsRepository } from "../data/subscriptions.repository";
import { getBillingProvider } from "@unisane/kernel";
import { getBillingMode } from "./mode";
import { ERR } from "@unisane/gateway";

export async function changeQuantity(args: {
  tenantId: string;
  quantity: number;
}) {
  const mode = await getBillingMode();
  // Quantity‑driven seat changes are only supported for classic
  // subscription deployments. Hybrid/credits setups use plan policy
  // for seats instead of Stripe quantity.
  if (mode !== "subscription") {
    throw ERR.validation("Subscription quantity changes are disabled for this deployment.");
  }
  const q = Math.max(1, Math.trunc(args.quantity));
  const providerSubId = await SubscriptionsRepository.getLatestProviderSubId(args.tenantId);
  if (!providerSubId) return { ok: false as const, error: 'NO_SUBSCRIPTION' };
  const provider = getBillingProvider();
  await provider.updateSubscriptionQuantity({ tenantId: args.tenantId, providerSubId, quantity: q });
  await SubscriptionsRepository.setQuantity(args.tenantId, q);
  return { ok: true as const };
}
