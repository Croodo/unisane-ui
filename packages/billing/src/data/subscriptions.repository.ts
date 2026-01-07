import type { SubscriptionsRepo } from '../domain/ports';
import { mongoSubscriptionsRepo } from './subscriptions.repository.mongo';
import { selectRepo } from '@unisane/kernel';

const repo = selectRepo<SubscriptionsRepo>({ mongo: mongoSubscriptionsRepo });

export const getLatest = repo.getLatest.bind(repo);
export const getLatestByTenantIds = repo.getLatestByTenantIds.bind(repo);
export const getLatestProviderSubId = repo.getLatestProviderSubId.bind(repo);
export const setCancelAtPeriodEnd = repo.setCancelAtPeriodEnd.bind(repo);
export const setCanceledImmediate = repo.setCanceledImmediate.bind(repo);
export const setQuantity = repo.setQuantity.bind(repo);
export const upsertByProviderId = repo.upsertByProviderId.bind(repo);
export const listByProviderId = repo.listByProviderId.bind(repo);
export const listByStatusAged = repo.listByStatusAged.bind(repo);
