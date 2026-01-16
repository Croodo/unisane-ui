/**
 * Credits Module Event Handlers
 *
 * This file contains event handlers that allow the credits module to respond to
 * events from other modules without direct imports. This achieves loose coupling
 * as part of the hexagonal architecture.
 *
 * Usage:
 * ```typescript
 * import { registerCreditEventHandlers } from '@unisane/credits';
 *
 * // In bootstrap.ts
 * registerCreditEventHandlers();
 * ```
 *
 * CRED-006 FIX (Architecture Design Decision):
 * This module listens to `webhook.stripe.*` and `webhook.razorpay.*` events which are
 * domain events emitted by the webhooks module after processing inbound webhooks.
 * This is intentional and follows hexagonal architecture principles:
 *
 * 1. The credits module does NOT directly import Stripe/Razorpay SDKs
 * 2. The webhooks module translates raw webhook payloads into typed domain events
 * 3. The credits module only depends on kernel event types (BillingEventPayload)
 * 4. All coupling is through the kernel's type-safe event system
 *
 * The event names like `webhook.stripe.topup_completed` are domain events, NOT raw
 * webhook events. The webhooks adapter layer transforms raw Stripe/Razorpay payloads
 * into these standardized domain events.
 *
 * Alternative approach (not implemented): Define abstract billing events like
 * `billing.payment.completed` that both Stripe and Razorpay handlers emit.
 * This would provide better abstraction but adds complexity for minimal benefit
 * since the credit granting logic may differ per provider.
 */

import { events, logger, onTyped } from '@unisane/kernel';
import type { BillingEventPayload } from '@unisane/kernel';
import { grantWithExplicitScope } from './service/grant';

const log = logger.child({ module: 'credits', component: 'event-handlers' });

/**
 * Handle credit grant requests from any source.
 * This is the primary event-driven interface for granting credits.
 */
async function handleCreditGrantRequested(
  payload: BillingEventPayload<'credits.grant_requested'>
): Promise<void> {
  const { scopeId, amount, reason, idempotencyKey, expiresAt, source, metadata } = payload;

  log.info('processing credit grant request', {
    scopeId,
    amount,
    reason,
    source,
    idempotencyKey,
  });

  try {
    const result = await grantWithExplicitScope({
      scopeId,
      amount,
      reason: `${source}:${reason}`,
      idem: idempotencyKey,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    if (result.deduped) {
      log.debug('credit grant deduplicated', { scopeId, idempotencyKey });
    } else {
      log.info('credits granted via event', {
        scopeId,
        amount,
        reason,
        source,
        creditId: result.id,
      });
    }
  } catch (error) {
    log.error('failed to grant credits via event', {
      scopeId,
      amount,
      reason,
      source,
      error: error instanceof Error ? error.message : String(error),
    });
    // Re-throw to let event system handle retry logic
    throw error;
  }
}

/**
 * Handle Stripe topup checkout completion.
 * Converts the webhook event into credit grant.
 */
async function handleStripeTopupCompleted(
  payload: BillingEventPayload<'webhook.stripe.topup_completed'>
): Promise<void> {
  const { scopeId, paymentIntentId, credits, amount, currency } = payload;

  if (!credits || credits <= 0) {
    log.debug('stripe topup has no credits to grant', { scopeId, paymentIntentId });
    return;
  }

  log.info('processing stripe topup credits', {
    scopeId,
    paymentIntentId,
    credits,
    amount,
    currency,
  });

  await handleCreditGrantRequested({
    scopeId,
    amount: credits,
    reason: 'purchase',
    idempotencyKey: paymentIntentId,
    expiresAt: null,
    source: 'stripe_topup',
    metadata: { amount, currency },
  });
}

/**
 * Handle Stripe subscription invoice payment.
 * Grants subscription credits based on entitlements.
 */
async function handleStripeSubscriptionInvoicePaid(
  payload: BillingEventPayload<'webhook.stripe.subscription_invoice_paid'>
): Promise<void> {
  const { scopeId, invoiceId, creditGrants, periodEnd } = payload;

  if (!creditGrants || creditGrants.length === 0) {
    log.debug('subscription invoice has no credit grants', { scopeId, invoiceId });
    return;
  }

  log.info('processing subscription invoice credits', {
    scopeId,
    invoiceId,
    grantCount: creditGrants.length,
  });

  for (const { key, amount } of creditGrants) {
    if (amount <= 0) continue;

    await handleCreditGrantRequested({
      scopeId,
      amount,
      reason: key,
      idempotencyKey: `${invoiceId}:subcred:${key}`,
      expiresAt: periodEnd,
      source: 'stripe_subscription',
      metadata: { invoiceId, key },
    });
  }
}

/**
 * Handle Razorpay payment completion.
 */
async function handleRazorpayPaymentCompleted(
  payload: BillingEventPayload<'webhook.razorpay.payment_completed'>
): Promise<void> {
  const { scopeId, paymentId, credits } = payload;

  if (!credits || credits <= 0) {
    log.debug('razorpay payment has no credits to grant', { scopeId, paymentId });
    return;
  }

  await handleCreditGrantRequested({
    scopeId,
    amount: credits,
    reason: 'purchase',
    idempotencyKey: paymentId,
    expiresAt: null,
    source: 'razorpay_topup',
    metadata: { paymentId },
  });
}

/**
 * Register all credit event handlers.
 * Call this during application bootstrap.
 *
 * @returns Cleanup function to unsubscribe all handlers
 */
export function registerCreditEventHandlers(): () => void {
  log.info('registering credit event handlers');

  const unsubscribers: Array<() => void> = [];

  // Generic credit grant request
  unsubscribers.push(
    onTyped('credits.grant_requested', async (event) => {
      await handleCreditGrantRequested(event.payload);
    })
  );

  // Stripe events
  unsubscribers.push(
    onTyped('webhook.stripe.topup_completed', async (event) => {
      await handleStripeTopupCompleted(event.payload);
    })
  );

  unsubscribers.push(
    onTyped('webhook.stripe.subscription_invoice_paid', async (event) => {
      await handleStripeSubscriptionInvoicePaid(event.payload);
    })
  );

  // Razorpay events
  unsubscribers.push(
    onTyped('webhook.razorpay.payment_completed', async (event) => {
      await handleRazorpayPaymentCompleted(event.payload);
    })
  );

  log.info('credit event handlers registered', { count: unsubscribers.length });

  // Return cleanup function
  return () => {
    log.info('unregistering credit event handlers');
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
