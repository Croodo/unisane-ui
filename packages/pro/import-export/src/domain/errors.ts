/**
 * Import/Export Domain Errors
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

export class ImportError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor(reason: string) {
    super(`Import failed: ${reason}`);
    this.name = 'ImportError';
  }
}

export class ExportError extends DomainError {
  readonly code = ErrorCode.INTERNAL_ERROR;
  readonly status = 500;

  constructor(reason: string) {
    super(`Export failed: ${reason}`);
    this.name = 'ExportError';
  }
}

export class JobNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(jobId: string) {
    super(`Import/Export job not found: ${jobId}`);
    this.name = 'JobNotFoundError';
  }
}

export class InvalidFormatError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor(format: string, supported: string[]) {
    super(`Invalid format '${format}'. Supported: ${supported.join(', ')}`);
    this.name = 'InvalidFormatError';
  }
}
