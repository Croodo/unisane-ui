import { connectDb, kv, randomDigits } from '@unisane/kernel';
import { normalizeEmail, ensureUserByEmail } from '@unisane/identity';
import { otpCodeKey } from '../domain/keys';

export async function otpStart(input: { email: string; codeLen: number; ttlSec: number }): Promise<{ sent: boolean }> {
  await connectDb();
  const emailNorm = normalizeEmail(input.email);
  // Ensure user exists for OTP login flow (create minimal user lazily)
  await ensureUserByEmail(emailNorm);

  const code = randomDigits(input.codeLen);
  const key = otpCodeKey(emailNorm);
  await kv.set(key, code, { PX: input.ttlSec * 1000 });

  // Enqueue email via outbox if available
  try {
    const { OutboxService } = await import('@unisane/kernel');
    await OutboxService.enqueue({ tenantId: '__system__', kind: 'email', payload: { to: { email: emailNorm }, template: 'auth_otp_code', props: { code, ttlSec: input.ttlSec } } });
  } catch {}

  return { sent: true };
}
