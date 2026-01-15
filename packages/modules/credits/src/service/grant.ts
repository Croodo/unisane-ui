import { getScopeId, redis, events } from '@unisane/kernel';
import { creditsKeys } from '../domain/keys';
import { CREDITS_EVENTS } from '../domain/constants';
import { findByIdem, insertGrant } from '../data/credits.repository';
import { invalidateBalanceCache } from './balance';

export type GrantCreditsArgs = {
  amount: number;
  reason: string;
  idem: string;
  expiresAt?: Date | null;
};

/**
 * Arguments for grantWithExplicitScope - used when called from event handlers
 * that run outside the normal request context.
 */
export type GrantCreditsWithScopeArgs = GrantCreditsArgs & {
  scopeId: string;
};

/**
 * Grant credits to the current tenant (from context).
 * Use this in API handlers where tenant context is available.
 */
export async function grant(args: GrantCreditsArgs) {
  const scopeId = getScopeId();
  return grantCreditsInternal(scopeId, args);
}

/**
 * Grant credits with explicit scope ID.
 * Use this in event handlers or background jobs where scope context
 * may not be available.
 *
 * @example
 * ```typescript
 * // In an event handler
 * events.on('webhook.stripe.topup_completed', async (event) => {
 *   await grantWithExplicitScope({
 *     scopeId: event.payload.scopeId,
 *     amount: event.payload.credits,
 *     reason: 'purchase',
 *     idem: event.payload.paymentIntentId,
 *   });
 * });
 * ```
 */
export async function grantWithExplicitScope(args: GrantCreditsWithScopeArgs) {
  const { scopeId, ...grantArgs } = args;
  return grantCreditsInternal(scopeId, grantArgs);
}

/**
 * Internal implementation shared by both grant functions.
 *
 * **Idempotency Lock Strategy:**
 * Uses a short-lived Redis lock (10s TTL) to prevent duplicate grants.
 * The lock is NOT explicitly released in the finally block - this is intentional:
 *
 * 1. **Stampede Prevention:** If we released immediately after success, a retry
 *    arriving in the same millisecond could race past the DB check.
 *
 * 2. **Error Recovery:** If the operation fails, the 10s TTL provides a natural
 *    backoff before retries can proceed, preventing rapid-fire retry storms.
 *
 * 3. **Idempotent Result:** The DB unique index on idemKey provides the ultimate
 *    safety net - even if the lock expires early, duplicates are caught.
 *
 * The 10-second TTL is chosen to balance retry latency with protection.
 */
async function grantCreditsInternal(scopeId: string, args: GrantCreditsArgs) {
  // NX: only set if not exists, PX: 10-second expiry (see JSDoc above)
  const lock = await redis.set(creditsKeys.idemLock(scopeId, args.idem), '1', { NX: true, PX: 10_000 });
  if (!lock) return { ok: true as const, deduped: true as const };
  try {
    const exists = await findByIdem(scopeId, args.idem);
    if (exists) return { ok: true as const, deduped: true as const };
    const created = await insertGrant({
      scopeId,
      amount: args.amount,
      reason: args.reason,
      idemKey: args.idem,
      ...(args.expiresAt !== undefined ? { expiresAt: args.expiresAt } : {}),
    });
    // Invalidate cached balance
    await invalidateBalanceCache(scopeId);

    await events.emit(CREDITS_EVENTS.GRANTED, {
      scopeId,
      amount: args.amount,
      reason: args.reason,
      id: created.id,
    });
    return { ok: true as const, id: created.id };
  } catch (e: unknown) {
    if (typeof e === 'object' && e !== null && 'code' in e && (e as { code?: number }).code === 11000) {
      return { ok: true as const, deduped: true as const };
    }
    throw e;
  }
  // Note: Lock is NOT released here - see JSDoc above for intentional design
}
