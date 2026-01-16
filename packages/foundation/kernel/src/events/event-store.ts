/**
 * Event Store
 *
 * Provides a persistent, append-only store for domain events.
 * Enables complete audit trails, event replay, and event sourcing patterns.
 *
 * ## Usage
 *
 * ```typescript
 * import { setEventStoreProvider, appendToEventStore, queryEventStore } from '@unisane/kernel';
 *
 * // Wire up the event store adapter during bootstrap
 * setEventStoreProvider(createMongoEventStoreAdapter(() => db().collection('_events')));
 *
 * // Events are automatically appended when using emitTyped/emitTypedReliable
 * // Or manually append:
 * await appendToEventStore(event);
 *
 * // Query events
 * const events = await queryEventStore({
 *   aggregateId: 'tenant_123',
 *   fromSequence: 0,
 * });
 * ```
 *
 * ## Event Sourcing
 *
 * For event sourcing patterns, use aggregate queries to rebuild state:
 *
 * ```typescript
 * const events = await queryEventStore({
 *   aggregateId: 'order_456',
 *   types: ['order.created', 'order.updated', 'order.shipped'],
 * });
 *
 * const order = events.reduce((state, event) => {
 *   return applyEvent(state, event);
 * }, initialOrderState);
 * ```
 */

import type { DomainEvent, EventMeta } from './types';
import { logger } from '../observability/logger';

// =============================================================================
// Types
// =============================================================================

/**
 * A stored event with additional metadata for querying and replay.
 */
export interface StoredEvent<T = unknown> extends DomainEvent<T> {
  /** Global sequence number for ordering (monotonically increasing) */
  sequence: number;

  /** Aggregate ID for event sourcing (optional) */
  aggregateId?: string;

  /** Aggregate type for grouping (optional) */
  aggregateType?: string;

  /** Version within the aggregate stream */
  aggregateVersion?: number;

  /** When the event was stored */
  storedAt: Date;
}

/**
 * Options for querying the event store.
 */
export interface EventStoreQueryOptions {
  /** Filter by aggregate ID */
  aggregateId?: string;

  /** Filter by aggregate type */
  aggregateType?: string;

  /** Filter by event types */
  types?: string[];

  /** Filter by correlation ID */
  correlationId?: string;

  /** Filter by scope ID */
  scopeId?: string;

  /** Get events from this sequence (inclusive) */
  fromSequence?: number;

  /** Get events up to this sequence (inclusive) */
  toSequence?: number;

  /** Get events since this timestamp */
  since?: Date;

  /** Get events until this timestamp */
  until?: Date;

  /** Maximum number of events to return */
  limit?: number;

  /** Number of events to skip (for pagination) */
  skip?: number;

  /** Sort order: 'asc' or 'desc' (default: 'asc') */
  order?: 'asc' | 'desc';
}

/**
 * Options for event replay.
 */
export interface ReplayOptions {
  /** Starting sequence (inclusive) */
  fromSequence?: number;

  /** Ending sequence (inclusive) */
  toSequence?: number;

  /** Filter by event types */
  types?: string[];

  /** Filter by aggregate ID */
  aggregateId?: string;

  /** Batch size for streaming (default: 100) */
  batchSize?: number;
}

/**
 * Port interface for event store persistence.
 */
export interface EventStorePort {
  /**
   * Append an event to the store.
   * Returns the stored event with its sequence number.
   *
   * @param event - The domain event to store
   * @param options - Optional aggregate information
   * @returns The stored event with sequence number
   */
  append<T>(
    event: DomainEvent<T>,
    options?: {
      aggregateId?: string;
      aggregateType?: string;
      aggregateVersion?: number;
    }
  ): Promise<StoredEvent<T>>;

  /**
   * Query events with filters.
   *
   * @param options - Query options
   * @returns Array of matching events
   */
  query<T = unknown>(options?: EventStoreQueryOptions): Promise<StoredEvent<T>[]>;

  /**
   * Get a single event by its eventId.
   *
   * @param eventId - The event ID
   * @returns The event, or null if not found
   */
  getByEventId<T = unknown>(eventId: string): Promise<StoredEvent<T> | null>;

  /**
   * Get events by aggregate ID.
   * Optimized for event sourcing patterns.
   *
   * @param aggregateId - The aggregate ID
   * @param options - Optional filters
   * @returns Events for the aggregate in order
   */
  getByAggregateId<T = unknown>(
    aggregateId: string,
    options?: { fromVersion?: number; toVersion?: number }
  ): Promise<StoredEvent<T>[]>;

