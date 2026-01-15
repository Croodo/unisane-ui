import type { SubscriptionView } from '../types';
import type { BillingProvider, SubscriptionStatus } from '@unisane/kernel';

/**
 * Lightweight subscription view for admin/stats aggregation.
 * Defined locally to avoid cross-module type dependency on @unisane/tenants.
 */
export type LatestSub = {
  planId: string | null;
  status: string | null;
  quantity: number | null;
  currentPeriodEnd: Date | null;
};

export interface SubscriptionsRepo {
  findLatest(scopeId: string): Promise<SubscriptionView | null>;
  // Admin/stats: latest subscription fields grouped by scopeId
  findLatestByScopeIds(scopeIds: string[]): Promise<Map<string, LatestSub>>;
  findLatestProviderSubId(scopeId: string): Promise<string | null>;
  markCancelAtPeriodEnd(scopeId: string): Promise<void>;
  cancelImmediately(scopeId: string): Promise<void>;
  updateQuantity(scopeId: string, quantity: number): Promise<void>;
  upsertByProviderId(args: {
    scopeId: string;
    provider: BillingProvider;
    providerSubId: string;
    planId: string;
    quantity: number;
    status: SubscriptionStatus;
    providerStatus?: string | null;
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: Date | null;
  }): Promise<void>;
  listByProviderId(provider: BillingProvider): Promise<Array<{ scopeId: string; providerSubId: string }>>;
  listByStatusAged(statuses: SubscriptionStatus[], updatedBefore: Date, limit: number): Promise<Array<{ scopeId: string; providerSubId?: string | null; status?: SubscriptionStatus | null; updatedAt?: Date | null }>>;
}
