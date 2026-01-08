import crypto from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { JWTPayload, JWSHeaderParameters, JWTVerifyOptions, JWTVerifyGetKey } from 'jose';
import { getEnv } from '@unisane/kernel';
import { getAuthConfig } from './config';

export type JwtHeader = { alg?: string; [k: string]: unknown };
export type JwtPayload = {
  sub?: string;
  tid?: string;
  tenantId?: string;
  tenant_id?: string;
  exp?: number;
  [k: string]: unknown;
};

// Legacy helpers kept for tests and local signing
export function b64urlToBuf(s: string): Buffer {
  const padLen = (4 - (s.length % 4)) % 4;
  const pad = padLen === 0 ? '' : '='.repeat(padLen);
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateJwtHeader(raw: unknown): JwtHeader | null {
  if (!isPlainObject(raw)) return null;
  // alg is required for our purposes
  if (typeof raw.alg !== 'string') return null;
  return raw as JwtHeader;
}

function validateJwtPayload(raw: unknown): JwtPayload | null {
  if (!isPlainObject(raw)) return null;
  // sub should be a string if present
  if ('sub' in raw && typeof raw.sub !== 'string' && raw.sub !== undefined) return null;
  // exp should be a number if present
  if ('exp' in raw && typeof raw.exp !== 'number' && raw.exp !== undefined) return null;
  return raw as JwtPayload;
}

export function verifyJwtRS256(token: string, publicKeyPem: string): { header: JwtHeader; payload: JwtPayload } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const h = parts[0]!;
  const p = parts[1]!;
  const sig = parts[2]!;
  try {
    const headerRaw = JSON.parse(b64urlToBuf(h).toString('utf8')) as unknown;
    const header = validateJwtHeader(headerRaw);
    if (!header || header.alg !== 'RS256') return null;

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${h}.${p}`);
    verifier.end();
    const ok = verifier.verify(publicKeyPem, b64urlToBuf(sig));
    if (!ok) return null;

    const payloadRaw = JSON.parse(b64urlToBuf(p).toString('utf8')) as unknown;
    const payload = validateJwtPayload(payloadRaw);
    if (!payload) return null;

    if (typeof payload.exp === 'number' && Date.now() / 1000 > payload.exp) return null;
    return { header, payload };
  } catch {
    return null;
  }
}

function b64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString('base64')
    .replace(/=+$/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function signJwtRS256(
  payload: Record<string, unknown>,
  privateKeyPem: string,
  opts?: { expSec?: number; kid?: string }
): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const expSec = opts?.expSec ?? 3600;
  const fullPayload = { iat: nowSec, exp: nowSec + expSec, ...payload };
  const header: Record<string, unknown> = { alg: 'RS256', typ: 'JWT' };
  if (opts?.kid) header.kid = opts.kid;
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(fullPayload));
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${h}.${p}`);
  signer.end();
  const sig = signer.sign(privateKeyPem);
  const s = b64url(sig);
  return `${h}.${p}.${s}`;
}

// JWKS with automatic key rotation support
// jose's createRemoteJWKSet automatically caches and refreshes keys
// Default cache behavior: ~10 minute cache, auto-refresh on key miss
interface JwksState {
  jwks: JWTVerifyGetKey;
  url: string;
  createdAt: number;
}

// Use global to share JWKS state across module instances
const globalForJwks = global as unknown as { __jwksState?: JwksState };

// Max age before forcing JWKS recreation (1 hour)
// This ensures we pick up any URL changes in config
const JWKS_MAX_AGE_MS = 60 * 60 * 1000;

function getJwks(): JWTVerifyGetKey | null {
  const { JWT_JWKS_URL } = getEnv();
  if (!JWT_JWKS_URL) return null;

  const now = Date.now();
  const existing = globalForJwks.__jwksState;

  // Recreate if URL changed or state is too old
  if (existing && existing.url === JWT_JWKS_URL && (now - existing.createdAt) < JWKS_MAX_AGE_MS) {
    return existing.jwks;
  }

  // Create new JWKS set with automatic caching and refresh
  // jose handles key rotation automatically - it will:
  // 1. Cache keys for ~10 minutes
  // 2. Refresh keys when a kid doesn't match cached keys
  // 3. Rate-limit refresh requests to prevent abuse
  const jwks = createRemoteJWKSet(new URL(JWT_JWKS_URL), {
    // Cool-down period between refreshes (default 10s)
    cooldownDuration: 10_000,
    // Cache lifetime (default 10 minutes)
    cacheMaxAge: 10 * 60 * 1000,
  });

  globalForJwks.__jwksState = {
    jwks,
    url: JWT_JWKS_URL,
    createdAt: now,
  };

  return jwks;
}

// Force JWKS refresh (useful for testing or manual key rotation)
export function clearJwksCache(): void {
  globalForJwks.__jwksState = undefined;
}

export type VerifiedJwt = { payload: JWTPayload; protectedHeader: JWSHeaderParameters };

export async function verifyJwtRS256Jose(token: string): Promise<VerifiedJwt | null> {
  const { JWT_PUBLIC_KEY, JWT_PUBLIC_KEY_PREV } = getEnv();
  const leeway = 60;
  const cfg = getAuthConfig();
  const audience: string | string[] | undefined = cfg.audience;
  const issuer: string | undefined = cfg.issuer;

  const buildOpts = (): JWTVerifyOptions => {
    const opts: JWTVerifyOptions = { algorithms: ['RS256'], clockTolerance: leeway } as JWTVerifyOptions;
    if (audience !== undefined) opts.audience = audience;
    if (issuer !== undefined) opts.issuer = issuer;
    return opts;
  };

  // Try JWKS first (supports automatic key rotation)
  const maybeJwks = getJwks();
  if (maybeJwks) {
    try {
      const { payload, protectedHeader } = await jwtVerify(token, maybeJwks, buildOpts());
      return { payload, protectedHeader };
    } catch {
      // JWKS verification failed, fall through to PEM keys
    }
  }

  // Fallback to static PEM keys
  async function tryPem(pem?: string): Promise<VerifiedJwt | null> {
    if (!pem || !pem.trim()) return null;
    try {
      const { importSPKI, importPKCS8 } = await import('jose');
      const body = pem.trim();
      const key = body.includes('BEGIN PUBLIC KEY') ? await importSPKI(body, 'RS256') : await importPKCS8(body, 'RS256');
      const { payload, protectedHeader } = await jwtVerify(token, key, buildOpts());
      return { payload, protectedHeader };
    } catch {
      return null;
    }
  }

  const v1 = await tryPem(JWT_PUBLIC_KEY);
  if (v1) return v1;

  const v0 = await tryPem(JWT_PUBLIC_KEY_PREV);
  if (v0) return v0;

  return null;
}
