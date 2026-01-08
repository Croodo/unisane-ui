import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  ZEmailEnqueue,
  ZPrefUpdate,
  ZMarkRead,
} from "@unisane/notify/client";
import { ZCursor, ZLimitCoerce } from "@unisane/kernel/client";
import { defineOpMeta, withMeta } from "./meta";

const c = initContract();

const ZInappItem = z.object({
  id: z.string(),
  category: z.string(),
  title: z.string(),
  body: z.string(),
  data: z.any().nullable(),
  createdAt: z.string(),
  readAt: z.string().nullable(),
  seenAt: z.string().nullable(),
});

export const notifyContract = c.router({
  email: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants/:tenantId/notify/email",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      body: ZEmailEnqueue,
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({ id: z.string() }),
        }),
      },
      summary: "Enqueue email",
    },
    defineOpMeta({
      op: "notify.email",
      idempotent: true,
      service: {
        importPath: "@unisane/notify",
        fn: "enqueueEmail",
        zodBody: {
          importPath: "@unisane/notify",
          name: "ZEmailEnqueue",
        },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "body", from: "body" },
        ],
        requireTenantMatch: true,
      },
    })
  ),
  preferences: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/tenants/:tenantId/notify/prefs",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({ categories: z.record(z.string(), z.boolean()) }),
        }),
      },
      summary: "Get notify prefs",
    },
    defineOpMeta({
      op: "notify.preferences.get",
      requireTenantMatch: true,
      requireUser: true,
      service: {
        importPath: "@unisane/notify",
        fn: "getPrefs",
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "userId", from: "ctx", key: "userId" },
        ],
        requireTenantMatch: true,
      },
    })
  ),
  updatePreferences: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants/:tenantId/notify/prefs",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      body: ZPrefUpdate,
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({ ok: z.literal(true) }),
        }),
      },
      summary: "Set notify prefs",
    },
    defineOpMeta({
      op: "notify.preferences.update",
      requireTenantMatch: true,
      requireUser: true,
      idempotent: true,
      invalidate: [
        { kind: "op", target: "notify.preferences", from: "params" },
      ],
      service: {
        importPath: "@unisane/notify",
        fn: "setPrefs",
        zodBody: {
          importPath: "@unisane/notify",
          name: "ZPrefUpdate",
        },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "userId", from: "ctx", key: "userId" },
          { name: "categories", from: "body", key: "categories" },
          { name: "actorId", from: "ctx", key: "userId" },
        ],
        requireTenantMatch: true,
      },
    })
  ),
  listInapp: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/tenants/:tenantId/inapp",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      query: z.object({ cursor: ZCursor.optional(), limit: ZLimitCoerce }),
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({
            items: z.array(ZInappItem),
            nextCursor: z.string().optional(),
          }),
        }),
      },
      summary: "In-app list",
    },
    defineOpMeta({
      op: "inapp.list",
      requireUser: true,
      service: {
        importPath: "@unisane/notify",
        fn: "listInapp",
        zodQuery: { importPath: "@unisane/kernel", name: "ZSeekPageQuery" },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "userId", from: "ctx", key: "userId" },
          { name: "limit", from: "query", key: "limit" },
          { name: "cursor", from: "query", key: "cursor", optional: true },
        ],
      },
    })
  ),
  markInappRead: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants/:tenantId/inapp/mark-read",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      body: ZMarkRead,
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({ ok: z.literal(true) }),
        }),
      },
      summary: "In-app mark read",
    },
    defineOpMeta({
      op: "inapp.markRead",
      requireUser: true,
      idempotent: true,
      invalidate: [{ kind: "prefix", key: ["notify", "listInapp"] }],
      service: {
        importPath: "@unisane/notify",
        fn: "markRead",
        zodBody: {
          importPath: "@unisane/notify",
          name: "ZMarkRead",
        },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "userId", from: "ctx", key: "userId" },
          { name: "id", from: "body", key: "id" },
        ],
      },
    })
  ),
  markInappAllSeen: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants/:tenantId/inapp/mark-all-seen",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      body: c.noBody(),
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({ ok: z.literal(true) }),
        }),
      },
      summary: "In-app mark all seen",
    },
    defineOpMeta({
      op: "inapp.markAllSeen",
      requireUser: true,
      idempotent: true,
      invalidate: [{ kind: "prefix", key: ["notify", "listInapp"] }],
      service: {
        importPath: "@unisane/notify",
        fn: "markAllSeen",
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "userId", from: "ctx", key: "userId" },
        ],
      },
    })
  ),
  unreadCount: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/tenants/:tenantId/inapp/unread-count",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({ count: z.number() }),
        }),
      },
      summary: "In-app unread count",
    },
    defineOpMeta({
      op: "inapp.unreadCount",
      requireUser: true,
      service: {
        importPath: "@unisane/notify",
        fn: "getUnreadCount",
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "userId", from: "ctx", key: "userId" },
        ],
      },
    })
  ),
  deleteInapp: withMeta(
    {
      method: "DELETE",
      path: "/api/rest/v1/tenants/:tenantId/inapp/:id",
      pathParams: z.object({
        tenantId: z.string().min(1),
        id: z.string().min(1),
      }),
      body: c.noBody(),
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({ deleted: z.boolean() }),
        }),
      },
      summary: "Delete in-app notification",
    },
    defineOpMeta({
      op: "inapp.delete",
      requireUser: true,
      invalidate: [
        { kind: "prefix", key: ["notify", "listInapp"] },
        { kind: "op", target: "inapp.unreadCount", from: "params" },
      ],
      service: {
        importPath: "@unisane/notify",
        fn: "deleteNotification",
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "userId", from: "ctx", key: "userId" },
          { name: "id", from: "params", key: "id" },
        ],
      },
    })
  ),
  deleteAllInapp: withMeta(
    {
      method: "DELETE",
      path: "/api/rest/v1/tenants/:tenantId/inapp",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      body: c.noBody(),
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({ count: z.number() }),
        }),
      },
      summary: "Delete all in-app notifications",
    },
    defineOpMeta({
      op: "inapp.deleteAll",
      requireUser: true,
      invalidate: [
        { kind: "prefix", key: ["notify", "listInapp"] },
        { kind: "op", target: "inapp.unreadCount", from: "params" },
      ],
      service: {
        importPath: "@unisane/notify",
        fn: "deleteAllNotifications",
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "userId", from: "ctx", key: "userId" },
        ],
      },
    })
  ),
});
