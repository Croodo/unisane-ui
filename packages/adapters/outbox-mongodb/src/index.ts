/**
 * MongoDB Outbox Adapter
 *
 * Implements the OutboxPort interface using MongoDB.
 * Provides reliable transactional outbox pattern for email/webhook delivery.
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

import type { Collection, Document, ObjectId } from 'mongodb';
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
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collection: () => Collection<any>;

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
  // Import ObjectId dynamically to avoid issues
  try {
    const { ObjectId } = require('mongodb');
    if (ObjectId.isValid(id)) {
      return new ObjectId(id);
    }
  } catch {
    // Fall back to string
  }
  return id;
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
      const result = await col().insertOne(doc as Document);
      return { ok: true as const, id: String(result.insertedId) };
    },

    async claimBatch(now: Date, limit: number): Promise<OutboxRow[]> {
      const docs = await col()
        .find({ status: 'queued', nextAttemptAt: { $lte: now } } as Document)
        .sort({ nextAttemptAt: 1 })
        .limit(limit)
        .toArray();

      const ids = docs.map((d) => d._id).filter(Boolean);
      if (ids.length) {
        await col().updateMany(
          { _id: { $in: ids } } as Document,
          { $set: { status: 'delivering' } } as Document
        );
      }

      return docs.map((d) => ({
        id: String(d._id),
        ...(d.tenantId !== undefined ? { tenantId: d.tenantId } : {}),
        kind: d.kind,
        payload: d.payload,
        status: d.status,
        attempts: d.attempts ?? 0,
        nextAttemptAt: d.nextAttemptAt ?? null,
      }));
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
      const delaySec = Math.min(maxDelaySec, Math.pow(2, attempts) * baseDelaySec);
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

      // Build query with cursor support
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let filter: any = { status: 'dead' };

      if (args.cursor) {
        // Decode cursor (base64 encoded JSON with updatedAt + _id)
        try {
          const decoded = JSON.parse(Buffer.from(args.cursor, 'base64').toString('utf8'));
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
        } catch {
          // Invalid cursor, ignore
        }
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

// Re-export types for convenience
export type { OutboxPort, OutboxItem, OutboxRow, OutboxDeadAdminRow, OutboxStatus, OutboxKind } from '@unisane/kernel';
