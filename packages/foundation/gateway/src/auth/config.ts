/**
 * Auth configuration for JWT verification.
 * This is a stub that returns defaults. Applications should override this
 * by providing their own implementation.
 */

export type AuthConfig = {
  audience?: string | string[];
  issuer?: string;
};

let _authConfig: AuthConfig = {};

/**
 * Get the current auth configuration.
 */
export function getAuthConfig(): AuthConfig {
  return _authConfig;
}

/**
 * Set auth configuration. Call this during app initialization.
 */
export function setAuthConfig(config: AuthConfig): void {
  _authConfig = config;
}
