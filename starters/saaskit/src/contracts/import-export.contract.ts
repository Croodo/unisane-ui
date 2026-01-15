import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { ZImportStart } from '@unisane/import-export';
import { ZExportFormat, ZJobStatus } from '@unisane/kernel/client';
import { defineOpMeta, withMeta } from './meta';

const c = initContract();

export const importExportContract = c.router({
  startImport: withMeta(
    {
      method: 'POST',
      path: '/api/rest/v1/tenants/:tenantId/import',
      pathParams: z.object({ tenantId: z.string().min(1) }),
      body: ZImportStart,
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({ ok: z.literal(true), jobId: z.string(), meta: z.object({}).passthrough() }),
        }),
      },
      summary: 'Start import',
    },
    defineOpMeta({
      op: 'import.start',
      service: {
        importPath: '@unisane/import-export',
        fn: 'startImport',
        zodBody: { importPath: '@unisane/import-export', name: 'ZImportStart' },
        invoke: 'object',
        callArgs: [
          { name: 'tenantId', from: 'params', key: 'tenantId' },
          { name: 'resource', from: 'body', key: 'resource' },
          { name: 'format', from: 'body', key: 'format' },
          // We don't persist all fields yet, but keep them available in args
          { name: 'source', from: 'body', key: 'source', optional: true },
          { name: 'url', from: 'body', key: 'url', optional: true },
          { name: 'items', from: 'body', key: 'items', optional: true },
          { name: 'headers', from: 'body', key: 'headers', optional: true },
        ],
        requireTenantMatch: true,
        audit: {
          resourceType: 'import',
          resourceIdExpr: "(typeof result === 'object' && result && 'jobId' in result ? (result as { jobId?: string }).jobId ?? null : null)",
          afterExpr: '{ resource: body.resource, meta: {} }',
        },
      },
    })
  ),
  startExport: withMeta({
    method: 'GET', path: '/api/rest/v1/tenants/:tenantId/export',
    pathParams: z.object({ tenantId: z.string().min(1) }),
    query: z.object({
      resource: z.string().min(1),
      format: ZExportFormat.default('json').optional(),
      // Optional structured filter payload for future extensions
      filter: z.record(z.string(), z.unknown()).optional(),
    }),
    responses: { 200: z.object({ ok: z.literal(true), data: z.object({ ok: z.literal(true), jobId: z.string(), url: z.string().url() }) }) },
    summary: 'Start export',
  }, defineOpMeta({
    op: 'export.startExport',
    service: {
      importPath: '@unisane/import-export',
      fn: 'startExport',
      zodQuery: { importPath: '@unisane/import-export', name: 'ZExportStart' },
      invoke: 'object',
      callArgs: [
        { name: 'tenantId', from: 'params', key: 'tenantId' },
        { name: 'resource', from: 'query', key: 'resource' },
        { name: 'format', from: 'query', key: 'format', optional: true },
        // Keep filter pluggable for future use
        { name: 'filter', from: 'query', key: 'filter', optional: true },
      ],
      requireTenantMatch: true,
    },
  })),
  exportStatus: withMeta({
    method: 'GET', path: '/api/rest/v1/tenants/:tenantId/export/status',
    pathParams: z.object({ tenantId: z.string().min(1) }),
    query: z.object({ jobId: z.string().min(1) }),
    responses: { 200: z.object({ ok: z.literal(true), data: z.object({ id: z.string().optional(), status: ZJobStatus, url: z.string().url().optional() }) }) },
    summary: 'Export status',
  }, defineOpMeta({
    op: 'export.getStatus',
    service: {
      importPath: '@unisane/import-export',
      fn: 'getExportStatus',
      zodQuery: { importPath: '@unisane/import-export', name: 'ZExportStatusQuery' },
      invoke: 'object',
      callArgs: [ { name: 'tenantId', from: 'params', key: 'tenantId' }, { name: 'jobId', from: 'query', key: 'jobId' } ],
      requireTenantMatch: true,
    },
  })),
});
