import type { ImportFormat, ImportSource } from '@unisane/kernel';
import { getScopeId } from '@unisane/kernel';
import { JobsRepo } from '../data/export.repository';

import type { StartImportArgs } from "../domain/types";
export type { StartImportArgs };

export async function startImport(args: StartImportArgs) {
  const tenantId = getScopeId();
  // Persist a job row (placeholder repo) and enqueue via jobs in a full setup
  const job = await JobsRepo.createImport({
    tenantId,
    resource: args.resource,
    format: args.format,
    // Preserve source info for downstream processors when present
    ...(typeof args.source !== 'undefined'
      ? { source: args.source }
      : {}),
  });
  const meta = {
    resource: args.resource,
    format: args.format,
    ...(typeof args.source !== 'undefined' ? { source: args.source } : {}),
  };
  return { ok: true as const, jobId: job.id, meta };
}
