import { getTenantId } from '@unisane/kernel';
import { WebhooksRepo } from '../data/webhooks.repository';
import type { WebhookDirection, WebhookEventStatus } from '@unisane/kernel';

// ════════════════════════════════════════════════════════════════════════════
// List Events
// ════════════════════════════════════════════════════════════════════════════

export type ListEventsArgs = {
  limit: number;
  cursor?: string;
  direction?: 'in' | 'out';
  status?: string;
};

export async function listEvents(args: ListEventsArgs) {
  const tenantId = getTenantId();
  const casted = {
    tenantId,
    limit: args.limit,
    ...(args.cursor ? { cursor: args.cursor } : {}),
    ...(args.status ? { status: args.status as WebhookEventStatus } : {}),
    ...(args.direction ? { direction: args.direction as WebhookDirection } : {}),
  };
  return WebhooksRepo.listPage(casted);
}
