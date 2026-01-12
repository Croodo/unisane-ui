import { col, COLLECTIONS, connectDb as connectDriverDb } from "@unisane/kernel";
import type {
  TenantsRepoPort,
  TenantFilter,
} from "../domain/ports";
import type { TenantRow, LatestSub } from "../domain/types";
import {
  buildMongoFilter,
  escapeRegex,
  softDeleteFilter,
} from "@unisane/kernel";
import { runStatsAggregation, parseSortSpec } from "@unisane/kernel";
import { seekPageMongoCollection } from "@unisane/kernel";
import type { Document, Filter as MongoFilter, WithId } from "mongodb";
import { ObjectId } from "mongodb";
import { TenantSchema } from "../domain/entity";
import { maybeObjectId } from "@unisane/kernel";

// Driver-side document shape (minimal fields we read/write)
type TenantDoc = {
  _id: string | ObjectId;
  slug: string;
  name: string;
  planId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
} & Document;

const tenantsCol = () => col<TenantDoc>(COLLECTIONS.TENANTS);

/**
 * Build MongoDB filter for tenants (SSOT).
 * Used by both listPaged() and stats() to ensure consistency.
 */
function buildTenantFilter(args: {
  filters?: TenantFilter;
}): Record<string, unknown> {
  const baseFilter: Record<string, unknown> = {
    ...softDeleteFilter(),
  };

  if (args.filters) {
    const { q, ...rest } = args.filters;

    // Use generic builder for standard fields
    const built = buildMongoFilter(rest);
    Object.assign(baseFilter, built);

    // Handle special "q" search
    if (q && q.trim().length) {
      const needle = escapeRegex(q.trim());
      const existingAnd = (baseFilter["$and"] as unknown[] | undefined) ?? [];
      baseFilter["$and"] = [
        ...existingAnd,
        {
          $or: [
            { slug: { $regex: needle, $options: "i" } },
            { name: { $regex: needle, $options: "i" } },
          ],
        },
      ];
    }
  }

  return baseFilter;
}

