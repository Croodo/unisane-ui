import type { InvoicesRepo } from '../domain/ports/invoices';
import { mongoInvoicesRepo } from './invoices.repository.mongo';
import { selectRepo } from '@unisane/kernel';

export const InvoicesRepository = selectRepo<InvoicesRepo>({ mongo: mongoInvoicesRepo });
