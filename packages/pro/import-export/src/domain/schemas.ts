import { z } from 'zod';
import { ZImportFormat, ZExportFormat } from '@unisane/kernel';

// Start an import either by providing a signed URL to fetch from, or inline JSON items for small batches
export const ZImportStart = z.union([
  z.object({
    source: z.literal('url'),
    url: z.string().url(),
    format: ZImportFormat,
    resource: z.string().min(2),
    headers: z.record(z.string(), z.string()).optional(),
  }),
  z.object({
    source: z.literal('inline'),
    items: z.array(z.record(z.string(), z.unknown())).min(1),
    format: z.literal('json'),
    resource: z.string().min(2),
  }),
]);

export const ZExportStart = z.object({
  resource: z.string().min(2),
  format: ZExportFormat.default('json'),
  filter: z.record(z.string(), z.unknown()).optional(),
});
export const ZExportStatusQuery = z.object({
  jobId: z.string().min(1),
});
