import { kv, KV } from "@unisane/kernel";
import { AppError } from "../errors/errors";
import { logger } from "../logger";
import { incIdemReplay, incIdemWaitTimeout } from "../telemetry";

// Simple clamp helper
function clampInt(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(val)));
}

const SNAP_TTL_MS = 120_000; // 120s default
const LOCK_TTL_MS = 15_000; // short lock
const SNAP_MAX_BYTES = 128 * 1024; // 128 KB cap

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

  // Another worker is processing. Poll briefly for snapshot.
  const deadline = Date.now() + clampInt(LOCK_TTL_MS, 1000, 3000);
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
