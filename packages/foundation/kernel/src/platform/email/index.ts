/**
 * Email platform stub - provides email sending and template rendering
 * Actual implementations are injected by the application
 */

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface SendResult {
  messageId?: string;
  success: boolean;
  error?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<SendResult>;
}

const noopEmailProvider: EmailProvider = {
  send: async () => ({ success: true }),
};

let _emailProvider: EmailProvider = noopEmailProvider;

// Deprecated: Specific providers
let _resendProvider: EmailProvider = noopEmailProvider;
let _sesProvider: EmailProvider = noopEmailProvider;

/**
 * Send an email using the configured provider.
 */
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  try {
    return await _emailProvider.send(message);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Configure the email provider.
 */
export function setEmailProvider(impl: EmailProvider): void {
  _emailProvider = impl;
}

/** @deprecated Use sendEmail() instead */
export async function sendEmailResend(message: EmailMessage): Promise<SendResult> {
  return _resendProvider.send(message);
}

/** @deprecated Use sendEmail() instead */
export async function sendEmailSes(message: EmailMessage): Promise<SendResult> {
  return _sesProvider.send(message);
}

/** @deprecated Use setEmailProvider() instead */
export function setResendProvider(impl: EmailProvider): void {
  _resendProvider = impl;
  // Auto-set the main provider for backward compatibility
  if (_emailProvider === noopEmailProvider) {
    _emailProvider = impl;
  }
}

/** @deprecated Use setEmailProvider() instead */
export function setSesProvider(impl: EmailProvider): void {
  _sesProvider = impl;
  // Auto-set the main provider for backward compatibility
  if (_emailProvider === noopEmailProvider) {
    _emailProvider = impl;
  }
}

// Template rendering
export interface TemplateData {
  [key: string]: unknown;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text?: string;
}

export type TemplateRenderer = (templateName: string, data: TemplateData) => Promise<RenderedEmail>;

let _templateRenderer: TemplateRenderer = async () => ({
  subject: '',
  html: '',
});

export async function renderEmail(templateName: string, data: TemplateData): Promise<RenderedEmail> {
  return _templateRenderer(templateName, data);
}

export function setTemplateRenderer(renderer: TemplateRenderer): void {
  _templateRenderer = renderer;
}
