/**
 * Configuration Module
 *
 * Central export for all app-specific configuration.
 * Uses @unisane/config for type-safe, validated configurations.
 *
 * Structure:
 * - auth.ts      - OAuth providers, JWT settings, session config
 * - billing.ts   - Billing mode, plans, topups, provider mappings
 * - settings.ts  - Runtime settings (database-stored, UI-editable)
 * - version.ts   - App version and identity
 */

// ============================================================================
// Auth Configuration
// ============================================================================
export { getAuthConfig, getOAuthConfig } from "./auth";
export type { AuthConfig, OAuthConfig, OAuthProvider } from "./auth";

// ============================================================================
// Billing Configuration
// ============================================================================
export {
  getBillingConfig,
  PLANS,
  PLAN_IDS,
  TOPUP_PACKS,
  mapPlanIdForProvider,
  reverseMapPlanIdFromProvider,
  mapTopupPriceIdForProvider,
} from "./billing";
export type { PlanId } from "./billing";

// ============================================================================
// Runtime Settings (Database-stored)
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
// Feature Flags
// ============================================================================
export {
  FEATURES,
  METERING_FEATURES,
  isFeatureEnabled,
  getFeatureDefaults,
  getFeaturesByTag,
  getPlatformOnlyFeatures,
} from "./features";
export type { FeatureKey, MeteringKey } from "./features";

// ============================================================================
// Version Info
// ============================================================================
export {
  KIT_CHANNEL,
  KIT_ID,
  KIT_VERSION,
  KIT_BLUEPRINT_PATH,
} from "./version";
