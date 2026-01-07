/**
 * Notify Cache Keys
 */

export const notifyKeys = {
  notification: (notificationId: string) => `notify:${notificationId}` as const,
  userNotifications: (userId: string) => `notify:user:${userId}` as const,
  template: (templateId: string) => `notify:template:${templateId}` as const,
} as const;

export type NotifyKeyBuilder = typeof notifyKeys;
