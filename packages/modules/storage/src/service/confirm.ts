import { getScopeId, connectDb, emitTypedReliable } from "@unisane/kernel";
import { StorageRepo } from "../data/storage.repository";
import { ERR } from "@unisane/gateway";

export type ConfirmUploadArgs = {
  fileId: string;
};

/**
 * STOR-002 FIX: Use single atomic operation instead of separate read-then-update.
 *
 * Previous code had a TOCTOU race condition:
 * 1. findById - check file exists and ownership
 * 2. confirmUpload - atomically update status
 *
 * Two concurrent requests could both pass step 1 before either reaches step 2.
 * While the atomic update prevents duplicate confirmation, it wastes resources.
 *
 * Fix: The confirmUpload repository method already uses findOneAndUpdate with
 * scopedFilter, which ensures atomic update within the scope. We just need
 * to rely on that single operation and handle the null case properly.
 */
export async function confirmUpload(args: ConfirmUploadArgs) {
  const scopeId = getScopeId();
  await connectDb();

  // STOR-002 FIX: Single atomic operation - confirmUpload uses findOneAndUpdate
  // with scopedFilter, which atomically checks scope ownership and status
  const updated = await StorageRepo.confirmUpload(args.fileId);

  // If null, either file doesn't exist, wrong scope, or already confirmed/deleted
  if (!updated) {
    // Check if file exists to provide appropriate error
    const file = await StorageRepo.findById(args.fileId);
    if (!file) {
      throw ERR.notFound("File not found");
    }
    // File exists but update failed - must be wrong status
    throw ERR.validation("File already confirmed or deleted");
  }

  // Use reliable event delivery to ensure media processing and usage tracking completes
  await emitTypedReliable('storage.upload.confirmed', {
    scopeId,
    fileId: args.fileId,
    key: updated.key,
    size: updated.sizeBytes,
  });

  return updated;
}
