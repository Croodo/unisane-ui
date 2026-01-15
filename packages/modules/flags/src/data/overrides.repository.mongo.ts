import {
  col,
  COLLECTIONS,
  softDeleteFilter,
  clampInt,
  UpdateBuilder,
  toMongoUpdate,
  type Document,
  type FlagOverrideScope,
} from "@unisane/kernel";
import type { FlagOverridesRepoPort } from "../domain/ports";

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

const ovCol = () => col<FeatureFlagOverrideDoc>(COLLECTIONS.FLAG_OVERRIDES);

export const FlagOverridesRepoMongo: FlagOverridesRepoPort = {
  async findOverride(env, key, scopeType, scopeId) {
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
    const now = new Date();
    const builder = new UpdateBuilder<FeatureFlagOverrideDoc>()
      .set("value", args.value)
      .set("expiresAt", args.expiresAt ?? null)
      .set("deletedAt", null)
      .set("updatedAt", now)
      .setOnInsert("env", args.env)
      .setOnInsert("key", args.key)
      .setOnInsert("scopeType", args.scopeType)
      .setOnInsert("scopeId", args.scopeId)
      .setOnInsert("createdAt", now);
    const r = await ovCol().findOneAndUpdate(
      sel as unknown as Document,
      toMongoUpdate(builder.build()) as Document,
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
  async softDeleteOverride(env, key, scopeType, scopeId) {
    const builder = new UpdateBuilder<FeatureFlagOverrideDoc>()
      .set("deletedAt", new Date());
    await ovCol().updateOne(
      { env, key, scopeType, scopeId } as Document,
      toMongoUpdate(builder.build()) as Document
    );
  },
  async countActiveScopeOverrides(scopeIds: string[], now = new Date()) {
    if (!scopeIds?.length) return new Map<string, number>();
    const rows = (await ovCol()
      .aggregate([
        {
          $match: {
            scopeType: "tenant",
            scopeId: { $in: scopeIds },
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
