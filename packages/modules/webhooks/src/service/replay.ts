import { getTenantId, OutboxService, events } from '@unisane/kernel';
import { WebhooksRepo } from '../data/webhooks.repository';
import { WEBHOOKS_EVENTS } from '../domain/constants';
import { ERR } from '@unisane/gateway';

// ════════════════════════════════════════════════════════════════════════════
// Replay Event
// ════════════════════════════════════════════════════════════════════════════

export type ReplayEventArgs = {
  id: string;
};

export async function replayEvent(args: ReplayEventArgs) {
  const tenantId = getTenantId();
  const ev = await WebhooksRepo.getById({ tenantId, id: args.id, direction: 'out' });
  if (!ev) throw ERR.validation('Event not found');
  const url = ev.target;
  if (!url) throw ERR.validation('Event has no target');
  const payload = ev.payload ?? {};
  await OutboxService.enqueue({ tenantId, kind: 'webhook', payload: { url, event: 'replay', body: payload } });
  await events.emit(WEBHOOKS_EVENTS.REPLAYED, { tenantId, eventId: args.id, target: url });
  return { ok: true as const };
}
