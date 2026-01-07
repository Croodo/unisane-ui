import { getEnv } from '@unisane/kernel';

export type AuthConfig = {
  accessTokenTtlSec: number;
  cookieAccessTtlSec: number;
  oauthProviders: string[];
  issuer?: string;
  audience?: string | string[];
};

export function getAuthConfig(): AuthConfig {
  const env = getEnv();
  const oauthProviders = (env.OAUTH_PROVIDERS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const issuer = (process.env.JWT_ISSUER ?? '').trim() || undefined;
  const audienceRaw = (process.env.JWT_AUDIENCE ?? '').trim();
  const audience = audienceRaw ? audienceRaw.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
  const cfg: AuthConfig = {
    accessTokenTtlSec: env.JWT_ACCESS_TTL_SEC,
    cookieAccessTtlSec: env.COOKIE_ACCESS_TTL_SEC,
    oauthProviders,
  };
  if (issuer) cfg.issuer = issuer;
  if (audience && audience.length) cfg.audience = audience as string[];
  return cfg;
}
