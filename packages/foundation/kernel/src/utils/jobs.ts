import { redis } from '../cache/redis';
import { KV } from '../constants/kv';

type LeaseContext = { deadlineMs: number };

export async function withJobLease(
  name: string,
  opts: { ttlMs: number },
  handler: (ctx: LeaseContext) => Promise<void>
): Promise<boolean> {
  const key = `${KV.LOCK}job:${name}`;
  const acquired = await redis.set(key, Date.now().toString(), { NX: true, PX: opts.ttlMs });
  if (!acquired) return false;
  const deadlineMs = Date.now() + Math.max(0, opts.ttlMs - 2000);
  try {
    await handler({ deadlineMs });
    return true;
  } finally {
    // Do not delete explicitly; allow TTL to prevent immediate re-run
  }
}
