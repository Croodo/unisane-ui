import { cacheGet, cacheSet } from '@unisane/kernel';
import { getEnv } from '@unisane/kernel';
import { FlagsRepo } from '../data/flags.repository';
import type { FlagRow } from '../domain/types';
import { subscribe } from '@unisane/kernel';
import { kv } from '@unisane/kernel';
import { flagsKeys } from '../domain/keys';
import type { FlagOverrideScope } from '@unisane/kernel';

import type { GetFlagArgs } from "../domain/types";
export type { GetFlagArgs };

import type { GetFlagsArgs } from "../domain/types";
export type { GetFlagsArgs };

export async function getFlag(args: GetFlagArgs): Promise<FlagRow | null> {
  // ensureSubscriber() removed; called via initModules()
  const ck = flagsKeys.flagByEnv(args.env, args.key);
  const cached = await cacheGet<FlagRow | null>(ck);
  if (cached) return cached;
  const row = await FlagsRepo.findOne(args.env, args.key);
  if (row) await cacheSet<FlagRow>(ck, row, 90_000);
  return row ?? null;
}

export async function getFlagForCurrentEnv(key: string): Promise<FlagRow | null> {
  const { APP_ENV } = getEnv();
  return getFlag({ env: APP_ENV, key });
}

export async function getFlags(args: GetFlagsArgs): Promise<Array<{ key: string; flag: FlagRow | null }>> {
  const uniq = Array.from(new Set(args.keys.filter(Boolean)));
  const out: Array<{ key: string; flag: FlagRow | null }> = [];
  for (const k of uniq) {
    // reuse getFlag with cache
    const f = await getFlag({ env: args.env, key: k });
    out.push({ key: k, flag: f });
  }
  return out;
}

let wired = false;
export function initFlagsSubscriber() {
  if (wired) return;
  wired = true;
  // Subscribe to flag updates
  subscribe<Record<string, unknown>>('flag.updated', (evt) => {
    if (!evt || typeof evt !== 'object') return;
    if (typeof evt.env === 'string' && typeof evt.key === 'string') {
      const ck = flagsKeys.flagByEnv(evt.env, evt.key);
      void kv.del(ck);
    }
  });
  // Subscribe to flag override updates
  subscribe<Record<string, unknown>>('flag.override.updated', (evt) => {
    if (!evt || typeof evt !== 'object') return;
    if (
      typeof evt.env === 'string' &&
      typeof evt.key === 'string' &&
      (evt.scopeType === 'tenant' || evt.scopeType === 'user') &&
      typeof evt.scopeId === 'string'
    ) {
      const ck = flagsKeys.overrideByScope(
        evt.env,
        evt.key,
        evt.scopeType as FlagOverrideScope,
        evt.scopeId
      );
      void kv.del(ck);
    }
  });
  // Subscribe to flag override cleared
  subscribe<Record<string, unknown>>('flag.override.cleared', (evt) => {
    if (!evt || typeof evt !== 'object') return;
    if (
      typeof evt.env === 'string' &&
      typeof evt.key === 'string' &&
      (evt.scopeType === 'tenant' || evt.scopeType === 'user') &&
      typeof evt.scopeId === 'string'
    ) {
      const ck = flagsKeys.overrideByScope(
        evt.env,
        evt.key,
        evt.scopeType as FlagOverrideScope,
        evt.scopeId
      );
      void kv.del(ck);
    }
  });
}
