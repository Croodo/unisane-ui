import { InvoicesRepository } from "../data/invoices.repository";
import { getScopeId } from "@unisane/kernel";
import type { ListPageArgs } from "@unisane/kernel";

export async function listInvoices(args: ListPageArgs) {
  const scopeId = getScopeId();
  const base = { scopeId, limit: args.limit } as {
    scopeId: string;
    limit: number;
    cursor?: string;
  };
  if (args.cursor) base.cursor = args.cursor;
  const page = await InvoicesRepository.listPage(base);
  return page;
}
