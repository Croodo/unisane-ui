/**
 * Identity Domain Errors
 *
 * Module-specific error classes and utilities.
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

// ════════════════════════════════════════════════════════════════════════════
// Utility Functions
// ════════════════════════════════════════════════════════════════════════════

/**
 * Check if an error is a duplicate key error (Mongo or MySQL).
 */
export function isDuplicateKeyError(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false;
  const obj = e as { code?: unknown; errno?: unknown };
  const code = obj.code;
  const errno = obj.errno;
  if (typeof code === 'number' && code === 11000) return true; // Mongo duplicate key
  if (typeof code === 'string' && code.toUpperCase() === 'ER_DUP_ENTRY') return true; // MySQL duplicate key
  if (typeof errno === 'number' && errno === 1062) return true; // MySQL duplicate key
  return false;
}

// ════════════════════════════════════════════════════════════════════════════
// Error Classes
// ════════════════════════════════════════════════════════════════════════════

/**
 * Thrown when a user is not found by ID, email, or username.
 */
export class UserNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(identifier: string, byField: 'id' | 'email' | 'username' = 'id') {
    super(`User not found by ${byField}: ${identifier}`);
    this.name = 'UserNotFoundError';
  }
}

/**
 * Thrown when attempting to create a user with an email that already exists.
 */
export class EmailAlreadyExistsError extends DomainError {
  readonly code = ErrorCode.CONFLICT;
  readonly status = 409;

  constructor(email: string) {
    super(`User with email '${email}' already exists`);
    this.name = 'EmailAlreadyExistsError';
  }
}

/**
 * Thrown when attempting to use a username that's already taken.
 */
export class UsernameAlreadyExistsError extends DomainError {
  readonly code = ErrorCode.CONFLICT;
  readonly status = 409;

  constructor(username: string) {
    super(`Username '${username}' is already taken`);
    this.name = 'UsernameAlreadyExistsError';
  }
}

/**
 * Thrown when attempting to use a phone number that's already registered.
 */
export class PhoneAlreadyExistsError extends DomainError {
  readonly code = ErrorCode.CONFLICT;
  readonly status = 409;

  constructor(phone: string) {
    super(`Phone number is already registered`);
    this.name = 'PhoneAlreadyExistsError';
  }
}

/**
 * Thrown when an API key is not found or invalid.
 */
export class ApiKeyNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(keyId: string) {
    super(`API key not found: ${keyId}`);
    this.name = 'ApiKeyNotFoundError';
  }
}

/**
 * Thrown when an API key has been revoked.
 */
export class ApiKeyRevokedError extends DomainError {
  readonly code = ErrorCode.FORBIDDEN;
  readonly status = 403;

  constructor(keyId: string) {
    super(`API key has been revoked: ${keyId}`);
    this.name = 'ApiKeyRevokedError';
  }
}

/**
 * Thrown when attempting to create more API keys than allowed.
 */
export class ApiKeyLimitExceededError extends DomainError {
  readonly code = ErrorCode.PRECONDITION_FAILED;
  readonly status = 412;

  constructor(limit: number) {
    super(`API key limit exceeded. Maximum allowed: ${limit}`);
    this.name = 'ApiKeyLimitExceededError';
  }
}

/**
 * Thrown when a membership is not found.
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
 * Thrown when a user doesn't have the required role.
 */
export class InsufficientRoleError extends DomainError {
  readonly code = ErrorCode.FORBIDDEN;
  readonly status = 403;

  constructor(requiredRole: string) {
    super(`Insufficient permissions. Required role: ${requiredRole}`);
    this.name = 'InsufficientRoleError';
  }
}

/**
 * Thrown when email format is invalid.
 */
export class InvalidEmailError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor(email: string) {
    super(`Invalid email format: ${email}`);
    this.name = 'InvalidEmailError';
  }
}

/**
 * Thrown when phone format is invalid.
 */
export class InvalidPhoneError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor(phone: string) {
    super(`Invalid phone format: ${phone}`);
    this.name = 'InvalidPhoneError';
  }
}
