/**
 * Tenants Port Adapter
 *
 * Implements TenantsPort interface from kernel.
 * Wraps the existing tenants module service functions.
 * Used by billing/identity modules for tenant operations via the kernel port.
 */

import type {
  TenantsPort,
  TenantView,
  TenantStatus,
} from "@unisane/kernel";
import { readTenant } from "./service/read-tenant";
import { TenantsRepo } from "./data/tenants.repository";

/**
 * TenantsPort implementation that wraps the tenants module services.
 */
export const tenantsAdapter: TenantsPort = {
  async findById(tenantId) {
    const tenant = await readTenant(tenantId);
    if (!tenant) return null;

    const view: TenantView = {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      planId: tenant.planId,
      status: (tenant.status ?? "active") as TenantStatus,
    };

    return view;
  },

  async findByIds(tenantIds) {
    const tenants = await TenantsRepo.findMany(tenantIds);
    const map = new Map<string, TenantView>();

    for (const tenant of tenants) {
      map.set(tenant.id, {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        planId: tenant.planId,
        status: (tenant.status ?? "active") as TenantStatus,
      });
    }

    return map;
  },

  async isActive(tenantId) {
    const tenant = await readTenant(tenantId);
    if (!tenant) return false;
    return tenant.status === "active" || tenant.status === undefined;
  },

  async getSubscriptionStatus(tenantId) {
    const tenant = await readTenant(tenantId);
    if (!tenant) {
      return { hasActiveSubscription: false };
    }

    // Tenants module doesn't store subscription directly
    // This would be coordinated with billing module
    // Return basic status based on planId presence
    return {
      hasActiveSubscription: !!tenant.planId,
      planId: tenant.planId ?? undefined,
    };
  },

  async updatePlanId(tenantId, planId) {
    await TenantsRepo.updatePlanId(tenantId, planId);
  },

  async updateStatus(tenantId, status) {
    await TenantsRepo.updateStatus({
      tenantId,
      status,
      actorId: "system",
    });
  },
};
