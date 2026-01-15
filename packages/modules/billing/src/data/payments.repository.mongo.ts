import {
  col,
  COLLECTIONS,
  seekPageMongoCollection,
  type Collection,
  type Filter,
  type FindCursor,
  type Document,
  type WithId,
  type PaymentStatus,
  type BillingProvider,
} from "@unisane/kernel";
import type { PaymentsRepo } from "../domain/ports/payments";
import type { PaymentListPage, PaymentView, PaymentDetail } from "../domain/types";

type PaymentDoc = {
  _id: unknown;
  scopeId: string;
  providerPaymentId?: string | null;
  provider?: BillingProvider | null;
  amount?: number | null;
  currency?: string | null;
  status?: PaymentStatus | null;
  capturedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
} & Document;

const paymentsCol = (): Collection<PaymentDoc> => col<PaymentDoc>(COLLECTIONS.PAYMENTS);

export const mongoPaymentsRepo: PaymentsRepo = {
  async listPage(args: {
    scopeId: string;
    cursor?: string;
    limit: number;
  }): Promise<PaymentListPage> {
    const sortVec = [{ key: "capturedAt", order: -1 as const }, { key: "_id", order: -1 as const }];
    const { items, nextCursor, prevCursor } = await seekPageMongoCollection<PaymentDoc, PaymentView>({
      collection: paymentsCol(),
      baseFilter: { scopeId: args.scopeId },
      limit: args.limit,
      cursor: args.cursor ?? null,
      sortVec,
      projection: { _id: 1, amount: 1, currency: 1, status: 1, capturedAt: 1 },
      map: (r: WithId<PaymentDoc>) => ({
        id: String(r._id),
        amount: (r.amount as number | null | undefined) ?? 0,
        currency: (r.currency as string | null | undefined) ?? 'USD',
        status: (r.status as PaymentStatus | null | undefined) ?? 'processing',
        capturedAt: r.capturedAt ?? null,
      }),
    });
    return {
      items,
      ...(nextCursor ? { nextCursor } : {}),
      ...(prevCursor ? { prevCursor } : {}),
    } as PaymentListPage;
  },
  async findByProviderPaymentId(args: {
    scopeId: string;
    providerPaymentId: string;
  }): Promise<PaymentDetail | null> {
    const p = await paymentsCol().findOne({ scopeId: args.scopeId, providerPaymentId: args.providerPaymentId });
    if (!p) return null;
    return {
      id: String(p._id),
      amount: (p.amount as number | null | undefined) ?? 0,
      currency: (p.currency as string | null | undefined) ?? 'USD',
      status: (p.status as PaymentStatus | null | undefined) ?? 'processing',
      capturedAt: (p.capturedAt as Date | undefined) ?? null,
      provider: (p.provider as BillingProvider | null | undefined) ?? "stripe",
      providerPaymentId: (p.providerPaymentId as string | null | undefined) ?? args.providerPaymentId,
    };
  },
  async markRefunded(id: string): Promise<void> {
    const filter = { _id: id as unknown } as Filter<PaymentDoc>;
    await paymentsCol().updateOne(filter, { $set: { status: "refunded", updatedAt: new Date() } });
  },
  async upsertByProviderId(args: {
    scopeId: string;
    provider: BillingProvider;
    providerPaymentId: string;
    amount?: number;
    currency?: string;
    status: PaymentStatus;
    capturedAt?: Date | null;
  }): Promise<void> {
    const set: Record<string, unknown> = { status: args.status };
    if (typeof args.amount !== "undefined") set.amount = args.amount;
    if (typeof args.currency !== "undefined") set.currency = args.currency;
    set.capturedAt = args.capturedAt ?? new Date();
    const now = new Date();
    await paymentsCol().updateOne(
      {
        scopeId: args.scopeId,
        provider: args.provider,
        providerPaymentId: args.providerPaymentId,
      },
      { $set: { ...set, updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );
  },
  async listByProviderId(
    provider: BillingProvider
  ): Promise<Array<{ scopeId: string; providerPaymentId: string }>> {
    const cursor: FindCursor<Pick<PaymentDoc, 'scopeId' | 'providerPaymentId'>> = paymentsCol()
      .find({ provider, providerPaymentId: { $ne: null } }, { projection: { scopeId: 1, providerPaymentId: 1 } });
    const rows = await cursor.toArray();
    return rows
      .map((r) => ({
        scopeId: String(r.scopeId ?? ""),
        providerPaymentId: String(r.providerPaymentId ?? ""),
      }))
      .filter((r) => r.scopeId && r.providerPaymentId);
  },
};
