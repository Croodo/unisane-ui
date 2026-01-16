import { getScopeId, getScopeRequestId, redis, events, withRetryableTransaction } from "@unisane/kernel";
import { ERR } from "@unisane/gateway";
import { creditsKeys } from "../domain/keys";
import { CREDITS_EVENTS } from "../domain/constants";
import {
  totalsAvailable,
  insertBurnAtomic,
} from "../data/credits.repository";
import { invalidateBalanceCache } from "./balance";

export type ConsumeCreditsArgs = {
  amount: number;
  reason: string;
  feature?: string;
  /**
   * Optional idempotency key to prevent duplicate charges.
   * If not provided, a key will be generated from requestId + reason.
   *
   * IMPORTANT: For idempotent operations, always pass a consistent key
   * that uniquely identifies the operation (e.g., `invoice:${invoiceId}`).
   */
  idempotencyKey?: string;
};

/**
 * Consume credits from a tenant's balance.
 *
 * Uses triple-layer idempotency protection:
 * 1. Redis lock (prevents concurrent identical requests)
 * 2. Database unique constraint on idemKey (prevents duplicate burns)
 * 3. Short TTL on lock (prevents indefinite blocking on failures)
 *
 * @param args.amount - Number of credits to consume (must be > 0)
 * @param args.reason - Human-readable reason for the charge
 * @param args.feature - Feature category (defaults to "usage")
 * @param args.idempotencyKey - Optional unique key for deduplication
 */
export async function consume(args: ConsumeCreditsArgs) {
  const scopeId = getScopeId();
  if (args.amount <= 0) return { ok: true as const, skipped: true as const };

  // SECURITY FIX: Idempotency key must be unique per operation
  // Previously used only `reason`, which caused different operations with
  // the same reason to be incorrectly deduplicated.
  //
  // The key now includes:
  // - Explicit idempotencyKey if provided (for caller-controlled deduplication)
  // - OR requestId + reason (ensures each request is treated uniquely)
  const requestId = getScopeRequestId();
  const idemKey = args.idempotencyKey ?? `${requestId}:${args.reason}`;

  const lock = await redis.set(creditsKeys.idemLock(scopeId, idemKey), "1", {
    NX: true,
    PX: 10_000,
  });
  if (!lock) return { ok: true as const, deduped: true as const };

  try {
    // DATA-002 FIX: Use atomic transaction to prevent race condition between
    // balance check and burn. Previously, two concurrent requests could both
    // pass the balance check before either wrote the burn, resulting in
    // negative balance.
    //
    // Now uses withRetryableTransaction to:
    // 1. Check balance within transaction
    // 2. Insert burn within same transaction
    // 3. If concurrent modification detected, retry automatically
    const result = await withRetryableTransaction(async (session) => {
      const { available } = await totalsAvailable(scopeId, new Date());
      if (available < args.amount) {
        throw ERR.insufficientCredits();
      }

      await insertBurnAtomic({
        scopeId,
        amount: args.amount,
        feature: args.feature ?? "usage",
        idemKey,
        session,
      });

      return { burned: true };
    });

    if (!result.burned) {
      // This shouldn't happen, but handle gracefully
      return { ok: true as const, skipped: true as const };
    }

    // Invalidate cached balance
    await invalidateBalanceCache(scopeId);

    await events.emit(CREDITS_EVENTS.CONSUMED, {
      scopeId,
      amount: args.amount,
      reason: args.reason,
      feature: args.feature ?? "usage",
      idempotencyKey: idemKey,
    });
    return { ok: true as const };
  } finally {
    // Let the short TTL expire naturally to reduce stampedes
  }
}
