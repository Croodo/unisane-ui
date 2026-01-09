import type { LedgerEntry } from './types';

export interface CreditsRepoPort {
  findByIdem(tenantId: string, idemKey: string): Promise<LedgerEntry | null>;
  insertGrant(args: { tenantId: string; amount: number; reason: string; idemKey: string; expiresAt?: Date | null }): Promise<{ id: string }>;
  insertBurn(args: { tenantId: string; amount: number; feature: string; reason?: string; idemKey: string }): Promise<{ id: string }>;
  totalsAvailable(tenantId: string, now?: Date): Promise<{ grants: number; burns: number; available: number }>;
  // Admin/stats: credits available grouped by tenantId
  getBalancesByTenantIds(tenantIds: string[], now?: Date): Promise<Map<string, number>>;
  totalsGrantsByReason(tenantId: string, now?: Date): Promise<{ subscriptionGrants: number; topupGrants: number; otherGrants: number }>;
  listLedgerPage(args: { tenantId: string; limit: number; cursor?: string }): Promise<{ rows: LedgerEntry[]; nextCursor?: string }>;
}
