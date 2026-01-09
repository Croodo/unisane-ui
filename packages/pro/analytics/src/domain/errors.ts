/**
 * Analytics Domain Errors
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

export class AnalyticsQueryError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor(reason: string) {
    super(`Invalid analytics query: ${reason}`);
    this.name = 'AnalyticsQueryError';
  }
}

export class MetricNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(metric: string) {
    super(`Analytics metric not found: ${metric}`);
    this.name = 'MetricNotFoundError';
  }
}
