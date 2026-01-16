/**
 * Client-safe Configuration Exports
 *
 * This file only exports configuration that can be used in client components.
 * It does NOT import any server-only modules (like @unisane/kernel with async_hooks).
 */

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

export {
  KIT_CHANNEL,
  KIT_ID,
  KIT_VERSION,
  KIT_BLUEPRINT_PATH,
} from './version';
