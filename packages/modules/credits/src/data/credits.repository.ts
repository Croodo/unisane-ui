import type { CreditsRepoPort } from '../domain/ports';
import { selectRepo } from '@unisane/kernel';
import { CreditsRepoMongo } from './credits.repository.mongo';
import type { LedgerEntry } from '../domain/types';

const repo = selectRepo<CreditsRepoPort>({ mongo: CreditsRepoMongo });

export async function findByIdem(tenantId: string, idemKey: string): Promise<LedgerEntry | null> {
  return repo.findByIdem(tenantId, idemKey);
}

export async function insertGrant(args: { tenantId: string; amount: number; reason: string; idemKey: string; expiresAt?: Date | null }): Promise<{ id: string }> {
  return repo.insertGrant(args);
}

export async function insertBurn(args: { tenantId: string; amount: number; feature: string; reason?: string; idemKey: string }): Promise<{ id: string }> {
  return repo.insertBurn(args);
}

export async function totalsAvailable(tenantId: string, now = new Date()): Promise<{ grants: number; burns: number; available: number }> {
  return repo.totalsAvailable(tenantId, now);
}

export async function getBalancesByTenantIds(tenantIds: string[], now = new Date()): Promise<Map<string, number>> {
  return repo.getBalancesByTenantIds(tenantIds, now);
}

export async function totalsGrantsByReason(
  tenantId: string,
  now = new Date()
): Promise<{ subscriptionGrants: number; topupGrants: number; otherGrants: number }> {
  return repo.totalsGrantsByReason(tenantId, now);
}

export async function listLedgerPage(args: { tenantId: string; limit: number; cursor?: string }): Promise<{ rows: LedgerEntry[]; nextCursor?: string }>{
  return repo.listLedgerPage(args);
}
