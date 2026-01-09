import { z } from 'zod';

export const JOB_STATUS = ['queued', 'running', 'done', 'failed'] as const;
export type JobStatus = (typeof JOB_STATUS)[number];
export const ZJobStatus = z.enum(JOB_STATUS);

export const EXPORT_FORMAT = ['json', 'csv', 'xlsx'] as const;
export type ExportFormat = (typeof EXPORT_FORMAT)[number];
export const ZExportFormat = z.enum(EXPORT_FORMAT);

export const IMPORT_FORMAT = ['json', 'csv', 'ndjson'] as const;
export type ImportFormat = (typeof IMPORT_FORMAT)[number];
export const ZImportFormat = z.enum(IMPORT_FORMAT);

export const IMPORT_SOURCE = ['url', 'inline'] as const;
export type ImportSource = (typeof IMPORT_SOURCE)[number];
export const ZImportSource = z.enum(IMPORT_SOURCE);

