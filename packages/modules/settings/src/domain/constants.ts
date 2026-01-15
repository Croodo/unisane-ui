/**
 * Settings Domain Constants
 *
 * Centralized constants for the settings module.
 * Eliminates magic values scattered throughout the codebase.
 */

/**
 * Event types emitted by the settings module.
 * Use these when calling events.emit() to ensure type safety.
 */
export const SETTINGS_EVENTS = {
  /** Emitted when a setting is created */
  CREATED: 'setting.created',
  /** Emitted when a setting is updated */
  UPDATED: 'setting.updated',
  /** Emitted when a setting is deleted/unset */
  DELETED: 'setting.deleted',
} as const;

/**
 * Setting visibility levels.
 */
export const SETTING_VISIBILITY = {
  /** Can be edited by any tenant admin */
  TENANT: 'tenant',
  /** Can only be edited by platform admins */
  PLATFORM_ONLY: 'platform-only',
  /** Read-only, cannot be edited */
  READONLY: 'readonly',
} as const;

export type SettingVisibility = (typeof SETTING_VISIBILITY)[keyof typeof SETTING_VISIBILITY];

/**
 * Common setting namespaces.
 */
export const SETTING_NAMESPACES = {
  /** Core application settings */
  APP: 'app',
  /** Authentication settings */
  AUTH: 'auth',
  /** Billing and subscription settings */
  BILLING: 'billing',
  /** Feature flags */
  FLAGS: 'flags',
  /** Notification settings */
  NOTIFY: 'notify',
  /** Storage settings */
  STORAGE: 'storage',
  /** AI/LLM settings */
  AI: 'ai',
} as const;

export type SettingNamespace = (typeof SETTING_NAMESPACES)[keyof typeof SETTING_NAMESPACES];

/**
 * Default values for settings operations.
 */
export const SETTINGS_DEFAULTS = {
  /** Default cache TTL for settings in milliseconds */
  CACHE_TTL_MS: 90_000, // 90 seconds
  /** Default pagination limit */
  DEFAULT_PAGE_SIZE: 50,
  /** Maximum pagination limit */
  MAX_PAGE_SIZE: 200,
  /** Platform scope identifier when scopeId is null */
  PLATFORM_SCOPE: '__platform__',
} as const;

/**
 * Collection names for the settings module.
 */
export const SETTINGS_COLLECTIONS = {
  SETTINGS: 'settings',
  SETTINGS_HISTORY: 'settings_history',
} as const;
