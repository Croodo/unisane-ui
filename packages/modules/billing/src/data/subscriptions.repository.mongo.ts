import {
  col,
  COLLECTIONS,
  clampInt,
  UpdateBuilder,
  toMongoUpdate,
  type Collection,
  type Document,
  type SubscriptionStatus,
  type BillingProvider,
} from "@unisane/kernel";
import type { SubscriptionsRepo, LatestSub } from "../domain/ports";
import type { SubscriptionView } from "../domain/types";

type SubscriptionDoc = {
  _id: unknown;
  scopeId: string;
  provider?: BillingProvider | null;
  providerSubId?: string | null;
  planId?: string | null;
  quantity?: number | null;
  status?: SubscriptionStatus | null;
  providerStatus?: string | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean | null;
  createdAt?: Date;
  updatedAt?: Date;
} & Document;

const subsCol = (): Collection<SubscriptionDoc> => col<SubscriptionDoc>(COLLECTIONS.SUBSCRIPTIONS);

export const mongoSubscriptionsRepo: SubscriptionsRepo = {
  async findLatest(scopeId: string): Promise<SubscriptionView | null> {
    const doc = await subsCol()
      .find({ scopeId })
      .project({ planId: 1, quantity: 1, status: 1, cancelAtPeriodEnd: 1, currentPeriodEnd: 1 })
      .sort({ createdAt: -1 })
      .limit(1)
      .next();
    if (!doc) return null;
    return {
      id: String(doc._id),
      planId: (doc.planId as string | null | undefined) ?? 'unknown',
      quantity: (doc.quantity as number | undefined) ?? 0,
      status: (doc.status as SubscriptionStatus | null | undefined) ?? 'active',
      cancelAtPeriodEnd: Boolean(doc.cancelAtPeriodEnd),
      currentPeriodEnd: (doc.currentPeriodEnd as Date | null | undefined) ?? null,
    };
  },
  async findLatestByScopeIds(scopeIds: string[]) {
    if (!scopeIds?.length) return new Map<string, LatestSub>();
    const rows = (await subsCol()
      .aggregate([
        { $match: { scopeId: { $in: scopeIds } } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$scopeId",
            planId: { $first: "$planId" },
            status: { $first: "$status" },
            quantity: { $first: "$quantity" },
            currentPeriodEnd: { $first: "$currentPeriodEnd" },
          },
        },
      ])
      .toArray()) as Array<{ _id: string; planId?: string | null; status?: string | null; quantity?: number | null; currentPeriodEnd?: Date | null }>;
    const m = new Map<string, LatestSub>();
    for (const r of rows) {
      m.set(String(r._id), {
        planId: (r.planId as string | null | undefined) ?? null,
        status: (r.status as string | null | undefined) ?? null,
        quantity: (r.quantity as number | null | undefined) ?? null,
        currentPeriodEnd: (r.currentPeriodEnd as Date | null | undefined) ?? null,
      });
    }
    return m;
  },
  async findLatestProviderSubId(scopeId: string): Promise<string | null> {
    const doc = await subsCol()
      .find({ scopeId })
      .project({ providerSubId: 1 })
      .sort({ createdAt: -1 })
      .limit(1)
      .next();
    return (doc?.providerSubId && String(doc.providerSubId)) || null;
  },
  /**
   * BILL-002 FIX: Use atomic findOneAndUpdate to avoid TOCTOU race condition.
   * Previously did find-then-update which could race if multiple requests
   * tried to cancel the same subscription simultaneously.
   */
  async markCancelAtPeriodEnd(scopeId: string): Promise<void> {
    const builder = new UpdateBuilder<SubscriptionDoc>()
      .set("cancelAtPeriodEnd", true)
      .set("updatedAt", new Date());

    // BILL-002 FIX: Atomic operation - find latest and update in one step
    // Using aggregation pipeline with $sort to get latest, then update
    await subsCol().findOneAndUpdate(
      { scopeId },
      toMongoUpdate(builder.build()) as Document,
      { sort: { createdAt: -1 } }
    );
  },
  /**
   * BILL-002 FIX: Use atomic findOneAndUpdate to avoid TOCTOU race condition.
   */
  async cancelImmediately(scopeId: string): Promise<void> {
    const now = new Date();
    const builder = new UpdateBuilder<SubscriptionDoc>()
      .set("status", "canceled")
      .set("cancelAtPeriodEnd", false)
      .set("currentPeriodEnd", now)
      .set("updatedAt", now);

    // BILL-002 FIX: Atomic operation
    await subsCol().findOneAndUpdate(
      { scopeId },
      toMongoUpdate(builder.build()) as Document,
      { sort: { createdAt: -1 } }
    );
  },
  /**
   * BILL-002 FIX: Use atomic findOneAndUpdate to avoid TOCTOU race condition.
   */
  async updateQuantity(scopeId: string, quantity: number): Promise<void> {
    const builder = new UpdateBuilder<SubscriptionDoc>()
      .set("quantity", quantity)
      .set("updatedAt", new Date());

    // BILL-002 FIX: Atomic operation
    await subsCol().findOneAndUpdate(
      { scopeId },
      toMongoUpdate(builder.build()) as Document,
      { sort: { createdAt: -1 } }
    );
  },
  async upsertByProviderId(args: {
    scopeId: string;
    provider: BillingProvider;
    providerSubId: string;
    planId: string;
    quantity: number;
    status: SubscriptionStatus;
    providerStatus?: string | null;
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: Date | null;
  }): Promise<void> {
    const now = new Date();
    const builder = new UpdateBuilder<SubscriptionDoc>()
      .set("planId", args.planId)
      .set("quantity", args.quantity)
      .set("status", args.status)
      .set("cancelAtPeriodEnd", args.cancelAtPeriodEnd ?? false)
      .set("currentPeriodEnd", args.currentPeriodEnd ?? null)
      .set("updatedAt", now)
      .setOnInsert("createdAt", now);
    if (args.providerStatus !== undefined) {
      builder.set("providerStatus", args.providerStatus);
    }
    await subsCol().updateOne(
      { scopeId: args.scopeId, provider: args.provider, providerSubId: args.providerSubId },
      toMongoUpdate(builder.build()) as Document,
      { upsert: true }
    );
  },
  async listByProviderId(provider: BillingProvider): Promise<Array<{ scopeId: string; providerSubId: string }>> {
    const rows = await subsCol()
      .find({ provider, providerSubId: { $ne: null } })
      .project({ scopeId: 1, providerSubId: 1 })
      .toArray();
    return rows
      .map((r) => ({ scopeId: String(r.scopeId ?? ""), providerSubId: String(r.providerSubId ?? "") }))
      .filter((r) => r.scopeId && r.providerSubId);
  },
  async listByStatusAged(statuses: SubscriptionStatus[], updatedBefore: Date, limit: number) {
    const docs = await subsCol()
      .find({ status: { $in: statuses }, updatedAt: { $lte: updatedBefore } })
      .project({ scopeId: 1, providerSubId: 1, status: 1, updatedAt: 1 })
      .sort({ updatedAt: 1 })
      .limit(clampInt(limit, 1, 200))
      .toArray();
    return docs.map((d) => ({
      scopeId: String(d.scopeId ?? ""),
      providerSubId: d.providerSubId ? String(d.providerSubId) : null,
      status: (d.status as SubscriptionStatus | null | undefined) ?? null,
      updatedAt: d.updatedAt ?? null,
    }));
  },
};
