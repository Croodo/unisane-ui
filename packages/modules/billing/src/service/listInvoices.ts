import { InvoicesRepository } from "../data/invoices.repository";
import { getTenantId } from "@unisane/kernel";

export type ListInvoicesArgs = {
  cursor?: string;
  limit: number;
};

export async function listInvoices(args: ListInvoicesArgs) {
  const tenantId = getTenantId();
  const base = { tenantId, limit: args.limit } as {
    tenantId: string;
    limit: number;
    cursor?: string;
  };
  if (args.cursor !== undefined) base.cursor = args.cursor;
  const page = await InvoicesRepository.listPage(base);
  return page;
}
