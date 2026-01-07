/**
 * Usage Domain Constants
 */

export const USAGE_EVENTS = {
  INCREMENTED: 'usage.incremented',
  LIMIT_REACHED: 'usage.limit.reached',
  WINDOW_RESET: 'usage.window.reset',
} as const;

export const USAGE_WINDOWS = {
  MINUTE: 'minute',
  HOUR: 'hour',
  DAY: 'day',
  MONTH: 'month',
} as const;

export type UsageWindow = (typeof USAGE_WINDOWS)[keyof typeof USAGE_WINDOWS];

export const USAGE_DEFAULTS = {
  DEFAULT_WINDOW: 'month' as UsageWindow,
} as const;

export const USAGE_COLLECTIONS = {
  METRICS: 'usage_metrics',
} as const;
