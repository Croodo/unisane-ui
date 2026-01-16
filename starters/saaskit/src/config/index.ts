/**
 * Configuration Module
 *
 * Central export for all app-specific configuration.
 * Users customize these files for their SaaS application.
 *
 * Structure:
 * - auth.ts      - OAuth providers, JWT settings
 * - planMap.ts   - Plan → Provider ID mapping
 * - topupMap.ts  - Topup → Price ID mapping
 * - settings.ts  - Settings SSOT (schemas, defaults, UI)
 * - version.ts   - App version and identity
 */

// Auth configuration
export { getAuthConfig } from './auth';
export type { AuthConfig } from './auth';

// Billing mappings
export { mapPlanIdForProvider, reverseMapPlanIdFromProvider } from './planMap';
export { mapTopupPriceIdForProvider } from './topupMap';

// Settings SSOT
export {
  SETTING_DEFINITIONS,
  getSettingDefinition,
  getAllDefinitions,
  getPlatformDefinitions,
  getUIDefinitions,
} from './settings';
export type {
  SettingDefinition,
  SettingKey,
  SettingValueType,
} from './settings';

// Version info
export {
  KIT_CHANNEL,
  KIT_ID,
  KIT_VERSION,
  KIT_BLUEPRINT_PATH,
} from './version';
