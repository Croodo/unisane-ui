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

export function parseCookies(header: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  const parts = header.split(';');
  for (const part of parts) {
    const [rawK, ...rest] = part.split('=');
    const k = (rawK ?? '').trim();
    if (!k) continue;
    out[k] = rest.join('=').trim();
  }
  return out;
}
