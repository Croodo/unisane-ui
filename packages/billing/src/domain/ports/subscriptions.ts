import type { SubscriptionView } from '../types';
import type { BillingProvider, SubscriptionStatus } from '@unisane/kernel';
import type { LatestSub } from '@unisane/tenants';

export interface SubscriptionsRepo {
  getLatest(tenantId: string): Promise<SubscriptionView | null>;
  // Admin/stats: latest subscription fields grouped by tenantId
  getLatestByTenantIds(tenantIds: string[]): Promise<Map<string, LatestSub>>;
  getLatestProviderSubId(tenantId: string): Promise<string | null>;
  setCancelAtPeriodEnd(tenantId: string): Promise<void>;
  setCanceledImmediate(tenantId: string): Promise<void>;
  setQuantity(tenantId: string, quantity: number): Promise<void>;
  upsertByProviderId(args: {
    tenantId: string;
    provider: BillingProvider;
    providerSubId: string;
    planId: string;
    quantity: number;
    status: SubscriptionStatus;
    providerStatus?: string | null;
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: Date | null;
  }): Promise<void>;
  listByProviderId(provider: BillingProvider): Promise<Array<{ tenantId: string; providerSubId: string }>>;
  listByStatusAged(statuses: SubscriptionStatus[], updatedBefore: Date, limit: number): Promise<Array<{ tenantId: string; providerSubId?: string | null; status?: SubscriptionStatus | null; updatedAt?: Date | null }>>;
}
