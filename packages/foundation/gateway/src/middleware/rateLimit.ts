import { kv, KV } from '@unisane/kernel';

export type RateResult = { allowed: boolean; remaining: number; resetAt: number };

export function ipFrom(req: Request): string {
  try {
    const xfwd = req.headers.get('x-forwarded-for');
    if (xfwd) return xfwd.split(',')[0]?.trim() || '0.0.0.0';
    const xreal = req.headers.get('x-real-ip');
    if (xreal) return xreal.trim();
  } catch {}
  return '0.0.0.0';
}

export function buildRateKey(args: { tenantId: string; userId?: string; name: string }) {
  return [args.tenantId, args.userId ?? '-', args.name].join(':');
}

// Fixed-window counter using KV. Key: rl:{key}:{windowStart}
export async function rateLimit(key: string, max: number, windowSec: number, cost = 1): Promise<RateResult> {
  const now = Date.now();
  const windowStart = Math.floor(now / (windowSec * 1000)) * windowSec * 1000;
  const bucketKey = `${KV.RL}${key}:${windowStart}`;
  const ttlMs = windowStart + windowSec * 1000 - now;
  const count = await kv.incrBy(bucketKey, cost, Math.max(1, ttlMs));
  const remaining = Math.max(0, max - count);
  return { allowed: count <= max, remaining, resetAt: windowStart + windowSec * 1000 };
}
