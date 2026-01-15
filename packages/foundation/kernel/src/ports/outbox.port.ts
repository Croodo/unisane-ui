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

let _outboxProvider: OutboxPort = noopOutboxPort;

/**
 * Set the outbox provider implementation.
 * Call this at bootstrap with your adapter (e.g., MongoDB, PostgreSQL).
 */
export function setOutboxProvider(provider: OutboxPort): void {
  _outboxProvider = provider;
}

/**
 * Get the current outbox provider.
 */
export function getOutboxProvider(): OutboxPort {
  return _outboxProvider;
}

/**
 * Check if a real outbox provider has been configured.
 */
export function hasOutboxProvider(): boolean {
  return _outboxProvider !== noopOutboxPort;
}

// ─── CONVENIENCE FUNCTIONS ──────────────────────────────────────────────────

/**
 * Enqueue an item for delivery.
 * Convenience wrapper around getOutboxProvider().enqueue().
 */
export async function enqueueOutbox(item: OutboxItem): Promise<{ ok: true; id: string }> {
  return _outboxProvider.enqueue(item);
}

/**
 * Claim a batch of items for delivery.
 * Convenience wrapper around getOutboxProvider().claimBatch().
 */
export async function claimOutboxBatch(now: Date, limit: number): Promise<OutboxRow[]> {
  return _outboxProvider.claimBatch(now, limit);
}
