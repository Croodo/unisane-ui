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
import { kv, getEnv, ALL_PERMISSIONS, KV, ZPermission } from '@unisane/kernel';
import { ERR } from '../errors/errors';

// --- Dev Environment Detection ---
// Use allowlist approach for dev environments to prevent accidental dev auth
// in environments like 'production', 'staging-prod', etc.
const DEV_ENVIRONMENTS = ['dev', 'test', 'development', 'local'] as const;
type DevEnv = typeof DEV_ENVIRONMENTS[number];

/**
 * Type guard to check if an environment string is a development environment.
 * Uses allowlist to ensure safety - unknown environments are treated as production.
 */
function isDevEnvironment(env: string | undefined): env is DevEnv {
  return !!env && DEV_ENVIRONMENTS.includes(env.toLowerCase() as DevEnv);
}

/**
 * H-007 FIX: Pre-compute ALL_PERMISSIONS set for O(1) lookup.
 * This is created once at module load time for efficient validation.
 */
const ALL_PERMISSIONS_SET = new Set(ALL_PERMISSIONS);

/**
 * GW-009 FIX: Validate API key scopes against known permissions.
 * Filters out invalid scopes and logs warnings for unrecognized values.
 * This prevents privilege escalation via malformed scope injection.
 *
 * H-007 FIX: Now also cross-references against ALL_PERMISSIONS constant
 * to ensure scopes are not only valid Zod types but also actually defined
 * in the permission catalog.
 */
function validateScopes(scopes: unknown[], source: string): Permission[] {
  if (!Array.isArray(scopes)) {
    return [];
  }

  const validPerms: Permission[] = [];
  for (const scope of scopes) {
    if (typeof scope !== 'string') {
      logger.warn('Invalid scope type in ' + source, { scopeType: typeof scope });
      continue;
    }

    // First, validate against Zod schema
    const result = ZPermission.safeParse(scope);
    if (!result.success) {
      logger.warn('Unrecognized scope in ' + source + ' (Zod validation failed)', { scope });
      continue;
    }

    // H-007 FIX: Cross-reference against ALL_PERMISSIONS catalog
    // This catches cases where a scope passes Zod but isn't in the actual permission set
    if (!ALL_PERMISSIONS_SET.has(result.data)) {
      logger.warn('Unrecognized scope in ' + source + ' (not in ALL_PERMISSIONS)', { scope });
      continue;
    }

    validPerms.push(result.data);
  }
  return validPerms;
}

// --- Auth Context Types ---

/** Method used to authenticate the request */
export type AuthMethod = 'cookie' | 'bearer' | 'apikey' | 'dev';

