import { clampInt, getOutboxProvider } from '@unisane/kernel';

/**
 * List dead outbox items for admin with seek pagination by updatedAt desc, _id tiebreak.
 */
export async function listDeadOutboxAdmin(args: { limit: number; cursor?: string | null }) {
  const outbox = getOutboxProvider();
  const limit = clampInt(args.limit, 1, 50);
  const { items, nextCursor, prevCursor } = await outbox.listDeadAdminPage({
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
  const outbox = getOutboxProvider();
  const now = new Date();
  await outbox.requeue(args.ids, now);
  return { ok: true as const };
}

export async function purgeDeadOutboxAdmin(args: OutboxIdsArgs) {
  const outbox = getOutboxProvider();
  await outbox.purge(args.ids);
  return { ok: true as const };
}

export async function requeueAllDeadOutboxAdmin(args: OutboxLimitArgs) {
  const outbox = getOutboxProvider();
  const n = clampInt(args.limit, 1, 1000);
  const now = new Date();
  const items = await outbox.listDead(n);
  const ids = items.map((x) => x.id);
  if (ids.length) await outbox.requeue(ids, now);
  return { ok: true as const, count: ids.length };
}

export async function purgeAllDeadOutboxAdmin(args: OutboxLimitArgs) {
  const outbox = getOutboxProvider();
  const n = clampInt(args.limit, 1, 1000);
  const items = await outbox.listDead(n);
  const ids = items.map((x) => x.id);
  if (ids.length) await outbox.purge(ids);
  return { ok: true as const, count: ids.length };
}
