/**
 * AUDI-002 FIX: Required MongoDB indexes for optimal performance:
 *
 * 1. Primary query index (most common query pattern):
 *    db.audit_logs.createIndex({ scopeId: 1, createdAt: -1 })
 *
 * 2. Filtered query index (for queryWithFilters):
 *    db.audit_logs.createIndex({ scopeId: 1, action: 1, createdAt: -1 })
 *    db.audit_logs.createIndex({ scopeId: 1, actorId: 1, createdAt: -1 })
 *    db.audit_logs.createIndex({ scopeId: 1, resourceType: 1, createdAt: -1 })
 *
 * 3. Cross-scope aggregation (for findScopeLastActivity):
 *    db.audit_logs.createIndex({ scopeId: 1, createdAt: -1 })
 *
 * Run these during initial setup or migration.
 */
import {
  col,
  COLLECTIONS,
  seekPageMongoCollection,
  logger,
  type SortField,
  type Filter,
  type Document,
  type WithId,
} from "@unisane/kernel";
import type { ObjectId } from "mongodb";
import type { AuditRepoPort, AuditQueryFilters } from "../domain/ports";
import type { AuditLogView } from "../domain/types";
type AuditLogDoc = {
  _id?: ObjectId;
  scopeId: string;
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  requestId?: string | null;
  ip?: string | null;
  ua?: string | null;
  before?: unknown;
  after?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
};

const auditCol = () => col<AuditLogDoc>(COLLECTIONS.AUDIT_LOGS);

