import type {
  InappNotificationView,
  InappReceiptView,
} from "./types";

export interface InappRepoPort {
  /** List notifications with cursor-based pagination */
  listInappPage(args: {
    scopeId: string;
    userId: string;
    limit: number;
    cursor?: string;
  }): Promise<{ items: InappNotificationView[]; nextCursor?: string }>;

  /** Get receipts for multiple notifications */
  listReceiptsMap(
    scopeId: string,
    userId: string,
    notificationIds: string[]
  ): Promise<Map<string, InappReceiptView>>;

  /** Mark notification as read */
  upsertRead(scopeId: string, userId: string, id: string): Promise<void>;

  /** Get latest notification ID for user */
  latestNotificationId(
    scopeId: string,
    userId: string
  ): Promise<string | null>;

  /** Mark all notifications up to cutoff as seen */
  upsertSeenUntil(
    scopeId: string,
    userId: string,
    cutoffId: string
  ): Promise<void>;

  /** Create a new in-app notification */
  createInapp(args: {
    scopeId: string;
    userId: string;
    category?: string | null;
    title: string;
    body: string;
    data?: unknown;
  }): Promise<{
    id: string;
    category: string | null;
    title: string;
    body: string;
  }>;

  /** Ensure receipt exists for notification */
  ensureReceipt(
    scopeId: string,
    userId: string,
    notificationId: string
  ): Promise<void>;

  /** Count unread notifications for user */
  countUnread(scopeId: string, userId: string): Promise<number>;

  /** Soft-delete a notification */
  softDeleteNotification(
    scopeId: string,
    userId: string,
    notificationId: string
  ): Promise<{ deleted: boolean }>;

  /** Soft-delete all notifications for user */
  softDeleteAllNotifications(
    scopeId: string,
    userId: string
  ): Promise<{ count: number }>;
}

export interface EmailSuppressionRepoPort {
  upsert(args: {
    email: string;
    reason: string;
    provider?: string | null;
    scopeId?: string | null;
  }): Promise<void>;
  isSuppressed(email: string, scopeId?: string | null): Promise<boolean>;
}
