import {
  col,
  COLLECTIONS,
  seekPageMongoCollection,
  softDeleteFilter,
  type Document,
  type Filter,
  type WithId,
} from "@unisane/kernel";
import type { InappRepoPort } from "../domain/ports";
import type {
  InappNotificationView,
  InappReceiptView,
} from "../domain/types";

type InappNotificationDoc = {
  scopeId: string;
  userId: string;
  category?: string | null;
  title: string;
  body: string;
  data?: unknown;
  deletedAt?: Date | null;
  createdAt?: Date;
};

type InappReceiptDoc = {
  _id?: unknown;
  scopeId: string;
  userId: string;
  notificationId: string;
  readAt?: Date | null;
  seenAt?: Date | null;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

const notifCol = () => col<InappNotificationDoc>(COLLECTIONS.INAPP_NOTIFICATIONS);
const recCol = () => col<InappReceiptDoc>(COLLECTIONS.INAPP_RECEIPTS);

export const InappRepoMongo: InappRepoPort = {
  async listInappPage(args) {
    type Row = {
      _id: unknown;
      category?: string | null;
      title: string;
      body: string;
      data?: unknown;
      createdAt?: Date;
    };
    const sortVec = [
      { key: "createdAt", order: -1 as const },
      { key: "_id", order: -1 as const },
    ];
    const { items, nextCursor, prevCursor } = await seekPageMongoCollection<
      InappNotificationDoc,
      InappNotificationView
    >({
      collection: notifCol(),
      baseFilter: {
        scopeId: args.scopeId,
        userId: args.userId,
        ...softDeleteFilter(),
      } as Filter<InappNotificationDoc>,
      limit: args.limit,
      cursor: args.cursor ?? null,
      sortVec,
      projection: {
        _id: 1,
        category: 1,
        title: 1,
        body: 1,
        data: 1,
        createdAt: 1,
      },
      map: (n: WithId<InappNotificationDoc>) =>
        ({
          id: String(n._id),
          category: n.category ?? null,
          title: n.title,
          body: n.body,
          data: n.data,
          createdAt: n.createdAt,
        }) as InappNotificationView,
    });
    return {
      items,
      ...(nextCursor ? { nextCursor } : {}),
      ...(prevCursor ? { prevCursor } : {}),
    };
  },
  async listReceiptsMap(scopeId, userId, notificationIds) {
    if (!notificationIds.length) return new Map<string, InappReceiptView>();
    const receipts = (await recCol()
      .find({
        scopeId,
        userId,
        notificationId: { $in: notificationIds },
        ...softDeleteFilter(),
      } as Document)
      .toArray()) as unknown[];
    const out = new Map<string, InappReceiptView>();
    for (const r of receipts as Array<Partial<InappReceiptView>>) {
      const id =
        typeof r.notificationId === "string" ? r.notificationId : undefined;
      if (id) out.set(id, r as InappReceiptView);
    }
    return out;
  },
  async upsertRead(scopeId, userId, id) {
    await recCol().updateOne(
      { scopeId, userId, notificationId: id } as Document,
      {
        $set: { readAt: new Date(), seenAt: new Date(), updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      } as Document,
      { upsert: true }
    );
  },
  async latestNotificationId(scopeId, userId) {
    const latest = await notifCol()
      .find({
        scopeId,
        userId,
        ...softDeleteFilter(),
      } as Document)
      .sort({ _id: -1 })
      .limit(1)
      .toArray();
    return latest.length
      ? String((latest[0] as { _id?: unknown })._id ?? "")
      : null;
  },
  async upsertSeenUntil(scopeId, userId, cutoffId) {
    // Fetch all notification IDs in a single query
    const notifIds = await notifCol()
      .find({
        scopeId,
        userId,
        _id: { $lte: cutoffId },
        ...softDeleteFilter(),
      } as Document)
      .project({ _id: 1 })
      .toArray()
      .then((docs) => docs.map((d) => String(d._id)));

    if (notifIds.length === 0) return;

    // Bulk upsert all receipts in a single operation
    const now = new Date();
    const bulkOps = notifIds.map((notificationId) => ({
      updateOne: {
        filter: { scopeId, userId, notificationId },
        update: {
          $setOnInsert: { seenAt: now, createdAt: now },
        },
        upsert: true,
      },
    }));

    await recCol().bulkWrite(bulkOps, { ordered: false });
  },
  async createInapp(args) {
    const now = new Date();
    const n: InappNotificationDoc = {
      scopeId: args.scopeId,
      userId: args.userId,
      category: args.category ?? "system",
      title: args.title,
      body: args.body,
      ...(args.data !== undefined ? { data: args.data } : {}),
      createdAt: now,
    };
    const r = await notifCol().insertOne(n as InappNotificationDoc);
    return {
      id: String(r.insertedId ?? ""),
      category: n.category ?? null,
      title: n.title,
      body: n.body,
    };
  },
  async ensureReceipt(scopeId, userId, notificationId) {
    await recCol().updateOne(
      { scopeId, userId, notificationId } as Document,
      {
        $setOnInsert: {
          scopeId,
          userId,
          notificationId,
          createdAt: new Date(),
        },
      } as Document,
      { upsert: true }
    );
  },

  async countUnread(scopeId, userId) {
    // Get all notification IDs for user
    const notifs = await notifCol()
      .find({
        scopeId,
        userId,
        ...softDeleteFilter(),
      } as Document)
      .project({ _id: 1 })
      .toArray();

    if (!notifs.length) return 0;

    const notifIds = notifs.map((n) => String(n._id));

    // Get receipts where readAt is set
    const readReceipts = await recCol()
      .find({
        scopeId,
        userId,
        notificationId: { $in: notifIds },
        readAt: { $ne: null },
        ...softDeleteFilter(),
      } as Document)
      .project({ notificationId: 1 })
      .toArray();

    const readIds = new Set(readReceipts.map((r) => r.notificationId));
    const unreadCount = notifIds.filter((id) => !readIds.has(id)).length;
    return unreadCount;
  },

  async deleteNotification(scopeId, userId, notificationId) {
    // Soft delete - set deletedAt
    const result = await notifCol().updateOne(
      {
        _id: notificationId,
        scopeId,
        userId,
        ...softDeleteFilter(),
      } as Document,
      { $set: { deletedAt: new Date() } }
    );
    return { deleted: result.modifiedCount > 0 };
  },

  async deleteAllNotifications(scopeId, userId) {
    // Soft delete all - set deletedAt
    const result = await notifCol().updateMany(
      {
        scopeId,
        userId,
        ...softDeleteFilter(),
      } as Document,
      { $set: { deletedAt: new Date() } }
    );
    return { count: result.modifiedCount };
  },
};
