import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { ZTenantCreate } from "@unisane/identity/client";
import { defineOpMeta, withMeta } from "./meta";
import { ZCursor } from "@unisane/kernel/client";
import { ZPlanId } from "@unisane/kernel/client";
import { ZSubscriptionStatus } from "@unisane/kernel/client";

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

export const ZAdminTenantStatsQuery = z.object({
  filters: ZAdminTenantFilters.optional(),
});

const ZTenantOut = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
  planId: ZPlanId,
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
      description: "Create a new tenant (workspace) and automatically add the current user as an owner. The tenant slug must be unique across the platform. Supports idempotent creation via idempotency-key header.",
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
  // Note: z.any() is used for binary/CSV responses where JSON schema doesn't apply
  adminExport: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/admin/tenants/export",
      query: ZAdminListQuery,
      responses: { 200: z.any() }, // Binary CSV response - schema not applicable
      summary: "Admin tenants export (CSV)",
      description: "Export tenants matching the current filters as a CSV file. Requires super admin privileges. Respects the same filters and sorting as the list endpoint. Limited to 50 items per export.",
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
      description: "Get aggregate statistics for tenants including total count and facet breakdowns by plan and subscription status. Supports the same filters as the list endpoint. Requires super admin privileges.",
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
          name: "ZAdminTenantStatsQuery",
        },
        filtersSchema: { importPath: "./tenants.contract", name: "ZAdminTenantFilters" },
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
      description: "Look up a tenant by its unique slug. Returns null if not found. This endpoint is public and does not require authentication, useful for tenant discovery during signup flows.",
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
                planId: ZPlanId,
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
      description: "List all tenants with enriched data including member counts, API keys, credits, subscription status, and activity metrics. Supports cursor-based pagination, sorting, and filtering by slug, name, or plan. Requires super admin privileges.",
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
              planId: ZPlanId,
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
      description: "Get detailed information about a single tenant including member counts, API keys, flag overrides, open invoices, failed webhooks, credit balance, and subscription details. Returns null if tenant not found. Requires super admin privileges.",
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
      description: "Permanently delete a tenant and all associated data. Cascades to revoke all API keys, remove all memberships, and mark storage files for deletion. This action is irreversible. Requires super admin privileges.",
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
