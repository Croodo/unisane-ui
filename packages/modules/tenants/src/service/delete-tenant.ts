/**
 * Delete Tenant (Event-Driven)
 *
 * Soft-deletes the tenant and emits `tenant.deleted` event.
 * Cascade cleanup is handled by event handlers in each module:
 * - Identity: Revokes API keys, soft-deletes memberships
 * - Storage: Marks files for deletion
 * - Settings: Soft-deletes tenant settings
 *
 * Note: Billing records are preserved for compliance.
 * Note: Audit logs are preserved for compliance.
 */

import { logger, emitTypedReliable } from "@unisane/kernel";
import { TenantsRepo } from "../data/tenants.repository";

export type DeleteTenantArgs = {
  tenantId: string;
  actorId?: string;
};

export type DeleteTenantResult = {
  deleted: boolean;
  cascadeStatus: 'pending';
};

/**
 * Delete a tenant using event-driven cascade pattern.
 *
 * 1. Soft-delete the tenant record (own domain only)
 * 2. Emit tenant.deleted event via outbox (guaranteed delivery)
 * 3. Return immediately - cascades happen async via event handlers
 */
export async function deleteTenant(
  args: DeleteTenantArgs
): Promise<DeleteTenantResult> {
  const { tenantId, actorId } = args;

  // 1. Soft-delete tenant (own domain only)
  const deleted = await TenantsRepo.softDelete({ tenantId, actorId });

  if (!deleted) {
    return { deleted: false, cascadeStatus: 'pending' };
  }

  // 2. Emit event via outbox (guaranteed delivery to all handlers)
  await emitTypedReliable('tenant.deleted', {
    scopeId: tenantId,
    actorId,
    timestamp: new Date().toISOString(),
  });

  logger.info("tenant.deleted.initiated", {
    tenantId,
    actorId,
    message: "Cascade handlers will process async",
  });

  // 3. Return immediately - cascades happen async
  return { deleted: true, cascadeStatus: 'pending' };
}
