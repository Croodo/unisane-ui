// Redis facade with two providers:
// - Native Redis client (ioredis) when REDIS_URL is set and module is available
// - In-memory fallback for local dev/tests

import { memoryStore } from "./memory";
import { getEnv } from "../env";
import { logger } from "../observability/logger";

type SetOpts = { PX?: number; NX?: boolean };

export type RedisProvider = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, opts?: SetOpts): Promise<boolean>;
  incrBy(key: string, by: number, ttlMs?: number): Promise<number>;
  del(key: string): Promise<void>;
  mget(...keys: string[]): Promise<(string | null)[]>;
  expire(key: string, seconds: number): Promise<boolean>;
  scan(
    cursor: string,
    _match: "MATCH",
    pattern: string,
    _count: "COUNT",
    count: number
  ): Promise<[string, string[]]>;
  publish(channel: string, message: string): Promise<number>;
  subscribe?(
    channel: string,
    handler: (message: string) => void
  ): Promise<void>;
  unsubscribe?(
    channel: string,
    handler?: (message: string) => void
  ): Promise<void>;
  supportsSubscribe?(): boolean;
  evalsha?(...args: unknown[]): Promise<unknown>; // For @upstash/ratelimit Lua script support
  eval?(script: string, keys: string[], args: (string | number)[]): Promise<unknown>; // For custom Lua scripts
  // Sorted set operations (for event replay/streaming)
  zadd?(key: string, item: { score: number; member: string }): Promise<number>;
  zrangebyscore?(key: string, min: number | string, max: number | string): Promise<string[]>;
  zremrangebyscore?(key: string, min: number | string, max: number | string): Promise<number>;
  // Health check
  ping(): Promise<string>;
  // Cleanup function for graceful shutdown
  close?(): Promise<void>;
  // Test utilities
  __getPublished?(
    channel?: string
  ): Array<{ channel: string; message: string; ts: number }>;
  __clearPublished?(): void;
};

// Global state interface for Redis
interface RedisGlobalState {
  provider: RedisProvider;
  providerReason: string | null;
  initialized: boolean;
  // For ioredis cleanup
  ioredisClients?: { client: unknown; sub: unknown };
}

// Use global object to share state across module instances in Next.js/Turbopack
const globalForRedis = global as unknown as { __redisState?: RedisGlobalState };

// Structured error logging helper
function logRedisError(context: string, error: Error, level: 'warn' | 'error' = 'warn'): void {
  const isProd = (() => {
    try {
      return (getEnv().APP_ENV ?? 'prod') === 'prod';
    } catch {
      return false;
    }
  })();

  // In production, always log errors (they're important)
  // In non-prod, log with full stack traces for debugging
  if (level === 'error') {
    logger.error('Redis error', {
      module: 'redis',
      context,
      errorName: error.name,
      error: error.message,
      stack: isProd ? undefined : error.stack,
    });
  } else if (!isProd || context.includes('critical')) {
    logger.warn('Redis warning', {
      module: 'redis',
      context,
      errorName: error.name,
      error: error.message,
    });
  }
}

