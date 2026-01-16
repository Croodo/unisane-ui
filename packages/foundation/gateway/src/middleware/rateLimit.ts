import { kv, KV, redis } from '@unisane/kernel';

export type RateResult = { allowed: boolean; remaining: number; resetAt: number };

/**
 * Token bucket rate limiting result.
 * Provides smoother rate limiting than fixed windows by allowing bursts up to bucket capacity.
 */
export type TokenBucketResult = {
  allowed: boolean;
  remaining: number;
  /** Milliseconds to wait before a token will be available (only set when not allowed) */
  retryAfterMs?: number;
};

/**
 * Token bucket configuration.
 */
export interface TokenBucketConfig {
  /** Maximum number of tokens in the bucket (burst capacity) */
  capacity: number;
  /** Number of tokens added per second (sustained rate) */
  refillRate: number;
}

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

/**
 * Lua script for atomic token bucket rate limiting.
 * Stored here for readability - will be sent to Redis on each call.
 */
const TOKEN_BUCKET_SCRIPT = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])

-- Get current bucket state
local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(bucket[1]) or capacity
local last_refill = tonumber(bucket[2]) or now

-- Calculate tokens to add based on time elapsed
local elapsed = (now - last_refill) / 1000
local new_tokens = math.min(capacity, tokens + (elapsed * refill_rate))

-- Check if we have enough tokens
if new_tokens >= requested then
  new_tokens = new_tokens - requested
  redis.call('HMSET', key, 'tokens', new_tokens, 'last_refill', now)
  -- Set TTL to bucket fill time + buffer to clean up inactive buckets
  redis.call('EXPIRE', key, math.ceil(capacity / refill_rate) + 60)
  return {1, new_tokens, 0}
else
  -- Not enough tokens, calculate wait time
  local wait_time = (requested - new_tokens) / refill_rate
  return {0, new_tokens, wait_time * 1000}
