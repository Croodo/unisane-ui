/**
 * Tenant Domain Errors
 *
 * Module-specific error classes that extend the kernel's DomainError.
 * These provide type-safe error handling with consistent error codes.
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

/**
 * Thrown when a tenant is not found by ID or slug.
 */
export class TenantNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
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
  readonly code = ErrorCode.CONFLICT;
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
  readonly code = ErrorCode.FORBIDDEN;
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
  readonly code = ErrorCode.NOT_FOUND;
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
  readonly code = ErrorCode.PRECONDITION_FAILED;
  readonly status = 412;

  constructor(tenantId: string) {
    super(`Cannot remove the last owner of tenant ${tenantId}`);
    this.name = 'LastOwnerError';
  }
}

/**
 * Thrown when an invitation has expired.
 */
export class InvitationExpiredError extends DomainError {
  readonly code = ErrorCode.GONE;
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
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(invitationId: string) {
    super(`Invitation not found: ${invitationId}`);
    this.name = 'InvitationNotFoundError';
  }
}
