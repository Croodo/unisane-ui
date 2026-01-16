/**
 * @unisane/config/client
 *
 * Client-safe exports for browser environments.
 * Does not include Zod-heavy schema definitions or Node.js dependencies.
 */

// ============================================================================
// Settings Types (client-safe)
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

export {
  SettingRegistry,
  getSettingRegistry,
  createSettingRegistry,
} from "./registry";

// ============================================================================
// Auth Types (client-safe constants and types)
// ============================================================================
export {
  OAUTH_PROVIDERS,
  COOKIE_SAMESITE,
  type AuthConfig,
  type OAuthProvider,
  type CookieSameSite,
} from "./auth";

// ============================================================================
// Billing Types (client-safe constants and types)
// ============================================================================
export {
  // Constants
  BILLING_MODES,
  BILLING_PROVIDERS,
  CURRENCIES,
  QUOTA_WINDOWS,
  CREDIT_PERIODS,
  BILLING_INTERVALS,
  DEFAULT_BILLING_MODE,

  // Types only (no Zod schemas)
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
// Feature Flags Types (client-safe)
// ============================================================================
export {
  FeatureRegistry,
  FEATURE_SCOPES,
  type FeatureDefinition,
  type FeatureDefinitions,
  type FeatureScope,
  type MeteringFeature,
  type InferFeatureKey,
  type InferMeteringKey,
} from "./features";

// Note: `define`, `defineEnv`, `defineAuth`, `defineBilling`, etc. are NOT
// exported from client entry point because they use Zod which adds bundle size.
// Configuration should be defined server-side; client components use types only.
