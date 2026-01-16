import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "../cache/redis";
import { getEnv } from "../env";
import { logger } from "../observability/logger";

// In-memory rate limiter for development/testing
const memoryLimits = new Map<string, { count: number; resetAt: number }>();

function checkMemoryRateLimit(identifier: string, limit = 50, windowMs = 10000) {
  const now = Date.now();
  const existing = memoryLimits.get(identifier);
  
  if (!existing || now > existing.resetAt) {
    memoryLimits.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
  }
  
  if (existing.count >= limit) {
    return { success: false, limit, remaining: 0, reset: existing.resetAt };
  }
  
  existing.count++;
  return { success: true, limit, remaining: limit - existing.count, reset: existing.resetAt };
}

// Use redis façade for rate limiting
// Falls back to in-memory implementation if Redis is not available
let ratelimit: Ratelimit | null = null;
try {
  ratelimit = new Ratelimit({
    redis: redis as unknown as ConstructorParameters<typeof Ratelimit>[0]["redis"],
    limiter: Ratelimit.slidingWindow(50, "10 s"),
    analytics: true,
    prefix: "@upstash/ratelimit",
  });
} catch {
  logger.warn('Failed to initialize Upstash ratelimit, using in-memory fallback', { module: 'ratelimit' });
}

export async function checkRateLimit(identifier: string) {
  // Use in-memory fallback if Upstash ratelimit failed to initialize or if we're in dev without Redis
  if (!ratelimit || getEnv().USE_MEMORY_STORE) {
    return checkMemoryRateLimit(identifier);
  }
  
  try {
    const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
    return { success, limit, remaining, reset };
  } catch (e) {
    // Fall back to in-memory on error
    logger.warn('Redis error, using in-memory fallback', {
      module: 'ratelimit',
      error: (e as Error).message,
    });
    return checkMemoryRateLimit(identifier);
  }
}
