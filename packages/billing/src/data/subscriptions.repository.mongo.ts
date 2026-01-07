import { col } from "@unisane/kernel";
import type { Collection, Document } from "mongodb";
import type { SubscriptionsRepo } from "../domain/ports";
import type { SubscriptionView } from "../domain/types";
import type { SubscriptionStatus } from '@unisane/kernel';
import type { BillingProvider } from '@unisane/kernel';
import type { LatestSub } from "@unisane/tenants";
import { clampInt } from "@unisane/kernel";

type SubscriptionDoc = {
  _id: unknown;
  tenantId: string;
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

const subsCol = (): Collection<SubscriptionDoc> => col<SubscriptionDoc>("subscriptions");

export const mongoSubscriptionsRepo: SubscriptionsRepo = {
  async getLatest(tenantId: string): Promise<SubscriptionView | null> {
    const doc = await subsCol()
      .find({ tenantId })
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
  async getLatestByTenantIds(tenantIds: string[]) {
    if (!tenantIds?.length) return new Map<string, LatestSub>();
    const rows = (await subsCol()
      .aggregate([
        { $match: { tenantId: { $in: tenantIds } } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$tenantId",
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
  async getLatestProviderSubId(tenantId: string): Promise<string | null> {
    const doc = await subsCol()
      .find({ tenantId })
      .project({ providerSubId: 1 })
      .sort({ createdAt: -1 })
      .limit(1)
      .next();
    return (doc?.providerSubId && String(doc.providerSubId)) || null;
  },
  async setCancelAtPeriodEnd(tenantId: string): Promise<void> {
    const latest = await subsCol().find({ tenantId }).project({ _id: 1 }).sort({ createdAt: -1 }).limit(1).next();
    if (!latest) return;
    await subsCol().updateOne({ _id: latest._id }, { $set: { cancelAtPeriodEnd: true, updatedAt: new Date() } });
  },
  async setCanceledImmediate(tenantId: string): Promise<void> {
    const latest = await subsCol().find({ tenantId }).project({ _id: 1 }).sort({ createdAt: -1 }).limit(1).next();
    if (!latest) return;
    await subsCol().updateOne(
      { _id: latest._id },
      { $set: { status: "canceled", cancelAtPeriodEnd: false, currentPeriodEnd: new Date(), updatedAt: new Date() } }
    );
  },
  async setQuantity(tenantId: string, quantity: number): Promise<void> {
    const latest = await subsCol().find({ tenantId }).project({ _id: 1 }).sort({ createdAt: -1 }).limit(1).next();
    if (!latest) return;
    await subsCol().updateOne({ _id: latest._id }, { $set: { quantity, updatedAt: new Date() } });
  },
  async upsertByProviderId(args: {
    tenantId: string;
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
    await subsCol().updateOne(
      { tenantId: args.tenantId, provider: args.provider, providerSubId: args.providerSubId },
      {
        $set: {
          planId: args.planId,
          quantity: args.quantity,
          status: args.status,
          ...(args.providerStatus !== undefined ? { providerStatus: args.providerStatus } : {}),
          cancelAtPeriodEnd: args.cancelAtPeriodEnd ?? false,
          currentPeriodEnd: args.currentPeriodEnd ?? null,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );
  },
  async listByProviderId(provider: BillingProvider): Promise<Array<{ tenantId: string; providerSubId: string }>> {
    const rows = await subsCol()
      .find({ provider, providerSubId: { $ne: null } })
      .project({ tenantId: 1, providerSubId: 1 })
      .toArray();
    return rows
      .map((r) => ({ tenantId: String(r.tenantId ?? ""), providerSubId: String(r.providerSubId ?? "") }))
      .filter((r) => r.tenantId && r.providerSubId);
  },
  async listByStatusAged(statuses: SubscriptionStatus[], updatedBefore: Date, limit: number) {
    const docs = await subsCol()
      .find({ status: { $in: statuses }, updatedAt: { $lte: updatedBefore } })
      .project({ tenantId: 1, providerSubId: 1, status: 1, updatedAt: 1 })
      .sort({ updatedAt: 1 })
      .limit(clampInt(limit, 1, 200))
      .toArray();
    return docs.map((d) => ({
      tenantId: String(d.tenantId ?? ""),
      providerSubId: d.providerSubId ? String(d.providerSubId) : null,
      status: (d.status as SubscriptionStatus | null | undefined) ?? null,
      updatedAt: d.updatedAt ?? null,
    }));
  },
};
