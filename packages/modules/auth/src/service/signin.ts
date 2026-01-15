import { connectDb, scryptVerifyPassword, Email } from '@unisane/kernel';
import { AuthCredentialRepo } from '../data/auth.repository';
import { ERR } from '@unisane/gateway';

export async function signin(input: { email: string; password: string }): Promise<{ userId: string }> {
  await connectDb();
  const emailNorm = Email.create(input.email).toString();
  const cred = await AuthCredentialRepo.findByEmailNorm(emailNorm);
  if (!cred) throw ERR.loginRequired();
  if (cred.lockedUntil && cred.lockedUntil.getTime() > Date.now()) {
    throw ERR.forbidden('Account locked. Try again later.');
  }
  const ok = await scryptVerifyPassword(input.password, cred.salt, cred.hash);
  if (!ok) {
    await AuthCredentialRepo.recordFailed(cred.id);
    throw ERR.loginRequired();
  }
  await AuthCredentialRepo.clearFailures(cred.id);
  return { userId: cred.userId };
}
