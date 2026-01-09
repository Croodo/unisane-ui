import { col } from "@unisane/kernel";
import type { Collection, Filter, Document, WithId } from "mongodb";
import { ObjectId } from "mongodb";
import { seekPageMongoCollection } from '@unisane/kernel';
import type { WebhookDirection, WebhookEventStatus, WebhookProvider } from '@unisane/kernel';
import type { WebhooksRepoPort } from "../domain/ports";
import type { WebhookEventDetail, WebhookEventListItem, WebhookEventListPage } from "../domain/types";
import { getTypedSetting } from "@unisane/settings";
import { maybeObjectId } from "@unisane/kernel";
import { clampInt } from "@unisane/kernel";

type WebhookEventDoc = {
  _id: string | ObjectId;
  tenantId: string | null;
  direction: WebhookDirection;
  provider?: WebhookProvider | null;
  eventId?: string | null;
  payload?: unknown;
  headers?: Record<string, unknown> | null;
  target?: string | null;
  status: WebhookEventStatus;
  httpStatus?: number | null;
  error?: string | null;
  attempts?: number;
  expiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
} & Document;

const eventsCol = (): Collection<WebhookEventDoc> => col<WebhookEventDoc>("webhook_events");

export const WebhooksRepoMongo: WebhooksRepoPort = {
  async listPage(args): Promise<WebhookEventListPage> {
    type Row = Pick<WebhookEventDoc, "_id" | "direction" | "status" | "httpStatus" | "target" | "provider" | "createdAt">;
    const baseFilter: Filter<WebhookEventDoc> = { tenantId: args.tenantId };
    if (args.direction) baseFilter.direction = args.direction;
    if (args.status) baseFilter.status = args.status;

    const projection: Record<string, 0 | 1> = {
      _id: 1,
      direction: 1,
      status: 1,
      httpStatus: 1,
      target: 1,
      provider: 1,
      createdAt: 1,
    };

    const sortVec = [
      { key: "createdAt", order: -1 as const },
      { key: "_id", order: -1 as const },
    ];
    const { items: docs, nextCursor, prevCursor } = await seekPageMongoCollection<WebhookEventDoc, WebhookEventListItem>({
      collection: eventsCol(),
      baseFilter,
      limit: clampInt(args.limit, 1, 500),
      cursor: args.cursor ?? null,
      sortVec,
      projection,
      map: (r: WithId<WebhookEventDoc>) => ({
        id: String(r._id),
        direction: r.direction,
        status: r.status,
        httpStatus: (r.httpStatus as number | null | undefined) ?? null,
        target: (r.target as string | null | undefined) ?? null,
        provider: (r.provider as WebhookProvider | null | undefined) ?? null,
        ...(r.createdAt ? { createdAt: r.createdAt } : {}),
      }),
    });
    const items = docs;
    return { items, ...(nextCursor ? { nextCursor } : {}), ...(prevCursor ? { prevCursor } : {}) } as const;
  },
  async getById(args): Promise<WebhookEventDetail | null> {
    const filter: Record<string, unknown> = { _id: maybeObjectId(args.id), tenantId: args.tenantId };
    if (args.direction) filter.direction = args.direction;
    const ev = await eventsCol().findOne(filter as Filter<WebhookEventDoc>);
    if (!ev) return null;
    return {
      id: String(ev._id),
      tenantId: String(ev.tenantId ?? ""),
      direction: ev.direction,
      status: ev.status,
      target: (ev.target as string | null | undefined) ?? null,
      payload: ev.payload ?? {},
    };
  },
  async recordInbound(args) {
    try {
      const { value: retentionDays } = await getTypedSetting<number>({
        tenantId: null,
        ns: "webhooks",
        key: "retentionDays",
      });
      const expiresAt = retentionDays > 0 ? new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000) : null;
      const now = new Date();
      await eventsCol().insertOne({
        _id: new ObjectId(),
        tenantId: args.tenantId,
        direction: "in",
        provider: args.provider,
        eventId: args.eventId,
        status: args.status,
        headers: args.headers,
        payload: args.payload,
        ...(expiresAt ? { expiresAt } : {}),
        createdAt: now,
        updatedAt: now,
      } as unknown as WebhookEventDoc);
      return { ok: true as const };
    } catch (e) {
      const code = (e as { code?: number }).code;
      if (code === 11000) return { ok: true as const, deduped: true as const };
      throw e;
    }
  },
  async recordOutbound(args) {
    const now = new Date();
    await eventsCol().insertOne({
      _id: new ObjectId(),
      tenantId: args.tenantId,
      direction: "out",
      provider: null,
      eventId: null,
      target: args.target,
      status: args.status,
      httpStatus: args.httpStatus,
      error: args.error ?? null,
      headers: args.headers,
      payload: args.payload,
      createdAt: now,
      updatedAt: now,
    } as unknown as WebhookEventDoc);
  },
  async countOutboundFailuresSince(tenantIds: string[], since: Date) {
    if (!tenantIds?.length) return new Map<string, number>();
    const rows = (await eventsCol()
      .aggregate([
        {
          $match: {
            tenantId: { $in: tenantIds },
            direction: "out",
            status: "failed",
            createdAt: { $gte: since },
          },
        },
        { $group: { _id: "$tenantId", webhooksFailed24h: { $sum: 1 } } },
      ])
      .toArray()) as Array<{ _id: string; webhooksFailed24h: number }>;
    const m = new Map<string, number>();
    for (const r of rows) m.set(String(r._id), r.webhooksFailed24h ?? 0);
    return m;
  },
};