export interface AuthCtx {
  isAuthed: boolean;
  /** The authentication method used for this request */
  authMethod?: AuthMethod;
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
  scopeId: string;
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

// --- GW-006 FIX: Timeout Configuration ---

/**
 * GW-006 FIX: Timeout for database calls in auth.
 *
 * Auth operations should fail fast to prevent blocking request threads.
 * These timeouts ensure that slow database/cache operations don't hang
 * the entire auth flow.
 */
const AUTH_DB_TIMEOUT_MS = 5000; // 5 seconds for DB lookups
const AUTH_CACHE_TIMEOUT_MS = 2000; // 2 seconds for cache operations

/**
 * GW-006 FIX: Wrap a promise with a timeout.
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

// --- JSON Parsing with Validation ---

interface CachedApiKey {
  id: string;
  scopeId: string;
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
    typeof obj.scopeId === 'string' &&
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

    // GW-006 FIX: Apply timeout to database connection
    await withTimeout(repos.connectDb(), AUTH_DB_TIMEOUT_MS, 'connectDb');

    // Check if sessions were revoked
    // SECURITY FIX (SEC-002): Use >= to reject tokens issued at exact revocation time
    // This prevents race conditions where a token issued at the same millisecond as revocation
    // could still be accepted
    // GW-006 FIX: Apply timeout to user lookup
    const user = await withTimeout(repos.findUserById(sub), AUTH_DB_TIMEOUT_MS, 'findUserById');
    const revokedAt = user?.sessionsRevokedAt ?? null;
    if (revokedAt && tokenIatSec && revokedAt.getTime() >= tokenIatSec * 1000) {
      throw ERR.loginRequired();
    }

    if (tenantId) {
      // GW-006 FIX: Apply timeout to permission lookups
      const perms = await withTimeout(repos.getEffectivePerms(tenantId, sub), AUTH_DB_TIMEOUT_MS, 'getEffectivePerms');
      const { perms: finalPerms, isSuperAdmin } = await withTimeout(repos.applyGlobalOverlays(sub, perms), AUTH_DB_TIMEOUT_MS, 'applyGlobalOverlays');

      const baseCtx: AuthCtx = {
        isAuthed: true,
        authMethod: source,
        userId: sub,
        tenantId,
        ...(isSuperAdmin ? { isSuperAdmin: true } : {}),
      };

      logAuthEvent('info', 'jwt auth success', { auth_strategy: source, userId: sub, tenantId });
      return finalPerms.length ? { ...baseCtx, perms: finalPerms } : baseCtx;
    }

    // No tenant - global context
    // GW-006 FIX: Apply timeout to overlay lookup
    const { perms: finalPerms, isSuperAdmin } = await withTimeout(repos.applyGlobalOverlays(sub, []), AUTH_DB_TIMEOUT_MS, 'applyGlobalOverlays');
    if (isSuperAdmin) {
      return {
        isAuthed: true,
        authMethod: source,
        userId: sub,
        perms: finalPerms,
        isSuperAdmin: true,
      };
    }
    return { isAuthed: true, authMethod: source, userId: sub };
  } catch (e) {
    const error = e as Error;
    // Only log verbose errors in dev environments or for unexpected errors
    const { APP_ENV } = getEnv();
    if (isDevEnvironment(APP_ENV) || error.name !== 'JWTExpired') {
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

// Cache TTL configuration
// SECURITY: Keep cache TTL short to minimize revocation lag
// - Valid keys: 10 seconds (balance between performance and security)
// - Not found: 5 seconds (shorter to allow quick recovery from typos)
const API_KEY_CACHE_TTL_MS = 10_000;  // Reduced from 60s to 10s for faster revocation
const API_KEY_NOT_FOUND_CACHE_TTL_MS = 5_000;  // Reduced from 30s to 5s

// Global revocation timestamp - when set, all cached keys older than this are invalid
// This allows instant invalidation of all API keys without clearing each one
let globalRevocationTimestamp: number | null = null;

/**
 * Set a global revocation timestamp. All API key cache entries created before
 * this timestamp will be considered invalid on next lookup.
 * Use this for security emergencies (e.g., suspected breach).
 */
export function setGlobalApiKeyRevocation(timestamp: number = Date.now()): void {
  globalRevocationTimestamp = timestamp;
  logAuthEvent('warn', 'global API key revocation set', { timestamp });
}

/**
 * Clear the global revocation timestamp (after all keys have been rotated).
 */
export function clearGlobalApiKeyRevocation(): void {
  globalRevocationTimestamp = null;
  logAuthEvent('info', 'global API key revocation cleared', {});
}

async function cacheApiKeyLookup(hash: string): Promise<ApiKeyRecord | null> {
  const repos = getRepos();
  const cacheKey = `${KV.AK}${hash}`;

  // Try to get from cache
  // GW-006 FIX: Apply timeout to cache lookup
  const cached = await withTimeout(kv.get(cacheKey), AUTH_CACHE_TIMEOUT_MS, 'kv.get').catch(() => null);
  if (cached) {
    const parsed = parseJsonSafe(cached, isValidCachedApiKey);
    if (parsed) {
      // Check if this is a "not found" marker
      if (parsed.notFound) {
        return null;
      }

      // SECURITY: Check global revocation timestamp
      // If cache entry was created before global revocation, treat as invalid
      if (globalRevocationTimestamp && parsed.cachedAt < globalRevocationTimestamp) {
        logAuthEvent('info', 'api key cache invalidated by global revocation', {
          cacheKey,
          cachedAt: parsed.cachedAt,
          revokedAt: globalRevocationTimestamp,
        });
        // Fall through to fresh lookup
      } else {
        // Validate cache isn't too old (defense in depth)
        // SECURITY FIX (SEC-003): Use actual TTL, not 2x TTL
        // This ensures revoked API keys are rejected within the configured TTL (10s)
        // rather than potentially being accepted for up to 20s
        const age = Date.now() - parsed.cachedAt;
        if (age < API_KEY_CACHE_TTL_MS) {
          return {
            id: parsed.id,
            scopeId: parsed.scopeId,
            scopes: parsed.scopes,
          };
        }
        // Cache too old, fall through to fresh lookup
      }
    }
    // Invalid cache entry, will be overwritten below
  }

  // Fresh lookup from database
  // GW-006 FIX: Apply timeout to database lookup
  const row = await withTimeout(repos.findApiKeyByHash(hash), AUTH_DB_TIMEOUT_MS, 'findApiKeyByHash');

  // SECURITY: Check if the key has been revoked
  // The repository should return null or include revokedAt for revoked keys
  if (row?.revokedAt) {
    logAuthEvent('info', 'api key lookup returned revoked key', {
      apiKeyId: row.id,
      revokedAt: row.revokedAt,
    });
    // Cache the "not found" result to prevent repeated DB lookups
    const notFoundEntry: CachedApiKey = {
      id: '',
      scopeId: '',
      scopes: [],
      cachedAt: Date.now(),
      notFound: true,
    };
    // GW-006 FIX: Apply timeout to cache write (fire-and-forget on timeout)
    await withTimeout(kv.set(cacheKey, JSON.stringify(notFoundEntry), { PX: API_KEY_NOT_FOUND_CACHE_TTL_MS }), AUTH_CACHE_TIMEOUT_MS, 'kv.set').catch(() => {});
    return null;
  }

  // Cache the result
  const cacheEntry: CachedApiKey = row
    ? {
        id: row.id,
        scopeId: row.scopeId,
        scopes: row.scopes,
        cachedAt: Date.now(),
      }
    : {
        id: '',
        scopeId: '',
        scopes: [],
        cachedAt: Date.now(),
        notFound: true,
      };

  const ttl = row ? API_KEY_CACHE_TTL_MS : API_KEY_NOT_FOUND_CACHE_TTL_MS;
  // GW-006 FIX: Apply timeout to cache write (fire-and-forget on timeout)
  await withTimeout(kv.set(cacheKey, JSON.stringify(cacheEntry), { PX: ttl }), AUTH_CACHE_TIMEOUT_MS, 'kv.set').catch(() => {});

  return row;
}

/**
 * Invalidate a specific API key cache entry.
 * Call this when a key is revoked or deleted.
 *
 * IMPORTANT: This should be called from the API key revocation handler
 * to ensure immediate invalidation.
 */
export async function invalidateApiKeyCache(hash: string): Promise<void> {
  const cacheKey = `${KV.AK}${hash}`;
  try {
    // GW-006 FIX: Apply timeout to cache deletion
    await withTimeout(kv.del(cacheKey), AUTH_CACHE_TIMEOUT_MS, 'kv.del');
    logAuthEvent('info', 'api key cache invalidated', { cacheKey });
  } catch (error) {
    logAuthEvent('error', 'failed to invalidate api key cache', {
      cacheKey,
      error: error instanceof Error ? error.message : String(error),
    });
  }
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
      // GW-006 FIX: Apply timeout to database connection
      await withTimeout(repos.connectDb(), AUTH_DB_TIMEOUT_MS, 'connectDb');
      const hash = sha256Hex(apiKeyToken);
      const key = await cacheApiKeyLookup(hash);
      if (key) {
        logAuthEvent('info', 'api key auth success', {
          auth_strategy: 'api_key',
          scopeId: key.scopeId,
          apiKeyId: key.id
        });
        return {
          isAuthed: true,
          authMethod: 'apikey',
          apiKeyId: String(key.id),
          tenantId: key.scopeId, // Map scopeId to tenantId for AuthCtx compatibility
          // GW-009 FIX: Validate scopes against known permissions
          perms: validateScopes(key.scopes ?? [], 'api_key'),
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
  // Only allow dev auth headers in explicit development environments
  // Uses allowlist to prevent accidental dev auth in staging or production environments
  const { APP_ENV } = getEnv();
  if (!isDevEnvironment(APP_ENV)) {
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
        return { isAuthed: true, authMethod: 'dev', userId: sub };
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
  // GW-009 FIX: Validate dev header scopes against known permissions
  const perms = validateScopes(
    permsHdr.split(',').map((p) => p.trim()).filter(Boolean),
    'x-perms header'
  );

  // Log warning when dev auth headers are used
  const hasDevHeaders = tenantId || userIdHeader || role || platformOwnerHeader || perms.length > 0;
  if (hasDevHeaders) {
    logAuthEvent('warn', 'dev auth headers used - not for production', {
      tenantId,
      userId: userIdHeader,
      role,
      hasPlatformOwner: !!platformOwnerHeader,
      permCount: perms.length,
    });
  }

  const isAuthed = Boolean(readBearerToken(req.headers) || readApiKeyToken(req.headers));
  const ctx: AuthCtx = {
    isAuthed,
    authMethod: 'dev',
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
