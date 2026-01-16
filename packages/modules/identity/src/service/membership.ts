import { usersRepository, membershipsRepository } from "../data/repo";
import { ERR } from "@unisane/gateway";
import { invalidatePermsForUser } from "./perms";
import { getScopeId, resolveEntitlements, events, withLock, emitTypedReliable } from "@unisane/kernel";
import { IDENTITY_EVENTS } from "../domain/constants";
import { getTenantsRepo } from "../providers";
import type { RoleId } from "@unisane/kernel";
import type { Permission } from "@unisane/kernel";
import type { GrantEffect } from "@unisane/kernel";
import type { MembershipRemovalReason } from "@unisane/kernel";
import { z } from "zod";

/**
 * IDEN-002 FIX: Zod schema for validating membership data from repository.
 * Ensures type safety without unsafe casting.
 */
const ZMembershipFromRepo = z.object({
  userId: z.string().optional(),
  scopeId: z.string().optional(),
  roles: z.array(z.object({ roleId: z.string() })).optional().default([]),
  grants: z.array(z.object({
    perm: z.string(),
    effect: z.enum(['allow', 'deny']),
  })).optional().default([]),
  version: z.number().optional().default(0),
  createdAt: z.date().optional().nullable(),
  updatedAt: z.date().optional().nullable(),
});

import type { ListMembersArgs } from "../domain/types";
export type { ListMembersArgs };

import type { ListMyMembershipsArgs } from "../domain/types";
export type { ListMyMembershipsArgs };

import type { AddRoleArgs } from "../domain/types";
export type { AddRoleArgs };

import type { GrantPermArgs } from "../domain/types";
export type { GrantPermArgs };

import type { RemoveRoleArgs } from "../domain/types";
export type { RemoveRoleArgs };

import type { RevokePermArgs } from "../domain/types";
export type { RevokePermArgs };

import type { GetMembershipArgs } from "../domain/types";
export type { GetMembershipArgs };

import type { RemoveMemberArgs } from "../domain/types";
export type { RemoveMemberArgs };

export async function addRole(args: AddRoleArgs) {
  const scopeId = getScopeId(); // Throws if not set
  const { userId, roleId, expectedVersion } = args;

  // Check if this would be a new seat (user has no roles yet)
  const existing = await membershipsRepository.findByScopeAndUser(scopeId, userId);
  const isNewSeat =
    !existing || !Array.isArray(existing.roles) || existing.roles.length === 0;

  // If adding a new seat, we need to check the seat limit atomically
  // Use distributed lock to prevent race conditions where multiple concurrent
  // requests could all pass the seat check before any completes
  if (isNewSeat) {
    const ent = await resolveEntitlements(scopeId);
    const maxSeatsRaw = (ent.capacities as Record<string, number | undefined>)[
      "seats"
    ];
    const maxSeats =
      typeof maxSeatsRaw === "number" &&
      Number.isFinite(maxSeatsRaw) &&
      maxSeatsRaw > 0
        ? maxSeatsRaw
        : undefined;

    if (maxSeats !== undefined) {
      // Use distributed lock to ensure atomic seat limit checking
      const lockKey = `seat-limit:${scopeId}`;
      try {
        return await withLock(
          lockKey,
          {
            ttlMs: 5000, // Lock expires after 5 seconds
            retryMs: 100, // Retry every 100ms
            maxRetries: 50, // Give up after 5 seconds
          },
          async () => {
            // Re-check seat count while holding lock
            const page = await membershipsRepository.listByScope(
              scopeId,
              maxSeats + 1
            );
            const activeSeats = page.items.filter(
              (m) =>
                Array.isArray((m as { roles?: unknown }).roles) &&
                (m as { roles: unknown[] }).roles.length > 0
            ).length;

            if (activeSeats >= maxSeats) {
              throw ERR.validation(
                `Seat limit reached for this workspace plan (${activeSeats}/${maxSeats})`
              );
            }

            // Add role while still holding lock
            const res = await membershipsRepository.addRole(
              scopeId,
              userId,
              roleId,
              expectedVersion
            );
            if ("conflict" in res) throw ERR.versionMismatch();

            await invalidatePermsForUser(scopeId, userId);
            await events.emit(IDENTITY_EVENTS.MEMBERSHIP_ROLE_CHANGED, {
              scopeId,
              userId,
              roleId,
              action: "added",
            });
            return res.membership;
          }
        );
      } catch (error) {
        // If it's a lock acquisition failure, provide a friendly error
        if (error instanceof Error && error.message.includes('Unable to acquire lock')) {
          throw ERR.internal('Unable to add member at this time. Please try again.');
        }
        throw error;
      }
    }
  }

  // No seat limit or not a new seat - proceed without lock
  const res = await membershipsRepository.addRole(
    scopeId,
    userId,
    roleId,
    expectedVersion
  );
  if ("conflict" in res) throw ERR.versionMismatch();
  await invalidatePermsForUser(scopeId, userId);
  await events.emit(IDENTITY_EVENTS.MEMBERSHIP_ROLE_CHANGED, {
    scopeId,
    userId,
    roleId,
    action: "added",
  });
  return res.membership;
}

export async function grantPerm(args: GrantPermArgs) {
  const scopeId = getScopeId(); // Throws if not set
  const { userId, perm, effect, expectedVersion } = args;
  const res = await membershipsRepository.grantPerm(
    scopeId,
    userId,
    perm,
    effect,
    expectedVersion
  );
  if ("conflict" in res) throw ERR.versionMismatch();
  await invalidatePermsForUser(scopeId, userId);
  return res.membership;
}

