/**
 * SSO Domain Errors
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

export class SsoProviderNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(provider: string) {
    super(`SSO provider not found: ${provider}`);
    this.name = 'SsoProviderNotFoundError';
  }
}

export class SsoProviderDisabledError extends DomainError {
  readonly code = ErrorCode.FORBIDDEN;
  readonly status = 403;

  constructor(provider: string) {
    super(`SSO provider '${provider}' is disabled`);
    this.name = 'SsoProviderDisabledError';
  }
}

export class SsoCallbackError extends DomainError {
  readonly code = ErrorCode.UNAUTHORIZED;
  readonly status = 401;

  constructor(reason: string) {
    super(`SSO callback failed: ${reason}`);
    this.name = 'SsoCallbackError';
  }
}

export class SsoStateInvalidError extends DomainError {
  readonly code = ErrorCode.UNAUTHORIZED;
  readonly status = 401;

  constructor() {
    super('Invalid or expired SSO state');
    this.name = 'SsoStateInvalidError';
  }
}

export class SsoAccountLinkError extends DomainError {
  readonly code = ErrorCode.CONFLICT;
  readonly status = 409;

  constructor(provider: string, reason: string) {
    super(`Cannot link ${provider} account: ${reason}`);
    this.name = 'SsoAccountLinkError';
  }
}
