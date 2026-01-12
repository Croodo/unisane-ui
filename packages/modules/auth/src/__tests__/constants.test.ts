/**
 * Auth Constants Tests
 *
 * Tests for auth module constants.
 */

import { describe, it, expect } from 'vitest';
import { AUTH_EVENTS, AUTH_DEFAULTS, AUTH_COLLECTIONS } from '../domain/constants';

describe('AUTH_EVENTS', () => {
  it('should have all expected event names', () => {
    expect(AUTH_EVENTS.SIGNUP_COMPLETED).toBe('auth.signup.completed');
    expect(AUTH_EVENTS.SIGNIN_COMPLETED).toBe('auth.signin.completed');
    expect(AUTH_EVENTS.SIGNIN_FAILED).toBe('auth.signin.failed');
    expect(AUTH_EVENTS.SIGNOUT_COMPLETED).toBe('auth.signout.completed');
    expect(AUTH_EVENTS.OTP_REQUESTED).toBe('auth.otp.requested');
    expect(AUTH_EVENTS.OTP_VERIFIED).toBe('auth.otp.verified');
    expect(AUTH_EVENTS.RESET_REQUESTED).toBe('auth.reset.requested');
    expect(AUTH_EVENTS.RESET_COMPLETED).toBe('auth.reset.completed');
    expect(AUTH_EVENTS.PHONE_VERIFICATION_STARTED).toBe('auth.phone.started');
    expect(AUTH_EVENTS.PHONE_VERIFIED).toBe('auth.phone.verified');
    expect(AUTH_EVENTS.ACCOUNT_LOCKED).toBe('auth.account.locked');
  });

  it('should follow auth.{action}.{status} naming pattern', () => {
    const eventValues = Object.values(AUTH_EVENTS);

    for (const event of eventValues) {
      expect(event).toMatch(/^auth\.[a-z]+\.[a-z]+$/);
    }
  });

  it('should be immutable (const assertion)', () => {
    const events = AUTH_EVENTS;

    // TypeScript ensures immutability via `as const`
    // At runtime, we can verify the values are strings
    expect(typeof events.SIGNUP_COMPLETED).toBe('string');
    expect(typeof events.SIGNIN_COMPLETED).toBe('string');
  });
});

describe('AUTH_DEFAULTS', () => {
  describe('OTP Settings', () => {
    it('should have OTP_LENGTH of 6', () => {
      expect(AUTH_DEFAULTS.OTP_LENGTH).toBe(6);
    });

    it('should have OTP_EXPIRY_SEC of 300 (5 minutes)', () => {
      expect(AUTH_DEFAULTS.OTP_EXPIRY_SEC).toBe(300);
    });
  });

  describe('Reset Token Settings', () => {
    it('should have RESET_TOKEN_LENGTH of 32', () => {
      expect(AUTH_DEFAULTS.RESET_TOKEN_LENGTH).toBe(32);
    });

    it('should have RESET_TOKEN_EXPIRY_SEC of 3600 (1 hour)', () => {
      expect(AUTH_DEFAULTS.RESET_TOKEN_EXPIRY_SEC).toBe(3600);
    });
  });

  describe('Phone Verification Settings', () => {
    it('should have PHONE_CODE_LENGTH of 6', () => {
      expect(AUTH_DEFAULTS.PHONE_CODE_LENGTH).toBe(6);
    });

    it('should have PHONE_CODE_EXPIRY_SEC of 300 (5 minutes)', () => {
      expect(AUTH_DEFAULTS.PHONE_CODE_EXPIRY_SEC).toBe(300);
    });
  });

  describe('Account Lockout Settings', () => {
    it('should have MAX_FAILED_LOGINS of 5', () => {
      expect(AUTH_DEFAULTS.MAX_FAILED_LOGINS).toBe(5);
    });

    it('should have LOCKOUT_DURATION_SEC of 900 (15 minutes)', () => {
      expect(AUTH_DEFAULTS.LOCKOUT_DURATION_SEC).toBe(900);
    });
  });

  describe('Session Settings', () => {
    it('should have SESSION_EXPIRY_SEC of 7 days', () => {
      expect(AUTH_DEFAULTS.SESSION_EXPIRY_SEC).toBe(86400 * 7);
      expect(AUTH_DEFAULTS.SESSION_EXPIRY_SEC).toBe(604800);
    });
  });

  describe('CSRF Settings', () => {
    it('should have CSRF_TOKEN_LENGTH of 32', () => {
      expect(AUTH_DEFAULTS.CSRF_TOKEN_LENGTH).toBe(32);
    });
  });

  it('should have reasonable security values', () => {
    // OTP should be at least 6 digits
    expect(AUTH_DEFAULTS.OTP_LENGTH).toBeGreaterThanOrEqual(6);

    // OTP should expire within reasonable time
    expect(AUTH_DEFAULTS.OTP_EXPIRY_SEC).toBeLessThanOrEqual(600); // Max 10 min

    // Reset token should be cryptographically strong
    expect(AUTH_DEFAULTS.RESET_TOKEN_LENGTH).toBeGreaterThanOrEqual(32);

    // Reset token should expire within reasonable time
    expect(AUTH_DEFAULTS.RESET_TOKEN_EXPIRY_SEC).toBeLessThanOrEqual(86400); // Max 1 day

    // Lockout after reasonable number of attempts
    expect(AUTH_DEFAULTS.MAX_FAILED_LOGINS).toBeLessThanOrEqual(10);
    expect(AUTH_DEFAULTS.MAX_FAILED_LOGINS).toBeGreaterThanOrEqual(3);

    // Lockout duration should be meaningful
    expect(AUTH_DEFAULTS.LOCKOUT_DURATION_SEC).toBeGreaterThanOrEqual(300); // At least 5 min
  });
});

describe('AUTH_COLLECTIONS', () => {
  it('should have CREDENTIALS collection name', () => {
    expect(AUTH_COLLECTIONS.CREDENTIALS).toBe('auth_credentials');
  });

  it('should use snake_case naming', () => {
    const collectionNames = Object.values(AUTH_COLLECTIONS);

    for (const name of collectionNames) {
      expect(name).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });
});

describe('Constant Values Type Safety', () => {
  it('should have numeric defaults as numbers', () => {
    expect(typeof AUTH_DEFAULTS.OTP_LENGTH).toBe('number');
    expect(typeof AUTH_DEFAULTS.OTP_EXPIRY_SEC).toBe('number');
    expect(typeof AUTH_DEFAULTS.RESET_TOKEN_LENGTH).toBe('number');
    expect(typeof AUTH_DEFAULTS.RESET_TOKEN_EXPIRY_SEC).toBe('number');
    expect(typeof AUTH_DEFAULTS.PHONE_CODE_LENGTH).toBe('number');
    expect(typeof AUTH_DEFAULTS.PHONE_CODE_EXPIRY_SEC).toBe('number');
    expect(typeof AUTH_DEFAULTS.MAX_FAILED_LOGINS).toBe('number');
    expect(typeof AUTH_DEFAULTS.LOCKOUT_DURATION_SEC).toBe('number');
    expect(typeof AUTH_DEFAULTS.SESSION_EXPIRY_SEC).toBe('number');
    expect(typeof AUTH_DEFAULTS.CSRF_TOKEN_LENGTH).toBe('number');
  });

  it('should have event names as strings', () => {
    for (const eventName of Object.values(AUTH_EVENTS)) {
      expect(typeof eventName).toBe('string');
    }
  });

  it('should have collection names as strings', () => {
    for (const collectionName of Object.values(AUTH_COLLECTIONS)) {
      expect(typeof collectionName).toBe('string');
    }
  });
});
