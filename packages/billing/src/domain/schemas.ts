import { z } from 'zod';

export const ZSubscribe = z.object({
  planId: z.string().min(2),
  quantity: z.number().int().positive().optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export const ZPortal = z.object({});

export const ZCancel = z.object({ atPeriodEnd: z.boolean().default(true) });

export const ZTopup = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  description: z.string().optional(),
  // Optional redirect overrides (absolute or relative; normalized in service)
  successUrl: z.string().min(1).optional(),
  cancelUrl: z.string().min(1).optional(),
});

export const ZRefund = z.object({
  providerPaymentId: z.string().min(4),
  amount: z.number().positive().optional(),
});

export const ZChangeQuantity = z.object({
  quantity: z.number().int().min(1),
});

export const ZChangePlan = z.object({
  planId: z.string().min(2),
});
