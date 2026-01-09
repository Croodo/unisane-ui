/**
 * Auth platform stub - provides auth configuration
 * Actual implementations are injected by the application
 */

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecial: boolean;
  otpLength: number;
  otpExpiresInMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  allowedOAuthProviders: string[];
  requireEmailVerification: boolean;
  sessionMaxAge: number;
  accessTokenTtlSec: number;
  cookieAccessTtlSec: number;
  [key: string]: unknown;
}

const defaultAuthConfig: AuthConfig = {
  jwtSecret: '',
  jwtExpiresIn: '1h',
  refreshTokenExpiresIn: '7d',
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecial: false,
  otpLength: 6,
  otpExpiresInMinutes: 10,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  allowedOAuthProviders: ['google', 'github'],
  requireEmailVerification: true,
  sessionMaxAge: 86400,
  accessTokenTtlSec: 3600, // 1 hour
  cookieAccessTtlSec: 86400, // 24 hours
};

let _authConfig: AuthConfig = defaultAuthConfig;

export function getAuthConfig(): AuthConfig {
  return _authConfig;
}

export function setAuthConfig(config: Partial<AuthConfig>): void {
  _authConfig = { ...defaultAuthConfig, ...config };
}
