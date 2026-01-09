import { PaymentsRepository } from "../data/payments.repository";
import { getTenantId } from "@unisane/kernel";
import type { ListPageArgs } from "@unisane/kernel";

export async function listPayments(args: ListPageArgs) {
  const tenantId = getTenantId();
  const base = { tenantId, limit: args.limit } as {
    tenantId: string;
    limit: number;
    cursor?: string;
  };
  if (args.cursor) base.cursor = args.cursor;
  const page = await PaymentsRepository.listPage(base);
  return page;
}
