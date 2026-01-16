/**
 * Email Validation Utilities
 *
 * Shared email validation logic used by email adapters (Resend, SES, etc.).
 * Consolidates duplicate validation code to ensure consistency.
 *
 * H-001 FIX: Extracted from email-resend and email-ses adapters.
 */

/**
 * Basic email validation regex.
 * This is a simplified check - full RFC 5322 compliance is not practical.
 * The regex ensures: local-part@domain.tld format with reasonable lengths.
 */
export const EMAIL_REGEX = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,63}$/;

/**
 * Maximum email address length per RFC 5321.
 */
export const MAX_EMAIL_LENGTH = 320;

/**
 * Maximum number of recipients per email.
 * This is a reasonable default; specific providers may have different limits.
 */
export const MAX_RECIPIENTS = 50;

/**
 * Maximum subject line length per RFC 5322.
 */
export const MAX_SUBJECT_LENGTH = 998;

/**
 * Email message structure for validation.
 */
export interface EmailMessageForValidation {
  from?: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}

/**
 * Options for email validation.
 */
export interface EmailValidationOptions {
  /** Maximum number of recipients allowed (default: 50) */
  maxRecipients?: number;
  /** Whether to require at least HTML or text body (default: false) */
  requireBody?: boolean;
}

/**
 * Validate an email address format.
 * Returns true if the email appears valid, false otherwise.
 *
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  if (email.length > MAX_EMAIL_LENGTH) return false;
  return EMAIL_REGEX.test(email);
}

/**
 * Validate an email message before sending.
 * Throws descriptive errors for invalid inputs.
 *
 * @param message - Email message to validate
 * @param defaultFrom - Default sender address if message.from is not set
 * @param options - Validation options
 * @throws Error if validation fails
 */
export function validateEmailMessage(
  message: EmailMessageForValidation,
  defaultFrom: string,
  options: EmailValidationOptions = {}
): void {
  const { maxRecipients = MAX_RECIPIENTS, requireBody = false } = options;

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
  if (toAddresses.length > maxRecipients) {
    throw new Error(`Too many recipients: ${toAddresses.length} (max ${maxRecipients})`);
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
  if (message.subject.length > MAX_SUBJECT_LENGTH) {
    throw new Error(`Email subject too long (max ${MAX_SUBJECT_LENGTH} characters)`);
  }

  // Validate body if required
  if (requireBody && !message.html && !message.text) {
    throw new Error('Email body is required: provide either html or text content');
  }
}

/**
 * Normalize email addresses to a consistent array format.
 *
 * @param to - Single email or array of emails
 * @returns Array of email addresses
 */
export function normalizeRecipients(to: string | string[]): string[] {
  return Array.isArray(to) ? to : [to];
}
