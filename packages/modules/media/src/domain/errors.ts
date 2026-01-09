/**
 * Media Domain Errors
 *
 * Module-specific error classes using E6xxx error codes.
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

/**
 * Thrown when media is not found by ID.
 */
export class MediaNotFoundError extends DomainError {
  readonly code = ErrorCode.FILE_NOT_FOUND;
  readonly status = 404;

  constructor(mediaId: string) {
    super(`Media not found: ${mediaId}`);
    this.name = 'MediaNotFoundError';
  }
}

/**
 * Thrown when media processing fails (transcoding, thumbnail generation, etc.).
 */
export class MediaProcessingError extends DomainError {
  readonly code = ErrorCode.UPLOAD_FAILED;
  readonly status = 500;

  constructor(operation: string, reason: string) {
    super(`Media ${operation} failed: ${reason}`, { retryable: true });
    this.name = 'MediaProcessingError';
  }
}

/**
 * Thrown when media type is not supported.
 */
export class UnsupportedMediaTypeError extends DomainError {
  readonly code = ErrorCode.INVALID_FILE_TYPE;
  readonly status = 415;

  constructor(contentType: string) {
    super(`Unsupported media type: ${contentType}`);
    this.name = 'UnsupportedMediaTypeError';
  }
}
