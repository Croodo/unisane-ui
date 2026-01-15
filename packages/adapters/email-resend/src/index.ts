/**
 * Resend Email Adapter
 *
 * Implements the EmailProvider interface using Resend.
 *
 * @example
 * ```typescript
 * import { ResendEmailAdapter } from '@unisane/email-resend';
 *
 * const adapter = new ResendEmailAdapter({
 *   apiKey: process.env.RESEND_API_KEY!,
 *   defaultFrom: 'noreply@example.com',
 * });
 *
 * await adapter.send({
 *   to: 'user@example.com',
 *   subject: 'Welcome!',
 *   html: '<h1>Hello World</h1>',
 * });
 * ```
 */

import { Resend } from 'resend';
import type { EmailProvider, EmailMessage, SendResult } from '@unisane/kernel';

export interface ResendEmailAdapterConfig {
  /** Resend API key */
  apiKey: string;
  /** Default from address */
  defaultFrom?: string;
}

/**
 * Resend implementation of the EmailProvider interface.
 */
export class ResendEmailAdapter implements EmailProvider {
  readonly name = 'email-resend' as const;
  private readonly resend: Resend;
  private readonly defaultFrom: string;

  constructor(config: ResendEmailAdapterConfig) {
    if (!config.apiKey) {
      throw new Error('ResendEmailAdapter: config.apiKey is required');
    }
    this.resend = new Resend(config.apiKey);
    this.defaultFrom = config.defaultFrom ?? 'noreply@example.com';
  }

  async send(message: EmailMessage): Promise<SendResult> {
    try {
      const to = Array.isArray(message.to) ? message.to : [message.to];

      // Resend requires text field - use provided text or derive from html
      const text = message.text ?? message.html?.replace(/<[^>]*>/g, '') ?? '';

      const result = await this.resend.emails.send({
        from: message.from ?? this.defaultFrom,
        to,
        subject: message.subject,
        text,
        ...(message.html && { html: message.html }),
        ...(message.replyTo && { replyTo: message.replyTo }),
        ...(message.headers && { headers: message.headers }),
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error');
    }
  }
}

/**
 * Create a new Resend email adapter.
 * Wrapped with resilience (circuit breaker, retry).
 */
import { createResilientProxy } from '@unisane/kernel';

export function createResendEmailAdapter(config: ResendEmailAdapterConfig): EmailProvider {
  return createResilientProxy({
    name: 'email-resend',
    primary: new ResendEmailAdapter(config),
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeout: 30000,
    },
    retry: {
      maxRetries: 3,
      baseDelayMs: 200,
    },
  });
}
