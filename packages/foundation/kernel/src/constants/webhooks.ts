import { z } from 'zod';
import type { WebhookInboundOpKey } from './rate-limits';

export const WEBHOOK_PROVIDERS = ['stripe', 'razorpay', 'resend', 'ses'] as const;
export type WebhookProvider = (typeof WEBHOOK_PROVIDERS)[number];
export const ZWebhookProvider = z.enum(WEBHOOK_PROVIDERS);

export const WEBHOOK_EVENT_STATUS = ['received', 'verified', 'handled', 'delivered', 'failed', 'replayed'] as const;
export type WebhookEventStatus = (typeof WEBHOOK_EVENT_STATUS)[number];
export const ZWebhookEventStatus = z.enum(WEBHOOK_EVENT_STATUS);

export const WEBHOOK_DIRECTION = ['in', 'out'] as const;
export type WebhookDirection = (typeof WEBHOOK_DIRECTION)[number];
export const ZWebhookDirection = z.enum(WEBHOOK_DIRECTION);

export function isWebhookProvider(x: string): x is WebhookProvider {
  return (WEBHOOK_PROVIDERS as readonly string[]).includes(x);
}

const WEBHOOKS_IN_OPS_MAP: Record<WebhookProvider, WebhookInboundOpKey> = {
  stripe: 'webhooks.in.stripe',
  razorpay: 'webhooks.in.razorpay',
  resend: 'webhooks.in.resend',
  ses: 'webhooks.in.ses',
};

export function getInboundWebhookOp(provider: WebhookProvider): WebhookInboundOpKey {
  return WEBHOOKS_IN_OPS_MAP[provider];
}
