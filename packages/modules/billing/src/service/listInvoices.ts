import { InvoicesRepository } from "../data/invoices.repository";
import { getTenantId } from "@unisane/kernel";
import type { ListPageArgs } from "@unisane/kernel";

export async function listInvoices(args: ListPageArgs) {
  const tenantId = getTenantId();
  const base = { tenantId, limit: args.limit } as {
    tenantId: string;
    limit: number;
    cursor?: string;
  };
  if (args.cursor) base.cursor = args.cursor;
  const page = await InvoicesRepository.listPage(base);
  return page;
}
