/**
 * Storage Domain Errors
 *
 * Module-specific error classes that extend the kernel's DomainError.
 * These provide type-safe error handling with consistent error codes.
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

/**
 * Thrown when a file is not found by ID or key.
 */
export class FileNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(identifier: string, byField: 'id' | 'key' = 'id') {
    super(`File not found by ${byField}: ${identifier}`);
    this.name = 'FileNotFoundError';
  }
}

/**
 * Thrown when file upload has not been confirmed (still pending).
 */
export class FileNotConfirmedError extends DomainError {
  readonly code = ErrorCode.PRECONDITION_FAILED;
  readonly status = 412;

  constructor(fileId: string) {
    super(`File ${fileId} has not been confirmed yet`);
    this.name = 'FileNotConfirmedError';
  }
}

/**
 * Thrown when file has already been deleted.
 */
export class FileAlreadyDeletedError extends DomainError {
  readonly code = ErrorCode.GONE;
  readonly status = 410;

  constructor(fileId: string) {
    super(`File ${fileId} has been deleted`);
    this.name = 'FileAlreadyDeletedError';
  }
}

/**
 * Thrown when file content type is not allowed.
 */
export class ContentTypeNotAllowedError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor(contentType: string) {
    super(`Content type '${contentType}' is not allowed`);
    this.name = 'ContentTypeNotAllowedError';
  }
}

/**
 * Thrown when file size exceeds the limit for its content type.
 */
export class FileSizeExceededError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor(sizeBytes: number, maxBytes: number, contentType: string) {
    super(`File size ${sizeBytes} bytes exceeds limit of ${maxBytes} bytes for ${contentType}`);
    this.name = 'FileSizeExceededError';
  }
}

/**
 * Thrown when storage quota is exceeded for a tenant.
 */
export class StorageQuotaExceededError extends DomainError {
  readonly code = ErrorCode.PRECONDITION_FAILED;
  readonly status = 412;

  constructor(tenantId: string, usedBytes: number, limitBytes: number) {
    super(`Storage quota exceeded for tenant ${tenantId}: ${usedBytes}/${limitBytes} bytes`);
    this.name = 'StorageQuotaExceededError';
  }
}

/**
 * Thrown when file access is denied (wrong tenant).
 */
export class FileAccessDeniedError extends DomainError {
  readonly code = ErrorCode.FORBIDDEN;
  readonly status = 403;

  constructor(fileId: string) {
    super(`Access denied to file: ${fileId}`);
    this.name = 'FileAccessDeniedError';
  }
}

/**
 * Thrown when presigned URL generation fails.
 */
export class PresignedUrlError extends DomainError {
  readonly code = ErrorCode.INTERNAL_ERROR;
  readonly status = 500;

  constructor(operation: 'upload' | 'download', reason: string) {
    super(`Failed to generate ${operation} URL: ${reason}`);
    this.name = 'PresignedUrlError';
  }
}
