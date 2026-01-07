import { usersRepository, membershipsRepository } from "../data/repo";
import { ERR } from "@unisane/gateway";
import { invalidatePermsForUser } from "./perms";
import { getTenantId, resolveEntitlements, events } from "@unisane/kernel";
import { IDENTITY_EVENTS } from "../domain/constants";
import { getTenantsRepo } from "../providers";
import type { RoleId } from "@unisane/kernel";
import type { Permission } from "@unisane/kernel";
import type { GrantEffect } from "@unisane/kernel";

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
  const tenantId = getTenantId(); // Throws if not set
  const { userId, roleId, expectedVersion } = args;
  const existing = await membershipsRepository.get(tenantId, userId);
  const isNewSeat =
    !existing || !Array.isArray(existing.roles) || existing.roles.length === 0;
  if (isNewSeat) {
    const ent = await resolveEntitlements(tenantId);
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
      const page = await membershipsRepository.listByTenant(
        tenantId,
        maxSeats + 1
      );
      const activeSeats = page.items.filter(
        (m) =>
          Array.isArray((m as { roles?: unknown }).roles) &&
          (m as { roles: unknown[] }).roles.length > 0
      ).length;
      if (activeSeats >= maxSeats) {
        throw ERR.validation("Seat limit reached for this workspace plan");
      }
    }
  }
  const res = await membershipsRepository.addRole(
    tenantId,
    userId,
    roleId,
    expectedVersion
  );
  if ("conflict" in res) throw ERR.versionMismatch();
  await invalidatePermsForUser(tenantId, userId);
  await events.emit(IDENTITY_EVENTS.MEMBERSHIP_ROLE_CHANGED, {
    tenantId,
    userId,
    roleId,
    action: "added",
  });
  return res.membership;
}

export async function grantPerm(args: GrantPermArgs) {
  const tenantId = getTenantId(); // Throws if not set
  const { userId, perm, effect, expectedVersion } = args;
  const res = await membershipsRepository.grantPerm(
    tenantId,
    userId,
    perm,
    effect,
    expectedVersion
  );
  if ("conflict" in res) throw ERR.versionMismatch();
  await invalidatePermsForUser(tenantId, userId);
  return res.membership;
}

export async function getActiveTenantId(
  userId: string
): Promise<string | undefined> {
  const m = await membershipsRepository.findLatestForUser(userId);
  return m?.tenantId ?? undefined;
}

export async function getMembership(args: GetMembershipArgs) {
  const tenantId = getTenantId(); // Throws if not set
  return membershipsRepository.get(tenantId, args.userId);
}

export async function removeRole(args: RemoveRoleArgs) {
  const tenantId = getTenantId(); // Throws if not set
  const { userId, roleId, expectedVersion } = args;
  const res = await membershipsRepository.removeRole(
    tenantId,
    userId,
    roleId,
    expectedVersion
  );
  if ("conflict" in res) throw ERR.versionMismatch();
  await invalidatePermsForUser(tenantId, userId);
  await events.emit(IDENTITY_EVENTS.MEMBERSHIP_ROLE_CHANGED, {
    tenantId,
    userId,
    roleId,
    action: "removed",
  });
  return res.membership;
}

export async function revokePerm(args: RevokePermArgs) {
  const tenantId = getTenantId(); // Throws if not set
  const { userId, perm, expectedVersion } = args;
  const res = await membershipsRepository.revokePerm(
    tenantId,
    userId,
    perm,
    expectedVersion
  );
  if ("conflict" in res) throw ERR.versionMismatch();
  await invalidatePermsForUser(tenantId, userId);
  return res.membership;
}

export async function listMembers(args: ListMembersArgs) {
  const tenantId = getTenantId(); // Throws if not set
  const page = await membershipsRepository.listByTenant(
    tenantId,
    args.limit,
    args.cursor
  );

  const userIds = [
    ...new Set(
      page.items
        .map((m) => (m as { userId?: string }).userId)
        .filter((id): id is string => !!id)
    ),
  ];

  const userMap = await usersRepository.findByIds(userIds);

  const items = page.items.map((m) => {
    const userId = (m as { userId?: string }).userId ?? null;
    const user = userId ? userMap.get(userId) : null;
    return {
      id: `${tenantId}:${userId}`, // Composite key for memberships
      tenantId: (m as { tenantId?: string }).tenantId ?? tenantId,
      userId,
      userName: user?.displayName ?? null,
      userEmail: user?.email ?? null,
      roles: (m as { roles?: { roleId: RoleId }[] }).roles ?? [],
      grants:
        (m as { grants?: { perm: Permission; effect: GrantEffect }[] })
          .grants ?? [],
      version: (m as { version?: number }).version ?? 0,
      createdAt: (m as { createdAt?: Date }).createdAt ?? null,
      updatedAt: (m as { updatedAt?: Date }).updatedAt ?? null,
    };
  });
  return {
    items,
    ...(page.nextCursor ? { nextCursor: page.nextCursor } : {}),
  } as const;
}

export async function removeMember(args: RemoveMemberArgs) {
  const tenantId = getTenantId(); // Throws if not set
  const { userId, expectedVersion } = args;
  const res = await membershipsRepository.delete(
    tenantId,
    userId,
    expectedVersion
  );
  if ("notFound" in res) throw ERR.notFound("Membership not found");
  if ("conflict" in res) throw ERR.versionMismatch();
  await invalidatePermsForUser(tenantId, userId);
  return { ok: true };
}

export async function listMyMemberships(args: ListMyMembershipsArgs) {
  const page = await membershipsRepository.listByUser(
    args.userId,
    args.limit,
    args.cursor
  );
  const tenantIds = page.items.map((m) =>
    String((m as { tenantId: unknown }).tenantId)
  );
  const tenantsRepo = getTenantsRepo();
  const tenants = await tenantsRepo.findMany(tenantIds);
  type TenantRecord = { id: string; slug?: string; name?: string };
  const tMap = new Map<string, TenantRecord>(tenants.map((t: TenantRecord) => [t.id, t]));
  const items = page.items.map((m) => {
    const tid = String((m as { tenantId: unknown }).tenantId);
    const t = tMap.get(tid);
    const roles =
      (m as { roles?: Array<{ roleId: RoleId }> }).roles?.map(
        (r) => r.roleId
      ) ?? [];
    const updatedAt = (m as { updatedAt?: Date }).updatedAt ?? null;
    return {
      tenantId: tid,
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
