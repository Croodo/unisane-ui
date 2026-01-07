import type { ImportJobView, ExportJobView } from './types';
import type { ImportFormat, ExportFormat, ImportSource } from '@unisane/kernel';

export interface JobsRepoPort {
  createImport(meta: { tenantId: string; resource: string; format: ImportFormat; source?: ImportSource | null }): Promise<ImportJobView>;
  createExport(meta: { tenantId: string; resource: string; format: ExportFormat; key: string }): Promise<ExportJobView>;
  listQueuedExports(limit?: number): Promise<ExportJobView[]>;
  markExportRunning(id: string): Promise<void>;
  markExportDone(id: string): Promise<void>;
  markExportFailed(id: string, error: string): Promise<void>;
  getExportById(tenantId: string, id: string): Promise<ExportJobView | null>;
}
