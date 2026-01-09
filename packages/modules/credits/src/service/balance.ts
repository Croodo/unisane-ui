import {
  totalsAvailable,
  totalsGrantsByReason,
} from "../data/credits.repository";
import type {
  CreditsBreakdown,
  CreditsBucket,
} from "../domain/types";
import { getTenantId, logger } from "@unisane/kernel";

export async function balance() {
  const tenantId = getTenantId();
  const { available } = await totalsAvailable(tenantId, new Date());
  // Align with contract shape: { amount, effectiveAt? }
  try {
    logger.info("credits.balance computed", { tenantId, available });
  } catch {
    // logging best-effort
  }
  return { amount: available };
}

export async function breakdown(): Promise<CreditsBreakdown> {
  const tenantId = getTenantId();
  const now = new Date();
  const { grants, burns, available } = await totalsAvailable(tenantId, now);
  const {
    subscriptionGrants,
    topupGrants: rawTopupGrants,
    otherGrants: rawOtherGrants,
  } = await totalsGrantsByReason(tenantId, now);

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
