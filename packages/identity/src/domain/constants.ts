/**
 * Identity Domain Constants
 *
 * Centralized constants for the identity module.
 */

/**
 * Event types emitted by the identity module.
 */
export const IDENTITY_EVENTS = {
  /** Emitted when a new user is created */
  USER_CREATED: 'identity.user.created',
  /** Emitted when a user is updated */
  USER_UPDATED: 'identity.user.updated',
  /** Emitted when a user is deleted (soft delete) */
  USER_DELETED: 'identity.user.deleted',
  /** Emitted when a user's email is verified */
  USER_EMAIL_VERIFIED: 'identity.user.email_verified',
  /** Emitted when a user's phone is verified */
  USER_PHONE_VERIFIED: 'identity.user.phone_verified',
  /** Emitted when an API key is created */
  API_KEY_CREATED: 'identity.api_key.created',
  /** Emitted when an API key is revoked */
  API_KEY_REVOKED: 'identity.api_key.revoked',
  /** Emitted when a membership role is changed */
  MEMBERSHIP_ROLE_CHANGED: 'identity.membership.role_changed',
} as const;

/**
 * User status values.
 */
export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  PENDING_VERIFICATION: 'pending_verification',
  DELETED: 'deleted',
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

/**
 * API key status values.
 */
export const API_KEY_STATUS = {
  ACTIVE: 'active',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
} as const;

export type ApiKeyStatus = (typeof API_KEY_STATUS)[keyof typeof API_KEY_STATUS];

/**
 * Global roles (platform-level, not tenant-scoped).
 */
export const GLOBAL_ROLES = {
  SUPERADMIN: 'superadmin',
  SUPPORT: 'support',
  USER: 'user',
} as const;

export type GlobalRole = (typeof GLOBAL_ROLES)[keyof typeof GLOBAL_ROLES];

/**
 * Default values for identity operations.
 */
export const IDENTITY_DEFAULTS = {
  /** Default pagination limit */
  DEFAULT_PAGE_SIZE: 20,
  /** Maximum pagination limit */
  MAX_PAGE_SIZE: 100,
  /** Maximum API keys per user per tenant */
  MAX_API_KEYS_PER_USER: 10,
  /** API key prefix for identification */
  API_KEY_PREFIX: 'sk_',
  /** Cache TTL for user lookups in milliseconds */
  CACHE_TTL_MS: 60_000, // 60 seconds
  /** Session expiry in days */
  SESSION_EXPIRY_DAYS: 30,
} as const;

/**
 * Collection names for the identity module.
 */
export const IDENTITY_COLLECTIONS = {
  USERS: 'users',
  MEMBERSHIPS: 'memberships',
  API_KEYS: 'api_keys',
  SESSIONS: 'sessions',
} as const;
