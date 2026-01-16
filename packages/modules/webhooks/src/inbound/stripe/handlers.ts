/**
 * Stripe Webhook Handlers (Event-Driven)
 *
 * These handlers emit events instead of directly calling services.
 * Other modules listen to these events and respond accordingly.
 *
 * Event Flow:
 * Stripe Webhook → handlers.ts → emitTyped() → Event Bus
 *   → @unisane/credits (event-handlers.ts) → grant credits
 *   → @unisane/billing (event-handlers.ts) → record payments/invoices
 *   → @unisane/tenants (event-handlers.ts) → update plan
 *   → @unisane/settings (event-handlers.ts) → update seat capacity
 */

import {
  emitTyped,
  emitTypedReliable,
  logger,
  creditsForPurchase,
  toMajorNumberCurrency,
  reverseMapPlanIdFromProvider,
  resolveEntitlements,
  getBillingModeViaPort,
  findScopeIdByCustomerViaPort,
} from '@unisane/kernel';
import type { SubscriptionStatus } from '@unisane/kernel';
import { getString, getNumber, getAny } from '../utils';

const log = logger.child({ src: 'webhooks.stripe' });

// SubscriptionStatus value for deleted subscriptions
const DELETED_SUBSCRIPTION_STATUS: SubscriptionStatus = 'canceled';

/**
 * Find scopeId by Stripe customer ID.
 * Uses the BillingServicePort for hexagonal architecture decoupling.
 *
 * @param customerId - Stripe customer ID (cus_xxx)
 * @returns Scope ID if found, null otherwise
 */
async function findScopeIdByCustomerStripe(customerId?: string | null): Promise<string | null> {
  if (!customerId) return null;
  return findScopeIdByCustomerViaPort('stripe', customerId);
}

/**
 * Handle checkout.session.completed
 * Emits events for: customer mapping, payment record, invoice record, credit grant
 */
export async function handleCheckoutCompleted(obj: Record<string, unknown>, eventId?: string): Promise<void> {
  const eventLog = log.child({ type: 'checkout.session.completed', eventId });
  const mode = getString(obj, ['mode']);
  const scopeId = getString(obj, ['metadata', 'tenantId']);
  const customerId = getString(obj, ['customer']);

  // Emit customer mapping event
  if (scopeId && customerId) {
    await emitTyped('webhook.stripe.customer_mapping', {
      scopeId,
      customerId,
      action: 'upsert',
    }, 'webhooks');
  }

  if (mode === 'payment') {
    const paymentIntent = getString(obj, ['payment_intent']);
    const amountTotal = getNumber(obj, ['amount_total']);
    const currencyRaw = getString(obj, ['currency']);
    const invoiceId = getString(obj, ['invoice']);
    const invoicePdf = getString(obj, ['invoice_pdf']);

    const amountMajor = amountTotal && currencyRaw
      ? toMajorNumberCurrency(BigInt(amountTotal), currencyRaw)
      : undefined;
    const credits = amountMajor !== undefined && currencyRaw
      ? creditsForPurchase(amountMajor, currencyRaw)
      : undefined;
    const currency = (currencyRaw ?? '').toUpperCase();

    if (!scopeId || !paymentIntent || !credits || amountMajor === undefined || !currency) return;

    eventLog.info('checkout completed - emitting events', {
      phase: 'topup_checkout_completed',
      scopeId,
      customerId,
      paymentIntent,
      credits,
      amountMajor,
      currency,
    });

    // Emit topup completed event (credits module listens)
    await emitTyped('webhook.stripe.topup_completed', {
      scopeId,
      customerId: customerId ?? null,
      paymentIntentId: paymentIntent,
      amount: amountMajor,
      currency,
      credits,
      invoiceId: invoiceId ?? null,
      invoicePdf: invoicePdf ?? null,
    }, 'webhooks');

    // Emit payment event (billing module listens)
    await emitTyped('webhook.stripe.payment_event', {
      scopeId,
      customerId: customerId ?? null,
      paymentIntentId: paymentIntent,
      amount: amountMajor,
      currency,
      status: 'succeeded',
    }, 'webhooks');

    // Emit invoice event if present (billing module listens)
    if (invoiceId) {
      await emitTyped('webhook.stripe.invoice_event', {
        scopeId,
        customerId: customerId ?? null,
        invoiceId,
        paymentIntentId: paymentIntent,
        amount: amountMajor,
        currency,
        status: 'paid',
        url: invoicePdf ?? null,
        eventType: 'checkout.session.completed',
      }, 'webhooks');
    }
  }
}

