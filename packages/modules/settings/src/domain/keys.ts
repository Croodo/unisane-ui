/**
 * Settings Cache Keys
 *
 * Centralized cache key builders for consistent key naming.
 */

import { KV } from '@unisane/kernel';

/**
 * Cache key builders for the settings module.
 *
 * @example
 * ```typescript
 * import { settingsKeys } from '@unisane/settings';
 *
 * const cached = await cacheGet(settingsKeys.setting('production', 'app', 'theme', tenantId));
 * ```
 */
export const settingsKeys = {
  // ════════════════════════════════════════════════════════════════════════════
  // Setting Keys
  // ════════════════════════════════════════════════════════════════════════════

  /** Cache key for a specific setting lookup */
  setting: (env: string, namespace: string, key: string, tenantId: string | null) =>
    `${KV.SETTING}${env}:${namespace}:${key}:${tenantId ?? '__platform__'}` as const,

  /** Cache key for all settings in a namespace */
  namespace: (env: string, namespace: string, tenantId: string | null) =>
    `${KV.SETTING}${env}:${namespace}:*:${tenantId ?? '__platform__'}` as const,

  /** Cache key for all tenant settings */
  tenantSettings: (env: string, tenantId: string) =>
    `${KV.SETTING}${env}:*:*:${tenantId}` as const,

  /** Cache key for all platform settings */
  platformSettings: (env: string) =>
    `${KV.SETTING}${env}:*:*:__platform__` as const,
} as const;

/**
 * Type for cache key functions.
 */
export type SettingsKeyBuilder = typeof settingsKeys;

/**
 * @deprecated Use settingsKeys.setting() instead. Will be removed in next major version.
 */
export function settingCacheKey(env: string, ns: string, key: string, tenantId: string | null) {
  return settingsKeys.setting(env, ns, key, tenantId);
}
