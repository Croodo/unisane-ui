import { getTenantId, kv, events } from "@unisane/kernel";
import { usageIdemKey, usageMinuteKey } from "../domain/keys";
import { USAGE_EVENTS } from "../domain/constants";

export type IncrementUsageArgs = {
  feature: string;
  n?: number;
  at?: Date;
  idem?: string;
};

export async function increment(args: IncrementUsageArgs) {
  const tenantId = getTenantId();
  const n = args.n ?? 1;
  if (args.idem) {
    const idemKey = usageIdemKey(args.idem);
    const ok = await kv.set(idemKey, "1", { NX: true, PX: 10 * 60 * 1000 });
    if (!ok) return { ok: true as const, deduped: true as const };
  }
  const now = args.at ?? new Date();
  const key = usageMinuteKey(tenantId, args.feature, now);
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
  await kv.incrBy(key, n, ttlMs);

  // Emit usage incremented event
  await events.emit(USAGE_EVENTS.INCREMENTED, {
    tenantId,
    feature: args.feature,
    amount: n,
    timestamp: now.toISOString(),
  });

  return { ok: true as const };
}
