import { z } from 'zod';
import { ZAppEnv } from '@unisane/kernel';
import { ZRFC3339 } from '@unisane/kernel';

export const ZExposure = z.object({
  env: ZAppEnv,
  flagKey: z.string().min(1),
  value: z.boolean(),
  reason: z.enum(['rule_match', 'target_match', 'default', 'user_override', 'tenant_override', 'evaluation']),
  ruleIndex: z.number().int().optional(), // index of the rule that matched, if any
  userId: z.string().optional(),
  tenantId: z.string().optional(),
  timestamp: ZRFC3339,
});

export type Exposure = z.infer<typeof ZExposure>;
