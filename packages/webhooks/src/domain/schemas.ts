import { z } from 'zod';
import { ZCursor, ZLimitCoerce } from '@unisane/kernel';

export const ZListWebhookEventsQuery = z.object({
  cursor: ZCursor.optional(),
  limit: ZLimitCoerce,
  direction: z.enum(['in', 'out']).optional(),
  status: z.string().optional(),
});

