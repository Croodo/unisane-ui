import { randomBytes, createHash } from "node:crypto";
import { invalidatePermsForApiKey } from "./perms";
import { apiKeysRepository } from "../data/api-keys.repository";
import { getScopeId, sha256Hex, clampInt, events, ALL_PERMISSIONS } from "@unisane/kernel";
import { IDENTITY_EVENTS } from "../domain/constants";

/**
 * IDEN-004 FIX: Valid scopes for API keys.
 * Uses the permissions defined in @unisane/kernel.
 */
const VALID_API_KEY_SCOPES = new Set<string>(ALL_PERMISSIONS);

/**
 * IDEN-004 FIX: Maximum number of scopes per API key.
 * Prevents DoS via excessive scope arrays.
 */
const MAX_SCOPES_PER_KEY = 50;

/**
 * IDEN-004 FIX: Validate and normalize API key scopes.
 *
 * @throws Error if scopes are invalid
 */
function validateScopes(scopes: string[]): string[] {
  if (!Array.isArray(scopes)) {
    throw new Error('scopes must be an array');
  }

  if (scopes.length === 0) {
    throw new Error('At least one scope is required');
  }

  if (scopes.length > MAX_SCOPES_PER_KEY) {
    throw new Error(`Too many scopes (max ${MAX_SCOPES_PER_KEY})`);
  }

  // Validate and deduplicate scopes
  const validatedScopes = new Set<string>();
  const invalidScopes: string[] = [];

  for (const scope of scopes) {
    if (typeof scope !== 'string') {
      throw new Error('All scopes must be strings');
    }

    const trimmed = scope.trim();
    if (!VALID_API_KEY_SCOPES.has(trimmed)) {
      invalidScopes.push(trimmed);
    } else {
      validatedScopes.add(trimmed);
    }
  }

  if (invalidScopes.length > 0) {
    // Limit the number of invalid scopes shown to prevent log bloat
    const shown = invalidScopes.slice(0, 5);
    const more = invalidScopes.length > 5 ? ` and ${invalidScopes.length - 5} more` : '';
    throw new Error(`Invalid scopes: ${shown.join(', ')}${more}`);
  }

  return Array.from(validatedScopes);
}

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
  const scopeId = getScopeId(); // Throws if not set

  // IDEN-004 FIX: Validate scopes before creating API key
  const validatedScopes = validateScopes(args.scopes);

  const token = randomBytes(24).toString("base64url");
  const hash = createHash("sha256").update(token).digest("hex");
  const created = await apiKeysRepository.create({
    scopeId,
    name: args.name ?? null,
    hash,
    scopes: validatedScopes,
    createdBy: args.actorId ?? null,
  });
  await invalidatePermsForApiKey(scopeId, created.id);
  await events.emit(IDENTITY_EVENTS.API_KEY_CREATED, {
    scopeId,
    keyId: created.id,
    scopes: created.scopes,
    createdBy: args.actorId ?? null,
  });
  return { id: created.id, token, scopes: created.scopes } as const;
}

export async function revokeApiKey(args: RevokeApiKeyArgs) {
  const scopeId = getScopeId(); // Throws if not set
  await apiKeysRepository.revoke(scopeId, args.keyId);
  await invalidatePermsForApiKey(scopeId, args.keyId);
  await events.emit(IDENTITY_EVENTS.API_KEY_REVOKED, {
    scopeId,
    keyId: args.keyId,
  });
  return { ok: true as const };
}

export async function listApiKeys(args: ListApiKeysArgs = {}) {
  const scopeId = getScopeId(); // Throws if not set
  const limit = clampInt(args.limit ?? 100, 1, 500);
  const rows = await apiKeysRepository.listByScope(scopeId, limit);
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
): Promise<{ apiKeyId: string; scopeId: string; scopes: string[] } | null> {
  const hash = sha256Hex(token);
  const row = await apiKeysRepository.findActiveByHash(hash);
  if (!row) return null;
  return {
    apiKeyId: row.id,
    scopeId: row.scopeId,
    scopes: row.scopes,
  } as const;
}
