/**
 * @module @unisane/settings
 * @description Typed key-value settings with version control, caching, and pub/sub invalidation
 * @layer 2
 *
 * @example
 * ```typescript
 * import { getSetting, patchSetting, settingsKeys } from '@unisane/settings';
 *
 * // Read a setting
 * const theme = await getSetting({ ns: 'app', key: 'theme', tenantId });
 *
 * // Update with optimistic locking
 * const result = await patchSetting({
 *   namespace: 'app',
 *   key: 'theme',
 *   value: 'dark',
 *   tenantId,
 *   expectedVersion: theme?.version,
 * });
 * ```
 */

// ════════════════════════════════════════════════════════════════════════════
// Domain - Schemas & Types
// ════════════════════════════════════════════════════════════════════════════

export * from "./domain/schemas";
export * from "./domain/types";

// ════════════════════════════════════════════════════════════════════════════
// Domain - Errors
// ════════════════════════════════════════════════════════════════════════════

export {
  SettingNotFoundError,
  SettingVersionConflictError,
  SettingAccessDeniedError,
  SettingValidationError,
  UnknownNamespaceError,
} from "./domain/errors";

// ════════════════════════════════════════════════════════════════════════════
// Domain - Constants
// ════════════════════════════════════════════════════════════════════════════

export {
  SETTINGS_EVENTS,
  SETTING_VISIBILITY,
  SETTING_NAMESPACES,
  SETTINGS_DEFAULTS,
  SETTINGS_COLLECTIONS,
} from "./domain/constants";
export type { SettingVisibility, SettingNamespace } from "./domain/constants";

// ════════════════════════════════════════════════════════════════════════════
// Domain - Cache Keys
// ════════════════════════════════════════════════════════════════════════════

export { settingsKeys, settingCacheKey } from "./domain/keys";
export type { SettingsKeyBuilder } from "./domain/keys";

// ════════════════════════════════════════════════════════════════════════════
// Services - Read Operations
// ════════════════════════════════════════════════════════════════════════════

export { getSetting, initSettingsSubscriber } from "./service/read";
export { getTypedSetting } from "./service/readTyped";

// ════════════════════════════════════════════════════════════════════════════
// Services - Write Operations
// ════════════════════════════════════════════════════════════════════════════

export { patchSetting } from "./service/patch";
export { patchSettingWithPolicy } from "./service/patchWithPolicy";
