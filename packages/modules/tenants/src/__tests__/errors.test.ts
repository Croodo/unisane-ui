/**
 * Tenant Errors Tests
 *
 * Tests for domain error classes in the tenants module.
 */

import { describe, it, expect } from 'vitest';
import { ErrorCode } from '@unisane/kernel';
import {
  TenantNotFoundError,
  TenantSlugConflictError,
  TenantAccessDeniedError,
  TenantHasActiveSubscriptionError,
  MembershipNotFoundError,
  LastOwnerError,
  InvitationExpiredError,
  InvitationNotFoundError,
  MemberAlreadyExistsError,
  TenantLimitReachedError,
  RoleNotFoundError,
} from '../domain/errors';

describe('TenantNotFoundError', () => {
  it('should have correct error properties with default field', () => {
    const error = new TenantNotFoundError('tenant_123');

    expect(error.name).toBe('TenantNotFoundError');
    expect(error.message).toBe('Tenant not found by id: tenant_123');
    expect(error.code).toBe(ErrorCode.TENANT_NOT_FOUND);
    expect(error.status).toBe(404);
  });

  it('should create error for slug lookup', () => {
    const error = new TenantNotFoundError('acme-corp', 'slug');

    expect(error.message).toBe('Tenant not found by slug: acme-corp');
    expect(error.code).toBe(ErrorCode.TENANT_NOT_FOUND);
    expect(error.status).toBe(404);
  });

  it('should be an instance of Error', () => {
    const error = new TenantNotFoundError('tenant_123');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('TenantSlugConflictError', () => {
  it('should have correct error properties', () => {
    const error = new TenantSlugConflictError('acme-corp');

    expect(error.name).toBe('TenantSlugConflictError');
    expect(error.message).toBe("Tenant with slug 'acme-corp' already exists");
    expect(error.code).toBe(ErrorCode.SLUG_TAKEN);
    expect(error.status).toBe(409);
  });

  it('should be an instance of Error', () => {
    const error = new TenantSlugConflictError('acme');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('TenantAccessDeniedError', () => {
  it('should have correct error properties', () => {
    const error = new TenantAccessDeniedError('tenant_456');

    expect(error.name).toBe('TenantAccessDeniedError');
    expect(error.message).toBe('Access denied to tenant: tenant_456');
    expect(error.code).toBe(ErrorCode.PERMISSION_DENIED);
    expect(error.status).toBe(403);
  });

  it('should be an instance of Error', () => {
    const error = new TenantAccessDeniedError('tenant_123');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('TenantHasActiveSubscriptionError', () => {
  it('should have correct error properties', () => {
    const error = new TenantHasActiveSubscriptionError('tenant_789');

    expect(error.name).toBe('TenantHasActiveSubscriptionError');
    expect(error.message).toBe(
      'Cannot delete tenant tenant_789: has active subscription. Cancel subscription first.'
    );
    expect(error.code).toBe(ErrorCode.PRECONDITION_FAILED);
    expect(error.status).toBe(412);
  });

  it('should be an instance of Error', () => {
    const error = new TenantHasActiveSubscriptionError('tenant_123');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('MembershipNotFoundError', () => {
  it('should have correct error properties', () => {
    const error = new MembershipNotFoundError('tenant_123', 'user_456');

    expect(error.name).toBe('MembershipNotFoundError');
    expect(error.message).toBe('Membership not found for user user_456 in tenant tenant_123');
    expect(error.code).toBe(ErrorCode.MEMBER_NOT_FOUND);
    expect(error.status).toBe(404);
  });

  it('should be an instance of Error', () => {
    const error = new MembershipNotFoundError('t', 'u');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('LastOwnerError', () => {
  it('should have correct error properties', () => {
    const error = new LastOwnerError('tenant_abc');

    expect(error.name).toBe('LastOwnerError');
    expect(error.message).toBe('Cannot remove the last owner of tenant tenant_abc');
    expect(error.code).toBe(ErrorCode.LAST_OWNER);
    expect(error.status).toBe(400);
  });

  it('should be an instance of Error', () => {
    const error = new LastOwnerError('tenant_123');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('InvitationExpiredError', () => {
  it('should have correct error properties', () => {
    const error = new InvitationExpiredError('inv_123');

    expect(error.name).toBe('InvitationExpiredError');
    expect(error.message).toBe('Invitation inv_123 has expired');
    expect(error.code).toBe(ErrorCode.INVITATION_EXPIRED);
    expect(error.status).toBe(410);
  });

  it('should be an instance of Error', () => {
    const error = new InvitationExpiredError('inv');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('InvitationNotFoundError', () => {
  it('should have correct error properties', () => {
    const error = new InvitationNotFoundError('inv_456');

    expect(error.name).toBe('InvitationNotFoundError');
    expect(error.message).toBe('Invitation not found: inv_456');
    expect(error.code).toBe(ErrorCode.INVITATION_NOT_FOUND);
    expect(error.status).toBe(404);
  });

  it('should be an instance of Error', () => {
    const error = new InvitationNotFoundError('inv');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('MemberAlreadyExistsError', () => {
  it('should have correct error properties', () => {
    const error = new MemberAlreadyExistsError('tenant_123', 'user_789');

    expect(error.name).toBe('MemberAlreadyExistsError');
    expect(error.message).toBe('User user_789 is already a member of tenant tenant_123');
    expect(error.code).toBe(ErrorCode.MEMBER_EXISTS);
    expect(error.status).toBe(409);
  });

  it('should be an instance of Error', () => {
    const error = new MemberAlreadyExistsError('t', 'u');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('TenantLimitReachedError', () => {
  it('should have correct error properties', () => {
    const error = new TenantLimitReachedError(10);

    expect(error.name).toBe('TenantLimitReachedError');
    expect(error.message).toBe('Tenant limit reached. Maximum allowed: 10');
    expect(error.code).toBe(ErrorCode.TENANT_LIMIT);
    expect(error.status).toBe(403);
  });

  it('should accept different limit values', () => {
    const limits = [1, 5, 50, 100];

    for (const limit of limits) {
      const error = new TenantLimitReachedError(limit);
      expect(error.message).toBe(`Tenant limit reached. Maximum allowed: ${limit}`);
    }
  });

  it('should be an instance of Error', () => {
    const error = new TenantLimitReachedError(5);

    expect(error).toBeInstanceOf(Error);
  });
});

describe('RoleNotFoundError', () => {
  it('should have correct error properties', () => {
    const error = new RoleNotFoundError('superuser');

    expect(error.name).toBe('RoleNotFoundError');
    expect(error.message).toBe('Role not found: superuser');
    expect(error.code).toBe(ErrorCode.ROLE_NOT_FOUND);
    expect(error.status).toBe(404);
  });

  it('should be an instance of Error', () => {
    const error = new RoleNotFoundError('admin');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('Error HTTP Status Codes', () => {
  it('should use 404 for not found errors', () => {
    expect(new TenantNotFoundError('x').status).toBe(404);
    expect(new MembershipNotFoundError('t', 'u').status).toBe(404);
    expect(new InvitationNotFoundError('i').status).toBe(404);
    expect(new RoleNotFoundError('r').status).toBe(404);
  });

  it('should use 409 for conflict errors', () => {
    expect(new TenantSlugConflictError('s').status).toBe(409);
    expect(new MemberAlreadyExistsError('t', 'u').status).toBe(409);
  });

  it('should use 403 for access denied errors', () => {
    expect(new TenantAccessDeniedError('t').status).toBe(403);
    expect(new TenantLimitReachedError(1).status).toBe(403);
  });

  it('should use 410 for gone/expired errors', () => {
    expect(new InvitationExpiredError('i').status).toBe(410);
  });

  it('should use 412 for precondition failures', () => {
    expect(new TenantHasActiveSubscriptionError('t').status).toBe(412);
  });

  it('should use 400 for bad request errors', () => {
    expect(new LastOwnerError('t').status).toBe(400);
  });
});
