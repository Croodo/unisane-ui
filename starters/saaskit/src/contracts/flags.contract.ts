import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  ZFlagWrite,
  ZFlagOut,
  ZOverrideWrite,
  ZOverrideOut,
  ZFlagsListQuery,
} from "@unisane/flags/client";
import { defineOpMeta, withMeta } from "./meta";
import { PERM } from "@unisane/kernel/client";

const c = initContract();

export const flagsContract = c.router({
  list: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/flags",
      query: ZFlagsListQuery,
      responses: {
        200: z.array(z.object({ key: z.string(), flag: ZFlagOut.nullable() })),
      },
      summary: "List flags by keys",
    },
    defineOpMeta({
      op: "flags.list",
      perm: PERM.FLAGS_READ,
      service: {
        importPath: "@unisane/flags",
        fn: "getFlags",
        zodQuery: {
          importPath: "@unisane/flags",
          name: "ZFlagsListQuery",
        },
        invoke: "object",
        callArgs: [
          {
            name: "env",
            from: "query",
            key: "env",
            optional: true,
            fallback: { kind: "env", key: "APP_ENV" },
          },
          { name: "keys", from: "query", key: "keys" },
        ],
      },
    })
  ),
  get: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/flags/:key",
      pathParams: z.object({ key: z.string().min(1) }),
      query: z.object({ env: z.string().optional() }).optional(),
      responses: {
        200: z.object({ ok: z.literal(true), data: ZFlagOut.nullable() }),
      },
      summary: "Get flag",
    },
    defineOpMeta({
      op: "flags.get",
      perm: PERM.FLAGS_READ,
      service: {
        importPath: "@unisane/flags",
        fn: "getFlag",
        zodQuery: {
          importPath: "@unisane/flags",
          name: "ZFlagGetQuery",
        },
        invoke: "object",
        callArgs: [
          {
            name: "env",
            from: "query",
            key: "env",
            optional: true,
            fallback: { kind: "env", key: "APP_ENV" },
          },
          { name: "key", from: "params", key: "key" },
        ],
      },
    })
  ),

  patch: withMeta(
    {
      method: "PATCH",
      path: "/api/rest/v1/flags/:key",
      pathParams: z.object({ key: z.string().min(1) }),
      body: ZFlagWrite,
      responses: {
        200: z.object({ ok: z.literal(true), data: ZFlagOut.nullable() }),
      },
      summary: "Publish flag",
    },
    defineOpMeta({
      op: "flags.patch",
      perm: PERM.FLAGS_WRITE,
      idempotent: true,
      invalidate: [
        { kind: "prefix", key: ["flags", "get"] },
        { kind: "prefix", key: ["flags", "list"] },
      ],
      service: {
        importPath: "@unisane/flags",
        fn: "writeFlag",
        zodBody: {
          importPath: "@unisane/flags",
          name: "ZFlagWrite",
        },
        invoke: "object",
        callArgs: [
          { name: "env", from: "body", key: "env" },
          { name: "key", from: "params", key: "key" },
          { name: "enabledDefault", from: "body", key: "enabledDefault" },
          { name: "rules", from: "body", key: "rules" },
          {
            name: "expectedVersion",
            from: "body",
            key: "expectedVersion",
            optional: true,
          },
          { name: "actorId", from: "ctx", key: "userId", optional: true },
        ],
        audit: {
          resourceType: "flag",
          resourceIdExpr: "`" + "${body.env}:${params.key}" + "`",
          afterExpr: "result",
        },
      },
    })
  ),

  override: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/tenants/:tenantId/flags/:key/override",
      pathParams: z.object({
        tenantId: z.string().min(1),
        key: z.string().min(1),
      }),
      query: z.object({ env: z.string().optional() }).optional(),
      responses: {
        200: z.object({ ok: z.literal(true), data: ZOverrideOut.nullable() }),
      },
      summary: "Get tenant override",
    },
    defineOpMeta({
      op: "flags.override.get",
      perm: PERM.FLAGS_READ,
      service: {
        importPath: "@unisane/flags",
        fn: "getTenantOverride",
        invoke: "object",
        callArgs: [
          {
            name: "env",
            from: "query",
            key: "env",
            optional: true,
            fallback: { kind: "env", key: "APP_ENV" },
          },
          { name: "key", from: "params", key: "key" },
          { name: "tenantId", from: "params", key: "tenantId" },
        ],
        requireTenantMatch: true,
      },
    })
  ),

  setOverride: withMeta(
    {
      method: "PATCH",
      path: "/api/rest/v1/tenants/:tenantId/flags/:key/override",
      pathParams: z.object({
        tenantId: z.string().min(1),
        key: z.string().min(1),
      }),
      body: ZOverrideWrite,
      query: z.object({ env: z.string().optional() }).optional(),
      responses: { 200: z.object({ ok: z.literal(true), data: ZOverrideOut }) },
      summary: "Set tenant override",
    },
    defineOpMeta({
      op: "flags.override.set",
      perm: PERM.FLAGS_WRITE,
      invalidate: [
        { kind: "op", target: "flags.override.get", from: "params" },
      ],
      service: {
        importPath: "@unisane/flags",
        fn: "setTenantOverride",
        zodBody: {
          importPath: "@unisane/flags",
          name: "ZOverrideWrite",
        },
        invoke: "object",
        callArgs: [
          {
            name: "env",
            from: "query",
            key: "env",
            optional: true,
            fallback: { kind: "env", key: "APP_ENV" },
          },
          { name: "key", from: "params", key: "key" },
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "value", from: "body", key: "value" },
          {
            name: "expiresAt",
            from: "body",
            key: "expiresAt",
            optional: true,
            transform: "date",
          },
          {
            name: "actorIsSuperAdmin",
            from: "ctx",
            key: "isSuperAdmin",
            optional: true,
          },
        ],
        requireTenantMatch: true,
        audit: {
          resourceType: "flag.override",
          resourceIdExpr:
            "`" +
            "${(await import('@unisane/kernel')).getEnv().APP_ENV}:${params.key}" +
            "`",
          afterExpr: "result",
        },
      },
    })
  ),

  clearOverride: withMeta(
    {
      method: "DELETE",
      path: "/api/rest/v1/tenants/:tenantId/flags/:key/override",
      pathParams: z.object({
        tenantId: z.string().min(1),
        key: z.string().min(1),
      }),
      query: z.object({ env: z.string().optional() }).optional(),
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({ ok: z.literal(true) }),
        }),
      },
      summary: "Clear tenant override",
    },
    defineOpMeta({
      op: "flags.override.clear",
      perm: PERM.FLAGS_WRITE,
      invalidate: [
        { kind: "op", target: "flags.override.get", from: "params" },
      ],
      service: {
        importPath: "@unisane/flags",
        fn: "clearTenantOverride",
        invoke: "object",
        callArgs: [
          {
            name: "env",
            from: "query",
            key: "env",
            optional: true,
            fallback: { kind: "env", key: "APP_ENV" },
          },
          { name: "key", from: "params", key: "key" },
          { name: "tenantId", from: "params", key: "tenantId" },
          {
            name: "actorIsSuperAdmin",
            from: "ctx",
            key: "isSuperAdmin",
            optional: true,
          },
        ],
        requireTenantMatch: true,
        audit: {
          resourceType: "flag.override",
          resourceIdExpr:
            "`" +
            "${(await import('@unisane/kernel')).getEnv().APP_ENV}:${params.key}" +
            "`",
        },
      },
    })
  ),

  userOverride: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/users/:userId/flags/:key/override",
      pathParams: z.object({
        userId: z.string().min(1),
        key: z.string().min(1),
      }),
      query: z.object({ env: z.string().optional() }).optional(),
      responses: {
        200: z.object({ ok: z.literal(true), data: ZOverrideOut.nullable() }),
      },
      summary: "Get user override",
    },
    defineOpMeta({
      op: "flags.userOverride.get",
      perm: PERM.FLAGS_READ,
      service: {
        importPath: "@unisane/flags",
        fn: "getUserOverride",
        invoke: "object",
        callArgs: [
          {
            name: "env",
            from: "query",
            key: "env",
            optional: true,
            fallback: { kind: "env", key: "APP_ENV" },
          },
          { name: "key", from: "params", key: "key" },
          { name: "userId", from: "params", key: "userId" },
        ],
      },
    })
  ),

  setUserOverride: withMeta(
    {
      method: "PATCH",
      path: "/api/rest/v1/users/:userId/flags/:key/override",
      pathParams: z.object({
        userId: z.string().min(1),
        key: z.string().min(1),
      }),
      body: ZOverrideWrite,
      query: z.object({ env: z.string().optional() }).optional(),
      responses: {
        200: z.object({ ok: z.literal(true), data: ZOverrideOut }),
      },
      summary: "Set user override",
    },
    defineOpMeta({
      op: "flags.userOverride.set",
      perm: PERM.FLAGS_WRITE,
      invalidate: [],
      service: {
        importPath: "@unisane/flags",
        fn: "setUserOverride",
        zodBody: {
          importPath: "@unisane/flags",
          name: "ZOverrideWrite",
        },
        invoke: "object",
        callArgs: [
          {
            name: "env",
            from: "query",
            key: "env",
            optional: true,
            fallback: { kind: "env", key: "APP_ENV" },
          },
          { name: "key", from: "params", key: "key" },
          { name: "userId", from: "params", key: "userId" },
          { name: "value", from: "body", key: "value" },
          {
            name: "expiresAt",
            from: "body",
            key: "expiresAt",
            optional: true,
            transform: "date",
          },
          {
            name: "actorIsSuperAdmin",
            from: "ctx",
            key: "isSuperAdmin",
            optional: true,
          },
        ],
        audit: {
          resourceType: "flag.userOverride",
          resourceIdExpr:
            "`" +
            "${(await import('@unisane/kernel')).getEnv().APP_ENV}:${params.key}:user:${params.userId}" +
            "`",
          afterExpr: "result",
        },
      },
    })
  ),

  clearUserOverride: withMeta(
    {
      method: "DELETE",
      path: "/api/rest/v1/users/:userId/flags/:key/override",
      pathParams: z.object({
        userId: z.string().min(1),
        key: z.string().min(1),
      }),
      query: z.object({ env: z.string().optional() }).optional(),
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({ ok: z.literal(true) }),
        }),
      },
      summary: "Clear user override",
    },
    defineOpMeta({
      op: "flags.userOverride.clear",
      perm: PERM.FLAGS_WRITE,
      invalidate: [],
      service: {
        importPath: "@unisane/flags",
        fn: "clearUserOverride",
        invoke: "object",
        callArgs: [
          {
            name: "env",
            from: "query",
            key: "env",
            optional: true,
            fallback: { kind: "env", key: "APP_ENV" },
          },
          { name: "key", from: "params", key: "key" },
          { name: "userId", from: "params", key: "userId" },
          {
            name: "actorIsSuperAdmin",
            from: "ctx",
            key: "isSuperAdmin",
            optional: true,
          },
        ],
        audit: {
          resourceType: "flag.userOverride",
          resourceIdExpr:
            "`" +
            "${(await import('@unisane/kernel')).getEnv().APP_ENV}:${params.key}:user:${params.userId}" +
            "`",
        },
      },
    })
  ),
  evaluate: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/flags/evaluate",
      body: z.object({
        env: z.string().optional(),
        keys: z.array(z.string()),
        context: z.object({
          tenantId: z.string().optional(),
          userId: z.string().optional(),
          email: z.string().optional(),
          country: z.string().optional(),
        }),
      }),
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.record(z.string(), z.boolean()),
        }),
      },
      summary: "Evaluate multiple flags with context",
    },
    defineOpMeta({
      op: "flags.evaluate",
      allowUnauthed: true, // Allow public/anon evaluation
      service: {
        importPath: "@unisane/flags",
        fn: "evaluateFlags",
        invoke: "object",
        callArgs: [
          {
            name: "env",
            from: "body",
            key: "env",
            optional: true,
            fallback: { kind: "env", key: "APP_ENV" },
          },
          { name: "keys", from: "body", key: "keys" },
          { name: "context", from: "body", key: "context" },
        ],
      },
    })
  ),
});
