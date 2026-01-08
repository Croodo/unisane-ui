import type {
  InappNotificationView,
  InappReceiptView,
} from "../domain/types";
import { NotificationsRepository } from "../data/notifications.repository";
import { getTenantId, getUserId, redis, events } from "@unisane/kernel";
import { KV } from "@unisane/kernel";
import { NOTIFY_EVENTS } from "../domain/constants";

// ════════════════════════════════════════════════════════════════════════════
// LIST
// ════════════════════════════════════════════════════════════════════════════

export type ListInappArgs = {
  cursor?: string;
  limit: number;
};

export async function listInapp(args: ListInappArgs) {
  const tenantId = getTenantId();
  const userId = getUserId();
  const { items: rows, nextCursor } = (await NotificationsRepository.listInappPage({
    tenantId,
    userId,
    cursor: args.cursor,
    limit: args.limit,
  })) as {
    items: InappNotificationView[];
    nextCursor?: string;
  };
  const ids = rows.map((r) => r.id);
  const receiptMap = (await NotificationsRepository.listReceiptsMap(
    tenantId,
    userId,
    ids
  )) as Map<string, InappReceiptView>;

  const items = rows.map((n) => ({
    id: n.id,
    category: n.category ?? "system",
    title: n.title,
    body: n.body,
    data: n.data ?? null,
    createdAt: n.createdAt,
    readAt: receiptMap.get(n.id)?.readAt ?? null,
    seenAt: receiptMap.get(n.id)?.seenAt ?? null,
  }));

  return { items, ...(nextCursor ? { nextCursor } : {}) } as const;
}

// ════════════════════════════════════════════════════════════════════════════
// UNREAD COUNT
// ════════════════════════════════════════════════════════════════════════════

export async function getUnreadCount() {
  const tenantId = getTenantId();
  const userId = getUserId();
  const count = await NotificationsRepository.countUnread(tenantId, userId);
  return { count } as const;
}

// ════════════════════════════════════════════════════════════════════════════
// MARK READ
// ════════════════════════════════════════════════════════════════════════════

export type MarkReadArgs = {
  id: string;
};

export async function markRead(args: MarkReadArgs) {
  const tenantId = getTenantId();
  const userId = getUserId();
  await NotificationsRepository.upsertRead(tenantId, userId, args.id);
  await events.emit(NOTIFY_EVENTS.READ, {
    tenantId,
    userId,
    notificationId: args.id,
  });
  return { ok: true as const };
}

// ════════════════════════════════════════════════════════════════════════════
// MARK ALL SEEN
// ════════════════════════════════════════════════════════════════════════════

export async function markAllSeen() {
  const tenantId = getTenantId();
  const userId = getUserId();
  const cutoffId = await NotificationsRepository.latestNotificationId(tenantId, userId);
  if (!cutoffId) return { ok: true as const };
  await NotificationsRepository.upsertSeenUntil(tenantId, userId, cutoffId);
  return { ok: true as const };
}

// ════════════════════════════════════════════════════════════════════════════
// SEND IN-APP
// ════════════════════════════════════════════════════════════════════════════

export type SendInappArgs = {
  targetUserId: string;
  title: string;
  body: string;
  category?: string | null;
  data?: unknown;
};

export async function sendInapp(args: SendInappArgs) {
  const tenantId = getTenantId();
  const created = await NotificationsRepository.createInapp({
    tenantId,
    userId: args.targetUserId,
    title: args.title,
    body: args.body,
    ...(args.category ? { category: args.category } : {}),
    ...(args.data !== undefined ? { data: args.data } : {}),
  });

  await NotificationsRepository.ensureReceipt(tenantId, args.targetUserId, created.id);

  try {
    const channel = `${KV.INAPP}${tenantId}:${args.targetUserId}`;
    const payload = JSON.stringify({
      id: created.id,
      title: created.title,
      category: created.category ?? "system",
    });
    await redis.publish(channel, payload);
  } catch (err) {
    console.warn("[notify/inapp] Redis publish failed:", err);
  }

  await events.emit(NOTIFY_EVENTS.SENT, {
    tenantId,
    userId: args.targetUserId,
    notificationId: created.id,
    channel: "in_app",
  });

  return { id: created.id } as const;
}

// ════════════════════════════════════════════════════════════════════════════
// DELETE
// ════════════════════════════════════════════════════════════════════════════

export type DeleteNotificationArgs = {
  id: string;
};

export async function deleteNotification(args: DeleteNotificationArgs) {
  const tenantId = getTenantId();
  const userId = getUserId();
  const result = await NotificationsRepository.deleteNotification(tenantId, userId, args.id);
  return result;
}

export async function deleteAllNotifications() {
  const tenantId = getTenantId();
  const userId = getUserId();
  const result = await NotificationsRepository.deleteAllNotifications(tenantId, userId);
  return result;
}
