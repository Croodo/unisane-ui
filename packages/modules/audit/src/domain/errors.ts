/**
 * Audit Domain Errors
 *
 * Module-specific error classes using generic E1xxx error codes.
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

/**
 * Thrown when an audit log entry is not found.
 */
export class AuditLogNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(logId: string) {
    super(`Audit log not found: ${logId}`);
    this.name = 'AuditLogNotFoundError';
  }
}

/**
 * Thrown when attempting to modify an immutable audit log.
 */
export class AuditLogImmutableError extends DomainError {
  readonly code = ErrorCode.FORBIDDEN;
  readonly status = 403;

  constructor() {
    super('Audit logs are immutable and cannot be modified');
    this.name = 'AuditLogImmutableError';
  }
}
