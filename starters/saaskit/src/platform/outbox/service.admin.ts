import { OutboxRepo } from '@/src/platform/outbox/data/repo';
import { clampInt } from '@unisane/kernel';

/**
 * List dead outbox items for admin with seek pagination by updatedAt desc, _id tiebreak.
 */
export async function listDeadOutboxAdmin(args: { limit: number; cursor?: string | null }) {
  const limit = clampInt(args.limit, 1, 50);
  const { items, nextCursor, prevCursor } = await OutboxRepo.listDeadAdminPage({
    limit,
    cursor: args.cursor ?? null,
  });

  const rows = items.map((d) => ({
    id: d.id,
    kind: d.kind ?? 'unknown',
    attempts: d.attempts ?? 0,
    lastError: d.lastError ?? null,
    updatedAt: d.updatedAt ? d.updatedAt.toISOString() : null,
  }));

  return { items: rows, ...(nextCursor ? { nextCursor } : {}), ...(prevCursor ? { prevCursor } : {}) } as const;
}

export type OutboxIdsArgs = { ids: string[] };
export type OutboxLimitArgs = { limit: number };

export async function requeueDeadOutboxAdmin(args: OutboxIdsArgs) {
  const now = new Date();
  await OutboxRepo.requeue(args.ids, now);
  return { ok: true as const };
}

export async function purgeDeadOutboxAdmin(args: OutboxIdsArgs) {
  await OutboxRepo.purge(args.ids);
  return { ok: true as const };
}

export async function requeueAllDeadOutboxAdmin(args: OutboxLimitArgs) {
  const n = clampInt(args.limit, 1, 1000);
  const now = new Date();
  const items = await OutboxRepo.listDead(n);
  const ids = items.map((x) => x.id);
  if (ids.length) await OutboxRepo.requeue(ids, now);
  return { ok: true as const, count: ids.length };
}

export async function purgeAllDeadOutboxAdmin(args: OutboxLimitArgs) {
  const n = clampInt(args.limit, 1, 1000);
  const items = await OutboxRepo.listDead(n);
  const ids = items.map((x) => x.id);
  if (ids.length) await OutboxRepo.purge(ids);
  return { ok: true as const, count: ids.length };
}
