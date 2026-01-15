import { OverridesRepo } from '../data/overrides.repository';
import { cacheGet, cacheSet } from '@unisane/kernel';
import { kv } from '@unisane/kernel';
import { flagsKeys } from '../domain/keys';
import { publish } from '@unisane/kernel';
import { isPlatformOnlyFlag } from '../domain/policy';
import { getEnv } from '@unisane/kernel';
import type { AppEnv } from '@unisane/kernel';
import { getFlag } from './get';
import { applyThen } from './evaluator';
import type { EvalCtx } from './evaluator';
import type { FlagWrite } from '../domain/schemas';
import { ERR } from '@unisane/gateway';

// Scope types for flag overrides
export type OverrideScopeType = 'tenant' | 'user';

/**
 * Set a flag override for a specific scope (tenant or user)
 */
export async function setScopeOverride(args: {
  env?: AppEnv;
  key: string;
  scopeType: OverrideScopeType;
  scopeId: string;
  value: boolean;
  expiresAt?: Date | null;
  actorIsSuperAdmin?: boolean;
}) {
  if (isPlatformOnlyFlag(args.key) && !args.actorIsSuperAdmin) {
    throw ERR.forbidden(`Platform-only flags cannot be overridden at ${args.scopeType} scope`);
  }
  const env = args.env ?? getEnv().APP_ENV;
  const row = await OverridesRepo.upsert({
    env,
    key: args.key,
    scopeType: args.scopeType,
    scopeId: args.scopeId,
    value: args.value,
    ...(args.expiresAt !== undefined ? { expiresAt: args.expiresAt } : {}),
  });
  const ck = flagsKeys.overrideByScope(env, args.key, args.scopeType, args.scopeId);
  await kv.del(ck);
  await publish('flag.override.updated', { env, key: args.key, scopeType: args.scopeType, scopeId: args.scopeId });
  return row;
}

/**
 * Clear a flag override for a specific scope (tenant or user)
 */
export async function clearScopeOverride(args: {
  env?: AppEnv;
  key: string;
  scopeType: OverrideScopeType;
  scopeId: string;
  actorIsSuperAdmin?: boolean;
}) {
  if (isPlatformOnlyFlag(args.key) && !args.actorIsSuperAdmin) {
    throw ERR.forbidden(`Platform-only flags cannot be overridden at ${args.scopeType} scope`);
  }
  const env = args.env ?? getEnv().APP_ENV;
  await OverridesRepo.softDeleteOverride(env, args.key, args.scopeType, args.scopeId);
  const ck = flagsKeys.overrideByScope(env, args.key, args.scopeType, args.scopeId);
  await kv.del(ck);
  await publish('flag.override.cleared', { env, key: args.key, scopeType: args.scopeType, scopeId: args.scopeId });
}

/**
 * Get a flag override for a specific scope (tenant or user)
 */
export async function getScopeOverride(args: {
  env?: AppEnv;
  key: string;
  scopeType: OverrideScopeType;
  scopeId: string;
}) {
  const env = args.env ?? getEnv().APP_ENV;
  const ck = flagsKeys.overrideByScope(env, args.key, args.scopeType, args.scopeId);
  const cached = await cacheGet<{ value: boolean; expiresAt: string | null } | null>(ck);
  if (cached) {
    return {
      value: cached.value,
      expiresAt: cached.expiresAt ? new Date(cached.expiresAt) : null,
    } as const;
  }
  const row = await OverridesRepo.findOverride(env, args.key, args.scopeType, args.scopeId);
  if (row) {
    await cacheSet(ck, { value: !!row.value, expiresAt: row.expiresAt ?? null }, 60_000);
  }
  return row ? { value: !!row.value, expiresAt: row.expiresAt ?? null } : null;
}

/**
 * Check if a flag is enabled for a subject (checks user override, then scope override, then rules)
 */
export async function isEnabledForScope(args: {
  env?: AppEnv;
  key: string;
  scopeId: string;
  userId?: string;
  ctx?: EvalCtx;
}) {
  const env = args.env ?? getEnv().APP_ENV;
  // 1) User override (if userId present)
  if (args.userId) {
    const uovr = await getScopeOverride({
      env,
      key: args.key,
      scopeType: 'user',
      scopeId: args.userId,
    });
    if (uovr) return uovr.value;
  }
  // 2) Scope (tenant) override
  const sovr = await getScopeOverride({
    env,
    key: args.key,
    scopeType: 'tenant',
    scopeId: args.scopeId,
  });
  if (sovr) return sovr.value;
  // 3) Rules / default
  const flag = await getFlag({ env, key: args.key });
  if (!flag) return false; // default absent as disabled
  const input: FlagWrite = {
    env: flag.env as AppEnv,
    key: flag.key,
    enabledDefault: flag.enabledDefault,
    rules: flag.rules as FlagWrite['rules'],
    expectedVersion: flag.snapshotVersion,
  };
  return applyThen(input, args.ctx ?? {});
}
