/**
 * Event Schema Registry
 *
 * Central registry of all domain event schemas across modules.
 * This provides:
 * - Compile-time type safety for event payloads
 * - Runtime validation via Zod
 * - Single source of truth for event documentation
 *
 * Usage:
 * ```typescript
 * import { EventSchemas, emitTyped } from '@unisane/kernel';
 *
 * // Type-safe emission
 * await emitTyped('tenant.created', {
 *   scopeId: 'tenant_123',
 *   slug: 'my-company',
 *   name: 'My Company',
 *   ownerId: 'user_456',
 * });
 * ```
 */

import { z } from 'zod';
import { BillingEventSchemas } from './billing-events';
import { ZUserDeletionReason, ZMembershipRemovalReason } from '../constants/identity';

// ============================================================================
// Base Schemas (common patterns)
// ============================================================================

/** Universal scoped event payload - works with any scope type */
export const ScopedEventSchema = z.object({
  scopeId: z.string(),
  scopeType: z.enum(['tenant', 'user', 'merchant', 'organization']).optional(),
});

/** Standard user action event payload */
export const UserActionEventSchema = z.object({
  scopeId: z.string(),
  userId: z.string(),
});

// ============================================================================
// Tenant Events
// ============================================================================

export const TenantCreatedSchema = z.object({
  scopeId: z.string(),
  slug: z.string(),
  name: z.string(),
  ownerId: z.string(),
});

export const TenantUpdatedSchema = z.object({
  scopeId: z.string(),
  changes: z.record(z.unknown()).optional(),
});

export const TenantDeletedSchema = z.object({
  scopeId: z.string(),
  actorId: z.string().optional(),
  timestamp: z.string(), // ISO 8601
});

export const TenantMemberAddedSchema = z.object({
  scopeId: z.string(),
  userId: z.string(),
  roleId: z.string(),
  invitedBy: z.string().optional(),
});

export const TenantMemberRemovedSchema = z.object({
  scopeId: z.string(),
  userId: z.string(),
  removedBy: z.string().optional(),
});

export const TenantMemberRoleChangedSchema = z.object({
  scopeId: z.string(),
  userId: z.string(),
  oldRoleId: z.string().optional(),
  newRoleId: z.string(),
  changedBy: z.string().optional(),
});

export const TenantInvitationCreatedSchema = z.object({
  scopeId: z.string(),
  email: z.string(),
  roleId: z.string(),
  invitedBy: z.string(),
  expiresAt: z.string(),
});

export const TenantInvitationAcceptedSchema = z.object({
  scopeId: z.string(),
  userId: z.string(),
  email: z.string(),
});

export const TenantInvitationRevokedSchema = z.object({
  scopeId: z.string(),
  email: z.string(),
  revokedBy: z.string(),
});

// ============================================================================
// Identity Events
// ============================================================================

export const MembershipRoleChangedSchema = z.object({
  scopeId: z.string(),
  userId: z.string(),
  roleId: z.string(),
  changedBy: z.string().optional(),
});

export const ApiKeyCreatedSchema = z.object({
  scopeId: z.string(),
  keyId: z.string(),
  scopes: z.array(z.string()),
  createdBy: z.string().optional(),
});

export const ApiKeyRevokedSchema = z.object({
  scopeId: z.string(),
  keyId: z.string(),
  revokedBy: z.string().optional(),
});

// ============================================================================
// Storage Events
// ============================================================================

export const StorageUploadRequestedSchema = z.object({
  scopeId: z.string(),
  fileId: z.string(),
  key: z.string(),
  filename: z.string(),
  contentType: z.string(),
  size: z.number().optional(),
});

export const StorageUploadConfirmedSchema = z.object({
  scopeId: z.string(),
  fileId: z.string(),
  key: z.string(),
  size: z.number(),
});

export const StorageFileDeletedSchema = z.object({
  scopeId: z.string(),
  fileId: z.string(),
  key: z.string(),
});

