/**
 * Analytics Domain Constants
 */

export const ANALYTICS_EVENTS = {
  EVENT_TRACKED: 'analytics.event.tracked',
  QUERY_EXECUTED: 'analytics.query.executed',
} as const;

export const ANALYTICS_DEFAULTS = {
  DEFAULT_PERIOD: '7d',
  MAX_QUERY_RANGE_DAYS: 90,
  CACHE_TTL_MS: 300_000,
} as const;

export const ANALYTICS_COLLECTIONS = {
  EVENTS: 'analytics_events',
  AGGREGATIONS: 'analytics_aggregations',
} as const;
