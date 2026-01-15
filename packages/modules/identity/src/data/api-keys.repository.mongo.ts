import {
  col,
  COLLECTIONS,
  explicitScopeFilter,
  clampInt,
  UpdateBuilder,
  toMongoUpdate,
  type Document,
} from '@unisane/kernel';

export type ApiKeyCreateDbInput = {
  scopeId: string;
  name?: string | null;
  hash: string;
  scopes: string[];
  createdBy?: string | null;
};

export const mongoApiKeysRepository = {
  async create(input: ApiKeyCreateDbInput) {
    const now = new Date();
    // Use explicit scopeId from input - operations happen within ctx.run() but we use the passed value
    const r = await col(COLLECTIONS.API_KEYS).insertOne({
      scopeType: 'tenant',
      scopeId: input.scopeId,
      name: input.name ?? null,
      hash: input.hash,
      scopes: input.scopes,
      createdBy: input.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    } as unknown as Document);
    return {
      id: String(r.insertedId),
      scopes: input.scopes ?? [],
      name: input.name ?? null,
      createdAt: now,
    } as const;
  },
  async revoke(scopeId: string, keyId: string) {
    const now = new Date();
    const builder = new UpdateBuilder<Record<string, unknown>>()
      .set('revokedAt', now)
      .set('updatedAt', now);
    // Use explicit scopeId parameter
    await col(COLLECTIONS.API_KEYS).updateOne(
      explicitScopeFilter('tenant', scopeId, { _id: keyId }) as unknown as Document,
      toMongoUpdate(builder.build()) as unknown as Document
    );
    return { ok: true as const };
  },
  async listByScope(scopeId: string, limit = 100) {
    // Use explicit scopeId parameter
    const rows = await col(COLLECTIONS.API_KEYS)
      .find(explicitScopeFilter('tenant', scopeId, {}) as unknown as Document)
      .sort({ createdAt: -1 })
      .limit(clampInt(limit, 1, 500))
      .project({ _id: 1, name: 1, scopes: 1, revokedAt: 1, createdAt: 1 } as unknown as Document)
      .toArray() as unknown as Array<{
        _id: string;
        name?: string | null;
        scopes?: string[];
        revokedAt?: Date | null;
        createdAt?: Date | null;
      }>;
    return rows.map((k) => ({
      id: String(k._id),
      name: k.name ?? null,
      scopes: k.scopes ?? [],
      revokedAt: k.revokedAt ?? null,
      createdAt: k.createdAt ?? null,
    }));
  },
  // NOTE: Cross-scope operation - intentionally NOT using scopeFilter()
  // This verifies API key by hash and returns the scopeId for context bootstrapping
  async findActiveByHash(hash: string) {
    const doc = (await col(COLLECTIONS.API_KEYS).findOne({ hash, revokedAt: null } as unknown as Document)) as unknown as {
      _id: unknown;
      scopeId?: string;
      scopes?: string[];
    } | null;
    if (!doc) return null;
    return { id: String(doc._id), scopeId: String(doc.scopeId ?? ''), scopes: doc.scopes ?? [] } as const;
  },
};
