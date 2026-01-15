import { getScopeId } from '@unisane/kernel';
import { listLedgerPage } from '../data/credits.repository';
import type { LedgerEntry } from '../domain/types';

export type ListLedgerArgs = {
  cursor?: string;
  limit: number;
};

export async function listLedger(args: ListLedgerArgs): Promise<{
  items: LedgerEntry[];
  nextCursor?: string;
}> {
  const scopeId = getScopeId();
  const { rows, nextCursor } = await listLedgerPage({
    scopeId,
    limit: args.limit,
    ...(args.cursor ? { cursor: args.cursor } : {}),
  });
  const items: LedgerEntry[] = rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    amount: r.amount,
    reason: r.reason,
    feature: r.feature ?? null,
    createdAt: r.createdAt,
    expiresAt: r.expiresAt ?? null,
  }));
  return { items, ...(nextCursor ? { nextCursor } : {}) } as const;
}
