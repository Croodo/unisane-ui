/**
 * Topup Map Configuration
 *
 * Maps topup amounts to provider-specific price/plan IDs.
 * Keys are of the form "<amount>-<CURRENCY>", e.g. "10-USD".
 *
 * Configuration via BILLING_TOPUP_MAP_JSON env var:
 * {
 *   "stripe": { "10-USD": "price_...", "50-USD": "price_..." },
 *   "razorpay": { "10-USD": "plan_...", "50-USD": "plan_..." }
 * }
 */

import { getEnv, createEnvJsonCache } from "@unisane/kernel";
import type { BillingProvider } from "@unisane/kernel";

type Provider = BillingProvider;
type TopupMap = Partial<Record<BillingProvider, Record<string, string>>>;

const getTopupMap = createEnvJsonCache<TopupMap>(
  () => getEnv().BILLING_TOPUP_MAP_JSON,
  (obj) => (obj && typeof obj === "object" ? (obj as TopupMap) : {}),
  {}
);

function parseTopupMapFromEnv(): TopupMap {
  return getTopupMap();
}

/**
 * Resolve a provider-specific price/plan id for a top-up pack.
 * Keys are of the form "<amount>-<CURRENCY>", e.g. "10-USD".
 */
export function mapTopupPriceIdForProvider(
  providerRaw: string | undefined,
  amountMajor: number,
  currency: string
): string | null {
  const provider = (providerRaw ?? "").toLowerCase() as Provider;
  if (provider !== "stripe" && provider !== "razorpay") return null;
  const map = parseTopupMapFromEnv()[provider] ?? {};
  const key = `${amountMajor}-${currency.toUpperCase()}`;
  return map[key] ?? null;
}
