import { col, tenantFilter, withTenantId } from '@unisane/kernel';
import type { Document } from 'mongodb';
import { clampInt } from '@unisane/kernel';

export type ApiKeyCreateDbInput = {
  tenantId: string;
  name?: string | null;
  hash: string;
  scopes: string[];
  createdBy?: string | null;
};

export const mongoApiKeysRepository = {
  async create(input: ApiKeyCreateDbInput) {
    const now = new Date();
    // Use withTenantId to auto-add tenantId from context
    const r = await col('apikeys').insertOne(withTenantId({
      name: input.name ?? null,
      hash: input.hash,
      scopes: input.scopes,
      createdBy: input.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    }) as unknown as Document);
    return {
      id: String(r.insertedId),
      scopes: input.scopes ?? [],
      name: input.name ?? null,
      createdAt: now,
    } as const;
  },
  async revoke(tenantId: string, keyId: string) {
    // Use tenantFilter for automatic tenant scoping
    await col('apikeys').updateOne(
      tenantFilter({ _id: keyId }) as unknown as Document,
      { $set: { revokedAt: new Date(), updatedAt: new Date() } } as unknown as Document
    );
    return { ok: true as const };
  },
  async listByTenant(tenantId: string, limit = 100) {
    // Use tenantFilter for automatic tenant scoping
    const rows = await col('apikeys')
      .find(tenantFilter({}) as unknown as Document)
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
  // NOTE: Cross-tenant operation - intentionally NOT using tenantFilter()
  // This verifies API key by hash and returns the tenantId for context bootstrapping
  async findActiveByHash(hash: string) {
    const doc = (await col('apikeys').findOne({ hash, revokedAt: null } as unknown as Document)) as unknown as {
      _id: unknown;
      tenantId?: string;
      scopes?: string[];
    } | null;
    if (!doc) return null;
    return { id: String(doc._id), tenantId: String(doc.tenantId ?? ''), scopes: doc.scopes ?? [] } as const;
  },
};
