/**
 * Storage Domain Errors
 *
 * Module-specific error classes using E6xxx error codes.
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

/**
 * Thrown when a file is not found by ID or key.
 */
export class FileNotFoundError extends DomainError {
  readonly code = ErrorCode.FILE_NOT_FOUND;
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
  readonly code = ErrorCode.INVALID_FILE_TYPE;
  readonly status = 415;

  constructor(contentType: string) {
    super(`Content type '${contentType}' is not allowed`);
    this.name = 'ContentTypeNotAllowedError';
  }
}

/**
 * Thrown when file size exceeds the limit for its content type.
 */
export class FileSizeExceededError extends DomainError {
  readonly code = ErrorCode.FILE_TOO_LARGE;
  readonly status = 413;

  constructor(sizeBytes: number, maxBytes: number, contentType: string) {
    super(`File size ${sizeBytes} bytes exceeds limit of ${maxBytes} bytes for ${contentType}`);
    this.name = 'FileSizeExceededError';
  }
}

/**
 * Thrown when storage quota is exceeded for a scope.
 */
export class StorageQuotaExceededError extends DomainError {
  readonly code = ErrorCode.STORAGE_QUOTA_EXCEEDED;
  readonly status = 403;

  constructor(scopeId: string, usedBytes: number, limitBytes: number) {
    super(`Storage quota exceeded for scope ${scopeId}: ${usedBytes}/${limitBytes} bytes`);
    this.name = 'StorageQuotaExceededError';
  }
}

/**
 * Thrown when file access is denied (wrong scope).
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
  readonly code = ErrorCode.UPLOAD_FAILED;
  readonly status = 500;

  constructor(operation: 'upload' | 'download', reason: string) {
    super(`Failed to generate ${operation} URL: ${reason}`, { retryable: true });
    this.name = 'PresignedUrlError';
  }
}
