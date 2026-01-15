import { InvoicesRepository } from "../../data/invoices.repository";
import { SubscriptionsRepository } from "../../data/subscriptions.repository";

export async function getScopeOpenInvoiceCounts(scopeIds: string[]) {
  return InvoicesRepository.countOpenByScopeIds(scopeIds);
}

export async function getScopeLatestSubscriptions(scopeIds: string[]) {
  return await SubscriptionsRepository.getLatestByScopeIds(scopeIds);
}
