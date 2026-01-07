import { countOpenByTenantIds } from "../../data/invoices.repository";
import { getLatestByTenantIds } from "../../data/subscriptions.repository";

export async function getTenantOpenInvoiceCounts(tenantIds: string[]) {
  return countOpenByTenantIds(tenantIds);
}

export async function getTenantLatestSubscriptions(tenantIds: string[]) {
  return await getLatestByTenantIds(tenantIds);
}
