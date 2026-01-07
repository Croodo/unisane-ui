# @unisane/sso

Single Sign-On: OAuth2/OIDC providers, SAML, account linking.

## Layer

**Layer 3 - Core**

## Overview

The SSO module provides the domain foundation for single sign-on:

- OAuth2/OIDC provider support (Google, GitHub, Microsoft, Apple)
- SAML integration for enterprise SSO
- Account linking (connect external identities to users)
- State management for OAuth flows

## Installation

```bash
pnpm add @unisane/sso
```

## Usage

### Cache Keys

```typescript
import { ssoKeys } from '@unisane/sso';
import { kv } from '@unisane/kernel';

// OAuth state storage
const stateKey = ssoKeys.state('random-state-id');
await kv.set(stateKey, { returnUrl: '/dashboard' }, { EX: 600 });

// Linked account lookup
const linkedKey = ssoKeys.linkedAccount('google', 'google-user-id');
const userId = await kv.get(linkedKey);

// User's linked accounts
const userAccountsKey = ssoKeys.userLinkedAccounts('user_123');

// Tenant provider config
const configKey = ssoKeys.providerConfig('tenant_123', 'google');
```

### Events

```typescript
import { events } from '@unisane/kernel';
import { SSO_EVENTS } from '@unisane/sso';

events.on(SSO_EVENTS.LOGIN_COMPLETED, async ({ payload }) => {
  console.log('SSO login:', payload.provider, payload.userId);
});

events.on(SSO_EVENTS.ACCOUNT_LINKED, async ({ payload }) => {
  console.log('Account linked:', payload.provider, payload.userId);
});
```

### Provider Constants

```typescript
import { SSO_PROVIDERS, SSO_DEFAULTS } from '@unisane/sso';

// Available providers
console.log(SSO_PROVIDERS.GOOGLE);    // 'google'
console.log(SSO_PROVIDERS.GITHUB);    // 'github'
console.log(SSO_PROVIDERS.MICROSOFT); // 'microsoft'
console.log(SSO_PROVIDERS.APPLE);     // 'apple'
console.log(SSO_PROVIDERS.SAML);      // 'saml'
console.log(SSO_PROVIDERS.OIDC);      // 'oidc'

// Default values
console.log(SSO_DEFAULTS.STATE_EXPIRY_SEC);    // 600
console.log(SSO_DEFAULTS.CALLBACK_TIMEOUT_MS); // 30000
```

## Exports

### Constants

| Constant | Description |
|----------|-------------|
| `SSO_EVENTS` | Event names for SSO lifecycle |
| `SSO_PROVIDERS` | Available provider identifiers |
| `SSO_DEFAULTS` | Default configuration values |
| `SSO_COLLECTIONS` | MongoDB collection names |

### Cache Keys

| Key Builder | Description |
|-------------|-------------|
| `ssoKeys.state(stateId)` | OAuth state storage |
| `ssoKeys.linkedAccount(provider, externalId)` | External account → user mapping |
| `ssoKeys.userLinkedAccounts(userId)` | User's linked external accounts |
| `ssoKeys.providerConfig(tenantId, provider)` | Tenant's provider configuration |

### Error Classes

| Error | Description |
|-------|-------------|
| `SsoProviderNotFoundError` | Unknown SSO provider |
| `SsoProviderDisabledError` | Provider disabled for tenant |
| `SsoCallbackError` | OAuth callback failed |
| `SsoStateInvalidError` | Invalid or expired OAuth state |
| `SsoAccountLinkError` | Cannot link external account |

### Types

| Type | Description |
|------|-------------|
| `SsoProvider` | Union of provider identifiers |
| `SsoKeyBuilder` | Type for ssoKeys object |

## Architecture

### Tenant Scoping Design

SSO has mixed scoping:

- **Provider configs** - Tenant-scoped (each tenant configures their own OAuth apps)
- **Linked accounts** - User-global (an external identity links to a user, not a tenant)
- **OAuth state** - Ephemeral (stored in Redis with TTL)

### Data Model (Planned)

```typescript
// SSO Connection (tenant's provider config)
{
  id: string,
  tenantId: string,
  provider: SsoProvider,
  clientId: string,
  clientSecret: string,  // encrypted
  enabled: boolean,
  config: Record<string, unknown>,
}

// Linked Account (user's external identities)
{
  id: string,
  userId: string,
  provider: SsoProvider,
  externalId: string,    // Provider's user ID
  email: string,
  displayName: string,
  linkedAt: Date,
}
```

## Dependencies

- `@unisane/kernel` - Core utilities, KV store, events

## Related Modules

- `@unisane/auth` - Password authentication
- `@unisane/identity` - User management
