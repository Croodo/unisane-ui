import { col } from "@unisane/kernel";
import type { FlagOverridesRepoPort } from "../domain/ports";
import type { FlagOverrideScope } from "@unisane/kernel";
import type { Document } from "mongodb";
import { softDeleteFilter } from "@unisane/kernel";
import { clampInt } from "@unisane/kernel";

type FeatureFlagOverrideDoc = {
  _id?: unknown;
  env: string;
  key: string;
  scopeType: FlagOverrideScope;
  scopeId: string;
  value: boolean;
  expiresAt?: Date | null;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

const ovCol = () => col<FeatureFlagOverrideDoc>("feature_flag_overrides");

export const FlagOverridesRepoMongo: FlagOverridesRepoPort = {
  async get(env, key, scopeType, scopeId) {
    const row = await ovCol().findOne({
      env,
      key,
      scopeType,
      scopeId,
      ...softDeleteFilter(),
    } as Document);
    if (!row) return null;
    if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;
    return { value: row.value, expiresAt: row.expiresAt ?? null };
  },
  async upsert(args) {
    const sel = {
      env: args.env,
      key: args.key,
      scopeType: args.scopeType,
      scopeId: args.scopeId,
    } as const;
    const r = await ovCol().findOneAndUpdate(
      sel as unknown as Document,
      {
        $set: {
          value: args.value,
          expiresAt: args.expiresAt ?? null,
          deletedAt: null,
          updatedAt: new Date(),
        },
        $setOnInsert: { ...sel, createdAt: new Date() },
      } as Document,
      { upsert: true, returnDocument: "after" }
    );
    const after =
      (r as unknown as { value?: FeatureFlagOverrideDoc | null }).value ??
      (r as unknown as FeatureFlagOverrideDoc | null) ??
      null;
    return after
      ? { value: after.value, expiresAt: after.expiresAt ?? null }
      : null;
  },
  async clear(env, key, scopeType, scopeId) {
    await ovCol().updateOne(
      { env, key, scopeType, scopeId } as Document,
      { $set: { deletedAt: new Date() } } as Document
    );
  },
  async countActiveTenantOverrides(tenantIds: string[], now = new Date()) {
    if (!tenantIds?.length) return new Map<string, number>();
    const rows = (await ovCol()
      .aggregate([
        {
          $match: {
            scopeType: "tenant",
            scopeId: { $in: tenantIds },
            $and: [
              softDeleteFilter(),
              {
                $or: [
                  { expiresAt: null },
                  { $expr: { $gt: ["$expiresAt", now] } },
                ],
              },
            ],
          },
        },
        { $group: { _id: "$scopeId", flagOverridesCount: { $sum: 1 } } },
      ])
      .toArray()) as Array<{ _id: string; flagOverridesCount: number }>;
    const m = new Map<string, number>();
    for (const r of rows) m.set(String(r._id), r.flagOverridesCount ?? 0);
    return m;
  },
  async listExpiredForCleanup(args: { now: Date; limit: number }) {
    const limit = clampInt(args.limit, 1, 500);
    const now = args.now;
    const docs = await ovCol()
      .find(
        {
          $and: [
            softDeleteFilter(),
            { expiresAt: { $lt: now } },
          ],
        } as Document
      )
      .limit(limit)
      .project({ env: 1, key: 1, scopeType: 1, scopeId: 1 } as Document)
      .toArray();

    return docs.map((d) => ({
      ...(typeof d.env === "string" ? { env: d.env } : {}),
      key: String((d as { key?: unknown }).key ?? ""),
      scopeType: (d as { scopeType?: FlagOverrideScope }).scopeType ?? "tenant",
      scopeId: String((d as { scopeId?: unknown }).scopeId ?? ""),
    }));
  },
};
