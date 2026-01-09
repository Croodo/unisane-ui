/**
 * Auth Domain Errors
 *
 * Module-specific error classes using E2xxx error codes.
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

export class InvalidCredentialsError extends DomainError {
  readonly code = ErrorCode.INVALID_CREDENTIALS;
  readonly status = 401;

  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

export class AccountLockedError extends DomainError {
  readonly code = ErrorCode.ACCOUNT_LOCKED;
  readonly status = 403;

  constructor(lockedUntil: Date) {
    super(`Account locked until ${lockedUntil.toISOString()}`);
    this.name = 'AccountLockedError';
  }
}

export class OtpExpiredError extends DomainError {
  readonly code = ErrorCode.INVALID_TOKEN;
  readonly status = 410;

  constructor() {
    super('OTP code has expired');
    this.name = 'OtpExpiredError';
  }
}

export class OtpInvalidError extends DomainError {
  readonly code = ErrorCode.INVALID_MFA_CODE;
  readonly status = 401;

  constructor() {
    super('Invalid OTP code');
    this.name = 'OtpInvalidError';
  }
}

export class OtpRateLimitError extends DomainError {
  readonly code = ErrorCode.RATE_LIMITED;
  readonly status = 429;

  constructor(retryAfterSec: number) {
    super(`Too many OTP requests. Retry after ${retryAfterSec} seconds`, {
      details: { retryAfterSec },
      retryable: true,
    });
    this.name = 'OtpRateLimitError';
  }
}

export class ResetTokenExpiredError extends DomainError {
  readonly code = ErrorCode.PASSWORD_RESET_EXPIRED;
  readonly status = 410;

  constructor() {
    super('Password reset token has expired');
    this.name = 'ResetTokenExpiredError';
  }
}

export class ResetTokenInvalidError extends DomainError {
  readonly code = ErrorCode.INVALID_TOKEN;
  readonly status = 401;

  constructor() {
    super('Invalid password reset token');
    this.name = 'ResetTokenInvalidError';
  }
}

export class CsrfMismatchError extends DomainError {
  readonly code = ErrorCode.CSRF_INVALID;
  readonly status = 403;

  constructor() {
    super('CSRF token mismatch');
    this.name = 'CsrfMismatchError';
  }
}

export class PhoneVerificationExpiredError extends DomainError {
  readonly code = ErrorCode.INVALID_TOKEN;
  readonly status = 410;

  constructor() {
    super('Phone verification code has expired');
    this.name = 'PhoneVerificationExpiredError';
  }
}

export class PhoneVerificationInvalidError extends DomainError {
  readonly code = ErrorCode.INVALID_MFA_CODE;
  readonly status = 401;

  constructor() {
    super('Invalid phone verification code');
    this.name = 'PhoneVerificationInvalidError';
  }
}

export class PasswordTooWeakError extends DomainError {
  readonly code = ErrorCode.WEAK_PASSWORD;
  readonly status = 400;

  constructor(reason: string) {
    super(`Password too weak: ${reason}`);
    this.name = 'PasswordTooWeakError';
  }
}

export class SessionExpiredError extends DomainError {
  readonly code = ErrorCode.SESSION_EXPIRED;
  readonly status = 401;

  constructor() {
    super('Session has expired');
    this.name = 'SessionExpiredError';
  }
}

export class MfaRequiredError extends DomainError {
  readonly code = ErrorCode.MFA_REQUIRED;
  readonly status = 403;

  constructor() {
    super('Multi-factor authentication required');
    this.name = 'MfaRequiredError';
  }
}

export class OAuthError extends DomainError {
  readonly code = ErrorCode.OAUTH_ERROR;
  readonly status = 401;

  constructor(provider: string, reason: string) {
    super(`OAuth authentication failed for ${provider}: ${reason}`);
    this.name = 'OAuthError';
  }
}
