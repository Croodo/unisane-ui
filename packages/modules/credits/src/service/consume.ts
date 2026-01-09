import { getTenantId, redis, events } from "@unisane/kernel";
import { ERR } from "@unisane/gateway";
import { creditsKeys } from "../domain/keys";
import { CREDITS_EVENTS } from "../domain/constants";
import {
  totalsAvailable,
  insertBurn,
} from "../data/credits.repository";

export type ConsumeCreditsArgs = {
  amount: number;
  reason: string;
  feature?: string;
};

export async function consume(args: ConsumeCreditsArgs) {
  const tenantId = getTenantId();
  if (args.amount <= 0) return { ok: true as const, skipped: true as const };
  const idemKey = args.reason;
  const lock = await redis.set(creditsKeys.idemLock(tenantId, idemKey), "1", {
    NX: true,
    PX: 10_000,
  });
  if (!lock) return { ok: true as const, deduped: true as const };
  try {
    const { available } = await totalsAvailable(tenantId, new Date());
    if (available < args.amount) throw ERR.insufficientCredits();
    await insertBurn({
      tenantId,
      amount: args.amount,
      feature: args.feature ?? "usage",
      idemKey,
    });
    await events.emit(CREDITS_EVENTS.CONSUMED, {
      tenantId,
      amount: args.amount,
      reason: args.reason,
      feature: args.feature ?? "usage",
    });
    return { ok: true as const };
  } finally {
    // Let the short TTL expire naturally to reduce stampedes
  }
}
