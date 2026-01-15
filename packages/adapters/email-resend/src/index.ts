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
import { CIRCUIT_BREAKER_DEFAULTS, ConfigurationError } from '@unisane/kernel';
import { z } from 'zod';

/**
 * Zod schema for validating Resend adapter configuration.
 */
export const ZResendEmailAdapterConfig = z.object({
  apiKey: z.string().min(1, 'Resend API key is required').startsWith('re_', 'Invalid Resend API key format'),
  defaultFrom: z.string().email('defaultFrom must be a valid email').optional(),
  timeoutMs: z.number().int().positive().max(60000).optional(),
});

export interface ResendEmailAdapterConfig {
  /** Resend API key */
  apiKey: string;
  /** Default from address */
  defaultFrom?: string;
  /** Request timeout in milliseconds (default: 10000) */
  timeoutMs?: number;
}

/**
 * Resend implementation of the EmailProvider interface.
 */
export class ResendEmailAdapter implements EmailProvider {
  readonly name = 'email-resend' as const;
  private readonly resend: Resend;
  private readonly defaultFrom: string;
  private readonly timeoutMs: number;

  constructor(config: ResendEmailAdapterConfig) {
    // Validate configuration at construction time
    const result = ZResendEmailAdapterConfig.safeParse(config);
    if (!result.success) {
      throw ConfigurationError.fromZod('email-resend', result.error.issues);
    }

    this.resend = new Resend(config.apiKey);
    this.defaultFrom = config.defaultFrom ?? 'noreply@example.com';
    this.timeoutMs = config.timeoutMs ?? 10000;
  }

  async send(message: EmailMessage): Promise<SendResult> {
    const to = Array.isArray(message.to) ? message.to : [message.to];

    // Resend requires text field - use provided text or derive from html
    const text = message.text ?? message.html?.replace(/<[^>]*>/g, '') ?? '';

    // Wrap send call with timeout
    const sendPromise = this.resend.emails.send({
      from: message.from ?? this.defaultFrom,
      to,
      subject: message.subject,
      text,
      ...(message.html && { html: message.html }),
      ...(message.replyTo && { replyTo: message.replyTo }),
      ...(message.headers && { headers: message.headers }),
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Email send timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);
    });

    const result = await Promise.race([sendPromise, timeoutPromise]);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return {
      success: true,
      messageId: result.data?.id,
    };
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
      failureThreshold: CIRCUIT_BREAKER_DEFAULTS.failureThreshold,
      resetTimeout: CIRCUIT_BREAKER_DEFAULTS.resetTimeout,
    },
    retry: {
      maxRetries: 3,
      baseDelayMs: 200,
    },
  });
}
