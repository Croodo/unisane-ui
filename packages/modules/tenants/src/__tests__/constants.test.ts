/**
 * Tenant Constants Tests
 *
 * Tests for tenant module constants.
 */

import { describe, it, expect } from 'vitest';
import {
  TENANT_EVENTS,
  INVITATION_STATUS,
  TENANT_DEFAULTS,
  TENANT_COLLECTIONS,
  type InvitationStatus,
} from '../domain/constants';
// TENANT_ROLES is now sourced from @unisane/kernel (as ROLE)
// Import directly from kernel to avoid pulling in entire module (which requires DB config)
import { ROLE as TENANT_ROLES, type RoleId as TenantRole } from '@unisane/kernel';

describe('TENANT_EVENTS', () => {
  it('should have all expected event names', () => {
    expect(TENANT_EVENTS.CREATED).toBe('tenant.created');
    expect(TENANT_EVENTS.UPDATED).toBe('tenant.updated');
    expect(TENANT_EVENTS.DELETED).toBe('tenant.deleted');
    expect(TENANT_EVENTS.MEMBER_ADDED).toBe('tenant.member.added');
    expect(TENANT_EVENTS.MEMBER_REMOVED).toBe('tenant.member.removed');
    expect(TENANT_EVENTS.MEMBER_ROLE_CHANGED).toBe('tenant.member.role_changed');
    expect(TENANT_EVENTS.INVITATION_CREATED).toBe('tenant.invitation.created');
    expect(TENANT_EVENTS.INVITATION_ACCEPTED).toBe('tenant.invitation.accepted');
    expect(TENANT_EVENTS.INVITATION_REVOKED).toBe('tenant.invitation.revoked');
  });

  it('should have exactly 9 events', () => {
    expect(Object.keys(TENANT_EVENTS)).toHaveLength(9);
  });

  it('should follow tenant.{entity}.{action} naming pattern', () => {
    const eventValues = Object.values(TENANT_EVENTS);

    for (const event of eventValues) {
      expect(event).toMatch(/^tenant(\.[a-z_]+)+$/);
    }
  });

  it('should be immutable (const assertion)', () => {
    expect(typeof TENANT_EVENTS.CREATED).toBe('string');
    expect(typeof TENANT_EVENTS.UPDATED).toBe('string');
  });
});

describe('TENANT_ROLES', () => {
  // NOTE: TENANT_ROLES is now re-exported from @unisane/kernel's ROLE
  // Kernel roles: owner, admin, member, billing
  it('should have all expected roles from kernel', () => {
    expect(TENANT_ROLES.OWNER).toBe('owner');
    expect(TENANT_ROLES.ADMIN).toBe('admin');
    expect(TENANT_ROLES.MEMBER).toBe('member');
    expect(TENANT_ROLES.BILLING).toBe('billing');
  });

  it('should have exactly 4 roles', () => {
    expect(Object.keys(TENANT_ROLES)).toHaveLength(4);
  });

  it('should use lowercase values', () => {
    const roleValues = Object.values(TENANT_ROLES);

    for (const role of roleValues) {
      expect(role).toMatch(/^[a-z_]+$/);
    }
  });

  it('should have owner as the highest role', () => {
    // Verify owner exists - typically the first role in hierarchy
    expect(TENANT_ROLES.OWNER).toBeDefined();
    expect(TENANT_ROLES.OWNER).toBe('owner');
  });
});

describe('INVITATION_STATUS', () => {
  it('should have all expected statuses', () => {
    expect(INVITATION_STATUS.PENDING).toBe('pending');
    expect(INVITATION_STATUS.ACCEPTED).toBe('accepted');
    expect(INVITATION_STATUS.EXPIRED).toBe('expired');
    expect(INVITATION_STATUS.REVOKED).toBe('revoked');
  });

  it('should have exactly 4 statuses', () => {
    expect(Object.keys(INVITATION_STATUS)).toHaveLength(4);
  });

  it('should use lowercase values', () => {
    const statusValues = Object.values(INVITATION_STATUS);

    for (const status of statusValues) {
      expect(status).toMatch(/^[a-z]+$/);
    }
  });
});

