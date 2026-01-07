// Redis facade with two providers:
// - Native Redis client (ioredis) when REDIS_URL is set and module is available
// - In-memory fallback for local dev/tests

import { memoryStore } from "./memory";
import { getEnv } from "../env";

type SetOpts = { PX?: number; NX?: boolean };

type RedisProvider = {
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
  __getPublished?(
    channel?: string
  ): Array<{ channel: string; message: string; ts: number }>;
  __clearPublished?(): void;
};

// In-memory provider with pub/sub for single-process dev/tests
const memSubscribers = new Map<string, Set<(msg: string) => void>>();
const published: Array<{ channel: string; message: string; ts: number }> = [];
const memoryRedis: RedisProvider = {
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
    if (subs)
      for (const fn of subs) {
        try {
          fn(message);
        } catch {}
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
  __getPublished(channel?: string) {
    return channel
      ? published.filter((p) => p.channel === channel)
      : [...published];
  },
  __clearPublished() {
    published.splice(0, published.length);
  },
};

function createIoRedis(url: string): RedisProvider {
  // Defer require to runtime; types intentionally loose to avoid build-time deps
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const IORedis = require("ioredis") as any;
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
  sub.on("message", (channel: string, message: string) => {
    const set = subscribers.get(channel);
    if (set)
      for (const fn of set) {
        try {
          fn(message);
        } catch {}
      }
  });
  // Prevent unhandled error events from crashing the process
  const swallow = (e: Error) => {
    try {
      let isProd = false;
      try {
        isProd = (getEnv().APP_ENV ?? 'prod') === 'prod';
      } catch {
        // if env parsing fails, default to logging (non-prod)
        isProd = false;
      }
      if (!isProd) {
        console.warn("[redis]", e.name, e.message);
      }
    } catch {}
  };
  client.on("error", swallow);
  sub.on("error", swallow);
  return {
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
        const res = await client.set(...(args as unknown as [string]));
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
      return (arr as unknown[]).map((v) => (v == null ? null : String(v)));
    },
    async expire(key, seconds) {
      const res = await client.expire(key, Math.max(1, Math.trunc(seconds)));
      return res === 1;
    },
    async scan(cursor, _m, pattern, _c, count) {
      const out = await client.scan(cursor, "MATCH", pattern, "COUNT", count);
      return [String(out[0]), out[1] as string[]];
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
        try { await sub.unsubscribe(channel); } catch {}
      }
    },
    supportsSubscribe() {
      return true;
    },
  } as RedisProvider;
}

let provider: RedisProvider = memoryRedis;
let providerReason: string | null = null;
try {
  const { REDIS_URL, USE_MEMORY_STORE, APP_ENV } = getEnv();
  if (!USE_MEMORY_STORE && REDIS_URL) {
    try {
      // Only construct client if ioredis is available at runtime
      require.resolve("ioredis");
      provider = createIoRedis(REDIS_URL);
    } catch (e) {
      providerReason = (e as Error)?.message ?? "ioredis not installed";
      provider = memoryRedis;
    }
  } else {
    providerReason = USE_MEMORY_STORE ? "USE_MEMORY_STORE=true" : "no REDIS_URL configured";
  }
  if (provider === memoryRedis && (APP_ENV ?? "").toLowerCase() === "prod") {
    throw new Error(`Redis/KV misconfigured: ${providerReason ?? "no provider selected"}`);
  }
} catch (e) {
  providerReason = (e as Error)?.message ?? "env parse failed";
  provider = memoryRedis;
}

if (provider === memoryRedis && providerReason) {
  console.warn(`[redis] falling back to memory store (${providerReason})`);
}

export const redis = provider;