export const StorageFilePurgedSchema = z.object({
  scopeId: z.string(),
  fileId: z.string(),
  key: z.string(),
});

export const StorageCleanupOrphanedSchema = z.object({
  count: z.number(),
  olderThanMs: z.number(),
});

export const StorageCleanupDeletedSchema = z.object({
  count: z.number(),
  olderThanMs: z.number(),
});

// ============================================================================
// Billing Events
// ============================================================================

export const SubscriptionCreatedSchema = z.object({
  scopeId: z.string(),
  planId: z.string(),
  providerSubId: z.string().optional(),
});

export const SubscriptionCancelledSchema = z.object({
  scopeId: z.string(),
  atPeriodEnd: z.boolean(),
});

export const SubscriptionUpdatedSchema = z.object({
  scopeId: z.string(),
  planId: z.string(),
  previousPlanId: z.string().optional(),
});

export const PaymentSucceededSchema = z.object({
  scopeId: z.string(),
  amount: z.number(),
  currency: z.string(),
  invoiceId: z.string().optional(),
});

export const PaymentFailedSchema = z.object({
  scopeId: z.string(),
  amount: z.number(),
  currency: z.string(),
  reason: z.string().optional(),
});

// ============================================================================
// Credits Events
// ============================================================================

export const CreditsGrantedSchema = z.object({
  scopeId: z.string(),
  amount: z.number(),
  reason: z.string(),
  source: z.enum(['subscription', 'topup', 'promo', 'manual']).optional(),
  expiresAt: z.string().optional(),
});

export const CreditsConsumedSchema = z.object({
  scopeId: z.string(),
  amount: z.number(),
  reason: z.string(),
  feature: z.string().optional(),
  remaining: z.number().optional(),
});

export const CreditsExpiredSchema = z.object({
  scopeId: z.string(),
  amount: z.number(),
  expiredAt: z.string(),
});

// ============================================================================
// Usage Events
// ============================================================================

export const UsageIncrementedSchema = z.object({
  scopeId: z.string(),
  feature: z.string(),
  amount: z.number(),
  total: z.number().optional(),
});

export const UsageLimitReachedSchema = z.object({
  scopeId: z.string(),
  feature: z.string(),
  limit: z.number(),
  current: z.number(),
});

// ============================================================================
// Notify Events
// ============================================================================

export const NotificationSentSchema = z.object({
  scopeId: z.string(),
  userId: z.string(),
  notificationId: z.string(),
  type: z.string(),
  channel: z.enum(['inapp', 'email', 'push', 'sms']).optional(),
});

export const NotificationReadSchema = z.object({
  scopeId: z.string(),
  userId: z.string(),
  notificationId: z.string(),
});

export const NotificationPrefsUpdatedSchema = z.object({
  scopeId: z.string(),
  userId: z.string(),
  categories: z.record(z.boolean()),
});

export const EmailSuppressionRequestedSchema = z.object({
  email: z.string(),
  reason: z.string(),
  provider: z.string(),
  scopeId: z.string().nullable(),
});

// ============================================================================
// Settings Events
// ============================================================================

export const SettingCreatedSchema = z.object({
  scopeId: z.string(),
  key: z.string(),
  scope: z.enum(['tenant', 'user', 'global']).optional(),
});

export const SettingUpdatedSchema = z.object({
  scopeId: z.string(),
  key: z.string(),
  oldValue: z.unknown().optional(),
  newValue: z.unknown(),
});

export const SettingDeletedSchema = z.object({
  scopeId: z.string(),
  key: z.string(),
});

// ============================================================================
// Cascade Completion Events (Event-Driven Architecture)
// ============================================================================

/** Emitted when Identity module completes cascade operations */
export const IdentityCascadeCompletedSchema = z.object({
  sourceEvent: z.string(),
  scopeId: z.string(),
  results: z.object({
    apiKeysRevoked: z.number(),
    membershipsDeleted: z.number(),
  }),
});

