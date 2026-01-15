import { memoryStore } from './memory';
import { getEnv } from '../env';
import { redis } from './redis';
import { logger } from '../observability/logger';

// ============================================================================
// Cache Port Interface (decoupled from specific providers)
// ============================================================================

/**
 * Options for cache set operations.
 */
export type CacheSetOpts = {
  /** TTL in milliseconds */
  PX?: number;
  /** Only set if key does not exist */
  NX?: boolean;
};

/**
 * Cache port interface for key-value operations.
 * Implementations: Memory (dev), Vercel KV, Redis, etc.
 *
 * This interface enables:
 * 1. Swapping cache providers without code changes
 * 2. Testing with in-memory implementation
 * 3. Consistent error handling across providers
 */
export interface CachePort {
  /** Get a value by key. Returns null if not found. */
  get(key: string): Promise<string | null>;
  /** Set a value with optional TTL and NX flag. Returns true on success. */
  set(key: string, value: string, opts?: CacheSetOpts): Promise<boolean>;
  /** Increment a numeric key by amount. Creates key with value if not exists. */
  incrBy(key: string, by: number, ttlMs?: number): Promise<number>;
  /** Delete a key. No-op if key doesn't exist. */
  del(key: string): Promise<void>;
}

// Legacy type alias for backward compatibility
type SetOpts = CacheSetOpts;
type KVProvider = CachePort;

// In-memory fallback (dev/tests)
const memoryKV: KVProvider = {
  async get(key) {
    return memoryStore.get(key);
  },
  async set(key, value, opts) {
    return memoryStore.set(key, value, opts);
  },
  async incrBy(key, by, ttlMs) {
    return memoryStore.incrBy(key, by, ttlMs);
  },
  async del(key) {
    memoryStore.del(key);
  },
};

// Vercel KV REST (Upstash-compatible) minimal client via fetch
function createVercelKV(url: string, token: string): KVProvider {
  // Normalize base URL (no trailing slash)
  const base = url.replace(/\/$/, '');
  async function http<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`KV HTTP ${res.status}`);
    const json = (await res.json().catch(() => ({}))) as unknown;
    return json as T;
  }
  return {
    async get(key: string): Promise<string | null> {
      try {
        // Vercel KV: GET /get/{key} → { result: string|null }
        const out = await http<{ result: unknown }>(`/get/${encodeURIComponent(key)}`);
        const val = (out as { result?: unknown }).result;
        return typeof val === 'string' ? val : val == null ? null : JSON.stringify(val);
      } catch (error) {
        logger.error('KV get failed', { key, error, operation: 'get' });
        throw error;
      }
    },
    async set(key: string, value: string, opts?: SetOpts): Promise<boolean> {
      try {
        const params = new URLSearchParams();
        if (opts?.PX && Number.isFinite(opts.PX)) params.set('ex', String(Math.ceil((opts.PX as number) / 1000)));
        if (opts?.NX) params.set('nx', 'true');
        // Vercel KV: POST /set/{key} body { value }
        await http(`/set/${encodeURIComponent(key)}${params.toString() ? `?${params}` : ''}`, {
          method: 'POST',
          body: JSON.stringify({ value }),
        });
        return true;
      } catch (error) {
        logger.error('KV set failed', { key, error, operation: 'set' });
        throw error;
      }
    },
    async incrBy(key: string, by: number, ttlMs?: number): Promise<number> {
      try {
        const params = new URLSearchParams();
        if (Number.isFinite(by)) params.set('by', String(Math.trunc(by)));
        if (ttlMs && Number.isFinite(ttlMs)) params.set('ex', String(Math.ceil(ttlMs / 1000)));
        // Vercel KV: POST /incr/{key}?by=1&ex=60 → { result: number }
        const out = await http<{ result: unknown }>(`/incr/${encodeURIComponent(key)}?${params}`, { method: 'POST' });
        const n = Number((out as { result?: unknown }).result);
        return Number.isFinite(n) ? n : 0;
      } catch (error) {
        logger.error('KV incrBy failed - NOT falling back to memory', { key, by, error, operation: 'incrBy' });
        throw error;
      }
    },
    async del(key: string): Promise<void> {
      try {
        // Vercel KV: POST /del/{key}
        await http(`/del/${encodeURIComponent(key)}`, { method: 'POST' });
      } catch (error) {
        logger.error('KV del failed', { key, error, operation: 'del' });
        throw error;
      }
    },
  };
}

function createRedisKV(): KVProvider {
  return {
    async get(key) { return redis.get(key); },
    async set(key, value, opts) { return redis.set(key, value, opts); },
    async incrBy(key, by, ttlMs) { return redis.incrBy(key, by, ttlMs); },
    async del(key) { await redis.del(key); },
  } as KVProvider;
}

// Select provider (priority: Redis → Vercel KV → memory)
let provider: KVProvider = memoryKV;
let providerReason: string | null = null;
try {
  const env = getEnv();
  if (!env.USE_MEMORY_STORE) {
    if (env.REDIS_URL) {
      provider = createRedisKV();
    } else if (env.KV_REST_API_URL && env.KV_REST_API_TOKEN) {
      provider = createVercelKV(env.KV_REST_API_URL, env.KV_REST_API_TOKEN);
    } else {
      providerReason = "No KV_REST_API_URL/KV_REST_API_TOKEN or REDIS_URL configured";
      provider = memoryKV;
    }
  } else {
    providerReason = "USE_MEMORY_STORE=true";
  }
} catch (e) {
  providerReason = (e as Error)?.message ?? "env parse failed";
  provider = memoryKV;
}

if (provider === memoryKV) {
  const env = (process.env.APP_ENV ?? "").toLowerCase();
  if (env === "prod") {
    throw new Error(`KV misconfigured: ${providerReason ?? "no provider selected"}`);
  } else if (providerReason) {
     
    console.warn(`[kv] falling back to memory store (${providerReason})`);
  }
}

export const kv: CachePort = provider;

// ============================================================================
// Cache Provider Factory (for custom providers)
// ============================================================================

/**
 * Create a memory-based cache provider.
 * Use for testing or development.
 */
export function createMemoryCache(): CachePort {
  return memoryKV;
}

/**
 * Create a Vercel KV REST cache provider.
 * Requires KV_REST_API_URL and KV_REST_API_TOKEN.
 */
export function createVercelKVCache(url: string, token: string): CachePort {
  return createVercelKV(url, token);
}

/**
 * Create a Redis-based cache provider.
 * Requires REDIS_URL to be configured.
 */
export function createRedisCache(): CachePort {
  return createRedisKV();
}
