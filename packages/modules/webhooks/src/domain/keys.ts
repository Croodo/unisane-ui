/**
 * Webhooks Cache Keys
 */

export const webhooksKeys = {
  webhook: (webhookId: string) => `webhooks:${webhookId}` as const,
  tenantWebhooks: (scopeId: string) => `webhooks:tenant:${scopeId}` as const,
  delivery: (deliveryId: string) => `webhooks:delivery:${deliveryId}` as const,
} as const;

export type WebhooksKeyBuilder = typeof webhooksKeys;
