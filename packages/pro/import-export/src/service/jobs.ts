import { JobsRepo } from '../data/export.repository';
import type { ExportJob } from '../data/export.repository';
import { sendJob } from '@unisane/kernel';

export const JobsService = {
  createImport: JobsRepo.createImport,
  createExport: async (input: Parameters<typeof JobsRepo.createExport>[0]) => {
    const job = await JobsRepo.createExport(input);
    await sendJob({
      name: "app/export.requested",
      data: { jobId: job.id, tenantId: job.tenantId },
    });
    return job;
  },
  listQueuedExports: JobsRepo.listQueuedExports,
  markExportRunning: JobsRepo.markExportRunning,
  markExportDone: JobsRepo.markExportDone,
  markExportFailed: JobsRepo.markExportFailed,
  getExportById: JobsRepo.findExportById,
} as const;

export type { ExportJob };

