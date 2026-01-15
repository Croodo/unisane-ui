import type { RoleId } from "@unisane/kernel";
import type { Permission } from "@unisane/kernel";
import type { GrantEffect } from "@unisane/kernel";

export type Membership = {
  scopeId: string;
  userId: string;
  roles: { roleId: RoleId; grantedAt?: Date }[];
  grants: { perm: Permission; effect: GrantEffect }[];
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ApiKey = {
  id: string;
  scopeId: string;
  name?: string;
  scopes: string[];
  createdBy?: string;
  revokedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UserRow = {
  id: string;
  email: string;
  displayName?: string | null;
  imageUrl?: string | null;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  emailVerified?: boolean | null;
  phoneVerified?: boolean | null;
  locale?: string | null;
  timezone?: string | null;
  globalRole?: GlobalRole | null;
  authUserId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  sessionsRevokedAt?: Date | null;
};

// Mapping/minimal user projection used by mappers and services
export type MinimalUserRow = {
  id: string;
  email: string;
  displayName?: string | null;
  imageUrl?: string | null;
  globalRole?: GlobalRole | null;
};

export type MembershipsApi = {
  get(scopeId: string, userId: string): Promise<Membership | null>;
  addRole(
    scopeId: string,
    userId: string,
    roleId: RoleId,
    expectedVersion?: number
  ): Promise<
    | { ok: true; membership: Membership | null }
    | { conflict: true; expected: number }
  >;
  removeRole(
    scopeId: string,
    userId: string,
    roleId: RoleId,
    expectedVersion?: number
  ): Promise<
    | { ok: true; membership: Membership | null }
    | { conflict: true; expected: number }
  >;
  grantPerm(
    scopeId: string,
    userId: string,
    perm: Permission,
    effect: GrantEffect,
    expectedVersion?: number
  ): Promise<
    | { ok: true; membership: Membership | null }
    | { conflict: true; expected: number }
  >;
  revokePerm(
    scopeId: string,
    userId: string,
    perm: Permission,
    expectedVersion?: number
  ): Promise<
    | { ok: true; membership: Membership | null }
    | { conflict: true; expected: number }
  >;
  findLatestForUser(userId: string): Promise<Membership | null>;
  listByScope(
    scopeId: string,
    limit?: number,
    cursor?: string
  ): Promise<{ items: Membership[]; nextCursor?: string }>;
  listByUser(
    userId: string,
    limit?: number,
    cursor?: string
  ): Promise<{ items: Membership[]; nextCursor?: string }>;
  delete(
    scopeId: string,
    userId: string,
    expectedVersion?: number
  ): Promise<
    | { ok: true; membership: Membership | null }
    | { notFound: true }
    | { conflict: true; expected: number }
  >;
  deleteAllForUser(userId: string): Promise<{ deletedCount: number }>;
};

export type UserCreateInput = {
  email: string;
  displayName?: string | null;
  imageUrl?: string | null;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  locale?: string | null;
  timezone?: string | null;
  globalRole?: GlobalRole | null;
  authUserId?: string | null;
};

export type UserUpdateInput = Partial<UserCreateInput> & {
  emailVerified?: boolean | null;
  phoneVerified?: boolean | null;
  sessionsRevokedAt?: Date | null;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  sessions?: Record<string, unknown>;
};

import type { SortField } from "@unisane/kernel";

export type UsersApi = {
  create(payload: UserCreateInput): Promise<UserRow>;
  findByEmail(email: string): Promise<UserRow | null>;
  findByUsername(username: string): Promise<UserRow | null>;
  findByPhone(phone: string): Promise<UserRow | null>;
  findByAuthUserId(authUserId: string): Promise<UserRow | null>;
  findById(id: string): Promise<UserRow | null>;
  findByIds(ids: string[]): Promise<Map<string, MinimalUserRow>>;
  updateById(id: string, update: UserUpdateInput): Promise<UserRow | null>;
  deleteById(id: string): Promise<{ deletedCount: number } | null>;
  listPaged(args: {
    limit: number;
    cursor?: string | null;
    sortVec: SortField[];
    projection?: Record<string, 0 | 1>;
    filters?: {
      q?: string;
      email?: { eq?: string; contains?: string; in?: string[] };
      displayName?: { eq?: string; contains?: string };
      updatedAt?: { gte?: Date | string; lte?: Date | string };
    };
  }): Promise<{ items: UserRow[]; nextCursor?: string; prevCursor?: string }>;

  // Admin enrichments
  stats(args: {
    filters?: {
      q?: string;
      email?: { eq?: string; contains?: string; in?: string[] };
      displayName?: { eq?: string; contains?: string };
      updatedAt?: { gte?: Date | string; lte?: Date | string };
    };
  }): Promise<{
    total: number;
    facets: Record<string, Record<string, number>>;
  }>;
  getMembershipsCount(
    userId: string
  ): Promise<{ scopesCount: number; adminScopesCount: number }>;
  getApiKeysCreatedCount(userId: string): Promise<number>;
  getLastActivity(userId: string): Promise<Date | null>;

  // Cross-module aggregations for Tenants module
  getScopeMembershipCounts(
    scopeIds: string[]
  ): Promise<Map<string, { membersCount: number; adminsCount: number }>>;
  getScopeApiKeyCounts(scopeIds: string[]): Promise<Map<string, number>>;
};

// Service-level summary used by identity/service/me and the /me route
export type MeSummary = {
  userId: string | null;
  scopeId: string | null;
  tenantSlug?: string | null;
  tenantName?: string | null;
  role: string | null;
  plan: string | null;
  displayName?: string | null;
  email?: string | null;
  globalRole?: GlobalRole | null;
  perms: Permission[];
  isSuperAdmin?: boolean;
};
import type { GlobalRole } from "@unisane/kernel";


export type GetMeSummaryArgs = {
  userId?: string;
  perms?: Permission[];
  isSuperAdmin?: boolean;
};

export type GetMyProfileArgs = {
  userId: string;
};

export type UpdateMyProfileArgs = {
  userId: string;
  patch: {
    displayName?: string | null;
    imageUrl?: string | null;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    locale?: string | null;
    timezone?: string | null;
  };
};

export type ListMembersArgs = {
  limit: number;
  cursor?: string;
};

export type ListMyMembershipsArgs = {
  userId: string;
  limit: number;
  cursor?: string;
};

export type AddRoleArgs = {
  userId: string;
  roleId: RoleId;
  expectedVersion?: number;
};

export type GrantPermArgs = {
  userId: string;
  perm: Permission;
  effect: GrantEffect;
  expectedVersion?: number;
};

export type RemoveRoleArgs = {
  userId: string;
  roleId: RoleId;
  expectedVersion?: number;
};

export type RevokePermArgs = {
  userId: string;
  perm: Permission;
  expectedVersion?: number;
};

export type GetMembershipArgs = {
  userId: string;
};

export type RemoveMemberArgs = {
  userId: string;
  expectedVersion?: number;
};

export type CreateTenantForUserArgs = {
  userId: string;
  input: { name: string; slug?: string };
};

export type FindTenantBySlugArgs = {
  slug: string;
};

export type ListUsersArgs = {
  limit: number;
  cursor?: string;
  sort?: string;
  filters?: {
    q?: string;
    email?: { eq?: string; contains?: string; in?: string[] };
    displayName?: { eq?: string; contains?: string };
    updatedAt?: { gte?: Date | string; lte?: Date | string };
  };
};

export type UpdateUserArgs = {
  userId: string;
  patch: {
    displayName?: string | null;
    imageUrl?: string | null;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    locale?: string | null;
    timezone?: string | null;
  };
};

export type DeleteUserArgs = {
  userId: string;
  actorId?: string;
};

export type RevokeSessionsArgs = {
  userId: string;
};

export type UsernameAvailableArgs = {
  value: string;
};

export type PhoneAvailableArgs = {
  value: string;
};
