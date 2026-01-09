/**
 * Tenant Domain Errors
 *
 * Module-specific error classes using E4xxx error codes.
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

/**
 * Thrown when a tenant is not found by ID or slug.
 */
export class TenantNotFoundError extends DomainError {
  readonly code = ErrorCode.TENANT_NOT_FOUND;
  readonly status = 404;

  constructor(identifier: string, byField: 'id' | 'slug' = 'id') {
    super(`Tenant not found by ${byField}: ${identifier}`);
    this.name = 'TenantNotFoundError';
  }
}

/**
 * Thrown when attempting to create a tenant with a slug that already exists.
 */
export class TenantSlugConflictError extends DomainError {
  readonly code = ErrorCode.SLUG_TAKEN;
  readonly status = 409;

  constructor(slug: string) {
    super(`Tenant with slug '${slug}' already exists`);
    this.name = 'TenantSlugConflictError';
  }
}

/**
 * Thrown when a user attempts to access a tenant they don't belong to.
 */
export class TenantAccessDeniedError extends DomainError {
  readonly code = ErrorCode.PERMISSION_DENIED;
  readonly status = 403;

  constructor(tenantId: string) {
    super(`Access denied to tenant: ${tenantId}`);
    this.name = 'TenantAccessDeniedError';
  }
}

/**
 * Thrown when attempting to delete a tenant that has active subscriptions.
 */
export class TenantHasActiveSubscriptionError extends DomainError {
  readonly code = ErrorCode.PRECONDITION_FAILED;
  readonly status = 412;

  constructor(tenantId: string) {
    super(`Cannot delete tenant ${tenantId}: has active subscription. Cancel subscription first.`);
    this.name = 'TenantHasActiveSubscriptionError';
  }
}

/**
 * Thrown when a membership operation fails.
 */
export class MembershipNotFoundError extends DomainError {
  readonly code = ErrorCode.MEMBER_NOT_FOUND;
  readonly status = 404;

  constructor(tenantId: string, userId: string) {
    super(`Membership not found for user ${userId} in tenant ${tenantId}`);
    this.name = 'MembershipNotFoundError';
  }
}

/**
 * Thrown when attempting to remove the last owner of a tenant.
 */
export class LastOwnerError extends DomainError {
  readonly code = ErrorCode.LAST_OWNER;
  readonly status = 400;

  constructor(tenantId: string) {
    super(`Cannot remove the last owner of tenant ${tenantId}`);
    this.name = 'LastOwnerError';
  }
}

/**
 * Thrown when an invitation has expired.
 */
export class InvitationExpiredError extends DomainError {
  readonly code = ErrorCode.INVITATION_EXPIRED;
  readonly status = 410;

  constructor(invitationId: string) {
    super(`Invitation ${invitationId} has expired`);
    this.name = 'InvitationExpiredError';
  }
}

/**
 * Thrown when an invitation is not found.
 */
export class InvitationNotFoundError extends DomainError {
  readonly code = ErrorCode.INVITATION_NOT_FOUND;
  readonly status = 404;

  constructor(invitationId: string) {
    super(`Invitation not found: ${invitationId}`);
    this.name = 'InvitationNotFoundError';
  }
}

/**
 * Thrown when a member already exists in the tenant.
 */
export class MemberAlreadyExistsError extends DomainError {
  readonly code = ErrorCode.MEMBER_EXISTS;
  readonly status = 409;

  constructor(tenantId: string, userId: string) {
    super(`User ${userId} is already a member of tenant ${tenantId}`);
    this.name = 'MemberAlreadyExistsError';
  }
}

/**
 * Thrown when tenant creation limit is reached.
 */
export class TenantLimitReachedError extends DomainError {
  readonly code = ErrorCode.TENANT_LIMIT;
  readonly status = 403;

  constructor(limit: number) {
    super(`Tenant limit reached. Maximum allowed: ${limit}`);
    this.name = 'TenantLimitReachedError';
  }
}

/**
 * Thrown when a role is not found.
 */
export class RoleNotFoundError extends DomainError {
  readonly code = ErrorCode.ROLE_NOT_FOUND;
  readonly status = 404;

  constructor(role: string) {
    super(`Role not found: ${role}`);
    this.name = 'RoleNotFoundError';
  }
}
