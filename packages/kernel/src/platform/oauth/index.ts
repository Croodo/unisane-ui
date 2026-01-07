/**
 * OAuth platform stub - provides OAuth provider adapters
 * Actual implementations are injected by the application
 */

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
}

export interface OAuthUserInfo {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
  raw?: Record<string, unknown>;
}

export interface OAuthProviderAdapter {
  name: string;
  getAuthorizationUrl(state: string, redirectUri: string): string;
  exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens>;
  getUserInfo(tokens: OAuthTokens): Promise<OAuthUserInfo>;
  refreshTokens?(refreshToken: string): Promise<OAuthTokens>;
}

export type OAuthProviderName = 'google' | 'github' | 'microsoft' | 'slack' | string;

const noopAdapter: OAuthProviderAdapter = {
  name: 'noop',
  getAuthorizationUrl: () => '',
  exchangeCode: async () => ({ accessToken: '' }),
  getUserInfo: async () => ({ id: '' }),
};

let _adapters: Map<string, OAuthProviderAdapter> = new Map();

export function getProviderAdapter(provider: OAuthProviderName): OAuthProviderAdapter {
  return _adapters.get(provider) ?? noopAdapter;
}

export function registerOAuthProvider(provider: OAuthProviderName, adapter: OAuthProviderAdapter): void {
  _adapters.set(provider, adapter);
}

export function getRegisteredProviders(): OAuthProviderName[] {
  return Array.from(_adapters.keys());
}
