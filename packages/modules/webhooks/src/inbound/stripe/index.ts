import { logger } from '@unisane/kernel';
import { z } from 'zod';
import {
  handleCheckoutCompleted,
  handleInvoiceEvent,
  handleSubscriptionEvent,
  handleCustomerDeleted,
  handleChargeRefunded,
} from './handlers';

/**
 * WEBH-001 FIX: Zod schema for validating Stripe webhook event structure.
 * Ensures type safety without unsafe casting.
 */
const ZStripeEvent = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  data: z.object({
    object: z.record(z.unknown()),
  }),
});

export async function handleStripeEvent(evt: unknown): Promise<void> {
  // WEBH-001 FIX: Validate event structure with Zod instead of unsafe casting
  const parseResult = ZStripeEvent.safeParse(evt);
  if (!parseResult.success) {
    logger.child({ src: 'webhooks.stripe' }).debug('stripe webhook ignored', {
      reason: 'invalid_event_structure',
      errors: parseResult.error.flatten().fieldErrors,
    });
    return;
  }

  const { id: eventId, type, data } = parseResult.data;
  const obj = data.object;

  const log = logger.child({ src: 'webhooks.stripe', type, eventId });

  switch (type) {
    case 'checkout.session.completed':
      return handleCheckoutCompleted(obj as Record<string, unknown>, eventId);
    
    case 'invoice.payment_succeeded':
    case 'invoice.payment_failed':
    case 'invoice.voided':
    case 'invoice.marked_uncollectible':
      return handleInvoiceEvent(type, obj as Record<string, unknown>, eventId);
    
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      return handleSubscriptionEvent(type, obj as Record<string, unknown>, eventId);
    
    case 'customer.deleted':
      return handleCustomerDeleted(obj as Record<string, unknown>);
    
    case 'charge.refunded':
      return handleChargeRefunded(obj as Record<string, unknown>);
    
    default:
      log.debug('unhandled stripe event type', { type });
  }
}
