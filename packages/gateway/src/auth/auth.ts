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

let authRepos: AuthRepositories | null = null;

/**
 * Configure the auth module with repository implementations.
 * Must be called at app startup before handling requests.
 */
export function configureAuth(repos: AuthRepositories): void {
  authRepos = repos;
}

function getRepos(): AuthRepositories {
  if (!authRepos) {
    throw new Error('Auth not configured. Call configureAuth() at app startup.');
  }
  return authRepos;
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

      try { baseLog.info('jwt auth success', { auth_strategy: source, userId: sub, tenantId }); } catch {}
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
    if (getEnv().APP_ENV === 'prod') {
      try { baseLog.warn('jwt verification failed', { auth_strategy: source, err: (e as Error)?.message }); } catch {}
    }
    return null;
  }
}

// --- API Key Authentication ---

async function cacheApiKeyLookup(hash: string): Promise<ApiKeyRecord | null> {
  const repos = getRepos();
  const ck = `ak:${hash}`;
  const cached = await kv.get(ck);
  if (cached) {
    try {
      return JSON.parse(cached) as ApiKeyRecord | null;
    } catch {}
  }
  const row = await repos.findApiKeyByHash(hash);
  await kv.set(ck, JSON.stringify(row), { PX: 60_000 });
  return row;
}

function deriveTenantIdFromTokenOrUrl(payload: Record<string, unknown> | null | undefined, req: Request): string | undefined {
  const t = (payload?.['tid'] ?? payload?.['tenantId'] ?? payload?.['tenant_id']) as unknown;
  return t ? String(t) : tenantIdFromUrl(req);
}

// --- Main Auth Context Extraction ---

export async function getAuthCtx(req: Request): Promise<AuthCtx> {
  let path = '';
  try { path = new URL(req.url).pathname; } catch {}
  const reqId = req.headers.get(HEADER_NAMES.REQUEST_ID) ?? 'n/a';
  const baseLog = withRequest({ method: req.method, url: path });

  // 1) API Key — Authorization: ApiKey <token> | x-api-key: <token>
  const apiKeyToken = readApiKeyToken(req.headers);
  if (apiKeyToken) {
    try {
      const repos = getRepos();
      await repos.connectDb();
      const hash = sha256Hex(apiKeyToken);
      const key = await cacheApiKeyLookup(hash);
      if (key) {
        try { logger.info('api key auth success', { auth_strategy: 'api_key', tenantId: key.tenantId }); } catch {}
        return {
          isAuthed: true,
          apiKeyId: String(key.id),
          tenantId: key.tenantId,
          perms: (key.scopes ?? []) as Permission[],
        };
      }
    } catch {}
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
  } catch {}

  // Header-based stub for tests/tools
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
