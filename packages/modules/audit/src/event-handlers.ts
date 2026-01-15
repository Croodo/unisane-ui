/**
 * Audit Module Event Handlers
 *
 * This file contains event handlers that allow the audit module to automatically
 * log events from other modules. This achieves loose coupling as part of the
 * hexagonal architecture.
 *
 * Usage:
 * ```typescript
 * import { registerAuditEventHandlers } from '@unisane/audit';
 *
 * // In bootstrap.ts
 * registerAuditEventHandlers();
 * ```
 */

import { logger, onTyped } from '@unisane/kernel';
import { appendAudit } from './service/append';

const log = logger.child({ module: 'audit', component: 'event-handlers' });

/**
 * Log tenant creation
 */
async function handleTenantCreated(
  payload: { scopeId: string; slug: string; name: string; ownerId: string }
): Promise<void> {
  await appendAudit({
    scopeId: payload.scopeId,
    actorId: payload.ownerId,
    action: 'tenant.created',
    resourceType: 'tenant',
    resourceId: payload.scopeId,
    after: { slug: payload.slug, name: payload.name },
  });
}

/**
 * Log tenant update
 */
async function handleTenantUpdated(
  payload: { scopeId: string; changes?: Record<string, unknown> }
): Promise<void> {
  await appendAudit({
    scopeId: payload.scopeId,
    action: 'tenant.updated',
    resourceType: 'tenant',
    resourceId: payload.scopeId,
    after: payload.changes,
  });
}

/**
 * Log tenant deletion
 */
async function handleTenantDeleted(
  payload: { scopeId: string; actorId: string; cascade: Record<string, number> }
): Promise<void> {
  await appendAudit({
    scopeId: payload.scopeId,
    actorId: payload.actorId,
    action: 'tenant.deleted',
    resourceType: 'tenant',
    resourceId: payload.scopeId,
    after: { cascade: payload.cascade },
  });
}

/**
 * Log member addition
 */
async function handleMemberAdded(
  payload: { scopeId: string; userId: string; roleId: string; invitedBy?: string }
): Promise<void> {
  await appendAudit({
    scopeId: payload.scopeId,
    actorId: payload.invitedBy,
    action: 'tenant.member.added',
    resourceType: 'membership',
    resourceId: payload.userId,
    after: { roleId: payload.roleId },
  });
}

/**
 * Log member removal
 */
async function handleMemberRemoved(
  payload: { scopeId: string; userId: string; removedBy?: string }
): Promise<void> {
  await appendAudit({
    scopeId: payload.scopeId,
    actorId: payload.removedBy,
    action: 'tenant.member.removed',
    resourceType: 'membership',
    resourceId: payload.userId,
  });
}

/**
 * Log role change
 */
async function handleMemberRoleChanged(
  payload: { scopeId: string; userId: string; oldRoleId?: string; newRoleId: string; changedBy?: string }
): Promise<void> {
  await appendAudit({
    scopeId: payload.scopeId,
    actorId: payload.changedBy,
    action: 'tenant.member.role_changed',
    resourceType: 'membership',
    resourceId: payload.userId,
    before: payload.oldRoleId ? { roleId: payload.oldRoleId } : undefined,
    after: { roleId: payload.newRoleId },
  });
}

/**
 * Log API key creation
 */
async function handleApiKeyCreated(
  payload: { scopeId: string; keyId: string; scopes: string[]; createdBy?: string }
): Promise<void> {
  await appendAudit({
    scopeId: payload.scopeId,
    actorId: payload.createdBy,
    action: 'identity.apikey.created',
    resourceType: 'apikey',
    resourceId: payload.keyId,
    after: { scopes: payload.scopes },
  });
}

/**
 * Log API key revocation
 */
async function handleApiKeyRevoked(
  payload: { scopeId: string; keyId: string; revokedBy?: string }
): Promise<void> {
  await appendAudit({
    scopeId: payload.scopeId,
    actorId: payload.revokedBy,
    action: 'identity.apikey.revoked',
    resourceType: 'apikey',
    resourceId: payload.keyId,
  });
}

/**
 * Log subscription creation
 */
async function handleSubscriptionCreated(
  payload: { scopeId: string; planId: string; providerSubId?: string }
): Promise<void> {
  await appendAudit({
    scopeId: payload.scopeId,
    action: 'billing.subscription.created',
    resourceType: 'subscription',
    resourceId: payload.providerSubId,
    after: { planId: payload.planId },
  });
}

/**
 * Log subscription cancellation
 */
