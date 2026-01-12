/**
 * Auth Schemas Tests
 *
 * Tests for Zod validation schemas.
 */

import { describe, it, expect } from 'vitest';
import {
  ZPasswordSignup,
  ZPasswordSignin,
  ZOtpStart,
  ZOtpVerify,
  ZResetStart,
  ZResetVerify,
  ZTokenExchange,
  ZPhoneStart,
  ZPhoneVerify,
} from '../domain/schemas';

describe('ZPasswordSignup', () => {
  it('should accept valid signup data', () => {
    const result = ZPasswordSignup.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
  });

  it('should accept optional fields', () => {
    const result = ZPasswordSignup.safeParse({
      email: 'user@example.com',
      password: 'password123',
      displayName: 'John Doe',
      username: 'johndoe',
      firstName: 'John',
      lastName: 'Doe',
      locale: 'en-US',
      timezone: 'America/New_York',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayName).toBe('John Doe');
      expect(result.data.username).toBe('johndoe');
    }
  });

  it('should reject invalid email', () => {
    const result = ZPasswordSignup.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });

    expect(result.success).toBe(false);
  });

  it('should reject password shorter than 8 characters', () => {
    const result = ZPasswordSignup.safeParse({
      email: 'user@example.com',
      password: 'short',
    });

    expect(result.success).toBe(false);
  });

  it('should validate username format', () => {
    const validUsernames = ['john_doe', 'user123', 'test.user', 'ABC123'];
    const invalidUsernames = ['ab', 'a'.repeat(31), 'user@name', 'user name'];

    for (const username of validUsernames) {
      const result = ZPasswordSignup.safeParse({
        email: 'user@example.com',
        password: 'password123',
        username,
      });
      expect(result.success).toBe(true);
    }

    for (const username of invalidUsernames) {
      const result = ZPasswordSignup.safeParse({
        email: 'user@example.com',
        password: 'password123',
        username,
      });
      expect(result.success).toBe(false);
    }
  });

  it('should trim firstName and lastName', () => {
    const result = ZPasswordSignup.safeParse({
      email: 'user@example.com',
      password: 'password123',
      firstName: '  John  ',
      lastName: '  Doe  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBe('John');
      expect(result.data.lastName).toBe('Doe');
    }
  });

  it('should reject firstName longer than 80 characters', () => {
    const result = ZPasswordSignup.safeParse({
      email: 'user@example.com',
      password: 'password123',
      firstName: 'a'.repeat(81),
    });

    expect(result.success).toBe(false);
  });

  it('should default locale to en', () => {
    const result = ZPasswordSignup.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locale).toBe('en');
    }
  });
});

describe('ZPasswordSignin', () => {
  it('should accept valid signin data', () => {
    const result = ZPasswordSignin.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
  });

  it('should accept password of any length (min 1)', () => {
    const result = ZPasswordSignin.safeParse({
      email: 'user@example.com',
      password: 'x',
    });

    expect(result.success).toBe(true);
  });

  it('should reject empty password', () => {
    const result = ZPasswordSignin.safeParse({
      email: 'user@example.com',
      password: '',
    });

    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = ZPasswordSignin.safeParse({
      email: 'invalid',
      password: 'password123',
    });

    expect(result.success).toBe(false);
  });
});

