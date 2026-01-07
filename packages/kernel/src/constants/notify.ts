import { z } from "zod";

export const NOTIFICATION_CATEGORIES = [
  "billing",
  "alerts",
  "product_updates",
  "system",
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];
export const ZNotificationCategory = z.enum(NOTIFICATION_CATEGORIES);

export const INAPP_EVENT_TYPES = ["inapp.notify", "ping"] as const; // SSE channel events
export type InappEventType = (typeof INAPP_EVENT_TYPES)[number];
export const ZInappEventType = z.enum(INAPP_EVENT_TYPES);
