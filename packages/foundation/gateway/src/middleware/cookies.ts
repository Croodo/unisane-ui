import { getEnv, SESSION_CONFIG } from '@unisane/kernel';

export function buildAccessTokenCookie(token: string, opts?: { maxAgeSec?: number }) {
  const { APP_ENV, COOKIE_SAMESITE, COOKIE_DOMAIN } = getEnv();
  const same = COOKIE_SAMESITE.toLowerCase();
  const attrs = [
    'Path=/',
    'HttpOnly',
    `SameSite=${same === 'none' ? 'None' : same === 'strict' ? 'Strict' : 'Lax'}`,
    COOKIE_DOMAIN ? `Domain=${COOKIE_DOMAIN}` : undefined,
    (APP_ENV === 'prod' || same === 'none') ? 'Secure' : undefined,
    `Max-Age=${opts?.maxAgeSec ?? SESSION_CONFIG.DEFAULT_EXPIRATION_SEC}`,
  ].filter(Boolean);
  return `access_token=${token}; ${attrs.join('; ')}`;
}

export function buildCsrfCookie(token: string, opts?: { maxAgeSec?: number }) {
  const { APP_ENV, COOKIE_SAMESITE, COOKIE_DOMAIN } = getEnv();
  const same = COOKIE_SAMESITE.toLowerCase();
  const attrs = [
    'Path=/',
    // CSRF cookie must be readable by JS for double-submit; do not set HttpOnly
    `SameSite=${same === 'none' ? 'None' : same === 'strict' ? 'Strict' : 'Lax'}`,
    COOKIE_DOMAIN ? `Domain=${COOKIE_DOMAIN}` : undefined,
    (APP_ENV === 'prod' || same === 'none') ? 'Secure' : undefined,
    `Max-Age=${opts?.maxAgeSec ?? 7200}`,
  ].filter(Boolean);
  return `csrf_token=${token}; ${attrs.join('; ')}`;
}

// GW-004 FIX: Bounds for cookie parsing to prevent DoS
// RFC 6265 recommends at least 4KB per cookie, most browsers support 4-8KB
// We allow up to 16KB total and 50 cookies max to be generous while preventing abuse
const MAX_COOKIE_HEADER_LENGTH = 16384; // 16KB
const MAX_COOKIE_COUNT = 50;

export function parseCookies(header: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;

  // GW-004 FIX: Reject oversized cookie headers
  if (header.length > MAX_COOKIE_HEADER_LENGTH) {
    return out; // Return empty - oversized header is suspicious
  }

  const parts = header.split(';');

  // GW-004 FIX: Limit number of cookies parsed
  const maxParts = Math.min(parts.length, MAX_COOKIE_COUNT);
  for (let i = 0; i < maxParts; i++) {
    const part = parts[i]!;
    const [rawK, ...rest] = part.split('=');
    const k = (rawK ?? '').trim();
    if (!k) continue;
    out[k] = rest.join('=').trim();
  }
  return out;
}
