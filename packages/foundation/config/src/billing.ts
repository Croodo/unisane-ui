import { z } from "zod";

/**
 * Billing Configuration Schema
 *
 * Type-safe billing and plan configuration with validation.
 *
 * @example
 * ```ts
 * const billing = defineBilling({
 *   mode: "subscription_with_credits",
 *   defaultCurrency: "USD",
 *   providers: {
 *     stripe: { enabled: true },
 *     razorpay: { enabled: false },
 *   },
 * });
 *
 * const plans = definePlans({
 *   free: {
 *     label: "Free",
 *     price: { amount: 0, currency: "USD", interval: "month" },
 *     entitlements: {
 *       capacities: { seats: 2, storageGb: 5 },
 *       quotas: { "api.calls": { limit: 1000, window: "month" } },
 *     },
 *   },
 *   pro: {
 *     label: "Pro",
 *     price: { amount: 29, currency: "USD", interval: "month" },
 *     entitlements: {
 *       capacities: { seats: 10, storageGb: 100 },
 *       quotas: { "api.calls": { limit: 50000, window: "month" } },
 *       credits: { "ai.tokens": { grant: 50000, period: "month" } },
 *     },
 *   },
 * });
 * ```
 */

// ============================================================================
// Billing Mode
// ============================================================================

export const BILLING_MODES = [
  "subscription",
  "credits",
  "subscription_with_credits",
] as const;

export type BillingMode = (typeof BILLING_MODES)[number];
export const ZBillingMode = z.enum(BILLING_MODES);
export const DEFAULT_BILLING_MODE: BillingMode = "subscription";

// ============================================================================
// Billing Providers
// ============================================================================

export const BILLING_PROVIDERS = ["stripe", "razorpay"] as const;
export type BillingProvider = (typeof BILLING_PROVIDERS)[number];
export const ZBillingProvider = z.enum(BILLING_PROVIDERS);

// ============================================================================
// Currencies
// ============================================================================

export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD"] as const;
export type Currency = (typeof CURRENCIES)[number];
export const ZCurrency = z.enum(CURRENCIES);

// ============================================================================
// Plan Entitlements
// ============================================================================

export const QUOTA_WINDOWS = ["day", "month", "year"] as const;
export type QuotaWindow = (typeof QUOTA_WINDOWS)[number];
export const ZQuotaWindow = z.enum(QUOTA_WINDOWS);

export const CREDIT_PERIODS = ["month", "year"] as const;
export type CreditPeriod = (typeof CREDIT_PERIODS)[number];
export const ZCreditPeriod = z.enum(CREDIT_PERIODS);

export const ZQuota = z.object({
  limit: z.number().int().nonnegative(),
  window: ZQuotaWindow,
});
export type Quota = z.infer<typeof ZQuota>;

export const ZCreditGrant = z.object({
  grant: z.number().int().nonnegative(),
  period: ZCreditPeriod.optional(),
});
export type CreditGrant = z.infer<typeof ZCreditGrant>;

export const ZPlanEntitlements = z.object({
  // Feature toggles (e.g., "analytics.pro": true)
  toggles: z.record(z.string(), z.boolean()).default({}),

  // Numeric capacities (e.g., seats: 10, storageGb: 100)
  capacities: z.record(z.string(), z.number().int().nonnegative()).default({}),

  // Rate-limited quotas (e.g., "api.calls": { limit: 1000, window: "month" })
  quotas: z.record(z.string(), ZQuota).default({}),

  // Credit grants (e.g., "ai.tokens": { grant: 50000, period: "month" })
  credits: z.record(z.string(), ZCreditGrant).default({}),

  // Per-feature daily freebies for metering
  dailyFree: z.record(z.string(), z.number().int().nonnegative()).optional(),
});

export type PlanEntitlements = z.infer<typeof ZPlanEntitlements>;

// ============================================================================
// Plan Definition
// ============================================================================

export const BILLING_INTERVALS = ["month", "year"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];
export const ZBillingInterval = z.enum(BILLING_INTERVALS);

export const ZPlanPrice = z.object({
  amount: z.number().nonnegative(),
  currency: ZCurrency,
  interval: ZBillingInterval,
});
export type PlanPrice = z.infer<typeof ZPlanPrice>;

