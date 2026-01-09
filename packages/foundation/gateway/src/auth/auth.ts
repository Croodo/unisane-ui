/**
 * Gateway Authentication Module
 *
 * Provides authentication context extraction from requests.
 * Uses dependency injection for repository access - must be configured at app startup.
 */

import type { Permission } from '../middleware/rbac';
import { verifyJwtRS256Jose } from './jwt';
import { sha256Hex } from '@unisane/kernel';
import { readApiKeyToken, readBearerToken, tenantIdFromUrl, readBearerFromCookie } from '../request';
import { logger, withRequest } from '../logger';
import { HEADER_NAMES } from '../headers';
import { kv, getEnv, ALL_PERMISSIONS } from '@unisane/kernel';
import { ERR } from '../errors/errors';

// --- Auth Context Types ---

export interface AuthCtx {
  isAuthed: boolean;
  userId?: string;
  apiKeyId?: string;
  tenantId?: string;
  role?: string;
  plan?: string;
  perms?: Permission[];
  isSuperAdmin?: boolean;
}

// --- Dependency Injection Types ---

export interface ApiKeyRecord {
  id: string;
  tenantId: string;
  scopes: string[];
  // Optional: include revocation timestamp for cache validation
  revokedAt?: Date | null;
}

export interface UserRecord {
  id: string;
  sessionsRevokedAt?: Date | null;
}

export interface AuthRepositories {
  findApiKeyByHash: (hash: string) => Promise<ApiKeyRecord | null>;
  findUserById: (userId: string) => Promise<UserRecord | null>;
  getEffectivePerms: (tenantId: string, userId: string) => Promise<Permission[]>;
  applyGlobalOverlays: (userId: string, perms: Permission[]) => Promise<{ perms: Permission[]; isSuperAdmin: boolean }>;
  connectDb: () => Promise<void>;
}

// --- Injected Dependencies ---

// Use global object to share auth repos across module instances in Next.js
const globalForGatewayAuth = global as unknown as {
  __gatewayAuthRepos?: AuthRepositories | null;
};

/**
 * Configure the auth module with repository implementations.
 * Must be called at app startup before handling requests.
 */
export function configureAuth(repos: AuthRepositories): void {
  globalForGatewayAuth.__gatewayAuthRepos = repos;
}

function getRepos(): AuthRepositories {
  if (!globalForGatewayAuth.__gatewayAuthRepos) {
    throw new Error('Auth not configured. Call configureAuth() at app startup.');
  }
  return globalForGatewayAuth.__gatewayAuthRepos;
}

// --- Structured Logging Helpers ---

function logAuthEvent(
  level: 'info' | 'warn' | 'error',
  message: string,
  context: Record<string, unknown>
): void {
  try {
    const baseLog = withRequest({});
    switch (level) {
      case 'info':
        baseLog.info(message, context);
        break;
      case 'warn':
        baseLog.warn(message, context);
        break;
      case 'error':
        baseLog.error(message, context);
        break;
    }
  } catch {
    // Logging should never cause auth to fail
  }
}

// --- JSON Parsing with Validation ---

interface CachedApiKey {
  id: string;
  tenantId: string;
  scopes: string[];
  cachedAt: number;
  // null means "key not found" - we cache negative lookups too
  notFound?: boolean;
}

function isValidCachedApiKey(value: unknown): value is CachedApiKey {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;

  // Check for "not found" marker
  if (obj.notFound === true) {
    return typeof obj.cachedAt === 'number';
  }

  // Valid key must have required fields
  return (
    typeof obj.id === 'string' &&
    typeof obj.tenantId === 'string' &&
    Array.isArray(obj.scopes) &&
    obj.scopes.every((s: unknown) => typeof s === 'string') &&
    typeof obj.cachedAt === 'number'
  );
}

function parseJsonSafe<T>(
  json: string,
  validator: (value: unknown) => value is T
): T | null {
  try {
    const parsed = JSON.parse(json);
    if (validator(parsed)) {
      return parsed;
    }
    logAuthEvent('warn', 'cached data failed validation', { type: 'api_key_cache' });
    return null;
  } catch (e) {
    logAuthEvent('warn', 'failed to parse cached JSON', {
      error: (e as Error).message,
      type: 'api_key_cache'
    });
    return null;
  }
}

// --- JWT Authentication ---

