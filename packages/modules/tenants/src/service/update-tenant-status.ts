/**
 * Update Tenant Status Service
 *
 * Allows admins to suspend, activate, or mark tenants as deleted.
 * Status changes are audited and emit events for downstream consumers.
 */

import type { TenantStatus } from '@unisane/kernel';
import {
  hasAuditProvider,
  getAuditProvider,
  logAuditViaPort,
} from '@unisane/kernel';
import { TenantsRepo } from '../data/tenants.repository';
import { TenantNotFoundError } from '../domain/errors';
import type { TenantRow } from '../domain/types';

export interface UpdateTenantStatusInput {
  tenantId: string;
  status: TenantStatus;
  reason?: string;
  actorId: string;
}

export interface UpdateTenantStatusResult {
  tenant: TenantRow;
  previousStatus: TenantStatus;
}

/**
 * Update a tenant's status.
 *
 * @throws {TenantNotFoundError} If tenant doesn't exist
 */
export async function updateTenantStatus(
  input: UpdateTenantStatusInput
): Promise<UpdateTenantStatusResult> {
  const { tenantId, status, reason, actorId } = input;

  // Find existing tenant
  const existing = await TenantsRepo.findById(tenantId);
  if (!existing) {
    throw new TenantNotFoundError(tenantId);
  }

  const previousStatus = existing.status ?? 'active';

  // Skip if status unchanged
  if (previousStatus === status) {
    return { tenant: existing, previousStatus };
  }

  // Update status in database
  const updated = await TenantsRepo.updateStatus({
    tenantId,
    status,
    reason,
    actorId,
  });

  // Audit log the status change
  if (hasAuditProvider()) {
    await logAuditViaPort({
      scopeId: tenantId,
      action: 'tenant.status.changed',
      actor: { type: 'user', id: actorId },
      target: { type: 'tenant', id: tenantId },
      changes: [
        { field: 'status', from: previousStatus, to: status },
        ...(reason ? [{ field: 'statusReason', from: undefined, to: reason }] : []),
      ],
      metadata: { reason },
    });
  }

  return { tenant: updated, previousStatus };
}

/**
 * Suspend a tenant. Users will see a "workspace suspended" error.
 */
export async function suspendTenant(
  tenantId: string,
  actorId: string,
  reason?: string
): Promise<UpdateTenantStatusResult> {
  return updateTenantStatus({
    tenantId,
    status: 'suspended',
    reason,
    actorId,
  });
}

/**
 * Activate a tenant. Restores normal access.
 */
export async function activateTenant(
  tenantId: string,
  actorId: string
): Promise<UpdateTenantStatusResult> {
  return updateTenantStatus({
    tenantId,
    status: 'active',
    actorId,
  });
}
