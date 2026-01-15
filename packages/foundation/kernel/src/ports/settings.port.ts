/**
 * Settings Port
 *
 * This port defines the contract for accessing settings.
 * Modules depend on this interface, the settings module implements it.
 * This eliminates direct coupling between modules and the settings module.
 */

import { setGlobalProvider, getGlobalProvider, hasGlobalProvider } from './global-provider';

const PROVIDER_KEY = 'settings';

/**
 * Port interface for reading typed settings.
 */
export interface SettingsPort {
  /**
   * Get a typed setting value.
   * Returns the value and version, or uses default from schema if not set.
   */
  getTypedSetting<T>(args: {
    scopeId: string | null;
    ns: string;
    key: string;
    env?: string;
  }): Promise<{ value: T; version: number }>;

  /**
   * Get a raw setting value.
   * Returns the value and version, or null if not set.
   */
  getSetting(args: {
    scopeId: string | null;
    ns: string;
    key: string;
    env?: string;
  }): Promise<{ value: unknown; version: number } | null>;

  /**
   * Patch a setting value.
   * Returns the new version.
   */
  patchSetting(args: {
    scopeId: string | null;
    ns: string;
    key: string;
    value: unknown;
    expectedVersion?: number;
  }): Promise<{ version: number }>;
}

/**
 * Set the settings provider implementation.
 * Call this at app bootstrap before any settings access.
 */
export function setSettingsProvider(provider: SettingsPort): void {
  setGlobalProvider(PROVIDER_KEY, provider);
}

/**
 * Get the settings provider.
 * Throws if not configured.
 */
export function getSettingsProvider(): SettingsPort {
  const provider = getGlobalProvider<SettingsPort>(PROVIDER_KEY);
  if (!provider) {
    throw new Error(
      "SettingsPort not configured. Call setSettingsProvider() at bootstrap."
    );
  }
  return provider;
}

/**
 * Check if provider is configured.
 */
export function hasSettingsProvider(): boolean {
  return hasGlobalProvider(PROVIDER_KEY);
}

/**
 * Convenience function to get a typed setting.
 * This is the primary API for reading settings from other modules.
 */
export async function getTypedSetting<T>(args: {
  scopeId: string | null;
  ns: string;
  key: string;
  env?: string;
}): Promise<{ value: T; version: number }> {
  return getSettingsProvider().getTypedSetting<T>(args);
}

/**
 * Convenience function to get a raw setting.
 */
export async function getSetting(args: {
  scopeId: string | null;
  ns: string;
  key: string;
  env?: string;
}): Promise<{ value: unknown; version: number } | null> {
  return getSettingsProvider().getSetting(args);
}

/**
 * Convenience function to patch a setting.
 */
export async function patchSetting(args: {
  scopeId: string | null;
  ns: string;
  key: string;
  value: unknown;
  expectedVersion?: number;
}): Promise<{ version: number }> {
  return getSettingsProvider().patchSetting(args);
}
