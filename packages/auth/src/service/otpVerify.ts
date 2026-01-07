import { connectDb, kv } from '@unisane/kernel';
import { normalizeEmail, findUserByEmail, getUserId } from '@unisane/identity';
import { ERR } from '@unisane/gateway';
import { otpCodeKey } from '../domain/keys';

export async function otpVerify(input: { email: string; code: string }): Promise<{ userId: string }> {
  await connectDb();
  const emailNorm = normalizeEmail(input.email);
  const key = otpCodeKey(emailNorm);
  const saved = await kv.get(key);
  if (!saved || saved !== input.code) throw ERR.validation('Invalid or expired code');
  await kv.del(key);
  const user = await findUserByEmail(emailNorm);
  if (!user) throw ERR.validation('User not found');
  return { userId: getUserId(user) };
}
