"use client";

import { useTenantContext } from "@/src/hooks/useTenantContext";

/**
 * Get the active tenant from the session.
 * Used by generated SDK hooks for tenant-scoped operations.
 */
export function useActiveTenant() {
  const { tenantId, tenantSlug, tenantName, plan, isReady } = useTenantContext();
  return {
    tenantId,
    tenantSlug,
    tenantName,
    plan,
    isReady,
  };
}
