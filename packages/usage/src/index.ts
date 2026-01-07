/**
 * @module @unisane/usage
 * @description Usage metering with time-windowed aggregation
 * @layer 3
 */

// ════════════════════════════════════════════════════════════════════════════
// Domain - Schemas & Types
// ════════════════════════════════════════════════════════════════════════════

export * from './domain/schemas';
export * from './domain/types';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Errors
// ════════════════════════════════════════════════════════════════════════════

export { UsageLimitExceededError, InvalidMetricError } from './domain/errors';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Constants
// ════════════════════════════════════════════════════════════════════════════

export { USAGE_EVENTS, USAGE_WINDOWS, USAGE_DEFAULTS, USAGE_COLLECTIONS } from './domain/constants';
export type { UsageWindow } from './domain/constants';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Cache Keys
// ════════════════════════════════════════════════════════════════════════════

export { usageKeys } from './domain/keys';
export type { UsageKeyBuilder } from './domain/keys';

// ════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════

export * from './service/increment';
export * from './service/getWindow';
