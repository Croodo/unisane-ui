// SSOT for token pricing (per-feature) and plan entitlements (daily free units).
// Update these to change metering costs or freebies. Used by metering policy/guard.
import { FEATURE } from './features';
import type { FeatureKey } from './features';
import { PLANS, PLAN_DEFS } from './plan';
import type { PlanId } from './plan';

export type TokenCost = { cost: number; unit?: 'op' | 'sec' | 'mb' };
export type FeaturePolicyMap = Record<FeatureKey, TokenCost>;

// Default per-feature token costs (per unit)
export const DEFAULT_TOKEN_COSTS: FeaturePolicyMap = {
  [FEATURE.AI_GENERATE]: { cost: 5 },
  [FEATURE.PDF_RENDER]: { cost: 10 },
  [FEATURE.API_CALL]: { cost: 1 },
  [FEATURE.STORAGE_GB]: { cost: 100, unit: 'mb' },
  [FEATURE.IMAGE_PROCESS]: { cost: 3 },
};

// Per-plan daily free entitlements (units per day), derived from PLAN_DEFS SSOT
export const ENTITLEMENTS: Record<
  PlanId,
  { dailyFree?: Partial<Record<FeatureKey, number>> }
> = PLANS.reduce(
  (acc, planId) => {
    const dailyFree = PLAN_DEFS[planId].entitlements.dailyFree;
    acc[planId] = dailyFree && Object.keys(dailyFree).length
      ? { dailyFree }
      : {};
    return acc;
  },
  {} as Record<PlanId, { dailyFree?: Partial<Record<FeatureKey, number>> }>
);
