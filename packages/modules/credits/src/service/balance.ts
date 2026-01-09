import {
  totalsAvailable,
  totalsWithBreakdown,
} from "../data/credits.repository";
import type {
  CreditsBreakdown,
  CreditsBucket,
} from "../domain/types";
import { getTenantId, logger, KV, cacheGet, cacheSet, cacheDelete } from "@unisane/kernel";

/** Cache TTL for balance: 60 seconds */
const BALANCE_CACHE_TTL_MS = 60_000;

function balanceCacheKey(tenantId: string): string {
  return `${KV.CREDITS}balance:${tenantId}`;
}

export async function balance() {
  const tenantId = getTenantId();
  const cacheKey = balanceCacheKey(tenantId);

  // Check cache first
  const cached = await cacheGet<{ amount: number }>(cacheKey);
  if (cached !== null) {
    logger.debug("credits.balance cache hit", { tenantId, amount: cached.amount });
    return cached;
  }

  // Compute from ledger
  const { available } = await totalsAvailable(tenantId, new Date());
  const result = { amount: available };

  // Cache the result
  await cacheSet(cacheKey, result, BALANCE_CACHE_TTL_MS);

  logger.info("credits.balance computed", { tenantId, available });
  return result;
}

/**
 * Invalidate the cached balance for a tenant.
 * Call this after grant/burn operations.
 */
export async function invalidateBalanceCache(tenantId: string): Promise<void> {
  const cacheKey = balanceCacheKey(tenantId);
  await cacheDelete(cacheKey);
  logger.debug("credits.balance cache invalidated", { tenantId });
}

export async function breakdown(): Promise<CreditsBreakdown> {
  const tenantId = getTenantId();
  const now = new Date();

  // Single aggregation query using $facet - avoids two separate collection scans
  const {
    grants,
    burns,
    available,
    subscriptionGrants,
    topupGrants: rawTopupGrants,
    otherGrants: rawOtherGrants,
  } = await totalsWithBreakdown(tenantId, now);

  const norm = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

  const totalGrants = norm(grants);
  const subGrants = norm(subscriptionGrants);
  const topupGrants = norm(rawTopupGrants);
  const otherGrants = Math.max(
    0,
    norm(rawOtherGrants) || totalGrants - subGrants - topupGrants
  );

  let remainingBurns = norm(burns);

  const makeBucket = (g: number, b: number): CreditsBucket => ({
    grants: g,
    burns: b,
    available: g - b,
  });

  const subBurns = Math.min(remainingBurns, subGrants);
  remainingBurns -= subBurns;

  const topupBurns = Math.min(remainingBurns, topupGrants);
  remainingBurns -= topupBurns;

  const otherBurns = Math.min(remainingBurns, otherGrants);
  remainingBurns -= otherBurns;

  const subscription = makeBucket(subGrants, subBurns);
  const topup = makeBucket(topupGrants, topupBurns);
  const other = makeBucket(otherGrants, otherBurns);

  const total: CreditsBucket = {
    grants: subscription.grants + topup.grants + other.grants,
    burns: subscription.burns + topup.burns + other.burns,
    available: subscription.available + topup.available + other.available,
  };

  // Trust the ledger as the source of truth; align total.available if there is minor drift.
  if (Math.abs(total.available - available) > 0) {
    total.available = available;
  }

  return {
    total,
    subscription,
    topup,
    other,
  };
}
