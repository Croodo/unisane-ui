import { kv, connectDb, scryptHashPassword, Email } from '@unisane/kernel';
import { AuthCredentialRepo } from '../data/auth.repository';
import { ERR } from '@unisane/gateway';

export async function resetVerify(input: { email: string; token: string; password: string }): Promise<{ userId: string }> {
  await connectDb();
  const emailNorm = Email.create(input.email).toString();
  const { resetTokenKey } = await import('../domain/keys');
  const key = resetTokenKey(emailNorm, input.token);
  const userId = await kv.get(key);
  if (!userId) throw ERR.validation('Invalid or expired token');
  const { algo, saltB64, hashB64 } = await scryptHashPassword(input.password);
  const cred = await AuthCredentialRepo.findByEmailNorm(emailNorm);
  if (!cred) throw ERR.validation('Account not found');
  await AuthCredentialRepo.updatePassword(emailNorm, { algo, salt: saltB64, hash: hashB64 });
  await kv.del(key);
  return { userId };
}
