import { getTypedSetting, DEFAULT_BILLING_MODE } from "@unisane/kernel";
import type { BillingMode } from "@unisane/kernel";

export async function getBillingMode(): Promise<BillingMode> {
  const s = await getTypedSetting<BillingMode>({
    scopeId: null, // Platform setting
    ns: "billing",
    key: "mode",
  });
  return s.value ?? DEFAULT_BILLING_MODE;
}
