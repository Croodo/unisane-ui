/**
 * @module @unisane/credits
 * @description Credit balance management with ledger tracking
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

export { InsufficientCreditsError, NegativeCreditsError, CreditLedgerError } from './domain/errors';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Constants
// ════════════════════════════════════════════════════════════════════════════

export { CREDITS_EVENTS, CREDITS_DEFAULTS, CREDITS_COLLECTIONS } from './domain/constants';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Cache Keys
// ════════════════════════════════════════════════════════════════════════════

export { creditsKeys } from './domain/keys';
export type { CreditsKeyBuilder } from './domain/keys';

// ════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════

export * from './service/grant';
export * from './service/consume';
export * from './service/balance';
export * from './service/ledger';

// ════════════════════════════════════════════════════════════════════════════
// Services - Admin
// ════════════════════════════════════════════════════════════════════════════

export { getScopeCreditBalances } from './service/admin/stats';

// ════════════════════════════════════════════════════════════════════════════
// Event Handlers (for event-driven decoupling)
// ════════════════════════════════════════════════════════════════════════════

export { registerCreditEventHandlers } from './event-handlers';

// ════════════════════════════════════════════════════════════════════════════
// Port Adapter (for hexagonal architecture)
// ════════════════════════════════════════════════════════════════════════════

export { creditsAdapter } from './adapter';
