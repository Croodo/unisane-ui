import { getBillingMode } from "./mode";
import { PLANS, PLAN_META } from "@unisane/kernel";
import type { BillingConfig, PlanConfig } from "../domain/types";

export type { BillingConfig, PlanConfig };

export async function getConfig(): Promise<BillingConfig> {
  const mode = await getBillingMode();
  const plans: PlanConfig[] = PLANS.map((id) => {
    const meta = PLAN_META[id];
    return {
      id,
      label: meta.label,
      tagline: meta.tagline,
      ...(meta.recommended ? { recommended: true } : {}),
      ...(meta.features && meta.features.length
        ? { features: meta.features }
        : {}),
      ...(meta.defaultPrice ? { defaultPrice: meta.defaultPrice } : {}),
    };
  });
  return { mode, plans };
}
