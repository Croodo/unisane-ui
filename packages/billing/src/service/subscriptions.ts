import * as repo from '../data/subscriptions.repository';
import type { SubscriptionView } from '../domain/types';

export const SubscriptionsService = {
  getLatest: repo.getLatest,
  getLatestProviderSubId: repo.getLatestProviderSubId,
  setCancelAtPeriodEnd: repo.setCancelAtPeriodEnd,
  setCanceledImmediate: repo.setCanceledImmediate,
  setQuantity: repo.setQuantity,
  upsertByProviderId: repo.upsertByProviderId,
  listByProviderId: repo.listByProviderId,
  listByStatusAged: repo.listByStatusAged,
} as const;

export type { SubscriptionView };

