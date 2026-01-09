/**
 * PDF Domain Errors
 *
 * Module-specific error classes using generic E1xxx error codes.
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

/**
 * Thrown when PDF generation fails.
 */
export class PdfGenerationError extends DomainError {
  readonly code = ErrorCode.INTERNAL_ERROR;
  readonly status = 500;

  constructor(reason: string) {
    super(`PDF generation failed: ${reason}`, { retryable: true });
    this.name = 'PdfGenerationError';
  }
}

/**
 * Thrown when a PDF template is not found.
 */
export class TemplateNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(templateId: string) {
    super(`PDF template not found: ${templateId}`);
    this.name = 'TemplateNotFoundError';
  }
}

/**
 * Thrown when a PDF template is invalid.
 */
export class InvalidTemplateError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor(reason: string) {
    super(`Invalid PDF template: ${reason}`);
    this.name = 'InvalidTemplateError';
  }
}
