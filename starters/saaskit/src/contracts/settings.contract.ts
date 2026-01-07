import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  ZPatchSetting,
  ZSettingOut,
  ZGetSetting,
} from "@unisane/settings";
import { defineOpMeta, withMeta } from "./meta";
import { PERM } from "@unisane/kernel";

const c = initContract();

export const settingsContract = c.router({
  get: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/tenants/:tenantId/settings",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      query: z.object({
        env: ZGetSetting.shape.env,
        ns: ZGetSetting.shape.ns,
        key: ZGetSetting.shape.key,
      }),
      responses: {
        200: z.object({ ok: z.literal(true), data: ZSettingOut.nullable() }),
      },
      summary: "Get setting",
    },
    defineOpMeta({
      op: "settings.get",
      perm: PERM.SETTINGS_READ,
      service: {
        importPath: "@unisane/settings",
        fn: "getSetting",
        zodQuery: {
          importPath: "@unisane/settings",
          name: "ZGetSetting",
        },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "env", from: "query", key: "env", optional: true },
          { name: "ns", from: "query", key: "ns" },
          { name: "key", from: "query", key: "key" },
        ],
        requireTenantMatch: true,
      },
    })
  ),
  patch: withMeta(
    {
      method: "PATCH",
      path: "/api/rest/v1/tenants/:tenantId/settings",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      body: ZPatchSetting,
      responses: { 200: z.object({ ok: z.literal(true), data: ZSettingOut }) },
      summary: "Patch setting",
    },
    defineOpMeta({
      op: "settings.patch",
      perm: PERM.SETTINGS_WRITE,
      idempotent: true,
      invalidate: [{ kind: "prefix", key: ["settings", "get"] }],
      service: {
        importPath: "@unisane/settings",
        fn: "patchSettingWithPolicy",
        zodBody: {
          importPath: "@unisane/settings",
          name: "ZPatchSetting",
        },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "namespace", from: "body", key: "namespace" },
          { name: "key", from: "body", key: "key" },
          { name: "value", from: "body", key: "value", optional: true },
          { name: "unset", from: "body", key: "unset", optional: true },
          {
            name: "expectedVersion",
            from: "body",
            key: "expectedVersion",
            optional: true,
          },
          { name: "actorId", from: "ctx", key: "userId", optional: true },
          {
            name: "actorIsSuperAdmin",
            from: "ctx",
            key: "isSuperAdmin",
            optional: true,
          },
        ],
        requireTenantMatch: true,
        audit: {
          resourceType: "setting",
          resourceIdExpr: "`${bodySafe.namespace}:${bodySafe.key}`",
          afterExpr: "result",
        },
      },
    })
  ),
  adminGet: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/admin/settings",
      query: z.object({
        env: ZGetSetting.shape.env,
        ns: ZGetSetting.shape.ns,
        key: ZGetSetting.shape.key,
      }),
      responses: {
        200: z.object({ ok: z.literal(true), data: ZSettingOut.nullable() }),
      },
      summary: "Get admin setting",
    },
    defineOpMeta({
      op: "admin.settings.get",
      perm: PERM.SETTINGS_READ,
      service: {
        importPath: "@unisane/settings",
        fn: "getSetting",
        zodQuery: {
          importPath: "@unisane/settings",
          name: "ZGetSetting",
        },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "const", value: null },
          { name: "env", from: "query", key: "env", optional: true },
          { name: "ns", from: "query", key: "ns" },
          { name: "key", from: "query", key: "key" },
        ],
      },
    })
  ),
  adminPatch: withMeta(
    {
      method: "PATCH",
      path: "/api/rest/v1/admin/settings",
      body: ZPatchSetting,
      responses: { 200: z.object({ ok: z.literal(true), data: ZSettingOut }) },
      summary: "Patch admin setting",
    },
    defineOpMeta({
      op: "admin.settings.patch",
      perm: PERM.SETTINGS_WRITE,
      idempotent: true,
      invalidate: [{ kind: "prefix", key: ["settings", "admin", "get"] }],
      service: {
        importPath: "@unisane/settings",
        fn: "patchSettingWithPolicy",
        zodBody: {
          importPath: "@unisane/settings",
          name: "ZPatchSetting",
        },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "const", value: null },
          { name: "env", from: "body", key: "env", optional: true },
          { name: "namespace", from: "body", key: "namespace" },
          { name: "key", from: "body", key: "key" },
          { name: "value", from: "body", key: "value", optional: true },
          { name: "unset", from: "body", key: "unset", optional: true },
          {
            name: "expectedVersion",
            from: "body",
            key: "expectedVersion",
            optional: true,
          },
          { name: "actorId", from: "ctx", key: "userId", optional: true },
          {
            name: "actorIsSuperAdmin",
            from: "ctx",
            key: "isSuperAdmin",
            optional: true,
          },
        ],
        audit: {
          resourceType: "setting",
          resourceIdExpr: "`${bodySafe.namespace}:${bodySafe.key}`",
          afterExpr: "result",
        },
      },
    })
  ),
});
