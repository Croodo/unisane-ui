import { getScopeId, kv, type UsageWindow } from "@unisane/kernel";
import { UsageRepo } from "../data/usage.repository";
import { usageKeys } from "../domain/keys";

export type GetWindowArgs = {
  feature: string;
  window: UsageWindow;
  at?: Date;
};

export async function getWindow(args: GetWindowArgs) {
  const scopeId = getScopeId();
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
    return UsageRepo.findDayCount(scopeId, args.feature, start);
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
    return UsageRepo.findHourCount(scopeId, args.feature, start);
  }
  const v = await kv.get(usageKeys.minute(scopeId, args.feature, now));
  return v ? Number(v) : 0;
}
