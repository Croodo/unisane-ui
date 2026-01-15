import { PERM, ROLE_PERMS } from "@unisane/kernel";
import type { Permission } from "@unisane/kernel";
export { PERM, ROLE_PERMS };
export type { Permission };
import { ERR } from "../errors/errors";

// Import and re-export AuthCtx from auth.ts (single source of truth)
// Type-only import avoids circular dependency at runtime
import type { AuthCtx } from '../auth/auth';
export type { AuthCtx };

export function hasPerm(ctx: AuthCtx, perm: Permission): boolean {
  return Boolean(ctx.perms?.includes(perm));
}

// Enforce tenant scope when an optional tenantId filter is provided by the client.
// If requestedTenantId differs from ctx.tenantId, require the provided adminPerm.
// Returns the effective tenant id that the request may operate on.
export function requireTenantScope(
  ctx: AuthCtx,
  requestedTenantId: string | null | undefined,
  adminPerm?: Permission
): string {
  if (ctx.isSuperAdmin) {
    return requestedTenantId ?? ctx.tenantId ?? "";
  }
  const actorTenant = ctx.tenantId;
  if (!requestedTenantId || requestedTenantId === actorTenant)
    return actorTenant ?? requestedTenantId ?? "";
  if (adminPerm && hasPerm(ctx, adminPerm)) return requestedTenantId;
  throw ERR.forbidden();
}
