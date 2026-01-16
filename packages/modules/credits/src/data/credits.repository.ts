import type { CreditsRepoPort } from '../domain/ports';
import { selectRepo } from '@unisane/kernel';
import { CreditsRepoMongo } from './credits.repository.mongo';
import type { LedgerEntry } from '../domain/types';

const repo = selectRepo<CreditsRepoPort>({ mongo: CreditsRepoMongo });

export async function findByIdem(scopeId: string, idemKey: string): Promise<LedgerEntry | null> {
  return repo.findByIdem(scopeId, idemKey);
}

export async function insertGrant(args: { scopeId: string; amount: number; reason: string; idemKey: string; expiresAt?: Date | null }): Promise<{ id: string }> {
  return repo.insertGrant(args);
}

export async function insertBurn(args: { scopeId: string; amount: number; feature: string; reason?: string; idemKey: string }): Promise<{ id: string }> {
  return repo.insertBurn(args);
}

/**
 * Insert a burn with transaction session support.
 * DATA-002 FIX: This allows atomic balance check + burn within a transaction.
 */
export async function insertBurnAtomic(args: {
  scopeId: string;
  amount: number;
  feature: string;
  reason?: string;
  idemKey: string;
  session?: unknown;
}): Promise<{ id: string }> {
  return repo.insertBurnAtomic(args);
}

export async function totalsAvailable(scopeId: string, now = new Date()): Promise<{ grants: number; burns: number; available: number }> {
  return repo.totalsAvailable(scopeId, now);
}

export async function getBalancesByScopeIds(scopeIds: string[], now = new Date()): Promise<Map<string, number>> {
  return repo.findBalancesByScopeIds(scopeIds, now);
}

export async function totalsGrantsByReason(
  scopeId: string,
  now = new Date()
): Promise<{ subscriptionGrants: number; topupGrants: number; otherGrants: number }> {
  return repo.totalsGrantsByReason(scopeId, now);
}

/**
 * Combined aggregation for breakdown - returns totals AND grants by reason in a single query.
 * Uses $facet to avoid two separate collection scans.
 */
export async function totalsWithBreakdown(
  scopeId: string,
  now = new Date()
): Promise<{
  grants: number;
  burns: number;
  available: number;
  subscriptionGrants: number;
  topupGrants: number;
  otherGrants: number;
}> {
  return repo.totalsWithBreakdown(scopeId, now);
}

export async function listLedgerPage(args: { scopeId: string; limit: number; cursor?: string }): Promise<{ rows: LedgerEntry[]; nextCursor?: string }>{
  return repo.listLedgerPage(args);
}
