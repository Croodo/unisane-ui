import { z } from "zod";
import { ZIdem } from "@unisane/kernel";
import { ZRFC3339 } from "@unisane/kernel";

export const ZGrantTokens = z.object({
  amount: z.number().int().positive(),
  reason: z.string().min(2),
  expiresAt: ZRFC3339.optional(),
  idem: ZIdem,
});

export const ZBurnTokens = z.object({
  amount: z.number().int().positive(),
  reason: z.string().min(1).default("usage"),
  feature: z.string().optional(),
  idem: ZIdem,
});

export const ZListCursor = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(50),
});
