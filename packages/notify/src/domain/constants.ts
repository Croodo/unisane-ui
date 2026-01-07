/**
 * Notify Domain Constants
 */

export const NOTIFY_EVENTS = {
  SENT: 'notify.sent',
  DELIVERED: 'notify.delivered',
  FAILED: 'notify.failed',
  READ: 'notify.read',
  PREFS_UPDATED: 'notify.prefs.updated',
} as const;

export const NOTIFY_CHANNELS = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  IN_APP: 'in_app',
  SLACK: 'slack',
} as const;

export type NotifyChannel = (typeof NOTIFY_CHANNELS)[keyof typeof NOTIFY_CHANNELS];

export const NOTIFY_DEFAULTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 5000,
} as const;

export const NOTIFY_COLLECTIONS = {
  NOTIFICATIONS: 'notifications',
  TEMPLATES: 'notification_templates',
} as const;
