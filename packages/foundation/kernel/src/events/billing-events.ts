/**
 * Billing Event Schemas for Event-Driven Decoupling
 *
 * These events are emitted by webhook handlers and processed by downstream modules
 * (credits, notifications, audit, etc.) to achieve loose coupling.
 *
 * This enables:
 * 1. Removing direct imports between modules (webhooks → credits)
 * 2. Multiple modules responding to the same business event
 * 3. Easier testing and module isolation
 */

import { z } from 'zod';
import { ZInvoiceStatus, ZPaymentStatus, ZSubscriptionStatus } from '../constants/billing';

// ============================================================================
// Stripe Webhook Events (for cross-module communication)
// ============================================================================

/**
 * Emitted when a Stripe payment checkout completes for a top-up purchase.
 * Credits module listens to grant credits.
 */
export const StripeTopupCompletedSchema = z.object({
  scopeId: z.string(),
  customerId: z.string().nullable(),
  paymentIntentId: z.string(),
  amount: z.number().describe('Amount in major currency units (e.g., dollars)'),
  currency: z.string(),
  credits: z.number().describe('Credits to grant'),
  invoiceId: z.string().nullable(),
  invoicePdf: z.string().nullable(),
});

/**
 * Emitted when a Stripe subscription invoice is paid.
 * Credits module listens to grant subscription credits.
 */
export const StripeSubscriptionInvoicePaidSchema = z.object({
  scopeId: z.string(),
  customerId: z.string().nullable(),
  subscriptionId: z.string().nullable(),
  invoiceId: z.string(),
  amount: z.number(),
  currency: z.string(),
  periodEnd: z.string().nullable().describe('ISO date for credit expiration'),
  creditGrants: z.array(z.object({
    key: z.string(),
    amount: z.number(),
  })).describe('Credits to grant based on entitlements'),
});

/**
 * Emitted when a Stripe subscription changes (created, updated, deleted).
 * Tenants and settings modules listen to update plan and capacity.
 */
export const StripeSubscriptionChangedSchema = z.object({
  scopeId: z.string(),
  subscriptionId: z.string(),
  priceId: z.string().nullable(),
  status: ZSubscriptionStatus,
  quantity: z.number().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  currentPeriodEnd: z.string().nullable(),
  eventType: z.enum(['created', 'updated', 'deleted']),
});

// ============================================================================
// Razorpay Webhook Events
// ============================================================================

/**
 * Emitted when a Razorpay payment completes.
 */
export const RazorpayPaymentCompletedSchema = z.object({
  scopeId: z.string(),
  paymentId: z.string(),
  amount: z.number(),
  currency: z.string(),
  credits: z.number().nullable(),
});

/**
 * Emitted when a Razorpay subscription changes.
 */
export const RazorpaySubscriptionChangedSchema = z.object({
  scopeId: z.string(),
  subscriptionId: z.string(),
  planId: z.string().nullable(),
  status: z.enum(['active', 'pending', 'halted', 'cancelled', 'completed', 'expired']),
  eventType: z.enum(['activated', 'charged', 'completed', 'updated', 'cancelled', 'paused', 'resumed']),
});

// ============================================================================
// Stripe Payment & Invoice Events (for billing module to record)
// ============================================================================

/**
 * Emitted when a Stripe invoice event occurs.
 * Billing module listens to record invoice in database.
 */
export const StripeInvoiceEventSchema = z.object({
  scopeId: z.string(),
  customerId: z.string().nullable(),
  invoiceId: z.string(),
  paymentIntentId: z.string().nullable(),
  amount: z.number(),
  currency: z.string(),
  status: ZInvoiceStatus,
  url: z.string().nullable(),
  eventType: z.string(),
});

/**
 * Emitted when a Stripe payment event occurs.
 * Billing module listens to record payment in database.
 */
export const StripePaymentEventSchema = z.object({
  scopeId: z.string(),
  customerId: z.string().nullable(),
  paymentIntentId: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: ZPaymentStatus,
});

/**
 * Emitted when a Stripe customer mapping needs to be created/deleted.
 */
export const StripeCustomerMappingEventSchema = z.object({
  scopeId: z.string(),
  customerId: z.string(),
  action: z.enum(['upsert', 'delete']),
});

// ============================================================================
// Razorpay Payment & Invoice Events
// ============================================================================

/**
 * Emitted when a Razorpay payment needs to be recorded.
 */
export const RazorpayPaymentEventSchema = z.object({
  scopeId: z.string(),
  paymentId: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: ZPaymentStatus,
});

// ============================================================================
// Generic Credit Request Event
// ============================================================================

/**
 * Generic event requesting credits to be granted.
 * Use this when the source doesn't matter to the credits module.
 */
export const CreditGrantRequestedSchema = z.object({
  scopeId: z.string(),
  amount: z.number(),
  reason: z.string(),
  idempotencyKey: z.string(),
  expiresAt: z.string().nullable(),
  source: z.enum(['stripe_topup', 'stripe_subscription', 'razorpay_topup', 'razorpay_subscription', 'manual', 'promo']),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================================
// Event Type Map (for registration)
// ============================================================================

export const BillingEventSchemas = {
  // Stripe events
  'webhook.stripe.topup_completed': StripeTopupCompletedSchema,
  'webhook.stripe.subscription_invoice_paid': StripeSubscriptionInvoicePaidSchema,
  'webhook.stripe.subscription_changed': StripeSubscriptionChangedSchema,
  'webhook.stripe.invoice_event': StripeInvoiceEventSchema,
  'webhook.stripe.payment_event': StripePaymentEventSchema,
  'webhook.stripe.customer_mapping': StripeCustomerMappingEventSchema,

  // Razorpay events
  'webhook.razorpay.payment_completed': RazorpayPaymentCompletedSchema,
  'webhook.razorpay.subscription_changed': RazorpaySubscriptionChangedSchema,
  'webhook.razorpay.payment_event': RazorpayPaymentEventSchema,

  // Generic credit request
  'credits.grant_requested': CreditGrantRequestedSchema,
} as const;

export type BillingEventType = keyof typeof BillingEventSchemas;
export type BillingEventPayload<T extends BillingEventType> = z.infer<typeof BillingEventSchemas[T]>;
