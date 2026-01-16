/**
 * Outbox Port
 *
 * Port interface for transactional outbox pattern.
 * Provides reliable delivery of emails, webhooks, and other external messages.
 *
 * @example
 * ```typescript
 * import { setOutboxProvider, enqueueOutbox } from '@unisane/kernel';
 * import { createMongoOutboxAdapter } from '@unisane/outbox-mongodb';
 *
 * // Wire the outbox adapter at bootstrap
 * setOutboxProvider(createMongoOutboxAdapter({
 *   collection: () => db().collection('outbox'),
 * }));
 *
 * // Use from anywhere
 * await enqueueOutbox({
 *   tenantId: 'tenant_123',
 *   kind: 'email',
 *   payload: { to: 'user@example.com', subject: 'Hello' },
 * });
 * ```
 */

// Re-use types from constants (single source of truth)
import type { OutboxKind, OutboxStatus } from '../constants/outbox';
import { setGlobalProvider, getGlobalProvider, hasGlobalProvider } from './global-provider';
import { BadRequestError } from '../errors/common';
import { base64UrlDecodeUtf8 } from '../encoding/base64url';
import { clampInt } from '../utils/dto';

const PROVIDER_KEY = 'outbox';

/**
 * Input for enqueueing an outbox item.
 */
export interface OutboxItem {
  tenantId?: string | null;
  kind: OutboxKind;
  payload: unknown;
}

/**
 * Outbox row returned from repository.
 */
export interface OutboxRow {
  id: string;
  tenantId?: string | null;
  kind: OutboxKind;
  payload: unknown;
  status: OutboxStatus;
  attempts: number;
  nextAttemptAt?: Date | null;
}

/**
 * Dead letter queue admin row for pagination.
 */
export interface OutboxDeadAdminRow {
  id: string;
  kind: string;
  attempts: number;
  lastError: string | null;
  updatedAt: Date | null;
}

/**
 * Port interface for outbox operations.
 * Implementations handle the actual storage (MongoDB, PostgreSQL, etc.).
 */
export interface OutboxPort {
  /**
   * Enqueue a new item for delivery.
   */
  enqueue(item: OutboxItem): Promise<{ ok: true; id: string }>;

  /**
   * Claim a batch of items for delivery.
   * Sets status to 'delivering' to prevent duplicate processing.
   */
  claimBatch(now: Date, limit: number): Promise<OutboxRow[]>;

  /**
   * Mark an item as successfully delivered.
   */
  markSuccess(id: string): Promise<void>;

  /**
   * Mark an item as failed with exponential backoff.
   * After max retries, status changes to 'dead'.
   */
  markFailure(id: string, err: string, attempts: number): Promise<void>;

  /**
   * List dead letter queue items.
   */
  listDead(limit: number): Promise<Array<{ id: string }>>;

  /**
   * List dead letter queue items with cursor pagination (for admin UI).
   */
  listDeadAdminPage(args: {
    limit: number;
    cursor?: string | null;
  }): Promise<{
    items: OutboxDeadAdminRow[];
    nextCursor?: string;
    prevCursor?: string;
  }>;

  /**
   * Requeue dead items for retry.
   */
  requeue(ids: string[], now: Date): Promise<void>;

  /**
   * Count items in dead letter queue.
   */
  countDead(): Promise<number>;

  /**
   * Permanently delete dead items.
   */
  purge(ids: string[]): Promise<void>;
}

// ─── PROVIDER MANAGEMENT ────────────────────────────────────────────────────

const noopOutboxPort: OutboxPort = {
  enqueue: async () => ({ ok: true as const, id: 'noop' }),
  claimBatch: async () => [],
  markSuccess: async () => {},
  markFailure: async () => {},
  listDead: async () => [],
  listDeadAdminPage: async () => ({ items: [] }),
  requeue: async () => {},
  countDead: async () => 0,
  purge: async () => {},
};

/**
 * Set the outbox provider implementation.
 * Call this at bootstrap with your adapter (e.g., MongoDB, PostgreSQL).
 */
