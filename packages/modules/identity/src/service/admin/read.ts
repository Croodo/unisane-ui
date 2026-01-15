import { usersRepository, membershipsRepository } from "../../data/repo";


export type ReadAdminUserArgs = {
  userId: string;
};

export async function readAdminUser(args: ReadAdminUserArgs) {
  const { userId } = args;
  const u = await usersRepository.findById(userId);
  if (!u) return null;
  const [m, keysCount, lastActivityAt] = await Promise.all([
    usersRepository.getMembershipsCount(userId),
    usersRepository.getApiKeysCreatedCount(userId),
    usersRepository.getLastActivity(userId),
  ]);
  const sessionsRevokedAt = (u as { sessionsRevokedAt?: Date | null }).sessionsRevokedAt ?? null;
  const emailVerified = (u as { emailVerified?: boolean | null }).emailVerified ?? null;
  const phoneVerified = (u as { phoneVerified?: boolean | null }).phoneVerified ?? null;
  return {
    id: u.id,
    email: (u as { email: string }).email,
    displayName: (u as { displayName?: string | null }).displayName ?? null,
    imageUrl: (u as { imageUrl?: string | null }).imageUrl ?? null,
    username: (u as { username?: string | null }).username ?? null,
    firstName: (u as { firstName?: string | null }).firstName ?? null,
    lastName: (u as { lastName?: string | null }).lastName ?? null,
    phone: (u as { phone?: string | null }).phone ?? null,
    emailVerified,
    phoneVerified,
    locale: (u as { locale?: string | null }).locale ?? null,
    timezone: (u as { timezone?: string | null }).timezone ?? null,
    role: (u as { globalRole?: string | null }).globalRole ?? null,
    scopesCount: m.scopesCount,
    adminScopesCount: m.adminScopesCount,
    apiKeysCreatedCount: keysCount,
    lastActivityAt,
    sessionsRevokedAt,
  } as const;
}
