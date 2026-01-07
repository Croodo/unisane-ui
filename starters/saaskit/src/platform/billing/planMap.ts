// Optional mapping to translate friendly plan codes (e.g., "pro")
// to provider-specific identifiers (Stripe price IDs or Razorpay plan_ids).
// Shape:
// {
//   "stripe": { "free": "price_...", "pro": "price_..." },
//   "razorpay": { "free": "plan_...", "pro": "plan_..." }
// }
import { getEnv } from "@/src/shared/env";
import type { BillingProvider } from "@/src/shared/constants/providers";
import { createEnvJsonCache } from "@/src/shared/envJson";

type Provider = BillingProvider;
type PlanMap = Partial<Record<BillingProvider, Record<string, string>>>;

const getPlanMap = createEnvJsonCache<PlanMap>(
  () => getEnv().BILLING_PLAN_MAP_JSON,
  (obj) => (obj && typeof obj === "object" ? (obj as PlanMap) : {}),
  {}
);

function parseMapFromEnv(): PlanMap {
  return getPlanMap();
}

export function mapPlanIdForProvider(
  providerRaw: string | undefined,
  planId: string
): string {
  const provider = (providerRaw ?? "").toLowerCase() as Provider;
  if (provider !== "stripe" && provider !== "razorpay") return planId;
  const m = parseMapFromEnv()[provider] ?? {};
  return m[planId] ?? planId;
}

// Reverse lookup: given a provider plan/price ID, find the friendly plan code
export function reverseMapPlanIdFromProvider(
  providerRaw: string | undefined,
  providerPlanId: string
): string {
  const provider = (providerRaw ?? "").toLowerCase() as Provider;
  if (provider !== "stripe" && provider !== "razorpay") return providerPlanId;
  const m = parseMapFromEnv()[provider] ?? {};
  for (const [friendly, prov] of Object.entries(m)) {
    if (prov === providerPlanId) return friendly;
  }
  return providerPlanId;
}
