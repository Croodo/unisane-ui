/**
 * Analytics Cache Keys
 */

export const analyticsKeys = {
  query: (hash: string) => `analytics:query:${hash}` as const,
  aggregation: (tenantId: string, metric: string, period: string) =>
    `analytics:agg:${tenantId}:${metric}:${period}` as const,
} as const;

export type AnalyticsKeyBuilder = typeof analyticsKeys;