export const TenantsRepoMongo: TenantsRepoPort = {
  async countAll() {
    await connectDriverDb();
    return tenantsCol().countDocuments(softDeleteFilter());
  },
  async findById(id: string): Promise<TenantRow | null> {
    await connectDriverDb();
    const t = await tenantsCol().findOne({
      _id: maybeObjectId(id),
      ...softDeleteFilter(),
    });
    if (!t) return null;
    return {
      id: String(t._id),
      slug: t.slug,
      name: t.name,
      planId: t.planId ?? "free",
    };
  },
  async findBySlug(slug: string): Promise<TenantRow | null> {
    await connectDriverDb();
    const t = await tenantsCol().findOne({
      slug,
      ...softDeleteFilter(),
    });
    if (!t) return null;
    return {
      id: String(t._id),
      slug: t.slug,
      name: t.name,
      planId: t.planId ?? "free",
    };
  },
  async create(input: {
    slug: string;
    name: string;
    planId?: string | null;
  }): Promise<TenantRow> {
    await connectDriverDb();
    const now = new Date();
    const planId = input.planId ?? "free";
    const ins = {
      slug: input.slug,
      name: input.name,
      planId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null as Date | null,
    } as TenantDoc;
    const r = await tenantsCol().insertOne(ins);
    const insertedId = r.insertedId;
    return {
      id: String(insertedId),
      slug: ins.slug,
      name: ins.name,
      planId: ins.planId ?? "free",
    };
  },
  async findMany(ids: string[]): Promise<TenantRow[]> {
    if (!ids?.length) return [];
    await connectDriverDb();
    const filter: MongoFilter<TenantDoc> = {
      _id: { $in: ids.map(maybeObjectId) },
      ...softDeleteFilter(),
    };
    const rows = await tenantsCol()
      .find(filter)
      .project({ slug: 1, name: 1, planId: 1 } as Document)
      .toArray();
    return rows.map((t) => ({
      id: String(t._id),
      slug: t.slug,
      name: t.name,
      planId: t.planId ?? "free",
    }));
  },
  async setPlanId(tenantId: string, planId: string): Promise<void> {
    await connectDriverDb();
    await tenantsCol().updateOne(
      { _id: maybeObjectId(tenantId) },
      { $set: { planId, updatedAt: new Date() } }
    );
  },
  async deleteCascade(args: { tenantId: string; actorId?: string }) {
    await connectDriverDb();
    const { tenantId, actorId } = args;
    const now = new Date();

    // Verify tenant exists and not already deleted
    const tenant = await tenantsCol().findOne({
      _id: maybeObjectId(tenantId),
      ...softDeleteFilter(),
    });
    if (!tenant) {
      return {
        deleted: false,
        cascade: { apiKeysRevoked: 0, membershipsDeleted: 0, storageFilesMarked: 0 },
      } as const;
    }

    const cascade = { apiKeysRevoked: 0, membershipsDeleted: 0, storageFilesMarked: 0 };

    // 1) Revoke all API keys (security first)
    try {
      const apiKeysResult = await col(COLLECTIONS.API_KEYS).updateMany(
        { tenantId, revokedAt: null } as Document,
        { $set: { revokedAt: now, updatedAt: now } } as Document
      );
      cascade.apiKeysRevoked = apiKeysResult.modifiedCount;
    } catch {}

    // 2) Soft delete memberships
    try {
      const membershipsResult = await col(COLLECTIONS.MEMBERSHIPS).updateMany(
        { tenantId, ...softDeleteFilter() } as Document,
        { $set: { deletedAt: now, updatedAt: now } } as Document
      );
      cascade.membershipsDeleted = membershipsResult.modifiedCount;
    } catch {}

    // 3) Mark storage files as deleted (cleanup job handles provider)
    try {
      const storageResult = await col(COLLECTIONS.FILES).updateMany(
        { tenantId, status: { $ne: "deleted" } } as Document,
        { $set: { status: "deleted", deletedAt: now, updatedAt: now } } as Document
      );
      cascade.storageFilesMarked = storageResult.modifiedCount;
    } catch {}

    // 4) Soft delete tenant
    try {
      await tenantsCol().updateOne(
        { _id: maybeObjectId(tenantId) } as Document,
        { $set: { deletedAt: now, deletedBy: actorId ?? null, updatedAt: now } } as Document
      );
    } catch {
      return { deleted: false, cascade } as const;
    }

    return { deleted: true, cascade } as const;
  },
  async listPaged(args: {
    limit: number;
    cursor?: string | null;
    sort?: string;
    filters?: TenantFilter;
  }) {
    await connectDriverDb();
    const allowedSortFields = {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      name: "name",
      slug: "slug",
      _id: "_id",
    };
    const sortVec = parseSortSpec(args.sort, allowedSortFields);
    const baseFilter = buildTenantFilter(args);

    const projection: Record<string, 0 | 1> = {
      slug: 1,
      name: 1,
      planId: 1,
      createdAt: 1,
      updatedAt: 1,
    };
    const { items, nextCursor, prevCursor } = await seekPageMongoCollection<
      TenantDoc,
      TenantRow
    >({
      collection: tenantsCol(),
      baseFilter,
      limit: args.limit,
      cursor: args.cursor ?? null,
      sortVec,
      projection,
      map: (t: WithId<TenantDoc>) => ({
        id: String(t._id),
        slug: t.slug,
        name: t.name,
        planId: t.planId ?? "free",
      }),
    });
    return {
      items,
      ...(nextCursor ? { nextCursor } : {}),
      ...(prevCursor ? { prevCursor } : {}),
    } as const;
  },

  async stats(args: { filters?: TenantFilter }) {
    await connectDriverDb();
    const filter = buildTenantFilter(args);
    return runStatsAggregation(tenantsCol(), filter, TenantSchema);
  },
};
