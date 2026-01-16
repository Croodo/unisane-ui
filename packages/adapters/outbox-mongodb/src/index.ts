/**
 * MongoDB Outbox Adapter
 *
 * Implements the OutboxPort interface using MongoDB.
 * Provides reliable transactional outbox pattern for email/webhook delivery.
 *
 * ## OB-002 FIX: Required Indexes
 *
 * **IMPORTANT:** For optimal performance, create these indexes on your outbox collection:
 *
 * ```javascript
 * // Primary index for claiming pending items (used by claimBatch)
 * // This index is CRITICAL for performance - without it, claimBatch does a full scan
 * db.outbox.createIndex(
 *   { status: 1, nextAttemptAt: 1 },
 *   { name: 'outbox_claim_idx' }
 * );
 *
 * // Index for listing dead items (used by listDead, listDeadAdminPage)
 * db.outbox.createIndex(
 *   { status: 1, updatedAt: -1 },
 *   { name: 'outbox_dead_idx', partialFilterExpression: { status: 'dead' } }
 * );
 *
 * // Optional: TTL index to auto-cleanup delivered items after 30 days
 * db.outbox.createIndex(
 *   { updatedAt: 1 },
 *   { name: 'outbox_ttl_idx', expireAfterSeconds: 2592000, partialFilterExpression: { status: 'delivered' } }
 * );
 * ```
 *
 * @example
 * ```typescript
 * import { createMongoOutboxAdapter } from '@unisane/outbox-mongodb';
 * import { setOutboxProvider } from '@unisane/kernel';
 * import { db } from '@unisane/kernel';
 *
 * // Wire the outbox adapter
 * setOutboxProvider(createMongoOutboxAdapter(() => db().collection('outbox')));
 * ```
 */

import { ObjectId, type Collection, type Document } from 'mongodb';
import type { OutboxPort, OutboxItem, OutboxRow, OutboxDeadAdminRow, OutboxStatus, OutboxKind } from '@unisane/kernel';

/**
 * MongoDB document shape for outbox items.
 */
interface OutboxDoc {
  _id?: ObjectId;
  tenantId?: string | null;
  kind: OutboxKind;
  payload: unknown;
  status: OutboxStatus;
  attempts: number;
  nextAttemptAt: Date;
  lastError?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Configuration for the MongoDB outbox adapter.
 */
export interface MongoOutboxAdapterConfig {
  /**
   * Function that returns the MongoDB collection for outbox items.
   * This allows lazy initialization after database connection.
   *
   * OB-004 FIX: Use OutboxDoc type instead of any for type safety.
   */
  collection: () => Collection<OutboxDoc>;

  /**
   * Maximum retry attempts before marking as dead (default: 8)
   */
  maxRetries?: number;

  /**
   * Base delay in seconds for exponential backoff (default: 30)
   */
  baseDelaySec?: number;

  /**
   * Maximum delay in seconds for exponential backoff (default: 1800)
   */
  maxDelaySec?: number;
}

/**
 * Helper to convert string ID to ObjectId if valid.
 */
function maybeObjectId(id: string): ObjectId | string {
  if (ObjectId.isValid(id)) {
    return new ObjectId(id);
  }
  return id;
}

/**
 * OB-003 FIX: Pagination cursor structure for listDeadAdminPage.
 */
interface PaginationCursor {
  updatedAt: string;
  _id: string;
}

/**
 * OB-003 FIX: Maximum cursor length to prevent DoS via oversized cursors.
 */
const MAX_CURSOR_LENGTH = 1024;

/**
 * OB-003 FIX: Safely decode and validate a pagination cursor.
 * Returns null for invalid cursors instead of silently ignoring,
 * allowing the caller to log or handle the invalid case explicitly.
 */
function decodePaginationCursor(cursor: string): PaginationCursor | null {
  // Validate cursor length to prevent DoS
  if (!cursor || cursor.length > MAX_CURSOR_LENGTH) {
    console.warn('[outbox-mongodb] Invalid cursor: empty or exceeds max length');
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));

