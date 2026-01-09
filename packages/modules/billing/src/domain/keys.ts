/**
 * Billing Cache Keys
 */

import type { BillingProvider } from '@unisane/kernel';

export const billingKeys = {
  subscription: (tenantId: string) =>
    `billing:subscription:${tenantId}` as const,

  customer: (tenantId: string, provider: BillingProvider) =>
    `billing:customer:${tenantId}:${provider}` as const,

  invoices: (tenantId: string) =>
    `billing:invoices:${tenantId}` as const,

  payments: (tenantId: string) =>
    `billing:payments:${tenantId}` as const,

  refundLock: (
    tenantId: string,
    provider: BillingProvider,
    providerPaymentId: string,
    amountMinorOrFull: string
  ) => `refund:${tenantId}:${provider}:${providerPaymentId}:${amountMinorOrFull}` as const,
} as const;

export type BillingKeyBuilder = typeof billingKeys;

export function refundLockKey(
  tenantId: string,
  provider: BillingProvider,
  providerPaymentId: string,
  amountMinorOrFull: string
) {
  return billingKeys.refundLock(tenantId, provider, providerPaymentId, amountMinorOrFull);
}
