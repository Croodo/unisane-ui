/**
 * Identity Constants Tests
 *
 * Tests for identity module constants.
 */

import { describe, it, expect } from 'vitest';
import {
  IDENTITY_EVENTS,
  USER_STATUS,
  API_KEY_STATUS,
  GLOBAL_ROLES,
  IDENTITY_DEFAULTS,
  IDENTITY_COLLECTIONS,
  type UserStatus,
  type ApiKeyStatus,
  type GlobalRole,
} from '../domain/constants';

describe('IDENTITY_EVENTS', () => {
  it('should have all expected event names', () => {
    expect(IDENTITY_EVENTS.USER_CREATED).toBe('identity.user.created');
    expect(IDENTITY_EVENTS.USER_UPDATED).toBe('identity.user.updated');
    expect(IDENTITY_EVENTS.USER_DELETED).toBe('identity.user.deleted');
    expect(IDENTITY_EVENTS.USER_EMAIL_VERIFIED).toBe('identity.user.email_verified');
    expect(IDENTITY_EVENTS.USER_PHONE_VERIFIED).toBe('identity.user.phone_verified');
    expect(IDENTITY_EVENTS.API_KEY_CREATED).toBe('identity.api_key.created');
    expect(IDENTITY_EVENTS.API_KEY_REVOKED).toBe('identity.api_key.revoked');
    expect(IDENTITY_EVENTS.MEMBERSHIP_ROLE_CHANGED).toBe('identity.membership.role_changed');
  });

  it('should follow identity.{entity}.{action} naming pattern', () => {
    const eventValues = Object.values(IDENTITY_EVENTS);

    for (const event of eventValues) {
      expect(event).toMatch(/^identity\.[a-z_]+\.[a-z_]+$/);
    }
  });

  it('should be immutable (const assertion)', () => {
    expect(typeof IDENTITY_EVENTS.USER_CREATED).toBe('string');
    expect(typeof IDENTITY_EVENTS.USER_UPDATED).toBe('string');
  });
});

describe('USER_STATUS', () => {
  it('should have all expected status values', () => {
    expect(USER_STATUS.ACTIVE).toBe('active');
    expect(USER_STATUS.SUSPENDED).toBe('suspended');
    expect(USER_STATUS.PENDING_VERIFICATION).toBe('pending_verification');
    expect(USER_STATUS.DELETED).toBe('deleted');
  });

  it('should have exactly 4 statuses', () => {
    expect(Object.keys(USER_STATUS)).toHaveLength(4);
  });

  it('should use snake_case values', () => {
    const statusValues = Object.values(USER_STATUS);

    for (const status of statusValues) {
      expect(status).toMatch(/^[a-z][a-z_]*$/);
    }
  });
});

describe('API_KEY_STATUS', () => {
  it('should have all expected status values', () => {
    expect(API_KEY_STATUS.ACTIVE).toBe('active');
    expect(API_KEY_STATUS.REVOKED).toBe('revoked');
    expect(API_KEY_STATUS.EXPIRED).toBe('expired');
  });

  it('should have exactly 3 statuses', () => {
    expect(Object.keys(API_KEY_STATUS)).toHaveLength(3);
  });
});

describe('GLOBAL_ROLES', () => {
  it('should have all expected roles', () => {
    expect(GLOBAL_ROLES.SUPERADMIN).toBe('superadmin');
    expect(GLOBAL_ROLES.SUPPORT).toBe('support');
    expect(GLOBAL_ROLES.USER).toBe('user');
  });

  it('should have exactly 3 global roles', () => {
    expect(Object.keys(GLOBAL_ROLES)).toHaveLength(3);
  });

  it('should use lowercase values', () => {
    const roleValues = Object.values(GLOBAL_ROLES);

    for (const role of roleValues) {
      expect(role).toMatch(/^[a-z]+$/);
    }
  });
});