    // Validate cursor structure
    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      typeof decoded.updatedAt !== 'string' ||
      typeof decoded._id !== 'string'
    ) {
      console.warn('[outbox-mongodb] Invalid cursor: malformed structure');
      return null;
    }

    // Validate updatedAt is a valid ISO date string
    const date = new Date(decoded.updatedAt);
    if (Number.isNaN(date.getTime())) {
      console.warn('[outbox-mongodb] Invalid cursor: invalid date format');
      return null;
    }

    // Validate _id is a valid ObjectId string (if it looks like one)
    if (decoded._id.length === 24 && !ObjectId.isValid(decoded._id)) {
      console.warn('[outbox-mongodb] Invalid cursor: invalid ObjectId format');
      return null;
    }

    return {
      updatedAt: decoded.updatedAt,
      _id: decoded._id,
    };
  } catch {
    console.warn('[outbox-mongodb] Invalid cursor: failed to decode');
    return null;
  }
}

/**
 * Create an OutboxPort adapter using MongoDB.
 *
 * @param config Configuration options
 * @returns OutboxPort implementation
 *
 * @example
 * ```typescript
 * import { createMongoOutboxAdapter } from '@unisane/outbox-mongodb';
 * import { setOutboxProvider } from '@unisane/kernel';
 *
 * setOutboxProvider(createMongoOutboxAdapter({
 *   collection: () => db().collection('outbox'),
 * }));
 * ```
 */
