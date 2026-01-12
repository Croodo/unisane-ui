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
 *   tenantId: 'tenant_123',
 *   slug: 'my-company',
 *   name: 'My Company',
 *   ownerId: 'user_456',
 * });
 * ```
 */

import { z } from 'zod';

// ============================================================================
// Base Schemas (common patterns)
// ============================================================================

/** Standard tenant-scoped event payload */
export const TenantEventSchema = z.object({
  tenantId: z.string(),
});

/** Standard user action event payload */
export const UserActionEventSchema = z.object({
  tenantId: z.string(),
  userId: z.string(),
});

// ============================================================================
// Tenant Events
// ============================================================================

export const TenantCreatedSchema = z.object({
  tenantId: z.string(),
  slug: z.string(),
  name: z.string(),
  ownerId: z.string(),
});

export const TenantUpdatedSchema = z.object({
  tenantId: z.string(),
  changes: z.record(z.unknown()).optional(),
});

export const TenantDeletedSchema = z.object({
  tenantId: z.string(),
  actorId: z.string(),
  cascade: z.object({
    memberships: z.number(),
    files: z.number(),
    settings: z.number(),
    credentials: z.number(),
  }),
});

export const TenantMemberAddedSchema = z.object({
  tenantId: z.string(),
  userId: z.string(),
  roleId: z.string(),
  invitedBy: z.string().optional(),
});

export const TenantMemberRemovedSchema = z.object({
  tenantId: z.string(),
  userId: z.string(),
  removedBy: z.string().optional(),
});

export const TenantMemberRoleChangedSchema = z.object({
  tenantId: z.string(),
  userId: z.string(),
  oldRoleId: z.string().optional(),
  newRoleId: z.string(),
  changedBy: z.string().optional(),
});

export const TenantInvitationCreatedSchema = z.object({
  tenantId: z.string(),
  email: z.string(),
  roleId: z.string(),
  invitedBy: z.string(),
  expiresAt: z.string(),
});

export const TenantInvitationAcceptedSchema = z.object({
  tenantId: z.string(),
  userId: z.string(),
  email: z.string(),
});

export const TenantInvitationRevokedSchema = z.object({
  tenantId: z.string(),
  email: z.string(),
  revokedBy: z.string(),
});

// ============================================================================
// Identity Events
// ============================================================================

export const MembershipRoleChangedSchema = z.object({
  tenantId: z.string(),
  userId: z.string(),
  roleId: z.string(),
  changedBy: z.string().optional(),
});

export const ApiKeyCreatedSchema = z.object({
  tenantId: z.string(),
  keyId: z.string(),
  scopes: z.array(z.string()),
  createdBy: z.string().optional(),
});

export const ApiKeyRevokedSchema = z.object({
  tenantId: z.string(),
  keyId: z.string(),
  revokedBy: z.string().optional(),
});

// ============================================================================
// Storage Events
// ============================================================================

export const StorageUploadRequestedSchema = z.object({
  tenantId: z.string(),
  fileId: z.string(),
  key: z.string(),
  filename: z.string(),
  contentType: z.string(),
  size: z.number().optional(),
});

export const StorageUploadConfirmedSchema = z.object({
  tenantId: z.string(),
  fileId: z.string(),
  key: z.string(),
  size: z.number(),
});

export const StorageFileDeletedSchema = z.object({
  tenantId: z.string(),
  fileId: z.string(),
  key: z.string(),
});

export const StorageFilePurgedSchema = z.object({
  tenantId: z.string(),
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
  tenantId: z.string(),
  planId: z.string(),
  providerSubId: z.string().optional(),
});

export const SubscriptionCancelledSchema = z.object({
  tenantId: z.string(),
  atPeriodEnd: z.boolean(),
});

export const SubscriptionUpdatedSchema = z.object({
  tenantId: z.string(),
  planId: z.string(),
  previousPlanId: z.string().optional(),
});

export const PaymentSucceededSchema = z.object({
  tenantId: z.string(),
  amount: z.number(),
  currency: z.string(),
  invoiceId: z.string().optional(),
});

export const PaymentFailedSchema = z.object({
  tenantId: z.string(),
  amount: z.number(),
  currency: z.string(),
  reason: z.string().optional(),
});

// ============================================================================
// Credits Events
// ============================================================================

export const CreditsGrantedSchema = z.object({
  tenantId: z.string(),
  amount: z.number(),
  reason: z.string(),
  source: z.enum(['subscription', 'topup', 'promo', 'manual']).optional(),
  expiresAt: z.string().optional(),
});

export const CreditsConsumedSchema = z.object({
  tenantId: z.string(),
  amount: z.number(),
  reason: z.string(),
  feature: z.string().optional(),
  remaining: z.number().optional(),
});

export const CreditsExpiredSchema = z.object({
  tenantId: z.string(),
  amount: z.number(),
  expiredAt: z.string(),
});

// ============================================================================
// Usage Events
// ============================================================================

export const UsageIncrementedSchema = z.object({
  tenantId: z.string(),
  feature: z.string(),
  amount: z.number(),
  total: z.number().optional(),
});

export const UsageLimitReachedSchema = z.object({
  tenantId: z.string(),
  feature: z.string(),
  limit: z.number(),
  current: z.number(),
});

// ============================================================================
// Notify Events
// ============================================================================

export const NotificationSentSchema = z.object({
  tenantId: z.string(),
  userId: z.string(),
  notificationId: z.string(),
  type: z.string(),
  channel: z.enum(['inapp', 'email', 'push', 'sms']).optional(),
});

export const NotificationReadSchema = z.object({
  tenantId: z.string(),
  userId: z.string(),
  notificationId: z.string(),
});

export const NotificationPrefsUpdatedSchema = z.object({
  tenantId: z.string(),
  userId: z.string(),
  categories: z.record(z.boolean()),
});

// ============================================================================
// Settings Events
// ============================================================================

export const SettingCreatedSchema = z.object({
  tenantId: z.string(),
  key: z.string(),
  scope: z.enum(['tenant', 'user', 'global']).optional(),
});

export const SettingUpdatedSchema = z.object({
  tenantId: z.string(),
  key: z.string(),
  oldValue: z.unknown().optional(),
  newValue: z.unknown(),
});

export const SettingDeletedSchema = z.object({
  tenantId: z.string(),
  key: z.string(),
});

// ============================================================================
// Webhook Events
// ============================================================================

export const WebhookReplayedSchema = z.object({
  tenantId: z.string(),
  eventId: z.string(),
  target: z.string(),
});

export const WebhookDeliveredSchema = z.object({
  tenantId: z.string(),
  webhookId: z.string(),
  eventType: z.string(),
  statusCode: z.number(),
});

export const WebhookFailedSchema = z.object({
  tenantId: z.string(),
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

  // Settings events
  'settings.created': SettingCreatedSchema,
  'settings.updated': SettingUpdatedSchema,
  'settings.deleted': SettingDeletedSchema,

  // Webhook events
  'webhooks.replayed': WebhookReplayedSchema,
  'webhooks.delivered': WebhookDeliveredSchema,
  'webhooks.failed': WebhookFailedSchema,
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
 * registerAllEventSchemas();
 * ```
 */
export function registerAllEventSchemas(): void {
  // Lazy import to avoid circular dependencies
  const { registerEvents } = require('./registry');
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
