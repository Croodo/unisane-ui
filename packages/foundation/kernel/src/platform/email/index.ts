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

let _resendProvider: EmailProvider = noopEmailProvider;
let _sesProvider: EmailProvider = noopEmailProvider;

export async function sendEmailResend(message: EmailMessage): Promise<SendResult> {
  return _resendProvider.send(message);
}

export async function sendEmailSes(message: EmailMessage): Promise<SendResult> {
  return _sesProvider.send(message);
}

export function setResendProvider(impl: EmailProvider): void {
  _resendProvider = impl;
}

export function setSesProvider(impl: EmailProvider): void {
  _sesProvider = impl;
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