async function authFromJwt(
  token: string,
  req: Request,
  baseLog: ReturnType<typeof withRequest>,
  source: 'bearer' | 'cookie'
): Promise<AuthCtx | null> {
  try {
    const repos = getRepos();
    const { JWT_PUBLIC_KEY: pubKey, JWT_PUBLIC_KEY_PREV: pubKeyPrev, JWT_JWKS_URL } = getEnv();
    if (!token || (!pubKey && !pubKeyPrev && !JWT_JWKS_URL)) return null;

    const verified = await verifyJwtRS256Jose(token);
    if (!verified?.payload) return null;

    const sub = String(verified.payload.sub ?? '');
    const tokenIatSec = typeof verified.payload.iat === 'number' ? verified.payload.iat : undefined;
    const tenantId = deriveTenantIdFromTokenOrUrl(verified.payload as Record<string, unknown>, req);

    if (!sub) return null;

    await repos.connectDb();

    // Check if sessions were revoked
    const user = await repos.findUserById(sub);
    const revokedAt = user?.sessionsRevokedAt ?? null;
    if (revokedAt && tokenIatSec && revokedAt.getTime() > tokenIatSec * 1000) {
      throw ERR.loginRequired();
    }

    if (tenantId) {
      const perms = await repos.getEffectivePerms(tenantId, sub);
      const { perms: finalPerms, isSuperAdmin } = await repos.applyGlobalOverlays(sub, perms);

      const baseCtx: AuthCtx = {
        isAuthed: true,
        userId: sub,
        tenantId,
        ...(isSuperAdmin ? { isSuperAdmin: true } : {}),
      };

      logAuthEvent('info', 'jwt auth success', { auth_strategy: source, userId: sub, tenantId });
      return finalPerms.length ? { ...baseCtx, perms: finalPerms } : baseCtx;
    }

    // No tenant - global context
    const { perms: finalPerms, isSuperAdmin } = await repos.applyGlobalOverlays(sub, []);
    if (isSuperAdmin) {
      return {
        isAuthed: true,
        userId: sub,
        perms: finalPerms,
        isSuperAdmin: true,
      };
    }
    return { isAuthed: true, userId: sub };
  } catch (e) {
    const error = e as Error;
    // Only log in non-prod or for unexpected errors
    const { APP_ENV } = getEnv();
    if (APP_ENV !== 'prod' || error.name !== 'JWTExpired') {
      logAuthEvent('warn', 'jwt verification failed', {
        auth_strategy: source,
        error: error.message,
        errorType: error.name
      });
    }
    return null;
  }
}

// --- API Key Authentication ---

// Cache TTL: 60 seconds for valid keys, 30 seconds for "not found"
const API_KEY_CACHE_TTL_MS = 60_000;
const API_KEY_NOT_FOUND_CACHE_TTL_MS = 30_000;

async function cacheApiKeyLookup(hash: string): Promise<ApiKeyRecord | null> {
  const repos = getRepos();
  const cacheKey = `ak:${hash}`;

  // Try to get from cache
  const cached = await kv.get(cacheKey);
  if (cached) {
    const parsed = parseJsonSafe(cached, isValidCachedApiKey);
    if (parsed) {
      // Check if this is a "not found" marker
      if (parsed.notFound) {
        return null;
      }

      // Validate cache isn't too old (defense in depth)
      const age = Date.now() - parsed.cachedAt;
      if (age < API_KEY_CACHE_TTL_MS * 2) {
        return {
          id: parsed.id,
          tenantId: parsed.tenantId,
          scopes: parsed.scopes,
        };
      }
      // Cache too old, fall through to fresh lookup
    }
    // Invalid cache entry, will be overwritten below
  }

  // Fresh lookup from database
  const row = await repos.findApiKeyByHash(hash);

  // Cache the result
  const cacheEntry: CachedApiKey = row
    ? {
        id: row.id,
        tenantId: row.tenantId,
        scopes: row.scopes,
        cachedAt: Date.now(),
      }
    : {
        id: '',
        tenantId: '',
        scopes: [],
        cachedAt: Date.now(),
        notFound: true,
      };

  const ttl = row ? API_KEY_CACHE_TTL_MS : API_KEY_NOT_FOUND_CACHE_TTL_MS;
  await kv.set(cacheKey, JSON.stringify(cacheEntry), { PX: ttl });

  return row;
}

// Invalidate API key cache (call when key is revoked/deleted)
export async function invalidateApiKeyCache(hash: string): Promise<void> {
  const cacheKey = `ak:${hash}`;
  await kv.del(cacheKey);
}

