/**
 * Resend Email Adapter
 */

import { Resend } from 'resend';
import type { EmailProvider, EmailMessage, SendResult } from '@unisane/kernel';
import {
  CIRCUIT_BREAKER_DEFAULTS,
  ConfigurationError,
  createResilientProxy,
  validateEmailMessage,
  normalizeRecipients,
} from '@unisane/kernel';
import { z } from 'zod';

const ZResendEmailAdapterConfig = z.object({
  apiKey: z.string().min(1).startsWith('re_'),
  defaultFrom: z.string().email().optional(),
  timeoutMs: z.number().int().positive().max(60000).optional(),
});

export interface ResendEmailAdapterConfig {
  apiKey: string;
  defaultFrom?: string;
  timeoutMs?: number;
}

export class ResendEmailAdapter implements EmailProvider {
  readonly name = 'email-resend' as const;
  private readonly resend: Resend;
  private readonly defaultFrom: string;
  private readonly timeoutMs: number;

  constructor(config: ResendEmailAdapterConfig) {
    const result = ZResendEmailAdapterConfig.safeParse(config);
    if (!result.success) {
      throw ConfigurationError.fromZod('email-resend', result.error.issues);
    }

    this.resend = new Resend(config.apiKey);
    this.defaultFrom = config.defaultFrom ?? 'noreply@example.com';
    this.timeoutMs = config.timeoutMs ?? 10000;
  }

  async send(message: EmailMessage): Promise<SendResult> {
    validateEmailMessage(message, this.defaultFrom);

    const to = normalizeRecipients(message.to);
    const text = message.text ?? message.html?.replace(/<[^>]*>/g, '') ?? '';

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

      return { success: true as const, messageId: result.data?.id };
    })();

    try {
      return await Promise.race([sendPromise, timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }
}

export function createResendEmailAdapter(config: ResendEmailAdapterConfig): EmailProvider {
  return createResilientProxy({
    name: 'email-resend',
    primary: new ResendEmailAdapter(config),
    circuitBreaker: {
      failureThreshold: CIRCUIT_BREAKER_DEFAULTS.failureThreshold,
      resetTimeout: CIRCUIT_BREAKER_DEFAULTS.resetTimeout,
    },
    retry: { maxRetries: 3, baseDelayMs: 200 },
  });
}
