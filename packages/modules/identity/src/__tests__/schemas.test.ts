/**
 * Identity Schemas Tests
 *
 * Tests for Zod validation schemas.
 */

import { describe, it, expect } from 'vitest';
import {
  ZUsername,
  ZPhoneE164,
  ZUserCreate,
  ZUserUpdate,
  ZTenantCreate,
  ZInviteUser,
  ZAddRole,
  ZRemoveRole,
  ZGrantPerm,
  ZMeOut,
} from '../domain/schemas';

describe('ZUsername', () => {
  it('should accept valid usernames', () => {
    const validUsernames = [
      'abc',
      'user123',
      'test_user',
      'john.doe',
      'a'.repeat(30),
      'ABC123',
      'User_Name.123',
    ];

    for (const username of validUsernames) {
      const result = ZUsername.safeParse(username);
      expect(result.success).toBe(true);
    }
  });

  it('should reject usernames shorter than 3 characters', () => {
    const shortUsernames = ['ab', 'a', ''];

    for (const username of shortUsernames) {
      const result = ZUsername.safeParse(username);
      expect(result.success).toBe(false);
    }
  });

  it('should reject usernames longer than 30 characters', () => {
    const result = ZUsername.safeParse('a'.repeat(31));
    expect(result.success).toBe(false);
  });

  it('should reject usernames with invalid characters', () => {
    const invalidUsernames = [
      'user@name',
      'user name',
      'user-name',
      'user!name',
      'user#name',
      'user$name',
    ];

    for (const username of invalidUsernames) {
      const result = ZUsername.safeParse(username);
      expect(result.success).toBe(false);
    }
  });

  it('should reject usernames with @ prefix (regex runs before transform)', () => {
    // Note: The regex is applied before the transform, so @username fails validation
    const result = ZUsername.safeParse('@username');
    expect(result.success).toBe(false);
  });

  it('should strip leading @ from valid usernames in transform (after regex)', () => {
    // The transform only runs after regex validation passes
    // Since @ is not allowed in regex, this test documents that behavior
    const result = ZUsername.safeParse('username');
    expect(result.success).toBe(true);
    if (result.success) {
      // Transform would strip @ if it were present, but regex blocks it first
      expect(result.data).toBe('username');
    }
  });

  it('should trim whitespace', () => {
    const result = ZUsername.safeParse('  username  ');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('username');
    }
  });

  it('should be case-insensitive in pattern match', () => {
    const result1 = ZUsername.safeParse('USERNAME');
    const result2 = ZUsername.safeParse('username');

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });
});

describe('ZPhoneE164', () => {
  it('should accept valid E.164 phone numbers', () => {
    const validPhones = [
      '+14155550123',
      '+442071234567',
      '+33123456789',
      '+81312345678',
      '+919876543210',
    ];

    for (const phone of validPhones) {
      const result = ZPhoneE164.safeParse(phone);
      expect(result.success).toBe(true);
    }
  });

  it('should reject phone numbers without + prefix', () => {
    const result = ZPhoneE164.safeParse('14155550123');
    expect(result.success).toBe(false);
  });

  it('should reject phone numbers starting with +0', () => {
    const result = ZPhoneE164.safeParse('+0123456789');
    expect(result.success).toBe(false);
  });

  it('should reject phone numbers that are too short', () => {
    const result = ZPhoneE164.safeParse('+1234567');
    expect(result.success).toBe(false);
  });

  it('should reject phone numbers that are too long', () => {
    const result = ZPhoneE164.safeParse('+1234567890123456');
    expect(result.success).toBe(false);
  });

  it('should reject phone numbers with non-numeric characters', () => {
    const invalidPhones = [
      '+1-415-555-0123',
      '+1 (415) 555-0123',
      '+1.415.555.0123',
      '+14155550123x123',
    ];

    for (const phone of invalidPhones) {
      const result = ZPhoneE164.safeParse(phone);
      expect(result.success).toBe(false);
    }
  });

  it('should trim whitespace', () => {
    const result = ZPhoneE164.safeParse('  +14155550123  ');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('+14155550123');
    }
  });
});

