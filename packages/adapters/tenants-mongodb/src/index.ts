/**
 * Tenants MongoDB Adapter
 *
 * Implements the TenantsPort interface using the @unisane/tenants MongoDB repository.
 * This adapter bridges the kernel's port interface with the tenants module's implementation.
 *
 * @example
 * ```typescript
 * import { createTenantsAdapter } from '@unisane/tenants-mongodb';
 * import { setTenantsProvider } from '@unisane/kernel';
 * import { TenantsRepo } from '@unisane/tenants';
 *
 * const adapter = createTenantsAdapter({ tenantsRepository: TenantsRepo });
 * setTenantsProvider(adapter);
 * ```
 */

import type { TenantsPort, TenantView } from '@unisane/kernel';

/**
 * Tenant row interface expected from the tenants repository.
 * This matches the TenantRow type from @unisane/tenants.
 */
export interface TenantRow {
  id: string;
  slug?: string;
  name?: string;
  planId?: string | null;
}

/**
 * Tenants repository interface expected by this adapter.
 */
export interface TenantsRepositoryLike {
  findById(id: string): Promise<TenantRow | null>;
}

/**
 * Configuration for creating the tenants adapter.
 */
export interface TenantsAdapterConfig {
  /** The tenants repository instance from @unisane/tenants */
  tenantsRepository: TenantsRepositoryLike;
}

/**
 * Creates a TenantsPort adapter using the provided tenants repository.
 *
 * @param config - Configuration containing the tenants repository
 * @returns A TenantsPort implementation
 */
export function createTenantsAdapter(config: TenantsAdapterConfig): TenantsPort {
  const { tenantsRepository } = config;

  return {
    async findById(tenantId: string): Promise<TenantView | null> {
      const tenant = await tenantsRepository.findById(tenantId);

      if (!tenant) {
        return null;
      }

      return {
        id: tenant.id,
        planId: tenant.planId,
        slug: tenant.slug,
        name: tenant.name,
      };
    },
  };
}

// Re-export types for convenience
export type { TenantsPort, TenantView } from '@unisane/kernel';