export const ZPlanDefinition = z.object({
  // Display info
  label: z.string().min(1),
  tagline: z.string().optional(),
  description: z.string().optional(),
  recommended: z.boolean().optional(),
  features: z.array(z.string()).optional(), // Marketing bullets

  // Pricing
  price: ZPlanPrice.optional(),

  // Entitlements
  entitlements: ZPlanEntitlements,

  // Provider mappings (plan code -> provider price/plan ID)
  providerIds: z
    .record(ZBillingProvider, z.string())
    .optional(),

  // Metadata
  hidden: z.boolean().optional(), // Hide from public plan selection
  legacy: z.boolean().optional(), // Grandfathered plan
  trial: z
    .object({
      days: z.number().int().positive(),
      requirePaymentMethod: z.boolean().default(false),
    })
    .optional(),
});

export type PlanDefinition = z.infer<typeof ZPlanDefinition>;

// ============================================================================
// Billing Configuration
// ============================================================================

export const ZBillingConfig = z.object({
  mode: ZBillingMode.default(DEFAULT_BILLING_MODE),
  defaultCurrency: ZCurrency.default("USD"),
  defaultProvider: ZBillingProvider.optional(),

  // Provider-specific settings
  providers: z
    .record(
      ZBillingProvider,
      z.object({
        enabled: z.boolean().default(false),
        webhookSecret: z.string().optional(),
        portalReturnUrl: z.string().url().optional(),
      })
    )
    .optional(),

  // Alert email for billing issues
  alertEmail: z.string().email().optional(),

  // Grace period for failed payments (days)
  gracePeriodDays: z.number().int().nonnegative().default(3),

  // Trial defaults
  defaultTrialDays: z.number().int().nonnegative().default(14),
});

export type BillingConfig = z.infer<typeof ZBillingConfig>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Define billing configuration with validation
 */
export function defineBilling(config: Partial<BillingConfig>): BillingConfig {
  return ZBillingConfig.parse(config);
}

/**
 * Define plans with validation and type inference
 */
export function definePlans<T extends Record<string, Partial<PlanDefinition>>>(
  plans: T
): { [K in keyof T]: PlanDefinition } {
  const result = {} as { [K in keyof T]: PlanDefinition };

  for (const [id, plan] of Object.entries(plans)) {
    result[id as keyof T] = ZPlanDefinition.parse(plan);
  }

  return result;
}

/**
 * Create a plan ID type from plan definitions
 */
export type InferPlanId<T extends Record<string, PlanDefinition>> = keyof T & string;

/**
 * Topup pack definition
 */
export const ZTopupPack = z.object({
  amount: z.number().positive(),
  currency: ZCurrency,
  credits: z.number().int().positive(),
  label: z.string().optional(),
  providerIds: z.record(ZBillingProvider, z.string()).optional(),
});

export type TopupPack = z.infer<typeof ZTopupPack>;

/**
 * Define topup packs with validation
 */
export function defineTopups<T extends Record<string, Partial<TopupPack>>>(
  packs: T
): { [K in keyof T]: TopupPack } {
  const result = {} as { [K in keyof T]: TopupPack };

  for (const [id, pack] of Object.entries(packs)) {
    result[id as keyof T] = ZTopupPack.parse(pack);
  }

  return result;
}

// ============================================================================
// Provider ID Mapping Utilities
// ============================================================================

/**
 * Get provider-specific ID for a plan
 */
export function getPlanProviderId(
  plans: Record<string, PlanDefinition>,
  planId: string,
  provider: BillingProvider
): string | null {
  const plan = plans[planId];
  if (!plan) return null;
  return plan.providerIds?.[provider] ?? null;
}

/**
 * Reverse lookup: get plan ID from provider-specific ID
 */
export function getPlanIdFromProviderId(
  plans: Record<string, PlanDefinition>,
  providerPlanId: string,
  provider: BillingProvider
): string | null {
  for (const [planId, plan] of Object.entries(plans)) {
    if (plan.providerIds?.[provider] === providerPlanId) {
      return planId;
    }
  }
  return null;
}

/**
 * Get topup key from amount and currency
 */
export function getTopupKey(amount: number, currency: Currency): string {
  return `${amount}-${currency}`;
}

/**
 * Get provider-specific ID for a topup pack
 */
export function getTopupProviderId(
  packs: Record<string, TopupPack>,
  amount: number,
  currency: Currency,
  provider: BillingProvider
): string | null {
  const key = getTopupKey(amount, currency);
  const pack = packs[key];
  if (!pack) return null;
  return pack.providerIds?.[provider] ?? null;
}
