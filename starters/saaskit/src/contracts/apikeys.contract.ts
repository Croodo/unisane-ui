import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { defineOpMeta, withMeta } from "./meta";
import { PERM } from "@unisane/kernel/client";

const c = initContract();

export const ZApiKeyCreate = z.object({
  name: z.string().min(1).optional(),
  scopes: z.array(z.string()).min(1),
});
const ZApiKeyOut = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().nullable(),
  scopes: z.array(z.string()),
  createdAt: z.string().optional(),
});

export const apikeysContract = c.router({
  create: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants/:tenantId/apikeys",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      body: ZApiKeyCreate,
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({
            id: z.string(),
            token: z.string(),
            scopes: z.array(z.string()),
            name: z.string().nullable(),
          }),
        }),
      },
      summary: "Create API key",
    },
    defineOpMeta({
      op: "apikeys.create",
      perm: PERM.MEMBERS_WRITE,
      idempotent: true,
      invalidate: [{ kind: "op", target: "apikeys.list", from: "params" }],
      service: {
        importPath: "@unisane/identity",
        fn: "createApiKey",
        zodBody: {
          importPath: "./apikeys.contract",
          name: "ZApiKeyCreate",
        },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "scopes", from: "body", key: "scopes" },
          { name: "name", from: "body", key: "name", optional: true },
          { name: "actorId", from: "ctx", key: "userId", optional: true },
        ],
        requireTenantMatch: true,
      },
    })
  ),
  list: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/tenants/:tenantId/apikeys",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({ items: z.array(ZApiKeyOut) }),
        }),
      },
      summary: "List API keys",
    },
    defineOpMeta({
      op: "apikeys.list",
      perm: PERM.MEMBERS_WRITE,
      service: {
        importPath: "@unisane/identity",
        fn: "listApiKeys",
        invoke: "object",
        callArgs: [{ name: "tenantId", from: "params", key: "tenantId" }],
        requireTenantMatch: true,
      },
    })
  ),
  revoke: withMeta(
    {
      method: "DELETE",
      path: "/api/rest/v1/tenants/:tenantId/apikeys/:keyId",
      pathParams: z.object({
        tenantId: z.string().min(1),
        keyId: z.string().min(1),
      }),
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({ ok: z.literal(true) }),
        }),
      },
      summary: "Revoke API key",
    },
    defineOpMeta({
      op: "apikeys.revoke",
      perm: PERM.MEMBERS_WRITE,
      invalidate: [{ kind: "op", target: "apikeys.list", from: "params" }],
      service: {
        importPath: "@unisane/identity",
        fn: "revokeApiKey",
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "keyId", from: "params", key: "keyId" },
        ],
        requireTenantMatch: true,
      },
    })
  ),
});
