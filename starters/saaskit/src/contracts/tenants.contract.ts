import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { ZTenantCreate } from "@unisane/identity";
import { defineOpMeta, withMeta } from "./meta";
import { ZCursor } from "@unisane/kernel";
import { ZPlanId } from "@unisane/kernel";
import { ZSubscriptionStatus } from "@unisane/kernel";

const c = initContract();

// Admin list/export cap (≤ 50 items per page)
export const ZAdminTenantFilters = z
  .object({
    q: z.string().optional(),
    slug: z
      .object({ eq: z.string().optional(), contains: z.string().optional() })
      .partial()
      .optional(),
    name: z
      .object({ eq: z.string().optional(), contains: z.string().optional() })
      .partial()
      .optional(),
    planId: z
      .object({ eq: ZPlanId.optional(), in: z.array(ZPlanId).optional() })
      .partial()
      .optional(),
  })
  .partial();

export const ZAdminListQuery = z.object({
  cursor: ZCursor.optional(),
  // Enforce a conservative default + max for admin surfaces
  limit: z.coerce.number().int().positive().max(50).default(50),
  sort: z.string().optional(),
  // Structured filters object (parsed in sidecar; no base64 indirection)
  filters: ZAdminTenantFilters.optional(),
});

export const ZAdminStatsQuery = z.object({
  filters: ZAdminTenantFilters.optional(),
});

const ZTenantOut = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
  plan: ZPlanId,
});

// NOTE: contracts should not be used as a shared types module in UI.
// Keep HTTP DTOs local to this contract; UI consumes SDK outputs.

