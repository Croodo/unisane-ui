/**
 * Email Validation Utilities
 *
 * Shared email validation logic for email adapters (Resend, SES, etc.).
 */

export const EMAIL_REGEX = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,63}$/;
export const MAX_EMAIL_LENGTH = 320;
export const MAX_EMAIL_RECIPIENTS = 50;
export const MAX_SUBJECT_LENGTH = 998;

/**
 * Extract email address from RFC 5322 format (e.g., "Display Name <email@example.com>")
 */
export function extractEmailAddress(input: string): string {
  const match = input.match(/<([^>]+)>/);
  return match ? match[1]! : input;
}

/**
 * Validate an email address format. Supports RFC 5322 display name format.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const extracted = extractEmailAddress(email);
  if (extracted.length > MAX_EMAIL_LENGTH) return false;
  return EMAIL_REGEX.test(extracted);
}

export interface EmailMessageForValidation {
  from?: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}

export interface EmailValidationOptions {
  maxRecipients?: number;
  requireBody?: boolean;
}

/**
 * Validate an email message before sending.
 */
export function validateEmailMessage(
  message: EmailMessageForValidation,
  defaultFrom: string,
  options: EmailValidationOptions = {}
): void {
  const { maxRecipients = MAX_EMAIL_RECIPIENTS, requireBody = false } = options;

  const from = message.from ?? defaultFrom;
  if (!isValidEmail(from)) {
    throw new Error(`Invalid 'from' email address: ${from}`);
  }

  const toAddresses = Array.isArray(message.to) ? message.to : [message.to];
  if (toAddresses.length === 0) {
    throw new Error('At least one recipient is required');
  }
  if (toAddresses.length > maxRecipients) {
    throw new Error(`Too many recipients: ${toAddresses.length} (max ${maxRecipients})`);
  }
  for (const addr of toAddresses) {
    if (!isValidEmail(addr)) {
      throw new Error(`Invalid recipient email address: ${addr}`);
    }
  }

  if (message.replyTo && !isValidEmail(message.replyTo)) {
    throw new Error(`Invalid 'replyTo' email address: ${message.replyTo}`);
  }

  if (!message.subject || message.subject.trim().length === 0) {
    throw new Error('Email subject is required');
  }
  if (message.subject.length > MAX_SUBJECT_LENGTH) {
    throw new Error(`Email subject too long (max ${MAX_SUBJECT_LENGTH} characters)`);
  }

  if (requireBody && !message.html && !message.text) {
    throw new Error('Email body is required: provide either html or text content');
  }
}

/**
 * Normalize email recipients to array format.
 */
export function normalizeRecipients(to: string | string[]): string[] {
  return Array.isArray(to) ? to : [to];
}
