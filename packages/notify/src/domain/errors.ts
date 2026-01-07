/**
 * Notify Domain Errors
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

export class NotificationNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(notificationId: string) {
    super(`Notification not found: ${notificationId}`);
    this.name = 'NotificationNotFoundError';
  }
}

export class NotificationDeliveryError extends DomainError {
  readonly code = ErrorCode.INTERNAL_ERROR;
  readonly status = 500;

  constructor(channel: string, reason: string) {
    super(`Failed to deliver via ${channel}: ${reason}`);
    this.name = 'NotificationDeliveryError';
  }
}

export class InvalidChannelError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor(channel: string) {
    super(`Invalid notification channel: ${channel}`);
    this.name = 'InvalidChannelError';
  }
}

export class TemplateNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(templateId: string) {
    super(`Notification template not found: ${templateId}`);
    this.name = 'TemplateNotFoundError';
  }
}
