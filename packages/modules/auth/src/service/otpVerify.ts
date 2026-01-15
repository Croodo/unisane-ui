import { connectDb, kv, Email, getAuthIdentityProvider } from '@unisane/kernel';
import { ERR } from '@unisane/gateway';
import { otpCodeKey } from '../domain/keys';

export async function otpVerify(input: { email: string; code: string }): Promise<{ userId: string }> {
  await connectDb();
  const identity = getAuthIdentityProvider();
  const emailNorm = Email.create(input.email).toString();
  const key = otpCodeKey(emailNorm);
  const saved = await kv.get(key);
  if (!saved || saved !== input.code) throw ERR.validation('Invalid or expired code');
  await kv.del(key);
  const user = await identity.findUserByEmail(emailNorm);
  if (!user) throw ERR.validation('User not found');
  return { userId: identity.getUserId(user) };
}
