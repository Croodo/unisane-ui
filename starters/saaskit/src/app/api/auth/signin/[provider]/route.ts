import crypto from 'node:crypto';
import { getEnv } from '@unisane/kernel';
import { makeHandlerRaw } from '@unisane/gateway';
import { ipFrom } from '@unisane/gateway';
import { metrics } from '@/src/platform/telemetry';
import { encodeBase64UrlJson } from '@unisane/kernel';

function parseNext(url: URL): string | undefined {
  const raw = url.searchParams.get('next') ?? url.searchParams.get('callbackURL') ?? undefined;
  if (!raw) return undefined;
  try {
    const u = new URL(raw, url.origin);
    return u.origin === url.origin ? u.pathname + u.search + u.hash : undefined;
  } catch {
    return raw.startsWith('/') ? raw : undefined;
  }
}

function buildRedirectUri(origin: string, provider: string): string {
  const u = new URL(`/api/auth/callback/${provider}`, origin);
  return u.toString();
}

function setOAuthCookie(resHeaders: Headers, name: string, value: string, opts?: { maxAgeSec?: number }): void {
  const { APP_ENV } = getEnv();
  const attrs = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${opts?.maxAgeSec ?? 600}`, // 10 minutes
    'SameSite=Lax',
    'HttpOnly',
    APP_ENV === 'prod' ? 'Secure' : undefined,
  ].filter(Boolean);
  resHeaders.append('set-cookie', attrs.join('; '));
}

function b64url(buf: Uint8Array): string {
  return Buffer.from(buf).toString('base64url');
}

function makePkce(): { verifier: string; challenge: string } {
  const verifierBytes = crypto.randomBytes(64);
  const verifier = b64url(verifierBytes);
  const hash = crypto.createHash('sha256').update(verifier).digest();
  const challenge = b64url(hash);
  return { verifier, challenge };
}

export const GET = makeHandlerRaw<unknown, { provider: string }>(
  {
    op: 'auth.oauth.start',
    allowUnauthed: true,
    rateKey: ({ req, params }) => `${ipFrom(req)}:auth.oauth.start:${String(params?.provider ?? '').toLowerCase()}`,
  },
  async ({ req, params, requestId }) => {
    const url = new URL(req.url);
    const provider = String((await params)?.provider ?? '').toLowerCase();
    const next = parseNext(url) ?? '/onboarding';
    const { PUBLIC_BASE_URL, OAUTH_PROVIDERS, GOOGLE_CLIENT_ID, GITHUB_CLIENT_ID } = getEnv();
    const origin = (PUBLIC_BASE_URL && PUBLIC_BASE_URL.trim()) || `${url.protocol}//${url.host}`;
    const redirectUri = buildRedirectUri(origin, provider);
    const enabled = (OAUTH_PROVIDERS ?? '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (!enabled.includes(provider)) {
      try { metrics.inc('auth.oauth.start_denied', 1, { provider }); } catch {}
      const h = new Headers({ 'content-type': 'application/json', 'x-request-id': requestId });
      return new Response(JSON.stringify({ error: { message: 'provider not enabled' } }), { status: 400, headers: h });
    }

    const state = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    const payload = { s: state, p: provider, n: next, t: Date.now() };
    const stateB64 = encodeBase64UrlJson(payload);
    const headers = new Headers();
    setOAuthCookie(headers, 'oauth_state', stateB64);

    let authUrl: string | null = null;
    // Prepare PKCE for providers supporting code flow with PKCE
    const { verifier, challenge } = makePkce();
    const usePkce = provider === 'google' || provider === 'github';
    if (usePkce) setOAuthCookie(headers, 'oauth_pkce', verifier);
    if (provider === 'google') {
      // ROUTE-001 FIX: Return JSON error instead of plain text
      if (!GOOGLE_CLIENT_ID) {
        const h = new Headers({ 'content-type': 'application/json', 'x-request-id': requestId });
        return new Response(JSON.stringify({ error: { message: 'GOOGLE_CLIENT_ID missing' } }), { status: 500, headers: h });
      }
      // Add OIDC nonce for Google
      const nonceBytes = crypto.randomBytes(16);
      const nonce = b64url(nonceBytes);
      setOAuthCookie(headers, 'oauth_nonce', nonce);
      const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      u.searchParams.set('client_id', GOOGLE_CLIENT_ID);
      u.searchParams.set('redirect_uri', redirectUri);
      u.searchParams.set('response_type', 'code');
      u.searchParams.set('scope', 'openid email profile');
      u.searchParams.set('include_granted_scopes', 'true');
      u.searchParams.set('state', stateB64);
      u.searchParams.set('nonce', nonce);
      if (usePkce) {
        u.searchParams.set('code_challenge', challenge);
        u.searchParams.set('code_challenge_method', 'S256');
      }
      authUrl = u.toString();
    } else if (provider === 'github') {
      // ROUTE-001 FIX: Return JSON error instead of plain text
      if (!GITHUB_CLIENT_ID) {
        const h = new Headers({ 'content-type': 'application/json', 'x-request-id': requestId });
        return new Response(JSON.stringify({ error: { message: 'GITHUB_CLIENT_ID missing' } }), { status: 500, headers: h });
      }
      const u = new URL('https://github.com/login/oauth/authorize');
      u.searchParams.set('client_id', GITHUB_CLIENT_ID);
      u.searchParams.set('redirect_uri', redirectUri);
      u.searchParams.set('scope', 'read:user user:email');
      u.searchParams.set('state', stateB64);
      if (usePkce) {
        u.searchParams.set('code_challenge', challenge);
        u.searchParams.set('code_challenge_method', 'S256');
      }
      authUrl = u.toString();
    }
    if (!authUrl) {
      try { metrics.inc('auth.oauth.start_unknown_provider', 1, { provider }); } catch {}
      // ROUTE-001 FIX: Return JSON error instead of plain text
      const h = new Headers({ 'content-type': 'application/json', 'x-request-id': requestId });
      return new Response(JSON.stringify({ error: { message: 'unknown provider' } }), { status: 400, headers: h });
    }
    try { metrics.inc('auth.oauth.start', 1, { provider }); } catch {}
    headers.set('location', authUrl);
    headers.set('x-redirect-uri', redirectUri);
    headers.set('x-request-id', requestId);
    return new Response(null, { status: 302, headers });
  }
);

export const runtime = 'nodejs';
