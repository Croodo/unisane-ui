import { OutboxRepo } from '@/src/platform/outbox/data/repo';
import type { OutboxItem } from '@/src/platform/outbox/domain/ports';

type Dispatchers = {
  email?: (payload: unknown) => Promise<void>;
  webhook?: (payload: unknown) => Promise<void>;
};

export const OutboxService = {
  async enqueue(item: OutboxItem): Promise<{ ok: true; id: string }> {
    return OutboxRepo.enqueue(item);
  },

  async deliverBatch(now = new Date(), limit = 50, dispatchers: Dispatchers = {}): Promise<{ delivered: number; failed: number }> {
    const items = await OutboxRepo.claimBatch(now, limit);
    let delivered = 0;
    let failed = 0;
    for (const it of items) {
      try {
        if (it.kind === 'email') {
          if (!dispatchers.email) throw new Error('no email dispatcher configured');
          await dispatchers.email(it.payload);
        } else if (it.kind === 'webhook') {
          if (!dispatchers.webhook) throw new Error('no webhook dispatcher configured');
          await dispatchers.webhook(it.payload);
        } else {
          // Exhaustive guard: OutboxRow.kind is a closed union
          const unknownKind: never = it.kind as never;
          throw new Error(`unknown outbox kind: ${String(unknownKind)}`);
        }
        await OutboxRepo.markSuccess(it._id);
        delivered++;
      } catch (e) {
        failed++;
        const msg = (e as Error)?.message ?? 'dispatch error';
        await OutboxRepo.markFailure(it._id, msg, (it.attempts ?? 0) + 1);
      }
    }
    return { delivered, failed };
  },
};
