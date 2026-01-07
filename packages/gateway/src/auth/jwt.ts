import crypto from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { JWTPayload, JWSHeaderParameters, JWTVerifyOptions } from 'jose';
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

export function verifyJwtRS256(token: string, publicKeyPem: string): { header: JwtHeader; payload: JwtPayload } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const h = parts[0]!;
  const p = parts[1]!;
  const sig = parts[2]!;
  try {
    const headerRaw = JSON.parse(b64urlToBuf(h).toString('utf8')) as unknown;
    const header: JwtHeader = headerRaw && typeof headerRaw === 'object' ? (headerRaw as JwtHeader) : {};
    if (header.alg !== 'RS256') return null;
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${h}.${p}`);
    verifier.end();
    const ok = verifier.verify(publicKeyPem, b64urlToBuf(sig));
    if (!ok) return null;
    const payloadRaw = JSON.parse(b64urlToBuf(p).toString('utf8')) as unknown;
    const payload: JwtPayload = payloadRaw && typeof payloadRaw === 'object' ? (payloadRaw as JwtPayload) : {};
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

// jose-based verification with JWKS + leeway
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJwks() {
  const { JWT_JWKS_URL } = getEnv();
  if (!JWT_JWKS_URL) return null;
  if (!jwks) jwks = createRemoteJWKSet(new URL(JWT_JWKS_URL));
  return jwks;
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
  const maybeJwks = getJwks();
  if (maybeJwks) {
    try {
      const { payload, protectedHeader } = await jwtVerify(token, maybeJwks, buildOpts());
      return { payload, protectedHeader };
    } catch {
      // fallthrough
    }
  }
  async function tryPem(pem?: string) {
    if (!pem || !pem.trim()) return null;
    try {
      const { importSPKI, importPKCS8 } = await import('jose');
      const body = pem.trim();
      const key = body.includes('BEGIN PUBLIC KEY') ? await importSPKI(body, 'RS256') : await importPKCS8(body, 'RS256');
      const { payload, protectedHeader } = await jwtVerify(token, key, buildOpts());
      return { payload, protectedHeader } as VerifiedJwt;
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
