/**
 * Settings Adapter
 *
 * Implementation of SettingsPort for the settings module.
 * This adapter is registered at app bootstrap to allow other modules
 * to access settings without direct coupling.
 */

import type { SettingsPort } from "@unisane/kernel";
import { getSetting } from "../service/read";
import { getTypedSetting } from "../service/readTyped";
import { patchSetting } from "../service/patch";

/**
 * Settings adapter implementation.
 */
export const settingsAdapter: SettingsPort = {
  async getTypedSetting<T>(args: {
    scopeId: string | null;
    ns: string;
    key: string;
    env?: string;
  }): Promise<{ value: T; version: number }> {
    return getTypedSetting<T>(args);
  },

  async getSetting(args: {
    scopeId: string | null;
    ns: string;
    key: string;
    env?: string;
  }): Promise<{ value: unknown; version: number } | null> {
    return getSetting(args);
  },

  async patchSetting(args: {
    scopeId: string | null;
    ns: string;
    key: string;
    value: unknown;
    expectedVersion?: number;
  }): Promise<{ version: number }> {
    const result = await patchSetting({
      scopeId: args.scopeId,
      namespace: args.ns,
      key: args.key,
      value: args.value,
      expectedVersion: args.expectedVersion,
    });
    // Handle conflict response
    if ('conflict' in result) {
      throw new Error(`Settings version conflict: expected ${args.expectedVersion}, got ${result.expected}`);
    }
    return { version: result.setting.version };
  },
};
