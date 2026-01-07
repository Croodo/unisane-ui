import { z } from 'zod';
import { ZRFC3339 } from '@unisane/kernel';

export const ZUsageIncrement = z.object({
  feature: z.string().min(1),
  n: z.number().int().positive().default(1),
  at: ZRFC3339.optional(),
  idempotencyKey: z.string().min(8).optional(),
});

export const ZGetWindow = z.object({
  tenantId: z.string().min(1),
  feature: z.string().min(1),
  window: z.enum(['minute', 'hour', 'day']),
  at: ZRFC3339.optional(),
});
