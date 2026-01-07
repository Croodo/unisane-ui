/**
 * Tenant Domain Constants
 *
 * Centralized constants for the tenants module.
 * Eliminates magic values scattered throughout the codebase.
 */

/**
 * Event types emitted by the tenants module.
 * Use these when calling events.emit() to ensure type safety.
 */
export const TENANT_EVENTS = {
  /** Emitted when a new tenant is created */
  CREATED: 'tenant.created',
  /** Emitted when a tenant is updated */
  UPDATED: 'tenant.updated',
  /** Emitted when a tenant is deleted (soft delete) */
  DELETED: 'tenant.deleted',
  /** Emitted when a member joins a tenant */
  MEMBER_ADDED: 'tenant.member.added',
  /** Emitted when a member leaves or is removed from a tenant */
  MEMBER_REMOVED: 'tenant.member.removed',
  /** Emitted when a member's role is changed */
  MEMBER_ROLE_CHANGED: 'tenant.member.role_changed',
  /** Emitted when an invitation is created */
  INVITATION_CREATED: 'tenant.invitation.created',
  /** Emitted when an invitation is accepted */
  INVITATION_ACCEPTED: 'tenant.invitation.accepted',
  /** Emitted when an invitation is revoked */
  INVITATION_REVOKED: 'tenant.invitation.revoked',
} as const;

/**
 * Member roles within a tenant.
 */
export const TENANT_ROLES = {
  /** Full access to tenant, can manage billing and delete tenant */
  OWNER: 'owner',
  /** Can manage team members and most settings */
  ADMIN: 'admin',
  /** Standard member with limited permissions */
  MEMBER: 'member',
  /** Read-only access */
  VIEWER: 'viewer',
} as const;

export type TenantRole = (typeof TENANT_ROLES)[keyof typeof TENANT_ROLES];

/**
 * Invitation status values.
 */
export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
} as const;

export type InvitationStatus = (typeof INVITATION_STATUS)[keyof typeof INVITATION_STATUS];

/**
 * Default values for tenant operations.
 */
export const TENANT_DEFAULTS = {
  /** Default plan for new tenants */
  DEFAULT_PLAN_ID: 'free',
  /** Default pagination limit */
  DEFAULT_PAGE_SIZE: 20,
  /** Maximum pagination limit */
  MAX_PAGE_SIZE: 100,
  /** Invitation expiry in days */
  INVITATION_EXPIRY_DAYS: 7,
  /** Cache TTL for tenant lookups in milliseconds */
  CACHE_TTL_MS: 60_000, // 60 seconds
} as const;

/**
 * Collection names for the tenants module.
 */
export const TENANT_COLLECTIONS = {
  TENANTS: 'tenants',
  MEMBERSHIPS: 'memberships',
  INVITATIONS: 'invitations',
} as const;
