import type { Membership, MinimalUserRow } from "./types";
import type { RoleId } from "@unisane/kernel";
import type { Permission } from "@unisane/kernel";
import type { GrantEffect } from "@unisane/kernel";
import type { GlobalRole } from "@unisane/kernel";

export function toUserDto(row: MinimalUserRow) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName ?? null,
    imageUrl: row.imageUrl ?? null,
    role: (row as { globalRole?: GlobalRole | null }).globalRole ?? null,
  } as const;
}

export type MembershipDoc = {
  scopeId: string;
  userId: string;
  roles?: Array<{ roleId: RoleId; grantedAt?: Date }>;
  grants?: Array<{ perm: Permission; effect: GrantEffect }>;
  version?: number;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export function mapMembershipDocToMembership(
  doc: MembershipDoc | null
): Membership | null {
  if (!doc) return null;
  const result: Membership = {
    scopeId: doc.scopeId,
    userId: doc.userId,
    roles: doc.roles ?? [],
    grants: doc.grants ?? [],
    version: doc.version ?? 0,
  };
  if (doc.createdAt) result.createdAt = doc.createdAt;
  if (doc.updatedAt) result.updatedAt = doc.updatedAt;
  return result;
}
