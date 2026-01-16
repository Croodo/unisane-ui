/**
 * MongoDB Event Store Adapter
 *
 * Implements the EventStorePort interface using MongoDB for persistence.
 * Provides append-only event storage for audit trails and event sourcing.
 *
 * ## Required Indexes
 *
 * For optimal performance, create these indexes on your event store collection:
 *
 * ```javascript
 * // Primary index for sequence ordering (required)
 * db._events.createIndex(
 *   { sequence: 1 },
 *   { name: 'events_sequence_idx', unique: true }
 * );
 *
 * // Index for eventId lookups
 * db._events.createIndex(
 *   { 'meta.eventId': 1 },
 *   { name: 'events_eventid_idx', unique: true }
 * );
 *
 * // Index for aggregate queries (event sourcing)
 * db._events.createIndex(
 *   { aggregateId: 1, aggregateVersion: 1 },
 *   { name: 'events_aggregate_idx' }
 * );
 *
 * // Index for correlation queries (tracing)
 * db._events.createIndex(
 *   { 'meta.correlationId': 1 },
 *   { name: 'events_correlation_idx' }
 * );
 *
 * // Index for scope queries
 * db._events.createIndex(
 *   { 'meta.scopeId': 1, storedAt: -1 },
 *   { name: 'events_scope_idx' }
 * );
 *
 * // Index for type queries
 * db._events.createIndex(
 *   { type: 1, storedAt: -1 },
 *   { name: 'events_type_idx' }
 * );
 * ```
 *
 * @example
 * ```typescript
 * import { createMongoEventStoreAdapter } from '@unisane/event-store-mongodb';
 * import { setEventStoreProvider } from '@unisane/kernel';
 *
 * setEventStoreProvider(createMongoEventStoreAdapter({
 *   collection: () => db().collection('_events'),
 * }));
 * ```
 */

import type { Collection, Document } from 'mongodb';
import type {
  EventStorePort,
  StoredEvent,
  EventStoreQueryOptions,
  ReplayOptions,
  DomainEvent,
} from '@unisane/kernel';

/**
 * MongoDB document shape for stored events.
 */
interface EventDocument {
  /** Global sequence number */
  sequence: number;
  /** Event type */
  type: string;
  /** Event payload */
  payload: unknown;
  /** Event metadata */
  meta: {
    eventId: string;
    timestamp: string;
    version: number;
    source: string;
    correlationId?: string;
    scopeType?: string;
    scopeId?: string;
  };
  /** Aggregate ID for event sourcing */
  aggregateId?: string;
  /** Aggregate type */
  aggregateType?: string;
  /** Version within the aggregate */
  aggregateVersion?: number;
  /** When the event was stored */
  storedAt: Date;
}

/**
 * Configuration for the MongoDB event store adapter.
 */
export interface MongoEventStoreConfig {
  /**
   * Function that returns the MongoDB collection for events.
   * This allows lazy initialization after database connection.
   */
  collection: () => Collection<EventDocument>;

  /**
   * Default batch size for replay operations.
   * Default: 100
   */
  defaultBatchSize?: number;
}

/**
 * Create an EventStorePort adapter using MongoDB.
 *
 * @param config Configuration options
 * @returns EventStorePort implementation
 *
 * @example
 * ```typescript
 * import { createMongoEventStoreAdapter } from '@unisane/event-store-mongodb';
 * import { setEventStoreProvider } from '@unisane/kernel';
 *
 * setEventStoreProvider(createMongoEventStoreAdapter({
 *   collection: () => db().collection('_events'),
 * }));
 * ```
 */
