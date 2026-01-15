/**
 * @module @unisane/flags
 * @description Feature flags with tenant overrides and evaluation
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

export { FlagNotFoundError, FlagDisabledError, InvalidFlagValueError } from './domain/errors';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Constants
// ════════════════════════════════════════════════════════════════════════════

export { FLAGS_EVENTS, FLAGS_DEFAULTS, FLAGS_COLLECTIONS } from './domain/constants';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Cache Keys
// ════════════════════════════════════════════════════════════════════════════

export { flagsKeys } from './domain/keys';
export type { FlagsKeyBuilder } from './domain/keys';

// ════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════

export * from './service/get';
export * from './service/write';
export {
  setScopeOverride,
  clearScopeOverride,
  getScopeOverride,
  isEnabledForScope,
  type OverrideScopeType,
} from './service/overrides';
export * from './service/evaluate';

// ════════════════════════════════════════════════════════════════════════════
// Services - Admin
// ════════════════════════════════════════════════════════════════════════════

export { getScopeOverrideCounts } from './service/admin/stats';

// ════════════════════════════════════════════════════════════════════════════
// Data - Repository (for background jobs)
// ════════════════════════════════════════════════════════════════════════════

export { listExpiredOverridesForCleanup } from './data/overrides.repository';

// ════════════════════════════════════════════════════════════════════════════
// Adapters
// ════════════════════════════════════════════════════════════════════════════

export { flagsAdapter } from './adapters';
