/**
 * @module @unisane/sso
 * @description Single Sign-On: OAuth2/OIDC providers, SAML, account linking
 * @layer 3
 */

// ════════════════════════════════════════════════════════════════════════════
// Domain - Errors
// ════════════════════════════════════════════════════════════════════════════

export {
  SsoProviderNotFoundError,
  SsoProviderDisabledError,
  SsoCallbackError,
  SsoStateInvalidError,
  SsoAccountLinkError,
} from './domain/errors';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Constants
// ════════════════════════════════════════════════════════════════════════════

export {
  SSO_EVENTS,
  SSO_PROVIDERS,
  SSO_DEFAULTS,
  SSO_COLLECTIONS,
} from './domain/constants';
export type { SsoProvider } from './domain/constants';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Cache Keys
// ════════════════════════════════════════════════════════════════════════════

export { ssoKeys } from './domain/keys';
export type { SsoKeyBuilder } from './domain/keys';
