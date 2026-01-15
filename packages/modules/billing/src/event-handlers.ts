/**
 * Billing Module Event Handlers
 *
 * This file contains event handlers that allow the billing module to respond to
 * events from webhook handlers without direct imports. This achieves loose coupling
 * as part of the hexagonal architecture.
 *
 * The billing module listens for:
 * - Invoice events (to record invoices)
 * - Payment events (to record payments)
 * - Subscription events (to update subscriptions)
 * - Customer mapping events (to manage tenant-customer links)
 *
 * Usage:
 * ```typescript
 * import { registerBillingEventHandlers } from '@unisane/billing';
 *
 * // In bootstrap.ts
 * registerBillingEventHandlers();
 * ```
 */

import { logger, onTyped, mapInvoiceStatus, mapPaymentStatus, mapStripeSubStatus } from '@unisane/kernel';
import type { BillingEventPayload } from '@unisane/kernel';
import { InvoicesRepository } from './data/invoices.repository';
import { PaymentsRepository } from './data/payments.repository';
import { SubscriptionsRepository } from './data/subscriptions.repository';
import { upsertCustomerMapping, softDeleteCustomerMapping } from './data/scope-integrations.repository';

const log = logger.child({ module: 'billing', component: 'event-handlers' });

/**
 * Handle Stripe invoice events.
 * Records or updates invoice in the database.
 */
