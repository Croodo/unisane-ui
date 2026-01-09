/**
 * AI Domain Errors
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

export class AiProviderError extends DomainError {
  readonly code = ErrorCode.INTERNAL_ERROR;
  readonly status = 500;

  constructor(provider: string, reason: string) {
    super(`AI provider ${provider} error: ${reason}`);
    this.name = 'AiProviderError';
  }
}

export class AiRateLimitError extends DomainError {
  readonly code = ErrorCode.RATE_LIMITED;
  readonly status = 429;

  constructor(retryAfterMs: number) {
    super(`AI rate limit exceeded. Retry after ${retryAfterMs}ms`);
    this.name = 'AiRateLimitError';
  }
}

export class AiTokenLimitError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor(requested: number, max: number) {
    super(`Token limit exceeded: requested ${requested}, max ${max}`);
    this.name = 'AiTokenLimitError';
  }
}

export class AiModelNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(model: string) {
    super(`AI model not found: ${model}`);
    this.name = 'AiModelNotFoundError';
  }
}
