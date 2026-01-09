/**
 * @deprecated Rate limit policies have moved to @unisane/gateway.
 * This file is kept for backward compatibility with webhook op key types.
 * Import from @unisane/gateway for the full rate limit functionality.
 */

/**
 * Webhook inbound operation keys.
 * Used by kernel's webhooks.ts for type-safe op key mapping.
 */
export type WebhookInboundOpKey =
  | 'webhooks.in.stripe'
  | 'webhooks.in.razorpay'
  | 'webhooks.in.resend'
  | 'webhooks.in.ses';

/**
 * @deprecated Use OpKey from @unisane/gateway instead.
 * This type alias is kept for backward compatibility.
 */
export type OpKey = string;
