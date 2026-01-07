import type { InvoicesRepo } from '../domain/ports/invoices';
import { mongoInvoicesRepo } from './invoices.repository.mongo';
import { selectRepo } from '@unisane/kernel';

const repo = selectRepo<InvoicesRepo>({ mongo: mongoInvoicesRepo });

export const listPage = repo.listPage.bind(repo);
export const upsertByProviderId = repo.upsertByProviderId.bind(repo);
export const countOpenByTenantIds = repo.countOpenByTenantIds.bind(repo);
