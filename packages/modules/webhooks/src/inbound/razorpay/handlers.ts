/**
 * Razorpay Webhook Handlers (Event-Driven)
 *
 * These handlers emit events instead of directly calling services.
 * Other modules listen to these events and respond accordingly.
 *
 * Event Flow:
 * Razorpay Webhook → handlers.ts → emitTyped() → Event Bus
 *   → @unisane/credits (event-handlers.ts) → grant credits
 *   → @unisane/billing (event-handlers.ts) → record payments/subscriptions
 *   → @unisane/tenants (event-handlers.ts) → update plan
 *   → @unisane/settings (event-handlers.ts) → update seat capacity
 */

import {
  emitTyped,
  logger,
  reverseMapPlanIdFromProvider,
  resolveEntitlements,
  toMajorNumberCurrency,
  mapRazorpaySubStatus,
} from '@unisane/kernel';
import { getString, getNumber, getAny } from '../utils';

const log = logger.child({ src: 'webhooks.razorpay' });

/**
 * Map Razorpay event type to our event type enum
 */
function mapRazorpayEventType(type: string): 'activated' | 'charged' | 'completed' | 'updated' | 'cancelled' | 'paused' | 'resumed' {
  if (/activated/i.test(type)) return 'activated';
  if (/charged/i.test(type)) return 'charged';
  if (/completed/i.test(type)) return 'completed';
  if (/cancelled|canceled/i.test(type)) return 'cancelled';
  if (/paused/i.test(type)) return 'paused';
  if (/resumed/i.test(type)) return 'resumed';
  return 'updated';
}

/**
 * Handle payment.captured
 * Emits events for: payment record, credit grant (if applicable)
 */
export async function handlePaymentCaptured(obj: Record<string, unknown>): Promise<void> {
  const eventLog = log.child({ type: 'payment.captured' });
  const providerPaymentId = getString(obj, ['id']);
  const amount = getNumber(obj, ['amount']);
  const currencyRaw = getString(obj, ['currency']);
  const notesAny = getAny(obj, ['notes']);
  const notes = (notesAny && typeof notesAny === 'object') ? (notesAny as Record<string, unknown>) : {};
  const scopeId = typeof notes['tenantId'] === 'string' ? notes['tenantId'] as string : undefined;
  const creditsStr = typeof notes['credits'] === 'string' ? notes['credits'] as string : undefined;
  const creditsNum = typeof notes['credits'] === 'number' ? notes['credits'] as number : undefined;
  const credits = creditsNum ?? (creditsStr ? Number.parseInt(creditsStr, 10) : undefined);
  const currency = (currencyRaw ?? '').toUpperCase();

  if (!scopeId || !providerPaymentId || !amount || !currency) {
    eventLog.debug('missing required fields', { scopeId, providerPaymentId, hasAmount: !!amount, currency });
    return;
  }

  const amountMajor = amount && currencyRaw ? toMajorNumberCurrency(BigInt(amount), currencyRaw) : 0;

  eventLog.info('emitting razorpay payment event', { scopeId, providerPaymentId, status: 'succeeded' });

  // Emit payment event for billing module to record
  await emitTyped('webhook.razorpay.payment_event', {
    scopeId,
    paymentId: providerPaymentId,
    amount: amountMajor,
    currency,
    status: 'succeeded',
  }, 'webhooks');

  // Emit credit grant event if credits are specified
  if (typeof credits === 'number' && Number.isFinite(credits) && credits > 0) {
    eventLog.info('emitting razorpay payment completed for credits', { scopeId, credits });
    await emitTyped('webhook.razorpay.payment_completed', {
      scopeId,
      paymentId: providerPaymentId,
      amount: amountMajor,
      currency,
      credits,
    }, 'webhooks');
  }
}

/**
 * Handle subscription events (subscription.activated, subscription.charged, etc.)
 * Emits events for: subscription update, credit grant (if applicable)
 */
export async function handleSubscriptionEvent(
  type: string,
  obj: Record<string, unknown>
): Promise<void> {
  const eventLog = log.child({ type });
  const subId = getString(obj, ['id']);
  const statusRaw = getString(obj, ['status']);
  const quantity = getNumber(obj, ['quantity']);
  const planId = getString(obj, ['plan_id']) || getString(obj, ['plan', 'id']);
  const currentEndSec = getNumber(obj, ['current_end']);
  const notesAny = getAny(obj, ['notes']);
  const notes = (notesAny && typeof notesAny === 'object') ? (notesAny as Record<string, unknown>) : {};
  const scopeId = typeof notes['tenantId'] === 'string' ? notes['tenantId'] as string : undefined;

  if (!scopeId || !subId) {
    eventLog.debug('missing required fields', { scopeId, subId });
    return;
  }

  eventLog.info('emitting razorpay subscription changed event', { scopeId, subId, statusRaw });

  // Map status for event emission
  const mappedStatus = mapRazorpaySubStatus(statusRaw) as 'active' | 'pending' | 'halted' | 'cancelled' | 'completed' | 'expired';
  const eventType = mapRazorpayEventType(type);

  // Emit subscription changed event for billing module to record
  await emitTyped('webhook.razorpay.subscription_changed', {
    scopeId,
    subscriptionId: subId,
    planId: planId ?? null,
    status: mappedStatus,
    eventType,
  }, 'webhooks');

  // Also emit for tenants module to update plan
  if (planId) {
    const friendly = reverseMapPlanIdFromProvider('razorpay', planId);
    if (friendly && typeof friendly === 'string') {
      // Note: Tenants module should listen to subscription_changed and update plan
      eventLog.info('plan mapping found', { planId, friendly });
    }
  }

  // Grant subscription credits in hybrid mode for charged/completed events
  if (/subscription\.(charged|completed)/i.test(type)) {
    try {
      const ent = await resolveEntitlements(scopeId);
      const creditsCfg = ent.credits as Record<string, { grant: number; period: 'month' | 'year' }> | undefined;

      if (creditsCfg) {
        const chargeAt = getNumber(obj, ['charge_at']) ?? getNumber(obj, ['current_end']);
        const periodEndSec = currentEndSec;
        const expiresAt = typeof periodEndSec === 'number' && Number.isFinite(periodEndSec)
          ? new Date(periodEndSec * 1000).toISOString()
          : null;
        const entries = Object.entries(creditsCfg).filter(([, v]) => typeof v.grant === 'number' && v.grant > 0);

        for (const [key, v] of entries) {
          eventLog.info('emitting credit grant request', { key, amount: v.grant });
          await emitTyped('credits.grant_requested', {
            scopeId,
            amount: v.grant,
            reason: key,
            idempotencyKey: `${subId}:subcred:${chargeAt ?? 'na'}:${key}`,
            expiresAt,
            source: 'razorpay_subscription',
            metadata: { subscriptionId: subId, key },
          }, 'webhooks');
        }
      }
    } catch (err) {
      eventLog.warn('failed to resolve entitlements for subscription credits', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
