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

/**
 * RSN-002 FIX: Basic email validation regex.
 * This is a simplified check - full RFC 5322 compliance is not practical.
 * The regex ensures: local-part@domain.tld format with reasonable lengths.
 */
const EMAIL_REGEX = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,63}$/;

/**
 * RSN-002 FIX: Maximum number of recipients per email (Resend limit).
 */
const MAX_RECIPIENTS = 50;

/**
 * RSN-002 FIX: Validate an email address format.
 * Returns true if the email appears valid, false otherwise.
 */
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 320) return false; // RFC 5321 limit
  return EMAIL_REGEX.test(email);
}

/**
 * RSN-002 FIX: Validate email message before sending.
 * Throws descriptive errors for invalid inputs.
 */
function validateEmailMessage(message: EmailMessage, defaultFrom: string): void {
  // Validate 'from' address
  const from = message.from ?? defaultFrom;
  if (!isValidEmail(from)) {
    throw new Error(`Invalid 'from' email address: ${from}`);
  }

  // Validate 'to' addresses
  const toAddresses = Array.isArray(message.to) ? message.to : [message.to];
  if (toAddresses.length === 0) {
    throw new Error('At least one recipient is required');
  }
  if (toAddresses.length > MAX_RECIPIENTS) {
    throw new Error(`Too many recipients: ${toAddresses.length} (max ${MAX_RECIPIENTS})`);
  }
  for (const addr of toAddresses) {
    if (!isValidEmail(addr)) {
      throw new Error(`Invalid recipient email address: ${addr}`);
    }
  }

  // Validate 'replyTo' if present
  if (message.replyTo && !isValidEmail(message.replyTo)) {
    throw new Error(`Invalid 'replyTo' email address: ${message.replyTo}`);
  }

  // Validate subject
  if (!message.subject || message.subject.trim().length === 0) {
    throw new Error('Email subject is required');
  }
  if (message.subject.length > 998) {
    throw new Error('Email subject too long (max 998 characters)');
  }
}

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
    // RSN-002 FIX: Validate email message before sending
    validateEmailMessage(message, this.defaultFrom);

    const to = Array.isArray(message.to) ? message.to : [message.to];

    // Resend requires text field - use provided text or derive from html
    const text = message.text ?? message.html?.replace(/<[^>]*>/g, '') ?? '';

    // M-006 FIX: Use Promise.race for reliable timeout handling
    // The Resend SDK may not fully respect AbortSignal, so we use Promise.race
    // to ensure the timeout is honored even if the underlying request continues
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Email send timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);
    });

    const sendPromise = (async () => {
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
        success: true as const,
        messageId: result.data?.id,
      };
    })();

    try {
      // M-006 FIX: Promise.race ensures timeout is honored even if SDK ignores AbortSignal
      return await Promise.race([sendPromise, timeoutPromise]);
    } finally {
      // Always clean up the timeout to prevent memory leaks
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
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
      failureThreshold: CIRCUIT_BREAKER_DEFAULTS.failureThreshold,
      resetTimeout: CIRCUIT_BREAKER_DEFAULTS.resetTimeout,
    },
    retry: {
      maxRetries: 3,
      baseDelayMs: 200,
    },
  });
}