export async function getActiveScopeId(
  userId: string
): Promise<string | undefined> {
  const m = await membershipsRepository.findLatestForUser(userId);
  return m?.scopeId ?? undefined;
}

export async function getMembership(args: GetMembershipArgs) {
  const scopeId = getScopeId(); // Throws if not set
  return membershipsRepository.findByScopeAndUser(scopeId, args.userId);
}

export async function removeRole(args: RemoveRoleArgs) {
  const scopeId = getScopeId(); // Throws if not set
  const { userId, roleId, expectedVersion } = args;
  const res = await membershipsRepository.removeRole(
    scopeId,
    userId,
    roleId,
    expectedVersion
  );
  if ("conflict" in res) throw ERR.versionMismatch();
  await invalidatePermsForUser(scopeId, userId);
  await events.emit(IDENTITY_EVENTS.MEMBERSHIP_ROLE_CHANGED, {
    scopeId,
    userId,
    roleId,
    action: "removed",
  });
  return res.membership;
}

export async function revokePerm(args: RevokePermArgs) {
  const scopeId = getScopeId(); // Throws if not set
  const { userId, perm, expectedVersion } = args;
  const res = await membershipsRepository.revokePerm(
    scopeId,
    userId,
    perm,
    expectedVersion
  );
  if ("conflict" in res) throw ERR.versionMismatch();
  await invalidatePermsForUser(scopeId, userId);
  return res.membership;
}

export async function listMembers(args: ListMembersArgs) {
  const scopeId = getScopeId(); // Throws if not set
  const page = await membershipsRepository.listByScope(
    scopeId,
    args.limit,
    args.cursor
  );

  // IDEN-002 FIX: Parse and validate membership data with Zod instead of unsafe casting
  const parsedItems = page.items.map((m) => {
    const result = ZMembershipFromRepo.safeParse(m);
    if (!result.success) {
      // Log but don't fail - return a safe default for invalid items
      console.warn("[identity/membership] Invalid membership data:", {
        scopeId,
        errors: result.error.flatten().fieldErrors,
      });
      return null;
    }
    return result.data;
  }).filter((item): item is z.infer<typeof ZMembershipFromRepo> => item !== null);

  const userIds = [
    ...new Set(
      parsedItems
        .map((m) => m.userId)
        .filter((id): id is string => !!id)
    ),
  ];

  const userMap = await usersRepository.findByIds(userIds);

  const items = parsedItems.map((m) => {
    const userId = m.userId ?? null;
    const user = userId ? userMap.get(userId) : null;
    return {
      id: `${scopeId}:${userId}`, // Composite key for memberships
      scopeId: m.scopeId ?? scopeId,
      userId,
      userName: user?.displayName ?? null,
      userEmail: user?.email ?? null,
      roles: m.roles as { roleId: RoleId }[],
      grants: m.grants as { perm: Permission; effect: GrantEffect }[],
      version: m.version,
      createdAt: m.createdAt ?? null,
      updatedAt: m.updatedAt ?? null,
    };
  });
  return {
    items,
    ...(page.nextCursor ? { nextCursor: page.nextCursor } : {}),
  } as const;
}

export async function removeMember(args: RemoveMemberArgs & { removedBy?: string; reason?: MembershipRemovalReason }) {
  const scopeId = getScopeId(); // Throws if not set
  const { userId, expectedVersion, removedBy, reason = 'removed' } = args;
  const res = await membershipsRepository.softDelete(
    scopeId,
    userId,
    expectedVersion
  );
  if ("notFound" in res) throw ERR.notFound("Membership not found");
  if ("conflict" in res) throw ERR.versionMismatch();
  await invalidatePermsForUser(scopeId, userId);

  // Emit membership.removed event for cascade handlers
  await emitTypedReliable('membership.removed', {
    membershipId: `${scopeId}:${userId}`,
    userId,
    scopeId,
    removedBy,
    reason,
  });

  return { ok: true };
}

export async function listMyMemberships(args: ListMyMembershipsArgs) {
  const page = await membershipsRepository.listByUser(
    args.userId,
    args.limit,
    args.cursor
  );
  const scopeIds = page.items.map((m) =>
    String((m as { scopeId: unknown }).scopeId)
  );
  const tenantsRepo = getTenantsRepo();
  const tenants = await tenantsRepo.findMany(scopeIds);
  type TenantRecord = { id: string; slug?: string; name?: string };
  const tMap = new Map<string, TenantRecord>(tenants.map((t: TenantRecord) => [t.id, t]));
  const items = page.items.map((m) => {
    const sid = String((m as { scopeId: unknown }).scopeId);
    const t = tMap.get(sid);
    const roles =
      (m as { roles?: Array<{ roleId: RoleId }> }).roles?.map(
        (r) => r.roleId
      ) ?? [];
    const updatedAt = (m as { updatedAt?: Date }).updatedAt ?? null;
    return {
      scopeId: sid,
      tenantSlug: t?.slug ?? null,
      tenantName: t?.name ?? null,
      roles,
      updatedAt,
    };
  });
  return {
    items,
    ...(page.nextCursor ? { nextCursor: page.nextCursor } : {}),
  } as const;
}
