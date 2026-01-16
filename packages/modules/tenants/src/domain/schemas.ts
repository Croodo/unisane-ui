import { z } from "zod";

/**
 * Tenant status values.
 */
export const ZTenantStatus = z.enum(["active", "suspended", "deleted"]);

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
  status: ZTenantStatus,
  statusReason: z.string().optional(),
  statusChangedAt: z.string().optional(),
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

/**
 * Input for updating tenant status.
 */
export const ZUpdateTenantStatusInput = z.object({
  status: ZTenantStatus,
  reason: z.string().max(500).optional(),
});

export type UpdateTenantStatusInput = z.infer<typeof ZUpdateTenantStatusInput>;