async function handleSubscriptionCancelled(
  payload: { scopeId: string; atPeriodEnd: boolean }
): Promise<void> {
  await appendAudit({
    scopeId: payload.scopeId,
    action: 'billing.subscription.cancelled',
    resourceType: 'subscription',
    after: { atPeriodEnd: payload.atPeriodEnd },
  });
}

/**
 * Log subscription update
 */
async function handleSubscriptionUpdated(
  payload: { scopeId: string; planId: string; previousPlanId?: string }
): Promise<void> {
  await appendAudit({
    scopeId: payload.scopeId,
    action: 'billing.subscription.updated',
    resourceType: 'subscription',
    before: payload.previousPlanId ? { planId: payload.previousPlanId } : undefined,
    after: { planId: payload.planId },
  });
}

/**
 * Log storage file upload confirmation
 */
async function handleStorageUploadConfirmed(
  payload: { scopeId: string; fileId: string; key: string; size: number }
): Promise<void> {
  await appendAudit({
    scopeId: payload.scopeId,
    action: 'storage.upload.confirmed',
    resourceType: 'file',
    resourceId: payload.fileId,
    after: { key: payload.key, size: payload.size },
  });
}

/**
 * Log storage file deletion
 */
async function handleStorageFileDeleted(
  payload: { scopeId: string; fileId: string; key: string }
): Promise<void> {
  await appendAudit({
    scopeId: payload.scopeId,
    action: 'storage.file.deleted',
    resourceType: 'file',
    resourceId: payload.fileId,
    after: { key: payload.key },
  });
}

/**
 * Log settings update
 */
async function handleSettingsUpdated(
  payload: { scopeId: string; key: string; oldValue?: unknown; newValue?: unknown }
): Promise<void> {
  await appendAudit({
    scopeId: payload.scopeId,
    action: 'settings.updated',
    resourceType: 'setting',
    resourceId: payload.key,
    before: payload.oldValue !== undefined ? { value: payload.oldValue } : undefined,
    after: payload.newValue !== undefined ? { value: payload.newValue } : undefined,
  });
}

/**
 * Register all audit event handlers.
 * Call this during application bootstrap.
 *
 * @returns Cleanup function to unsubscribe all handlers
 */
export function registerAuditEventHandlers(): () => void {
  log.info('registering audit event handlers');

  const unsubscribers: Array<() => void> = [];

  // Tenant events
  unsubscribers.push(
    onTyped('tenant.created', async (event) => {
      await handleTenantCreated(event.payload);
    })
  );

  unsubscribers.push(
    onTyped('tenant.updated', async (event) => {
      await handleTenantUpdated(event.payload);
    })
  );

  unsubscribers.push(
    onTyped('tenant.deleted', async (event) => {
      await handleTenantDeleted(event.payload);
    })
  );

  // Member events
  unsubscribers.push(
    onTyped('tenant.member.added', async (event) => {
      await handleMemberAdded(event.payload);
    })
  );

  unsubscribers.push(
    onTyped('tenant.member.removed', async (event) => {
      await handleMemberRemoved(event.payload);
    })
  );

  unsubscribers.push(
    onTyped('tenant.member.role_changed', async (event) => {
      await handleMemberRoleChanged(event.payload);
    })
  );

  // Identity events
  unsubscribers.push(
    onTyped('identity.apikey.created', async (event) => {
      await handleApiKeyCreated(event.payload);
    })
  );

  unsubscribers.push(
    onTyped('identity.apikey.revoked', async (event) => {
      await handleApiKeyRevoked(event.payload);
    })
  );

  // Billing events
  unsubscribers.push(
    onTyped('billing.subscription.created', async (event) => {
      await handleSubscriptionCreated(event.payload);
    })
  );

  unsubscribers.push(
    onTyped('billing.subscription.cancelled', async (event) => {
      await handleSubscriptionCancelled(event.payload);
    })
  );

  unsubscribers.push(
    onTyped('billing.subscription.updated', async (event) => {
      await handleSubscriptionUpdated(event.payload);
    })
  );

  // Storage events
  unsubscribers.push(
    onTyped('storage.upload.confirmed', async (event) => {
      await handleStorageUploadConfirmed(event.payload);
    })
  );

  unsubscribers.push(
    onTyped('storage.file.deleted', async (event) => {
      await handleStorageFileDeleted(event.payload);
    })
  );

  // Settings events
  unsubscribers.push(
    onTyped('settings.updated', async (event) => {
      await handleSettingsUpdated(event.payload);
    })
  );

  log.info('audit event handlers registered', { count: unsubscribers.length });

  // Return cleanup function
  return () => {
    log.info('unregistering audit event handlers');
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
