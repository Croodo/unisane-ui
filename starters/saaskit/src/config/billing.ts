/**
 * Billing Configuration
 *
 * Type-safe billing configuration using @unisane/config.
 * Centralizes billing mode, plans, and topup definitions.
 */

import {
  defineBilling,
  definePlans,
  defineTopups,
  getPlanProviderId,
  getPlanIdFromProviderId,
  getTopupProviderId,
  type BillingConfig,
  type PlanDefinition,
  type TopupPack,
  type BillingProvider,
  type Currency,
} from "@unisane/config";
import { getEnv, createEnvJsonCache } from "@unisane/kernel";

// ============================================================================
// Billing Configuration
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
// Plan Definitions
// ============================================================================

/**
 * Default plan definitions
 * These can be overridden via BILLING_PLAN_MAP_JSON for provider IDs
 */
export const PLANS = definePlans({
  free: {
    label: "Free",
    tagline: "Evaluation & small personal projects",
    price: { amount: 0, currency: "USD", interval: "month" },
    entitlements: {
      toggles: { "analytics.pro": false },
      capacities: {
        seats: 2,
        channels: 2,
        storageGb: 50,
        analyticsRetentionDays: 90,
      },
      quotas: {
        "posts.mo": { limit: 120, window: "month" },
      },
      credits: {
        "ai.tokens": { grant: 10_000, period: "month" },
      },
      dailyFree: {
        "api.call": 50,
        "ai.generate": 2,
      },
    },
  },

  pro: {
    label: "Pro",
    tagline: "Teams that need higher limits",
    recommended: true,
    price: { amount: 29, currency: "USD", interval: "month" },
    entitlements: {
      toggles: { "analytics.pro": true },
      capacities: {
        seats: 10,
        channels: 6,
        storageGb: 200,
        analyticsRetentionDays: 180,
      },
      quotas: {
        "posts.mo": { limit: 600, window: "month" },
      },
      credits: {
        "ai.tokens": { grant: 50_000, period: "month" },
      },
      dailyFree: {
        "api.call": 2000,
        "ai.generate": 100,
      },
    },
    trial: {
      days: 14,
      requirePaymentMethod: false,
    },
  },

  pro_yearly: {
    label: "Pro (yearly)",
    tagline: "Pro plan billed annually (save ~2 months)",
    price: { amount: 290, currency: "USD", interval: "year" },
    entitlements: {
      toggles: { "analytics.pro": true },
      capacities: {
        seats: 10,
        channels: 6,
        storageGb: 200,
        analyticsRetentionDays: 180,
      },
      quotas: {
        "posts.mo": { limit: 600, window: "month" },
      },
      credits: {
        "ai.tokens": { grant: 50_000, period: "month" },
      },
      dailyFree: {
        "api.call": 2000,
        "ai.generate": 100,
      },
    },
  },

  business: {
    label: "Business",
    tagline: "Larger orgs and advanced features",
    price: { amount: 99, currency: "USD", interval: "month" },
    entitlements: {
      toggles: { "analytics.pro": true, "enterprise.sso": true },
      capacities: {
        seats: 25,
        channels: 12,
        storageGb: 1000,
        analyticsRetentionDays: 365,
      },
      quotas: {
        "posts.mo": { limit: 2000, window: "month" },
      },
      credits: {
        "ai.tokens": { grant: 200_000, period: "month" },
      },
      dailyFree: {
        "api.call": 20_000,
        "ai.generate": 1000,
      },
    },
    trial: {
      days: 14,
      requirePaymentMethod: true,
    },
  },

  business_yearly: {
    label: "Business (yearly)",
    tagline: "Business plan billed annually (save ~2 months)",
    price: { amount: 990, currency: "USD", interval: "year" },
    entitlements: {
      toggles: { "analytics.pro": true, "enterprise.sso": true },
      capacities: {
        seats: 25,
        channels: 12,
        storageGb: 1000,
        analyticsRetentionDays: 365,
      },
      quotas: {
        "posts.mo": { limit: 2000, window: "month" },
      },
      credits: {
        "ai.tokens": { grant: 200_000, period: "month" },
      },
      dailyFree: {
        "api.call": 20_000,
        "ai.generate": 1000,
      },
    },
  },
});

export type PlanId = keyof typeof PLANS;
export const PLAN_IDS = Object.keys(PLANS) as PlanId[];

// ============================================================================
// Provider ID Mapping (from environment)
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
// Topup Definitions
// ============================================================================

export const TOPUP_PACKS = defineTopups({
  "10-USD": { amount: 10, currency: "USD", credits: 10_000, label: "10K credits" },
  "50-USD": { amount: 50, currency: "USD", credits: 60_000, label: "60K credits" },
  "100-USD": { amount: 100, currency: "USD", credits: 150_000, label: "150K credits" },
  "500-USD": { amount: 500, currency: "USD", credits: 1_000_000, label: "1M credits" },
});

type TopupKey = keyof typeof TOPUP_PACKS;

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
  const providerKey = (provider ?? "").toLowerCase() as BillingProvider;
  if (providerKey !== "stripe" && providerKey !== "razorpay") return null;

  const key = `${amountMajor}-${currency.toUpperCase()}` as TopupKey;

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
// Exports
// ============================================================================

export { getBillingConfig as default };