async function handleStripeInvoiceEvent(
  payload: BillingEventPayload<'webhook.stripe.invoice_event'>
): Promise<void> {
  const { scopeId, invoiceId, amount, currency, status, url, eventType } = payload;

  log.info('processing stripe invoice event', {
    scopeId,
    invoiceId,
    status,
    eventType,
  });

  try {
    await InvoicesRepository.upsertByProviderId({
      scopeId,
      provider: 'stripe',
      providerInvoiceId: invoiceId,
      amount,
      currency,
      status: mapInvoiceStatus(status),
      url: url ?? null,
    });

    log.info('stripe invoice recorded', { scopeId, invoiceId, status });
  } catch (error) {
    log.error('failed to record stripe invoice', {
      scopeId,
      invoiceId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Handle Stripe payment events.
 * Records or updates payment in the database.
 */
async function handleStripePaymentEvent(
  payload: BillingEventPayload<'webhook.stripe.payment_event'>
): Promise<void> {
  const { scopeId, paymentIntentId, amount, currency, status } = payload;

  log.info('processing stripe payment event', {
    scopeId,
    paymentIntentId,
    status,
  });

  try {
    await PaymentsRepository.upsertByProviderId({
      scopeId,
      provider: 'stripe',
      providerPaymentId: paymentIntentId,
      amount,
      currency,
      status: mapPaymentStatus(status),
      capturedAt: status === 'succeeded' ? new Date() : null,
    });

    log.info('stripe payment recorded', { scopeId, paymentIntentId, status });
  } catch (error) {
    log.error('failed to record stripe payment', {
      scopeId,
      paymentIntentId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Handle Stripe subscription changes.
 * Updates subscription record in the database.
 */
async function handleStripeSubscriptionChanged(
  payload: BillingEventPayload<'webhook.stripe.subscription_changed'>
): Promise<void> {
  const {
    scopeId,
    subscriptionId,
    priceId,
    status,
    quantity,
    cancelAtPeriodEnd,
    currentPeriodEnd,
    eventType,
  } = payload;

  log.info('processing stripe subscription change', {
    scopeId,
    subscriptionId,
    status,
    eventType,
  });

  try {
    await SubscriptionsRepository.upsertByProviderId({
      scopeId,
      provider: 'stripe',
      providerSubId: subscriptionId,
      planId: priceId ?? 'unknown',
      quantity: quantity ?? 1,
      status: mapStripeSubStatus(status),
      providerStatus: status,
      cancelAtPeriodEnd,
      currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
    });

    log.info('stripe subscription updated', {
      scopeId,
      subscriptionId,
      status,
      eventType,
    });
  } catch (error) {
    log.error('failed to update stripe subscription', {
      scopeId,
      subscriptionId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Handle Stripe customer mapping events.
 * Creates or deletes tenant-to-customer mappings.
 */
async function handleStripeCustomerMapping(
  payload: BillingEventPayload<'webhook.stripe.customer_mapping'>
): Promise<void> {
  const { scopeId, customerId, action } = payload;

  log.info('processing stripe customer mapping', {
    scopeId,
    customerId,
    action,
  });

  try {
    if (action === 'upsert') {
      await upsertCustomerMapping(scopeId, 'stripe', customerId);
      log.info('stripe customer mapping created', { scopeId, customerId });
    } else if (action === 'delete') {
      await softDeleteCustomerMapping('stripe', customerId);
      log.info('stripe customer mapping deleted', { customerId });
    }
  } catch (error) {
    log.error('failed to handle stripe customer mapping', {
      scopeId,
      customerId,
      action,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Handle Razorpay payment events.
 * Records or updates payment in the database.
 */
async function handleRazorpayPaymentEvent(
  payload: BillingEventPayload<'webhook.razorpay.payment_event'>
): Promise<void> {
  const { scopeId, paymentId, amount, currency, status } = payload;

  log.info('processing razorpay payment event', {
    scopeId,
    paymentId,
    status,
  });

  try {
    await PaymentsRepository.upsertByProviderId({
      scopeId,
      provider: 'razorpay',
      providerPaymentId: paymentId,
      amount,
      currency,
      status: mapPaymentStatus(status),
      capturedAt: status === 'succeeded' ? new Date() : null,
    });

    log.info('razorpay payment recorded', { scopeId, paymentId, status });
  } catch (error) {
    log.error('failed to record razorpay payment', {
      scopeId,
      paymentId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Handle Razorpay subscription changes.
 * Updates subscription record in the database.
 * Uses normalizedStatus (already mapped to internal SSOT) and rawStatus (original from Razorpay).
 */
async function handleRazorpaySubscriptionChanged(
  payload: BillingEventPayload<'webhook.razorpay.subscription_changed'>
): Promise<void> {
  const { scopeId, subscriptionId, planId, rawStatus, normalizedStatus, eventType } = payload;

  log.info('processing razorpay subscription change', {
    scopeId,
    subscriptionId,
    rawStatus,
    normalizedStatus,
    eventType,
  });

  try {
    await SubscriptionsRepository.upsertByProviderId({
      scopeId,
      provider: 'razorpay',
      providerSubId: subscriptionId,
      planId: planId ?? 'unknown',
      quantity: 1,
      status: normalizedStatus,
      providerStatus: rawStatus,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
    });

    log.info('razorpay subscription updated', {
      scopeId,
      subscriptionId,
      status: normalizedStatus,
      eventType,
    });
  } catch (error) {
    log.error('failed to update razorpay subscription', {
      scopeId,
      subscriptionId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Register all billing event handlers.
 * Call this during application bootstrap.
 *
 * @returns Cleanup function to unsubscribe all handlers
 */
export function registerBillingEventHandlers(): () => void {
  log.info('registering billing event handlers');

  const unsubscribers: Array<() => void> = [];

  // Stripe events
  unsubscribers.push(
    onTyped('webhook.stripe.invoice_event', async (event) => {
      await handleStripeInvoiceEvent(event.payload);
    })
  );

  unsubscribers.push(
    onTyped('webhook.stripe.payment_event', async (event) => {
      await handleStripePaymentEvent(event.payload);
    })
  );

  unsubscribers.push(
    onTyped('webhook.stripe.subscription_changed', async (event) => {
      await handleStripeSubscriptionChanged(event.payload);
    })
  );

  unsubscribers.push(
    onTyped('webhook.stripe.customer_mapping', async (event) => {
      await handleStripeCustomerMapping(event.payload);
    })
  );

  // Razorpay events
  unsubscribers.push(
    onTyped('webhook.razorpay.payment_event', async (event) => {
      await handleRazorpayPaymentEvent(event.payload);
    })
  );

  unsubscribers.push(
    onTyped('webhook.razorpay.subscription_changed', async (event) => {
      await handleRazorpaySubscriptionChanged(event.payload);
    })
  );

  log.info('billing event handlers registered', { count: unsubscribers.length });

  // Return cleanup function
  return () => {
    log.info('unregistering billing event handlers');
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
