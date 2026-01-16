import { cacheGet, cacheSet } from "@unisane/kernel";
import { SettingsRepo } from "../data/settings.repository";
import { getEnv } from "@unisane/kernel";
import { subscribe } from "@unisane/kernel";
import { kv } from "@unisane/kernel";
import { settingsKeys } from "../domain/keys";
import { z } from "zod";

import type { GetSettingArgs } from "../domain/types";
export type { GetSettingArgs };

/** Schema for setting.updated pub/sub message validation */
const SettingUpdatedEventSchema = z.object({
  env: z.string(),
  ns: z.string(),
  key: z.string(),
  scopeId: z.string().nullable().optional(),
});

export async function getSetting(args: GetSettingArgs) {
  const env = args.env ?? getEnv().APP_ENV;
  // ensureSubscriber() removed; called via initModules()
  const ck = settingsKeys.setting(env, args.ns, args.key, args.scopeId);
  const cached = await cacheGet<{ value: unknown; version: number } | null>(ck);
  if (cached) return { value: cached.value, version: cached.version };
  const row = await SettingsRepo.findOne(env, args.scopeId, args.ns, args.key);
  if (row)
    await cacheSet(
      ck,
      { value: row.value ?? null, version: row.version ?? 0 },
      90_000
    );
  return row ? { value: row.value ?? null, version: row.version ?? 0 } : null;
}

/**
 * SETT-002 FIX: Thread-safe subscriber initialization.
 * Uses synchronous check + flag to prevent double-subscription.
 * The subscription itself is idempotent if called twice, but we avoid
 * the duplicate handler registration overhead.
 */
let wired = false;
let wiringInProgress = false;

export function initSettingsSubscriber() {
  // SETT-002 FIX: Prevent concurrent initialization
  if (wired || wiringInProgress) return;
  wiringInProgress = true;

  try {
    subscribe<unknown>("setting.updated", (evt) => {
      const parsed = SettingUpdatedEventSchema.safeParse(evt);
      if (!parsed.success) return;
      const { env, ns, key, scopeId } = parsed.data;
      const ck = settingsKeys.setting(env, ns, key, scopeId ?? null);
      void kv.del(ck);
    });
    wired = true;
  } finally {
    wiringInProgress = false;
  }
}
