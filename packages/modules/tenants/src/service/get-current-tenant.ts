/**
 * Get Current Tenant
 *
 * Retrieves the current tenant from context.
 * Throws TenantNotFoundError if tenant doesn't exist.
 */

import { getScopeId } from "@unisane/kernel";
import { readTenant } from "./read-tenant";
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
  const scopeId = getScopeId();
  const tenant = await readTenant(scopeId);
  if (!tenant) {
    throw new TenantNotFoundError(scopeId, "id");
  }
  return tenant;
}
