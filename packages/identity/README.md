# @unisane/identity

User and membership management for multi-tenant applications.

## Layer

**Layer 2 - Foundation**

## Overview

The identity module provides core user management functionality including:

- User CRUD operations (create, read, update, delete)
- Membership management (user-tenant relationships)
- API key management for programmatic access
- Permission resolution and caching
- User search and filtering

## Installation

```bash
pnpm add @unisane/identity
```

## Usage

### Basic User Operations

```typescript
import {
  createUser,
  getUser,
  updateUser,
  deleteUser,
  listUsers,
} from '@unisane/identity';

// Create a new user
const user = await createUser({
  email: 'john@example.com',
  displayName: 'John Doe',
  locale: 'en-US',
});

// Get user by ID
const found = await getUser(userId);

// Update user
const updated = await updateUser({
  userId: user.id,
  patch: { displayName: 'John Smith' },
});

// List users with pagination
const { items, nextCursor } = await listUsers({
  limit: 20,
  sort: '-createdAt',
  filters: { q: 'john' },
});
```

### Membership Management

```typescript
import {
  addRole,
  removeRole,
  getMembership,
  listMembers,
} from '@unisane/identity';

// Add role to user (requires tenant context)
const membership = await addRole({
  userId: 'user_123',
  roleId: 'member',
});

// List all members in current tenant
const { items } = await listMembers({ limit: 50 });

// Get specific membership
const m = await getMembership({ userId: 'user_123' });
```

### API Keys

```typescript
import {
  createApiKey,
  revokeApiKey,
  listApiKeys,
  verifyApiKey,
} from '@unisane/identity';

// Create API key (requires tenant context)
const { id, token, scopes } = await createApiKey({
  name: 'CI/CD Integration',
  scopes: ['read:data', 'write:data'],
});

// Verify API key (cross-tenant operation)
const keyInfo = await verifyApiKey(token);
```

### Cache Keys

```typescript
import { identityKeys } from '@unisane/identity';
import { kv } from '@unisane/kernel';

// Use standardized cache keys
const cached = await kv.get(identityKeys.userById(userId));
await kv.del(identityKeys.userByEmail(email));
```

### Events

```typescript
import { events } from '@unisane/kernel';
import { IDENTITY_EVENTS } from '@unisane/identity';

// Listen for identity events
events.on(IDENTITY_EVENTS.USER_CREATED, async ({ payload }) => {
  console.log('New user:', payload.userId);
});

events.on(IDENTITY_EVENTS.MEMBERSHIP_ROLE_CHANGED, async ({ payload }) => {
  console.log('Role changed:', payload.action, payload.roleId);
});
```

## Exports

### Services

| Function | Description |
|----------|-------------|
| `createUser` | Create a new user |
| `getUser` | Get user by ID |
| `updateUser` | Update user profile |
| `deleteUser` | Soft-delete user |
| `listUsers` | List users with pagination |
| `findUserByEmail` | Find user by email |
| `findUserByUsername` | Find user by username |
| `findUserByPhone` | Find user by phone |
| `addRole` | Add role to membership |
| `removeRole` | Remove role from membership |
| `grantPerm` | Grant permission to user |
| `revokePerm` | Revoke permission from user |
| `createApiKey` | Create new API key |
| `revokeApiKey` | Revoke API key |
| `verifyApiKey` | Verify API key token |

### Types

| Type | Description |
|------|-------------|
| `UserRow` | Full user record |
| `MinimalUserRow` | Minimal user projection |
| `Membership` | User-tenant membership |
| `ApiKey` | API key record |
| `MeSummary` | Current user summary |

### Constants

| Constant | Description |
|----------|-------------|
| `IDENTITY_EVENTS` | Event names for the module |
| `USER_STATUS` | User status values |
| `API_KEY_STATUS` | API key status values |
| `GLOBAL_ROLES` | Global role values |

### Error Classes

| Error | Description |
|-------|-------------|
| `UserNotFoundError` | User not found |
| `EmailAlreadyExistsError` | Email already in use |
| `MembershipNotFoundError` | Membership not found |
| `ApiKeyNotFoundError` | API key not found |
| `InsufficientRoleError` | Insufficient permissions |

## Architecture

### Data Layer

- `users` collection - Global (not tenant-scoped)
- `memberships` collection - Tenant-scoped
- `apikeys` collection - Tenant-scoped

### Tenant Scoping

The identity module has special tenant scoping rules:

- **Users**: Global - users exist across all tenants
- **Memberships**: Tenant-scoped - links users to tenants
- **API Keys**: Tenant-scoped - belongs to specific tenant

Repository functions use `tenantFilter()` where appropriate, with explicit documentation for cross-tenant operations.

## Dependencies

- `@unisane/kernel` - Core utilities, context, database
- `@unisane/gateway` - HTTP error helpers

## Related Modules

- `@unisane/tenants` - Tenant management
- `@unisane/auth` - Authentication
- `@unisane/audit` - Audit logging
