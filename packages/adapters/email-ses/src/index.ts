/**
 * AWS SES Email Adapter
 *
 * Implements the EmailProvider interface using AWS Simple Email Service.
 *
 * @example
 * ```typescript
 * import { SESEmailAdapter } from '@unisane/email-ses';
 *
 * const adapter = new SESEmailAdapter({
 *   region: 'us-east-1',
 *   accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
 *   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
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

import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import type { EmailProvider, EmailMessage, SendResult } from '@unisane/kernel';
import { CIRCUIT_BREAKER_DEFAULTS, ConfigurationError } from '@unisane/kernel';
import { z } from 'zod';

/**
 * Extract email address from RFC 5322 format (e.g., "Display Name <email@example.com>")
 */
function extractEmailAddress(input: string): string {
  const match = input.match(/<([^>]+)>/);
  return match ? match[1]! : input;
}

/**
 * Validate email address or RFC 5322 format with display name.
 */
function isValidFromAddress(value: string): boolean {
  const email = extractEmailAddress(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const ZSESEmailAdapterConfig = z.object({
  region: z.string().min(1, 'AWS region is required').regex(/^[a-z]{2}-[a-z]+-\d+$/, 'Invalid AWS region format'),
  accessKeyId: z.string().min(16, 'AWS Access Key ID is required').max(128),
  secretAccessKey: z.string().min(16, 'AWS Secret Access Key is required'),
  defaultFrom: z.string().refine(isValidFromAddress, 'defaultFrom must be a valid email or RFC 5322 format').optional(),
  configurationSetName: z.string().min(1).max(256).optional(),
  timeoutMs: z.number().int().positive().max(60000).optional(),
});

const EMAIL_REGEX = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,63}$/;
const MAX_RECIPIENTS = 50;

function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const extracted = extractEmailAddress(email);
  if (extracted.length > 320) return false;
  return EMAIL_REGEX.test(extracted);
}

/**
 * SES-002 FIX: Validate email message before sending.
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

  // SES-002 FIX: Validate at least HTML or text body is provided
  if (!message.html && !message.text) {
    throw new Error('Email body is required: provide either html or text content');
  }
}

export interface SESEmailAdapterConfig {
  /** AWS region */
  region: string;
  /** AWS Access Key ID */
  accessKeyId: string;
  /** AWS Secret Access Key */
  secretAccessKey: string;
  /** Default from address */
  defaultFrom?: string;
  /** SES Configuration Set name (optional) */
  configurationSetName?: string;
  /** Request timeout in milliseconds */
  timeoutMs?: number;
}

/**
 * AWS SES implementation of the EmailProvider interface.
 */
export class SESEmailAdapter implements EmailProvider {
  readonly name = 'email-ses' as const;
  private readonly client: SESv2Client;
  private readonly defaultFrom: string;
  private readonly configurationSetName?: string;
  private readonly timeoutMs: number;

  constructor(config: SESEmailAdapterConfig) {
    // SES-001 FIX: Validate configuration using Zod schema
    const result = ZSESEmailAdapterConfig.safeParse(config);
    if (!result.success) {
      throw ConfigurationError.fromZod('email-ses', result.error.issues);
    }

    this.client = new SESv2Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    this.defaultFrom = config.defaultFrom ?? 'noreply@example.com';
    this.configurationSetName = config.configurationSetName;
    this.timeoutMs = config.timeoutMs ?? 10000;
  }

  async send(message: EmailMessage): Promise<SendResult> {
    // SES-002 FIX: Validate email message before sending
    validateEmailMessage(message, this.defaultFrom);

    try {
      const from = message.from ?? this.defaultFrom;
      const toAddresses = Array.isArray(message.to) ? message.to : [message.to];

      const command = new SendEmailCommand({
        FromEmailAddress: from,
        Destination: {
          ToAddresses: toAddresses,
        },
        Content: {
          Simple: {
            Subject: { Data: message.subject },
            Body: {
              Html: message.html ? { Data: message.html } : undefined,
              Text: message.text ? { Data: message.text } : undefined,
            },
          },
        },
        ...(message.replyTo ? { ReplyToAddresses: [message.replyTo] } : {}),
        ...(this.configurationSetName
          ? { ConfigurationSetName: this.configurationSetName }
          : {}),
      });

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);

      const response = await this.client
        .send(command, { abortSignal: ctrl.signal })
        .finally(() => clearTimeout(timer));

      if (!response.MessageId) {
        throw new Error('SES send failed: No MessageId returned');
      }

      return {
        success: true,
        messageId: response.MessageId,
      };
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error');
    }
  }
}

/**
 * Create a new SES email adapter.
 * Wrapped with resilience (circuit breaker, retry).
 */
import { createResilientProxy } from '@unisane/kernel';

export function createSESEmailAdapter(config: SESEmailAdapterConfig): EmailProvider {
  return createResilientProxy({
    name: 'email-ses',
    primary: new SESEmailAdapter(config),
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