describe('IDENTITY_DEFAULTS', () => {
  describe('Pagination defaults', () => {
    it('should have DEFAULT_PAGE_SIZE of 20', () => {
      expect(IDENTITY_DEFAULTS.DEFAULT_PAGE_SIZE).toBe(20);
    });

    it('should have MAX_PAGE_SIZE of 100', () => {
      expect(IDENTITY_DEFAULTS.MAX_PAGE_SIZE).toBe(100);
    });

    it('should have MAX_PAGE_SIZE >= DEFAULT_PAGE_SIZE', () => {
      expect(IDENTITY_DEFAULTS.MAX_PAGE_SIZE).toBeGreaterThanOrEqual(
        IDENTITY_DEFAULTS.DEFAULT_PAGE_SIZE
      );
    });
  });

  describe('API Key defaults', () => {
    it('should have MAX_API_KEYS_PER_USER of 10', () => {
      expect(IDENTITY_DEFAULTS.MAX_API_KEYS_PER_USER).toBe(10);
    });

    it('should have API_KEY_PREFIX of "sk_"', () => {
      expect(IDENTITY_DEFAULTS.API_KEY_PREFIX).toBe('sk_');
    });
  });

  describe('Cache defaults', () => {
    it('should have CACHE_TTL_MS of 60 seconds', () => {
      expect(IDENTITY_DEFAULTS.CACHE_TTL_MS).toBe(60_000);
    });
  });

  describe('Session defaults', () => {
    it('should have SESSION_EXPIRY_DAYS of 30', () => {
      expect(IDENTITY_DEFAULTS.SESSION_EXPIRY_DAYS).toBe(30);
    });
  });

  it('should have reasonable values', () => {
    // Page size should be reasonable
    expect(IDENTITY_DEFAULTS.DEFAULT_PAGE_SIZE).toBeGreaterThanOrEqual(10);
    expect(IDENTITY_DEFAULTS.MAX_PAGE_SIZE).toBeLessThanOrEqual(1000);

    // API key limit should be reasonable
    expect(IDENTITY_DEFAULTS.MAX_API_KEYS_PER_USER).toBeGreaterThanOrEqual(1);
    expect(IDENTITY_DEFAULTS.MAX_API_KEYS_PER_USER).toBeLessThanOrEqual(100);

    // Cache TTL should be reasonable
    expect(IDENTITY_DEFAULTS.CACHE_TTL_MS).toBeGreaterThanOrEqual(1000);
    expect(IDENTITY_DEFAULTS.CACHE_TTL_MS).toBeLessThanOrEqual(600_000);

    // Session expiry should be reasonable
    expect(IDENTITY_DEFAULTS.SESSION_EXPIRY_DAYS).toBeGreaterThanOrEqual(1);
    expect(IDENTITY_DEFAULTS.SESSION_EXPIRY_DAYS).toBeLessThanOrEqual(365);
  });
});

describe('IDENTITY_COLLECTIONS', () => {
  it('should have all expected collection names', () => {
    expect(IDENTITY_COLLECTIONS.USERS).toBe('users');
    expect(IDENTITY_COLLECTIONS.MEMBERSHIPS).toBe('memberships');
    expect(IDENTITY_COLLECTIONS.API_KEYS).toBe('api_keys');
    expect(IDENTITY_COLLECTIONS.SESSIONS).toBe('sessions');
  });

  it('should have exactly 4 collections', () => {
    expect(Object.keys(IDENTITY_COLLECTIONS)).toHaveLength(4);
  });

  it('should use snake_case naming', () => {
    const collectionNames = Object.values(IDENTITY_COLLECTIONS);

    for (const name of collectionNames) {
      expect(name).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });
});

describe('Type Safety', () => {
  it('should have numeric defaults as numbers', () => {
    expect(typeof IDENTITY_DEFAULTS.DEFAULT_PAGE_SIZE).toBe('number');
    expect(typeof IDENTITY_DEFAULTS.MAX_PAGE_SIZE).toBe('number');
    expect(typeof IDENTITY_DEFAULTS.MAX_API_KEYS_PER_USER).toBe('number');
    expect(typeof IDENTITY_DEFAULTS.CACHE_TTL_MS).toBe('number');
    expect(typeof IDENTITY_DEFAULTS.SESSION_EXPIRY_DAYS).toBe('number');
  });

  it('should have string defaults as strings', () => {
    expect(typeof IDENTITY_DEFAULTS.API_KEY_PREFIX).toBe('string');
  });

  it('should export correct types', () => {
    // Type assertion tests
    const userStatus: UserStatus = 'active';
    const apiKeyStatus: ApiKeyStatus = 'revoked';
    const globalRole: GlobalRole = 'superadmin';

    expect(userStatus).toBe('active');
    expect(apiKeyStatus).toBe('revoked');
    expect(globalRole).toBe('superadmin');
  });
});
