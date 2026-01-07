/**
 * Billing Domain Constants
 */

export const BILLING_EVENTS = {
  SUBSCRIPTION_CREATED: 'billing.subscription.created',
  SUBSCRIPTION_UPDATED: 'billing.subscription.updated',
  SUBSCRIPTION_CANCELLED: 'billing.subscription.cancelled',
  SUBSCRIPTION_RENEWED: 'billing.subscription.renewed',
  PLAN_CHANGED: 'billing.plan.changed',
  QUANTITY_CHANGED: 'billing.quantity.changed',
  PAYMENT_SUCCEEDED: 'billing.payment.succeeded',
  PAYMENT_FAILED: 'billing.payment.failed',
  REFUND_ISSUED: 'billing.refund.issued',
  INVOICE_CREATED: 'billing.invoice.created',
  INVOICE_PAID: 'billing.invoice.paid',
  INVOICE_PAST_DUE: 'billing.invoice.past_due',
  TOPUP_COMPLETED: 'billing.topup.completed',
} as const;

export const BILLING_DEFAULTS = {
  DEFAULT_CURRENCY: 'usd',
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 1000,
  TRIAL_DAYS: 14,
  GRACE_PERIOD_DAYS: 3,
  CACHE_TTL_MS: 60_000,
} as const;

export const BILLING_COLLECTIONS = {
  SUBSCRIPTIONS: 'billing_subscriptions',
  PAYMENTS: 'billing_payments',
  INVOICES: 'billing_invoices',
  TENANT_INTEGRATIONS: 'billing_tenant_integrations',
} as const;
