// Provider → local status mappers for subscriptions and payments.

import type { SubscriptionStatus } from '@unisane/kernel';

export function mapStripeSubStatus(status: string | null | undefined): SubscriptionStatus {
  const s = String(status ?? '').toLowerCase();
  // Stripe uses: active|trialing|past_due|unpaid|canceled|incomplete|incomplete_expired|paused
  // Map unknowns to a sensible default
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

export function mapRazorpaySubStatus(status: string | null | undefined): SubscriptionStatus {
  const s = String(status ?? '').toLowerCase();
  // Razorpay: active|authenticated|completed|halted|cancelled|pending
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
