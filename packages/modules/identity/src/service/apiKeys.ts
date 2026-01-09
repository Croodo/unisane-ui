import { randomBytes, createHash } from "node:crypto";
import { invalidatePermsForApiKey } from "./perms";
import { apiKeysRepository } from "../data/api-keys.repository";
import { getTenantId, sha256Hex, clampInt, events } from "@unisane/kernel";
import { IDENTITY_EVENTS } from "../domain/constants";

export type CreateApiKeyArgs = {
  name?: string | null;
  scopes: string[];
  actorId?: string | null;
};

export type RevokeApiKeyArgs = {
  keyId: string;
};

export type ListApiKeysArgs = {
  limit?: number;
};

export async function createApiKey(args: CreateApiKeyArgs) {
  const tenantId = getTenantId(); // Throws if not set
  const token = randomBytes(24).toString("base64url");
  const hash = createHash("sha256").update(token).digest("hex");
  const created = await apiKeysRepository.create({
    tenantId,
    name: args.name ?? null,
    hash,
    scopes: args.scopes,
    createdBy: args.actorId ?? null,
  });
  await invalidatePermsForApiKey(tenantId, created.id);
  await events.emit(IDENTITY_EVENTS.API_KEY_CREATED, {
    tenantId,
    keyId: created.id,
    scopes: created.scopes,
    createdBy: args.actorId ?? null,
  });
  return { id: created.id, token, scopes: created.scopes } as const;
}

export async function revokeApiKey(args: RevokeApiKeyArgs) {
  const tenantId = getTenantId(); // Throws if not set
  await apiKeysRepository.revoke(tenantId, args.keyId);
  await invalidatePermsForApiKey(tenantId, args.keyId);
  await events.emit(IDENTITY_EVENTS.API_KEY_REVOKED, {
    tenantId,
    keyId: args.keyId,
  });
  return { ok: true as const };
}

export async function listApiKeys(args: ListApiKeysArgs = {}) {
  const tenantId = getTenantId(); // Throws if not set
  const limit = clampInt(args.limit ?? 100, 1, 500);
  const rows = await apiKeysRepository.listByTenant(tenantId, limit);
  const items = rows.map((k) => ({
    id: k.id,
    name: k.name,
    scopes: k.scopes,
    revokedAt: k.revokedAt,
    createdAt: k.createdAt,
  }));
  return { items } as const;
}

export async function verifyApiKey(
  token: string
): Promise<{ apiKeyId: string; tenantId: string; scopes: string[] } | null> {
  const hash = sha256Hex(token);
  const row = await apiKeysRepository.findActiveByHash(hash);
  if (!row) return null;
  return {
    apiKeyId: row.id,
    tenantId: row.tenantId,
    scopes: row.scopes,
  } as const;
}
