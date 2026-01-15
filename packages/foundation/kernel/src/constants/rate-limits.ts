/**
 * Webhook inbound operation keys.
 * Used by kernel's webhooks.ts for type-safe op key mapping.
 */
export type WebhookInboundOpKey =
  | 'webhooks.in.stripe'
  | 'webhooks.in.razorpay'
  | 'webhooks.in.resend'
  | 'webhooks.in.ses';
