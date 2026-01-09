import { getTenantId, getBillingProvider, getEnv } from "@unisane/kernel";
import { ERR } from "@unisane/gateway";
import { getBillingMode } from "./mode";
import { findCustomerId } from "../data/tenant-integrations.repository";

export async function portal() {
  const tenantId = getTenantId();
  const mode = await getBillingMode();
  if (mode === "topup_only" || mode === "disabled") {
    throw ERR.validation(
      "Billing portal is only available for subscription deployments."
    );
  }
  const customerId = await findCustomerId(tenantId, "stripe");
  if (!customerId) {
    throw ERR.validation("No billing customer found for this tenant.");
  }
  const provider = getBillingProvider();
  const { PUBLIC_BASE_URL } = getEnv();
  const returnUrl = PUBLIC_BASE_URL
    ? `${PUBLIC_BASE_URL}/settings/billing`
    : "/settings/billing";
  try {
    const session = await provider.createPortalSession({
      customerId,
      returnUrl,
    });
    return { url: session.url };
  } catch (e) {
    const msg = (e as Error)?.message ?? "Portal unavailable";
    throw ERR.validation(msg);
  }
}
