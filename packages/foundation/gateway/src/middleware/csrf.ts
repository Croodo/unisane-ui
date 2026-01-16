import { HEADER_NAMES } from "../headers";
import { ERR } from "../errors/errors";
import type { AuthCtx } from "./rbac";
import { getEnv } from "@unisane/kernel";

/**
 * CSRF protection for cookie-authenticated requests.
 *
 * This middleware validates CSRF tokens for state-changing requests (POST, PUT, DELETE, PATCH)
 * when authentication is based on cookies rather than Authorization headers.
 *
 * SECURITY: We check CSRF even when Authorization header is present if cookies are also present,
 * because an attacker could bypass CSRF by adding an invalid Authorization header while still
 * relying on valid cookie authentication.
 */
export async function assertCsrfForCookieAuth(req: Request, ctx: AuthCtx): Promise<void> {
  // CSRF only for state-changing methods
  const method = req.method.toUpperCase();
  const isStateChanging = !["GET", "HEAD", "OPTIONS"].includes(method);
  if (!isStateChanging) return;

  // Check if request uses cookie-based authentication
  const hasCookie = Boolean(req.headers.get("cookie"));
  if (!hasCookie) return;

  // Skip CSRF check only if:
  // 1. User is not authenticated (no valid session), OR
  // 2. Authentication came from API key (not cookie-based session)
  //
  // NOTE: We explicitly check ctx.authMethod to distinguish between:
  // - Cookie-based auth (session) - requires CSRF
  // - API key auth - does not require CSRF (stateless)
  // - Bearer token auth - does not require CSRF (stateless)
  const isApiKeyAuth = ctx.authMethod === 'apikey';
  const isBearerAuth = ctx.authMethod === 'bearer';

  // If not authenticated or using non-cookie auth, skip CSRF
  if (!ctx.isAuthed || isApiKeyAuth || isBearerAuth) return;

  // GW-002 FIX: Use explicit allowlist for environments that don't require CSRF
  // This is safer than checking "not prod" since unknown environments get protection
  const CSRF_EXEMPT_ENVIRONMENTS = ['dev', 'test', 'development', 'local', 'ci'] as const;
  const appEnv = (getEnv().APP_ENV ?? "dev").toLowerCase();
  if (CSRF_EXEMPT_ENVIRONMENTS.includes(appEnv as typeof CSRF_EXEMPT_ENVIRONMENTS[number])) return;

  // Validate CSRF token: must match between header and cookie
  const csrfHeader = req.headers.get(HEADER_NAMES.CSRF_TOKEN);
  const { parseCookies } = await import("./cookies");
  const cookies = parseCookies(req.headers.get("cookie"));
  const csrfCookie = cookies["csrf_token"];

  if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
    throw ERR.forbidden("Invalid CSRF token");
  }
}

