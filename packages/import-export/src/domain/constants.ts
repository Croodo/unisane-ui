/**
 * Import/Export Domain Constants
 */

export const IMPORT_EXPORT_EVENTS = {
  IMPORT_STARTED: 'import_export.import.started',
  IMPORT_COMPLETED: 'import_export.import.completed',
  IMPORT_FAILED: 'import_export.import.failed',
  EXPORT_STARTED: 'import_export.export.started',
  EXPORT_COMPLETED: 'import_export.export.completed',
  EXPORT_FAILED: 'import_export.export.failed',
} as const;

export const IMPORT_EXPORT_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
  XLSX: 'xlsx',
} as const;

export type ImportExportFormat = (typeof IMPORT_EXPORT_FORMATS)[keyof typeof IMPORT_EXPORT_FORMATS];

export const IMPORT_EXPORT_DEFAULTS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024,
  CHUNK_SIZE: 1000,
} as const;

export const IMPORT_EXPORT_COLLECTIONS = {
  JOBS: 'import_export_jobs',
} as const;
