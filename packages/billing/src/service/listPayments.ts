import { PaymentsRepository } from "../data/payments.repository";
import { getTenantId } from "@unisane/kernel";

export type ListPaymentsArgs = {
  cursor?: string;
  limit: number;
};

export async function listPayments(args: ListPaymentsArgs) {
  const tenantId = getTenantId();
  const base = { tenantId, limit: args.limit } as {
    tenantId: string;
    limit: number;
    cursor?: string;
  };
  if (args.cursor !== undefined) base.cursor = args.cursor;
  const page = await PaymentsRepository.listPage(base);
  return page;
}
