import type { SubscriptionView } from '../types';
import type { BillingProvider, SubscriptionStatus } from '@unisane/kernel';
import type { LatestSub } from '@unisane/tenants';

export interface SubscriptionsRepo {
  getLatest(scopeId: string): Promise<SubscriptionView | null>;
  // Admin/stats: latest subscription fields grouped by scopeId
  getLatestByScopeIds(scopeIds: string[]): Promise<Map<string, LatestSub>>;
  getLatestProviderSubId(scopeId: string): Promise<string | null>;
  setCancelAtPeriodEnd(scopeId: string): Promise<void>;
  setCanceledImmediate(scopeId: string): Promise<void>;
  setQuantity(scopeId: string, quantity: number): Promise<void>;
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
