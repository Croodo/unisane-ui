import { SettingsRepo } from '../data/settings.repository';
import type { PatchResult } from '../data/settings.repository';
import { redis } from '@unisane/kernel';
import { KV } from '@unisane/kernel';
import { getEnv } from '@unisane/kernel';
import { settingsKeys } from '../domain/keys';

import type { PatchSettingArgs } from "../domain/types";
export type { PatchSettingArgs };

export async function patchSetting(args: PatchSettingArgs) {
  const env = args.env ?? getEnv().APP_ENV;
  const res: PatchResult = await SettingsRepo.upsertPatch({
    env,
    tenantId: args.tenantId,
    ns: args.namespace,
    key: args.key,
    ...(args.value !== undefined ? { value: args.value } : {}),
    ...(args.unset !== undefined ? { unset: args.unset } : {}),
    ...(args.expectedVersion !== undefined ? { expectedVersion: args.expectedVersion } : {}),
    ...(args.actorId !== undefined ? { actorId: args.actorId } : {}),
  });
  if ('conflict' in res) return res;
  // Invalidate cache and publish cfg-bus event
  await redis.del(settingsKeys.setting(env, args.namespace, args.key, args.tenantId));
  await redis.publish(KV.PUBSUB, JSON.stringify({ kind: 'setting.updated', env, ns: args.namespace, key: args.key, tenantId: args.tenantId }));
  return res;
}
