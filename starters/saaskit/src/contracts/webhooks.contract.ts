import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { ZCursor, ZLimitCoerce } from '@unisane/kernel';
import { ZWebhookDirection, ZWebhookEventStatus, ZWebhookProvider } from '@unisane/kernel';
import { defineOpMeta, withMeta } from './meta';
import { PERM } from '@unisane/kernel';

const c = initContract();

const ZWebhookEvent = z.object({ id: z.string(), direction: ZWebhookDirection, status: ZWebhookEventStatus, httpStatus: z.number().nullable(), target: z.string().nullable(), provider: ZWebhookProvider.nullable(), createdAt: z.string() });

export const webhooksContract = c.router({
  listEvents: withMeta({
    method: 'GET', path: '/api/rest/v1/tenants/:tenantId/webhooks/events',
    pathParams: z.object({ tenantId: z.string().min(1) }),
    query: z.object({ cursor: ZCursor.optional(), limit: ZLimitCoerce, direction: ZWebhookDirection.optional(), status: ZWebhookEventStatus.optional() }),
    responses: { 200: z.object({ ok: z.literal(true), data: z.object({ items: z.array(ZWebhookEvent), nextCursor: z.string().optional() }) }) },
    summary: 'Webhook events list',
  }, defineOpMeta({
    op: 'webhooks.listEvents',
    perm: PERM.MEMBERS_WRITE,
    service: {
      importPath: '@unisane/webhooks',
      fn: 'listEvents',
      zodQuery: { importPath: '@unisane/webhooks', name: 'ZListWebhookEventsQuery' },
      invoke: 'object',
      callArgs: [ { name: 'tenantId', from: 'params', key: 'tenantId' }, { name: 'limit', from: 'query', key: 'limit' }, { name: 'cursor', from: 'query', key: 'cursor', optional: true }, { name: 'direction', from: 'query', key: 'direction', optional: true }, { name: 'status', from: 'query', key: 'status', optional: true } ],
      requireTenantMatch: true,
    },
  })),
  replayEvent: withMeta({
    method: 'POST', path: '/api/rest/v1/tenants/:tenantId/webhooks/events/:id/replay',
    pathParams: z.object({ tenantId: z.string().min(1), id: z.string().min(1) }),
    body: c.noBody(),
    responses: { 200: z.object({ ok: z.literal(true), data: z.object({ ok: z.literal(true) }) }) },
    summary: 'Webhook event replay',
  }, defineOpMeta({
    op: 'webhooks.replayEvent',
    perm: PERM.MEMBERS_WRITE,
    invalidate: [ { kind: 'prefix', key: ['webhooks','listEvents'] } ],
    service: {
      importPath: '@unisane/webhooks',
      fn: 'replayEvent',
      invoke: 'object',
      callArgs: [ { name: 'tenantId', from: 'params', key: 'tenantId' }, { name: 'id', from: 'params', key: 'id' } ],
      requireTenantMatch: true,
    },
  })),
});
