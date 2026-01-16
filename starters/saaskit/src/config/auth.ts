/**
 * Auth Configuration
 *
 * Type-safe authentication configuration using @unisane/config.
 * Centralizes all auth-related settings with validation.
 */

import {
  defineAuth,
  defineOAuth,
  type AuthConfig,
  type OAuthConfig,
  type OAuthProvider,
} from "@unisane/config";
import { getEnv } from "@unisane/kernel";

// ============================================================================
// Auth Configuration
// ============================================================================

let cachedAuthConfig: AuthConfig | null = null;

export function getAuthConfig(): AuthConfig {
  if (cachedAuthConfig) return cachedAuthConfig;

  const env = getEnv();

  // Parse OAuth providers from comma-separated env
  const oauthProviders = (env.OAUTH_PROVIDERS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean) as OAuthProvider[];

  // Parse audience (can be comma-separated)
  const audienceRaw = (process.env.JWT_AUDIENCE ?? "").trim();
  const audience = audienceRaw
    ? audienceRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  cachedAuthConfig = defineAuth({
    accessTokenTtlSec: env.JWT_ACCESS_TTL_SEC,
    cookieAccessTtlSec: env.COOKIE_ACCESS_TTL_SEC,
    cookieSameSite: env.COOKIE_SAMESITE,
    cookieDomain: env.COOKIE_DOMAIN,
    oauthProviders,
    issuer: (process.env.JWT_ISSUER ?? "").trim() || undefined,
    audience: audience?.length ? audience : undefined,
    passwordEnabled: env.AUTH_PASSWORD_ENABLED,
    otpEnabled: env.AUTH_OTP_ENABLED,
  });

  return cachedAuthConfig;
}

// ============================================================================
// OAuth Provider Configuration
// ============================================================================

let cachedOAuthConfig: OAuthConfig | null = null;

export function getOAuthConfig(): OAuthConfig {
  if (cachedOAuthConfig) return cachedOAuthConfig;

  const env = getEnv();

  cachedOAuthConfig = defineOAuth({
    google: env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        }
      : undefined,
    github: env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? {
          clientId: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
        }
      : undefined,
  });

  return cachedOAuthConfig;
}

// ============================================================================
// Type Exports
// ============================================================================

export type { AuthConfig, OAuthConfig, OAuthProvider };
