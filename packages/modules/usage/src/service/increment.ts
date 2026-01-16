import { getScopeId, kv, events, logger } from "@unisane/kernel";
import { ERR } from "@unisane/gateway";
import { usageKeys } from "../domain/keys";
import { USAGE_EVENTS } from "../domain/constants";

/** Maximum increment value to prevent abuse */
const MAX_INCREMENT = 1_000_000;

/**
 * USAG-001 FIX: Rate limiting configuration for usage increments.
 * Prevents abuse by limiting increment calls per feature per scope.
 */
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute window
const RATE_LIMIT_MAX_CALLS = 100; // Max 100 calls per feature per minute

export type IncrementUsageArgs = {
  feature: string;
  /** Increment amount (must be a positive integer, defaults to 1) */
  n?: number;
  at?: Date;
  idem?: string;
};

/**
 * Increment usage counter for a feature within the current scope.
 *
 * @param args.feature - Feature identifier to increment
 * @param args.n - Increment amount (must be positive integer, max 1,000,000)
 * @param args.at - Timestamp for the usage (defaults to now)
 * @param args.idem - Idempotency key for deduplication
 * @throws validation error if n is not a positive integer
 */
export async function increment(args: IncrementUsageArgs) {
  const scopeId = getScopeId();
  const n = args.n ?? 1;

  // Validate increment value - must be positive integer
  if (typeof n !== 'number' || !Number.isInteger(n)) {
    throw ERR.validation('Increment value must be an integer');
  }
  if (n <= 0) {
    throw ERR.validation('Increment value must be positive');
  }
  if (n > MAX_INCREMENT) {
    throw ERR.validation(`Increment value cannot exceed ${MAX_INCREMENT}`);
  }

  // USAG-001 FIX: Rate limiting per feature per scope
  const rateLimitKey = usageKeys.rateLimit(scopeId, args.feature);
  // Use incrBy with TTL - the TTL is applied on first creation
  const callCount = await kv.incrBy(rateLimitKey, 1, RATE_LIMIT_WINDOW_MS);
  if (callCount > RATE_LIMIT_MAX_CALLS) {
    logger.warn('usage.increment rate limited', { scopeId, feature: args.feature, callCount });
    throw ERR.rateLimited({ retryAfterSec: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) });
  }

  if (args.idem) {
    const idemKey = usageKeys.idem(args.idem);
    // USAG-002 FIX: Store the result so deduped requests return same data
    const existing = await kv.get(idemKey);
    if (existing) {
      try {
        const cached = JSON.parse(existing) as { ok: true; deduped?: boolean; total?: number };
        return { ...cached, deduped: true as const };
      } catch {
        return { ok: true as const, deduped: true as const };
      }
    }
    // Will set the value after computing total below
  }
  const now = args.at ?? new Date();
  const key = usageKeys.minute(scopeId, args.feature, now);
  const windowEnd = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes() + 1,
    0,
    0
  );
  const ttlMs = Math.max(1, windowEnd - now.getTime());
  const total = await kv.incrBy(key, n, ttlMs);

  // Emit usage incremented event
  await events.emit(USAGE_EVENTS.INCREMENTED, {
    scopeId,
    feature: args.feature,
    amount: n,
    total,
  });

  const result = { ok: true as const, total };

  // USAG-002 FIX: Cache result for idempotency
  if (args.idem) {
    const idemKey = usageKeys.idem(args.idem);
    await kv.set(idemKey, JSON.stringify(result), { PX: 10 * 60 * 1000 });
  }

  return result;
}
