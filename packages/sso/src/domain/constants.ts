/**
 * SSO Domain Constants
 */

export const SSO_EVENTS = {
  LOGIN_STARTED: 'sso.login.started',
  LOGIN_COMPLETED: 'sso.login.completed',
  LOGIN_FAILED: 'sso.login.failed',
  ACCOUNT_LINKED: 'sso.account.linked',
  ACCOUNT_UNLINKED: 'sso.account.unlinked',
} as const;

export const SSO_PROVIDERS = {
  GOOGLE: 'google',
  GITHUB: 'github',
  MICROSOFT: 'microsoft',
  APPLE: 'apple',
  SAML: 'saml',
  OIDC: 'oidc',
} as const;

export type SsoProvider = (typeof SSO_PROVIDERS)[keyof typeof SSO_PROVIDERS];

export const SSO_DEFAULTS = {
  STATE_EXPIRY_SEC: 600,
  CALLBACK_TIMEOUT_MS: 30000,
} as const;

export const SSO_COLLECTIONS = {
  CONNECTIONS: 'sso_connections',
  LINKED_ACCOUNTS: 'sso_linked_accounts',
} as const;
