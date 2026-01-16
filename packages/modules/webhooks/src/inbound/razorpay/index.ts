import { logger } from '@unisane/kernel';
import { z } from 'zod';
import { handlePaymentCaptured, handleSubscriptionEvent } from './handlers';

const ZRazorpayEvent = z.object({
  event: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  payload: z.object({
    payment: z.object({ entity: z.record(z.unknown()) }).optional(),
    subscription: z.object({ entity: z.record(z.unknown()) }).optional(),
  }).optional(),
  entity: z.record(z.unknown()).optional(),
}).refine(
  (data) => data.event || data.type,
  { message: 'Either event or type must be present' }
);

export async function handleRazorpayEvent(evt: unknown): Promise<void> {
  const parseResult = ZRazorpayEvent.safeParse(evt);
  if (!parseResult.success) {
    logger.child({ src: 'webhooks.razorpay' }).debug('razorpay webhook ignored', {
      reason: 'invalid_event_structure',
      errors: parseResult.error.flatten().fieldErrors,
    });
    return;
  }

  const data = parseResult.data;
  const type = data.event ?? data.type ?? '';
  const obj = data.payload?.payment?.entity ?? data.payload?.subscription?.entity ?? data.entity;

  const log = logger.child({ src: 'webhooks.razorpay', type });

  if (!obj) {
    log.debug('razorpay webhook ignored', { reason: 'missing_entity' });
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
