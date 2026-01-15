/**
 * Billing Cache Keys
 */

import type { BillingProvider } from '@unisane/kernel';

export const billingKeys = {
  subscription: (scopeId: string) =>
    `billing:subscription:${scopeId}` as const,

  customer: (scopeId: string, provider: BillingProvider) =>
    `billing:customer:${scopeId}:${provider}` as const,

  invoices: (scopeId: string) =>
    `billing:invoices:${scopeId}` as const,

  payments: (scopeId: string) =>
    `billing:payments:${scopeId}` as const,

  refundLock: (
    scopeId: string,
    provider: BillingProvider,
    providerPaymentId: string,
    amountMinorOrFull: string
  ) => `refund:${scopeId}:${provider}:${providerPaymentId}:${amountMinorOrFull}` as const,
} as const;

export type BillingKeyBuilder = typeof billingKeys;

export function refundLockKey(
  scopeId: string,
  provider: BillingProvider,
  providerPaymentId: string,
  amountMinorOrFull: string
) {
  return billingKeys.refundLock(scopeId, provider, providerPaymentId, amountMinorOrFull);
}
