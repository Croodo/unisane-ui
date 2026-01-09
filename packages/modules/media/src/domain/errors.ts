/**
 * Media Domain Errors
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

export class MediaNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(mediaId: string) {
    super(`Media not found: ${mediaId}`);
    this.name = 'MediaNotFoundError';
  }
}

export class MediaProcessingError extends DomainError {
  readonly code = ErrorCode.INTERNAL_ERROR;
  readonly status = 500;

  constructor(operation: string, reason: string) {
    super(`Media ${operation} failed: ${reason}`);
    this.name = 'MediaProcessingError';
  }
}

export class UnsupportedMediaTypeError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor(contentType: string) {
    super(`Unsupported media type: ${contentType}`);
    this.name = 'UnsupportedMediaTypeError';
  }
}
