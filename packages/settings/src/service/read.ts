import { cacheGet, cacheSet } from "@unisane/kernel";
import { SettingsRepo } from "../data/settings.repository";
import { getEnv } from "@unisane/kernel";
import { subscribe } from "@unisane/kernel";
import { kv } from "@unisane/kernel";
import { settingsKeys } from "../domain/keys";

import type { GetSettingArgs } from "../domain/types";
export type { GetSettingArgs };

export async function getSetting(args: GetSettingArgs) {
  const env = args.env ?? getEnv().APP_ENV;
  // ensureSubscriber() removed; called via initModules()
  const ck = settingsKeys.setting(env, args.ns, args.key, args.tenantId);
  const cached = await cacheGet<{ value: unknown; version: number } | null>(ck);
  if (cached) return { value: cached.value, version: cached.version };
  const row = await SettingsRepo.findOne(env, args.tenantId, args.ns, args.key);
  if (row)
    await cacheSet(
      ck,
      { value: row.value ?? null, version: row.version ?? 0 },
      90_000
    );
  return row ? { value: row.value ?? null, version: row.version ?? 0 } : null;
}

let wired = false;
export function initSettingsSubscriber() {
  if (wired) return;
  wired = true;
  subscribe<Record<string, unknown>>("setting.updated", (evt) => {
    if (!evt || typeof evt !== "object") return;
    const e = evt as Record<string, unknown>;
    if (
      typeof e.env === "string" &&
      typeof e.ns === "string" &&
      typeof e.key === "string"
    ) {
      const tenantId = (typeof e.tenantId === "string" ? e.tenantId : null) as
        | string
        | null;
      const ck = settingsKeys.setting(e.env, e.ns, e.key, tenantId);
      void kv.del(ck);
    }
  });
}
