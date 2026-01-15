import {
  col,
  COLLECTIONS,
  connectDb as connectDriverDb,
  logger,
  softDeleteFilter,
  runStatsAggregation,
  parseSortSpec,
  seekPageMongoCollection,
  maybeObjectId,
  QueryBuilder,
  toMongoFilter,
  UpdateBuilder,
  toMongoUpdate,
  type Document,
  type Filter as MongoFilter,
  type WithId,
} from "@unisane/kernel";
import type { ObjectId } from "mongodb";
import type {
  TenantsRepoPort,
  TenantFilter,
} from "../domain/ports";
import type { TenantRow, LatestSub } from "../domain/types";
import { TenantSchema } from "../domain/entity";

// Driver-side document shape (minimal fields we read/write)
type TenantDoc = {
  _id: string | ObjectId;
  slug: string;
  name: string;
  planId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  deletedBy?: string | null;
} & Document;

const tenantsCol = () => col<TenantDoc>(COLLECTIONS.TENANTS);

/**
 * Tenant entity type for QueryBuilder type safety.
 */
interface TenantEntity {
  slug: string;
  name: string;
  planId: string | null;
  deletedAt: Date | null;
}

/**
 * Build MongoDB filter for tenants (SSOT).
 * Uses database-agnostic QueryBuilder pattern.
 * Used by both listPaged() and stats() to ensure consistency.
 */
function buildTenantFilter(args: {
  filters?: TenantFilter;
}): Record<string, unknown> {
  const query = new QueryBuilder<TenantEntity>();

  // Apply soft-delete filter (deletedAt is null)
  query.whereNull("deletedAt");

  if (!args.filters) {
    return toMongoFilter(query.build());
  }

  const { q, slug, name, planId } = args.filters;

  // Full-text search across slug and name using OR
  if (q && q.trim().length) {
    query.whereTextSearch(q.trim(), ["slug", "name"]);
  }

  // Handle individual field filters
  if (slug !== undefined) {
    if (typeof slug === "string") {
      query.whereEq("slug", slug);
    } else if (typeof slug === "object" && slug !== null) {
      // Handle FilterOp<string> style filters
      const op = slug as { eq?: string; contains?: string; in?: string[] };
      if (op.eq) query.whereEq("slug", op.eq);
      else if (op.contains) query.whereContains("slug", op.contains);
      else if (op.in?.length) query.whereIn("slug", op.in);
    }
  }

  if (name !== undefined) {
    if (typeof name === "string") {
      query.whereEq("name", name);
    } else if (typeof name === "object" && name !== null) {
      const op = name as { eq?: string; contains?: string; in?: string[] };
      if (op.eq) query.whereEq("name", op.eq);
      else if (op.contains) query.whereContains("name", op.contains);
      else if (op.in?.length) query.whereIn("name", op.in);
    }
  }

  if (planId !== undefined) {
    if (typeof planId === "string" || planId === null) {
      query.whereEq("planId", planId);
    } else if (typeof planId === "object" && planId !== null) {
      const op = planId as { eq?: string | null; in?: (string | null)[] };
      if (op.eq !== undefined) query.whereEq("planId", op.eq);
      else if (op.in?.length) query.whereIn("planId", op.in);
    }
  }

  // Build and convert to MongoDB filter
  const spec = query.build();
  const mongoFilter = toMongoFilter(spec);

  // Merge with soft-delete filter from kernel (for compatibility)
  return {
    ...softDeleteFilter(),
    ...mongoFilter,
  };
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
  async updatePlanId(scopeId: string, planId: string): Promise<void> {
    await connectDriverDb();
    const builder = new UpdateBuilder<TenantDoc>()
      .set("planId", planId)
      .set("updatedAt", new Date());
    await tenantsCol().updateOne(
      { _id: maybeObjectId(scopeId) },
      toMongoUpdate(builder.build()) as Document
    );
  },
  async deleteCascade(args: { scopeId: string; actorId?: string }) {
    await connectDriverDb();
    const { scopeId, actorId } = args;
    const now = new Date();

    // Verify tenant exists and not already deleted
    const tenant = await tenantsCol().findOne({
      _id: maybeObjectId(scopeId),
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
      const apiKeysBuilder = new UpdateBuilder<Record<string, unknown>>()
        .set("revokedAt", now)
        .set("updatedAt", now);
      const apiKeysResult = await col(COLLECTIONS.API_KEYS).updateMany(
        { scopeId, revokedAt: null } as Document,
        toMongoUpdate(apiKeysBuilder.build()) as Document
      );
      cascade.apiKeysRevoked = apiKeysResult.modifiedCount;
    } catch (error) {
      logger.warn('tenant.delete.cascade.apikeys_failed', {
        scopeId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Continue with deletion - API keys will become orphaned but harmless
    }

    // 2) Soft delete memberships
    try {
      const membershipsBuilder = new UpdateBuilder<Record<string, unknown>>()
        .set("deletedAt", now)
        .set("updatedAt", now);
      const membershipsResult = await col(COLLECTIONS.MEMBERSHIPS).updateMany(
        { scopeId, ...softDeleteFilter() } as Document,
        toMongoUpdate(membershipsBuilder.build()) as Document
      );
      cascade.membershipsDeleted = membershipsResult.modifiedCount;
    } catch (error) {
      logger.warn('tenant.delete.cascade.memberships_failed', {
        scopeId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Continue with deletion - memberships will become orphaned
    }

    // 3) Mark storage files as deleted (cleanup job handles provider)
    try {
      const storageBuilder = new UpdateBuilder<Record<string, unknown>>()
        .set("status", "deleted")
        .set("deletedAt", now)
        .set("updatedAt", now);
      const storageResult = await col(COLLECTIONS.FILES).updateMany(
        { scopeId, status: { $ne: "deleted" } } as Document,
        toMongoUpdate(storageBuilder.build()) as Document
      );
      cascade.storageFilesMarked = storageResult.modifiedCount;
    } catch (error) {
      logger.warn('tenant.delete.cascade.storage_failed', {
        scopeId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Continue with deletion - storage cleanup job will handle orphans
    }

    // 4) Soft delete tenant
    try {
      const tenantBuilder = new UpdateBuilder<TenantDoc>()
        .set("deletedAt", now)
        .set("deletedBy", actorId ?? null)
        .set("updatedAt", now);
      await tenantsCol().updateOne(
        { _id: maybeObjectId(scopeId) } as Document,
        toMongoUpdate(tenantBuilder.build()) as Document
      );
    } catch (error) {
      logger.error('tenant.delete.soft_delete_failed', {
        scopeId,
        actorId,
        error: error instanceof Error ? error.message : String(error),
      });
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
