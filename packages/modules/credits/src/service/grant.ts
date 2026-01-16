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
 * CRED-003 FIX: Simplified idempotency with database unique constraint as primary defense.
 *
 * **Idempotency Strategy:**
 * 1. Redis lock (NX) - Prevents concurrent duplicate attempts
 * 2. Database unique index on idemKey - Authoritative duplicate prevention
 *
 * **Why we removed the findByIdem check:**
 * The previous implementation had a TOCTOU race between the check and insert.
 * The database unique constraint is the authoritative defense against duplicates,
 * so the pre-check was redundant and added latency without additional safety.
 *
 * **Lock TTL Strategy:**
 * The 10-second TTL is intentionally NOT released early:
 * - Prevents stampede from rapid retries on success
 * - Provides natural backoff on transient failures
 * - Database constraint catches any duplicates from expired locks
 */
async function grantCreditsInternal(scopeId: string, args: GrantCreditsArgs) {
  // CRED-003 FIX: Redis lock prevents concurrent duplicate attempts
  const lock = await redis.set(creditsKeys.idemLock(scopeId, args.idem), '1', { NX: true, PX: 10_000 });
  if (!lock) return { ok: true as const, deduped: true as const };

  try {
    // CRED-003 FIX: Directly attempt insert - rely on DB unique constraint
    // No pre-check needed; the constraint is authoritative
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
    // CRED-003 FIX: Duplicate key error (code 11000) means idempotent success
    if (typeof e === 'object' && e !== null && 'code' in e && (e as { code?: number }).code === 11000) {
      return { ok: true as const, deduped: true as const };
    }
    throw e;
  }
  // Note: Lock is NOT released here - see JSDoc above for intentional design
}