// In-memory provider with pub/sub for single-process dev/tests
function createMemoryRedis(): RedisProvider {
  const memSubscribers = new Map<string, Set<(msg: string) => void>>();
  const published: Array<{ channel: string; message: string; ts: number }> = [];
  // In-memory sorted sets: key -> Map<member, score>
  const sortedSets = new Map<string, Map<string, number>>();

  return {
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
    async mget(...keys) {
      return Promise.all(keys.map((k) => memoryStore.get(k)));
    },
    async expire(key, seconds) {
      return memoryStore.expire(key, seconds);
    },
    async scan(cursor, _m, pattern, _c, count) {
      const globToRegex = (glob: string) =>
        new RegExp(
          "^" +
            glob
              .replace(/[.+^${}()|[\]\\]/g, "\\$&")
              .replace(/\*/g, ".*")
              .replace(/\?/g, ".") +
            "$"
        );
      const rx = globToRegex(pattern);
      const all = memoryStore.keys().filter((k) => rx.test(k));
      const start = Math.max(0, Number(cursor) || 0);
      const slice = all.slice(start, start + Math.max(1, count));
      const next =
        start + slice.length < all.length ? String(start + slice.length) : "0";
      return [next, slice];
    },
    async publish(channel, message) {
      published.push({ channel, message, ts: Date.now() });
      const subs = memSubscribers.get(channel);
      if (subs) {
        for (const fn of subs) {
          try {
            fn(message);
          } catch (e) {
            logRedisError(`publish handler error on channel ${channel}`, e as Error);
          }
        }
      }
      return subs ? subs.size : 0;
    },
    async subscribe(channel: string, handler: (message: string) => void) {
      if (!memSubscribers.has(channel)) memSubscribers.set(channel, new Set());
      memSubscribers.get(channel)!.add(handler);
    },
    async unsubscribe(channel: string, handler?: (message: string) => void) {
      const set = memSubscribers.get(channel);
      if (!set) return;
      if (handler) set.delete(handler);
      else set.clear();
    },
    supportsSubscribe() {
      return true;
    },
    // Add evalsha for @upstash/ratelimit compatibility
    // In memory mode, we just return null to trigger the library's fallback
    async evalsha() {
      return null;
    },
    // Sorted set operations for event replay
    async zadd(key: string, item: { score: number; member: string }) {
      if (!sortedSets.has(key)) sortedSets.set(key, new Map());
      sortedSets.get(key)!.set(item.member, item.score);
      return 1;
    },
    async zrangebyscore(key: string, min: number | string, max: number | string) {
      const set = sortedSets.get(key);
      if (!set) return [];
      const minVal = min === "-inf" ? -Infinity : Number(min);
      const maxVal = max === "+inf" ? Infinity : Number(max);
      const results: Array<{ member: string; score: number }> = [];
      for (const [member, score] of set) {
        if (score >= minVal && score <= maxVal) {
          results.push({ member, score });
        }
      }
      // Sort by score ascending
      results.sort((a, b) => a.score - b.score);
      return results.map((r) => r.member);
    },
    async zremrangebyscore(key: string, min: number | string, max: number | string) {
      const set = sortedSets.get(key);
      if (!set) return 0;
      const minVal = min === "-inf" ? -Infinity : Number(min);
      const maxVal = max === "+inf" ? Infinity : Number(max);
      let removed = 0;
      for (const [member, score] of set) {
        if (score >= minVal && score <= maxVal) {
          set.delete(member);
          removed++;
        }
      }
      return removed;
    },
    async ping() {
      return 'PONG';
    },
    async close() {
      // Clear all subscribers on close
      memSubscribers.clear();
      published.splice(0, published.length);
    },
    __getPublished(channel?: string) {
      return channel
        ? published.filter((p) => p.channel === channel)
        : [...published];
    },
    __clearPublished() {
      published.splice(0, published.length);
    },
  };
}

interface IoRedisInstance {
  get(key: string): Promise<string | null>;
  set(...args: unknown[]): Promise<string>;
  incrby(key: string, by: number): unknown;
  pexpire(key: string, ms: number): unknown;
  del(key: string): Promise<number>;
  mget(...keys: string[]): Promise<unknown[]>;
  expire(key: string, seconds: number): Promise<number>;
  scan(cursor: string, match: string, pattern: string, count: string, num: number): Promise<[string, string[]]>;
  publish(channel: string, message: string): Promise<number>;
  subscribe(channel: string): Promise<void>;
  unsubscribe(channel: string): Promise<void>;
  multi(): { incrby(key: string, by: number): unknown; pexpire(key: string, ms: number): unknown; exec(): Promise<Array<[Error | null, unknown]>> };
  on(event: string, handler: (...args: unknown[]) => void): void;
  ping(): Promise<string>;
  quit(): Promise<void>;
  disconnect(): void;
  // Sorted set operations
  zadd(key: string, score: number, member: string): Promise<number>;
  zrangebyscore(key: string, min: number | string, max: number | string): Promise<string[]>;
  zremrangebyscore(key: string, min: number | string, max: number | string): Promise<number>;
}

