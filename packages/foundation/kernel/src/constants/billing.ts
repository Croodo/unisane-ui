import { z } from 'zod';

// Normalized payment lifecycle statuses across providers (Stripe/Razorpay/etc.)
// Map provider-specific states to one of these in services/webhooks.
export const PAYMENT_STATUS = [
  // Terminal
  'succeeded',
  'failed',
  'refunded',
  'partially_refunded',
  'canceled',
  // In-flight / pre-terminal
  'authorized', // funds reserved but not captured
  'processing', // provider processing async
  'requires_action', // 3DS or additional step
  'disputed', // chargeback/dispute opened
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];
export const ZPaymentStatus = z.enum(PAYMENT_STATUS);

export const INVOICE_STATUS = ['paid', 'open', 'void', 'uncollectible'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUS)[number];
export const ZInvoiceStatus = z.enum(INVOICE_STATUS);

export const SUBSCRIPTION_STATUS = [
  'active',
  'trialing',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'unpaid',
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[number];
export const ZSubscriptionStatus = z.enum(SUBSCRIPTION_STATUS);

// ============================================================================
// Provider Status Mapping Functions
// ============================================================================

/**
 * Map Stripe subscription status to internal SubscriptionStatus.
 * Used by webhooks and billing modules for status normalization.
 *
 * Stripe statuses: active|trialing|past_due|unpaid|canceled|incomplete|incomplete_expired|paused
 */
export function mapStripeSubStatus(status: string | null | undefined): SubscriptionStatus {
  const s = String(status ?? '').toLowerCase();
  switch (s) {
    case 'active':
    case 'trialing':
    case 'past_due':
    case 'unpaid':
    case 'canceled':
    case 'incomplete':
      return s;
    case 'incomplete_expired':
    case 'paused':
      return 'past_due';
    default:
      return 'active';
  }
}

/**
 * Map Razorpay subscription status to internal SubscriptionStatus.
 * Used by webhooks and billing modules for status normalization.
 *
 * Razorpay statuses: active|authenticated|completed|halted|cancelled|pending
 */
export function mapRazorpaySubStatus(status: string | null | undefined): SubscriptionStatus {
  const s = String(status ?? '').toLowerCase();
  switch (s) {
    case 'active':
      return 'active';
    case 'authenticated':
      return 'trialing';
    case 'completed':
      // Treat completed cycle as still active until reconciled by job
      return 'active';
    case 'halted':
      return 'past_due';
    case 'cancelled':
    case 'canceled':
      return 'canceled';
    case 'pending':
      return 'unpaid';
    default:
      return 'active';
  }
}

/**
 * Validate and map raw invoice status to InvoiceStatus.
 * Returns 'open' as default for unknown statuses.
 */
export function mapInvoiceStatus(status: string | null | undefined): InvoiceStatus {
  const s = String(status ?? '').toLowerCase();
  if (INVOICE_STATUS.includes(s as InvoiceStatus)) {
    return s as InvoiceStatus;
  }
  return 'open';
}

/**
 * Validate and map raw payment status to PaymentStatus.
 * Returns 'processing' as default for unknown statuses.
 */
export function mapPaymentStatus(status: string | null | undefined): PaymentStatus {
  const s = String(status ?? '').toLowerCase();
  if (PAYMENT_STATUS.includes(s as PaymentStatus)) {
    return s as PaymentStatus;
  }
  return 'processing';
}
