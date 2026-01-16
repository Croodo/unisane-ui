import { z } from "zod";

/**
 * Auth Configuration Schema
 *
 * Type-safe authentication configuration with validation.
 *
 * @example
 * ```ts
 * const authConfig = defineAuth({
 *   // Token TTLs
 *   accessTokenTtlSec: 2592000, // 30 days
 *   refreshTokenTtlSec: 86400 * 90, // 90 days
 *
 *   // Cookie settings
 *   cookieDomain: ".example.com",
 *   cookieSameSite: "lax",
 *   cookieSecure: true,
 *
 *   // OAuth providers
 *   oauthProviders: ["google", "github"],
 *
 *   // JWT settings
 *   issuer: "https://auth.example.com",
 *   audience: ["https://api.example.com"],
 *
 *   // Feature toggles
 *   passwordEnabled: true,
 *   otpEnabled: true,
 *   magicLinkEnabled: false,
 * });
 * ```
 */

export const OAUTH_PROVIDERS = ["google", "github", "facebook", "microsoft", "apple"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];
export const ZOAuthProvider = z.enum(OAUTH_PROVIDERS);

export const COOKIE_SAMESITE = ["strict", "lax", "none"] as const;
export type CookieSameSite = (typeof COOKIE_SAMESITE)[number];
export const ZCookieSameSite = z.enum(COOKIE_SAMESITE);

/**
 * Auth configuration schema
 */
export const ZAuthConfig = z.object({
  // Token TTLs (seconds)
  accessTokenTtlSec: z.number().int().positive().default(2592000), // 30 days
  refreshTokenTtlSec: z.number().int().positive().optional(),
  cookieAccessTtlSec: z.number().int().positive().default(2592000),

  // Cookie settings
  cookieDomain: z.string().optional(),
  cookieSameSite: ZCookieSameSite.default("lax"),
  cookieSecure: z.boolean().default(true),
  cookieHttpOnly: z.boolean().default(true),

  // OAuth providers enabled
  oauthProviders: z.array(ZOAuthProvider).default([]),

  // JWT settings
  issuer: z.string().optional(),
  audience: z.union([z.string(), z.array(z.string())]).optional(),

  // Feature toggles
  passwordEnabled: z.boolean().default(true),
  otpEnabled: z.boolean().default(false),
  magicLinkEnabled: z.boolean().default(false),
  ssoEnabled: z.boolean().default(false),

  // OTP settings
  otpLength: z.number().int().min(4).max(8).default(6),
  otpTtlSec: z.number().int().positive().default(600), // 10 min

  // Password reset
  resetTokenTtlSec: z.number().int().positive().default(3600), // 1 hour

  // Session settings
  maxFailedLogins: z.number().int().positive().default(5),
  lockoutDurationSec: z.number().int().positive().default(900), // 15 min
});

export type AuthConfig = z.infer<typeof ZAuthConfig>;

/**
 * Define auth configuration with validation
 */
export function defineAuth(config: Partial<AuthConfig>): AuthConfig {
  return ZAuthConfig.parse(config);
}

/**
 * OAuth provider credentials schema
 */
export const ZOAuthCredentials = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  redirectUri: z.string().url().optional(),
  scopes: z.array(z.string()).optional(),
});

export type OAuthCredentials = z.infer<typeof ZOAuthCredentials>;

/**
 * Full OAuth configuration per provider
 */
export const ZOAuthConfig = z.record(ZOAuthProvider, ZOAuthCredentials.optional());
export type OAuthConfig = z.infer<typeof ZOAuthConfig>;

/**
 * Define OAuth provider configurations
 */
export function defineOAuth(
  config: Partial<Record<OAuthProvider, OAuthCredentials | undefined>>
): OAuthConfig {
  return ZOAuthConfig.parse(config);
}
