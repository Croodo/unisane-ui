import { getEnv, decodeBase64UrlJson } from "@unisane/kernel";
import { decodeJwt } from "jose";
import { exchange } from "@unisane/auth";
import { getAuthConfig } from "@/src/platform/auth/config";
import { signJwtRS256 } from "@unisane/gateway";
import { buildAccessTokenCookie, parseCookies } from "@unisane/gateway";
import { makeHandlerRaw } from "@unisane/gateway";
import { ipFrom } from "@unisane/gateway";
import { metrics } from "@/src/platform/telemetry";
import { appendAudit } from "@unisane/audit";
export const runtime = "nodejs";

function readOAuthCookie(
  cookieHeader: string | null | undefined,
  name: string
): string | null {
  const cookies = parseCookies(cookieHeader);
  const raw = cookies[name];
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function clearOAuthCookie(resHeaders: Headers, name: string): void {
  const { APP_ENV } = getEnv();
  const attrs = [
    `${name}=`,
    "Path=/",
    "Max-Age=0",
    "SameSite=Lax",
    "HttpOnly",
    APP_ENV === "prod" ? "Secure" : undefined,
  ].filter(Boolean);
  resHeaders.append("set-cookie", attrs.join("; "));
}

export const GET = makeHandlerRaw<unknown, { provider: string }>(
  {
    op: "auth.oauth.callback",
    allowUnauthed: true,
    rateKey: ({ req, params }) =>
      `${ipFrom(req)}:auth.oauth.callback:${String(params?.provider ?? "").toLowerCase()}`,
  },
  async ({ req, params, requestId }) => {
    const provider = String((await params)?.provider ?? "").toLowerCase();
    const url = new URL(req.url);
    const errParam = url.searchParams.get("error");
    const code = url.searchParams.get("code") ?? "";
    const stateParam = url.searchParams.get("state") ?? "";

    if (errParam) {
      try {
        metrics.inc("auth.oauth.callback_error", 1, {
          provider,
          error: errParam,
        });
      } catch {}
      const h = new Headers({ "x-request-id": String(requestId) });
      h.set(
        "location",
        `/login?error=oauth_${encodeURIComponent(errParam)}&rid=${encodeURIComponent(String(requestId))}`
      );
      return new Response(null, { status: 302, headers: h });
    }

    if (!code || !stateParam) {
      try {
        metrics.inc("auth.oauth.callback_invalid", 1, { provider });
      } catch {}
      return new Response("Missing code/state", { status: 400 });
    }

    // Validate state via cookie
    const stateCookie = readOAuthCookie(
      req.headers.get("cookie"),
      "oauth_state"
    );
    if (!stateCookie || stateCookie !== stateParam) {
      try {
        metrics.inc("auth.oauth.callback_state", 1, { provider });
      } catch {}
      return new Response("Invalid state", { status: 400 });
    }

    const { PUBLIC_BASE_URL } = getEnv();
    const origin =
      (PUBLIC_BASE_URL && PUBLIC_BASE_URL.trim()) ||
      `${url.protocol}//${url.host}`;
    const redirectUri = new URL(
      `/api/auth/callback/${provider}`,
      origin
    ).toString();

    const {
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET,
      JWT_PRIVATE_KEY,
    } = getEnv();
    if (!JWT_PRIVATE_KEY)
      return new Response("JWT private key not configured", { status: 500 });
    const authCfg = getAuthConfig();

    let providerToken: string | null = null;
    try {
      if (provider === "google") {
        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET)
          throw new Error("Google client not configured");
        const body = new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        });
        const pkce = readOAuthCookie(req.headers.get("cookie"), "oauth_pkce");
        if (pkce) body.set("code_verifier", pkce);
        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body,
        });
        if (!res.ok) throw new Error(`google token error: ${res.status}`);
        const payload = (await res.json()) as { id_token?: string };
        if (!payload.id_token) throw new Error("google id_token missing");
        // Verify nonce in ID token (OIDC)
        const nonceCookie = readOAuthCookie(
          req.headers.get("cookie"),
          "oauth_nonce"
        );
        try {
          const idp = decodeJwt(payload.id_token);
          const tokenNonce =
            typeof idp.nonce === "string" ? idp.nonce : undefined;
          if (!nonceCookie || !tokenNonce || tokenNonce !== nonceCookie)
            throw new Error("nonce mismatch");
        } catch {
          throw new Error("invalid id_token (nonce)");
        }
        providerToken = payload.id_token;
      } else if (provider === "github") {
        if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET)
          throw new Error("GitHub client not configured");
        const body = new URLSearchParams({
          code,
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          redirect_uri: redirectUri,
        });
        const pkce = readOAuthCookie(req.headers.get("cookie"), "oauth_pkce");
        if (pkce) body.set("code_verifier", pkce);
        const res = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: { accept: "application/json" },
          body,
        });
        if (!res.ok) throw new Error(`github token error: ${res.status}`);
        const payload = (await res.json()) as { access_token?: string };
        if (!payload.access_token)
          throw new Error("github access_token missing");
        providerToken = payload.access_token;
      } else {
        return new Response("Unknown provider", { status: 400 });
      }
    } catch {
      try {
        metrics.inc("auth.oauth.exchange_failed", 1, { provider });
      } catch {}
      const h = new Headers({ "x-request-id": String(requestId) });
      h.set(
        "location",
        `/login?error=oauth_exchange&rid=${encodeURIComponent(String(requestId))}`
      );
      return new Response(null, { status: 302, headers: h });
    }

    // Link/login user via tokenExchange path
    let userId: string;
    try {
      const out = await exchange({ provider, token: providerToken! });
      userId = out.userId;
    } catch {
      try {
        metrics.inc("auth.oauth.link_failed", 1, { provider });
      } catch {}
      const h = new Headers({ "x-request-id": String(requestId) });
      h.set(
        "location",
        `/login?error=oauth_link&rid=${encodeURIComponent(String(requestId))}`
      );
      return new Response(null, { status: 302, headers: h });
    }
    const jwt = signJwtRS256({ sub: userId }, JWT_PRIVATE_KEY, {
      expSec: authCfg.accessTokenTtlSec,
    });
    const authCookie = buildAccessTokenCookie(jwt, {
      maxAgeSec: authCfg.cookieAccessTtlSec,
    });

    // Decode next from state
    let next = "/onboarding";
    try {
      const obj = decodeBase64UrlJson(stateParam) as { n?: unknown } | null;
      const n = obj && typeof obj.n === "string" ? obj.n : null;
      next = n && n.startsWith("/") ? n : next;
    } catch {}

    // Clear transient cookies (state + pkce) and set auth cookie
    const headers = new Headers();
    headers.append("set-cookie", authCookie);
    clearOAuthCookie(headers, "oauth_state");
    clearOAuthCookie(headers, "oauth_pkce");
    clearOAuthCookie(headers, "oauth_nonce");
    headers.set("location", next);
    headers.set("x-request-id", requestId);
    try {
      metrics.inc("auth.oauth.success", 1, { provider });
      const ip = ipFrom(req);
      const ua = req.headers.get("user-agent");
      await appendAudit({
        scopeId: "-",
        actorId: userId,
        action: "auth.signin",
        resourceType: "auth",
        resourceId: provider,
        after: { provider },
        requestId,
        ip,
        ua,
      });
    } catch {}
    return new Response(null, { status: 302, headers });
  }
);
