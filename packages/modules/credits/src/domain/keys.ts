/**
 * Credits Cache Keys
 */

import { KV } from '@unisane/kernel';

export const creditsKeys = {
  balance: (scopeId: string) => `credits:balance:${scopeId}` as const,
  ledger: (scopeId: string) => `credits:ledger:${scopeId}` as const,
  idemLock: (scopeId: string, idem: string) => `${KV.LOCK}credit:${scopeId}:${idem}` as const,
} as const;

export type CreditsKeyBuilder = typeof creditsKeys;
