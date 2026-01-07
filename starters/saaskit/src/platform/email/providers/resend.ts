import { Resend } from 'resend';

type EmailAddress = { email: string; name?: string };

export type ResendEmail = {
  to: EmailAddress;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  headers?: Record<string, string>;
};

export async function sendEmailResend(input: ResendEmail): Promise<void> {
  const { RESEND_API_KEY: apiKey, MAIL_FROM } = (await import('@/src/shared/env')).getEnv();
  if (!apiKey) throw new Error('RESEND_API_KEY not set');
  const from = input.from ?? MAIL_FROM ?? 'no-reply@example.com';
  const to = input.to.name ? `${input.to.name} <${input.to.email}>` : input.to.email;
  const client = new Resend(apiKey);
  const payload = {
    from,
    to,
    subject: input.subject,
    html: input.html,
    ...(input.text ? { text: input.text } : {}),
    ...(input.headers ? { headers: input.headers } : {}),
  } as const;
  const timeoutMs = 10000;
  const resp = await Promise.race([
    client.emails.send(payload),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Resend request timeout')), timeoutMs)),
  ]);
  // Narrow without any: check for id presence if available, otherwise ensure call didn't throw
  if (!resp || (typeof (resp as { id?: string | null }).id !== 'undefined' && !(resp as { id?: string | null }).id)) {
    throw new Error('Resend send failed');
  }
}
