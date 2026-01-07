import type { z } from "zod";
import type { NotificationCategory } from "@unisane/kernel";

export type InappNotificationView = {
  id: string;
  category?: string | null;
  title: string;
  body: string;
  data?: unknown;
  createdAt?: Date;
};

export type InappReceiptView = {
  notificationId: string;
  readAt?: Date | null;
  seenAt?: Date | null;
};

export type SendEmailInput = {
  tenantId?: string | null;
  to: { email: string; name?: string };
  template: string;
  props?: Record<string, unknown>;
  headers?: Record<string, string>;
  /**
   * Category for preference checking.
   * If provided and user has opted out of this category, email is dropped.
   * System emails (password reset, verification) should NOT set category.
   */
  category?: NotificationCategory | null;
  /**
   * userId for preference lookup.
   * Required if category is set and you want to respect user preferences.
   */
  userId?: string | null;
};

export type EnqueueEmailArgs = {
  tenantId: string;
  body: z.infer<
    typeof import("./schemas").ZEmailEnqueue
  >;
};

// Note: Service-level types like ListInappArgs, MarkReadArgs, SendInappArgs,
// DeleteNotificationArgs are defined in their respective service files

export type GetPrefsArgs = Record<string, never>;

export type SetPrefsArgs = {
  categories: Record<string, boolean>;
};

export type SendEmailResult =
  | { sent: true }
  | { sent: false; reason: "suppressed" | "opted_out" | "no_provider" };
