import { initContract } from '@ts-rest/core'
import { z } from 'zod'
import { defineOpMeta, withMeta } from './meta'

const c = initContract()

export const ZPdfBody = z.object({ pages: z.coerce.number().int().positive().max(200).default(1) }).optional()

export const pdfContract = c.router({
  render: withMeta(
    {
      method: 'POST',
      path: '/api/rest/v1/tenants/:tenantId/pdf/render',
      pathParams: z.object({ tenantId: z.string().min(1) }),
      body: ZPdfBody,
      responses: { 200: z.object({ ok: z.literal(true), data: z.object({ url: z.string().url(), pages: z.number(), metering: z.unknown() }) }) },
      summary: 'Render PDF (demo)',
    },
    defineOpMeta({
      op: 'pdf.render',
      idempotent: true,
      requireTenantMatch: true,
      service: {
        importPath: '@unisane/pdf',
        fn: 'renderPdf',
        zodBody: { importPath: './pdf.contract', name: 'ZPdfBody' },
        invoke: 'object',
        callArgs: [
          { name: 'tenantId', from: 'params', key: 'tenantId' },
          { name: 'plan', from: 'ctx', key: 'plan', optional: true, fallback: { kind: 'value', value: 'pro' } },
          { name: 'pages', from: 'body', key: 'pages', optional: true },
        ],
        requireTenantMatch: true,
      },
    })
  ),
})