describe('ZOtpStart', () => {
  it('should accept valid email', () => {
    const result = ZOtpStart.safeParse({
      email: 'user@example.com',
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = ZOtpStart.safeParse({
      email: 'not-an-email',
    });

    expect(result.success).toBe(false);
  });

  it('should reject missing email', () => {
    const result = ZOtpStart.safeParse({});

    expect(result.success).toBe(false);
  });
});

describe('ZOtpVerify', () => {
  it('should accept valid email and code', () => {
    const result = ZOtpVerify.safeParse({
      email: 'user@example.com',
      code: '123456',
    });

    expect(result.success).toBe(true);
  });

  it('should accept code between 4 and 8 characters', () => {
    const validCodes = ['1234', '12345', '123456', '1234567', '12345678'];

    for (const code of validCodes) {
      const result = ZOtpVerify.safeParse({
        email: 'user@example.com',
        code,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject code shorter than 4 characters', () => {
    const result = ZOtpVerify.safeParse({
      email: 'user@example.com',
      code: '123',
    });

    expect(result.success).toBe(false);
  });

  it('should reject code longer than 8 characters', () => {
    const result = ZOtpVerify.safeParse({
      email: 'user@example.com',
      code: '123456789',
    });

    expect(result.success).toBe(false);
  });
});

describe('ZResetStart', () => {
  it('should accept valid email', () => {
    const result = ZResetStart.safeParse({
      email: 'user@example.com',
    });

    expect(result.success).toBe(true);
  });

  it('should accept optional redirectTo', () => {
    const result = ZResetStart.safeParse({
      email: 'user@example.com',
      redirectTo: '/reset-password',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.redirectTo).toBe('/reset-password');
    }
  });

  it('should accept absolute URL in redirectTo', () => {
    const result = ZResetStart.safeParse({
      email: 'user@example.com',
      redirectTo: 'https://example.com/reset',
    });

    expect(result.success).toBe(true);
  });
});

describe('ZResetVerify', () => {
  it('should accept valid reset verification data', () => {
    const result = ZResetVerify.safeParse({
      email: 'user@example.com',
      token: 'a'.repeat(32),
      password: 'newpassword123',
    });

    expect(result.success).toBe(true);
  });

  it('should reject token shorter than 16 characters', () => {
    const result = ZResetVerify.safeParse({
      email: 'user@example.com',
      token: 'short',
      password: 'newpassword123',
    });

    expect(result.success).toBe(false);
  });

  it('should reject password shorter than 8 characters', () => {
    const result = ZResetVerify.safeParse({
      email: 'user@example.com',
      token: 'a'.repeat(32),
      password: 'short',
    });

    expect(result.success).toBe(false);
  });
});

describe('ZTokenExchange', () => {
  it('should accept valid provider and token', () => {
    const result = ZTokenExchange.safeParse({
      provider: 'google',
      token: 'ya29.a0AfH6SMBx...'.padEnd(16, 'x'),
    });

    expect(result.success).toBe(true);
  });

  it('should reject empty provider', () => {
    const result = ZTokenExchange.safeParse({
      provider: '',
      token: 'a'.repeat(16),
    });

    expect(result.success).toBe(false);
  });

  it('should reject token shorter than 16 characters', () => {
    const result = ZTokenExchange.safeParse({
      provider: 'google',
      token: 'short',
    });

    expect(result.success).toBe(false);
  });
});

describe('ZPhoneStart', () => {
  it('should accept valid E.164 phone number', () => {
    const result = ZPhoneStart.safeParse({
      phone: '+14155551234',
    });

    expect(result.success).toBe(true);
  });

  it('should reject phone without + prefix', () => {
    const result = ZPhoneStart.safeParse({
      phone: '14155551234',
    });

    expect(result.success).toBe(false);
  });

  it('should reject phone with non-numeric characters', () => {
    const result = ZPhoneStart.safeParse({
      phone: '+1-415-555-1234',
    });

    expect(result.success).toBe(false);
  });
});

describe('ZPhoneVerify', () => {
  it('should accept valid phone and code', () => {
    const result = ZPhoneVerify.safeParse({
      phone: '+14155551234',
      code: '123456',
    });

    expect(result.success).toBe(true);
  });

  it('should reject code shorter than 4 characters', () => {
    const result = ZPhoneVerify.safeParse({
      phone: '+14155551234',
      code: '123',
    });

    expect(result.success).toBe(false);
  });

  it('should reject code longer than 8 characters', () => {
    const result = ZPhoneVerify.safeParse({
      phone: '+14155551234',
      code: '123456789',
    });

    expect(result.success).toBe(false);
  });
});
