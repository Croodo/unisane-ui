import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { ZUsageIncrement } from '@unisane/usage';
import { defineOpMeta, withMeta } from './meta';
import { ZFeatureKey } from '@unisane/kernel/client';

const c = initContract();

export const usageContract = c.router({
  increment: withMeta({
    method: 'POST', path: '/api/rest/v1/tenants/:tenantId/usage/:feature/increment',
    pathParams: z.object({ tenantId: z.string().min(1), feature: ZFeatureKey }),
    body: ZUsageIncrement.partial(),
    responses: { 200: z.object({ ok: z.literal(true), data: z.object({ ok: z.literal(true).optional(), deduped: z.literal(true).optional() }) }) },
    summary: 'Usage increment',
  }, defineOpMeta({ op: 'usage.increment', idempotent: true, service: { importPath: '@unisane/usage', fn: 'increment', zodBody: { importPath: '@unisane/usage', name: 'ZUsageIncrement' }, invoke: 'object', callArgs: [ { name: 'tenantId', from: 'params', key: 'tenantId' }, { name: 'feature', from: 'params', key: 'feature' }, { name: 'n', from: 'body', key: 'n', optional: true }, { name: 'at', from: 'body', key: 'at', optional: true, transform: 'date' }, { name: 'idempotencyKey', from: 'body', key: 'idempotencyKey', optional: true } ], requireTenantMatch: true } })),
});
