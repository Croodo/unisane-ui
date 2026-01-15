import { getScopeId, getScopeUserId, SETTINGS_NS, events, getSetting, patchSetting } from '@unisane/kernel';
import { NOTIFY_EVENTS } from '../domain/constants';

function keyFor(userId: string) {
  return `prefs:${userId}`;
}

import type { GetPrefsArgs, SetPrefsArgs } from "../domain/types";
export type { GetPrefsArgs, SetPrefsArgs };

// ════════════════════════════════════════════════════════════════════════════
// Preferences
// ════════════════════════════════════════════════════════════════════════════

export async function getPrefs(_args?: GetPrefsArgs): Promise<Record<string, boolean>> {
  const scopeId = getScopeId();
  const userId = getScopeUserId();
  const row = await getSetting({ scopeId, ns: SETTINGS_NS.NOTIFY, key: keyFor(userId) });
  const value = (row?.value ?? {}) as Record<string, boolean>;
  return value;
}

export async function setPrefs(args: SetPrefsArgs) {
  const scopeId = getScopeId();
  const userId = getScopeUserId();
  const res = await patchSetting({
    scopeId,
    ns: SETTINGS_NS.NOTIFY,
    key: keyFor(userId),
    value: args.categories,
  });
  await events.emit(NOTIFY_EVENTS.PREFS_UPDATED, { scopeId, userId, categories: args.categories });
  return { ok: true as const, version: res.version };
}
