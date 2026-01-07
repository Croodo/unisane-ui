/**
 * SSO Cache Keys
 */

export const ssoKeys = {
  state: (stateId: string) => `sso:state:${stateId}` as const,

  linkedAccount: (provider: string, externalId: string) =>
    `sso:linked:${provider}:${externalId}` as const,

  userLinkedAccounts: (userId: string) =>
    `sso:user:${userId}:accounts` as const,

  providerConfig: (tenantId: string, provider: string) =>
    `sso:config:${tenantId}:${provider}` as const,
} as const;

export type SsoKeyBuilder = typeof ssoKeys;