export function setOutboxProvider(provider: OutboxPort): void {
  setGlobalProvider(PROVIDER_KEY, provider);
}

/**
 * Get the current outbox provider.
 */
export function getOutboxProvider(): OutboxPort {
  return getGlobalProvider<OutboxPort>(PROVIDER_KEY) ?? noopOutboxPort;
}

/**
 * Check if a real outbox provider has been configured.
 */
export function hasOutboxProvider(): boolean {
  return hasGlobalProvider(PROVIDER_KEY);
}

// ─── CONVENIENCE FUNCTIONS ──────────────────────────────────────────────────

/**
 * Enqueue an item for delivery.
 * Convenience wrapper around getOutboxProvider().enqueue().
 */
export async function enqueueOutbox(item: OutboxItem): Promise<{ ok: true; id: string }> {
  return getOutboxProvider().enqueue(item);
}

/**
 * Claim a batch of items for delivery.
 * Convenience wrapper around getOutboxProvider().claimBatch().
 */
export async function claimOutboxBatch(now: Date, limit: number): Promise<OutboxRow[]> {
  return getOutboxProvider().claimBatch(now, limit);
}

// ─── ADMIN SERVICE FUNCTIONS ────────────────────────────────────────────────

/**
 * Validate cursor format before using it.
 * Cursors should be base64url-encoded JSON with expected structure.
 * Throws BadRequestError for invalid cursors instead of passing garbage to database.
 */
function validateOutboxCursor(cursor: string | null | undefined): string | null {
  if (!cursor) return null;

  try {
    const decoded = base64UrlDecodeUtf8(cursor);
    if (!decoded) {
      throw new BadRequestError('Invalid cursor format: not valid base64url encoding');
    }

    const parsed = JSON.parse(decoded);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new BadRequestError('Invalid cursor format: expected array with sort values');
    }

    return cursor;
  } catch (err) {
    if (err instanceof BadRequestError) {
      throw err;
    }
    throw new BadRequestError('Invalid cursor format: malformed cursor');
  }
}

/**
 * List dead outbox items for admin with seek pagination.
 */
export async function listDeadOutboxAdmin(args: { limit: number; cursor?: string | null }) {
  const outbox = getOutboxProvider();
  const limit = clampInt(args.limit, 1, 50);
  const validatedCursor = validateOutboxCursor(args.cursor);
  const { items, nextCursor, prevCursor } = await outbox.listDeadAdminPage({
    limit,
    cursor: validatedCursor,
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

/**
 * Requeue specific dead outbox items by IDs.
 */
export async function requeueDeadOutboxAdmin(args: OutboxIdsArgs) {
  const outbox = getOutboxProvider();
  const now = new Date();
  await outbox.requeue(args.ids, now);
  return { ok: true as const };
}

/**
 * Purge specific dead outbox items by IDs.
 */
export async function purgeDeadOutboxAdmin(args: OutboxIdsArgs) {
  const outbox = getOutboxProvider();
  await outbox.purge(args.ids);
  return { ok: true as const };
}

/**
 * Requeue all dead outbox items (bounded by limit).
 */
export async function requeueAllDeadOutboxAdmin(args: OutboxLimitArgs) {
  const outbox = getOutboxProvider();
  const n = clampInt(args.limit, 1, 1000);
  const now = new Date();
  const items = await outbox.listDead(n);
  const ids = items.map((x) => x.id);
  if (ids.length) await outbox.requeue(ids, now);
  return { ok: true as const, count: ids.length };
}

/**
 * Purge all dead outbox items (bounded by limit).
 */
export async function purgeAllDeadOutboxAdmin(args: OutboxLimitArgs) {
  const outbox = getOutboxProvider();
  const n = clampInt(args.limit, 1, 1000);
  const items = await outbox.listDead(n);
  const ids = items.map((x) => x.id);
  if (ids.length) await outbox.purge(ids);
  return { ok: true as const, count: ids.length };
}