export const tenantsContract = c.router({
  create: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants",
      body: ZTenantCreate,
      responses: { 200: z.object({ ok: z.literal(true), data: ZTenantOut }) },
      summary: "Create tenant",
    },
    defineOpMeta({
      op: "tenants.create",
      requireUser: true,
      idempotent: true,
      service: {
        importPath: "@unisane/identity",
        fn: "createTenantForUser",
        zodBody: {
          importPath: "@unisane/identity",
          name: "ZTenantCreate",
        },
        invoke: "object",
        callArgs: [
          { name: "userId", from: "ctx", key: "userId" },
          { name: "input", from: "body" },
        ],
      },
    })
  ),
  // Admin: export current view as CSV (page scope)
  adminExport: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/admin/tenants/export",
      query: ZAdminListQuery,
      responses: { 200: z.any() },
      summary: "Admin tenants export (CSV)",
    },
    defineOpMeta({
      op: "admin.tenants.export",
      requireUser: true,
      requireSuperAdmin: true,
      service: {
        importPath: "@unisane/tenants",
        fn: "exportAdminTenants",
        zodQuery: {
          importPath: "./tenants.contract",
          name: "ZAdminListQuery",
        },
        raw: true,
        factory: {
          importPath: "@unisane/tenants",
          name: "exportAdminTenants",
        },
        requireSuperAdmin: true,
      },
    })
  ),
  // Admin: stats (total count + facets) with filter support
  adminStats: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/admin/tenants/stats",
      query: z.object({
        filters: ZAdminTenantFilters.optional(),
      }),
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({
            total: z.number(),
            facets: z.object({
              planId: z.record(z.number()),
              subscription_status: z.record(z.number()),
            }),
          }),
        }),
      },
      summary: "Admin tenants stats",
    },
    defineOpMeta({
      op: "admin.tenants.stats",
      requireUser: true,
      requireSuperAdmin: true,
      service: {
        importPath: "@unisane/tenants",
        fn: "getAdminTenantsStats",
        zodQuery: {
          importPath: "./tenants.contract",
          name: "ZAdminStatsQuery",
        },
        invoke: "object",
        callArgs: [
          { name: "filters", from: "query", key: "filters", optional: true },
        ],
        requireSuperAdmin: true,
      },
    })
  ),
  findBySlug: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/tenants/by-slug/:slug",
      pathParams: z.object({ slug: z.string().min(1) }),
      responses: {
        200: z.object({ ok: z.literal(true), data: ZTenantOut.nullable() }),
      },
      summary: "Get tenant by slug",
    },
    defineOpMeta({
      op: "tenants.findBySlug",
      allowUnauthed: true,
      service: {
        importPath: "@unisane/identity",
        fn: "findTenantBySlug",
        invoke: "object",
        callArgs: [{ name: "slug", from: "params", key: "slug" }],
      },
    })
  ),

  // Admin: Enriched list across all tenants
  adminList: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/admin/tenants",
      query: ZAdminListQuery,
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({
            items: z.array(
              z.object({
                id: z.string(),
                slug: z.string(),
                name: z.string(),
                plan: ZPlanId,
                membersCount: z.number().optional(),
                adminsCount: z.number().optional(),
                apiKeysCount: z.number().optional(),
                flagOverridesCount: z.number().optional(),
                invoicesOpenCount: z.number().optional(),
                webhooksFailed24h: z.number().optional(),
                creditsAvailable: z.number().optional(),
                lastActivityAt: z.string().datetime().nullable().optional(),
                subscription: z
                  .object({
                    status: ZSubscriptionStatus.nullable(),
                    quantity: z.number().nullable(),
                    currentPeriodEnd: z.string().datetime().nullable(),
                  })
                  .nullable()
                  .optional(),
              })
            ),
            nextCursor: z.string().optional(),
            prevCursor: z.string().optional(),
          }),
        }),
      },
      summary: "Admin tenants list (enriched)",
    },
    defineOpMeta({
      op: "admin.tenants.list",
      requireUser: true,
      requireSuperAdmin: true,
      service: {
        importPath: "@unisane/tenants",
        fn: "listAdminTenants",
        zodQuery: {
          importPath: "./tenants.contract",
          name: "ZAdminListQuery",
        },
        invoke: "object",
        listKind: "admin",
        filtersSchema: {
          importPath: "./tenants.contract",
          name: "ZAdminTenantFilters",
        },
        callArgs: [
          { name: "limit", from: "query", key: "limit" },
          { name: "cursor", from: "query", key: "cursor", optional: true },
          // Accept the query.sort key directly; avoid surfacing internal sortDb in public query type
          { name: "sort", from: "query", key: "sort", optional: true },
          { name: "filters", from: "query", key: "filters", optional: true },
        ],
        requireSuperAdmin: true,
      },
    })
  ),
  // Admin: Enriched single tenant by id
  adminRead: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/admin/tenants/:id",
      pathParams: z.object({ id: z.string().min(1) }),
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z
            .object({
              id: z.string(),
              slug: z.string(),
              name: z.string(),
              plan: ZPlanId,
              membersCount: z.number().optional(),
              adminsCount: z.number().optional(),
              apiKeysCount: z.number().optional(),
              flagOverridesCount: z.number().optional(),
              invoicesOpenCount: z.number().optional(),
              webhooksFailed24h: z.number().optional(),
              creditsAvailable: z.number().optional(),
              lastActivityAt: z.string().datetime().nullable().optional(),
              subscription: z
                .object({
                  status: ZSubscriptionStatus.nullable(),
                  quantity: z.number().nullable(),
                  currentPeriodEnd: z.string().datetime().nullable(),
                })
                .nullable()
                .optional(),
            })
            .nullable(),
        }),
      },
      summary: "Admin tenant read (enriched)",
    },
    defineOpMeta({
      op: "admin.tenants.read",
      requireUser: true,
      requireSuperAdmin: true,
      service: {
        importPath: "@unisane/tenants",
        fn: "readAdminTenant",
        invoke: "object",
        callArgs: [{ name: "tenantId", from: "params", key: "id" }],
        requireSuperAdmin: true,
      },
    })
  ),
  // Admin: Delete tenant with cascade
  adminDelete: withMeta(
    {
      method: "DELETE",
      path: "/api/rest/v1/admin/tenants/:id",
      pathParams: z.object({ id: z.string().min(1) }),
      body: z.object({}).optional(),
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({
            deleted: z.boolean(),
            cascade: z.object({
              apiKeysRevoked: z.number(),
              membershipsDeleted: z.number(),
              storageFilesMarked: z.number(),
            }),
          }),
        }),
      },
      summary: "Admin tenant delete (cascade)",
    },
    defineOpMeta({
      op: "admin.tenants.delete",
      requireUser: true,
      requireSuperAdmin: true,
      service: {
        importPath: "@unisane/tenants",
        fn: "deleteTenant",
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "id" },
          { name: "actorId", from: "ctx", key: "userId" },
        ],
        requireSuperAdmin: true,
      },
    })
  ),
});
