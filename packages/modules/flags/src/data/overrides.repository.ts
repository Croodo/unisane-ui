import { selectRepo } from '@unisane/kernel';
import type { FlagOverridesRepoPort } from '../domain/ports';
import { FlagOverridesRepoMongo } from './overrides.repository.mongo';

export const OverridesRepo = selectRepo<FlagOverridesRepoPort>({ mongo: FlagOverridesRepoMongo });

export async function countActiveTenantOverrides(tenantIds: string[], now = new Date()): Promise<Map<string, number>> {
  return OverridesRepo.countActiveTenantOverrides(tenantIds, now);
}

export async function listExpiredOverridesForCleanup(now = new Date(), limit = 200): Promise<Array<{ env?: string; key: string; scopeType: "tenant" | "user"; scopeId: string }>> {
  return OverridesRepo.listExpiredForCleanup({ now, limit });
}