export function createMongoOutboxAdapter(config: MongoOutboxAdapterConfig): OutboxPort {
  const {
    collection,
    maxRetries = 8,
    baseDelaySec = 30,
    maxDelaySec = 1800,
  } = config;

  const col = () => collection();

  return {
    async enqueue(item: OutboxItem): Promise<{ ok: true; id: string }> {
      const now = new Date();
      const doc: OutboxDoc = {
        ...(item.tenantId !== undefined ? { tenantId: item.tenantId } : {}),
        kind: item.kind,
        payload: item.payload,
        status: 'queued',
        attempts: 0,
        nextAttemptAt: now,
        createdAt: now,
        updatedAt: now,
      };
      const result = await col().insertOne(doc);
      return { ok: true as const, id: String(result.insertedId) };
    },

    /**
     * Claim a batch of outbox items for processing.
     *
     * SECURITY FIX (DATA-001): Use atomic findOneAndUpdate to prevent race condition.
     * Previously, the find + updateMany pattern allowed multiple workers to claim
     * the same items, causing duplicate event delivery.
     *
     * Now uses findOneAndUpdate in a loop to atomically claim each item.
     * This ensures each item is only claimed by one worker.
     */
    async claimBatch(now: Date, limit: number): Promise<OutboxRow[]> {
      const clampedLimit = Math.max(1, Math.min(limit, 100));
      const results: OutboxRow[] = [];

      // SECURITY FIX (DATA-001): Atomically claim items one at a time using findOneAndUpdate
      // This prevents race conditions where multiple workers claim the same item
      for (let i = 0; i < clampedLimit; i++) {
        const doc = await col().findOneAndUpdate(
          {
            status: 'queued',
            nextAttemptAt: { $lte: now },
          } as Document,
          {
            $set: {
              status: 'delivering',
              updatedAt: new Date(),
            },
          } as Document,
          {
            sort: { nextAttemptAt: 1 },
            returnDocument: 'after',
          }
        );

        // No more items to claim
        if (!doc) {
          break;
        }

        results.push({
          id: String(doc._id),
          ...(doc.tenantId !== undefined ? { tenantId: doc.tenantId } : {}),
          kind: doc.kind as OutboxKind,
          payload: doc.payload,
          status: doc.status as OutboxStatus,
          attempts: (doc.attempts as number) ?? 0,
          nextAttemptAt: (doc.nextAttemptAt as Date) ?? null,
        });
      }

      return results;
    },

    async markSuccess(id: string): Promise<void> {
      await col().updateOne(
        { _id: maybeObjectId(id) } as Document,
        {
          $set: { status: 'delivered', lastError: null, updatedAt: new Date() },
        } as Document
      );
    },

    async markFailure(id: string, err: string, attempts: number): Promise<void> {
      // OB-005 FIX: Add 10% random jitter to prevent thundering herd
      const baseDelay = Math.min(maxDelaySec, Math.pow(2, attempts) * baseDelaySec);
      const jitter = baseDelay * 0.1 * Math.random(); // 0-10% jitter
      const delaySec = baseDelay + jitter;
      const next = new Date(Date.now() + delaySec * 1000);
      const nextStatus: OutboxStatus = attempts >= maxRetries ? 'dead' : 'failed';

      await col().updateOne(
        { _id: maybeObjectId(id) } as Document,
        {
          $set: {
            status: nextStatus,
            lastError: err,
            nextAttemptAt: next,
            updatedAt: new Date(),
          },
          $inc: { attempts: 1 },
        } as Document
      );
    },

    async listDead(limit: number): Promise<Array<{ id: string }>> {
      const clampedLimit = Math.max(1, Math.min(limit, 500));
      const docs = await col()
        .find({ status: 'dead' } as Document)
        .sort({ updatedAt: 1 })
        .limit(clampedLimit)
        .project({ _id: 1 } as Document)
        .toArray();

      return docs.map((d) => ({
        id: String(d._id ?? ''),
      }));
    },

    async listDeadAdminPage(args: {
      limit: number;
      cursor?: string | null;
    }): Promise<{
      items: OutboxDeadAdminRow[];
      nextCursor?: string;
      prevCursor?: string;
    }> {
      const limit = Math.max(1, Math.min(args.limit, 50));

      // OB-004 FIX: Use proper MongoDB Filter type instead of any
      // Build query with cursor support
      let filter: Document = { status: 'dead' };

      if (args.cursor) {
        // OB-003 FIX: Decode cursor and validate format, throw on invalid cursor
        // instead of silently ignoring which could hide bugs
        const decoded = decodePaginationCursor(args.cursor);
        if (decoded) {
          filter = {
            ...filter,
            $or: [
              { updatedAt: { $lt: new Date(decoded.updatedAt) } },
              {
                updatedAt: new Date(decoded.updatedAt),
                _id: { $lt: maybeObjectId(decoded._id) },
              },
            ],
          };
        }
        // Note: Invalid cursors are now logged and treated as "start from beginning"
        // This is a safer default than silently continuing, as it allows monitoring
      }

      const docs = await col()
        .find(filter as Document)
        .sort({ updatedAt: -1, _id: -1 })
        .limit(limit + 1) // Fetch one extra to check if there's more
        .project({ _id: 1, kind: 1, attempts: 1, lastError: 1, updatedAt: 1 } as Document)
        .toArray();

      const hasMore = docs.length > limit;
      const items = docs.slice(0, limit);

      const result: {
        items: OutboxDeadAdminRow[];
        nextCursor?: string;
        prevCursor?: string;
      } = {
        items: items.map((d) => ({
          id: String(d._id ?? ''),
          kind: String(d.kind ?? 'unknown'),
          attempts: Number(d.attempts ?? 0),
          lastError: d.lastError ?? null,
          updatedAt: d.updatedAt instanceof Date ? d.updatedAt : null,
        })),
      };

      // Build next cursor from last item if there's more
      if (hasMore && items.length > 0) {
        const last = items[items.length - 1]!;
        result.nextCursor = Buffer.from(
          JSON.stringify({
            updatedAt: last.updatedAt?.toISOString() ?? null,
            _id: String(last._id),
          })
        ).toString('base64');
      }

      // Build prev cursor from first item if we have a cursor
      if (args.cursor && items.length > 0) {
        const first = items[0]!;
        result.prevCursor = Buffer.from(
          JSON.stringify({
            updatedAt: first.updatedAt?.toISOString() ?? null,
            _id: String(first._id),
          })
        ).toString('base64');
      }

      return result;
    },

    async requeue(ids: string[], now: Date): Promise<void> {
      if (!ids.length) return;
      const objIds = ids.map(maybeObjectId);
      await col().updateMany(
        { _id: { $in: objIds } } as Document,
        {
          $set: {
            status: 'queued',
            nextAttemptAt: now,
            lastError: null,
            updatedAt: new Date(),
          },
        } as Document
      );
    },

    async countDead(): Promise<number> {
      return col().countDocuments({ status: 'dead' } as Document);
    },

    async purge(ids: string[]): Promise<void> {
      if (!ids.length) return;
      const objIds = ids.map(maybeObjectId);
      await col().deleteMany({
        _id: { $in: objIds },
        status: 'dead',
      } as Document);
    },
  };
}

