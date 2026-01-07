import type { InvoiceListPage } from '../types';
import type { BillingProvider } from '@unisane/kernel';
import type { InvoiceStatus } from '@unisane/kernel';

export interface InvoicesRepo {
  listPage(args: { tenantId: string; cursor?: string; limit: number }): Promise<InvoiceListPage>;
  // Admin/stats: count open invoices grouped by tenantId
  countOpenByTenantIds(tenantIds: string[]): Promise<Map<string, number>>;
  upsertByProviderId(args: {
    tenantId: string;
    provider: BillingProvider;
    providerInvoiceId: string;
    amount: number;
    currency: string;
    status: InvoiceStatus;
    issuedAt?: Date | null;
    url?: string | null;
  }): Promise<void>;
}
