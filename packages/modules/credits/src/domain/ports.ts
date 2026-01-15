import type { LedgerEntry } from './types';

export interface CreditsRepoPort {
  findByIdem(scopeId: string, idemKey: string): Promise<LedgerEntry | null>;
  insertGrant(args: { scopeId: string; amount: number; reason: string; idemKey: string; expiresAt?: Date | null }): Promise<{ id: string }>;
  insertBurn(args: { scopeId: string; amount: number; feature: string; reason?: string; idemKey: string }): Promise<{ id: string }>;
  totalsAvailable(scopeId: string, now?: Date): Promise<{ grants: number; burns: number; available: number }>;
  // Admin/stats: credits available grouped by scopeId
  findBalancesByScopeIds(scopeIds: string[], now?: Date): Promise<Map<string, number>>;
  totalsGrantsByReason(scopeId: string, now?: Date): Promise<{ subscriptionGrants: number; topupGrants: number; otherGrants: number }>;
  /**
   * Combined aggregation returning totals AND grants by reason in a single query.
   * Uses $facet to avoid two separate collection scans - use for breakdown().
   */
  totalsWithBreakdown(scopeId: string, now?: Date): Promise<{
    grants: number;
    burns: number;
    available: number;
    subscriptionGrants: number;
    topupGrants: number;
    otherGrants: number;
  }>;
  listLedgerPage(args: { scopeId: string; limit: number; cursor?: string }): Promise<{ rows: LedgerEntry[]; nextCursor?: string }>;
}
