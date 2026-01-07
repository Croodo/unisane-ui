import { FlagsRepo } from '../data/flags.repository';
import type { UpsertResult } from '../data/flags.repository';
import { kv } from '@unisane/kernel';
import { publish } from '@unisane/kernel';
import { flagsKeys } from '../domain/keys';
import { ERR } from '@unisane/gateway';

export async function writeFlag(args: {
  env: string;
  key: string;
  enabledDefault: boolean;
  rules: unknown[];
  actorId?: string;
  expectedVersion?: number;
}) {
  const res: UpsertResult = await FlagsRepo.upsert({
    env: args.env,
    key: args.key,
    enabledDefault: args.enabledDefault,
    rules: args.rules,
    ...(args.actorId !== undefined ? { actorId: args.actorId } : {}),
    ...(args.expectedVersion !== undefined ? { expectedVersion: args.expectedVersion } : {}),
  });
  if ('conflict' in res) throw ERR.versionMismatch();
  // Invalidate cache and publish cfg-bus event
  await kv.del(flagsKeys.flagByEnv(args.env, args.key));
  const snapshotVersion = res.flag?.snapshotVersion ?? 0;
  await publish('flag.updated', { env: args.env, key: args.key, snapshotVersion });
  return res;
}