export function createMongoEventStoreAdapter(
  config: MongoEventStoreConfig
): EventStorePort {
  const { collection, defaultBatchSize = 100 } = config;

  const col = () => collection();

  /**
   * Get the next sequence number atomically.
   * Uses a counter document to ensure uniqueness across concurrent writes.
   */
  async function getNextSequence(): Promise<number> {
    // Use findOneAndUpdate for atomic increment
    // We store the counter in the same collection with a special _id
    const result = await col().findOneAndUpdate(
      { _id: '__sequence_counter__' } as Document,
      { $inc: { value: 1 } } as Document,
      {
        upsert: true,
        returnDocument: 'after',
      }
    );
    return (result as unknown as { value: number })?.value ?? 1;
  }

  /**
   * Build MongoDB filter from query options.
   */
  function buildFilter(options?: EventStoreQueryOptions): Document {
    const filter: Document = {
      // Exclude the sequence counter document
      _id: { $ne: '__sequence_counter__' },
    };

    if (!options) return filter;

    if (options.aggregateId) {
      filter.aggregateId = options.aggregateId;
    }

    if (options.aggregateType) {
      filter.aggregateType = options.aggregateType;
    }

    if (options.types && options.types.length > 0) {
      filter.type = { $in: options.types };
    }

    if (options.correlationId) {
      filter['meta.correlationId'] = options.correlationId;
    }

    if (options.scopeId) {
      filter['meta.scopeId'] = options.scopeId;
    }

    if (options.fromSequence !== undefined || options.toSequence !== undefined) {
      filter.sequence = {};
      if (options.fromSequence !== undefined) {
        filter.sequence.$gte = options.fromSequence;
      }
      if (options.toSequence !== undefined) {
        filter.sequence.$lte = options.toSequence;
      }
    }

    if (options.since || options.until) {
      filter.storedAt = {};
      if (options.since) {
        filter.storedAt.$gte = options.since;
      }
      if (options.until) {
        filter.storedAt.$lte = options.until;
      }
    }

    return filter;
  }

  /**
   * Convert MongoDB document to StoredEvent.
   */
  function toStoredEvent<T>(doc: EventDocument): StoredEvent<T> {
    return {
      type: doc.type,
      payload: doc.payload as T,
      meta: doc.meta,
      sequence: doc.sequence,
      aggregateId: doc.aggregateId,
      aggregateType: doc.aggregateType,
      aggregateVersion: doc.aggregateVersion,
      storedAt: doc.storedAt,
    };
  }

  return {
    async append<T>(
      event: DomainEvent<T>,
      options?: {
        aggregateId?: string;
        aggregateType?: string;
        aggregateVersion?: number;
      }
    ): Promise<StoredEvent<T>> {
      const now = new Date();
      const sequence = await getNextSequence();

      const doc: EventDocument = {
        sequence,
        type: event.type,
        payload: event.payload,
        meta: event.meta,
        storedAt: now,
        ...(options?.aggregateId ? { aggregateId: options.aggregateId } : {}),
        ...(options?.aggregateType ? { aggregateType: options.aggregateType } : {}),
        ...(options?.aggregateVersion !== undefined
          ? { aggregateVersion: options.aggregateVersion }
          : {}),
      };

      await col().insertOne(doc as EventDocument);

      return toStoredEvent<T>(doc);
    },

    async query<T = unknown>(
      options?: EventStoreQueryOptions
    ): Promise<StoredEvent<T>[]> {
      const filter = buildFilter(options);
      const sort = options?.order === 'desc' ? { sequence: -1 } : { sequence: 1 };

      let cursor = col()
        .find(filter)
        .sort(sort as Document);

      if (options?.skip) {
        cursor = cursor.skip(options.skip);
      }

      if (options?.limit) {
        cursor = cursor.limit(options.limit);
      }

      const docs = await cursor.toArray();

      return docs.map((doc) => toStoredEvent<T>(doc as EventDocument));
    },

    async getByEventId<T = unknown>(eventId: string): Promise<StoredEvent<T> | null> {
      const doc = await col().findOne({
        'meta.eventId': eventId,
        _id: { $ne: '__sequence_counter__' },
      } as Document);

      if (!doc) return null;
      return toStoredEvent<T>(doc as EventDocument);
    },

    async getByAggregateId<T = unknown>(
      aggregateId: string,
      options?: { fromVersion?: number; toVersion?: number }
    ): Promise<StoredEvent<T>[]> {
      const filter: Document = {
        aggregateId,
        _id: { $ne: '__sequence_counter__' },
      };

      if (options?.fromVersion !== undefined || options?.toVersion !== undefined) {
        filter.aggregateVersion = {};
        if (options?.fromVersion !== undefined) {
          filter.aggregateVersion.$gte = options.fromVersion;
        }
        if (options?.toVersion !== undefined) {
          filter.aggregateVersion.$lte = options.toVersion;
        }
      }

      const docs = await col()
        .find(filter)
        .sort({ aggregateVersion: 1 } as Document)
        .toArray();

      return docs.map((doc) => toStoredEvent<T>(doc as EventDocument));
    },

    async getByCorrelationId<T = unknown>(
      correlationId: string
    ): Promise<StoredEvent<T>[]> {
      const docs = await col()
        .find({
          'meta.correlationId': correlationId,
          _id: { $ne: '__sequence_counter__' },
        } as Document)
        .sort({ sequence: 1 } as Document)
        .toArray();

      return docs.map((doc) => toStoredEvent<T>(doc as EventDocument));
    },

    async getCurrentSequence(): Promise<number> {
      const counter = await col().findOne({
        _id: '__sequence_counter__',
      } as Document);
      return (counter as unknown as { value?: number })?.value ?? 0;
    },

    async *replay<T = unknown>(
      options?: ReplayOptions
    ): AsyncIterable<StoredEvent<T>> {
      const batchSize = options?.batchSize ?? defaultBatchSize;
      let fromSequence = options?.fromSequence ?? 0;
      const toSequence = options?.toSequence;

      while (true) {
        const filter: Document = {
          sequence: { $gte: fromSequence },
          _id: { $ne: '__sequence_counter__' },
        };

        if (toSequence !== undefined) {
          filter.sequence.$lte = toSequence;
        }

        if (options?.types && options.types.length > 0) {
          filter.type = { $in: options.types };
        }

        if (options?.aggregateId) {
          filter.aggregateId = options.aggregateId;
        }

        const docs = await col()
          .find(filter)
          .sort({ sequence: 1 } as Document)
          .limit(batchSize)
          .toArray();

        if (docs.length === 0) {
          break;
        }

        for (const doc of docs) {
          yield toStoredEvent<T>(doc as EventDocument);
        }

        // Set the next batch starting point
        const lastDoc = docs[docs.length - 1] as EventDocument;
        fromSequence = lastDoc.sequence + 1;

        // If we got fewer than batchSize, we've reached the end
        if (docs.length < batchSize) {
          break;
        }

        // If we've passed toSequence, stop
        if (toSequence !== undefined && lastDoc.sequence >= toSequence) {
          break;
        }
      }
    },

    async count(options?: EventStoreQueryOptions): Promise<number> {
      const filter = buildFilter(options);
      return col().countDocuments(filter);
    },
  };
}

// Re-export types for convenience
export type {
  EventStorePort,
  StoredEvent,
  EventStoreQueryOptions,
  ReplayOptions,
} from '@unisane/kernel';
