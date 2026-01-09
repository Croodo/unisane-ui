/**
 * Import/Export Cache Keys
 */

export const importExportKeys = {
  job: (jobId: string) => `import_export:job:${jobId}` as const,
  tenantJobs: (tenantId: string) => `import_export:tenant:${tenantId}` as const,
} as const;

export type ImportExportKeyBuilder = typeof importExportKeys;
