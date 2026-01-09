import { z } from "zod";

export const ZTenantAdminSubscription = z.object({
  status: z.string().nullable(),
  quantity: z.number().nullable(),
  currentPeriodEnd: z.string().nullable(),
});

export const ZTenantAdminView = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  planId: z.string(),
  membersCount: z.number(),
  adminsCount: z.number(),
  apiKeysCount: z.number(),
  flagOverridesCount: z.number(),
  invoicesOpenCount: z.number(),
  webhooksFailed24h: z.number(),
  creditsAvailable: z.number(),
  lastActivityAt: z.string().nullable(),
  subscription: ZTenantAdminSubscription.nullable(),
});

export type TenantAdminViewDto = z.infer<typeof ZTenantAdminView>;

