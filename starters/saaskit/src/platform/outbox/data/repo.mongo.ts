/* eslint-disable @typescript-eslint/no-explicit-any -- MongoDB repository uses any for document casting */
import { col } from "@unisane/kernel";
import { seekPageMongoCollection } from "@unisane/kernel";
import type {
  OutboxRepoPort,
  OutboxItem,
  OutboxDeadAdminRow,
  OutboxRow,
} from "@/src/platform/outbox/domain/ports";
import type { OutboxStatus, OutboxKind } from "@/src/shared/constants/outbox";
import type { Document } from "mongodb";
import { maybeObjectId } from "@unisane/kernel";
import { clampInt } from "@/src/shared/numbers/clamp";

type OutboxDoc = {
  _id?: unknown;
  tenantId?: string | null;
  kind: OutboxKind;
  payload: unknown;
  status: OutboxStatus;
  attempts: number;
  nextAttemptAt: Date;
  lastError?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

const outboxCol = () => col<OutboxDoc>("outbox");

export const OutboxRepoMongo: OutboxRepoPort = {
  async enqueue(item: OutboxItem): Promise<{ ok: true; id: string }> {
    const now = new Date();
    const doc: OutboxDoc = {
      ...(item.tenantId !== undefined ? { tenantId: item.tenantId } : {}),
      kind: item.kind,
      payload: item.payload,
      status: "queued",
      attempts: 0,
      nextAttemptAt: now,
      createdAt: now,
      updatedAt: now,
    };
    const r = await outboxCol().insertOne(doc as any);
    return { ok: true as const, id: String(r.insertedId) };
  },
  async claimBatch(now: Date, limit: number): Promise<OutboxRow[]> {
    const docs = await outboxCol()
      .find({ status: "queued", nextAttemptAt: { $lte: now } } as Document)
      .sort({ nextAttemptAt: 1 })
      .limit(limit)
      .toArray();
    const ids = docs.map((d) => d._id).filter(Boolean) as unknown[];
    if (ids.length)
      await outboxCol().updateMany(
        { _id: { $in: ids } } as Document,
        { $set: { status: "delivering" } } as Document
      );
    return docs.map((d) => ({
      _id: String(d._id),
      ...(d.tenantId !== undefined ? { tenantId: d.tenantId } : {}),
      kind: d.kind,
      payload: d.payload,
      status: d.status,
      ...(d.attempts !== undefined ? { attempts: d.attempts } : {}),
      ...(d.nextAttemptAt !== undefined ? { nextAttemptAt: d.nextAttemptAt } : {}),
    })) as unknown as OutboxRow[];
  },
  async markSuccess(id: string): Promise<void> {
    await outboxCol().updateOne(
      { _id: maybeObjectId(id) } as Document,
      {
        $set: { status: "delivered", lastError: null, updatedAt: new Date() },
      } as Document
    );
  },
  async markFailure(id: string, err: string, attempts: number): Promise<void> {
    const delaySec = Math.min(1800, Math.pow(2, attempts) * 30);
    const next = new Date(Date.now() + delaySec * 1000);
    const nextStatus: OutboxStatus = attempts >= 8 ? "dead" : "failed";
    await outboxCol().updateOne(
      { _id: maybeObjectId(id) } as Document,
      {
        $set: {
          status: nextStatus,
          lastError: err,
          nextAttemptAt: next,
          updatedAt: new Date(),
        },
        $inc: { attempts: 1 },
      } as Document
    );
  },
  async listDead(limit: number): Promise<Array<{ id: string }>> {
    const docs = await outboxCol()
      .find({ status: "dead" } as Document)
      .sort({ updatedAt: 1 })
      .limit(clampInt(limit, 1, 500))
      .project({ _id: 1 } as Document)
      .toArray();
    return docs.map((d) => ({
      id: String((d as { _id?: unknown })._id ?? ""),
    }));
  },
  async listDeadAdminPage(args: {
    limit: number;
    cursor?: string | null;
  }): Promise<{
    items: OutboxDeadAdminRow[];
    nextCursor?: string;
    prevCursor?: string;
  }> {
    const limit = clampInt(args.limit, 1, 50);
    const { items, nextCursor, prevCursor } = await seekPageMongoCollection<
      OutboxDoc,
      OutboxDeadAdminRow
    >({
      collection: outboxCol(),
      baseFilter: { status: "dead" },
      limit,
      cursor: args.cursor ?? null,
      sortVec: [
        { key: "updatedAt", order: -1 },
        { key: "_id", order: -1 },
      ],
      projection: {
        _id: 1,
        kind: 1,
        attempts: 1,
        lastError: 1,
        updatedAt: 1,
      },
      map: (d) => ({
        id: String(d._id),
        kind: String((d as unknown as { kind?: unknown }).kind ?? "unknown"),
        attempts: Number(
          (d as unknown as { attempts?: unknown }).attempts ?? 0
        ),
        lastError:
          (d as unknown as { lastError?: unknown }).lastError === undefined
            ? null
            : ((d as unknown as { lastError?: string | null }).lastError ?? null),
        updatedAt:
          (d as unknown as { updatedAt?: unknown }).updatedAt instanceof Date
            ? ((d as unknown as { updatedAt?: Date }).updatedAt ?? null)
            : null,
      }),
    });
    return {
      items,
      ...(nextCursor ? { nextCursor } : {}),
      ...(prevCursor ? { prevCursor } : {}),
    };
  },
  async requeue(ids: string[], now: Date): Promise<void> {
    if (!ids.length) return;
    const objIds = ids.map(maybeObjectId);
    await outboxCol().updateMany(
      { _id: { $in: objIds } } as Document,
      {
        $set: {
          status: "queued",
          nextAttemptAt: now,
          lastError: null,
          updatedAt: new Date(),
        },
      } as Document
    );
  },
  async countDead(): Promise<number> {
    return outboxCol().countDocuments({ status: "dead" } as Document);
  },
  async purge(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const objIds = ids.map(maybeObjectId);
    await outboxCol().deleteMany({
      _id: { $in: objIds } as any,
      status: "dead",
    } as Document);
  },
};