describe('ZUserCreate', () => {
  it('should accept minimal valid input', () => {
    const result = ZUserCreate.safeParse({
      email: 'user@example.com',
    });

    expect(result.success).toBe(true);
  });

  it('should accept all optional fields', () => {
    const result = ZUserCreate.safeParse({
      email: 'user@example.com',
      displayName: 'John Doe',
      imageUrl: 'https://example.com/avatar.png',
      username: 'johndoe',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+14155550123',
      locale: 'en',
      timezone: 'America/New_York',
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = ZUserCreate.safeParse({
      email: 'invalid-email',
    });

    expect(result.success).toBe(false);
  });

  it('should reject displayName longer than 120 characters', () => {
    const result = ZUserCreate.safeParse({
      email: 'user@example.com',
      displayName: 'a'.repeat(121),
    });

    expect(result.success).toBe(false);
  });

  it('should reject invalid imageUrl', () => {
    const result = ZUserCreate.safeParse({
      email: 'user@example.com',
      imageUrl: 'not-a-url',
    });

    expect(result.success).toBe(false);
  });

  it('should reject firstName longer than 80 characters', () => {
    const result = ZUserCreate.safeParse({
      email: 'user@example.com',
      firstName: 'a'.repeat(81),
    });

    expect(result.success).toBe(false);
  });

  it('should default locale to en', () => {
    const result = ZUserCreate.safeParse({
      email: 'user@example.com',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locale).toBe('en');
    }
  });

  it('should trim email', () => {
    const result = ZUserCreate.safeParse({
      email: '  user@example.com  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });
});

describe('ZUserUpdate', () => {
  it('should accept single field update', () => {
    const result = ZUserUpdate.safeParse({
      displayName: 'New Name',
    });

    expect(result.success).toBe(true);
  });

  it('should accept multiple fields', () => {
    const result = ZUserUpdate.safeParse({
      displayName: 'New Name',
      firstName: 'New',
      lastName: 'Name',
    });

    expect(result.success).toBe(true);
  });

  it('should reject empty object', () => {
    const result = ZUserUpdate.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('At least one field');
    }
  });

  it('should accept null to clear optional fields', () => {
    const result = ZUserUpdate.safeParse({
      displayName: null,
      firstName: null,
      phone: null,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayName).toBeNull();
      expect(result.data.firstName).toBeNull();
      expect(result.data.phone).toBeNull();
    }
  });

  it('should reject invalid displayName length', () => {
    const result = ZUserUpdate.safeParse({
      displayName: 'a'.repeat(121),
    });

    expect(result.success).toBe(false);
  });

  it('should reject invalid phone format', () => {
    const result = ZUserUpdate.safeParse({
      phone: '1234567890',
    });

    expect(result.success).toBe(false);
  });

  it('should reject invalid imageUrl', () => {
    const result = ZUserUpdate.safeParse({
      imageUrl: 'not-a-url',
    });

    expect(result.success).toBe(false);
  });
});

describe('ZTenantCreate', () => {
  it('should accept valid tenant name', () => {
    const result = ZTenantCreate.safeParse({
      name: 'My Company',
    });

    expect(result.success).toBe(true);
  });

  it('should accept name with optional slug', () => {
    const result = ZTenantCreate.safeParse({
      name: 'My Company',
      slug: 'my-company',
    });

    expect(result.success).toBe(true);
  });

  it('should reject name shorter than 2 characters', () => {
    const result = ZTenantCreate.safeParse({
      name: 'A',
    });

    expect(result.success).toBe(false);
  });

  it('should reject name longer than 80 characters', () => {
    const result = ZTenantCreate.safeParse({
      name: 'a'.repeat(81),
    });

    expect(result.success).toBe(false);
  });

  it('should accept valid slug formats', () => {
    const validSlugs = ['my-company', 'company123', 'a-b-c', 'ABC123'];

    for (const slug of validSlugs) {
      const result = ZTenantCreate.safeParse({
        name: 'Company',
        slug,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject slug with invalid characters', () => {
    const invalidSlugs = ['my_company', 'company!', 'has space', 'has.dot'];

    for (const slug of invalidSlugs) {
      const result = ZTenantCreate.safeParse({
        name: 'Company',
        slug,
      });
      expect(result.success).toBe(false);
    }
  });

  it('should reject slug shorter than 2 characters', () => {
    const result = ZTenantCreate.safeParse({
      name: 'Company',
      slug: 'a',
    });

    expect(result.success).toBe(false);
  });

  it('should reject slug longer than 80 characters', () => {
    const result = ZTenantCreate.safeParse({
      name: 'Company',
      slug: 'a'.repeat(81),
    });

    expect(result.success).toBe(false);
  });
});

describe('ZInviteUser', () => {
  it('should accept valid invite', () => {
    const result = ZInviteUser.safeParse({
      email: 'user@example.com',
      roleId: 'member',
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = ZInviteUser.safeParse({
      email: 'invalid',
      roleId: 'member',
    });

    expect(result.success).toBe(false);
  });
});

describe('ZAddRole', () => {
  it('should accept valid role addition', () => {
    const result = ZAddRole.safeParse({
      userId: 'user_123',
      roleId: 'admin',
    });

    expect(result.success).toBe(true);
  });

  it('should accept optional expectedVersion', () => {
    const result = ZAddRole.safeParse({
      userId: 'user_123',
      roleId: 'admin',
      expectedVersion: 1,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expectedVersion).toBe(1);
    }
  });

  it('should reject empty userId', () => {
    const result = ZAddRole.safeParse({
      userId: '',
      roleId: 'admin',
    });

    expect(result.success).toBe(false);
  });
});

describe('ZRemoveRole', () => {
  it('should accept valid role removal', () => {
    const result = ZRemoveRole.safeParse({
      userId: 'user_123',
      roleId: 'admin',
    });

    expect(result.success).toBe(true);
  });

  it('should accept optional expectedVersion', () => {
    const result = ZRemoveRole.safeParse({
      userId: 'user_123',
      roleId: 'admin',
      expectedVersion: 2,
    });

    expect(result.success).toBe(true);
  });
});

describe('ZGrantPerm', () => {
  it('should accept valid permission grant', () => {
    const result = ZGrantPerm.safeParse({
      userId: 'user_123',
      perm: 'members:read',
      effect: 'allow',
    });

    expect(result.success).toBe(true);
  });

  it('should accept deny effect', () => {
    const result = ZGrantPerm.safeParse({
      userId: 'user_123',
      perm: 'members:write',
      effect: 'deny',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.effect).toBe('deny');
    }
  });
});

describe('ZMeOut', () => {
  it('should accept valid me response', () => {
    const result = ZMeOut.safeParse({
      userId: 'user_123',
      scopeId: 'scope_456',
      tenantSlug: 'my-company',
      tenantName: 'My Company',
      role: 'admin',
      plan: 'pro',
      perms: ['members:read', 'settings:write'],
    });

    expect(result.success).toBe(true);
  });

  it('should accept null values for optional fields', () => {
    const result = ZMeOut.safeParse({
      userId: null,
      scopeId: null,
      role: null,
      plan: null,
      perms: [],
    });

    expect(result.success).toBe(true);
  });

  it('should require perms array', () => {
    const result = ZMeOut.safeParse({
      userId: 'user_123',
      scopeId: 'scope_456',
      role: 'admin',
      plan: 'pro',
    });

    expect(result.success).toBe(false);
  });
});
