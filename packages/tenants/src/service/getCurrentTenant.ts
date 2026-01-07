/**
 * Get Current Tenant
 *
 * Retrieves the current tenant from context.
 * Throws TenantNotFoundError if tenant doesn't exist.
 */

import { getTenantId } from "@unisane/kernel";
import { readTenant } from "./readTenant";
import type { TenantRow } from "../domain/types";
import { TenantNotFoundError } from "../domain/errors";

/**
 * Get the current tenant from context.
 * Throws TenantNotFoundError if tenant doesn't exist.
 *
 * @example
 * ```typescript
 * // In a route handler after ctx is established
 * const tenant = await getCurrentTenant();
 * console.log(tenant.slug);
 * ```
 */
export async function getCurrentTenant(): Promise<TenantRow> {
  const tenantId = getTenantId();
  const tenant = await readTenant(tenantId);
  if (!tenant) {
    throw new TenantNotFoundError(tenantId, "id");
  }
  return tenant;
}
