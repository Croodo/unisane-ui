/**
 * Webhooks Cache Keys
 */

export const webhooksKeys = {
  webhook: (webhookId: string) => `webhooks:${webhookId}` as const,
  tenantWebhooks: (tenantId: string) => `webhooks:tenant:${tenantId}` as const,
  delivery: (deliveryId: string) => `webhooks:delivery:${deliveryId}` as const,
} as const;

export type WebhooksKeyBuilder = typeof webhooksKeys;
