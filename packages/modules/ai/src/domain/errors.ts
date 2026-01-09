/**
 * AI Domain Errors
 *
 * Module-specific error classes using E8xxx error codes.
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

/**
 * Thrown when an AI provider request fails.
 */
export class AiProviderError extends DomainError {
  readonly code = ErrorCode.AI_REQUEST_FAILED;
  readonly status = 500;

  constructor(provider: string, reason: string) {
    super(`AI provider ${provider} error: ${reason}`, { retryable: true });
    this.name = 'AiProviderError';
  }
}

/**
 * Thrown when AI rate limit is exceeded.
 */
export class AiRateLimitError extends DomainError {
  readonly code = ErrorCode.AI_QUOTA_EXCEEDED;
  readonly status = 429;

  constructor(retryAfterMs: number) {
    super(`AI rate limit exceeded. Retry after ${retryAfterMs}ms`, { retryable: true });
    this.name = 'AiRateLimitError';
  }
}

/**
 * Thrown when token limit is exceeded.
 */
export class AiTokenLimitError extends DomainError {
  readonly code = ErrorCode.AI_QUOTA_EXCEEDED;
  readonly status = 400;

  constructor(requested: number, max: number) {
    super(`Token limit exceeded: requested ${requested}, max ${max}`);
    this.name = 'AiTokenLimitError';
  }
}

/**
 * Thrown when AI model is not found.
 */
export class AiModelNotFoundError extends DomainError {
  readonly code = ErrorCode.MODEL_NOT_FOUND;
  readonly status = 404;

  constructor(model: string) {
    super(`AI model not found: ${model}`);
    this.name = 'AiModelNotFoundError';
  }
}

/**
 * Thrown when content fails moderation.
 */
export class ContentModerationError extends DomainError {
  readonly code = ErrorCode.CONTENT_MODERATION_FAILED;
  readonly status = 400;

  constructor(reason: string) {
    super(`Content flagged by moderation: ${reason}`);
    this.name = 'ContentModerationError';
  }
}
