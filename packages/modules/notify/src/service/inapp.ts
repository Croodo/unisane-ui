import type {
  InappNotificationView,
  InappReceiptView,
} from "../domain/types";
import { NotificationsRepository } from "../data/notifications.repository";
import { getScopeId, getScopeUserId, redis, events, logger, metrics } from "@unisane/kernel";
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
  const scopeId = getScopeId();
  const userId = getScopeUserId();
  const { items: rows, nextCursor } = (await NotificationsRepository.listInappPage({
    scopeId,
    userId,
    cursor: args.cursor,
    limit: args.limit,
  })) as {
    items: InappNotificationView[];
    nextCursor?: string;
  };
  const ids = rows.map((r) => r.id);
  const receiptMap = (await NotificationsRepository.listReceiptsMap(
    scopeId,
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
  const scopeId = getScopeId();
  const userId = getScopeUserId();
  const count = await NotificationsRepository.countUnread(scopeId, userId);
  return { count } as const;
}

// ════════════════════════════════════════════════════════════════════════════
// MARK READ
// ════════════════════════════════════════════════════════════════════════════

export type MarkReadArgs = {
  id: string;
};

export async function markRead(args: MarkReadArgs) {
  const scopeId = getScopeId();
  const userId = getScopeUserId();
  await NotificationsRepository.upsertRead(scopeId, userId, args.id);
  await events.emit(NOTIFY_EVENTS.READ, {
    scopeId,
    userId,
    notificationId: args.id,
  });
  return { ok: true as const };
}

// ════════════════════════════════════════════════════════════════════════════
// MARK ALL SEEN
// ════════════════════════════════════════════════════════════════════════════

export async function markAllSeen() {
  const scopeId = getScopeId();
  const userId = getScopeUserId();
  const cutoffId = await NotificationsRepository.latestNotificationId(scopeId, userId);
  if (!cutoffId) return { ok: true as const };
  await NotificationsRepository.upsertSeenUntil(scopeId, userId, cutoffId);
  return { ok: true as const };
}

// ════════════════════════════════════════════════════════════════════════════
// SEND IN-APP
// ════════════════════════════════════════════════════════════════════════════

export type SendInappArgs = {
  targetScopeUserId: string;
  title: string;
  body: string;
  category?: string | null;
  data?: unknown;
};

export async function sendInapp(args: SendInappArgs) {
  const scopeId = getScopeId();
  const created = await NotificationsRepository.createInapp({
    scopeId,
    userId: args.targetScopeUserId,
    title: args.title,
    body: args.body,
    ...(args.category ? { category: args.category } : {}),
    ...(args.data !== undefined ? { data: args.data } : {}),
  });

  await NotificationsRepository.ensureReceipt(scopeId, args.targetScopeUserId, created.id);

  try {
    const channel = `${KV.INAPP}${scopeId}:${args.targetScopeUserId}`;
    const payload = JSON.stringify({
      id: created.id,
      title: created.title,
      category: created.category ?? "system",
    });
    await redis.publish(channel, payload);
  } catch (err) {
    logger.warn("notify/inapp: redis publish failed", { err });
    metrics.increment("notify.inapp.publish_failures");
  }

  await events.emit(NOTIFY_EVENTS.SENT, {
    scopeId,
    userId: args.targetScopeUserId,
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
  const scopeId = getScopeId();
  const userId = getScopeUserId();
  const result = await NotificationsRepository.deleteNotification(scopeId, userId, args.id);
  return result;
}

export async function deleteAllNotifications() {
  const scopeId = getScopeId();
  const userId = getScopeUserId();
  const result = await NotificationsRepository.deleteAllNotifications(scopeId, userId);
  return result;
}