export const AuditRepoMongo: AuditRepoPort = {
  async listPage(args) {
    type Row = { _id: unknown; createdAt?: Date } & AuditLogDoc;
    const sortVec: SortField[] = [
      { key: "createdAt", order: -1 },
      { key: "_id", order: -1 },
    ];
    const {
      items: rows,
      nextCursor,
      prevCursor,
    } = await seekPageMongoCollection<AuditLogDoc, AuditLogView>({
      collection: auditCol(),
      baseFilter: { scopeId: args.scopeId } as Filter<AuditLogDoc>,
      limit: args.limit,
      cursor: args.cursor ?? null,
      sortVec,
      projection: {
        _id: 1,
        action: 1,
        resourceType: 1,
        resourceId: 1,
        actorId: 1,
        requestId: 1,
        createdAt: 1,
      },
      map: (r: WithId<AuditLogDoc>) => ({
        id: String(r._id ?? ""),
        action: r.action as string,
        resourceType: r.resourceType as string,
        resourceId: r.resourceId ?? null,
        actorId: r.actorId ?? null,
        requestId: r.requestId ?? null,
        createdAt: r.createdAt!,
      }),
    });
    const mapped: AuditLogView[] = rows;
    return {
      rows: mapped,
      ...(nextCursor ? { nextCursor } : {}),
      ...(prevCursor ? { prevCursor } : {}),
    } as const;
  },

  /**
   * AUDI-001 FIX: Query with filters at database level for efficiency.
   * Filters are applied in the MongoDB query, not in-memory.
   */
  async queryWithFilters(args) {
    const sortVec: SortField[] = [
      { key: "createdAt", order: -1 },
      { key: "_id", order: -1 },
    ];

    // Build filter object from args.filters
    const filter: Record<string, unknown> = { scopeId: args.scopeId };
    if (args.filters?.action) filter.action = args.filters.action;
    if (args.filters?.actorId) filter.actorId = args.filters.actorId;
    if (args.filters?.targetType) filter.resourceType = args.filters.targetType;
    if (args.filters?.targetId) filter.resourceId = args.filters.targetId;

    // Date range filter
    if (args.filters?.from || args.filters?.to) {
      const dateFilter: Record<string, Date> = {};
      if (args.filters.from) dateFilter.$gte = args.filters.from;
      if (args.filters.to) dateFilter.$lte = args.filters.to;
      filter.createdAt = dateFilter;
    }

    const {
      items: rows,
      nextCursor,
    } = await seekPageMongoCollection<AuditLogDoc, AuditLogView>({
      collection: auditCol(),
      baseFilter: filter as Filter<AuditLogDoc>,
      limit: args.limit,
      cursor: args.cursor ?? null,
      sortVec,
      projection: {
        _id: 1,
        action: 1,
        resourceType: 1,
        resourceId: 1,
        actorId: 1,
        requestId: 1,
        createdAt: 1,
      },
      map: (r: WithId<AuditLogDoc>) => ({
        id: String(r._id ?? ""),
        action: r.action as string,
        resourceType: r.resourceType as string,
        resourceId: r.resourceId ?? null,
        actorId: r.actorId ?? null,
        requestId: r.requestId ?? null,
        createdAt: r.createdAt!,
      }),
    });

    return {
      rows,
      ...(nextCursor ? { nextCursor } : {}),
    };
  },

  async findScopeLastActivity(scopeIds: string[]) {
    if (!scopeIds?.length) return new Map<string, Date | null>();
    const rows = (await auditCol()
      .aggregate([
        { $match: { scopeId: { $in: scopeIds } } },
        { $group: { _id: "$scopeId", lastActivityAt: { $max: "$createdAt" } } },
      ])
      .toArray()) as Array<{ _id: string; lastActivityAt: Date | null }>;
    const m = new Map<string, Date | null>();
    for (const r of rows) m.set(String(r._id), r.lastActivityAt ?? null);
    return m;
  },
  async listPageAdmin(args) {
    const sortVec: SortField[] = [
      { key: "createdAt", order: -1 },
      { key: "_id", order: -1 },
    ];
    // Optional scopeId filter; empty = all logs
    const baseFilter: Filter<AuditLogDoc> = args.scopeId
      ? { scopeId: args.scopeId }
      : {};
    const {
      items: rows,
      nextCursor,
      prevCursor,
    } = await seekPageMongoCollection<
      AuditLogDoc,
      AuditLogView & { scopeId: string }
    >({
      collection: auditCol(),
      baseFilter,
      limit: args.limit,
      cursor: args.cursor ?? null,
      sortVec,
      projection: {
        _id: 1,
        scopeId: 1,
        action: 1,
        resourceType: 1,
        resourceId: 1,
        actorId: 1,
        requestId: 1,
        before: 1,
        after: 1,
        ip: 1,
        ua: 1,
        createdAt: 1,
      },
      map: (r: WithId<AuditLogDoc>) => ({
        id: String(r._id ?? ""),
        scopeId: r.scopeId,
        action: r.action as string,
        resourceType: r.resourceType as string,
        resourceId: r.resourceId ?? null,
        actorId: r.actorId ?? null,
        requestId: r.requestId ?? null,
        before: r.before ?? null,
        after: r.after ?? null,
        ip: r.ip ?? null,
        ua: r.ua ?? null,
        createdAt: r.createdAt!,
      }),
    });
    return {
      rows,
      ...(nextCursor ? { nextCursor } : {}),
      ...(prevCursor ? { prevCursor } : {}),
    } as const;
  },
  /**
   * M-011 FIX: Append audit log with proper error handling.
   * Audit logging should never fail silently, but also should not crash the
   * calling operation. We log errors and re-throw to allow callers to decide
   * whether to suppress audit failures.
   */
  async append(args) {
    const now = new Date();
    try {
      await auditCol().insertOne({
        scopeId: args.scopeId,
        actorId: args.actorId ?? null,
        action: args.action,
        resourceType: args.resourceType,
        resourceId: args.resourceId ?? null,
        before: args.before ?? null,
        after: args.after ?? null,
        requestId: args.requestId ?? null,
        ip: args.ip ?? null,
        ua: args.ua ?? null,
        createdAt: now,
        updatedAt: now,
      });
    } catch (err) {
      // M-011 FIX: Log the error with context for debugging
      logger.error('Failed to append audit log', {
        scopeId: args.scopeId,
        action: args.action,
        resourceType: args.resourceType,
        resourceId: args.resourceId,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });

      // M-011 FIX: Re-throw to let callers decide whether to suppress
      // In most cases, audit failures should not block the main operation,
      // but the caller needs to be aware that logging failed
      throw err;
    }
  },
};
