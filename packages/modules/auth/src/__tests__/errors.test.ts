/**
 * Auth Errors Tests
 *
 * Tests for auth-specific error classes.
 */

import { describe, it, expect } from 'vitest';
import { DomainError, ErrorCode } from '@unisane/kernel';
import {
  InvalidCredentialsError,
  AccountLockedError,
  OtpExpiredError,
  OtpInvalidError,
  OtpRateLimitError,
  ResetTokenExpiredError,
  ResetTokenInvalidError,
  CsrfMismatchError,
  PhoneVerificationExpiredError,
  PhoneVerificationInvalidError,
  PasswordTooWeakError,
  SessionExpiredError,
  MfaRequiredError,
  OAuthError,
} from '../domain/errors';

describe('InvalidCredentialsError', () => {
  it('should have correct status and code', () => {
    const error = new InvalidCredentialsError();

    expect(error.status).toBe(401);
    expect(error.code).toBe(ErrorCode.INVALID_CREDENTIALS);
    expect(error.name).toBe('InvalidCredentialsError');
  });

  it('should have generic message for security', () => {
    const error = new InvalidCredentialsError();

    expect(error.message).toBe('Invalid email or password');
  });

  it('should be instanceof DomainError', () => {
    const error = new InvalidCredentialsError();

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('AccountLockedError', () => {
  it('should have correct status and code', () => {
    const lockedUntil = new Date('2025-01-15T12:00:00Z');
    const error = new AccountLockedError(lockedUntil);

    expect(error.status).toBe(403);
    expect(error.code).toBe(ErrorCode.ACCOUNT_LOCKED);
    expect(error.name).toBe('AccountLockedError');
  });

  it('should include locked until timestamp in message', () => {
    const lockedUntil = new Date('2025-01-15T12:00:00Z');
    const error = new AccountLockedError(lockedUntil);

    expect(error.message).toContain('2025-01-15T12:00:00');
  });
});

describe('OtpExpiredError', () => {
  it('should have correct status and code', () => {
    const error = new OtpExpiredError();

    expect(error.status).toBe(410);
    expect(error.code).toBe(ErrorCode.INVALID_TOKEN);
    expect(error.name).toBe('OtpExpiredError');
    expect(error.message).toBe('OTP code has expired');
  });
});

describe('OtpInvalidError', () => {
  it('should have correct status and code', () => {
    const error = new OtpInvalidError();

    expect(error.status).toBe(401);
    expect(error.code).toBe(ErrorCode.INVALID_MFA_CODE);
    expect(error.name).toBe('OtpInvalidError');
    expect(error.message).toBe('Invalid OTP code');
  });
});

describe('OtpRateLimitError', () => {
  it('should have correct status and code', () => {
    const error = new OtpRateLimitError(60);

    expect(error.status).toBe(429);
    expect(error.code).toBe(ErrorCode.RATE_LIMITED);
    expect(error.name).toBe('OtpRateLimitError');
  });

  it('should include retry after in message and details', () => {
    const error = new OtpRateLimitError(60);

    expect(error.message).toContain('60 seconds');
    expect(error.details).toEqual({ retryAfterSec: 60 });
  });

  it('should be retryable', () => {
    const error = new OtpRateLimitError(30);

    expect(error.retryable).toBe(true);
  });
});

describe('ResetTokenExpiredError', () => {
  it('should have correct status and code', () => {
    const error = new ResetTokenExpiredError();

    expect(error.status).toBe(410);
    expect(error.code).toBe(ErrorCode.PASSWORD_RESET_EXPIRED);
    expect(error.name).toBe('ResetTokenExpiredError');
    expect(error.message).toBe('Password reset token has expired');
  });
});

describe('ResetTokenInvalidError', () => {
  it('should have correct status and code', () => {
    const error = new ResetTokenInvalidError();

    expect(error.status).toBe(401);
    expect(error.code).toBe(ErrorCode.INVALID_TOKEN);
    expect(error.name).toBe('ResetTokenInvalidError');
    expect(error.message).toBe('Invalid password reset token');
  });
});

describe('CsrfMismatchError', () => {
  it('should have correct status and code', () => {
    const error = new CsrfMismatchError();

    expect(error.status).toBe(403);
    expect(error.code).toBe(ErrorCode.CSRF_INVALID);
    expect(error.name).toBe('CsrfMismatchError');
    expect(error.message).toBe('CSRF token mismatch');
  });
});

describe('PhoneVerificationExpiredError', () => {
  it('should have correct status and code', () => {
    const error = new PhoneVerificationExpiredError();

    expect(error.status).toBe(410);
    expect(error.code).toBe(ErrorCode.INVALID_TOKEN);
    expect(error.name).toBe('PhoneVerificationExpiredError');
    expect(error.message).toBe('Phone verification code has expired');
  });
});

describe('PhoneVerificationInvalidError', () => {
  it('should have correct status and code', () => {
    const error = new PhoneVerificationInvalidError();

    expect(error.status).toBe(401);
    expect(error.code).toBe(ErrorCode.INVALID_MFA_CODE);
    expect(error.name).toBe('PhoneVerificationInvalidError');
    expect(error.message).toBe('Invalid phone verification code');
  });
});

describe('PasswordTooWeakError', () => {
  it('should have correct status and code', () => {
    const error = new PasswordTooWeakError('Must contain uppercase');

    expect(error.status).toBe(400);
    expect(error.code).toBe(ErrorCode.WEAK_PASSWORD);
    expect(error.name).toBe('PasswordTooWeakError');
  });

  it('should include reason in message', () => {
    const error = new PasswordTooWeakError('Must contain uppercase');

    expect(error.message).toBe('Password too weak: Must contain uppercase');
  });
});

describe('SessionExpiredError', () => {
  it('should have correct status and code', () => {
    const error = new SessionExpiredError();

    expect(error.status).toBe(401);
    expect(error.code).toBe(ErrorCode.SESSION_EXPIRED);
    expect(error.name).toBe('SessionExpiredError');
    expect(error.message).toBe('Session has expired');
  });
});

describe('MfaRequiredError', () => {
  it('should have correct status and code', () => {
    const error = new MfaRequiredError();

    expect(error.status).toBe(403);
    expect(error.code).toBe(ErrorCode.MFA_REQUIRED);
    expect(error.name).toBe('MfaRequiredError');
    expect(error.message).toBe('Multi-factor authentication required');
  });
});

describe('OAuthError', () => {
  it('should have correct status and code', () => {
    const error = new OAuthError('google', 'Token expired');

    expect(error.status).toBe(401);
    expect(error.code).toBe(ErrorCode.OAUTH_ERROR);
    expect(error.name).toBe('OAuthError');
  });

  it('should include provider and reason in message', () => {
    const error = new OAuthError('google', 'Token expired');

    expect(error.message).toBe('OAuth authentication failed for google: Token expired');
  });

  it('should work with different providers', () => {
    const googleError = new OAuthError('google', 'Invalid token');
    const githubError = new OAuthError('github', 'Access denied');

    expect(googleError.message).toContain('google');
    expect(githubError.message).toContain('github');
  });
});

describe('Error HTTP Status Codes', () => {
  it('should use correct HTTP status codes for each error type', () => {
    const statusMap = [
      [new InvalidCredentialsError(), 401],
      [new AccountLockedError(new Date()), 403],
      [new OtpExpiredError(), 410],
      [new OtpInvalidError(), 401],
      [new OtpRateLimitError(60), 429],
      [new ResetTokenExpiredError(), 410],
      [new ResetTokenInvalidError(), 401],
      [new CsrfMismatchError(), 403],
      [new PhoneVerificationExpiredError(), 410],
      [new PhoneVerificationInvalidError(), 401],
      [new PasswordTooWeakError('reason'), 400],
      [new SessionExpiredError(), 401],
      [new MfaRequiredError(), 403],
      [new OAuthError('provider', 'reason'), 401],
    ] as const;

    for (const [error, expectedStatus] of statusMap) {
      expect(error.status).toBe(expectedStatus);
    }
  });
});

describe('Error toJSON()', () => {
  it('should serialize errors correctly', () => {
    const error = new OtpRateLimitError(60);
    const json = error.toJSON();

    expect(json.code).toBe(ErrorCode.RATE_LIMITED);
    expect(json.message).toContain('60 seconds');
    expect(json.status).toBe(429);
    expect(json.details).toEqual({ retryAfterSec: 60 });
    expect(json.retryable).toBe(true);
  });
});
