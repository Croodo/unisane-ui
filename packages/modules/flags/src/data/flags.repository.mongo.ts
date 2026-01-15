import {
  col,
  COLLECTIONS,
  softDeleteFilter,
  UpdateBuilder,
  toMongoUpdate,
  type Document,
} from "@unisane/kernel";
import type { FlagsRepoPort } from "../domain/ports";
import type { UpsertResult, FlagRow } from "../domain/types";

type FeatureFlagDoc = {
  _id?: unknown;
  env: string;
  key: string;
  enabledDefault: boolean;
  rules?: unknown[];
  snapshotVersion: number;
  updatedBy?: string | null;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

const flagsCol = () => col<FeatureFlagDoc>(COLLECTIONS.FEATURE_FLAGS);

export const FlagsRepoMongo: FlagsRepoPort = {
  async findOne(env: string, key: string) {
    const row = await flagsCol().findOne({
      env,
      key,
      ...softDeleteFilter(),
    } as Document);
    if (!row) return null;
    const base: Record<string, unknown> = {
      env: row.env,
      key: row.key,
      enabledDefault: row.enabledDefault,
      rules: (row.rules ?? []) as unknown[],
      snapshotVersion: row.snapshotVersion,
      updatedBy: row.updatedBy ?? null,
    };
    if (row.createdAt) base.createdAt = row.createdAt;
    if (row.updatedAt) base.updatedAt = row.updatedAt;
    return base as FlagRow;
  },
  async upsert(params) {
    if (params.expectedVersion !== undefined) {
      const cur = await flagsCol().findOne({
        env: params.env,
        key: params.key,
        ...softDeleteFilter(),
      } as Document);
      if (cur && (cur.snapshotVersion ?? 0) !== params.expectedVersion) {
        return {
          conflict: true as const,
          expected: cur.snapshotVersion,
        } as UpsertResult;
      }
    }
    const sel = { env: params.env, key: params.key } as const;
    const now = new Date();
    const builder = new UpdateBuilder<FeatureFlagDoc>()
      .set("enabledDefault", params.enabledDefault)
      .set("rules", params.rules as unknown[])
      .set("updatedBy", params.actorId)
      .set("deletedAt", null)
      .set("updatedAt", now)
      .inc("snapshotVersion", 1)
      .setOnInsert("env", params.env)
      .setOnInsert("key", params.key)
      .setOnInsert("createdAt", now);
    const r = await flagsCol().findOneAndUpdate(
      sel as unknown as Document,
      toMongoUpdate(builder.build()) as Document,
      { upsert: true, returnDocument: "after" }
    );
    const after =
      (r as unknown as { value?: FeatureFlagDoc | null }).value ??
      (r as unknown as FeatureFlagDoc | null) ??
      null;
    const flag: FlagRow | null = after
      ? {
          env: after.env,
          key: after.key,
          enabledDefault: after.enabledDefault,
          rules: (after.rules ?? []) as unknown[],
          snapshotVersion: after.snapshotVersion,
          updatedBy: after.updatedBy ?? null,
          ...(after.createdAt ? { createdAt: after.createdAt } : {}),
          ...(after.updatedAt ? { updatedAt: after.updatedAt } : {}),
        }
      : null;
    return { ok: true as const, flag } as UpsertResult;
  },
};
