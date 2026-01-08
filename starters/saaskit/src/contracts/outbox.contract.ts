import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { defineOpMeta, withMeta } from './meta';
import { ZCursor } from '@unisane/kernel/client';

const c = initContract();

// Admin list cap (≤ 50)
export const ZAdminListQuery = z.object({
  cursor: ZCursor.optional(),
  limit: z.coerce.number().int().positive().max(50).default(50),
});

export const ZAdminOutboxIdsBody = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export const ZAdminOutboxLimitBody = z.object({
  limit: z.coerce.number().int().positive().max(1000).default(100),
});

export const outboxContract = c.router({
  // Admin: list DLQ (dead) items
  adminDeadList: withMeta(
    {
      method: 'GET',
      path: '/api/rest/v1/admin/outbox/dead',
      query: ZAdminListQuery,
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({
            items: z.array(
              z.object({
                id: z.string(),
                kind: z.string(),
                attempts: z.number().int().nonnegative(),
                lastError: z.string().nullable(),
                updatedAt: z.string().datetime().nullable(),
              })
            ),
            nextCursor: z.string().optional(),
            prevCursor: z.string().optional(),
          }),
        }),
      },
      summary: 'Admin outbox: list dead items',
    },
    defineOpMeta({
      op: 'admin.outbox.listDead',
      requireUser: true,
      requireSuperAdmin: true,
      service: {
        importPath: '@unisane/notify',
        fn: 'listDeadOutboxAdmin',
        zodQuery: { importPath: './outbox.contract', name: 'ZAdminListQuery' },
        invoke: 'object',
        callArgs: [
          { name: 'limit', from: 'query', key: 'limit' },
          { name: 'cursor', from: 'query', key: 'cursor', optional: true },
        ],
        requireSuperAdmin: true,
      },
    })
  ),
  // Admin: requeue DLQ items
  adminDeadRequeue: withMeta(
    {
      method: 'POST',
      path: '/api/rest/v1/admin/outbox/dead/requeue',
      body: z.object({ ids: z.array(z.string().min(1)).min(1) }),
      responses: { 200: z.object({ ok: z.literal(true), data: z.object({ ok: z.literal(true) }) }) },
      summary: 'Admin outbox: requeue dead items',
    },
    defineOpMeta({
      op: 'admin.outbox.requeueDead',
      requireUser: true,
      requireSuperAdmin: true,
      idempotent: true,
      service: {
        importPath: '@unisane/notify',
        fn: 'requeueDeadOutboxAdmin',
        zodBody: { importPath: './outbox.contract', name: 'ZAdminOutboxIdsBody' },
        invoke: 'object',
        callArgs: [ { name: 'ids', from: 'body', key: 'ids' } ],
        requireSuperAdmin: true,
        audit: {
          resourceType: 'outbox',
          resourceIdExpr: "'ids:' + String(body.ids.length ?? 0)",
          afterExpr: "{ op: 'requeue', count: body.ids.length ?? 0 }",
        },
      },
    })
  ),
  // Admin: purge DLQ items
  adminDeadPurge: withMeta(
    {
      method: 'POST',
      path: '/api/rest/v1/admin/outbox/dead/purge',
      body: z.object({ ids: z.array(z.string().min(1)).min(1) }),
      responses: { 200: z.object({ ok: z.literal(true), data: z.object({ ok: z.literal(true) }) }) },
      summary: 'Admin outbox: purge dead items',
    },
    defineOpMeta({
      op: 'admin.outbox.purgeDead',
      requireUser: true,
      requireSuperAdmin: true,
      idempotent: true,
      service: {
        importPath: '@unisane/notify',
        fn: 'purgeDeadOutboxAdmin',
        zodBody: { importPath: './outbox.contract', name: 'ZAdminOutboxIdsBody' },
        invoke: 'object',
        callArgs: [ { name: 'ids', from: 'body', key: 'ids' } ],
        requireSuperAdmin: true,
        audit: {
          resourceType: 'outbox',
          resourceIdExpr: "'ids:' + String(body.ids.length ?? 0)",
          afterExpr: "{ op: 'purge', count: body.ids.length ?? 0 }",
        },
      },
    })
  ),
  // Admin: requeue all dead (bounded by limit)
  adminDeadRequeueAll: withMeta(
    {
      method: 'POST',
      path: '/api/rest/v1/admin/outbox/dead/requeue/all',
      body: z.object({ limit: z.coerce.number().int().positive().max(1000).default(100) }),
      responses: { 200: z.object({ ok: z.literal(true), data: z.object({ ok: z.literal(true), count: z.number().int().nonnegative() }) }) },
      summary: 'Admin outbox: requeue all dead (bounded by limit)',
    },
    defineOpMeta({
      op: 'admin.outbox.requeueDeadAll',
      requireUser: true,
      requireSuperAdmin: true,
      idempotent: true,
      service: {
        importPath: '@unisane/notify',
        fn: 'requeueAllDeadOutboxAdmin',
        zodBody: { importPath: './outbox.contract', name: 'ZAdminOutboxLimitBody' },
        invoke: 'object',
        callArgs: [ { name: 'limit', from: 'body', key: 'limit' } ],
        requireSuperAdmin: true,
        audit: {
          resourceType: 'outbox',
          resourceIdExpr: "'all'",
          afterExpr: "{ op: 'requeueAll', limit: body.limit, count: (typeof result === 'object' && result && 'count' in result ? (result as { count?: number }).count ?? null : null) }",
        },
      },
    })
  ),
  // Admin: purge all dead (bounded by limit)
  adminDeadPurgeAll: withMeta(
    {
      method: 'POST',
      path: '/api/rest/v1/admin/outbox/dead/purge/all',
      body: z.object({ limit: z.coerce.number().int().positive().max(1000).default(100) }),
      responses: { 200: z.object({ ok: z.literal(true), data: z.object({ ok: z.literal(true), count: z.number().int().nonnegative() }) }) },
      summary: 'Admin outbox: purge all dead (bounded by limit)',
    },
    defineOpMeta({
      op: 'admin.outbox.purgeDeadAll',
      requireUser: true,
      requireSuperAdmin: true,
      idempotent: true,
      service: {
        importPath: '@unisane/notify',
        fn: 'purgeAllDeadOutboxAdmin',
        zodBody: { importPath: './outbox.contract', name: 'ZAdminOutboxLimitBody' },
        invoke: 'object',
        callArgs: [ { name: 'limit', from: 'body', key: 'limit' } ],
        requireSuperAdmin: true,
        audit: {
          resourceType: 'outbox',
          resourceIdExpr: "'all'",
          afterExpr: "{ op: 'purgeAll', limit: body.limit, count: (typeof result === 'object' && result && 'count' in result ? (result as { count?: number }).count ?? null : null) }",
        },
      },
    })
  ),
});
