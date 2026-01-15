import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  ZAddRoleBody,
  ZRemoveRoleBody,
  ZGrantPermBody,
  ZRevokePermBody,
} from "@unisane/identity/client";
import { ZRoleId } from "@unisane/kernel/client";
import { ZPermission } from "@unisane/kernel/client";
import { ZGrantEffect } from "@unisane/kernel/client";
import { ZCursor, ZLimitCoerce } from "@unisane/kernel/client";
import { defineOpMeta, withMeta } from "./meta";
import { PERM } from "@unisane/kernel/client";

const c = initContract();

const ZMembershipOut = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string(),
  userName: z.string().nullable().optional(),
  userEmail: z.string().nullable().optional(),
  roles: z.array(
    z.object({ roleId: ZRoleId, grantedAt: z.string().optional() })
  ),
  grants: z.array(z.object({ perm: ZPermission, effect: ZGrantEffect })),
  version: z.number().int().nonnegative(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const membershipsContract = c.router({
  list: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/tenants/:tenantId/memberships",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      query: z.object({ cursor: ZCursor.optional(), limit: ZLimitCoerce }),
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({
            items: z.array(ZMembershipOut),
            nextCursor: z.string().optional(),
          }),
        }),
      },
      summary: "List memberships",
      description: "List all members of a tenant with their roles and permissions. Supports cursor-based pagination. Requires MEMBERS_WRITE permission.",
    },
    defineOpMeta({
      op: "memberships.list",
      perm: PERM.MEMBERS_WRITE,
      service: {
        importPath: "@unisane/identity",
        fn: "listMembers",
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
  get: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/tenants/:tenantId/memberships/:userId",
      pathParams: z.object({
        tenantId: z.string().min(1),
        userId: z.string().min(1),
      }),
      responses: {
        200: z.object({ ok: z.literal(true), data: ZMembershipOut.nullable() }),
      },
      summary: "Get membership",
      description: "Get a single membership by tenant and user ID. Returns the member's roles, direct permission grants, and version for optimistic concurrency. Returns null if not found.",
    },
    defineOpMeta({
      op: "memberships.getOne",
      perm: PERM.MEMBERS_WRITE,
      service: {
        importPath: "@unisane/identity",
        fn: "getMembership",
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "userId", from: "params", key: "userId" },
        ],
        requireTenantMatch: true,
      },
    })
  ),
  addRole: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants/:tenantId/memberships/:userId/roles",
      pathParams: z.object({
        tenantId: z.string().min(1),
        userId: z.string().min(1),
      }),
      body: ZAddRoleBody,
      responses: {
        200: z.object({ ok: z.literal(true), data: ZMembershipOut }),
      },
      summary: "Add role",
      description: "Add a role to a member. Supports optimistic concurrency via expectedVersion. Changes are audited. Requires MEMBERS_WRITE permission.",
    },
    defineOpMeta({
      op: "memberships.addRole",
      perm: PERM.MEMBERS_WRITE,
      invalidate: [
        { kind: "prefix", key: ["memberships", "get"] },
        { kind: "prefix", key: ["memberships", "list"] },
        { kind: "prefix", key: ["me", "memberships"] },
      ],
      service: {
        importPath: "@unisane/identity",
        fn: "addRole",
        zodBody: {
          importPath: "@unisane/identity",
          name: "ZAddRoleBody",
        },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "userId", from: "params", key: "userId" },
          { name: "roleId", from: "body", key: "roleId" },
          {
            name: "expectedVersion",
            from: "body",
            key: "expectedVersion",
            optional: true,
          },
        ],
        requireTenantMatch: true,
        audit: {
          resourceType: "membership",
          resourceIdExpr: "params.userId",
          afterExpr:
            "{ roleId: body.roleId, version: (typeof result === 'object' && result && 'version' in result ? (result as { version?: number }).version ?? null : null) }",
        },
      },
    })
  ),
  removeRole: withMeta(
    {
      method: "DELETE",
      path: "/api/rest/v1/tenants/:tenantId/memberships/:userId/roles",
      pathParams: z.object({
        tenantId: z.string().min(1),
        userId: z.string().min(1),
      }),
      body: ZRemoveRoleBody,
      responses: {
        200: z.object({ ok: z.literal(true), data: ZMembershipOut }),
      },
      summary: "Remove role",
      description: "Remove a role from a member. Supports optimistic concurrency via expectedVersion. Changes are audited. Requires MEMBERS_WRITE permission.",
    },
    defineOpMeta({
      op: "memberships.removeRole",
      perm: PERM.MEMBERS_WRITE,
      invalidate: [
        { kind: "prefix", key: ["memberships", "get"] },
        { kind: "prefix", key: ["memberships", "list"] },
        { kind: "prefix", key: ["me", "memberships"] },
      ],
      service: {
        importPath: "@unisane/identity",
        fn: "removeRole",
        zodBody: {
          importPath: "@unisane/identity",
          name: "ZRemoveRoleBody",
        },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "userId", from: "params", key: "userId" },
          { name: "roleId", from: "body", key: "roleId" },
          {
            name: "expectedVersion",
            from: "body",
            key: "expectedVersion",
            optional: true,
          },
        ],
        requireTenantMatch: true,
        audit: {
          resourceType: "membership",
          resourceIdExpr: "params.userId",
          afterExpr:
            "{ roleId: body.roleId, version: (typeof result === 'object' && result && 'version' in result ? (result as { version?: number }).version ?? null : null) }",
        },
      },
    })
  ),
  grantPerm: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants/:tenantId/memberships/:userId/grants",
      pathParams: z.object({
        tenantId: z.string().min(1),
        userId: z.string().min(1),
      }),
      body: ZGrantPermBody,
      responses: {
        200: z.object({ ok: z.literal(true), data: ZMembershipOut }),
      },
      summary: "Grant permission",
      description: "Grant a direct permission to a member (allow or deny). Bypasses role-based permissions. Supports optimistic concurrency. Changes are audited. Requires MEMBERS_WRITE permission.",
    },
    defineOpMeta({
      op: "memberships.grantPerm",
      perm: PERM.MEMBERS_WRITE,
      invalidate: [
        { kind: "prefix", key: ["memberships", "get"] },
        { kind: "prefix", key: ["memberships", "list"] },
      ],
      service: {
        importPath: "@unisane/identity",
        fn: "grantPerm",
        zodBody: {
          importPath: "@unisane/identity",
          name: "ZGrantPermBody",
        },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "userId", from: "params", key: "userId" },
          { name: "perm", from: "body", key: "perm" },
          { name: "effect", from: "body", key: "effect" },
          {
            name: "expectedVersion",
            from: "body",
            key: "expectedVersion",
            optional: true,
          },
        ],
        requireTenantMatch: true,
        audit: {
          resourceType: "membership",
          resourceIdExpr: "params.userId",
          afterExpr:
            "{ perm: body.perm, effect: body.effect, version: (typeof result === 'object' && result && 'version' in result ? (result as { version?: number }).version ?? null : null) }",
        },
      },
    })
  ),
  remove: withMeta(
    {
      method: "DELETE",
      path: "/api/rest/v1/tenants/:tenantId/memberships/:userId",
      pathParams: z.object({
        tenantId: z.string().min(1),
        userId: z.string().min(1),
      }),
      body: z
        .object({
          expectedVersion: z.number().int().nonnegative().optional(),
        })
        .optional(),
      responses: {
        200: z.object({ ok: z.literal(true) }),
      },
      summary: "Remove member from workspace",
      description: "Remove a member from the tenant completely. The user will lose all access to the workspace. Supports optimistic concurrency. Changes are audited. Requires MEMBERS_WRITE permission.",
    },
    defineOpMeta({
      op: "memberships.remove",
      perm: PERM.MEMBERS_WRITE,
      invalidate: [
        { kind: "prefix", key: ["memberships", "get"] },
        { kind: "prefix", key: ["memberships", "list"] },
        { kind: "prefix", key: ["me", "memberships"] },
      ],
      service: {
        importPath: "@unisane/identity",
        fn: "removeMember",
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "userId", from: "params", key: "userId" },
          {
            name: "expectedVersion",
            from: "body",
            key: "expectedVersion",
            optional: true,
          },
        ],
        requireTenantMatch: true,
        audit: {
          resourceType: "membership",
          resourceIdExpr: "params.userId",
        },
      },
    })
  ),
  revokePerm: withMeta(
    {
      method: "DELETE",
      path: "/api/rest/v1/tenants/:tenantId/memberships/:userId/grants",
      pathParams: z.object({
        tenantId: z.string().min(1),
        userId: z.string().min(1),
      }),
      body: ZRevokePermBody,
      responses: {
        200: z.object({ ok: z.literal(true), data: ZMembershipOut }),
      },
      summary: "Revoke permission",
      description: "Revoke a direct permission grant from a member. The member will fall back to role-based permissions. Supports optimistic concurrency. Changes are audited. Requires MEMBERS_WRITE permission.",
    },
    defineOpMeta({
      op: "memberships.revokePerm",
      perm: PERM.MEMBERS_WRITE,
      invalidate: [
        { kind: "prefix", key: ["memberships", "get"] },
        { kind: "prefix", key: ["memberships", "list"] },
      ],
      service: {
        importPath: "@unisane/identity",
        fn: "revokePerm",
        zodBody: {
          importPath: "@unisane/identity",
          name: "ZRevokePermBody",
        },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "userId", from: "params", key: "userId" },
          { name: "perm", from: "body", key: "perm" },
          {
            name: "expectedVersion",
            from: "body",
            key: "expectedVersion",
            optional: true,
          },
        ],
        requireTenantMatch: true,
        audit: {
          resourceType: "membership",
          resourceIdExpr: "params.userId",
          afterExpr:
            "{ perm: body.perm, version: (typeof result === 'object' && result && 'version' in result ? (result as { version?: number }).version ?? null : null) }",
        },
      },
    })
  ),
});
