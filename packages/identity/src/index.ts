/**
 * @module @unisane/identity
 * @description User and membership management for multi-tenant applications
 * @layer 2
 *
 * Provides:
 * - User CRUD operations
 * - Membership management (user-tenant relationships)
 * - API key management
 * - User search and filtering
 *
 * @example
 * ```typescript
 * import {
 *   createUser,
 *   getUser,
 *   listUsers,
 *   UserNotFoundError,
 *   IDENTITY_EVENTS,
 *   identityKeys,
 * } from '@unisane/identity';
 *
 * // Create a new user
 * const user = await createUser({
 *   email: 'john@example.com',
 *   displayName: 'John Doe',
 * });
 *
 * // Use cache keys
 * const cached = await cacheGet(identityKeys.userById(userId));
 *
 * // Listen for events
 * events.on(IDENTITY_EVENTS.USER_CREATED, async (event) => {
 *   console.log('New user:', event.payload.userId);
 * });
 * ```
 */

// ════════════════════════════════════════════════════════════════════════════
// Services - Users
// ════════════════════════════════════════════════════════════════════════════

export {
  createUser,
  updateUser,
  deleteUser,
  getUser,
  listUsers,
  findUserByEmail,
  findUserByPhone,
  findUserByUsername,
  isUsernameAvailable,
  isPhoneAvailable,
  revokeSessions,
  ensureUserByEmail,
  getUserGlobalRole,
  updateUserById,
  getUserId,
} from './service/users';

export type {
  UpdateUserArgs,
  DeleteUserArgs,
  RevokeSessionsArgs,
  UsernameAvailableArgs,
  PhoneAvailableArgs,
} from './service/users';

// ════════════════════════════════════════════════════════════════════════════
// Services - Me (Current User)
// ════════════════════════════════════════════════════════════════════════════

export * from './service/me';

// ════════════════════════════════════════════════════════════════════════════
// Services - Membership
// ════════════════════════════════════════════════════════════════════════════

export * from './service/membership';

// ════════════════════════════════════════════════════════════════════════════
// Services - API Keys
// ════════════════════════════════════════════════════════════════════════════

export * from './service/apiKeys';

// ════════════════════════════════════════════════════════════════════════════
// Services - Tenants (user's tenant list)
// ════════════════════════════════════════════════════════════════════════════

export * from './service/tenants';

// ════════════════════════════════════════════════════════════════════════════
// Services - Admin
// ════════════════════════════════════════════════════════════════════════════

export * from './service/admin/read';
export * from './service/admin/export';
export { getAdminUsersStats, getTenantMembershipCounts, getTenantApiKeyCounts } from './service/admin/stats';
export { usersFacets } from './service/admin/facets';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Types
// ════════════════════════════════════════════════════════════════════════════

export type {
  MinimalUserRow,
  UserRow,
  Membership,
  ApiKey,
  MeSummary,
} from './domain/types';

// Re-export ListUsersArgs from service (it's also in domain/types but service re-exports it)
export type { ListUsersArgs } from './service/users';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Schemas (for validation)
// ════════════════════════════════════════════════════════════════════════════

export * from './domain/schemas';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Errors
// ════════════════════════════════════════════════════════════════════════════

export {
  // Error classes
  UserNotFoundError,
  EmailAlreadyExistsError,
  UsernameAlreadyExistsError,
  PhoneAlreadyExistsError,
  ApiKeyNotFoundError,
  ApiKeyRevokedError,
  ApiKeyLimitExceededError,
  MembershipNotFoundError,
  InsufficientRoleError,
  InvalidEmailError,
  InvalidPhoneError,
} from './domain/errors';

// Re-export isDuplicateKeyError from kernel for backwards compatibility
export { isDuplicateKeyError } from '@unisane/kernel';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Constants
// ════════════════════════════════════════════════════════════════════════════

export {
  IDENTITY_EVENTS,
  USER_STATUS,
  API_KEY_STATUS,
  GLOBAL_ROLES,
  IDENTITY_DEFAULTS,
  IDENTITY_COLLECTIONS,
} from './domain/constants';

export type {
  UserStatus,
  ApiKeyStatus,
  GlobalRole,
} from './domain/constants';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Cache Keys
// ════════════════════════════════════════════════════════════════════════════

export { identityKeys } from './domain/keys';
export type { IdentityKeyBuilder } from './domain/keys';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Mappers
// ════════════════════════════════════════════════════════════════════════════

export { toUserDto } from './domain/mappers';

// ════════════════════════════════════════════════════════════════════════════
// Data - Repository (for internal/advanced use)
// ════════════════════════════════════════════════════════════════════════════

export {
  usersRepository,
  membershipsRepository,
  apiKeysRepository,
} from './data/repo';

// ════════════════════════════════════════════════════════════════════════════
// Utilities (re-exported from kernel)
// ════════════════════════════════════════════════════════════════════════════

export { normalizeEmail, normalizeUsername, normalizePhoneE164 } from '@unisane/kernel';

// ════════════════════════════════════════════════════════════════════════════
// Providers (Dependency Injection)
// ════════════════════════════════════════════════════════════════════════════

export { configureIdentityProviders } from './providers';
export type { IdentityProviders, TenantsRepoLike } from './providers';
