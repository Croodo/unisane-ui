import type { Permission } from "@unisane/gateway";
import { ROLE_PERMS, PERM } from "@unisane/gateway";
import { kv } from "@unisane/kernel";
import { KV } from "@unisane/kernel";
import {
  usersRepository,
  membershipsRepository,
} from "../data/repo";
import { connectDb } from "@unisane/kernel";
import { getUserGlobalRole } from "./users";

export function permCacheKeyForUser(tenantId: string, userId: string): string {
  return `${KV.PERMSET}${tenantId}:user:${userId}`;
}

export async function invalidatePermsForUser(
  tenantId: string,
  userId: string
): Promise<void> {
  try {
    await kv.del(permCacheKeyForUser(tenantId, userId));
  } catch {
    // best-effort
  }
}

export function permCacheKeyForApiKey(
  tenantId: string,
  apiKeyId: string
): string {
  return `${KV.PERMSET}${tenantId}:key:${apiKeyId}`;
}

export async function invalidatePermsForApiKey(
  tenantId: string,
  apiKeyId: string
): Promise<void> {
  try {
    await kv.del(permCacheKeyForApiKey(tenantId, apiKeyId));
  } catch {
    // best-effort
  }
}

export async function getEffectivePerms(
  tenantId: string,
  userId: string
): Promise<Permission[]> {
  await connectDb();
  const cacheKey = permCacheKeyForUser(tenantId, userId);
  const cached = await kv.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as Permission[];
    } catch {}
  }
  const m = await membershipsRepository.get(tenantId, userId);
  const base: Set<Permission> = new Set();
  for (const r of m?.roles ?? []) {
    const bundle = ROLE_PERMS[r.roleId] ?? [];
    for (const p of bundle) base.add(p);
  }
  for (const g of m?.grants ?? []) {
    if (g.effect === "allow") base.add(g.perm as Permission);
    else base.delete(g.perm as Permission);
  }
  const perms = Array.from(base);
  try {
    await kv.set(cacheKey, JSON.stringify(perms), { PX: 60_000 });
  } catch {}
  return perms;
}

// Overlay permission sets for global roles.
// Keep conservative by default. Adjust as your policy evolves.
const SUPPORT_ADMIN_OVERLAY: Permission[] = [
  PERM.SETTINGS_READ,
  PERM.FLAGS_READ,
  PERM.MEMBERS_READ,
  PERM.AUDIT_READ,
  // Uncomment if platform admins should handle billing operations
  // PERM.BILLING_READ,
];

export async function applyGlobalOverlays(
  userId: string,
  perms: Permission[]
): Promise<{ perms: Permission[]; isSuperAdmin: boolean }> {
  await connectDb();
  try {
    const role = await getUserGlobalRole(userId);
    if (role === "super_admin") {
      const merged = new Set<Permission>([
        ...perms,
        ...(Object.values(ROLE_PERMS).flat() as Permission[]),
      ]);
      return { perms: Array.from(merged), isSuperAdmin: true };
    }
    if (role === "support_admin") {
      const merged = new Set<Permission>([...perms, ...SUPPORT_ADMIN_OVERLAY]);
      return { perms: Array.from(merged), isSuperAdmin: false };
    }
  } catch {}
  return { perms, isSuperAdmin: false };
}
