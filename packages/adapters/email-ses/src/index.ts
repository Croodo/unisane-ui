/**
 * AWS SES Email Adapter
 */

import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import type { EmailProvider, EmailMessage, SendResult } from '@unisane/kernel';
import {
  CIRCUIT_BREAKER_DEFAULTS,
  ConfigurationError,
  createResilientProxy,
  isValidEmail,
  validateEmailMessage,
  normalizeRecipients,
  extractEmailAddress,
} from '@unisane/kernel';
import { z } from 'zod';

function isValidFromAddress(value: string): boolean {
  const email = extractEmailAddress(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const ZSESEmailAdapterConfig = z.object({
  region: z.string().min(1).regex(/^[a-z]{2}-[a-z]+-\d+$/),
  accessKeyId: z.string().min(16).max(128),
  secretAccessKey: z.string().min(16),
  defaultFrom: z.string().refine(isValidFromAddress).optional(),
  configurationSetName: z.string().min(1).max(256).optional(),
  timeoutMs: z.number().int().positive().max(60000).optional(),
});

export interface SESEmailAdapterConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  defaultFrom?: string;
  configurationSetName?: string;
  timeoutMs?: number;
}

export class SESEmailAdapter implements EmailProvider {
  readonly name = 'email-ses' as const;
  private readonly client: SESv2Client;
  private readonly defaultFrom: string;
  private readonly configurationSetName?: string;
  private readonly timeoutMs: number;

  constructor(config: SESEmailAdapterConfig) {
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
    validateEmailMessage(message, this.defaultFrom, { requireBody: true });

    const from = message.from ?? this.defaultFrom;
    const toAddresses = normalizeRecipients(message.to);

    const command = new SendEmailCommand({
      FromEmailAddress: from,
      Destination: { ToAddresses: toAddresses },
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
      ...(this.configurationSetName ? { ConfigurationSetName: this.configurationSetName } : {}),
    });

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);

    const response = await this.client
      .send(command, { abortSignal: ctrl.signal })
      .finally(() => clearTimeout(timer));

    if (!response.MessageId) {
      throw new Error('SES send failed: No MessageId returned');
    }

    return { success: true, messageId: response.MessageId };
  }
}

export function createSESEmailAdapter(config: SESEmailAdapterConfig): EmailProvider {
  return createResilientProxy({
    name: 'email-ses',
    primary: new SESEmailAdapter(config),
    circuitBreaker: {
      failureThreshold: CIRCUIT_BREAKER_DEFAULTS.failureThreshold,
      resetTimeout: CIRCUIT_BREAKER_DEFAULTS.resetTimeout,
    },
    retry: { maxRetries: 3, baseDelayMs: 200 },
  });
}
