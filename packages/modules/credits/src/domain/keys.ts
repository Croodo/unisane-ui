/**
 * Credits Cache Keys
 */

import { KV } from '@unisane/kernel';

export const creditsKeys = {
  balance: (tenantId: string) => `credits:balance:${tenantId}` as const,
  ledger: (tenantId: string) => `credits:ledger:${tenantId}` as const,
  idemLock: (tenantId: string, idem: string) => `${KV.LOCK}credit:${tenantId}:${idem}` as const,
} as const;

export type CreditsKeyBuilder = typeof creditsKeys;

/**
 * @deprecated Use creditsKeys.idemLock() instead
 */
export function creditIdemLockKey(tenantId: string, idem: string): string {
  return creditsKeys.idemLock(tenantId, idem);
}