/** Emitted when Storage module completes cascade operations */
// STOR-004 FIX: Added success and error fields to track cascade failures
export const StorageCascadeCompletedSchema = z.object({
  sourceEvent: z.string(),
  scopeId: z.string(),
  results: z.object({
    filesMarked: z.number(),
    success: z.boolean().optional(),
    error: z.string().optional(),
  }),
});

/** Emitted when Settings module completes cascade operations */
export const SettingsCascadeCompletedSchema = z.object({
  sourceEvent: z.string(),
  scopeId: z.string(),
  results: z.object({
    settingsDeleted: z.number(),
  }),
});

/** User deleted event for cascade triggers */
export const UserDeletedSchema = z.object({
  userId: z.string(),
  scopeId: z.string().optional(),
  actorId: z.string().optional(),
  reason: ZUserDeletionReason,
});

/** Member removed event for cascade triggers */
export const MemberRemovedSchema = z.object({
  membershipId: z.string(),
  userId: z.string(),
  scopeId: z.string(),
  removedBy: z.string().optional(),
  reason: ZMembershipRemovalReason,
});

/** Plan changed event for cascade triggers */
export const PlanChangedSchema = z.object({
  scopeId: z.string(),
  previousPlan: z.string(),
  newPlan: z.string(),
  changeType: z.enum(['upgrade', 'downgrade', 'lateral']),
  effectiveAt: z.string(),
});

// ============================================================================
// Auth Events (for event-driven side effects)
// ============================================================================

/**
 * OAuth profile backfill event.
 * Emitted when OAuth exchange completes to update user profile fields.
 * This allows the auth→identity profile update to be event-driven (fire-and-forget).
 */
export const AuthOauthProfileBackfillSchema = z.object({
  userId: z.string(),
  provider: z.string(),
  authUserId: z.string(),
  displayName: z.string().optional(),
});

// ============================================================================
// Webhook Events
// ============================================================================

export const WebhookReplayedSchema = z.object({
  scopeId: z.string(),
  eventId: z.string(),
  target: z.string(),
});

export const WebhookDeliveredSchema = z.object({
  scopeId: z.string(),
  webhookId: z.string(),
  eventType: z.string(),
  statusCode: z.number(),
});

export const WebhookFailedSchema = z.object({
  scopeId: z.string(),
  webhookId: z.string(),
  eventType: z.string(),
  error: z.string(),
  attempt: z.number(),
});

// ============================================================================
// Event Schema Map
// ============================================================================

/**
 * Master registry of all event schemas.
 * Maps event type strings to their Zod schemas.
 */
