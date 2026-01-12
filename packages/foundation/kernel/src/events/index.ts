/**
 * Events Module
 *
 * Provides a typed event system for domain events with:
 * - Type-safe event emission with Zod schema validation
 * - Synchronous (fire-and-forget) and reliable (outbox) delivery modes
 * - Event subscription with type-safe handlers
 * - Context-aware event metadata (requestId, tenantId)
 *
 * @example
 * ```typescript
 * import { events, registerEvent, defineEvent } from '@unisane/kernel';
 * import { z } from 'zod';
 *
 * // Option 1: Register events directly
 * registerEvent('billing.subscription.created', z.object({
 *   tenantId: z.string(),
 *   planId: z.string(),
 * }));
 *
 * // Option 2: Define and register together
 * const SubscriptionCreated = defineEvent('billing.subscription.created', z.object({
 *   tenantId: z.string(),
 *   planId: z.string(),
 * }));
 * SubscriptionCreated.register();
 *
 * // Emit events
 * await events.emit('billing.subscription.created', {
 *   tenantId: 'tenant_123',
 *   planId: 'pro',
 * });
 *
 * // Subscribe to events
 * events.on('billing.subscription.created', async (event) => {
 *   console.log('New subscription for tenant:', event.payload.tenantId);
 * });
 * ```
 */

// Types
export type {
  EventMeta,
  DomainEvent,
  EventHandler,
  OutboxEntry,
  EventSchema,
  InferEventPayload,
} from './types';

// Registry
export {
  registerEvent,
  registerEvents,
  getEventSchema,
  isEventRegistered,
  getRegisteredEvents,
  clearEventRegistry,
  defineEvent,
  BaseSchemas,
} from './registry';
export type { RegisteredEventType } from './registry';

// Emitter
export {
  events,
  setOutboxAccessor,
  setMaxHandlersPerType,
  getHandlerStats,
  hasHandlerLeakRisk,
  UnregisteredEventError,
  EventValidationError,
} from './emitter';

// Outbox Worker
export { createOutboxWorker } from './outbox-worker';
export type { OutboxWorkerOptions, OutboxWorker } from './outbox-worker';

// Event Schemas - Central registry of all event types and their schemas
export {
  EventSchemas,
  registerAllEventSchemas,
  getSchema,
  isValidEventType,
  getEventTypesByModule,
  // Base schemas
  TenantEventSchema,
  UserActionEventSchema,
  // Individual schemas for direct import if needed
  TenantCreatedSchema,
  TenantDeletedSchema,
  StorageUploadRequestedSchema,
  StorageUploadConfirmedSchema,
  CreditsGrantedSchema,
  CreditsConsumedSchema,
} from './schemas';
export type { EventType, EventPayload, AnyEventPayload } from './schemas';

// Typed event emission helpers
export { emitTyped, emitTypedReliable, onTyped } from './typed-emitter';
