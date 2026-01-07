import { logger } from '@unisane/kernel';
import { getString, getAny } from '../utils';
import { handlePaymentCaptured, handleSubscriptionEvent } from './handlers';

export async function handleRazorpayEvent(evt: unknown): Promise<void> {
  if (!evt || typeof evt !== 'object') return;
  
  const type = getString(evt, ['event']) || getString(evt, ['type']);
  
  // Parse payload - try common shapes
  const obj = ((): unknown => {
    const p = getAny(evt, ['payload']);
    if (p && typeof p === 'object') {
      const payment = getAny(p, ['payment', 'entity']);
      const subscription = getAny(p, ['subscription', 'entity']);
      return (payment ?? subscription) as unknown;
    }
    return getAny(evt, ['entity']) ?? evt;
  })();
  
  const log = logger.child({ src: 'webhooks.razorpay', type });
  
  if (!type || !obj || typeof obj !== 'object') {
    log.debug('razorpay webhook ignored', { reason: 'missing_type_or_object' });
    return;
  }

  if (/payment\.captured/i.test(type)) {
    return handlePaymentCaptured(obj as Record<string, unknown>);
  }

  if (/subscription\.(activated|charged|completed|updated|paused|cancelled)/i.test(type)) {
    return handleSubscriptionEvent(type, obj as Record<string, unknown>);
  }
  
  log.debug('unhandled razorpay event type', { type });
}
