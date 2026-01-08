import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { ZCursor, ZLimitCoerce, ZSeekPageQuery } from "@unisane/kernel/client";
import { defineOpMeta, withMeta } from "./meta";
import { PERM } from "@unisane/kernel/client";

/** Admin audit list query with optional tenantId filter */
export const ZAdminAuditListQuery = ZSeekPageQuery.extend({
  tenantId: z.string().optional(),
});

const c = initContract();

export const ZAuditItem = z.object({
  id: z.string(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().nullable(),
  actorId: z.string().nullable(),
  actorName: z.string().nullable(),
  actorEmail: z.string().nullable(),
  requestId: z.string().nullable(),
  createdAt: z.string(),
});

export type AuditItem = z.infer<typeof ZAuditItem>;

export const ZAdminAuditItem = ZAuditItem.extend({
  tenantId: z.string().nullable(),
  before: z.unknown().nullable().optional(),
  after: z.unknown().nullable().optional(),
  ip: z.string().nullable().optional(),
  ua: z.string().nullable().optional(),
});

export type AdminAuditItem = z.infer<typeof ZAdminAuditItem>;

export const auditContract = c.router({
  list: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/tenants/:tenantId/audit",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      query: z.object({ cursor: ZCursor.optional(), limit: ZLimitCoerce }),
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({
            items: z.array(ZAuditItem),
            nextCursor: z.string().optional(),
          }),
        }),
      },
      summary: "List audit log",
    },
    defineOpMeta({
      op: "audit.list",
      perm: PERM.AUDIT_READ,
      requireTenantMatch: true,
      service: {
        importPath: "@unisane/audit",
        fn: "listAudit",
        zodQuery: { importPath: "@unisane/kernel", name: "ZSeekPageQuery" },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "limit", from: "query", key: "limit" },
          { name: "cursor", from: "query", key: "cursor", optional: true },
        ],
        requireTenantMatch: true,
      },
    })
  ),
  adminList: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/admin/audit",
      query: z.object({
        cursor: ZCursor.optional(),
        limit: ZLimitCoerce,
        tenantId: z.string().optional(),
      }),
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({
            items: z.array(ZAdminAuditItem),
            nextCursor: z.string().optional(),
          }),
        }),
      },
      summary: "List all audit logs (admin)",
    },
    defineOpMeta({
      op: "admin.audit.list",
      requireSuperAdmin: true,
      service: {
        importPath: "@unisane/audit",
        fn: "listAuditAdmin",
        zodQuery: {
          importPath: "./audit.contract",
          name: "ZAdminAuditListQuery",
        },
        invoke: "object",
        callArgs: [
          { name: "limit", from: "query", key: "limit" },
          { name: "cursor", from: "query", key: "cursor", optional: true },
          { name: "tenantId", from: "query", key: "tenantId", optional: true },
        ],
      },
    })
  ),
});
