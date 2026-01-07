import { logger } from '@unisane/kernel';
import { getString, getAny } from '../utils';
import {
  handleCheckoutCompleted,
  handleInvoiceEvent,
  handleSubscriptionEvent,
  handleCustomerDeleted,
  handleChargeRefunded,
} from './handlers';

export async function handleStripeEvent(evt: unknown): Promise<void> {
  if (!evt || typeof evt !== 'object') return;
  
  const type = getString(evt, ['type']);
  const obj = getAny(evt, ['data', 'object']);
  const eventId = getString(evt, ['id']);
  
  const log = logger.child({ src: 'webhooks.stripe', type, eventId });
  
  if (!type || !obj || typeof obj !== 'object') {
    log.debug('stripe webhook ignored', { reason: 'missing_type_or_object' });
    return;
  }

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
