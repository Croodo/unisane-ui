import { z } from "zod";

export const ZAuditLogView = z.object({
  id: z.string(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().nullable().optional(),
  actorId: z.string().nullable().optional(),
  requestId: z.string().nullable().optional(),
  ip: z.string().nullable().optional(),
  ua: z.string().nullable().optional(),
  // Dates at edges are ISO strings
  createdAt: z.string().optional(),
});

export type AuditLogViewDto = z.infer<typeof ZAuditLogView>;

