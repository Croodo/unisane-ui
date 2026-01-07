import type { InappRepoPort } from "../domain/ports";
import { selectRepo } from "@unisane/kernel";
import { InappRepoMongo } from "./notifications.repository.mongo";
import type {
  InappNotificationView,
  InappReceiptView,
} from "../domain/types";

const repo = selectRepo<InappRepoPort>({ mongo: InappRepoMongo });

// ============================================================================
// READ
// ============================================================================

export async function listInappPage(args: {
  tenantId: string;
  userId: string;
  limit: number;
  cursor?: string;
}) {
  return repo.listInappPage(args) as unknown as {
    items: InappNotificationView[];
    nextCursor?: string;
  };
}

export async function listReceiptsMap(
  tenantId: string,
  userId: string,
  notificationIds: string[]
) {
  return repo.listReceiptsMap(
    tenantId,
    userId,
    notificationIds
  ) as unknown as Map<string, InappReceiptView>;
}

export async function latestNotificationId(tenantId: string, userId: string) {
  return repo.latestNotificationId(tenantId, userId);
}

export async function countUnread(tenantId: string, userId: string) {
  return repo.countUnread(tenantId, userId);
}

// ============================================================================
// WRITE
// ============================================================================

export async function upsertRead(tenantId: string, userId: string, id: string) {
  return repo.upsertRead(tenantId, userId, id);
}

export async function upsertSeenUntil(
  tenantId: string,
  userId: string,
  cutoffId: string
) {
  return repo.upsertSeenUntil(tenantId, userId, cutoffId);
}

export async function createInappNotification(args: {
  tenantId: string;
  userId: string;
  category?: string | null;
  title: string;
  body: string;
  data?: unknown;
}) {
  return repo.createInapp(args);
}

export async function ensureReceipt(
  tenantId: string,
  userId: string,
  notificationId: string
) {
  return repo.ensureReceipt(tenantId, userId, notificationId);
}

// ============================================================================
// DELETE
// ============================================================================

export async function deleteNotification(
  tenantId: string,
  userId: string,
  notificationId: string
) {
  return repo.deleteNotification(tenantId, userId, notificationId);
}

export async function deleteAllNotifications(tenantId: string, userId: string) {
  return repo.deleteAllNotifications(tenantId, userId);
}
