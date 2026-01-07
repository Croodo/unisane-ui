/**
 * Read Tenant by Slug
 *
 * Useful for resolving tenants from subdomain or URL path.
 */

import { cacheGet, cacheSet } from "@unisane/kernel";
import { TenantsRepo } from "../data/tenants.repository";
import type { TenantRow } from "../domain/types";
import { tenantKeys } from "../domain/keys";
import { TENANT_DEFAULTS } from "../domain/constants";

/**
 * Read tenant by slug.
 * Useful for resolving tenants from subdomain or URL path.
 */
export async function readTenantBySlug(slug: string): Promise<TenantRow | null> {
  const key = tenantKeys.bySlug(slug);
  const cached = await cacheGet<TenantRow>(key);
  if (cached) return cached;
  const row = await TenantsRepo.findBySlug(slug);
  if (row) await cacheSet(key, row, TENANT_DEFAULTS.CACHE_TTL_MS);
  return row;
}
