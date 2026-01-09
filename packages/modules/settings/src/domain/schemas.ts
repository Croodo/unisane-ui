import { z } from 'zod';

export const ZGetSetting = z.object({
  env: z.string().optional(),
  ns: z.string().min(2),
  key: z.string().min(1),
});

export const ZSettingOut = z.object({
  env: z.string().optional(),
  namespace: z.string(),
  key: z.string(),
  value: z.unknown().nullable(),
  version: z.number().int(),
});

export const ZPatchSetting = z.object({
  env: z.string().optional(),
  namespace: z.string().min(2),
  key: z.string().min(1),
  value: z.unknown().optional(),
  unset: z.boolean().optional(),
  expectedVersion: z.number().int().nonnegative().optional(),
});

export type PatchSetting = z.infer<typeof ZPatchSetting>;