  /**
   * Get events by correlation ID.
   * Useful for tracing related events across services.
   *
   * @param correlationId - The correlation ID
   * @returns Events with this correlation ID
   */
  getByCorrelationId<T = unknown>(correlationId: string): Promise<StoredEvent<T>[]>;

  /**
   * Get the current sequence number (highest stored).
   *
   * @returns The current sequence number, or 0 if empty
   */
  getCurrentSequence(): Promise<number>;

  /**
   * Stream events for replay.
   * Returns an async iterable for memory-efficient processing.
   *
   * @param options - Replay options
   * @returns Async iterable of events
   */
  replay<T = unknown>(options?: ReplayOptions): AsyncIterable<StoredEvent<T>>;

  /**
   * Count events matching the query.
   *
   * @param options - Query options
   * @returns Number of matching events
   */
  count(options?: EventStoreQueryOptions): Promise<number>;
}

// =============================================================================
// Global State
// =============================================================================

/**
 * Global event store provider.
 */
let eventStoreProvider: EventStorePort | null = null;

/**
 * Whether to automatically store events on emit.
 * Default: true when provider is configured.
 */
let autoStoreEnabled = true;

// =============================================================================
// Provider Management
// =============================================================================

/**
 * Set the event store provider.
 * Call this during bootstrap to enable event storage.
 *
 * @param provider - The event store port implementation
 *
 * @example
 * ```typescript
 * import { setEventStoreProvider } from '@unisane/kernel';
 * import { createMongoEventStoreAdapter } from '@unisane/event-store-mongodb';
 *
 * setEventStoreProvider(createMongoEventStoreAdapter({
 *   collection: () => db().collection('_events'),
 * }));
 * ```
 */
export function setEventStoreProvider(provider: EventStorePort): void {
  eventStoreProvider = provider;
  logger.debug('Event store provider configured', { module: 'events' });
}

/**
 * Get the current event store provider.
 * Returns null if not configured.
 */
export function getEventStoreProvider(): EventStorePort | null {
  return eventStoreProvider;
}

/**
 * Check if event store is enabled (provider configured).
 */
export function isEventStoreEnabled(): boolean {
  return eventStoreProvider !== null;
}

/**
 * Clear the event store provider (for testing).
 */
export function clearEventStoreProvider(): void {
  eventStoreProvider = null;
}

/**
 * Enable or disable automatic event storage.
 * When enabled, events emitted via emitTyped/emitTypedReliable are stored.
 *
 * @param enabled - Whether to auto-store events
 */
export function setAutoStoreEnabled(enabled: boolean): void {
  autoStoreEnabled = enabled;
}

/**
 * Check if auto-store is enabled.
 */
export function isAutoStoreEnabled(): boolean {
  return autoStoreEnabled && eventStoreProvider !== null;
}

// =============================================================================
// Event Store API
// =============================================================================

/**
 * Append an event to the event store.
 *
 * @param event - The domain event to store
 * @param options - Optional aggregate information
 * @returns The stored event with sequence number
 * @throws Error if provider not configured
 *
 * @example
 * ```typescript
 * const stored = await appendToEventStore(event, {
 *   aggregateId: 'order_123',
 *   aggregateType: 'Order',
 * });
 * console.log('Stored with sequence:', stored.sequence);
 * ```
 */
export async function appendToEventStore<T>(
  event: DomainEvent<T>,
  options?: {
    aggregateId?: string;
    aggregateType?: string;
    aggregateVersion?: number;
  }
): Promise<StoredEvent<T>> {
  if (!eventStoreProvider) {
    throw new Error('Event store provider not configured. Call setEventStoreProvider() during bootstrap.');
  }
  return eventStoreProvider.append(event, options);
}

/**
 * Query events from the event store.
 *
 * @param options - Query options
 * @returns Array of matching events
 * @throws Error if provider not configured
 *
 * @example
 * ```typescript
 * // Get all tenant events for a scope
 * const events = await queryEventStore({
 *   scopeId: 'tenant_123',
 *   types: ['tenant.created', 'tenant.updated', 'tenant.deleted'],
 *   order: 'asc',
 * });
 * ```
 */
