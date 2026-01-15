/**
 * @module @unisane/webhooks
 * @description Webhook delivery with retries and event logging
 * @layer 4
 */

// ════════════════════════════════════════════════════════════════════════════
// Domain - Schemas & Types
// ════════════════════════════════════════════════════════════════════════════

export * from './domain/schemas';
export * from './domain/types';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Errors
// ════════════════════════════════════════════════════════════════════════════

export {
  WebhookNotFoundError,
  WebhookDeliveryError,
  WebhookSignatureError,
  WebhookLimitExceededError,
} from './domain/errors';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Constants
// ════════════════════════════════════════════════════════════════════════════

export { WEBHOOKS_EVENTS, WEBHOOKS_DEFAULTS, WEBHOOKS_COLLECTIONS } from './domain/constants';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Cache Keys
// ════════════════════════════════════════════════════════════════════════════

export { webhooksKeys } from './domain/keys';
export type { WebhooksKeyBuilder } from './domain/keys';

// ════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════

export * from './service/listEvents';
export * from './service/recordInbound';
export * from './service/recordOutbound';
export * from './service/replay';

// ════════════════════════════════════════════════════════════════════════════
// Services - Admin
// ════════════════════════════════════════════════════════════════════════════

export { getScopeFailureCounts } from './service/admin/stats';
