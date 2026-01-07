import { initContract } from '@ts-rest/core'
import { z } from 'zod'
import { defineOpMeta, withMeta } from './meta'

const c = initContract()

const ZQuota = z.object({
  limit: z.number(),
  window: z.enum(['day','month','year']),
  used: z.number().nullable().optional(),
})

const ZEntitlements = z.object({
  toggles: z.record(z.boolean()),
  capacities: z.record(z.number()),
  quotas: z.record(ZQuota),
  credits: z.record(z.object({ grant: z.number(), period: z.enum(['month','year']) })),
})

export const entitlementsContract = c.router({
  get: withMeta(
    {
      method: 'GET',
      path: '/api/rest/v1/tenants/:tenantId/entitlements',
      pathParams: z.object({ tenantId: z.string().min(1) }),
      responses: { 200: z.object({ ok: z.literal(true), data: z.object({ entitlements: ZEntitlements }) }) },
      summary: 'Get entitlements (plan + usage)',
    },
    defineOpMeta({
      op: 'entitlements.get',
      requireTenantMatch: true,
      service: {
        importPath: '@unisane/billing',
        fn: 'getEntitlementsWithUsage',
        invoke: 'object',
        callArgs: [ { name: 'tenantId', from: 'params', key: 'tenantId' } ],
        requireTenantMatch: true,
      },
    })
  ),
})
