"use client";

import { useSession } from "@/src/hooks/useSession";

export function useTenantContext() {
  const { me } = useSession();

  return {
    tenantId: me?.tenantId ?? undefined,
    tenantSlug: me?.tenantSlug ?? undefined,
    tenantName: me?.tenantName ?? undefined,
    plan: me?.plan ?? undefined,
    isReady: Boolean(me?.tenantId),
  };
}
