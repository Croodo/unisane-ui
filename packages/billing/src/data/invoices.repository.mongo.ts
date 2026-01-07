import { col } from "@unisane/kernel";
import type { Collection, Filter, Document, WithId } from "mongodb";
import type { InvoiceStatus } from '@unisane/kernel';
import type { InvoicesRepo } from "../domain/ports/invoices";
import type { InvoiceListPage, InvoiceView } from "../domain/types";
import { seekPageMongoCollection } from '@unisane/kernel';
import { clampInt } from "@unisane/kernel";

type InvoiceDoc = {
  _id: unknown;
  tenantId: string;
  provider?: string | null;
  providerInvoiceId?: string | null;
  amount?: number | null;
  currency?: string | null;
  status?: InvoiceStatus | null;
  issuedAt?: Date | null;
  dueAt?: Date | null;
  url?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
} & Document;

const invoicesCol = (): Collection<InvoiceDoc> => col<InvoiceDoc>("invoices");

export const mongoInvoicesRepo: InvoicesRepo = {
  async listPage(args: { tenantId: string; cursor?: string; limit: number }): Promise<InvoiceListPage> {
    // Explicitly include _id and sort keys in projection for seek pagination stability
    const projection: Record<string, 0 | 1> = { _id: 1, amount: 1, currency: 1, status: 1, issuedAt: 1, url: 1 };
    const baseFilter: Filter<InvoiceDoc> = { tenantId: args.tenantId };
    const sortVec = [{ key: "issuedAt", order: -1 as const }, { key: "_id", order: -1 as const }];
    const { items, nextCursor, prevCursor } = await seekPageMongoCollection<InvoiceDoc, InvoiceView>({
      collection: invoicesCol(),
      baseFilter,
      limit: clampInt(args.limit, 1, 500),
      cursor: args.cursor ?? null,
      sortVec,
      projection,
      map: (r: WithId<InvoiceDoc>) => ({
        id: String(r._id),
        amount: (r.amount as number),
        currency: (r.currency as string),
        status: r.status as InvoiceStatus,
        issuedAt: r.issuedAt ?? null,
        url: r.url ?? null,
      }),
    });
    return { items, ...(nextCursor ? { nextCursor } : {}), ...(prevCursor ? { prevCursor } : {}) } as InvoiceListPage;
  },
  async countOpenByTenantIds(tenantIds: string[]): Promise<Map<string, number>> {
    if (!tenantIds?.length) return new Map<string, number>();
    const rows = (await invoicesCol()
      .aggregate([
        { $match: { tenantId: { $in: tenantIds }, status: "open" } },
        { $group: { _id: "$tenantId", invoicesOpenCount: { $sum: 1 } } },
      ])
      .toArray()) as Array<{ _id: string; invoicesOpenCount: number }>;
    const m = new Map<string, number>();
    for (const r of rows) m.set(String(r._id), r.invoicesOpenCount ?? 0);
    return m;
  },
  async upsertByProviderId(args: { tenantId: string; provider: string; providerInvoiceId: string; amount: number; currency: string; status: InvoiceStatus; issuedAt?: Date | null; url?: string | null }): Promise<void> {
    const now = new Date();
    await invoicesCol().updateOne(
      { tenantId: args.tenantId, provider: args.provider, providerInvoiceId: args.providerInvoiceId },
      { $set: { amount: args.amount, currency: args.currency, status: args.status, issuedAt: args.issuedAt ?? new Date(), url: args.url ?? null, updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );
  },
};