end
`;

/**
 * Token bucket rate limiting.
 *
 * Unlike fixed-window counters, token bucket:
 * - Allows controlled bursts up to bucket capacity
 * - Enforces sustained rate over time
 * - No boundary bursts (smooth rate limiting)
 *
 * @param key - Unique identifier for this rate limit bucket
 * @param config - Token bucket configuration (capacity and refill rate)
 * @param tokens - Number of tokens to consume (default: 1)
 *
 * @example
 * ```typescript
 * // Allow 100 requests/minute with burst of 10
 * const result = await tokenBucket('user:123:api', {
 *   capacity: 10,       // Burst limit
 *   refillRate: 100/60, // ~1.67 tokens/second (100/minute)
 * });
 *
 * if (!result.allowed) {
 *   // Return 429 with Retry-After header
 *   return new Response('Too Many Requests', {
 *     status: 429,
 *     headers: { 'Retry-After': String(Math.ceil(result.retryAfterMs! / 1000)) },
 *   });
 * }
 * ```
 */
export async function tokenBucket(
  key: string,
  config: TokenBucketConfig,
  tokens = 1
): Promise<TokenBucketResult> {
  const bucketKey = `${KV.RL}tb:${key}`;
  const now = Date.now();

  // Check if Redis supports eval
  if (!redis.eval) {
    // Fallback to in-memory token bucket if Redis doesn't support eval
    return inMemoryTokenBucket(key, config, tokens);
  }

  try {
    // Use Redis Lua script for atomic operation
    const result = await redis.eval(
      TOKEN_BUCKET_SCRIPT,
      [bucketKey],
      [config.capacity, config.refillRate, now, tokens]
    ) as [number, number, number];

    return {
      allowed: result[0] === 1,
      remaining: Math.floor(result[1]),
      retryAfterMs: result[2] > 0 ? Math.ceil(result[2]) : undefined,
    };
  } catch {
    // Fallback to in-memory token bucket on Redis failure
    return inMemoryTokenBucket(key, config, tokens);
  }
}

/**
 * M-001 FIX: In-memory fallback for token bucket with thread-safety.
 *
 * NOTE: This fallback is for single-instance deployments or when Redis is unavailable.
 * For clustered/serverless deployments, ensure Redis is available for proper distributed
 * rate limiting.
 *
 * Thread-safety approach:
 * - Use a pending promises Map to serialize concurrent operations on the same key
 * - Each key gets its own "lock" via promise chaining
 * - This ensures atomic read-modify-write without blocking other keys
 */
const memoryBuckets = new Map<string, { tokens: number; lastRefill: number }>();
const pendingOperations = new Map<string, Promise<TokenBucketResult>>();

/**
 * M-001 FIX: Thread-safe in-memory token bucket implementation.
 * Uses promise chaining to serialize operations on the same key.
 */
async function inMemoryTokenBucket(
  key: string,
  config: TokenBucketConfig,
  requested: number
): Promise<TokenBucketResult> {
  // Wait for any pending operation on this key to complete
  const pending = pendingOperations.get(key);
  if (pending) {
    await pending.catch(() => {}); // Ignore errors from previous operations
  }

  // Create a new promise for this operation
  const operationPromise = inMemoryTokenBucketSync(key, config, requested);
  pendingOperations.set(key, operationPromise);

  try {
    const result = await operationPromise;
    return result;
  } finally {
    // Clean up pending operation reference
    if (pendingOperations.get(key) === operationPromise) {
      pendingOperations.delete(key);
    }
  }
}

/**
 * M-001 FIX: Synchronous token bucket logic (called within serialized context).
 */
async function inMemoryTokenBucketSync(
  key: string,
  config: TokenBucketConfig,
  requested: number
): Promise<TokenBucketResult> {
  const now = Date.now();
  const bucket = memoryBuckets.get(key) ?? { tokens: config.capacity, lastRefill: now };

  // Refill tokens based on elapsed time
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(config.capacity, bucket.tokens + elapsed * config.refillRate);
  bucket.lastRefill = now;

  if (bucket.tokens >= requested) {
    bucket.tokens -= requested;
    memoryBuckets.set(key, bucket);
    return { allowed: true, remaining: Math.floor(bucket.tokens) };
  }

  // Not enough tokens
  const waitTime = (requested - bucket.tokens) / config.refillRate;
  memoryBuckets.set(key, bucket);
  return {
    allowed: false,
    remaining: Math.floor(bucket.tokens),
    retryAfterMs: Math.ceil(waitTime * 1000),
  };
}

/**
 * M-001 FIX: Periodic cleanup of stale memory buckets to prevent memory leaks.
 * Removes buckets that haven't been accessed in over 5 minutes.
 */
const MEMORY_BUCKET_CLEANUP_INTERVAL_MS = 60_000; // 1 minute
const MEMORY_BUCKET_STALE_THRESHOLD_MS = 300_000; // 5 minutes

let cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

function startMemoryBucketCleanup(): void {
  if (cleanupIntervalId) return;

  cleanupIntervalId = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of memoryBuckets.entries()) {
      if (now - bucket.lastRefill > MEMORY_BUCKET_STALE_THRESHOLD_MS) {
        memoryBuckets.delete(key);
      }
    }
  }, MEMORY_BUCKET_CLEANUP_INTERVAL_MS);

  // Don't prevent process exit
  if (cleanupIntervalId.unref) {
    cleanupIntervalId.unref();
  }
}

// Start cleanup on module load
startMemoryBucketCleanup();

/**
 * Create a token bucket config from requests per window.
 * Convenience helper to convert familiar rate limit syntax.
 *
 * @example
 * ```typescript
 * // 100 requests per minute with 10 burst
 * const config = rateLimitToTokenBucket(100, 60, 10);
 * await tokenBucket('user:123', config);
 * ```
 */
export function rateLimitToTokenBucket(
  maxRequests: number,
  windowSec: number,
  burstCapacity?: number
): TokenBucketConfig {
  return {
    capacity: burstCapacity ?? Math.max(1, Math.ceil(maxRequests / 10)),
    refillRate: maxRequests / windowSec,
  };
}
