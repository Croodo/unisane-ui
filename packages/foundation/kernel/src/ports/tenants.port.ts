/**
 * Tenants Port
 *
 * This port defines the contract for modules that need tenant information
 * (e.g., billing module reading current plan).
 * Tenants module implements this port, consumers depend on the interface.
 */

import type { PlanId } from '../constants/plan';
import type { SubscriptionStatus } from '../constants/billing';

/**
 * Tenant status - uses SSOT pattern
 */
export type TenantStatus = 'active' | 'suspended' | 'deleted';

/**
 * Minimal tenant view for cross-module operations.
 */
export interface TenantView {
  id: string;
  planId?: PlanId | string | null | undefined;
  slug?: string;
  name?: string;
  status?: TenantStatus;
  settings?: Record<string, unknown>;
  subscription?: {
    id: string;
    planId: string;
    status: SubscriptionStatus;
    currentPeriodEnd?: Date;
  };
}

/**
 * Port interface for tenant operations.
 * Used by billing module to check tenant plan, identity module for tenant queries.
 */
export interface TenantsPort {
  /**
   * Find tenant by ID.
   */
  findById(tenantId: string): Promise<TenantView | null>;

  /**
   * Find multiple tenants by IDs.
   */
  findByIds?(tenantIds: string[]): Promise<Map<string, TenantView>>;

  /**
   * Check if tenant exists and is active.
   */
  isActive?(tenantId: string): Promise<boolean>;

  /**
   * Get tenant's current subscription status.
   */
  getSubscriptionStatus?(tenantId: string): Promise<{
    hasActiveSubscription: boolean;
    planId?: string;
    expiresAt?: Date;
  }>;

  /**
   * Update tenant's plan ID after subscription change.
   */
  updatePlanId?(tenantId: string, planId: string): Promise<void>;

  /**
   * Update tenant status.
   */
  updateStatus?(tenantId: string, status: TenantStatus): Promise<void>;
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

/**
 * Convenience function: Check if tenant is active via port.
 */
export async function isTenantActiveViaPort(tenantId: string): Promise<boolean> {
  const provider = getTenantsProvider();
  if (provider.isActive) {
    return provider.isActive(tenantId);
  }
  // Fallback: check tenant exists and status
  const tenant = await provider.findById(tenantId);
  return tenant !== null && tenant.status === 'active';
}

/**
 * Convenience function: Get tenant subscription status via port.
 */
export async function getTenantSubscriptionStatusViaPort(tenantId: string): Promise<{
  hasActiveSubscription: boolean;
  planId?: string;
  expiresAt?: Date;
}> {
  const provider = getTenantsProvider();
  if (provider.getSubscriptionStatus) {
    return provider.getSubscriptionStatus(tenantId);
  }
  // Fallback: check tenant subscription field
  const tenant = await provider.findById(tenantId);
  if (!tenant?.subscription) {
    return { hasActiveSubscription: false };
  }
  return {
    hasActiveSubscription: tenant.subscription.status === 'active',
    planId: tenant.subscription.planId,
    expiresAt: tenant.subscription.currentPeriodEnd,
  };
}
