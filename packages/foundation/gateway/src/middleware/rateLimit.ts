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

/**
 * Build a rate limit key from components.
 * Uses safe sentinel values for missing components to prevent key collisions.
 *
 * Key format: {tenantId}:{userId}:{name}
 * - tenantId: Tenant ID or 'anon' for unauthenticated
 * - userId: User ID or 'anon' for unauthenticated
 * - name: Operation name
 */
export function buildRateKey(args: {
  tenantId?: string | null;
  userId?: string | null;
  name: string;
  ip?: string; // Optional IP for anonymous rate limiting
}): string {
  const { tenantId, userId, name, ip } = args;

  // Use 'anon' for unauthenticated/missing values
  // Include IP hash for anonymous requests to prevent cross-user collisions
  const tenant = tenantId || 'anon';
  const user = userId || (ip ? `ip:${hashIp(ip)}` : 'anon');

  return [tenant, user, name].join(':');
}

/**
 * Hash IP address for use in rate limit keys.
 * Uses a simple djb2 hash to preserve privacy while still allowing rate limiting.
 *
 * **Trade-off Note:** This produces 32-bit integers (~4 billion unique values).
 * For rate limiting purposes, the occasional collision is acceptable:
 * - IPv4 address space (~4 billion) roughly matches 32-bit hash space
 * - Collisions only affect rate limit accuracy, not security
 * - A cryptographic hash (SHA-256) would add ~10x latency for minimal benefit
 * - Collisions mean two IPs might share a rate limit bucket (fail-safe behavior)
 */
function hashIp(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
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
