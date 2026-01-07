/**
 * Event Registry
 *
 * Central registry for all domain event schemas.
 * Modules register their events here for type-safe emission and handling.
 */

import { z } from 'zod';
import type { EventSchema, InferEventPayload } from './types';

/**
 * Base event schemas for common patterns.
 */
export const BaseSchemas = {
  /** Standard tenant-scoped event */
  tenantEvent: z.object({
    tenantId: z.string(),
  }),

  /** Standard user action event */
  userActionEvent: z.object({
    tenantId: z.string(),
    userId: z.string(),
  }),
} as const;

/**
 * Event registry type - maps event type strings to their Zod schemas.
 * This is initially empty and populated by modules during bootstrap.
 */
const eventSchemas = new Map<string, EventSchema>();

/**
 * Register an event schema.
 * Called by modules to register their event types.
 *
 * @example
 * ```typescript
 * // In billing module bootstrap
 * registerEvent('billing.subscription.created', z.object({
 *   tenantId: z.string(),
 *   planId: z.string(),
 *   providerSubId: z.string(),
 * }));
 * ```
 */
export function registerEvent<T extends EventSchema>(type: string, schema: T): void {
  if (eventSchemas.has(type)) {
    throw new Error(`Event type '${type}' is already registered`);
  }
  eventSchemas.set(type, schema);
}

/**
 * Register multiple events at once.
 *
 * @example
 * ```typescript
 * registerEvents({
 *   'billing.subscription.created': SubscriptionCreatedSchema,
 *   'billing.subscription.cancelled': SubscriptionCancelledSchema,
 * });
 * ```
 */
export function registerEvents(events: Record<string, EventSchema>): void {
  for (const [type, schema] of Object.entries(events)) {
    registerEvent(type, schema);
  }
}

/**
 * Get a registered event schema.
 * Returns undefined if not registered.
 */
export function getEventSchema(type: string): EventSchema | undefined {
  return eventSchemas.get(type);
}

/**
 * Check if an event type is registered.
 */
export function isEventRegistered(type: string): boolean {
  return eventSchemas.has(type);
}

/**
 * Get all registered event types.
 * Useful for debugging and documentation.
 */
export function getRegisteredEvents(): string[] {
  return Array.from(eventSchemas.keys());
}

/**
 * Clear all registered events.
 * Mainly useful for testing.
 */
export function clearEventRegistry(): void {
  eventSchemas.clear();
}

/**
 * Type-safe event type string.
 * In production, you'd typically generate this from the registry.
 */
export type RegisteredEventType = string;

/**
 * Helper to create a typed event definition.
 * Returns both the type string and schema for use in modules.
 *
 * @example
 * ```typescript
 * export const SubscriptionCreatedEvent = defineEvent(
 *   'billing.subscription.created',
 *   z.object({
 *     tenantId: z.string(),
 *     planId: z.string(),
 *   })
 * );
 *
 * // Usage:
 * events.emit(SubscriptionCreatedEvent.type, { tenantId, planId });
 * ```
 */
export function defineEvent<T extends EventSchema>(type: string, schema: T) {
  return {
    type,
    schema,
    /** Convenience method to register this event */
    register: () => registerEvent(type, schema),
  } as const;
}