function createIoRedis(url: string): { provider: RedisProvider; clients: { client: IoRedisInstance; sub: IoRedisInstance } } {
  // Defer require to runtime; types intentionally loose to avoid build-time deps
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const IORedis = require("ioredis") as new (url: string, opts: object) => IoRedisInstance;

  // Two clients: one general, one subscriber
  const commonOpts = {
    // Upstash/serverless friendly: avoid long hangs and noisy ready checks
    enableReadyCheck: false,
    // Disable per-request retry cap that throws MaxRetriesPerRequestError
    maxRetriesPerRequest: null as unknown as number | null,
    retryStrategy: (times: number) => Math.min(1000 * Math.pow(2, times), 5000),
    reconnectOnError: (err: Error) =>
      /READONLY|ECONNRESET|ETIMEDOUT/i.test(err.message),
    // TLS when using rediss://; Upstash uses valid certs
    ...(url.startsWith("rediss://") ? { tls: {} } : {}),
  };

  const client = new IORedis(url, commonOpts);
  const sub = new IORedis(url, commonOpts);
  const subscribers = new Map<string, Set<(msg: string) => void>>();

  sub.on("message", (channel: unknown, message: unknown) => {
    const set = subscribers.get(String(channel));
    if (set) {
      for (const fn of set) {
        try {
          fn(String(message));
        } catch (e) {
          logRedisError(`message handler error on channel ${channel}`, e as Error);
        }
      }
    }
  });

  // Structured error handling instead of swallowing
  const handleError = (source: string) => (...args: unknown[]) => {
    const e = args[0] instanceof Error ? args[0] : new Error(String(args[0]));
    logRedisError(`${source} connection error`, e);
  };

  client.on("error", handleError("client"));
  sub.on("error", handleError("subscriber"));

  const provider: RedisProvider = {
    async get(key) {
      const v = await client.get(key);
      return v === null ? null : String(v);
    },
    async set(key, value, opts) {
      if (opts?.NX || opts?.PX) {
        const args: Array<string | number> = [key, value];
        if (opts.PX) {
          args.push("PX", Math.max(1, Math.trunc(opts.PX)));
        }
        if (opts.NX) {
          args.push("NX");
        }
        const res = await client.set(...args);
        return res === "OK";
      }
      const res = await client.set(key, value);
      return res === "OK";
    },
    async incrBy(key, by, ttlMs) {
      // Increment and set TTL (resets TTL)
      const multi = client.multi();
      multi.incrby(key, by);
      if (ttlMs && ttlMs > 0) multi.pexpire(key, Math.trunc(ttlMs));
      const out = await multi.exec();
      const incVal = Number(out?.[0]?.[1] ?? 0);
      return Number.isFinite(incVal) ? incVal : 0;
    },
    async del(key) {
      await client.del(key);
    },
    async mget(...keys) {
      const arr = await client.mget(...keys);
      return arr.map((v) => (v == null ? null : String(v)));
    },
    async expire(key, seconds) {
      const res = await client.expire(key, Math.max(1, Math.trunc(seconds)));
      return res === 1;
    },
    async scan(cursor, _m, pattern, _c, count) {
      const out = await client.scan(cursor, "MATCH", pattern, "COUNT", count);
      return [String(out[0]), out[1]];
    },
    async publish(channel, message) {
      return client.publish(channel, message);
    },
    async subscribe(channel, handler) {
      if (!subscribers.has(channel)) subscribers.set(channel, new Set());
      subscribers.get(channel)!.add(handler);
      await sub.subscribe(channel);
    },
    async unsubscribe(channel, handler?) {
      const set = subscribers.get(channel);
      if (!set) return;
      if (handler) {
        set.delete(handler);
      } else {
        set.clear();
      }
      if (set.size === 0) {
        try {
          await sub.unsubscribe(channel);
        } catch (e) {
          logRedisError(`unsubscribe error on channel ${channel}`, e as Error);
        }
      }
    },
    supportsSubscribe() {
      return true;
    },
    // Sorted set operations
    async zadd(key: string, item: { score: number; member: string }) {
      return client.zadd(key, item.score, item.member);
    },
    async zrangebyscore(key: string, min: number | string, max: number | string) {
      return client.zrangebyscore(key, min, max);
    },
    async zremrangebyscore(key: string, min: number | string, max: number | string) {
      return client.zremrangebyscore(key, min, max);
    },
    async ping() {
      return client.ping();
    },
    async close() {
      try {
        subscribers.clear();
        await Promise.all([
          client.quit().catch(() => client.disconnect()),
          sub.quit().catch(() => sub.disconnect()),
        ]);
      } catch (e) {
        // KERN-005 FIX: Ensure clients are forcibly disconnected even if quit fails
        // This prevents resource leaks when graceful shutdown fails
        logRedisError("close error - forcing disconnect", e as Error);
        try {
          client.disconnect();
        } catch { /* ignore disconnect errors */ }
        try {
          sub.disconnect();
        } catch { /* ignore disconnect errors */ }
      }
    },
  };

  return { provider, clients: { client, sub } };
}

