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
 * const cached = await cacheGet(settingsKeys.setting('production', 'app', 'theme', scopeId));
 * ```
 */
export const settingsKeys = {
  // ════════════════════════════════════════════════════════════════════════════
  // Setting Keys
  // ════════════════════════════════════════════════════════════════════════════

  /** Cache key for a specific setting lookup */
  setting: (env: string, namespace: string, key: string, scopeId: string | null) =>
    `${KV.SETTING}${env}:${namespace}:${key}:${scopeId ?? '__platform__'}` as const,

  /** Cache key for all settings in a namespace */
  namespace: (env: string, namespace: string, scopeId: string | null) =>
    `${KV.SETTING}${env}:${namespace}:*:${scopeId ?? '__platform__'}` as const,

  /** Cache key for all tenant settings */
  tenantSettings: (env: string, scopeId: string) =>
    `${KV.SETTING}${env}:*:*:${scopeId}` as const,

  /** Cache key for all platform settings */
  platformSettings: (env: string) =>
    `${KV.SETTING}${env}:*:*:__platform__` as const,
} as const;

/**
 * Type for cache key functions.
 */
export type SettingsKeyBuilder = typeof settingsKeys;
