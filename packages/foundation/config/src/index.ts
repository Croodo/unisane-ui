/**
 * @unisane/config
 *
 * Unified, type-safe configuration system for the Unisane ecosystem.
 *
 * ## Quick Start
 *
 * ```ts
 * import {
 *   define,
 *   defineEnv,
 *   defineAuth,
 *   defineBilling,
 *   definePlans,
 *   defineFeatures,
 *   getSettingRegistry,
 * } from "@unisane/config";
 *
 * // Runtime settings
 * const SETTINGS = {
 *   "auth.otpTtlSeconds": define.number("auth", "otpTtlSeconds", {
 *     default: 600,
 *     min: 60,
 *     max: 3600,
 *     label: "OTP TTL (seconds)",
 *   }),
 * };
 *
 * // Environment variables
 * const envConfig = defineEnv({
 *   DATABASE_URL: env.string().url(),
 *   LOG_LEVEL: env.enum(["debug", "info", "warn", "error"]).default("info"),
 * }).build();
 *
 * // Auth configuration
 * const authConfig = defineAuth({
 *   accessTokenTtlSec: 2592000,
 *   oauthProviders: ["google", "github"],
 * });
 *
 * // Billing configuration
 * const billingConfig = defineBilling({
 *   mode: "subscription_with_credits",
 *   defaultCurrency: "USD",
 * });
 *
 * // Plan definitions
 * const plans = definePlans({
 *   free: {
 *     label: "Free",
 *     price: { amount: 0, currency: "USD", interval: "month" },
 *     entitlements: { capacities: { seats: 2 } },
 *   },
 *   pro: {
 *     label: "Pro",
 *     price: { amount: 29, currency: "USD", interval: "month" },
 *     entitlements: { capacities: { seats: 10 } },
 *   },
 * });
 *
 * // Feature flags
 * const features = defineFeatures({
 *   "ai.enabled": {
 *     label: "AI Features",
 *     default: false,
 *     scope: "tenant",
 *   },
 * });
 * ```
 */

// ============================================================================
// Settings (Runtime Database Config)
// ============================================================================
export type {
  Scope,
  Visibility,
  UICategory,
  UIInputType,
  SelectOption,
  UIConfig,
  SettingDefinition,
  SettingKey,
  SettingDefinitions,
  InferSettingValue,
} from "./types";

export { define } from "./define";

export {
  SettingRegistry,
  getSettingRegistry,
  createSettingRegistry,
} from "./registry";

// ============================================================================
// Environment Variables
// ============================================================================
export { defineEnv, env, EnvBuilder, type InferEnv } from "./env";

// ============================================================================
// Auth Configuration
// ============================================================================
export {
  defineAuth,
  defineOAuth,
  ZAuthConfig,
  ZOAuthConfig,
  ZOAuthCredentials,
  ZOAuthProvider,
  ZCookieSameSite,
  OAUTH_PROVIDERS,
  COOKIE_SAMESITE,
  type AuthConfig,
  type OAuthConfig,
  type OAuthCredentials,
  type OAuthProvider,
  type CookieSameSite,
} from "./auth";

// ============================================================================
// Billing Configuration
// ============================================================================
export {
  // Config helpers
  defineBilling,
  definePlans,
  defineTopups,

  // Lookup helpers
  getPlanProviderId,
  getPlanIdFromProviderId,
  getTopupKey,
  getTopupProviderId,

  // Schemas
  ZBillingConfig,
  ZBillingMode,
  ZBillingProvider,
  ZCurrency,
  ZPlanDefinition,
  ZPlanEntitlements,
  ZPlanPrice,
  ZTopupPack,
  ZQuota,
  ZCreditGrant,
  ZQuotaWindow,
  ZCreditPeriod,
  ZBillingInterval,

  // Constants
  BILLING_MODES,
  BILLING_PROVIDERS,
  CURRENCIES,
  QUOTA_WINDOWS,
  CREDIT_PERIODS,
  BILLING_INTERVALS,
  DEFAULT_BILLING_MODE,

  // Types
  type BillingConfig,
  type BillingMode,
  type BillingProvider,
  type Currency,
  type PlanDefinition,
  type PlanEntitlements,
  type PlanPrice,
  type TopupPack,
  type Quota,
  type CreditGrant,
  type QuotaWindow,
  type CreditPeriod,
  type BillingInterval,
  type InferPlanId,
} from "./billing";

// ============================================================================
// Feature Flags
// ============================================================================
export {
  defineFeatures,
  defineMeteringFeatures,
  FeatureRegistry,
  ZFeatureDefinition,
  ZFeatureScope,
  ZMeteringFeature,
  FEATURE_SCOPES,
  type FeatureDefinition,
  type FeatureDefinitions,
  type FeatureScope,
  type MeteringFeature,
  type InferFeatureKey,
  type InferMeteringKey,
} from "./features";
