// Entitlements resolution now lives in @unisane/billing
export {
  resolveEntitlements,
  resolveEntitlementsForPlan,
  resolveTokenPolicy,
  invalidateEntitlements,
  deepMergeEntitlements,
  getEntitlementsWithUsage,
} from '@unisane/billing';
export type { Entitlements, TokenPolicy, EntitlementsWithUsage } from '@unisane/billing';

// Guard is app-specific orchestration (uses billing, usage, credits)
export * from './guard';