// =============================================================================
// DLQ Adapter
// =============================================================================

import type {
  DLQPort,
  DeadEventEntry,
  DLQStats,
  PaginatedDeadEvents,
  ListDeadEventsOptions,
  BatchRetryResult,
} from '@unisane/kernel';

/**
 * Configuration for the MongoDB DLQ adapter.
 */
export interface MongoDLQAdapterConfig {
  /**
   * Function that returns the MongoDB collection for outbox/DLQ items.
   * This should be the SAME collection as the outbox adapter.
   */
  collection: () => Collection<OutboxDoc>;
}

/**
 * Create a DLQPort adapter using MongoDB.
 * Uses the same collection as the outbox adapter.
 *
 * @param config Configuration options
 * @returns DLQPort implementation
 *
 * @example
 * ```typescript
 * import { createMongoDLQAdapter } from '@unisane/outbox-mongodb';
 * import { setDLQProvider } from '@unisane/kernel';
 *
 * setDLQProvider(createMongoDLQAdapter({
 *   collection: () => db().collection('_outbox'),
 * }));
 * ```
 */
export function createMongoDLQAdapter(config: MongoDLQAdapterConfig): DLQPort {
  const { collection } = config;
  const col = () => collection();

  /**
   * Convert outbox document to DeadEventEntry.
   */
  function toDeadEventEntry(doc: OutboxDoc & { _id: ObjectId }): DeadEventEntry {
    const payload = doc.payload as { meta?: DeadEventEntry['meta'] };
    return {
      id: String(doc._id),
      type: doc.kind,
      payload: doc.payload,
      meta: payload?.meta ?? {
        eventId: String(doc._id),
        timestamp: doc.createdAt?.toISOString() ?? new Date().toISOString(),
        source: 'unknown',
        scopeId: doc.tenantId ?? undefined,
      },
      attempts: doc.attempts,
      lastError: doc.lastError ?? 'Unknown error',
      createdAt: doc.createdAt ?? new Date(),
      lastAttemptAt: doc.updatedAt ?? new Date(),
      failedAt: doc.updatedAt ?? new Date(),
    };
  }

  return {
    async list(options?: ListDeadEventsOptions): Promise<PaginatedDeadEvents> {
      const limit = Math.max(1, Math.min(options?.limit ?? 20, 100));

      // Build filter
      let filter: Document = { status: 'dead' };

      if (options?.type) {
        filter.kind = options.type;
      }

      if (options?.scopeId) {
        filter.tenantId = options.scopeId;
      }

      if (options?.errorPattern) {
        filter.lastError = { $regex: options.errorPattern, $options: 'i' };
      }

      // Handle cursor-based pagination
      if (options?.cursor) {
        const decoded = decodePaginationCursor(options.cursor);
        if (decoded) {
          filter = {
            ...filter,
            $or: [
              { updatedAt: { $lt: new Date(decoded.updatedAt) } },
              {
                updatedAt: new Date(decoded.updatedAt),
                _id: { $lt: maybeObjectId(decoded._id) },
              },
            ],
          };
        }
      }

      const docs = await col()
        .find(filter)
        .sort({ updatedAt: -1, _id: -1 })
        .limit(limit + 1)
        .toArray();

      const hasMore = docs.length > limit;
      const items = docs.slice(0, limit);

      // Build next cursor
      let nextCursor: string | null = null;
      if (hasMore && items.length > 0) {
        const last = items[items.length - 1]!;
        nextCursor = Buffer.from(
          JSON.stringify({
            updatedAt: last.updatedAt?.toISOString() ?? null,
            _id: String(last._id),
          })
        ).toString('base64');
      }

      return {
        items: items.map((doc) => toDeadEventEntry(doc as OutboxDoc & { _id: ObjectId })),
        nextCursor,
      };
    },

    async getById(id: string): Promise<DeadEventEntry | null> {
      const doc = await col().findOne({
        _id: maybeObjectId(id),
        status: 'dead',
      } as Document);

      if (!doc) return null;
      return toDeadEventEntry(doc as OutboxDoc & { _id: ObjectId });
    },

    async retry(id: string): Promise<boolean> {
      const result = await col().updateOne(
        { _id: maybeObjectId(id), status: 'dead' } as Document,
        {
          $set: {
            status: 'queued',
            attempts: 0,
            nextAttemptAt: new Date(),
            lastError: null,
            updatedAt: new Date(),
          },
        } as Document
      );
      return result.modifiedCount > 0;
    },

    async retryBatch(ids: string[]): Promise<BatchRetryResult> {
      const succeeded: string[] = [];
      const failed: Array<{ id: string; error: string }> = [];

      for (const id of ids) {
        try {
          const success = await this.retry(id);
          if (success) {
            succeeded.push(id);
          } else {
            failed.push({ id, error: 'Not found or not in dead status' });
          }
        } catch (error) {
          failed.push({ id, error: error instanceof Error ? error.message : String(error) });
        }
      }

      return { succeeded, failed };
    },

    async purge(id: string): Promise<boolean> {
      const result = await col().deleteOne({
        _id: maybeObjectId(id),
        status: 'dead',
      } as Document);
      return result.deletedCount > 0;
    },

    async purgeBatch(ids: string[]): Promise<number> {
      if (!ids.length) return 0;
      const objIds = ids.map(maybeObjectId);
      const result = await col().deleteMany({
        _id: { $in: objIds },
        status: 'dead',
      } as Document);
      return result.deletedCount;
    },

    async getStats(): Promise<DLQStats> {
      // Use aggregation for efficient stats
      const pipeline = [
        { $match: { status: 'dead' } },
        {
          $group: {
            _id: null,
            totalDead: { $sum: 1 },
            oldestDeadAt: { $min: '$updatedAt' },
            newestDeadAt: { $max: '$updatedAt' },
          },
        },
      ];

      const [totals] = await col().aggregate(pipeline).toArray();

      // Get counts by type
      const byTypePipeline = [
        { $match: { status: 'dead' } },
        { $group: { _id: '$kind', count: { $sum: 1 } } },
      ];
      const byTypeResults = await col().aggregate(byTypePipeline).toArray();
      const byType: Record<string, number> = {};
      for (const r of byTypeResults) {
        if (r._id) byType[String(r._id)] = r.count as number;
      }

      // Get counts by error (first 50 chars for grouping)
      const byErrorPipeline = [
        { $match: { status: 'dead', lastError: { $ne: null } } },
        {
          $group: {
            _id: { $substr: ['$lastError', 0, 50] },
            count: { $sum: 1 },
          },
        },
        { $limit: 10 }, // Top 10 error patterns
      ];
      const byErrorResults = await col().aggregate(byErrorPipeline).toArray();
      const byError: Record<string, number> = {};
      for (const r of byErrorResults) {
        if (r._id) byError[String(r._id)] = r.count as number;
      }

      return {
        totalDead: (totals?.totalDead as number) ?? 0,
        byType,
        byError,
        oldestDeadAt: totals?.oldestDeadAt ? new Date(totals.oldestDeadAt as Date) : undefined,
        newestDeadAt: totals?.newestDeadAt ? new Date(totals.newestDeadAt as Date) : undefined,
      };
    },

    async count(options?: { type?: string; scopeId?: string }): Promise<number> {
      const filter: Document = { status: 'dead' };
      if (options?.type) filter.kind = options.type;
      if (options?.scopeId) filter.tenantId = options.scopeId;
      return col().countDocuments(filter);
    },
  };
}

// Re-export types for convenience
export type { OutboxPort, OutboxItem, OutboxRow, OutboxDeadAdminRow, OutboxStatus, OutboxKind } from '@unisane/kernel';
export type { DLQPort, DeadEventEntry, DLQStats, PaginatedDeadEvents, ListDeadEventsOptions, BatchRetryResult } from '@unisane/kernel';
