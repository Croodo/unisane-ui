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

// NOTE: Tenant roles are now defined in @unisane/kernel as ROLE.
// Import from kernel: import { ROLE, RoleId } from '@unisane/kernel';
// This module re-exports them as TENANT_ROLES/TenantRole for backward compatibility.
// See: packages/foundation/kernel/src/rbac/roles.ts

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
