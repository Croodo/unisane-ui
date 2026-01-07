import { z } from 'zod';

export const FLAG_OVERRIDE_SCOPE = ['tenant', 'user'] as const;
export type FlagOverrideScope = (typeof FLAG_OVERRIDE_SCOPE)[number];
export const ZFlagOverrideScope = z.enum(FLAG_OVERRIDE_SCOPE);

