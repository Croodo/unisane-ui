/**
 * Client-Safe Billing Plans
 *
 * This file contains only static plan definitions that are safe to use
 * in client components. It does NOT import any server-only modules.
 *
 * Server-only billing configuration (getBillingConfig, provider mapping
 * functions) remains in billing.ts.
 */

import {
  definePlans,
  defineTopups,
  type PlanDefinition,
  type TopupPack,
} from "@unisane/config";

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
// Topup Definitions
// ============================================================================

export const TOPUP_PACKS = defineTopups({
  "10-USD": { amount: 10, currency: "USD", credits: 10_000, label: "10K credits" },
  "50-USD": { amount: 50, currency: "USD", credits: 60_000, label: "60K credits" },
  "100-USD": { amount: 100, currency: "USD", credits: 150_000, label: "150K credits" },
  "500-USD": { amount: 500, currency: "USD", credits: 1_000_000, label: "1M credits" },
});

export type TopupKey = keyof typeof TOPUP_PACKS;
