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
