import { connectDb, DEFAULT_LOCALE, scryptHashPassword, Email, PhoneE164, Username, getAuthIdentityProvider } from '@unisane/kernel';
import { AuthCredentialRepo } from '../data/auth.repository';
import { ERR } from '@unisane/gateway';

export async function signup(input: { email: string; password: string; displayName?: string; username?: string; firstName?: string; lastName?: string; phone?: string; locale?: string; timezone?: string }): Promise<{ userId: string }> {
  await connectDb();
  const identity = getAuthIdentityProvider();
  const emailNorm = Email.create(input.email).toString();
  const existing = await AuthCredentialRepo.findByEmailNorm(emailNorm);
  if (existing) throw ERR.versionMismatch();

  // Reuse existing user if present (e.g., created via OTP flow), else create
  let user = await identity.findUserByEmail(emailNorm);
  if (!user) {
    // Normalize optional fields
    const username = input.username ? Username.create(input.username).toString() : undefined;
    const phone = input.phone ? PhoneE164.create(input.phone).toString() : undefined;
    // Optionally check for uniqueness before insert to provide clearer errors
    if (username) {
      const byU = await identity.findUserByUsername(username);
      if (byU) throw ERR.versionMismatch();
    }
    if (phone) {
      const byP = await identity.findUserByPhone(phone);
      if (byP) throw ERR.versionMismatch();
    }
    const created = await identity.createUser({
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
  const userId = identity.getUserId(user);
  if (input.displayName && !user.displayName) {
    await identity.updateUserById(userId, { displayName: input.displayName });
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
