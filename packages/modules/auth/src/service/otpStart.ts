import { connectDb, kv, randomDigits, logger, Email } from '@unisane/kernel';
import { getAuthIdentityProvider } from '@unisane/kernel';
import { otpCodeKey } from '../domain/keys';

export async function otpStart(input: { email: string; codeLen: number; ttlSec: number }): Promise<{ sent: boolean }> {
  await connectDb();
  const identity = getAuthIdentityProvider();
  const emailNorm = Email.create(input.email).toString();
  // Ensure user exists for OTP login flow (create minimal user lazily)
  await identity.ensureUserByEmail(emailNorm);

  const code = randomDigits(input.codeLen);
  const key = otpCodeKey(emailNorm);
  await kv.set(key, code, { PX: input.ttlSec * 1000 });

  // Enqueue email via outbox if available
  try {
    const { OutboxService } = await import('@unisane/kernel');
    await OutboxService.enqueue({ scopeId: '__system__', kind: 'email', payload: { to: { email: emailNorm }, template: 'auth_otp_code', props: { code, ttlSec: input.ttlSec } } });
  } catch (error) {
    logger.error('auth.otp.enqueue_failed', {
      email: emailNorm,
      error: error instanceof Error ? error.message : String(error),
    });
    // Still return sent: true because code was stored in KV
    // User can retry, but this should be monitored via alerts
  }

  return { sent: true };
}