/**
 * Handle invoice.* events
 * Emits events for: invoice record, payment record, credit grants
 */
export async function handleInvoiceEvent(
  type: string,
  obj: Record<string, unknown>,
  eventId?: string
): Promise<void> {
  const customerId = getString(obj, ['customer']);
  const scopeId = await findScopeIdByCustomerStripe(customerId);
  if (!scopeId) return;

  const paymentIntent = getString(obj, ['payment_intent']);
  const amountPaid = getNumber(obj, ['amount_paid']);
  const currencyRaw = getString(obj, ['currency']);
  const hostedUrl = getString(obj, ['hosted_invoice_url']);
  const invoiceId = getString(obj, ['id']);
  const currency = (currencyRaw ?? '').toUpperCase();

  if (!currency || !invoiceId) return;

  const eventLog = log.child({ type, eventId, scopeId, invoiceId });
  const mode = await getBillingModeViaPort();
  eventLog.info('invoice event - emitting events', { phase: 'invoice_event', mode, amountPaid, currency });

  // Emit payment event
  if (paymentIntent && amountPaid && currency &&
      (type === 'invoice.payment_succeeded' || type === 'invoice.payment_failed')) {
    const amountMajorPaid = toMajorNumberCurrency(BigInt(amountPaid), currency);

    await emitTyped('webhook.stripe.payment_event', {
      scopeId,
      customerId: customerId ?? null,
      paymentIntentId: paymentIntent,
      amount: amountMajorPaid,
      currency,
      status: type === 'invoice.payment_succeeded' ? 'succeeded' : 'failed',
    }, 'webhooks');
  }

  // Emit invoice event
  const amountMajorInv = amountPaid !== undefined && currencyRaw
    ? toMajorNumberCurrency(BigInt(amountPaid ?? 0), currencyRaw)
    : 0;
  const invoiceStatus =
    type === 'invoice.payment_succeeded' ? 'paid' as const
    : type === 'invoice.voided' ? 'void' as const
    : type === 'invoice.marked_uncollectible' ? 'uncollectible' as const
    : 'open' as const;

  await emitTyped('webhook.stripe.invoice_event', {
    scopeId,
    customerId: customerId ?? null,
    invoiceId,
    paymentIntentId: paymentIntent ?? null,
    amount: amountMajorInv,
    currency,
    status: invoiceStatus,
    url: hostedUrl ?? null,
    eventType: type,
  }, 'webhooks');

  // Subscription credits grant
  if (type === 'invoice.payment_succeeded' && mode === 'subscription_with_credits') {
    const subscriptionId = getString(obj, ['subscription']) ??
      getString(obj, ['lines', 'data', '0', 'parent', 'subscription_item_details', 'subscription']) ??
      getString(obj, ['parent', 'subscription_details', 'subscription']);
    const billingReason = getString(obj, ['billing_reason']);
    const isSubscriptionInvoice = !!subscriptionId && (!billingReason || /subscription/i.test(billingReason));

    if (!isSubscriptionInvoice) {
      eventLog.debug('not subscription invoice; skipping credits', { billingReason, subscriptionId });
      return;
    }

    const periodEndSec = getNumber(obj, ['lines', 'data', '0', 'period', 'end']) ??
      getNumber(obj, ['current_period_end']);
    const expiresAt = typeof periodEndSec === 'number' && Number.isFinite(periodEndSec)
      ? new Date(periodEndSec * 1000).toISOString()
      : null;
    const ent = await resolveEntitlements(scopeId);
    const creditsCfg = ent.credits as Record<string, { grant: number; period: 'month' | 'year' }> | undefined;

    if (creditsCfg) {
      const creditGrants: Array<{ key: string; amount: number }> = [];
      for (const [key, v] of Object.entries(creditsCfg)) {
        if (typeof v.grant === 'number' && v.grant > 0) {
          creditGrants.push({ key, amount: v.grant });
        }
      }

      if (creditGrants.length > 0) {
        eventLog.info('emitting subscription invoice paid event', {
          phase: 'subscription_invoice_grant',
          subscriptionId,
          billingReason,
          creditsKeys: creditGrants.map(g => g.key),
        });

        await emitTyped('webhook.stripe.subscription_invoice_paid', {
          scopeId,
          customerId: customerId ?? null,
          subscriptionId: subscriptionId ?? null,
          invoiceId,
          amount: amountMajorInv,
          currency,
          periodEnd: expiresAt,
          creditGrants,
        }, 'webhooks');
      }
    }
  }
}

