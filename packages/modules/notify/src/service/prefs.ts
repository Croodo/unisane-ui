import { patchSetting, getSetting } from '@unisane/settings';
import { getTenantId, getUserId, SETTINGS_NS, events } from '@unisane/kernel';
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
  const tenantId = getTenantId();
  const userId = getUserId();
  const row = await getSetting({ tenantId, ns: SETTINGS_NS.NOTIFY, key: keyFor(userId) });
  const value = (row?.value ?? {}) as Record<string, boolean>;
  return value;
}

export async function setPrefs(args: SetPrefsArgs) {
  const tenantId = getTenantId();
  const userId = getUserId();
  const res = await patchSetting({
    tenantId,
    namespace: SETTINGS_NS.NOTIFY,
    key: keyFor(userId),
    value: args.categories,
  });
  if ('conflict' in res) return res;
  await events.emit(NOTIFY_EVENTS.PREFS_UPDATED, { tenantId, userId, categories: args.categories });
  return { ok: true as const };
}
