/**
 * KV/Redis Abstraction Layer
 *
 * Two interfaces are exported:
 *
 * 1. `kv` - Simple key-value operations (get, set, del, incrBy)
 *    Use for: caching, rate-limiting, idempotency keys, feature flags
 *    Supports: Memory (dev), Vercel KV REST, or Redis via ioredis
 *
 * 2. `redis` - Full Redis interface (kv + pub/sub, scan, mget, expire)
 *    Use for: real-time notifications, config bus pub/sub, job locks,
 *             usage rollups (scan), bulk operations (mget)
 *    Supports: Memory (dev) or Redis via ioredis
 *
 * Provider selection (in order of priority):
 *   - REDIS_URL → ioredis client
 *   - KV_REST_API_URL + KV_REST_API_TOKEN → Vercel KV REST (kv only)
 *   - USE_MEMORY_STORE=true → In-memory (dev/test)
 *
 * In production, memory fallback throws an error to prevent silent failures.
 *
 * @example
 * // Basic caching
 * import { kv } from '../kv';
 * await kv.set('key', 'value', { PX: 60000 }); // 60s TTL
 * const val = await kv.get('key');
 *
 * @example
 * // Real-time pub/sub
 * import { redis } from '../kv';
 * await redis.subscribe('channel', (msg) => console.log(msg));
 * await redis.publish('channel', JSON.stringify({ event: 'data' }));
 */

export { kv, createMemoryCache, createVercelKVCache, createRedisCache } from "./provider";
export type { CachePort, CacheSetOpts } from "./provider";
export { redis } from "./redis";
export { memoryStore, MemoryStore } from "./memory";