/**
 * Handle customer.subscription.* events
 * Emits events for: subscription changes (plan, status, quantity)
 */
export async function handleSubscriptionEvent(
  type: string,
  obj: Record<string, unknown>,
  eventId?: string
): Promise<void> {
  const customerId = getString(obj, ['customer']);
  const scopeId = await findScopeIdByCustomerStripe(customerId);
  if (!scopeId) return;

  const subId = getString(obj, ['id']);
  const statusRaw = getString(obj, ['status']);
  const quantity = getNumber(obj, ['quantity']);
  const priceId = getString(obj, ['plan', 'id']);
  const cancelAtPeriodEnd = getAny(obj, ['cancel_at_period_end']) === true;
  const currentPeriodEnd = getNumber(obj, ['current_period_end']) ??
    getNumber(obj, ['items', 'data', '0', 'current_period_end']);

  const eventLog = log.child({ type, eventId, scopeId, subId });

  // Map Stripe status to our status enum
  const status = mapStripeStatus(statusRaw);
  const eventType = type === 'customer.subscription.created' ? 'created' as const
    : type === 'customer.subscription.deleted' ? 'deleted' as const
    : 'updated' as const;

  eventLog.info('subscription event - emitting event', { priceId, statusRaw, status, cancelAtPeriodEnd });

  // Use reliable event delivery for subscription changes
  // Critical for plan updates, seat capacity changes, and cache invalidation
  await emitTypedReliable('webhook.stripe.subscription_changed', {
    scopeId,
    subscriptionId: subId ?? '',
    priceId: priceId ?? null,
    status: eventType === 'deleted' ? DELETED_SUBSCRIPTION_STATUS : status,
    quantity: quantity ?? null,
    cancelAtPeriodEnd,
    currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
    eventType,
  }, 'webhooks');
}

/**
 * Handle customer.deleted event
 * Emits event for: customer mapping deletion
 */
export async function handleCustomerDeleted(obj: Record<string, unknown>): Promise<void> {
  const customerId = getString(obj, ['id']);
  if (!customerId) return;

  const scopeId = await findScopeIdByCustomerStripe(customerId);
  if (!scopeId) return;

  await emitTyped('webhook.stripe.customer_mapping', {
    scopeId,
    customerId,
    action: 'delete',
  }, 'webhooks');
}

/**
 * Handle charge.refunded event
 * Emits event for: payment status update
 */
export async function handleChargeRefunded(obj: Record<string, unknown>): Promise<void> {
  const paymentIntent = getString(obj, ['payment_intent']);
  const customerId = getString(obj, ['customer']);
  const scopeId = await findScopeIdByCustomerStripe(customerId);
  if (!scopeId || !paymentIntent) return;

  await emitTyped('webhook.stripe.payment_event', {
    scopeId,
    customerId: customerId ?? null,
    paymentIntentId: paymentIntent,
    amount: 0, // Amount doesn't change on refund
    currency: '',
    status: 'refunded',
  }, 'webhooks');
}

/**
 * Map Stripe subscription status to our SubscriptionStatus enum.
 * Maps to values defined in kernel/constants/billing.ts
 */
function mapStripeStatus(status: string | null | undefined): SubscriptionStatus {
  switch (status) {
    case 'active': return 'active';
    case 'past_due': return 'past_due';
    case 'canceled': return 'canceled';
    case 'incomplete': return 'incomplete';
    case 'incomplete_expired': return 'incomplete';
    case 'trialing': return 'trialing';
    case 'unpaid': return 'unpaid';
    default: return 'incomplete';
  }
}
