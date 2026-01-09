/**
 * Audit Domain Errors
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

export class AuditLogNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(logId: string) {
    super(`Audit log not found: ${logId}`);
    this.name = 'AuditLogNotFoundError';
  }
}

export class AuditLogImmutableError extends DomainError {
  readonly code = ErrorCode.FORBIDDEN;
  readonly status = 403;

  constructor() {
    super('Audit logs are immutable and cannot be modified');
    this.name = 'AuditLogImmutableError';
  }
}
