import * as nodeCrypto from 'node:crypto';
import { hmacSHA256Hex, timingSafeEqual } from '@/src/platform/webhooks/signing';
import { getEnv } from '@unisane/kernel';

export function cleanPrefixedSig(sig: string): string {
  const m = sig.match(/^\s*sha256=(.+)$/i);
  return m ? m[1] ?? '' : sig;
}

export async function verifyResend(raw: string, headers: Headers, envProd: boolean): Promise<boolean> {
  const sigHeader = headers.get('x-resend-signature') ?? '';
  const sig = cleanPrefixedSig(sigHeader);
  const { RESEND_WEBHOOK_SECRET } = getEnv();
  if (!RESEND_WEBHOOK_SECRET) return envProd ? false : true;
  const expected = hmacSHA256Hex(RESEND_WEBHOOK_SECRET, raw);
  return timingSafeEqual(expected, sig);
}

export function isTrustedSnsCertURL(urlStr: string, region?: string): boolean {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    const reg = (region || 'us-east-1').toLowerCase();
    return host === `sns.${reg}.amazonaws.com` || host === 'sns.amazonaws.com';
  } catch {
    return false;
  }
}

export function buildSnsStringToSign(msg: Record<string, unknown>): string {
  const type = String(msg.Type ?? '');
  const lines: string[] = [];
  const push = (k: string, v?: string) => {
    if (v !== undefined) {
      lines.push(k);
      lines.push(v);
    }
  };
  if (type === 'Notification') {
    push('Message', typeof msg.Message === 'string' ? msg.Message : undefined);
    push('MessageId', typeof msg.MessageId === 'string' ? msg.MessageId : undefined);
    if (typeof msg.Subject === 'string') push('Subject', msg.Subject);
    push('Timestamp', typeof msg.Timestamp === 'string' ? msg.Timestamp : undefined);
    push('TopicArn', typeof msg.TopicArn === 'string' ? msg.TopicArn : undefined);
    push('Type', 'Notification');
  } else if (type === 'SubscriptionConfirmation' || type === 'UnsubscribeConfirmation') {
    push('Message', typeof msg.Message === 'string' ? msg.Message : undefined);
    push('MessageId', typeof msg.MessageId === 'string' ? msg.MessageId : undefined);
    push('SubscribeURL', typeof msg.SubscribeURL === 'string' ? msg.SubscribeURL : undefined);
    push('Timestamp', typeof msg.Timestamp === 'string' ? msg.Timestamp : undefined);
    push('Token', typeof msg.Token === 'string' ? msg.Token : undefined);
    push('TopicArn', typeof msg.TopicArn === 'string' ? msg.TopicArn : undefined);
    push('Type', type);
  }
  return lines.join('\n');
}

export async function verifySesSns(
  raw: string,
  opts: { envProd: boolean; region?: string; topicArn?: string; fetchCert?: (url: string) => Promise<string> }
): Promise<{ ok: boolean; parsed?: Record<string, unknown> }> {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { ok: false };
  }
  const topicArn = typeof parsed.TopicArn === 'string' ? parsed.TopicArn : '';
  if (!topicArn || (opts.topicArn && topicArn !== opts.topicArn)) return { ok: false };
  const signingCertURL = typeof parsed.SigningCertURL === 'string' ? parsed.SigningCertURL : '';
  if (!signingCertURL || !isTrustedSnsCertURL(signingCertURL, opts.region)) return { ok: false };
  const signature = typeof parsed.Signature === 'string' ? parsed.Signature : '';
  if (!signature) return { ok: false };
  const stringToSign = buildSnsStringToSign(parsed);
  if (!stringToSign) return { ok: false };
  try {
    const certPem = opts.fetchCert
      ? await opts.fetchCert(signingCertURL)
      : await (async () => {
          const res = await fetch(signingCertURL, { method: 'GET' });
          if (!res.ok) return '';
          return await res.text();
        })();
    if (!certPem) return { ok: false };
    const verifier = nodeCrypto.createVerify('RSA-SHA1');
    verifier.update(stringToSign, 'utf8');
    verifier.end();
    const sigBuf = Buffer.from(signature, 'base64');
    const ok = verifier.verify(certPem, sigBuf);
    return { ok, parsed };
  } catch {
    return { ok: !opts.envProd, parsed };
  }
}

export function verifyStripe(raw: string, headers: Headers): boolean {
  const sigHeader = headers.get('stripe-signature') ?? '';
  const parts = Object.fromEntries(
    sigHeader
      .split(',')
      .map((kv) => kv.trim().split('='))
      .filter((kv) => kv.length === 2)
  ) as Record<string, string>;
  const t = parts['t'];
  const v1 = parts['v1'];
  const { STRIPE_WEBHOOK_SECRET } = getEnv();
  if (!STRIPE_WEBHOOK_SECRET) return false;
  if (t && v1) {
    const payloadToSign = `${t}.${raw}`;
    const expected = hmacSHA256Hex(STRIPE_WEBHOOK_SECRET, payloadToSign);
    return timingSafeEqual(expected, v1);
  }
  return false;
}

export function verifyRazorpay(raw: string, headers: Headers): boolean {
  const sigHeader = headers.get('x-razorpay-signature') ?? '';
  const { RAZORPAY_WEBHOOK_SECRET } = getEnv();
  if (!RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = hmacSHA256Hex(RAZORPAY_WEBHOOK_SECRET, raw);
  return timingSafeEqual(expected, sigHeader);
}

export async function verifyInbound(
  provider: string,
  raw: string,
  headers: Headers,
  opts: { envProd: boolean }
): Promise<boolean> {
  switch (provider) {
    case 'resend':
      return verifyResend(raw, headers, opts.envProd);
    case 'ses': {
      const { AWS_REGION, SES_SNS_TOPIC_ARN } = getEnv();
      const res = await verifySesSns(raw, {
        envProd: opts.envProd,
        ...(AWS_REGION ? { region: AWS_REGION } : {}),
        ...(SES_SNS_TOPIC_ARN ? { topicArn: SES_SNS_TOPIC_ARN } : {}),
      });
      return res.ok;
    }
    case 'stripe': {
      const ok = verifyStripe(raw, headers);
      return ok;
    }
    case 'razorpay': {
      const ok = verifyRazorpay(raw, headers);
      return ok;
    }
    default:
      // Unknown provider — caller should reject in prod
      return false;
  }
}
