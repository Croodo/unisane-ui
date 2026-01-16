/**
 * Billing Configuration (Server-Only)
 *
 * This file contains server-only billing configuration that requires
 * @unisane/kernel (Node.js APIs like async_hooks).
 *
 * For client-safe plan definitions, import from './billing-plans'.
 */

import {
  defineBilling,
  getPlanIdFromProviderId,
  type BillingConfig,
  type BillingProvider,
  type Currency,
} from "@unisane/config";
import { getEnv, createEnvJsonCache } from "@unisane/kernel";

// Re-export client-safe definitions for server code that imports from here
export { PLANS, PLAN_IDS, TOPUP_PACKS } from "./billing-plans";
export type { PlanId, TopupKey } from "./billing-plans";

// ============================================================================
// Billing Configuration (Server-Only)
// ============================================================================

let cachedBillingConfig: BillingConfig | null = null;

export function getBillingConfig(): BillingConfig {
  if (cachedBillingConfig) return cachedBillingConfig;

  const env = getEnv();

  cachedBillingConfig = defineBilling({
    mode: "subscription_with_credits",
    defaultCurrency: (env.NEXT_PUBLIC_BILLING_CURRENCY ?? "USD") as Currency,
    defaultProvider: env.BILLING_PROVIDER as BillingProvider | undefined,
    providers: {
      stripe: {
        enabled: Boolean(env.STRIPE_SECRET_KEY),
        webhookSecret: env.STRIPE_WEBHOOK_SECRET,
        portalReturnUrl: env.BILLING_PORTAL_RETURN_URL,
      },
      razorpay: {
        enabled: Boolean(env.RAZORPAY_KEY_ID),
        webhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
      },
    },
    alertEmail: env.BILLING_ALERT_EMAIL,
    gracePeriodDays: 3,
    defaultTrialDays: 14,
  });

  return cachedBillingConfig;
}

// ============================================================================
// Provider ID Mapping (Server-Only - requires env access)
// ============================================================================

type ProviderPlanMap = Partial<Record<BillingProvider, Record<string, string>>>;

const getPlanMapFromEnv = createEnvJsonCache<ProviderPlanMap>(
  () => getEnv().BILLING_PLAN_MAP_JSON,
  (obj) => (obj && typeof obj === "object" ? (obj as ProviderPlanMap) : {}),
  {}
);

/**
 * Get provider-specific plan ID (e.g., Stripe price_xxx)
 */
export function mapPlanIdForProvider(
  provider: BillingProvider | string | undefined,
  planId: string
): string {
  // Import PLANS lazily to avoid circular dependency issues
  const { PLANS } = require("./billing-plans");
  type PlanId = keyof typeof PLANS;

  const providerKey = (provider ?? "").toLowerCase() as BillingProvider;
  if (providerKey !== "stripe" && providerKey !== "razorpay") return planId;

  // First check env mapping
  const envMap = getPlanMapFromEnv()[providerKey] ?? {};
  if (envMap[planId]) return envMap[planId];

  // Then check plan definition
  const plan = PLANS[planId as PlanId];
  if (plan?.providerIds?.[providerKey]) {
    return plan.providerIds[providerKey];
  }

  return planId;
}

/**
 * Reverse lookup: get plan ID from provider-specific ID
 */
export function reverseMapPlanIdFromProvider(
  provider: BillingProvider | string | undefined,
  providerPlanId: string
): string {
  // Import PLANS lazily to avoid circular dependency issues
  const { PLANS } = require("./billing-plans");

  const providerKey = (provider ?? "").toLowerCase() as BillingProvider;
  if (providerKey !== "stripe" && providerKey !== "razorpay") return providerPlanId;

  // Check env mapping
  const envMap = getPlanMapFromEnv()[providerKey] ?? {};
  for (const [friendly, prov] of Object.entries(envMap)) {
    if (prov === providerPlanId) return friendly;
  }

  // Check plan definitions
  const result = getPlanIdFromProviderId(PLANS, providerPlanId, providerKey);
  return result ?? providerPlanId;
}

// ============================================================================
// Topup Provider Mapping (Server-Only)
// ============================================================================

const getTopupMapFromEnv = createEnvJsonCache<ProviderPlanMap>(
  () => getEnv().BILLING_TOPUP_MAP_JSON,
  (obj) => (obj && typeof obj === "object" ? (obj as ProviderPlanMap) : {}),
  {}
);

/**
 * Get provider-specific price ID for a topup
 */
export function mapTopupPriceIdForProvider(
  provider: BillingProvider | string | undefined,
  amountMajor: number,
  currency: string
): string | null {
  // Import TOPUP_PACKS lazily to avoid circular dependency issues
  const { TOPUP_PACKS } = require("./billing-plans");

  const providerKey = (provider ?? "").toLowerCase() as BillingProvider;
  if (providerKey !== "stripe" && providerKey !== "razorpay") return null;

  const key = `${amountMajor}-${currency.toUpperCase()}`;

  // First check env mapping
  const envMap = getTopupMapFromEnv()[providerKey] ?? {};
  if (envMap[key]) return envMap[key];

  // Then check topup definition
  const pack = TOPUP_PACKS[key];
  if (pack?.providerIds?.[providerKey]) {
    return pack.providerIds[providerKey];
  }

  return null;
}

// ============================================================================
// Default Export
// ============================================================================

export { getBillingConfig as default };
