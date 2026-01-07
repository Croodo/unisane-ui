import type { PaymentsRepo } from '../domain/ports/payments';
import { mongoPaymentsRepo } from './payments.repository.mongo';
import { selectRepo } from '@unisane/kernel';

const repo = selectRepo<PaymentsRepo>({ mongo: mongoPaymentsRepo });

export const listPage = repo.listPage.bind(repo);
export const findByProviderPaymentId = repo.findByProviderPaymentId.bind(repo);
export const markRefunded = repo.markRefunded.bind(repo);
export const upsertByProviderId = repo.upsertByProviderId.bind(repo);
export const listByProviderId = repo.listByProviderId.bind(repo);
