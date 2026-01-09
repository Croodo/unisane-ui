/**
 * @unisane/identity/client
 *
 * Client-safe exports that can be used in browser environments.
 * These exports don't depend on Node.js-only modules.
 */

// Zod schemas (browser-safe)
export {
  ZInviteUser,
  ZAddRole,
  ZRemoveRole,
  ZGrantPerm,
  ZAddRoleBody,
  ZGrantPermBody,
  ZRemoveRoleBody,
  ZRevokePermBody,
  ZUsername,
  ZPhoneE164,
  ZUserCreate,
  ZUserUpdate,
  ZTenantCreate,
  ZMeOut,
} from './domain/schemas';

// Domain types (browser-safe)
export * from './domain/types';

// Constants (browser-safe)
export { IDENTITY_EVENTS, IDENTITY_DEFAULTS } from './domain/constants';
