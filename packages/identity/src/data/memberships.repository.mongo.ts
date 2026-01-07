import { col, tenantFilter, tenantFilterActive, softDeleteFilter } from "@unisane/kernel";
import type { Document, Filter, WithId } from "mongodb";
import type { RoleId } from "@unisane/kernel";
import type { Permission } from "@unisane/kernel";
import type { GrantEffect } from "@unisane/kernel";
import { seekPageMongoCollection } from "@unisane/kernel";
import type { MembershipsApi, Membership } from "../domain/types";
import {
  mapMembershipDocToMembership,
  type MembershipDoc,
} from "../domain/mappers";
import { clampInt } from "@unisane/kernel";

const mCol = () => col<MembershipDoc>("memberships");

function extractMembership(r: unknown): MembershipDoc | null {
  const rUnknown = r as { value?: MembershipDoc | null };
  return rUnknown.value !== undefined
    ? rUnknown.value
    : (r as MembershipDoc | null);
}

export const mongoMembershipsRepository: MembershipsApi = {
  async get(tenantId: string, userId: string): Promise<Membership | null> {
    // Use tenantFilterActive for automatic tenant scoping + soft delete filter
    const doc = await mCol().findOne(
      tenantFilterActive({ userId }) as Document
    );
    return mapMembershipDocToMembership(doc);
  },

  async addRole(
    tenantId: string,
    userId: string,
    roleId: RoleId,
    expectedVersion?: number
  ) {
    // Use tenantFilterActive for automatic tenant scoping + soft delete filter
    const current = await mCol().findOne(
      tenantFilterActive({ userId }) as Document
    );
    if (
      current &&
      expectedVersion !== undefined &&
      (current.version ?? 0) !== expectedVersion
    ) {
      return { conflict: true as const, expected: current.version ?? 0 };
    }
    const now = new Date();
    // Use tenantFilter for update operation
    const r = await mCol().findOneAndUpdate(
      tenantFilter({ userId }) as Document,
      {
        $addToSet: { roles: { roleId, grantedAt: now } },
        $inc: { version: 1 },
        $set: { updatedAt: now },
        $setOnInsert: { createdAt: now },
      } as Document,
      { upsert: true, returnDocument: "after" }
    );
    return {
      ok: true as const,
      membership: mapMembershipDocToMembership(extractMembership(r)),
    };
  },

  async removeRole(
    tenantId: string,
    userId: string,
    roleId: RoleId,
    expectedVersion?: number
  ) {
    // Use tenantFilterActive for automatic tenant scoping + soft delete filter
    const current = await mCol().findOne(
      tenantFilterActive({ userId }) as Document
    );
    if (
      current &&
      expectedVersion !== undefined &&
      (current.version ?? 0) !== expectedVersion
    ) {
      return { conflict: true as const, expected: current.version ?? 0 };
    }
    const now = new Date();
    // Use tenantFilter for update operation
    const r = await mCol().findOneAndUpdate(
      tenantFilter({ userId }) as Document,
      {
        $pull: { roles: { roleId } },
        $inc: { version: 1 },
        $set: { updatedAt: now },
      } as Document,
      { returnDocument: "after" }
    );
    return {
      ok: true as const,
      membership: mapMembershipDocToMembership(extractMembership(r)),
    };
  },

  async grantPerm(
    tenantId: string,
    userId: string,
    perm: Permission,
    effect: GrantEffect,
    expectedVersion?: number
  ) {
    // Use tenantFilterActive for automatic tenant scoping + soft delete filter
    const current = await mCol().findOne(
      tenantFilterActive({ userId }) as Document
    );
    if (
      current &&
      expectedVersion !== undefined &&
      (current.version ?? 0) !== expectedVersion
    ) {
      return { conflict: true as const, expected: current.version ?? 0 };
    }
    const now = new Date();
    // Use tenantFilter for update operation
    const r = await mCol().findOneAndUpdate(
      tenantFilter({ userId }) as Document,
      {
        $addToSet: { grants: { perm, effect } },
        $inc: { version: 1 },
        $set: { updatedAt: now },
        $setOnInsert: { createdAt: now },
      } as Document,
      { upsert: true, returnDocument: "after" }
    );
    return {
      ok: true as const,
      membership: mapMembershipDocToMembership(extractMembership(r)),
    };
  },

  async revokePerm(
    tenantId: string,
    userId: string,
    perm: Permission,
    expectedVersion?: number
  ) {
    // Use tenantFilterActive for automatic tenant scoping + soft delete filter
    const current = await mCol().findOne(
      tenantFilterActive({ userId }) as Document
    );
    if (
      current &&
      expectedVersion !== undefined &&
      (current.version ?? 0) !== expectedVersion
    ) {
      return { conflict: true as const, expected: current.version ?? 0 };
    }
    const now = new Date();
    // Use tenantFilter for update operation
    const r = await mCol().findOneAndUpdate(
      tenantFilter({ userId }) as Document,
      {
        $pull: { grants: { perm } },
        $inc: { version: 1 },
        $set: { updatedAt: now },
      } as Document,
      { returnDocument: "after" }
    );
    return {
      ok: true as const,
      membership: mapMembershipDocToMembership(extractMembership(r)),
    };
  },

  // NOTE: Cross-tenant operation - intentionally NOT using tenantFilter()
  // This finds the user's latest membership across ALL tenants for session/context init
  async findLatestForUser(userId: string): Promise<Membership | null> {
    const doc = await mCol()
      .find({
        userId,
        ...softDeleteFilter(),
      } as Document)
      .sort({ updatedAt: -1 })
      .limit(1)
      .next();
    return mapMembershipDocToMembership(doc);
  },

  async listByTenant(
    tenantId: string,
    limit = 100,
    cursor?: string
  ): Promise<{ items: Membership[]; nextCursor?: string }> {
    const max = clampInt(limit, 1, 500);
    // Use tenantFilterActive for automatic tenant scoping + soft delete filter
    const baseFilter = tenantFilterActive({}) as Filter<MembershipDoc>;
    const projection: Record<string, 0 | 1> = {
      tenantId: 1,
      userId: 1,
      roles: 1,
      grants: 1,
      version: 1,
      createdAt: 1,
      updatedAt: 1,
      _id: 1,
    };
    const { items, nextCursor: next } = await seekPageMongoCollection<
      MembershipDoc,
      Membership
    >({
      collection: mCol(),
      baseFilter,
      limit: max,
      cursor: cursor ?? null,
      sortVec: [{ key: "_id", order: -1 }],
      projection,
      map: (m: WithId<MembershipDoc>): Membership => ({
        tenantId: m.tenantId,
        userId: m.userId,
        roles: m.roles ?? [],
        grants: m.grants ?? [],
        version: m.version ?? 0,
        ...(m.createdAt ? { createdAt: m.createdAt } : {}),
        ...(m.updatedAt ? { updatedAt: m.updatedAt } : {}),
      }),
    });
    return { items, ...(next ? { nextCursor: next } : {}) };
  },

  // NOTE: Cross-tenant operation - intentionally NOT using tenantFilter()
  // This lists a user's memberships across ALL tenants (e.g., for workspace switcher)
  async listByUser(
    userId: string,
    limit = 100,
    cursor?: string
  ): Promise<{ items: Membership[]; nextCursor?: string }> {
    const max = clampInt(limit, 1, 500);
    const baseFilter: Filter<MembershipDoc> = { userId, deletedAt: null };
    const projection: Record<string, 0 | 1> = {
      tenantId: 1,
      userId: 1,
      roles: 1,
      grants: 1,
      version: 1,
      createdAt: 1,
      updatedAt: 1,
      _id: 1,
    };
    const { items, nextCursor: next } = await seekPageMongoCollection<
      MembershipDoc,
      Membership
    >({
      collection: mCol(),
      baseFilter,
      limit: max,
      cursor: cursor ?? null,
      sortVec: [{ key: "_id", order: -1 }],
      projection,
      map: (m: WithId<MembershipDoc>): Membership => ({
        tenantId: m.tenantId,
        userId: m.userId,
        roles: m.roles ?? [],
        grants: m.grants ?? [],
        version: m.version ?? 0,
        ...(m.createdAt ? { createdAt: m.createdAt } : {}),
        ...(m.updatedAt ? { updatedAt: m.updatedAt } : {}),
      }),
    });
    return { items, ...(next ? { nextCursor: next } : {}) };
  },

  async delete(tenantId: string, userId: string, expectedVersion?: number) {
    // Use tenantFilterActive for automatic tenant scoping + soft delete filter
    const current = await mCol().findOne(
      tenantFilterActive({ userId }) as Document
    );
    if (!current) {
      return { notFound: true as const };
    }
    if (
      expectedVersion !== undefined &&
      (current.version ?? 0) !== expectedVersion
    ) {
      return { conflict: true as const, expected: current.version ?? 0 };
    }
    const now = new Date();
    // Use tenantFilter for update operation
    await mCol().updateOne(
      tenantFilter({ userId }) as Document,
      {
        $set: { deletedAt: now, updatedAt: now },
        $inc: { version: 1 },
      } as Document
    );
    return {
      ok: true as const,
      membership: mapMembershipDocToMembership(current),
    };
  },

  // NOTE: Cross-tenant operation - intentionally NOT using tenantFilter()
  // This deletes a user's memberships across ALL tenants (used during user deletion)
  async deleteAllForUser(userId: string): Promise<{ deletedCount: number }> {
    const res = await mCol().updateMany(
      {
        userId,
        ...softDeleteFilter(),
      } as Document,
      { $set: { deletedAt: new Date(), updatedAt: new Date() } } as Document
    );
    return { deletedCount: Number(res.modifiedCount ?? 0) };
  },
};