function deriveTenantIdFromTokenOrUrl(payload: Record<string, unknown> | null | undefined, req: Request): string | undefined {
  const t = (payload?.['tid'] ?? payload?.['tenantId'] ?? payload?.['tenant_id']) as unknown;
  return t ? String(t) : tenantIdFromUrl(req);
}

// --- Main Auth Context Extraction ---

export async function getAuthCtx(req: Request): Promise<AuthCtx> {
  let path = '';
  try { path = new URL(req.url).pathname; } catch {
    logAuthEvent('warn', 'failed to parse request URL', { url: req.url });
  }
  const reqId = req.headers.get(HEADER_NAMES.REQUEST_ID) ?? 'n/a';
  const baseLog = withRequest({ method: req.method, url: path, requestId: reqId });

  // 1) API Key — Authorization: ApiKey <token> | x-api-key: <token>
  const apiKeyToken = readApiKeyToken(req.headers);
  if (apiKeyToken) {
    try {
      const repos = getRepos();
      await repos.connectDb();
      const hash = sha256Hex(apiKeyToken);
      const key = await cacheApiKeyLookup(hash);
      if (key) {
        logAuthEvent('info', 'api key auth success', {
          auth_strategy: 'api_key',
          tenantId: key.tenantId,
          apiKeyId: key.id
        });
        return {
          isAuthed: true,
          apiKeyId: String(key.id),
          tenantId: key.tenantId,
          perms: (key.scopes ?? []) as Permission[],
        };
      }
      logAuthEvent('warn', 'api key not found', { auth_strategy: 'api_key' });
    } catch (e) {
      logAuthEvent('error', 'api key auth error', {
        auth_strategy: 'api_key',
        error: (e as Error).message
      });
    }
  }

  // 2) Bearer JWT — Authorization: Bearer <jwt> (RS256)
  const bearer = readBearerToken(req.headers);
  const bearerCtx = bearer ? await authFromJwt(bearer, req, baseLog, 'bearer') : null;
  if (bearerCtx) return bearerCtx;

  // 3) Cookie fallback — access_token cookie (RS256)
  const cookieBearer = readBearerFromCookie(req.headers);
  const cookieCtx = cookieBearer ? await authFromJwt(cookieBearer, req, baseLog, 'cookie') : null;
  if (cookieCtx) return cookieCtx;

  // 4) Dev-only fallback
  const { APP_ENV } = getEnv();
  if (APP_ENV === 'prod') {
    return { isAuthed: false };
  }

  // Dev: decode token without verification for non-sensitive routes
  try {
    const cookieToken = readBearerFromCookie(req.headers);
    if (cookieToken) {
      const { decodeJwt } = await import('jose');
      const decoded = decodeJwt(cookieToken);
      const sub = decoded && typeof decoded.sub === 'string' ? decoded.sub : undefined;
      if (sub) {
        return { isAuthed: true, userId: sub };
      }
    }
  } catch (e) {
    logAuthEvent('warn', 'dev jwt decode failed', { error: (e as Error).message });
  }

  // Header-based stub for tests/tools (DEV ONLY)
  // WARNING: These headers should NEVER be trusted in production
  const tenantId = req.headers.get('x-tenant-id') ?? undefined;
  const userIdHeader = req.headers.get('x-user-id') ?? undefined;
  const role = req.headers.get('x-role') ?? undefined;
  const plan = req.headers.get('x-plan') ?? 'pro';
  const platformOwnerHeader = req.headers.get('x-platform-owner') ?? undefined;
  const permsHdr = req.headers.get('x-perms') ?? '';
  const perms = permsHdr
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean) as Permission[];

  const isAuthed = Boolean(readBearerToken(req.headers) || readApiKeyToken(req.headers));
  const ctx: AuthCtx = {
    isAuthed,
    ...(tenantId ? { tenantId } : {}),
    ...(userIdHeader ? { userId: userIdHeader } : {}),
    ...(role ? { role } : {}),
    plan,
    ...(perms.length ? { perms } : {}),
  };

  if (platformOwnerHeader && /^(1|true)$/i.test(platformOwnerHeader)) {
    const merged = new Set<Permission>([
      ...(ctx.perms ?? []),
      ...ALL_PERMISSIONS,
    ]);
    return {
      ...ctx,
      isSuperAdmin: true,
      perms: Array.from(merged) as Permission[],
    };
  }
  return ctx;
}
