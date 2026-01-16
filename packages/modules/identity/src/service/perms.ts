import type { Permission } from "@unisane/gateway";
import { ROLE_PERMS, PERM } from "@unisane/gateway";
import { kv, logger } from "@unisane/kernel";
import { KV } from "@unisane/kernel";
import {
  usersRepository,
  membershipsRepository,
} from "../data/repo";
import { connectDb } from "@unisane/kernel";
import { getUserGlobalRole } from "./users";

const log = logger.child({ module: 'identity/perms' });

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

  // Try to read from cache
  try {
    const cached = await kv.get(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Validate the parsed value is an array of strings
        if (Array.isArray(parsed) && parsed.every((p) => typeof p === 'string')) {
          return parsed as Permission[];
        }
        // Invalid format - log and invalidate
        log.warn('permission cache invalid format', { scopeId, userId, cacheKey });
        await kv.del(cacheKey);
      } catch (parseError) {
        // JSON parse failed - log and invalidate corrupted entry
        log.error('permission cache parse failed', {
          scopeId,
          userId,
          cacheKey,
          error: parseError instanceof Error ? parseError.message : String(parseError),
        });
        // Delete corrupted cache entry to prevent repeated failures
        await kv.del(cacheKey);
      }
    }
  } catch (cacheReadError) {
    // Cache read failed - log but continue to fetch from database
    log.warn('permission cache read failed', {
      scopeId,
      userId,
      cacheKey,
      error: cacheReadError instanceof Error ? cacheReadError.message : String(cacheReadError),
    });
  }

  // Fetch fresh permissions from database
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

  // Try to cache the result
  try {
    await kv.set(cacheKey, JSON.stringify(perms), { PX: 60_000 });
  } catch (cacheWriteError) {
    // Cache write failed - log but return permissions (non-critical)
    log.warn('permission cache write failed', {
      scopeId,
      userId,
      cacheKey,
      error: cacheWriteError instanceof Error ? cacheWriteError.message : String(cacheWriteError),
    });
  }

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
  } catch (error) {
    // Log the failure - user won't get global overlays but we want visibility
    log.warn('failed to apply global overlays', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
  return { perms, isSuperAdmin: false };
}
