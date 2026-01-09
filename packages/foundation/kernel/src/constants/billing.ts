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
