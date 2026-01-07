import { connectDb, DEFAULT_LOCALE, scryptHashPassword } from '@unisane/kernel';
import { AuthCredentialRepo } from '../data/auth.repository';
import {
  normalizeEmail,
  normalizePhoneE164,
  normalizeUsername,
  findUserByEmail,
  findUserByUsername,
  findUserByPhone,
  createUser,
  updateUserById,
  getUserId,
} from '@unisane/identity';
import { ERR } from '@unisane/gateway';

export async function signup(input: { email: string; password: string; displayName?: string; username?: string; firstName?: string; lastName?: string; phone?: string; locale?: string; timezone?: string }): Promise<{ userId: string }> {
  await connectDb();
  const emailNorm = normalizeEmail(input.email);
  const existing = await AuthCredentialRepo.findByEmailNorm(emailNorm);
  if (existing) throw ERR.versionMismatch();

  // Reuse existing user if present (e.g., created via OTP flow), else create
  let user = await findUserByEmail(emailNorm);
  if (!user) {
    // Normalize optional fields
    const username = input.username ? normalizeUsername(input.username) : undefined;
    const phone = input.phone ? normalizePhoneE164(input.phone) : undefined;
    // Optionally check for uniqueness before insert to provide clearer errors
    if (username) {
      const byU = await findUserByUsername(username);
      if (byU) throw ERR.versionMismatch();
    }
    if (phone) {
      const byP = await findUserByPhone(phone);
      if (byP) throw ERR.versionMismatch();
    }
    const created = await createUser({
      email: emailNorm,
      ...(input.displayName ? { displayName: input.displayName } : {}),
      ...(username ? { username } : {}),
      ...(input.firstName ? { firstName: input.firstName } : {}),
      ...(input.lastName ? { lastName: input.lastName } : {}),
      ...(phone ? { phone } : {}),
      locale: input.locale ?? DEFAULT_LOCALE,
      ...(input.timezone ? { timezone: input.timezone } : {}),
    });
    // createUser returns a DTO with id field
    const userId = created.id;
    // Hash password
    const { algo, saltB64, hashB64 } = await scryptHashPassword(input.password);
    await AuthCredentialRepo.create({
      userId,
      emailNorm,
      algo,
      salt: saltB64,
      hash: hashB64,
    });
    return { userId };
  }

  // User exists - update displayName if needed
  const userId = getUserId(user);
  if (input.displayName && !(user as { displayName?: string | null }).displayName) {
    await updateUserById(userId, { displayName: input.displayName });
  }

  // Hash password
  const { algo, saltB64, hashB64 } = await scryptHashPassword(input.password);
  await AuthCredentialRepo.create({
    userId,
    emailNorm,
    algo,
    salt: saltB64,
    hash: hashB64,
  });
  return { userId };
}
