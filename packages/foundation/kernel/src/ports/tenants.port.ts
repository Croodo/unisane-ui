/**
 * Tenants Port
 *
 * This port defines the contract for modules that need tenant information
 * (e.g., billing module reading current plan).
 * Tenants module implements this port, consumers depend on the interface.
 */

import type { PlanId } from '../constants/plan';

/**
 * Minimal tenant view for cross-module operations.
 */
export interface TenantView {
  id: string;
  planId?: PlanId | string | null | undefined;
  slug?: string;
  name?: string;
}

/**
 * Port interface for tenant operations.
 * Used by billing module to check tenant plan.
 */
export interface TenantsPort {
  /**
   * Find tenant by ID.
   */
  findById(tenantId: string): Promise<TenantView | null>;

  /**
   * Update tenant's plan ID after subscription change.
   */
  updatePlanId?(tenantId: string, planId: string): Promise<void>;
}

// Provider storage
let _provider: TenantsPort | null = null;

/**
 * Set the tenants provider implementation.
 * Call this at app bootstrap.
 */
export function setTenantsProvider(provider: TenantsPort): void {
  _provider = provider;
}

/**
 * Get the tenants provider.
 * Throws if not configured.
 */
export function getTenantsProvider(): TenantsPort {
  if (!_provider) {
    throw new Error(
      "TenantsPort not configured. Call setTenantsProvider() at bootstrap."
    );
  }
  return _provider;
}

/**
 * Check if provider is configured.
 */
export function hasTenantsProvider(): boolean {
  return _provider !== null;
}
