/**
 * Idempotency Middleware
 *
 * Ensures that duplicate requests with the same idempotency key return
 * the same result without re-executing the operation.
 *
 * ## How It Works
 *
 * 1. First request with a key acquires a lock and executes the operation
 * 2. Result is cached for SNAP_TTL_MS (120s)
 * 3. Subsequent requests with same key return cached result
 * 4. Concurrent requests wait up to POLL_TIMEOUT_MS (10s) for result
 *
 * ## Timeout Behavior
 *
 * If a concurrent request waits longer than POLL_TIMEOUT_MS (10 seconds) without
 * the original request completing, it throws an error asking the client to retry.
 * This prevents indefinite blocking while allowing time for slow operations.
 *
 * The 10-second timeout was chosen to accommodate:
 * - Payment processing (typically 3-8 seconds)
 * - External API calls with retries
 * - Database transactions
 *
 * Clients should:
 * - Retry with the same idempotency key after receiving this error
 * - Use exponential backoff (e.g., 1s, 2s, 4s delays)
 * - Set a maximum retry count (e.g., 3-5 attempts)
 *
 * ## Constants
 *
 * - SNAP_TTL_MS: 120s - How long cached results are stored
 * - LOCK_TTL_MS: 15s - Lock timeout (prevents orphaned locks)
 * - POLL_TIMEOUT_MS: 10s - How long to wait for concurrent request
 * - SNAP_MAX_BYTES: 128KB - Maximum size of cached result
 *
 * @example
 * ```typescript
 * const result = await withIdem(idempotencyKey, async () => {
 *   return await processPayment(amount);
 * }, request);
 * ```
 */
import { kv, KV } from "@unisane/kernel";
import { AppError } from "../errors/errors";
import { logger } from "../logger";
import { incIdemReplay, incIdemWaitTimeout } from "../telemetry";

const SNAP_TTL_MS = 120_000; // 120s default
const LOCK_TTL_MS = 15_000; // short lock
const SNAP_MAX_BYTES = 128 * 1024; // 128 KB cap

/**
 * Maximum time to wait for another worker to finish processing.
 * Increased from 3s to 10s to handle longer operations before giving up.
 */
const POLL_TIMEOUT_MS = 10_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function scopedKey(req: Request | undefined, idemKey: string) {
  if (!req) return idemKey;
  try {
    const u = new URL(req.url);
    return `${(req.method || "GET").toUpperCase()}:${u.pathname}:${idemKey}`;
  } catch {
    return idemKey;
  }
}

export async function withIdem<T>(
  idemKey: string | null | undefined,
  producer: () => Promise<T>,
  req?: Request
): Promise<T> {
  if (!idemKey) return producer();
  const sk = scopedKey(req, idemKey);

  const snapKey = `${KV.IDEM}${sk}`;
  const lockKey = `${KV.IDEMLOCK}${sk}`;

  // Fast path: snapshot exists
  const cached = await kv.get(snapKey);
  if (cached) {
    try {
      logger.debug("idempotency snapshot hit", { idemKey });
    } catch {}
    try {
      incIdemReplay();
    } catch {}
    return JSON.parse(cached) as T;
  }

  // Try to acquire short lock
  const acquired = await kv.set(lockKey, "1", { NX: true, PX: LOCK_TTL_MS });
  if (acquired) {
    try {
      try {
        logger.debug("idempotency lock acquired", { idemKey });
      } catch {}
      const result = await producer();
      const json = JSON.stringify(result);
      if (json.length <= SNAP_MAX_BYTES) {
        await kv.set(snapKey, json, { PX: SNAP_TTL_MS, NX: true });
      }
      return result;
    } finally {
      await kv.del(lockKey);
    }
  }

  // Another worker is processing. Poll for snapshot until timeout.
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const snap = await kv.get(snapKey);
    if (snap) return JSON.parse(snap) as T;
    await sleep(100);
  }

  // Still not available; ask client to retry shortly (202 Accepted-like).
  try {
    logger.warn("idempotency still processing; advise retry", { idemKey });
    incIdemWaitTimeout();
  } catch {}
  throw new AppError("SERVER_INTERNAL", {
    message: "Request is processing, please retry",
  });
}
