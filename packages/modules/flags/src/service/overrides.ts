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

export async function setTenantOverride(args: {
  env?: AppEnv;
  key: string;
  tenantId: string;
  value: boolean;
  expiresAt?: Date | null;
  actorIsSuperAdmin?: boolean;
}) {
  if (isPlatformOnlyFlag(args.key) && !args.actorIsSuperAdmin) {
    throw ERR.forbidden('Platform-only flags cannot be overridden at tenant scope');
  }
  const env = args.env ?? getEnv().APP_ENV;
  const row = await OverridesRepo.upsert({ env, key: args.key, scopeType: 'tenant', scopeId: args.tenantId, value: args.value, ...(args.expiresAt !== undefined ? { expiresAt: args.expiresAt } : {}) });
  const ck = flagsKeys.overrideByScope(env, args.key, 'tenant', args.tenantId);
  await kv.del(ck);
  await publish('flag.override.updated', { env, key: args.key, scopeType: 'tenant', scopeId: args.tenantId });
  return row;
}

export async function clearTenantOverride(args: {
  env?: AppEnv;
  key: string;
  tenantId: string;
  actorIsSuperAdmin?: boolean;
}) {
  if (isPlatformOnlyFlag(args.key) && !args.actorIsSuperAdmin) {
    throw ERR.forbidden('Platform-only flags cannot be overridden at tenant scope');
  }
  const env = args.env ?? getEnv().APP_ENV;
  await OverridesRepo.clear(env, args.key, 'tenant', args.tenantId);
  const ck = flagsKeys.overrideByScope(env, args.key, 'tenant', args.tenantId);
  await kv.del(ck);
  await publish('flag.override.cleared', { env, key: args.key, scopeType: 'tenant', scopeId: args.tenantId });
}

export async function getTenantOverride(args: { env?: AppEnv; key: string; tenantId: string }) {
  const env = args.env ?? getEnv().APP_ENV;
  const ck = flagsKeys.overrideByScope(env, args.key, 'tenant', args.tenantId);
  const cached = await cacheGet<{ value: boolean; expiresAt: string | null } | null>(ck);
  if (cached) return { value: cached.value, expiresAt: cached.expiresAt ? new Date(cached.expiresAt) : null } as const;
  const row = await OverridesRepo.get(env, args.key, 'tenant', args.tenantId);
  if (row) await cacheSet(ck, { value: !!row.value, expiresAt: row.expiresAt ?? null }, 60_000);
  return row ? { value: !!row.value, expiresAt: row.expiresAt ?? null } : null;
}

export async function getUserOverride(args: { env?: AppEnv; key: string; userId: string }) {
  const env = args.env ?? getEnv().APP_ENV;
  const ck = flagsKeys.overrideByScope(env, args.key, 'user', args.userId);
  const cached = await cacheGet<{ value: boolean; expiresAt: string | null } | null>(ck);
  if (cached) {
    return {
      value: cached.value,
      expiresAt: cached.expiresAt ? new Date(cached.expiresAt) : null,
    } as const;
  }
  const row = await OverridesRepo.get(env, args.key, 'user', args.userId);
  if (row) {
    await cacheSet(
      ck,
      { value: !!row.value, expiresAt: row.expiresAt ?? null },
      60_000,
    );
  }
  return row ? { value: !!row.value, expiresAt: row.expiresAt ?? null } : null;
}

export async function setUserOverride(args: {
  env?: AppEnv;
  key: string;
  userId: string;
  value: boolean;
  expiresAt?: Date | null;
  actorIsSuperAdmin?: boolean;
}) {
  if (isPlatformOnlyFlag(args.key) && !args.actorIsSuperAdmin) {
    throw ERR.forbidden('Platform-only flags cannot be overridden at user scope');
  }
  const env = args.env ?? getEnv().APP_ENV;
  const row = await OverridesRepo.upsert({
    env,
    key: args.key,
    scopeType: 'user',
    scopeId: args.userId,
    value: args.value,
    ...(args.expiresAt !== undefined ? { expiresAt: args.expiresAt } : {}),
  });
  const ck = flagsKeys.overrideByScope(env, args.key, 'user', args.userId);
  await kv.del(ck);
  await publish('flag.override.updated', {
    env,
    key: args.key,
    scopeType: 'user',
    scopeId: args.userId,
  });
  return row;
}

export async function clearUserOverride(args: {
  env?: AppEnv;
  key: string;
  userId: string;
  actorIsSuperAdmin?: boolean;
}) {
  if (isPlatformOnlyFlag(args.key) && !args.actorIsSuperAdmin) {
    throw ERR.forbidden('Platform-only flags cannot be overridden at user scope');
  }
  const env = args.env ?? getEnv().APP_ENV;
  await OverridesRepo.clear(env, args.key, 'user', args.userId);
  const ck = flagsKeys.overrideByScope(env, args.key, 'user', args.userId);
  await kv.del(ck);
  await publish('flag.override.cleared', {
    env,
    key: args.key,
    scopeType: 'user',
    scopeId: args.userId,
  });
}

export async function isEnabledForSubject(args: {
  env?: AppEnv;
  key: string;
  tenantId: string;
  userId?: string;
  ctx?: EvalCtx;
}) {
  const env = args.env ?? getEnv().APP_ENV;
  // 1) User override (if userId present)
  if (args.userId) {
    const uovr = await getUserOverride({
      env,
      key: args.key,
      userId: args.userId,
    });
    if (uovr) return uovr.value;
  }
  // 2) Tenant override
  const tovr = await getTenantOverride({
    env,
    key: args.key,
    tenantId: args.tenantId,
  });
  if (tovr) return tovr.value;
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

export async function isEnabledForTenant(args: {
  env?: AppEnv;
  key: string;
  tenantId: string;
  ctx?: EvalCtx;
}) {
  return isEnabledForSubject({
    ...(args.env ? { env: args.env } : {}),
    key: args.key,
    tenantId: args.tenantId,
    ...(args.ctx ? { ctx: args.ctx } : {}),
  });
}
