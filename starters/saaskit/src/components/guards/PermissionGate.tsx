"use client";

import { useSession } from "@/src/hooks/useSession";

type PermissionGateProps = {
  perm: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function PermissionGate({
  perm,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { me } = useSession();
  const perms = me?.perms as string[] | undefined;

  const hasPermission = Array.isArray(perm)
    ? perm.some((p) => perms?.includes(p))
    : perms?.includes(perm);

  if (!hasPermission) return fallback;
  return children;
}
