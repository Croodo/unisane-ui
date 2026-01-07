/**
 * Auth Domain Errors
 *
 * Module-specific error classes that extend the kernel's DomainError.
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

export class InvalidCredentialsError extends DomainError {
  readonly code = ErrorCode.UNAUTHORIZED;
  readonly status = 401;

  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

export class AccountLockedError extends DomainError {
  readonly code = ErrorCode.FORBIDDEN;
  readonly status = 403;

  constructor(lockedUntil: Date) {
    super(`Account locked until ${lockedUntil.toISOString()}`);
    this.name = 'AccountLockedError';
  }
}

export class OtpExpiredError extends DomainError {
  readonly code = ErrorCode.GONE;
  readonly status = 410;

  constructor() {
    super('OTP code has expired');
    this.name = 'OtpExpiredError';
  }
}

export class OtpInvalidError extends DomainError {
  readonly code = ErrorCode.UNAUTHORIZED;
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
    super(`Too many OTP requests. Retry after ${retryAfterSec} seconds`);
    this.name = 'OtpRateLimitError';
  }
}

export class ResetTokenExpiredError extends DomainError {
  readonly code = ErrorCode.GONE;
  readonly status = 410;

  constructor() {
    super('Password reset token has expired');
    this.name = 'ResetTokenExpiredError';
  }
}

export class ResetTokenInvalidError extends DomainError {
  readonly code = ErrorCode.UNAUTHORIZED;
  readonly status = 401;

  constructor() {
    super('Invalid password reset token');
    this.name = 'ResetTokenInvalidError';
  }
}

export class CsrfMismatchError extends DomainError {
  readonly code = ErrorCode.FORBIDDEN;
  readonly status = 403;

  constructor() {
    super('CSRF token mismatch');
    this.name = 'CsrfMismatchError';
  }
}

export class PhoneVerificationExpiredError extends DomainError {
  readonly code = ErrorCode.GONE;
  readonly status = 410;

  constructor() {
    super('Phone verification code has expired');
    this.name = 'PhoneVerificationExpiredError';
  }
}

export class PhoneVerificationInvalidError extends DomainError {
  readonly code = ErrorCode.UNAUTHORIZED;
  readonly status = 401;

  constructor() {
    super('Invalid phone verification code');
    this.name = 'PhoneVerificationInvalidError';
  }
}

export class PasswordTooWeakError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor(reason: string) {
    super(`Password too weak: ${reason}`);
    this.name = 'PasswordTooWeakError';
  }
}
