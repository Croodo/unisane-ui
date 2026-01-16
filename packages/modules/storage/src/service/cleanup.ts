import { connectDb, logger } from "@unisane/kernel";
import { STORAGE_LIMITS } from "@unisane/kernel";
import { StorageRepo } from "../data/storage.repository";
import { deleteObject } from "@unisane/kernel";
import { metrics } from "@unisane/kernel";

const BATCH_CONCURRENCY = 5;

/**
 * STOR-003 FIX: Retry configuration for S3 deletion.
 */
const S3_DELETE_MAX_RETRIES = 3;
const S3_DELETE_BASE_DELAY_MS = 500;

/**
 * STOR-003 FIX: Sleep helper for retry delays.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * STOR-003 FIX: Delete S3 object with exponential backoff retry.
 * Returns true if deletion succeeded, false if all retries failed.
 */
async function deleteS3ObjectWithRetry(
  key: string,
  fileId: string
): Promise<{ success: boolean; attempts: number; lastError?: string }> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= S3_DELETE_MAX_RETRIES; attempt++) {
    try {
      await deleteObject(key);
      return { success: true, attempts: attempt };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);

      // Don't retry on certain errors (e.g., object doesn't exist is success)
      if (lastError.includes('NoSuchKey') || lastError.includes('NotFound')) {
        // Object doesn't exist - treat as success
        logger.debug('storage.cleanup.s3_object_not_found', { fileId, key });
        return { success: true, attempts: attempt };
      }

      if (attempt < S3_DELETE_MAX_RETRIES) {
        // Exponential backoff with jitter (10%)
        const delayMs = S3_DELETE_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        const jitter = delayMs * 0.1 * Math.random();
        await sleep(delayMs + jitter);

        logger.debug('storage.cleanup.s3_delete_retry', {
          fileId,
          key,
          attempt,
          nextAttempt: attempt + 1,
          delayMs: Math.round(delayMs + jitter),
          error: lastError,
        });
      }
    }
  }

  // All retries exhausted
  return { success: false, attempts: S3_DELETE_MAX_RETRIES, lastError };
}

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

  // STOR-003 FIX: Use retry helper with exponential backoff
  const { success, failed } = await processBatch(deleted, async (file) => {
    const result = await deleteS3ObjectWithRetry(file.key, file.id);

    if (!result.success) {
      s3Errors++;
      logger.warn('storage.cleanup.s3_delete_failed', {
        fileId: file.id,
        key: file.key,
        attempts: result.attempts,
        error: result.lastError,
      });
      // Keep DB record to retry on next cleanup run
      return false;
    }

    // S3 delete succeeded (or object didn't exist), delete DB record
    return StorageRepo.hardDelete(file.id);
  });

  metrics.increment("storage.cleanup.deleted", {
    labels: { cleaned: String(success), failed: String(failed), s3Errors: String(s3Errors) },
  });

  return { checked: deleted.length, cleaned: success, failed, s3Errors };
}
