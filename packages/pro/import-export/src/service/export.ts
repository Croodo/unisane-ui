import type { ExportFormat } from "@unisane/kernel";
import { JobsRepo } from "../data/export.repository";
import { exportObjectKey, getSignedDownloadUrl, getScopeId } from "@unisane/kernel";

import type { StartExportArgs } from "../domain/types";
export type { StartExportArgs };

export async function startExport(args: StartExportArgs) {
  const tenantId = getScopeId();
  // Persist a job, compute storage key, and return a signed GET URL (file may appear when job completes)
  const ts = Date.now();
  const format: ExportFormat = args.format ?? "json";
  const key = exportObjectKey(tenantId, args.resource, ts, format);
  const job = await JobsRepo.createExport({
    tenantId,
    resource: args.resource,
    format,
    key,
  });
  const signed = await getSignedDownloadUrl(key, 600);
  return { ok: true as const, jobId: job.id, url: signed.url };
}

export async function getExportStatus(args: { jobId: string }) {
  const tenantId = getScopeId();
  const job = await JobsRepo.findExportById(tenantId, args.jobId);
  if (!job) return { status: "not_found" as const };
  const base = { id: job.id, status: job.status } as const;
  if (job.status === "done") {
    const signed = await getSignedDownloadUrl(job.key, 600);
    return { ...base, url: signed.url } as const;
  }
  return base;
}
