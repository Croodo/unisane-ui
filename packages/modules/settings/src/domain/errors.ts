/**
 * Settings Domain Errors
 *
 * Module-specific error classes using generic E1xxx error codes.
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

/**
 * Thrown when a setting is not found.
 */
export class SettingNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(namespace: string, key: string, tenantId: string | null = null) {
    const scope = tenantId ? `tenant ${tenantId}` : 'platform';
    super(`Setting not found: ${namespace}.${key} in ${scope}`);
    this.name = 'SettingNotFoundError';
  }
}

/**
 * Thrown when a setting update fails due to version conflict (optimistic locking).
 */
export class SettingVersionConflictError extends DomainError {
  readonly code = ErrorCode.CONFLICT;
  readonly status = 409;

  constructor(namespace: string, key: string, expectedVersion: number) {
    super(`Version conflict for setting ${namespace}.${key}: expected version ${expectedVersion}`, { retryable: true });
    this.name = 'SettingVersionConflictError';
  }
}

/**
 * Thrown when attempting to modify a platform-only setting without admin privileges.
 */
export class SettingAccessDeniedError extends DomainError {
  readonly code = ErrorCode.PERMISSION_DENIED;
  readonly status = 403;

  constructor(namespace: string, key: string) {
    super(`Access denied: ${namespace}.${key} is platform-only`);
    this.name = 'SettingAccessDeniedError';
  }
}

/**
 * Thrown when a setting value fails schema validation.
 */
export class SettingValidationError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor(namespace: string, key: string, reason: string) {
    super(`Invalid value for setting ${namespace}.${key}: ${reason}`);
    this.name = 'SettingValidationError';
  }
}

/**
 * Thrown when a setting namespace is not recognized.
 */
export class UnknownNamespaceError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(namespace: string) {
    super(`Unknown setting namespace: ${namespace}`);
    this.name = 'UnknownNamespaceError';
  }
}
