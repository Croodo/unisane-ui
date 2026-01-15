/**
 * Delete Tenant
 *
 * Cascade delete a tenant with proper cleanup:
 * 1. Revoke all API keys (security - prevents access)
 * 2. Soft delete all memberships (UX - users lose access)
 * 3. Mark storage files for deletion (cleanup job will handle S3)
 * 4. Soft delete the tenant
 *
 * Note: Billing records (subscriptions, invoices, payments, credits) are preserved for compliance.
 * Note: Audit logs are preserved for compliance.
 */

import { logger, events } from "@unisane/kernel";
import { TenantsRepo } from "../data/tenants.repository";
import { TENANT_EVENTS } from "../domain/constants";

export type DeleteTenantArgs = {
  tenantId: string;
  actorId?: string;
};

export type DeleteTenantResult = {
  deleted: boolean;
  cascade: {
    apiKeysRevoked: number;
    membershipsDeleted: number;
    storageFilesMarked: number;
  };
};

/**
 * Cascade delete a tenant with proper cleanup:
 * 1. Revoke all API keys (security - prevents access)
 * 2. Soft delete all memberships (UX - users lose access)
 * 3. Mark storage files for deletion (cleanup job will handle S3)
 * 4. Soft delete the tenant
 *
 * Note: Billing records (subscriptions, invoices, payments, credits) are preserved for compliance.
 * Note: Audit logs are preserved for compliance.
 */
export async function deleteTenant(
  args: DeleteTenantArgs
): Promise<DeleteTenantResult> {
  const result = await TenantsRepo.deleteCascade({ scopeId: args.tenantId, actorId: args.actorId });

  logger.info("tenant.deleted", {
    scopeId: args.tenantId,
    actorId: args.actorId,
    cascade: result.cascade,
  });

  // Emit event for side effects (e.g., cleanup jobs, notifications)
  await events.emit(TENANT_EVENTS.DELETED, {
    scopeId: args.tenantId,
    actorId: args.actorId,
    cascade: result.cascade,
  });

  return result;
}
