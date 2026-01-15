import {
  col,
  COLLECTIONS,
  UpdateBuilder,
  toMongoUpdate,
  type Document,
} from "@unisane/kernel";
import type {
  PatchResult,
  PatchConflict,
  PatchOk,
  SettingRow,
} from "../domain/types";
import type { SettingsRepo } from "../domain/ports";

type SettingsKVDoc = {
  _id?: unknown;
  env: string;
  scopeId: string | null;
  namespace: string;
  key: string;
  value?: unknown;
  version: number;
  updatedBy?: string | null;
  updatedAt?: Date;
};

const settingsCol = () => col<SettingsKVDoc>(COLLECTIONS.SETTINGS);

function mapDocToSettingRow(doc: SettingsKVDoc | null): SettingRow | null {
  if (!doc) return null;
  const result: SettingRow = {
    env: doc.env,
    scopeId: doc.scopeId,
    namespace: doc.namespace,
    key: doc.key,
    value: doc.value ?? null,
    version: doc.version ?? 0,
  };
  if (doc.updatedBy) result.updatedBy = doc.updatedBy;
  if (doc.updatedAt) result.updatedAt = doc.updatedAt;
  return result;
}

export const SettingsRepoMongo: SettingsRepo = {
  async findOne(
    env: string,
    scopeId: string | null,
    ns: string,
    key: string
  ): Promise<SettingRow | null> {
    const doc = await settingsCol().findOne({
      env,
      scopeId,
      namespace: ns,
      key,
    } as Document);
    return mapDocToSettingRow(doc);
  },

  async upsertPatch(params: {
    env: string;
    scopeId: string | null;
    ns: string;
    key: string;
    value?: unknown;
    unset?: boolean;
    expectedVersion?: number;
    actorId?: string;
  }): Promise<PatchResult> {
    const sel = {
      env: params.env,
      scopeId: params.scopeId,
      namespace: params.ns,
      key: params.key,
    } as const;
    const current = await settingsCol().findOne(sel as unknown as Document);
    if (
      current &&
      params.expectedVersion !== undefined &&
      current.version !== params.expectedVersion
    ) {
      return {
        conflict: true as const,
        expected: current.version,
      } as PatchConflict;
    }
    const now = new Date();
    const builder = new UpdateBuilder<SettingsKVDoc>()
      .set("updatedBy", params.actorId ?? null)
      .set("updatedAt", now)
      .inc("version", 1);

    if (params.unset) {
      builder.unset("value");
    } else {
      builder.set("value", params.value);
    }

    const r = await settingsCol().findOneAndUpdate(
      sel as unknown as Document,
      toMongoUpdate(builder.build()) as unknown as Document,
      { upsert: true, returnDocument: "after" }
    );
    const after =
      (r as unknown as { value?: SettingsKVDoc | null }).value ??
      (r as unknown as SettingsKVDoc | null) ??
      null;
    return {
      ok: true as const,
      setting: {
        env: params.env,
        namespace: params.ns,
        key: params.key,
        value: after?.value ?? null,
        version: after?.version ?? 0,
      },
    } as PatchOk;
  },
};
