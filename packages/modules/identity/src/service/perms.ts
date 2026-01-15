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

/**
 * Build cache key for user permissions.
 *
 * Key format: `{KV.PERMSET}{scopeId}:user:{userId}`
 *
 * **Note:** The `:user:` segment ensures no collision with API key cache keys
 * which use `:key:` segment. This is safe because:
 * - UserIds are MongoDB ObjectIds (24 hex chars)
 * - ApiKeyIds are also ObjectIds
 * - Neither can contain the `:` character
 */
export function permCacheKeyForUser(scopeId: string, userId: string): string {
  return `${KV.PERMSET}${scopeId}:user:${userId}`;
}

export async function invalidatePermsForUser(
  scopeId: string,
  userId: string
): Promise<void> {
  try {
    await kv.del(permCacheKeyForUser(scopeId, userId));
  } catch {
    // best-effort
  }
}

/**
 * Build cache key for API key permissions.
 *
 * Key format: `{KV.PERMSET}{scopeId}:key:{apiKeyId}`
 *
 * **Note:** The `:key:` segment ensures no collision with user cache keys
 * which use `:user:` segment. See `permCacheKeyForUser` for safety guarantees.
 */
export function permCacheKeyForApiKey(
  scopeId: string,
  apiKeyId: string
): string {
  return `${KV.PERMSET}${scopeId}:key:${apiKeyId}`;
}

export async function invalidatePermsForApiKey(
  scopeId: string,
  apiKeyId: string
): Promise<void> {
  try {
    await kv.del(permCacheKeyForApiKey(scopeId, apiKeyId));
  } catch {
    // best-effort
  }
}

export async function getEffectivePerms(
  scopeId: string,
  userId: string
): Promise<Permission[]> {
  await connectDb();
  const cacheKey = permCacheKeyForUser(scopeId, userId);
  const cached = await kv.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as Permission[];
    } catch {}
  }
  const m = await membershipsRepository.findByScopeAndUser(scopeId, userId);
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
  } catch {
    // Silently fail - user just won't get global overlays
  }
  return { perms, isSuperAdmin: false };
}
