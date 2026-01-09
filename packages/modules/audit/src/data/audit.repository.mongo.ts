import { col } from "@unisane/kernel";
import type { SortField } from "@unisane/kernel";
import { seekPageMongoCollection } from "@unisane/kernel";
import type { AuditRepoPort } from "../domain/ports";
import type { AuditLogView } from "../domain/types";
import type { Filter, Document, WithId } from "mongodb";

import type { ObjectId } from "mongodb";
type AuditLogDoc = {
  _id?: ObjectId;
  tenantId: string;
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

const auditCol = () => col<AuditLogDoc>("audit_logs");

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
      baseFilter: { tenantId: args.tenantId } as Filter<AuditLogDoc>,
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
  async getTenantLastActivity(tenantIds: string[]) {
    if (!tenantIds?.length) return new Map<string, Date | null>();
    const rows = (await auditCol()
      .aggregate([
        { $match: { tenantId: { $in: tenantIds } } },
        { $group: { _id: "$tenantId", lastActivityAt: { $max: "$createdAt" } } },
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
    // Optional tenantId filter; empty = all logs
    const baseFilter: Filter<AuditLogDoc> = args.tenantId
      ? { tenantId: args.tenantId }
      : {};
    const {
      items: rows,
      nextCursor,
      prevCursor,
    } = await seekPageMongoCollection<
      AuditLogDoc,
      AuditLogView & { tenantId: string }
    >({
      collection: auditCol(),
      baseFilter,
      limit: args.limit,
      cursor: args.cursor ?? null,
      sortVec,
      projection: {
        _id: 1,
        tenantId: 1,
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
        tenantId: r.tenantId,
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
  async append(args) {
    const now = new Date();
    await auditCol().insertOne({
      tenantId: args.tenantId,
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
  },
};
