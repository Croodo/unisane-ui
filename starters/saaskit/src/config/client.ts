/**
 * Client-safe Configuration Exports
 *
 * This file only exports configuration that can be used in client components.
 * It does NOT import any server-only modules (like @unisane/kernel with async_hooks).
 */

// ============================================================================
// Runtime Settings
// ============================================================================
export {
  SETTING_DEFINITIONS,
  getSettingDefinition,
  getAllDefinitions,
  getPlatformDefinitions,
  getUIDefinitions,
} from "./settings";
export type {
  SettingDefinition,
  SettingKey,
  SettingValueType,
} from "./settings";

// ============================================================================
// Billing (client-safe exports only)
// ============================================================================
export {
  PLANS,
  PLAN_IDS,
  TOPUP_PACKS,
} from "./billing-plans";
export type { PlanId, TopupKey } from "./billing-plans";

// Re-export client-safe types from @unisane/config
export type {
  BillingMode,
  BillingProvider,
  Currency,
  PlanDefinition,
  PlanEntitlements,
  PlanPrice,
} from "@unisane/config/client";

export {
  BILLING_MODES,
  BILLING_PROVIDERS,
  CURRENCIES,
  DEFAULT_BILLING_MODE,
} from "@unisane/config/client";

// ============================================================================
// Feature Flags (client-safe)
// ============================================================================
export {
  FEATURES,
  METERING_FEATURES,
  isFeatureEnabled,
  getFeatureDefaults,
} from "./features";
export type { FeatureKey, MeteringKey } from "./features";

// Re-export feature types from @unisane/config
export type {
  FeatureDefinition,
  FeatureScope,
} from "@unisane/config/client";

export { FEATURE_SCOPES } from "@unisane/config/client";

// ============================================================================
// Version Info
// ============================================================================
export {
  KIT_CHANNEL,
  KIT_ID,
  KIT_VERSION,
  KIT_BLUEPRINT_PATH,
} from "./version";
