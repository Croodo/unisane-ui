import { getBillingProvider } from "@unisane/kernel";
import { creditsForPurchase } from "@unisane/kernel";
import { toMinorStrCurrency } from "@unisane/kernel";
import { getBillingMode } from "./mode";
import { ERR } from "@unisane/gateway";
import { getEnv } from "@unisane/kernel";

export async function topup(args: {
  tenantId: string;
  amount: number;
  currency: string;
  description?: string;
  successUrl?: string;
  cancelUrl?: string;
}) {
  const mode = await getBillingMode();
  if (mode === "subscription" || mode === "disabled") {
    throw ERR.validation("Top-ups are disabled for this deployment.");
  }
  const { PUBLIC_BASE_URL } = getEnv();
  const normalizeUrl = (url?: string): string => {
    const trimmed = (url ?? "").trim();
    if (trimmed && /^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed && trimmed.startsWith("/") && PUBLIC_BASE_URL) {
      const base = PUBLIC_BASE_URL.replace(/\/$/, "");
      return `${base}${trimmed}`;
    }
    if (PUBLIC_BASE_URL) return PUBLIC_BASE_URL;
    throw ERR.VALID(
      "Invalid redirect URL for top-up; expected an absolute URL starting with http:// or https://."
    );
  };
  const successUrl = normalizeUrl(args.successUrl);
  const cancelUrl = normalizeUrl(args.cancelUrl);
  const provider = getBillingProvider();
  // Convert major units to minor string using currency-aware decimals
  const amountMinorStr = toMinorStrCurrency(args.amount, args.currency);
  const credits = creditsForPurchase(args.amount, args.currency);
  const res = await provider.createTopupCheckout({
    tenantId: args.tenantId,
    amountMinorStr,
    currency: args.currency.toUpperCase(),
    credits,
    successUrl,
    cancelUrl,
  });
  return res; // { url }
}
