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
    if (!config.region) throw new Error('SESEmailAdapter: config.region is required');
    if (!config.accessKeyId) throw new Error('SESEmailAdapter: config.accessKeyId is required');
    if (!config.secretAccessKey) throw new Error('SESEmailAdapter: config.secretAccessKey is required');

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
      failureThreshold: 10,
      resetTimeout: 30000,
    },
    retry: {
      maxRetries: 3,
      baseDelayMs: 200,
    },
  });
}
