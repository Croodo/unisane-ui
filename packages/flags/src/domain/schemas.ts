import { z } from 'zod';
import { ZAppEnv } from '@unisane/kernel';
import { ZPlanId } from '@unisane/kernel';
import { ZRFC3339 } from '@unisane/kernel';

export const ZRuleCondition = z.union([
  z.object({ planIn: z.array(ZPlanId).min(1) }),
  z.object({ countryIn: z.array(z.string()).min(1) }),
  z.object({ emailDomainIn: z.array(z.string()).min(1) }),
  z.object({ tenantTagIn: z.array(z.string()).min(1) }),
  z.object({ timeWindow: z.object({ from: ZRFC3339.optional(), to: ZRFC3339.optional() }) }),
  z.object({ percentage: z.number().int().min(0).max(100) }),
]);

export const ZRule = z.object({
  if: z.array(ZRuleCondition).min(1),
  then: z.object({ value: z.boolean() }),
});

export const ZFlagWrite = z.object({
  env: ZAppEnv,
  key: z.string().min(1),
  enabledDefault: z.boolean(),
  rules: z.array(ZRule).default([]),
  expectedVersion: z.number().int().nonnegative().optional(),
});

export const ZFlagOut = z.object({
  env: ZAppEnv,
  key: z.string(),
  enabledDefault: z.boolean(),
  rules: z.array(ZRule),
  snapshotVersion: z.number().int().nonnegative(),
  updatedAt: ZRFC3339,
});

export type FlagWrite = z.infer<typeof ZFlagWrite>;

// Overrides
export const ZOverrideWrite = z.object({
  value: z.boolean(),
  expiresAt: ZRFC3339.nullable().optional(),
});

export const ZOverrideOut = z.object({
  value: z.boolean(),
  expiresAt: ZRFC3339.nullable().optional(),
});

// Query for GET /flags/:key
export const ZFlagGetQuery = z.object({ env: ZAppEnv.optional() });

// List query: GET /flags?keys=...&keys=...
// Some clients may send keys as a comma-separated string; accept both.
export const ZFlagsListQuery = z.object({
  env: ZAppEnv.optional(),
  // Tolerant: when omitted or empty, return an empty list (avoid 500s from accidental prefetches)
  keys: z
    .union([
      z.array(z.string()),
      z.string(),
      z.undefined(),
    ])
    .transform((v) => {
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') {
        return v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return [];
    })
    .default([]),
});
