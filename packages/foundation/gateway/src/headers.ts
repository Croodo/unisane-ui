/**
 * HTTP Header Constants
 *
 * Standard header names used throughout the gateway layer.
 */
export const HEADER_NAMES = {
  // Authentication & Security
  AUTHORIZATION: 'authorization',
  CSRF_TOKEN: 'x-csrf-token',

  // Request Tracking
  REQUEST_ID: 'x-request-id',
  IDEMPOTENCY_KEY: 'idempotency-key',

  // Rate Limiting
  RATE_REMAINING: 'x-ratelimit-remaining',
  RATE_RESET: 'x-ratelimit-reset',
  RETRY_AFTER: 'retry-after',

  // Webhooks
  WEBHOOK_SIGNATURE: 'x-webhook-signature',
  WEBHOOK_ID: 'x-webhook-id',
  WEBHOOK_TS: 'x-webhook-timestamp',

  // API Versioning (RFC 8594)
  /** RFC 8594: Indicates endpoint is deprecated. Value: "true" or ISO 8601 date */
  DEPRECATION: 'deprecation',
  /** RFC 8594: Date when endpoint will be removed. Value: HTTP date (RFC 7231) */
  SUNSET: 'sunset',
  /** Version of the API being used. Informational only. */
  API_VERSION: 'x-api-version',
  /** Link to successor version or documentation. RFC 5988 format. */
  LINK: 'link',
} as const;