function initializeRedisProvider(): RedisGlobalState {
  let provider: RedisProvider;
  let providerReason: string | null = null;
  let ioredisClients: { client: unknown; sub: unknown } | undefined;

  try {
    const { REDIS_URL, USE_MEMORY_STORE, APP_ENV } = getEnv();

    if (!USE_MEMORY_STORE && REDIS_URL) {
      try {
        // Only construct client if ioredis is available at runtime
        require.resolve("ioredis");
        const result = createIoRedis(REDIS_URL);
        provider = result.provider;
        ioredisClients = result.clients;
      } catch (e) {
        providerReason = (e as Error)?.message ?? "ioredis not installed";
        provider = createMemoryRedis();
      }
    } else {
      providerReason = USE_MEMORY_STORE ? "USE_MEMORY_STORE=true" : "no REDIS_URL configured";
      provider = createMemoryRedis();
    }

    // In production, we require real Redis
    const isMemory = !ioredisClients;
    if (isMemory && (APP_ENV ?? "").toLowerCase() === "prod") {
      throw new Error(`Redis/KV misconfigured: ${providerReason ?? "no provider selected"}`);
    }
  } catch (e) {
    providerReason = (e as Error)?.message ?? "env parse failed";
    provider = createMemoryRedis();
  }

  if (!ioredisClients && providerReason) {
    logger.warn('Falling back to memory store', { module: 'redis', reason: providerReason });
  }

  return {
    provider,
    providerReason,
    initialized: true,
    ioredisClients,
  };
}

// Lazy initialization with global caching
function getRedisState(): RedisGlobalState {
  if (!globalForRedis.__redisState || !globalForRedis.__redisState.initialized) {
    globalForRedis.__redisState = initializeRedisProvider();
  }
  return globalForRedis.__redisState;
}

// Export a getter function that lazily initializes
export const redis: RedisProvider = new Proxy({} as RedisProvider, {
  get(_target, prop: keyof RedisProvider) {
    const state = getRedisState();
    const value = state.provider[prop];
    if (typeof value === 'function') {
      return value.bind(state.provider);
    }
    return value;
  },
});

// Graceful shutdown helper
export async function closeRedis(): Promise<void> {
  const state = globalForRedis.__redisState;
  if (state?.provider.close) {
    await state.provider.close();
  }
  // Reset state so next access reinitializes
  globalForRedis.__redisState = undefined;
}

// Check if using real Redis (not memory)
export function isRedisConnected(): boolean {
  const state = globalForRedis.__redisState;
  return state?.initialized === true && !!state.ioredisClients;
}
