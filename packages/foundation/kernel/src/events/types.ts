/**
 * Event System Types
 *
 * Defines the core types for the typed event system.
 */

import type { z } from 'zod';

/**
 * Metadata that accompanies every event.
 */
export interface EventMeta {
  /** Unique identifier for this event */
  eventId: string;
  /** ISO timestamp when event was created */
  timestamp: string;
  /** Schema version for this event type */
  version: number;
  /** Service/module that emitted the event */
  source: string;
  /** Request ID for tracing (from context) */
  correlationId?: string;
  /** Scope type (tenant, user, merchant, etc.) */
  scopeType?: string;
  /** Scope ID (from context) - universal identifier for the scope */
  scopeId?: string;
}

/**
 * A typed domain event with payload and metadata.
 */
export interface DomainEvent<T = unknown> {
  /** Event type identifier (e.g., 'billing.subscription.created') */
  type: string;
  /** Event payload (validated against schema) */
  payload: T;
  /** Event metadata */
  meta: EventMeta;
}

/**
 * Event handler function type.
 */
export type EventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void>;

/**
 * Outbox entry for reliable event delivery.
 */
export interface OutboxEntry<T = unknown> extends DomainEvent<T> {
  /** Processing status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** Number of delivery attempts */
  attempts: number;
  /** Last error message if failed */
  lastError?: string;
  /** When to retry next */
  nextRetryAt?: Date;
  /** When the entry was created */
  createdAt: Date;
  /** When the entry was last updated */
  updatedAt: Date;
}

/**
 * Event schema definition for the registry.
 */
export type EventSchema = z.ZodType<unknown>;

/**
 * Type helper to extract payload type from a schema.
 */
export type InferEventPayload<T extends EventSchema> = z.infer<T>;