describe('TENANT_DEFAULTS', () => {
  describe('Plan defaults', () => {
    it('should have DEFAULT_PLAN_ID of "free"', () => {
      expect(TENANT_DEFAULTS.DEFAULT_PLAN_ID).toBe('free');
    });
  });

  describe('Pagination defaults', () => {
    it('should have DEFAULT_PAGE_SIZE of 20', () => {
      expect(TENANT_DEFAULTS.DEFAULT_PAGE_SIZE).toBe(20);
    });

    it('should have MAX_PAGE_SIZE of 100', () => {
      expect(TENANT_DEFAULTS.MAX_PAGE_SIZE).toBe(100);
    });

    it('should have MAX_PAGE_SIZE >= DEFAULT_PAGE_SIZE', () => {
      expect(TENANT_DEFAULTS.MAX_PAGE_SIZE).toBeGreaterThanOrEqual(
        TENANT_DEFAULTS.DEFAULT_PAGE_SIZE
      );
    });
  });

  describe('Invitation defaults', () => {
    it('should have INVITATION_EXPIRY_DAYS of 7', () => {
      expect(TENANT_DEFAULTS.INVITATION_EXPIRY_DAYS).toBe(7);
    });
  });

  describe('Cache defaults', () => {
    it('should have CACHE_TTL_MS of 60 seconds', () => {
      expect(TENANT_DEFAULTS.CACHE_TTL_MS).toBe(60_000);
    });
  });

  it('should have reasonable values', () => {
    // Page size should be reasonable
    expect(TENANT_DEFAULTS.DEFAULT_PAGE_SIZE).toBeGreaterThanOrEqual(10);
    expect(TENANT_DEFAULTS.MAX_PAGE_SIZE).toBeLessThanOrEqual(1000);

    // Invitation expiry should be reasonable
    expect(TENANT_DEFAULTS.INVITATION_EXPIRY_DAYS).toBeGreaterThanOrEqual(1);
    expect(TENANT_DEFAULTS.INVITATION_EXPIRY_DAYS).toBeLessThanOrEqual(30);

    // Cache TTL should be reasonable
    expect(TENANT_DEFAULTS.CACHE_TTL_MS).toBeGreaterThanOrEqual(1000);
    expect(TENANT_DEFAULTS.CACHE_TTL_MS).toBeLessThanOrEqual(600_000);
  });
});

describe('TENANT_COLLECTIONS', () => {
  it('should have all expected collection names', () => {
    expect(TENANT_COLLECTIONS.TENANTS).toBe('tenants');
    expect(TENANT_COLLECTIONS.MEMBERSHIPS).toBe('memberships');
    expect(TENANT_COLLECTIONS.INVITATIONS).toBe('invitations');
  });

  it('should have exactly 3 collections', () => {
    expect(Object.keys(TENANT_COLLECTIONS)).toHaveLength(3);
  });

  it('should use snake_case naming', () => {
    const collectionNames = Object.values(TENANT_COLLECTIONS);

    for (const name of collectionNames) {
      expect(name).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });
});

describe('Type Safety', () => {
  it('should have string defaults as strings', () => {
    expect(typeof TENANT_DEFAULTS.DEFAULT_PLAN_ID).toBe('string');
  });

  it('should have numeric defaults as numbers', () => {
    expect(typeof TENANT_DEFAULTS.DEFAULT_PAGE_SIZE).toBe('number');
    expect(typeof TENANT_DEFAULTS.MAX_PAGE_SIZE).toBe('number');
    expect(typeof TENANT_DEFAULTS.INVITATION_EXPIRY_DAYS).toBe('number');
    expect(typeof TENANT_DEFAULTS.CACHE_TTL_MS).toBe('number');
  });

  it('should export correct TenantRole type', () => {
    const role: TenantRole = 'owner';
    expect(role).toBe('owner');

    const adminRole: TenantRole = 'admin';
    expect(adminRole).toBe('admin');
  });

  it('should export correct InvitationStatus type', () => {
    const status: InvitationStatus = 'pending';
    expect(status).toBe('pending');

    const acceptedStatus: InvitationStatus = 'accepted';
    expect(acceptedStatus).toBe('accepted');
  });
});
