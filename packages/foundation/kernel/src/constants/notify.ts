import { z } from "zod";

/**
 * Email/notification categories.
 * Used for preference management and unsubscribe functionality.
 */
export const NOTIFICATION_CATEGORIES = [
  "system",           // Auth, password reset, security - CANNOT opt out
  "transactional",    // Receipts, invoices - CANNOT opt out
  "billing",          // Payment issues, subscription changes - CANNOT opt out
  "alerts",           // Security alerts, important notices - CANNOT opt out
  "product_updates",  // Feature announcements, tips - CAN opt out
  "marketing",        // Promotions, newsletters - CAN opt out
  "digest",           // Weekly summaries, activity reports - CAN opt out
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];
export const ZNotificationCategory = z.enum(NOTIFICATION_CATEGORIES);

/**
 * Categories that users CAN opt out of.
 * System, transactional, billing, and security alerts cannot be opted out.
 */
export const OPT_OUT_ALLOWED_CATEGORIES: NotificationCategory[] = [
  "product_updates",
  "marketing",
  "digest",
];

/**
 * Check if a category can be opted out of.
 */
export function canOptOutOfCategory(category: NotificationCategory): boolean {
  return OPT_OUT_ALLOWED_CATEGORIES.includes(category);
}

export const INAPP_EVENT_TYPES = ["inapp.notify", "ping"] as const; // SSE channel events
export type InappEventType = (typeof INAPP_EVENT_TYPES)[number];
export const ZInappEventType = z.enum(INAPP_EVENT_TYPES);
