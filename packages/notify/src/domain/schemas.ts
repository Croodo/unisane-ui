import { z } from 'zod';
import { ZNotificationCategory } from '@unisane/kernel';

export const ZEmailAddress = z.object({ email: z.string().email(), name: z.string().optional() });

export const ZEmailEnqueue = z.object({
  to: ZEmailAddress,
  template: z.string().min(1),
  props: z.record(z.string(), z.unknown()).default({}),
  category: ZNotificationCategory.optional(),
  locale: z.string().optional(),
});

export const ZPrefUpdate = z.object({
  categories: z.record(z.string(), z.boolean()),
});

export const ZMarkRead = z.object({ id: z.string().min(1) });
