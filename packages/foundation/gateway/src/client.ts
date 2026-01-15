/**
 * @unisane/gateway/client
 *
 * Client-safe exports that can be used in browser environments.
 * These functions don't depend on Node.js-only modules.
 */

// Filter params utilities (browser-safe with inlined base64 encoding)
export { parseFiltersParam, encodeFiltersParam } from './query/filterParams.client';

// Admin list configurations (now uses client-safe filter parsing)
export { adminListConfigs } from './registry/admin.lists';
export type { AdminListConfig } from './registry/admin.lists';

// Rate limit policies (plain object, no Node.js dependencies)
export { RATE_LIMIT_POLICIES } from './rate-limits';
export type { OpKey } from './rate-limits';

// Header names (inlined to avoid kernel dependency)
export const HEADER_NAMES = {
  AUTHORIZATION: 'authorization',
  IDEMPOTENCY_KEY: 'idempotency-key',
  REQUEST_ID: 'x-request-id',
  RATE_REMAINING: 'x-ratelimit-remaining',
  RATE_RESET: 'x-ratelimit-reset',
  RETRY_AFTER: 'retry-after',
  WEBHOOK_SIGNATURE: 'x-webhook-signature',
  WEBHOOK_ID: 'x-webhook-id',
  WEBHOOK_TS: 'x-webhook-timestamp',
  CSRF_TOKEN: 'x-csrf-token',
} as const;
