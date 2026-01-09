/**
 * PDF Domain Errors
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

export class PdfGenerationError extends DomainError {
  readonly code = ErrorCode.INTERNAL_ERROR;
  readonly status = 500;

  constructor(reason: string) {
    super(`PDF generation failed: ${reason}`);
    this.name = 'PdfGenerationError';
  }
}

export class TemplateNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(templateId: string) {
    super(`PDF template not found: ${templateId}`);
    this.name = 'TemplateNotFoundError';
  }
}

export class InvalidTemplateError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor(reason: string) {
    super(`Invalid PDF template: ${reason}`);
    this.name = 'InvalidTemplateError';
  }
}
