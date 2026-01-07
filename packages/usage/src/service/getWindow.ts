import { getTenantId, kv } from "@unisane/kernel";
import { UsageRepo } from "../data/usage.repository";
import { usageMinuteKey } from "../domain/keys";

export type GetWindowArgs = {
  feature: string;
  window: "minute" | "hour" | "day";
  at?: Date;
};

export async function getWindow(args: GetWindowArgs) {
  const tenantId = getTenantId();
  const now = args.at ?? new Date();
  if (args.window === "day") {
    const start = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0
      )
    );
    return UsageRepo.getDayCount(tenantId, args.feature, start);
  }
  if (args.window === "hour") {
    const start = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        0,
        0
      )
    );
    return UsageRepo.getHourCount(tenantId, args.feature, start);
  }
  const v = await kv.get(usageMinuteKey(tenantId, args.feature, now));
  return v ? Number(v) : 0;
}
