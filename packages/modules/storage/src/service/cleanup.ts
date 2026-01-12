import { connectDb } from "@unisane/kernel";
import { STORAGE_LIMITS } from "@unisane/kernel";
import { StorageRepo } from "../data/storage.repository";
import { deleteS3Object } from "@unisane/kernel";
import { metrics } from "@unisane/kernel";

const BATCH_CONCURRENCY = 5;

async function processBatch<T>(
  items: T[],
  processor: (item: T) => Promise<boolean>,
  concurrency = BATCH_CONCURRENCY
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const results = await Promise.allSettled(batch.map(processor));
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) success++;
      else failed++;
    }
  }

  return { success, failed };
}

export async function cleanupOrphanedUploads(): Promise<{
  checked: number;
  cleaned: number;
  failed: number;
}> {
  await connectDb();

  const orphans = await StorageRepo.findPendingOlderThan(
    STORAGE_LIMITS.PENDING_EXPIRY_MS
  );

  if (orphans.length === 0) {
    return { checked: 0, cleaned: 0, failed: 0 };
  }

  const { success, failed } = await processBatch(orphans, async (file) => {
    const deleted = await StorageRepo.hardDelete(file.id);
    return deleted;
  });

  metrics.increment("storage.cleanup.orphaned", { labels: { cleaned: String(success), failed: String(failed) } });

  return { checked: orphans.length, cleaned: success, failed };
}

export async function cleanupDeletedFiles(): Promise<{
  checked: number;
  cleaned: number;
  failed: number;
  s3Errors: number;
}> {
  await connectDb();

  const deleted = await StorageRepo.findDeletedOlderThan(
    STORAGE_LIMITS.SOFT_DELETE_RETENTION_MS
  );

  if (deleted.length === 0) {
    return { checked: 0, cleaned: 0, failed: 0, s3Errors: 0 };
  }

  let s3Errors = 0;

  const { success, failed } = await processBatch(deleted, async (file) => {
    try {
      await deleteS3Object(file.key);
    } catch {
      s3Errors++;
    }
    return StorageRepo.hardDelete(file.id);
  });

  metrics.increment("storage.cleanup.deleted", {
    labels: { cleaned: String(success), failed: String(failed), s3Errors: String(s3Errors) },
  });

  return { checked: deleted.length, cleaned: success, failed, s3Errors };
}
