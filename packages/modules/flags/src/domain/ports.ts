import type { FlagRow, UpsertResult } from './types';
import type { FlagOverrideScope } from '@unisane/kernel';

export interface FlagsRepoPort {
  findOne(env: string, key: string): Promise<FlagRow | null>;
  upsert(args: {
    env: string;
    key: string;
    enabledDefault: boolean;
    rules: unknown[];
    actorId?: string;
    expectedVersion?: number;
  }): Promise<UpsertResult>;
}

export interface FlagOverridesRepoPort {
  get(env: string, key: string, scopeType: FlagOverrideScope, scopeId: string): Promise<{ value: boolean; expiresAt?: Date | null } | null>;
  upsert(args: { env: string; key: string; scopeType: FlagOverrideScope; scopeId: string; value: boolean; expiresAt?: Date | null }): Promise<{ value: boolean; expiresAt?: Date | null } | null>;
  clear(env: string, key: string, scopeType: FlagOverrideScope, scopeId: string): Promise<void>;
  // Admin/stats: active override counts per tenant
  countActiveTenantOverrides(tenantIds: string[], now?: Date): Promise<Map<string, number>>;
  // Jobs: list expired overrides for cleanup
  listExpiredForCleanup(args: {
    now: Date;
    limit: number;
  }): Promise<
    Array<{
      env?: string;
      key: string;
      scopeType: FlagOverrideScope;
      scopeId: string;
    }>
  >;
}
