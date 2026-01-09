import type {
  InappNotificationView,
  InappReceiptView,
} from "./types";

export interface InappRepoPort {
  /** List notifications with cursor-based pagination */
  listInappPage(args: {
    tenantId: string;
    userId: string;
    limit: number;
    cursor?: string;
  }): Promise<{ items: InappNotificationView[]; nextCursor?: string }>;

  /** Get receipts for multiple notifications */
  listReceiptsMap(
    tenantId: string,
    userId: string,
    notificationIds: string[]
  ): Promise<Map<string, InappReceiptView>>;

  /** Mark notification as read */
  upsertRead(tenantId: string, userId: string, id: string): Promise<void>;

  /** Get latest notification ID for user */
  latestNotificationId(
    tenantId: string,
    userId: string
  ): Promise<string | null>;

  /** Mark all notifications up to cutoff as seen */
  upsertSeenUntil(
    tenantId: string,
    userId: string,
    cutoffId: string
  ): Promise<void>;

  /** Create a new in-app notification */
  createInapp(args: {
    tenantId: string;
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
    tenantId: string,
    userId: string,
    notificationId: string
  ): Promise<void>;

  /** Count unread notifications for user */
  countUnread(tenantId: string, userId: string): Promise<number>;

  /** Delete a notification */
  deleteNotification(
    tenantId: string,
    userId: string,
    notificationId: string
  ): Promise<{ deleted: boolean }>;

  /** Delete all notifications for user */
  deleteAllNotifications(
    tenantId: string,
    userId: string
  ): Promise<{ count: number }>;
}

export interface EmailSuppressionRepoPort {
  upsert(args: {
    email: string;
    reason: string;
    provider?: string | null;
    tenantId?: string | null;
  }): Promise<void>;
  isSuppressed(email: string, tenantId?: string | null): Promise<boolean>;
}
