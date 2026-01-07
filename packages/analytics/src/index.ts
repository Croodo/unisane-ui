/**
 * @module @unisane/analytics
 * @description Platform analytics and metrics dashboard
 * @layer 4
 */

// ════════════════════════════════════════════════════════════════════════════
// Domain - Schemas
// ════════════════════════════════════════════════════════════════════════════

export { ZAnalyticsDashboard, ZMetric, ZSparklinePoint } from './domain/schemas';
export type { AnalyticsDashboard } from './domain/schemas';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Errors
// ════════════════════════════════════════════════════════════════════════════

export { AnalyticsQueryError, MetricNotFoundError } from './domain/errors';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Constants
// ════════════════════════════════════════════════════════════════════════════

export { ANALYTICS_EVENTS, ANALYTICS_DEFAULTS, ANALYTICS_COLLECTIONS } from './domain/constants';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Cache Keys
// ════════════════════════════════════════════════════════════════════════════

export { analyticsKeys } from './domain/keys';
export type { AnalyticsKeyBuilder } from './domain/keys';

// ════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════

export { getAdminAnalyticsDashboard } from "./service/dashboard";
