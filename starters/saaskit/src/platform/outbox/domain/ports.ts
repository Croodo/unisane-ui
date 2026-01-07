import type { OutboxStatus, OutboxKind } from '@unisane/kernel';

export type OutboxItem = {
  tenantId?: string | null;
  kind: OutboxKind;
  payload: unknown;
};

export type OutboxRow = {
  _id: string;
  tenantId?: string | null;
  kind: OutboxKind;
  payload: unknown;
  status: OutboxStatus;
  attempts?: number;
  nextAttemptAt?: Date | null;
};

export type OutboxDeadAdminRow = {
  id: string;
  kind: string;
  attempts: number;
  lastError: string | null;
  updatedAt: Date | null;
};

export interface OutboxRepoPort {
  enqueue(item: OutboxItem): Promise<{ ok: true; id: string }>;
  claimBatch(now: Date, limit: number): Promise<OutboxRow[]>;
  markSuccess(id: string): Promise<void>;
  markFailure(id: string, err: string, attempts: number): Promise<void>;
  // DLQ helpers for jobs
  listDead(limit: number): Promise<Array<{ id: string }>>;
  // Admin: list DLQ (dead) items with cursor pagination
  listDeadAdminPage(args: {
    limit: number;
    cursor?: string | null;
  }): Promise<{
    items: OutboxDeadAdminRow[];
    nextCursor?: string;
    prevCursor?: string;
  }>;
  requeue(ids: string[], now: Date): Promise<void>;
  countDead(): Promise<number>;
  purge(ids: string[]): Promise<void>;
}
