/**
 * Notify Domain Errors
 *
 * Module-specific error classes using E7xxx error codes.
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

/**
 * Thrown when a notification is not found.
 */
export class NotificationNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(notificationId: string) {
    super(`Notification not found: ${notificationId}`);
    this.name = 'NotificationNotFoundError';
  }
}

/**
 * Thrown when notification delivery fails.
 */
export class NotificationDeliveryError extends DomainError {
  readonly code = ErrorCode.NOTIFICATION_FAILED;
  readonly status = 502;

  constructor(channel: string, reason: string) {
    super(`Failed to deliver via ${channel}: ${reason}`, { retryable: true });
    this.name = 'NotificationDeliveryError';
  }
}

/**
 * Thrown when notification channel is invalid.
 */
export class InvalidChannelError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor(channel: string) {
    super(`Invalid notification channel: ${channel}`);
    this.name = 'InvalidChannelError';
  }
}

/**
 * Thrown when notification template is not found.
 */
export class TemplateNotFoundError extends DomainError {
  readonly code = ErrorCode.TEMPLATE_NOT_FOUND;
  readonly status = 404;

  constructor(templateId: string) {
    super(`Notification template not found: ${templateId}`);
    this.name = 'TemplateNotFoundError';
  }
}
