import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { getEnv } from '@unisane/kernel';

type EmailAddress = { email: string; name?: string };

export type SesEmail = {
  to: EmailAddress;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  headers?: Record<string, string>; // Note: SES Simple ignores arbitrary headers
};

export async function sendEmailSes(input: SesEmail): Promise<void> {
  const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, MAIL_FROM, SES_CONFIG_SET } = getEnv();
  if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) throw new Error('SES not configured');
  const from = input.from ?? MAIL_FROM ?? 'no-reply@example.com';
  const to = input.to.name ? `${input.to.name} <${input.to.email}>` : input.to.email;

  const client = new SESv2Client({ region: AWS_REGION, credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY } });
  const cmd = new SendEmailCommand({
    FromEmailAddress: from,
    Destination: { ToAddresses: [to] },
    Content: {
      Simple: {
        Subject: { Data: input.subject },
        Body: {
          Html: { Data: input.html },
          ...(input.text ? { Text: { Data: input.text } } : {}),
        },
      },
    },
    ...(SES_CONFIG_SET ? { ConfigurationSetName: SES_CONFIG_SET } : {}),
  });
  const timeoutMs = 10000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const resp = await client.send(cmd, { abortSignal: ctrl.signal }).finally(() => clearTimeout(timer));
  if (!resp || !resp.MessageId) throw new Error('SES send failed');
}
