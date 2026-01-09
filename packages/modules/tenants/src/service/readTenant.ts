/**
 * Read Tenant
 *
 * Read-only helper for cross-module/platform consumers.
 * Returns a minimal tenant row with id, slug, name, planId or null if not found.
 *
 * Note: This function accepts explicit tenantId for cross-module use cases
 * where the caller may not have tenant context (e.g., admin operations).
 */

import { cacheGet, cacheSet } from "@unisane/kernel";
import { TenantsRepo } from "../data/tenants.repository";
import type { TenantRow } from "../domain/types";
import { tenantKeys } from "../domain/keys";
import { TENANT_DEFAULTS } from "../domain/constants";

/**
 * Read-only helper for cross-module/platform consumers.
 * Returns a minimal tenant row with id, slug, name, planId or null if not found.
 *
 * Note: This function accepts explicit tenantId for cross-module use cases
 * where the caller may not have tenant context (e.g., admin operations).
 */
export async function readTenant(tenantId: string): Promise<TenantRow | null> {
  const key = tenantKeys.byId(tenantId);
  const cached = await cacheGet<TenantRow>(key);
  if (cached) return cached;
  const row = await TenantsRepo.findById(tenantId);
  if (row) await cacheSet(key, row, TENANT_DEFAULTS.CACHE_TTL_MS);
  return row;
}