export const EventSchemas = {
  // Tenant events
  'tenant.created': TenantCreatedSchema,
  'tenant.updated': TenantUpdatedSchema,
  'tenant.deleted': TenantDeletedSchema,
  'tenant.member.added': TenantMemberAddedSchema,
  'tenant.member.removed': TenantMemberRemovedSchema,
  'tenant.member.role_changed': TenantMemberRoleChangedSchema,
  'tenant.invitation.created': TenantInvitationCreatedSchema,
  'tenant.invitation.accepted': TenantInvitationAcceptedSchema,
  'tenant.invitation.revoked': TenantInvitationRevokedSchema,

  // Identity events
  'identity.membership.role_changed': MembershipRoleChangedSchema,
  'identity.apikey.created': ApiKeyCreatedSchema,
  'identity.apikey.revoked': ApiKeyRevokedSchema,

  // Storage events
  'storage.upload.requested': StorageUploadRequestedSchema,
  'storage.upload.confirmed': StorageUploadConfirmedSchema,
  'storage.file.deleted': StorageFileDeletedSchema,
  'storage.file.purged': StorageFilePurgedSchema,
  'storage.cleanup.orphaned': StorageCleanupOrphanedSchema,
  'storage.cleanup.deleted': StorageCleanupDeletedSchema,

  // Billing events
  'billing.subscription.created': SubscriptionCreatedSchema,
  'billing.subscription.cancelled': SubscriptionCancelledSchema,
  'billing.subscription.updated': SubscriptionUpdatedSchema,
  'billing.payment.succeeded': PaymentSucceededSchema,
  'billing.payment.failed': PaymentFailedSchema,

  // Credits events
  'credits.granted': CreditsGrantedSchema,
  'credits.consumed': CreditsConsumedSchema,
  'credits.expired': CreditsExpiredSchema,

  // Usage events
  'usage.incremented': UsageIncrementedSchema,
  'usage.limit_reached': UsageLimitReachedSchema,

  // Notify events
  'notify.sent': NotificationSentSchema,
  'notify.read': NotificationReadSchema,
  'notify.prefs_updated': NotificationPrefsUpdatedSchema,
  'notify.email_suppression_requested': EmailSuppressionRequestedSchema,

  // Settings events
  'settings.created': SettingCreatedSchema,
  'settings.updated': SettingUpdatedSchema,
  'settings.deleted': SettingDeletedSchema,

  // Webhook events
  'webhooks.replayed': WebhookReplayedSchema,
  'webhooks.delivered': WebhookDeliveredSchema,
  'webhooks.failed': WebhookFailedSchema,

  // Cascade completion events (event-driven architecture)
  'identity.cascade.completed': IdentityCascadeCompletedSchema,
  'storage.cascade.completed': StorageCascadeCompletedSchema,
  'settings.cascade.completed': SettingsCascadeCompletedSchema,

  // User lifecycle events
  'user.deleted': UserDeletedSchema,
  'membership.removed': MemberRemovedSchema,
  'plan.changed': PlanChangedSchema,

  // Auth events (for event-driven side effects)
  'auth.oauth.profile_backfill': AuthOauthProfileBackfillSchema,

  // Billing integration events (for event-driven decoupling)
  ...BillingEventSchemas,
} as const;

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * All registered event type strings.
 */
export type EventType = keyof typeof EventSchemas;

/**
 * Infer the payload type for a specific event.
 *
 * @example
 * ```typescript
 * type TenantCreatedPayload = EventPayload<'tenant.created'>;
 * // { tenantId: string; slug: string; name: string; ownerId: string }
 * ```
 */
export type EventPayload<T extends EventType> = z.infer<typeof EventSchemas[T]>;

/**
 * Union of all event payloads.
 */
export type AnyEventPayload = EventPayload<EventType>;

// ============================================================================
// Registration Helper
// ============================================================================

/**
 * Register all event schemas with the event registry.
 * Call this during application bootstrap.
 *
 * @example
 * ```typescript
 * import { registerAllEventSchemas } from '@unisane/kernel';
 *
 * // In bootstrap.ts
 * await registerAllEventSchemas();
 * ```
 */
export async function registerAllEventSchemas(): Promise<void> {
  // Dynamic import to avoid circular dependencies (ESM-compatible)
  const { registerEvents } = await import('./registry');
  registerEvents(EventSchemas);
}

/**
 * Get the schema for a specific event type.
 * Returns undefined if the event type is not in the registry.
 */
export function getSchema<T extends EventType>(type: T): typeof EventSchemas[T] {
  return EventSchemas[type];
}

/**
 * Check if a string is a valid event type.
 */
export function isValidEventType(type: string): type is EventType {
  return type in EventSchemas;
}

/**
 * Get all registered event types grouped by module.
 */
export function getEventTypesByModule(): Record<string, EventType[]> {
  const byModule: Record<string, EventType[]> = {};

  for (const type of Object.keys(EventSchemas) as EventType[]) {
    const parts = type.split('.');
    const moduleName = parts[0] ?? 'unknown';
    if (!byModule[moduleName]) {
      byModule[moduleName] = [];
    }
    byModule[moduleName].push(type);
  }

  return byModule;
}
