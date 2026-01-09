/**
 * Webhooks Domain Constants
 */

export const WEBHOOKS_EVENTS = {
  CREATED: 'webhooks.created',
  UPDATED: 'webhooks.updated',
  DELETED: 'webhooks.deleted',
  DELIVERED: 'webhooks.delivered',
  FAILED: 'webhooks.failed',
  REPLAYED: 'webhooks.replayed',
} as const;

export const WEBHOOKS_DEFAULTS = {
  MAX_RETRIES: 3,
  RETRY_DELAYS_MS: [5000, 30000, 300000],
  TIMEOUT_MS: 30000,
  MAX_WEBHOOKS_PER_TENANT: 10,
} as const;

export const WEBHOOKS_COLLECTIONS = {
  WEBHOOKS: 'webhooks',
  DELIVERIES: 'webhook_deliveries',
} as const;
