import {
  col,
  COLLECTIONS,
  softDeleteFilter,
  explicitScopeFilter,
  explicitScopeFilterActive,
  seekPageMongoCollection,
  clampInt,
  UpdateBuilder,
  toMongoUpdate,
  type RoleId,
  type Permission,
  type GrantEffect,
  type Document,
  type Filter,
  type WithId,
} from "@unisane/kernel";
import type { MembershipsApi, Membership } from "../domain/types";
import {
  mapMembershipDocToMembership,
  type MembershipDoc,
} from "../domain/mappers";

const mCol = () => col<MembershipDoc>(COLLECTIONS.MEMBERSHIPS);

function extractMembership(r: unknown): MembershipDoc | null {
  const rUnknown = r as { value?: MembershipDoc | null };
  return rUnknown.value !== undefined
    ? rUnknown.value
    : (r as MembershipDoc | null);
}

export const mongoMembershipsRepository: MembershipsApi = {
  async findByScopeAndUser(scopeId: string, userId: string): Promise<Membership | null> {
    // Use explicit scopeId parameter - NOT from context
    // This is important for auth-time lookups that happen before ctx.run()
    const doc = await mCol().findOne(
      explicitScopeFilterActive('tenant', scopeId, { userId }) as Document
    );
    return mapMembershipDocToMembership(doc);
  },

  async addRole(
    scopeId: string,
    userId: string,
    roleId: RoleId,
    expectedVersion?: number
  ) {
    // Use explicit scopeId - NOT from context
    const current = await mCol().findOne(
      explicitScopeFilterActive('tenant', scopeId, { userId }) as Document
    );
    if (
      current &&
      expectedVersion !== undefined &&
      (current.version ?? 0) !== expectedVersion
    ) {
      return { conflict: true as const, expected: current.version ?? 0 };
    }
    const now = new Date();
    const builder = new UpdateBuilder<MembershipDoc>()
      .addToSet("roles", { roleId, grantedAt: now })
      .inc("version", 1)
      .set("updatedAt", now)
      .setOnInsert("createdAt", now);
    const r = await mCol().findOneAndUpdate(
      explicitScopeFilter('tenant', scopeId, { userId }) as Document,
      toMongoUpdate(builder.build()) as Document,
      { upsert: true, returnDocument: "after" }
    );
    return {
      ok: true as const,
      membership: mapMembershipDocToMembership(extractMembership(r)),
    };
  },

  async removeRole(
    scopeId: string,
    userId: string,
    roleId: RoleId,
    expectedVersion?: number
  ) {
    // Use explicit scopeId - NOT from context
    const current = await mCol().findOne(
      explicitScopeFilterActive('tenant', scopeId, { userId }) as Document
    );
    if (
      current &&
      expectedVersion !== undefined &&
      (current.version ?? 0) !== expectedVersion
    ) {
      return { conflict: true as const, expected: current.version ?? 0 };
    }
    const now = new Date();
    const builder = new UpdateBuilder<MembershipDoc>()
      .pull("roles", { roleId })
      .inc("version", 1)
      .set("updatedAt", now);
    const r = await mCol().findOneAndUpdate(
      explicitScopeFilter('tenant', scopeId, { userId }) as Document,
      toMongoUpdate(builder.build()) as Document,
      { returnDocument: "after" }
    );
    return {
      ok: true as const,
      membership: mapMembershipDocToMembership(extractMembership(r)),
    };
  },

  async grantPerm(
    scopeId: string,
    userId: string,
    perm: Permission,
    effect: GrantEffect,
    expectedVersion?: number
  ) {
    // Use explicit scopeId - NOT from context
    const current = await mCol().findOne(
      explicitScopeFilterActive('tenant', scopeId, { userId }) as Document
    );
    if (
      current &&
      expectedVersion !== undefined &&
      (current.version ?? 0) !== expectedVersion
    ) {
      return { conflict: true as const, expected: current.version ?? 0 };
    }
    const now = new Date();
    const builder = new UpdateBuilder<MembershipDoc>()
      .addToSet("grants", { perm, effect })
      .inc("version", 1)
      .set("updatedAt", now)
      .setOnInsert("createdAt", now);
    const r = await mCol().findOneAndUpdate(
      explicitScopeFilter('tenant', scopeId, { userId }) as Document,
      toMongoUpdate(builder.build()) as Document,
      { upsert: true, returnDocument: "after" }
    );
    return {
      ok: true as const,
      membership: mapMembershipDocToMembership(extractMembership(r)),
    };
  },

  async revokePerm(
    scopeId: string,
    userId: string,
    perm: Permission,
    expectedVersion?: number
  ) {
    // Use explicit scopeId - NOT from context
    const current = await mCol().findOne(
      explicitScopeFilterActive('tenant', scopeId, { userId }) as Document
    );
    if (
      current &&
      expectedVersion !== undefined &&
      (current.version ?? 0) !== expectedVersion
    ) {
      return { conflict: true as const, expected: current.version ?? 0 };
    }
    const now = new Date();
    const builder = new UpdateBuilder<MembershipDoc>()
      .pull("grants", { perm })
      .inc("version", 1)
      .set("updatedAt", now);
    const r = await mCol().findOneAndUpdate(
      explicitScopeFilter('tenant', scopeId, { userId }) as Document,
      toMongoUpdate(builder.build()) as Document,
      { returnDocument: "after" }
    );
    return {
      ok: true as const,
      membership: mapMembershipDocToMembership(extractMembership(r)),
    };
  },

  // NOTE: Cross-scope operation - intentionally NOT using scopeFilter()
  // This finds the user's latest membership across ALL scopes for session/context init
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

  async listByScope(
    scopeId: string,
    limit = 100,
    cursor?: string
  ): Promise<{ items: Membership[]; nextCursor?: string }> {
    const max = clampInt(limit, 1, 500);
    // Use explicit scopeId - NOT from context
    const baseFilter = explicitScopeFilterActive('tenant', scopeId, {}) as Filter<MembershipDoc>;
    const projection: Record<string, 0 | 1> = {
      scopeId: 1,
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
        scopeId: m.scopeId,
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

  // NOTE: Cross-scope operation - intentionally NOT using scopeFilter()
  // This lists a user's memberships across ALL scopes (e.g., for workspace switcher)
  async listByUser(
    userId: string,
    limit = 100,
    cursor?: string
  ): Promise<{ items: Membership[]; nextCursor?: string }> {
    const max = clampInt(limit, 1, 500);
    const baseFilter: Filter<MembershipDoc> = { userId, ...softDeleteFilter() };
    const projection: Record<string, 0 | 1> = {
      scopeId: 1,
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
        scopeId: m.scopeId,
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

  async softDelete(scopeId: string, userId: string, expectedVersion?: number) {
    // Use explicit scopeId - NOT from context
    const current = await mCol().findOne(
      explicitScopeFilterActive('tenant', scopeId, { userId }) as Document
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
    await mCol().updateOne(
      explicitScopeFilter('tenant', scopeId, { userId }) as Document,
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

  // NOTE: Cross-scope operation - intentionally NOT using scopeFilter()
  // This soft-deletes a user's memberships across ALL scopes (used during user deletion)
  async softDeleteAllForUser(userId: string): Promise<{ deletedCount: number }> {
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
