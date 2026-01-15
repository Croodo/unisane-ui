"use client";

import { useSession } from "@/src/hooks/use-session";

export function useTenantContext() {
  const { me } = useSession();

  return {
    tenantId: me?.scopeId ?? undefined,
    tenantSlug: me?.tenantSlug ?? undefined,
    tenantName: me?.tenantName ?? undefined,
    plan: me?.plan ?? undefined,
    isReady: Boolean(me?.scopeId),
  };
}
