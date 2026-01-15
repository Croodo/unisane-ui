import { getScopeId } from '@unisane/kernel';
import type { ListPageArgs, WebhookDirection, WebhookEventStatus } from '@unisane/kernel';
import { WebhooksRepo } from '../data/webhooks.repository';

// ════════════════════════════════════════════════════════════════════════════
// List Events
// ════════════════════════════════════════════════════════════════════════════

export type ListEventsArgs = ListPageArgs & {
  direction?: 'in' | 'out';
  status?: string;
};

export async function listEvents(args: ListEventsArgs) {
  const scopeId = getScopeId();
  const casted = {
    scopeId,
    limit: args.limit,
    ...(args.cursor ? { cursor: args.cursor } : {}),
    ...(args.status ? { status: args.status as WebhookEventStatus } : {}),
    ...(args.direction ? { direction: args.direction as WebhookDirection } : {}),
  };
  return WebhooksRepo.listPage(casted);
}