export async function queryEventStore<T = unknown>(
  options?: EventStoreQueryOptions
): Promise<StoredEvent<T>[]> {
  if (!eventStoreProvider) {
    throw new Error('Event store provider not configured. Call setEventStoreProvider() during bootstrap.');
  }
  return eventStoreProvider.query<T>(options);
}

/**
 * Get a single event by its eventId.
 *
 * @param eventId - The event ID
 * @returns The event, or null if not found
 * @throws Error if provider not configured
 */
export async function getEventByEventId<T = unknown>(
  eventId: string
): Promise<StoredEvent<T> | null> {
  if (!eventStoreProvider) {
    throw new Error('Event store provider not configured. Call setEventStoreProvider() during bootstrap.');
  }
  return eventStoreProvider.getByEventId<T>(eventId);
}

/**
 * Get events for an aggregate (event sourcing).
 *
 * @param aggregateId - The aggregate ID
 * @param options - Optional filters
 * @returns Events for the aggregate in order
 * @throws Error if provider not configured
 *
 * @example
 * ```typescript
 * // Rebuild order state from events
 * const events = await getEventsByAggregate('order_456');
 * const order = events.reduce((state, event) => applyEvent(state, event), {});
 * ```
 */
export async function getEventsByAggregate<T = unknown>(
  aggregateId: string,
  options?: { fromVersion?: number; toVersion?: number }
): Promise<StoredEvent<T>[]> {
  if (!eventStoreProvider) {
    throw new Error('Event store provider not configured. Call setEventStoreProvider() during bootstrap.');
  }
  return eventStoreProvider.getByAggregateId<T>(aggregateId, options);
}

/**
 * Get events by correlation ID (tracing).
 *
 * @param correlationId - The correlation ID
 * @returns Events with this correlation ID
 * @throws Error if provider not configured
 *
 * @example
 * ```typescript
 * // Trace all events from a single request
 * const events = await getEventsByCorrelation('req_abc123');
 * ```
 */
export async function getEventsByCorrelation<T = unknown>(
  correlationId: string
): Promise<StoredEvent<T>[]> {
  if (!eventStoreProvider) {
    throw new Error('Event store provider not configured. Call setEventStoreProvider() during bootstrap.');
  }
  return eventStoreProvider.getByCorrelationId<T>(correlationId);
}

/**
 * Get the current (highest) sequence number.
 *
 * @returns The current sequence number
 * @throws Error if provider not configured
 */
export async function getCurrentSequence(): Promise<number> {
  if (!eventStoreProvider) {
    throw new Error('Event store provider not configured. Call setEventStoreProvider() during bootstrap.');
  }
  return eventStoreProvider.getCurrentSequence();
}

/**
 * Replay events for rebuilding state or reprocessing.
 *
 * @param options - Replay options
 * @returns Async iterable of events
 * @throws Error if provider not configured
 *
 * @example
 * ```typescript
 * // Replay all order events to rebuild read model
 * for await (const event of replayEvents({ types: ['order.*'] })) {
 *   await updateReadModel(event);
 * }
 * ```
 */
export async function* replayEvents<T = unknown>(
  options?: ReplayOptions
): AsyncIterable<StoredEvent<T>> {
  if (!eventStoreProvider) {
    throw new Error('Event store provider not configured. Call setEventStoreProvider() during bootstrap.');
  }
  yield* eventStoreProvider.replay<T>(options);
}

/**
 * Count events matching the query.
 *
 * @param options - Query options
 * @returns Number of matching events
 * @throws Error if provider not configured
 */
export async function countEvents(options?: EventStoreQueryOptions): Promise<number> {
  if (!eventStoreProvider) {
    throw new Error('Event store provider not configured. Call setEventStoreProvider() during bootstrap.');
  }
  return eventStoreProvider.count(options);
}

// =============================================================================
// Internal Helper for Auto-Store
// =============================================================================

/**
 * Internal function called by emitter to auto-store events.
 * Only stores if auto-store is enabled.
 *
 * @internal
 */
export async function _autoStoreEvent<T>(
  event: DomainEvent<T>,
  options?: {
    aggregateId?: string;
    aggregateType?: string;
  }
): Promise<void> {
  if (!isAutoStoreEnabled()) {
    return;
  }

  try {
    await eventStoreProvider!.append(event, options);
  } catch (error) {
    // Log but don't fail the emit - event store is best-effort by default
    logger.error('Failed to auto-store event', {
      module: 'events',
      eventId: event.meta.eventId,
      eventType: event.type,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
