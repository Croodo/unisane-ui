import { InvoicesRepository } from "../../data/invoices.repository";
import { SubscriptionsRepository } from "../../data/subscriptions.repository";

export async function getTenantOpenInvoiceCounts(tenantIds: string[]) {
  return InvoicesRepository.countOpenByTenantIds(tenantIds);
}

export async function getTenantLatestSubscriptions(tenantIds: string[]) {
  return await SubscriptionsRepository.getLatestByTenantIds(tenantIds);
}
