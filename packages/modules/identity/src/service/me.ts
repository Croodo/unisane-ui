import { usersRepository, membershipsRepository } from '../data/repo';
import type { MeSummary } from '../domain/types';
import { getTenantsRepo } from '../providers';
import type { Permission } from '@unisane/kernel';
import { updateUser } from './users';

import type { GetMeSummaryArgs } from "../domain/types";
export type { GetMeSummaryArgs };

export async function getMeSummary(args: GetMeSummaryArgs): Promise<MeSummary> {
  const { userId, perms, isSuperAdmin } = args;
  if (!userId) {
    return {
      userId: null,
      scopeId: null,
      role: null,
      plan: null,
      perms: perms ?? [],
      ...(isSuperAdmin ? { isSuperAdmin } : {}),
    };
  }
  const latest = await membershipsRepository.findLatestForUser(userId);
  if (!latest) {
    // Fetch minimal user profile for account menu display
    const u = await usersRepository.findById(userId);
    return {
      userId,
      scopeId: null,
      role: null,
      plan: null,
      displayName: (u?.displayName as string | undefined) ?? null,
      email: (u?.email as string | undefined) ?? null,
      globalRole: u?.globalRole ?? null,
      perms: perms ?? [],
      ...(isSuperAdmin ? { isSuperAdmin } : {}),
    };
  }
  const tenantsRepo = getTenantsRepo();
  const t = await tenantsRepo.findById(latest.scopeId);
  const plan = (t?.planId as string | undefined) ?? 'free';
  const role = Array.isArray(latest.roles) && latest.roles.length
    ? String((latest.roles[0] as { roleId?: string }).roleId ?? 'member')
    : 'member';
  // Fetch minimal user profile for account menu display
  const u = await usersRepository.findById(userId);
  return {
    userId,
    scopeId: t?.id ?? latest.scopeId,
    tenantSlug: (t?.slug as string | undefined) ?? null,
    tenantName: (t?.name as string | undefined) ?? null,
    role,
    plan,
    displayName: (u?.displayName as string | undefined) ?? null,
    email: (u?.email as string | undefined) ?? null,
    globalRole: u?.globalRole ?? null,
    perms: perms ?? [],
    ...(isSuperAdmin ? { isSuperAdmin } : {}),
  };
}

import type { GetMyProfileArgs } from "../domain/types";
export type { GetMyProfileArgs };

export async function getMyProfile(args: GetMyProfileArgs) {
  const { userId } = args;
  const u = await usersRepository.findById(userId);
  if (!u) return null;
  return {
    id: u.id,
    email: (u.email as string) ?? '',
    displayName: (u.displayName as string | null) ?? null,
    imageUrl: (u.imageUrl as string | null) ?? null,
    username: (u as { username?: string | null }).username ?? null,
    firstName: (u as { firstName?: string | null }).firstName ?? null,
    lastName: (u as { lastName?: string | null }).lastName ?? null,
    phone: (u as { phone?: string | null }).phone ?? null,
    emailVerified: (u as { emailVerified?: boolean | null }).emailVerified ?? null,
    phoneVerified: (u as { phoneVerified?: boolean | null }).phoneVerified ?? null,
    locale: (u as { locale?: string | null }).locale ?? null,
    timezone: (u as { timezone?: string | null }).timezone ?? null,
  } as const;
}

import type { UpdateMyProfileArgs } from "../domain/types";
export type { UpdateMyProfileArgs };

export async function updateMyProfile(args: UpdateMyProfileArgs) {
  // Delegate to users.updateUser (normalizes and enforces field set)
  const updated = await updateUser({ userId: args.userId, patch: args.patch });
  return updated;
}
